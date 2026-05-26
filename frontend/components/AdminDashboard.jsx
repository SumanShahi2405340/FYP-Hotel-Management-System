'use client';

import AdminAnnouncementPanel from '@/components/AnnouncementPanel';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaCog,
  FaBullhorn,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaHotel,
  FaBell,
  FaSignOutAlt,
  FaChevronDown,
  FaBuilding,
  FaUserCircle,
  FaDollarSign,
  FaSun,
  FaMoon,
} from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:8000';
const NOTIFICATION_SEEN_KEY = 'cloudinn_admin_last_seen_owner_notification_at';
const NOTIFICATION_SEEN_IDS_KEY = 'cloudinn_admin_seen_owner_announcement_ids';
const NOTIFICATION_SOUND_STATUS_KEY = 'cloudinn_admin_notification_sound_status';
const NOTIFICATION_MUTE_UNTIL_KEY = 'cloudinn_admin_notification_mute_until';
const THEME_KEY = 'cloudinn_admin_dashboard_theme';

export default function AdminDashboard() {
  const router = useRouter();

  const [hotels, setHotels] = useState([]);
  const [view, setView] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activePanel, setActivePanel] = useState('hotels');
  const [revenueData, setRevenueData] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('Dec');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [notificationCount, setNotificationCount] = useState(0);
  const [newNotificationPopup, setNewNotificationPopup] = useState(null);
  const [themeMode, setThemeMode] = useState('dark');

  const notificationAudioRef = useRef(null);
  const previousUnseenCountRef = useRef(0);
  const previousUnseenIdsRef = useRef(new Set());
  const currentNotificationIdsRef = useRef([]);
  const latestNotificationTimeRef = useRef(null);
  const soundUnlockedRef = useRef(false);

  const [stats] = useState({
    totalRevenue: 284500,
    activeBookings: 156,
    avgRating: 4.8,
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    setThemeMode(savedTheme);
    document.documentElement.setAttribute('data-admin-theme', savedTheme);
  }, []);

  const toggleThemeMode = () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    document.documentElement.setAttribute('data-admin-theme', nextTheme);
  };

  const getStoredAccessToken = () => {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('authToken') ||
      localStorage.getItem('access') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token')
    );
  };

  const getStoredRefreshToken = () => {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('refreshToken') ||
      localStorage.getItem('refresh') ||
      localStorage.getItem('refresh_token')
    );
  };

  const saveAccessToken = (token) => {
    if (!token || typeof window === 'undefined') return;
    localStorage.setItem('authToken', token);
    localStorage.setItem('access', token);
  };

  const refreshAccessToken = async () => {
    const refresh = getStoredRefreshToken();
    if (!refresh) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.access) return null;
      saveAccessToken(data.access);
      return data.access;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  };

  const clearInvalidTokens = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');
    localStorage.removeItem('access');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
  };

  const getAuthHeaders = (tokenOverride = null) => {
    const token = tokenOverride || getStoredAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const authFetch = async (url, options = {}) => {
    const makeRequest = (tokenOverride = null) =>
      fetch(url, {
        ...options,
        credentials: options.credentials || 'include',
        headers: { ...getAuthHeaders(tokenOverride), ...(options.headers || {}) },
      });
    let response = await makeRequest();
    if (response.status === 401) {
      const newAccess = await refreshAccessToken();
      if (newAccess) {
        response = await makeRequest(newAccess);
      } else {
        clearInvalidTokens();
      }
    }
    return response;
  };

  const getSeenNotificationIds = () => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(NOTIFICATION_SEEN_IDS_KEY) || '[]');
      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  };

  const saveSeenNotificationIds = (ids) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(NOTIFICATION_SEEN_IDS_KEY, JSON.stringify([...new Set(ids)]));
  };

  const normalizeNotificationResponse = (data) => {
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.results) ? data.results
      : Array.isArray(data?.announcements) ? data.announcements
      : Array.isArray(data?.notifications) ? data.notifications
      : [];
    return items
      .filter((ann) => ann && ann.id !== null && ann.id !== undefined)
      .map((ann) => {
        const id = `owner_to_admin_${ann.id}`;
        const timestamp = ann.timestamp || ann.created_at || ann.createdAt || ann.date || new Date().toISOString();
        return {
          id,
          originalId: ann.id,
          message: ann.content || ann.message || ann.description || 'New owner announcement',
          hotelName: ann.hotel_name || ann.owner_hotel_name || ann.owner_name || ann.hotel || 'Hotel Owner',
          timestamp,
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const isSoundMuted = () => {
    if (typeof window === 'undefined') return false;
    const status = localStorage.getItem(NOTIFICATION_SOUND_STATUS_KEY) || 'Active';
    const muteUntil = Number(localStorage.getItem(NOTIFICATION_MUTE_UNTIL_KEY) || 0);
    if (status === 'Muted until unmuted') return true;
    if (status === 'Muted for 1 hour') {
      if (muteUntil && Date.now() < muteUntil) return true;
      localStorage.setItem(NOTIFICATION_SOUND_STATUS_KEY, 'Active');
      localStorage.removeItem(NOTIFICATION_MUTE_UNTIL_KEY);
    }
    return false;
  };

  const playFallbackBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.12;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      setTimeout(() => { oscillator.stop(); audioContext.close(); }, 250);
    } catch (err) {
      console.log('Fallback beep blocked:', err);
    }
  };

  const playNotificationSound = () => {
    if (isSoundMuted()) return;
    if (notificationAudioRef.current) {
      notificationAudioRef.current.currentTime = 0;
      notificationAudioRef.current.play().catch(() => playFallbackBeep());
    } else {
      playFallbackBeep();
    }
  };

  const unlockSound = () => {
    if (soundUnlockedRef.current) return;
    soundUnlockedRef.current = true;
    if (!notificationAudioRef.current) {
      notificationAudioRef.current = new Audio('/sounds/notification.mp3');
      notificationAudioRef.current.preload = 'auto';
    }
    notificationAudioRef.current.play().then(() => {
      notificationAudioRef.current.pause();
      notificationAudioRef.current.currentTime = 0;
    }).catch(() => {});
  };

  const markNotificationsAsSeen = () => {
    if (typeof window === 'undefined') return;
    const currentIds = currentNotificationIdsRef.current || [];
    saveSeenNotificationIds(currentIds);
    const latestTime = latestNotificationTimeRef.current || new Date().toISOString();
    localStorage.setItem(NOTIFICATION_SEEN_KEY, latestTime);
    setNotificationCount(0);
    previousUnseenCountRef.current = 0;
    previousUnseenIdsRef.current = new Set();
    setNewNotificationPopup(null);
  };

  const fetchDashboardNotifications = async ({ playSoundForNew = true } = {}) => {
    try {
      let response = await authFetch(`${API_BASE_URL}/api/owner-recent-announcements/?recipient=admin`, { method: 'GET' });
      let data = await response.json().catch(() => []);
      if (!response.ok) { setNotificationCount(0); return; }
      let notificationItems = normalizeNotificationResponse(data);
      if (notificationItems.length === 0) {
        const fallbackResponse = await authFetch(`${API_BASE_URL}/api/owner-recent-announcements/`, { method: 'GET' });
        const fallbackData = await fallbackResponse.json().catch(() => []);
        if (fallbackResponse.ok) notificationItems = normalizeNotificationResponse(fallbackData);
      }
      currentNotificationIdsRef.current = notificationItems.map((item) => item.id);
      if (notificationItems.length > 0) {
        latestNotificationTimeRef.current = new Date(notificationItems[0].timestamp).toISOString();
      }
      const seenIds = getSeenNotificationIds();
      const unseenItems = notificationItems.filter((item) => !seenIds.has(item.id));
      const unseenIds = new Set(unseenItems.map((item) => item.id));
      const oldUnseenIds = previousUnseenIdsRef.current || new Set();
      const hasNewId = [...unseenIds].some((id) => !oldUnseenIds.has(id));
      const newUnseenCount = unseenItems.length;
      setNotificationCount(newUnseenCount);
      if (playSoundForNew && newUnseenCount > 0 && hasNewId) {
        playNotificationSound();
        setNewNotificationPopup(unseenItems[0]);
        setTimeout(() => setNewNotificationPopup(null), 5000);
      }
      previousUnseenCountRef.current = newUnseenCount;
      previousUnseenIdsRef.current = unseenIds;
    } catch (error) {
      console.error('Dashboard notification fetch error:', error);
    }
  };

  const fetchHotels = (status = 'all') => {
    setIsLoading(true);
    const url = status === 'all'
      ? `${API_BASE_URL}/api/hotels`
      : `${API_BASE_URL}/api/hotels?status=${status === 'active' ? 'Active' : 'Inactive'}`;
    authFetch(url, { method: 'GET' })
      .then((res) => { if (!res.ok) throw new Error(`HTTP error ${res.status}`); return res.json(); })
      .then((data) => setHotels(Array.isArray(data) ? data : []))
      .catch((error) => { console.error('Error fetching hotels:', error); setHotels([]); })
      .finally(() => setIsLoading(false));
  };

  const fetchRevenueData = async (month, year) => {
    setRevenueLoading(true);
    try {
      const monthNumber = new Date(`${month} 1, ${year}`).getMonth() + 1;
      const paddedMonth = monthNumber.toString().padStart(2, '0');
      const res = await fetch(`${API_BASE_URL}/api/commission-revenue/?month=${paddedMonth}&year=${year}`, { credentials: 'include' });
      const data = await res.json();
      setRevenueData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching commission revenue:', err);
      setRevenueData([]);
    } finally {
      setRevenueLoading(false);
    }
  };

  useEffect(() => { fetchHotels('all'); }, []);

  useEffect(() => {
    notificationAudioRef.current = new Audio('/sounds/notification.mp3');
    notificationAudioRef.current.preload = 'auto';
    const handleFirstUserClick = () => unlockSound();
    window.addEventListener('click', handleFirstUserClick, { once: true });
    window.addEventListener('keydown', handleFirstUserClick, { once: true });
    fetchDashboardNotifications({ playSoundForNew: false });
    const interval = setInterval(() => fetchDashboardNotifications({ playSoundForNew: true }), 3000);
    const handleFocus = () => fetchDashboardNotifications({ playSoundForNew: true });
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('click', handleFirstUserClick);
      window.removeEventListener('keydown', handleFirstUserClick);
    };
  }, []);

  useEffect(() => {
    if (activePanel === 'commission') fetchRevenueData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, activePanel]);

  const totalHotels = hotels.length;
  const activeHotels = hotels.filter((h) => h.status === 'Active').length;
  const inactiveHotels = hotels.filter((h) => h.status === 'Inactive').length;

  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/admin-logout/`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    router.push('/admin/login');
  };

  const handleManageHotels = () => {
    if (activePanel === 'hotels') setActivePanel(null);
    else { setActivePanel('hotels'); fetchHotels(view === 'all' ? 'all' : view); }
  };

  const handleToggleStatus = async (id) => {
    const hotel = hotels.find((h) => h.id === id);
    if (!hotel) return;
    const newStatus = hotel.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotels/${id}/update/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) { setHotels((prev) => prev.map((h) => (h.id === id ? { ...h, status: newStatus } : h))); fetchHotels(view); }
    } catch (error) { console.error(error); }
  };

  const handleRemove = async (id) => {
    if (!hotels.some((h) => Number(h.id) === Number(id))) return;
    if (confirm('Are you sure you want to remove this hotel?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/hotels/${id}/`, { method: 'DELETE', credentials: 'include' });
        if (response.ok) { setHotels((prev) => prev.filter((h) => Number(h.id) !== Number(id))); fetchHotels(view); }
      } catch (error) { console.error(error); }
    }
  };

  const handleBellClick = () => {
    unlockSound();
    markNotificationsAsSeen();
    router.push('/admin/notification-setting?sidebar=true');
  };

  const menuItems = [
    { id: 'announcement', label: 'Announcements', icon: FaBullhorn, color: 'from-purple-500 to-pink-500' },
    { id: 'hotels', label: 'Manage Hotels', icon: FaHotel, color: 'from-blue-500 to-cyan-500' },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }

        /* ── DARK THEME VARIABLES ── */
        :root,
        :root[data-admin-theme='dark'] {
          --page-bg: linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%);
          --sidebar-bg: linear-gradient(180deg, rgba(17,24,39,0.97), rgba(31,41,55,0.97), rgba(17,24,39,0.97));
          --topbar-bg: rgba(17, 24, 39, 0.95);
          --topbar-border: rgba(255,255,255,0.10);

          --card-bg: rgba(255, 255, 255, 0.05);
          --card-bg-hover: rgba(255, 255, 255, 0.08);
          --card-border: rgba(255, 255, 255, 0.10);

          --text-primary: #ffffff;
          --text-secondary: #d1d5db;
          --text-muted: #9ca3af;
          --text-faint: #6b7280;

          --sidebar-border: rgba(255,255,255,0.10);
          --sidebar-btn-bg: rgba(255,255,255,0.05);
          --sidebar-btn-hover: rgba(255,255,255,0.10);
          --sidebar-btn-active-bg: rgba(59,130,246,0.20);
          --sidebar-btn-active-border: rgba(59,130,246,0.40);
          --sidebar-btn-active-text: #bfdbfe;

          --input-bg: rgba(255,255,255,0.05);
          --input-border: rgba(255,255,255,0.10);
          --input-text: #ffffff;
          --input-placeholder: #6b7280;

          --tab-active-bg: #8b5cf6;
          --tab-inactive-bg: rgba(255,255,255,0.05);
          --tab-inactive-text: #9ca3af;
          --tab-count-bg: rgba(255,255,255,0.15);

          --table-head-bg: rgba(255,255,255,0.05);
          --table-row-border: rgba(255,255,255,0.05);
          --table-row-hover: rgba(255,255,255,0.04);

          --badge-active-bg: rgba(34,197,94,0.20);
          --badge-active-text: #4ade80;
          --badge-inactive-bg: rgba(239,68,68,0.20);
          --badge-inactive-text: #f87171;

          --action-deactivate-bg: rgba(239,68,68,0.18);
          --action-deactivate-text: #f87171;
          --action-deactivate-hover: rgba(239,68,68,0.28);
          --action-activate-bg: rgba(34,197,94,0.18);
          --action-activate-text: #4ade80;
          --action-activate-hover: rgba(34,197,94,0.28);
          --action-remove-bg: rgba(239,68,68,0.18);
          --action-remove-text: #f87171;
          --action-remove-hover: rgba(239,68,68,0.28);

          --btn-bg: rgba(255,255,255,0.10);
          --btn-hover: rgba(255,255,255,0.18);
          --btn-text: #ffffff;

          --logout-bg: rgba(239,68,68,0.15);
          --logout-border: rgba(239,68,68,0.30);
          --logout-hover-bg: rgba(239,68,68,0.25);
          --logout-text: #f87171;

          --settings-sub-text: #9ca3af;
          --settings-sub-hover: #ffffff;

          --heading-gradient: linear-gradient(to right, #ffffff, #9ca3af);
          --heading-clip: text;
          --heading-color: transparent;

          --stat-change-bg: rgba(34,197,94,0.15);
          --stat-change-text: #4ade80;

          --modal-bg: linear-gradient(to bottom, #1f2937, #111827);
          --modal-border: rgba(255,255,255,0.10);
          --modal-text: #ffffff;
          --modal-sub: #9ca3af;

          --theme-btn-bg: rgba(255,255,255,0.10);
          --theme-btn-hover: rgba(255,255,255,0.18);
        }

        /* ── LIGHT THEME VARIABLES ── */
        :root[data-admin-theme='light'] {
          --page-bg: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f4f0ff 100%);
          --sidebar-bg: linear-gradient(180deg, #ffffff, #f8fafc, #ffffff);
          --topbar-bg: rgba(255, 255, 255, 0.97);
          --topbar-border: #e2e8f0;

          --card-bg: #ffffff;
          --card-bg-hover: #f8fafc;
          --card-border: #e2e8f0;

          --text-primary: #0f172a;
          --text-secondary: #334155;
          --text-muted: #64748b;
          --text-faint: #94a3b8;

          --sidebar-border: #e2e8f0;
          --sidebar-btn-bg: #f8fafc;
          --sidebar-btn-hover: #f1f5f9;
          --sidebar-btn-active-bg: #eff6ff;
          --sidebar-btn-active-border: #bfdbfe;
          --sidebar-btn-active-text: #1d4ed8;

          --input-bg: #ffffff;
          --input-border: #cbd5e1;
          --input-text: #0f172a;
          --input-placeholder: #94a3b8;

          --tab-active-bg: #7c3aed;
          --tab-inactive-bg: #ffffff;
          --tab-inactive-text: #64748b;
          --tab-count-bg: rgba(0,0,0,0.08);

          --table-head-bg: #f8fafc;
          --table-row-border: #f1f5f9;
          --table-row-hover: #f5f3ff;

          --badge-active-bg: #f0fdf4;
          --badge-active-text: #15803d;
          --badge-inactive-bg: #fef2f2;
          --badge-inactive-text: #dc2626;

          --action-deactivate-bg: #fef2f2;
          --action-deactivate-text: #dc2626;
          --action-deactivate-hover: #fee2e2;
          --action-activate-bg: #f0fdf4;
          --action-activate-text: #15803d;
          --action-activate-hover: #dcfce7;
          --action-remove-bg: #fef2f2;
          --action-remove-text: #dc2626;
          --action-remove-hover: #fee2e2;

          --btn-bg: #f1f5f9;
          --btn-hover: #e2e8f0;
          --btn-text: #0f172a;

          --logout-bg: #fef2f2;
          --logout-border: #fecaca;
          --logout-hover-bg: #fee2e2;
          --logout-text: #dc2626;

          --settings-sub-text: #64748b;
          --settings-sub-hover: #0f172a;

          --heading-gradient: none;
          --heading-clip: unset;
          --heading-color: #0f172a;

          --stat-change-bg: #f0fdf4;
          --stat-change-text: #15803d;

          --modal-bg: linear-gradient(to bottom, #ffffff, #f8fafc);
          --modal-border: #e2e8f0;
          --modal-text: #0f172a;
          --modal-sub: #64748b;

          --theme-btn-bg: #f1f5f9;
          --theme-btn-hover: #e2e8f0;
        }

        body { font-family: 'Inter', sans-serif; }

        .admin-page-bg       { background: var(--page-bg) !important; }
        .admin-sidebar-bg    { background: var(--sidebar-bg) !important; border-right-color: var(--sidebar-border) !important; }
        .admin-topbar-bg     { background: var(--topbar-bg) !important; border-bottom-color: var(--topbar-border) !important; }

        .admin-card          { background: var(--card-bg) !important; border-color: var(--card-border) !important; }
        .admin-card:hover    { background: var(--card-bg-hover) !important; }

        .admin-text-primary  { color: var(--text-primary) !important; }
        .admin-text-secondary{ color: var(--text-secondary) !important; }
        .admin-text-muted    { color: var(--text-muted) !important; }
        .admin-text-faint    { color: var(--text-faint) !important; }

        .admin-heading {
          background: var(--heading-gradient) !important;
          -webkit-background-clip: var(--heading-clip) !important;
          background-clip: var(--heading-clip) !important;
          -webkit-text-fill-color: var(--heading-color) !important;
          color: var(--heading-color) !important;
        }

        .admin-sidebar-btn {
          background: var(--sidebar-btn-bg) !important;
          border-color: transparent !important;
          color: var(--text-secondary) !important;
        }
        .admin-sidebar-btn:hover {
          background: var(--sidebar-btn-hover) !important;
          color: var(--text-primary) !important;
        }
        .admin-sidebar-btn.active {
          background: var(--sidebar-btn-active-bg) !important;
          border-color: var(--sidebar-btn-active-border) !important;
          color: var(--sidebar-btn-active-text) !important;
        }

        .admin-settings-sub {
          color: var(--settings-sub-text) !important;
        }
        .admin-settings-sub:hover {
          color: var(--settings-sub-hover) !important;
          background: var(--sidebar-btn-hover) !important;
        }

        .admin-logout-btn {
          background: var(--logout-bg) !important;
          border-color: var(--logout-border) !important;
          color: var(--logout-text) !important;
        }
        .admin-logout-btn:hover {
          background: var(--logout-hover-bg) !important;
        }

        .admin-btn {
          background: var(--btn-bg) !important;
          color: var(--btn-text) !important;
        }
        .admin-btn:hover {
          background: var(--btn-hover) !important;
        }

        .admin-theme-btn {
          background: var(--theme-btn-bg) !important;
        }
        .admin-theme-btn:hover {
          background: var(--theme-btn-hover) !important;
        }

        .admin-input {
          background: var(--input-bg) !important;
          border-color: var(--input-border) !important;
          color: var(--input-text) !important;
        }
        .admin-input::placeholder { color: var(--input-placeholder) !important; }
        .admin-input:focus { border-color: #8b5cf6 !important; }

        .admin-table-head { background: var(--table-head-bg) !important; border-color: var(--card-border) !important; }
        .admin-table-th   { color: var(--text-muted) !important; }
        .admin-table-row  { border-bottom-color: var(--table-row-border) !important; }
        .admin-table-row:hover { background: var(--table-row-hover) !important; }
        .admin-table-id   { color: var(--text-muted) !important; }
        .admin-table-cell { color: var(--text-secondary) !important; }
        .admin-table-email{ color: var(--text-muted) !important; }

        .admin-badge-active   { background: var(--badge-active-bg) !important; color: var(--badge-active-text) !important; }
        .admin-badge-inactive { background: var(--badge-inactive-bg) !important; color: var(--badge-inactive-text) !important; }

        .admin-action-deactivate {
          background: var(--action-deactivate-bg) !important;
          color: var(--action-deactivate-text) !important;
        }
        .admin-action-deactivate:hover { background: var(--action-deactivate-hover) !important; }
        .admin-action-activate {
          background: var(--action-activate-bg) !important;
          color: var(--action-activate-text) !important;
        }
        .admin-action-activate:hover { background: var(--action-activate-hover) !important; }
        .admin-action-remove {
          background: var(--action-remove-bg) !important;
          color: var(--action-remove-text) !important;
        }
        .admin-action-remove:hover { background: var(--action-remove-hover) !important; }

        .admin-tab-active {
          background: var(--tab-active-bg) !important;
          color: #ffffff !important;
        }
        .admin-tab-inactive {
          background: var(--tab-inactive-bg) !important;
          color: var(--tab-inactive-text) !important;
          border: 1px solid var(--card-border);
        }
        .admin-tab-inactive:hover {
          background: var(--card-bg-hover) !important;
          color: var(--text-primary) !important;
        }
        .admin-tab-count {
          background: var(--tab-count-bg) !important;
        }

        .admin-stat-change {
          background: var(--stat-change-bg) !important;
          color: var(--stat-change-text) !important;
        }

        .admin-modal-bg {
          background: var(--modal-bg) !important;
          border-color: var(--modal-border) !important;
        }
        .admin-modal-text { color: var(--modal-text) !important; }
        .admin-modal-sub  { color: var(--modal-sub) !important; }

        @keyframes fadeInUp  { from { opacity:0; transform:translateY(20px);  } to { opacity:1; transform:translateY(0);  } }
        @keyframes slideIn   { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0);  } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0);  } }
        .animate-fadeInUp  { animation: fadeInUp  0.5s ease forwards; }
        .animate-slideIn   { animation: slideIn   0.3s ease forwards; }
        .animate-slideDown { animation: slideDown 0.35s ease forwards; }
        .hover-scale { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-scale:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15); }
      `}</style>

      <div className="min-h-screen flex admin-page-bg">

        {/* ── Notification popup (always dark to stand out) ── */}
        {newNotificationPopup && (
          <div className="fixed top-6 right-6 z-[9999] w-80 rounded-2xl bg-gray-900/95 border border-purple-500/40 shadow-2xl p-4 animate-slideDown">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <FaBell className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">New owner announcement</p>
                <p className="text-purple-300 text-xs mt-1">From: {newNotificationPopup.hotelName}</p>
                <p className="text-gray-300 text-sm mt-2 line-clamp-2">{newNotificationPopup.message}</p>
              </div>
              <button onClick={() => setNewNotificationPopup(null)} className="text-gray-400 hover:text-white text-lg leading-none">×</button>
            </div>
          </div>
        )}

        {/* ── SIDEBAR ── */}
        <div className={`fixed top-0 left-0 h-screen w-80 admin-sidebar-bg backdrop-blur-xl flex flex-col z-20 transform transition-all duration-300 shadow-2xl border-r ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

          {/* Profile */}
          <div className="relative px-6 py-8" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
            <div className="flex flex-col items-center">
              <button type="button" onClick={() => router.push('/admin/profile')} className="relative group cursor-pointer focus:outline-none" title="Open Admin Profile">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)' }}>
                    <img src="/admindash1.jpg" alt="Admin Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 border-2 border-gray-900">
                  <FaUserCircle className="text-white text-xs" />
                </div>
              </button>
              <div className="mt-4 text-center">
                <h3 className="font-bold text-lg admin-text-primary">Administrator</h3>
                <p className="text-sm admin-text-faint mt-1">System Admin</p>
              </div>
            </div>
          </div>

          {/* Brand */}
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
            <div className="flex items-center justify-center gap-2">
              <FaHotel className="text-3xl text-purple-400" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">CloudInn</h2>
            </div>
            <p className="text-xs text-center admin-text-faint mt-1">Admin Portal</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = item.id === 'hotels' && activePanel === 'hotels';
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'announcement') setAnnouncementOpen(true);
                    else if (item.id === 'hotels') handleManageHotels();
                  }}
                  className={`group relative w-full px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 overflow-hidden border admin-sidebar-btn ${isActive ? 'active' : ''}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-200`} />
                  <item.icon className={`text-lg transition-transform group-hover:scale-110 ${isActive ? 'text-blue-500' : 'text-purple-400'}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--sidebar-btn-active-bg)', color: 'var(--sidebar-btn-active-text)' }}>
                      Open
                    </span>
                  )}
                </button>
              );
            })}

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-full px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between gap-3 admin-sidebar-btn border"
              >
                <div className="flex items-center gap-3">
                  <FaCog className="text-lg text-purple-400" />
                  <span className="text-sm font-medium">Settings</span>
                </div>
                <FaChevronDown className={`text-xs admin-text-faint transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
              </button>

              {settingsOpen && (
                <div className="ml-8 mt-2 space-y-1 animate-slideIn">
                  <button onClick={() => router.push('/admin/commission-setting')} className="w-full text-left px-4 py-2 text-sm rounded-lg transition admin-settings-sub">
                    Commission Setting
                  </button>
                  <button onClick={() => router.push('/admin/notification-setting?sidebar=true')} className="w-full text-left px-4 py-2 text-sm rounded-lg transition admin-settings-sub">
                    Notifications &amp; Settings
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-6" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-3 rounded-xl border font-medium transition-all duration-200 flex items-center justify-center gap-2 group admin-logout-btn"
            >
              <FaSignOutAlt className="group-hover:translate-x-1 transition-transform" /> Logout
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'} min-h-screen`}>

          {/* Topbar */}
          <div className="sticky top-0 z-10 admin-topbar-bg backdrop-blur-xl border-b px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 admin-btn"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {sidebarOpen ? 'Hide Menu' : 'Show Menu'}
              </button>

              <div className="flex items-center gap-4">
                {/* Theme toggle */}
                <button
                  onClick={toggleThemeMode}
                  className="relative p-2 rounded-full transition-all duration-200 group admin-theme-btn"
                  title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {themeMode === 'dark' ? (
                    <FaSun className="text-xl text-yellow-400 group-hover:scale-110 transition-transform" />
                  ) : (
                    <FaMoon className="text-xl text-purple-500 group-hover:scale-110 transition-transform" />
                  )}
                </button>

                {/* Bell */}
                <button
                  onClick={handleBellClick}
                  className="relative p-2 rounded-full transition-all duration-200 group admin-theme-btn"
                  title="Notifications"
                >
                  <FaBell className="text-xl text-purple-400 group-hover:scale-110 transition-transform" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-pulse border border-white shadow-lg">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Page body */}
          <div className="p-8">

            {/* Welcome heading */}
            <div className="mb-8 animate-fadeInUp">
              <h1 className="text-3xl font-bold admin-heading">Welcome back, Administrator!</h1>
              <p className="admin-text-muted mt-2">Here's an overview of your platform's performance.</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Hotels',            value: totalHotels,        icon: FaHotel,       color: 'from-blue-500 to-cyan-500',   change: '+12%', prefix: ''  },
                { label: 'Active Hotels',            value: activeHotels,       icon: FaCheckCircle, color: 'from-green-500 to-emerald-500',change: '+5',   prefix: ''  },
                { label: 'Inactive Hotels',          value: inactiveHotels,     icon: FaTimesCircle, color: 'from-orange-500 to-red-500',  change: '-3',   prefix: ''  },
                { label: 'Total Commission Revenue', value: stats.totalRevenue, icon: FaDollarSign,  color: 'from-purple-500 to-pink-500', change: '+18%', prefix: '$' },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-2xl border p-6 hover-scale animate-fadeInUp admin-card"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                        <stat.icon className="text-2xl text-white" />
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full admin-stat-change">{stat.change}</span>
                    </div>
                    <h3 className="text-2xl font-bold admin-text-primary">
                      {stat.prefix}{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </h3>
                    <p className="text-sm admin-text-muted mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Hotels table section */}
            <div className="mb-8 animate-slideDown">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold admin-text-primary flex items-center gap-2">
                  <FaBuilding className="text-purple-400" /> Registered Hotels
                </h2>
              </div>

              {/* Tabs + Search */}
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex gap-2">
                  {[
                    { label: 'All Hotels', value: 'all',      count: totalHotels    },
                    { label: 'Active',     value: 'active',   count: activeHotels   },
                    { label: 'Inactive',   value: 'inactive', count: inactiveHotels },
                  ].map((btn) => (
                    <button
                      key={btn.value}
                      onClick={() => { setView(btn.value); fetchHotels(btn.value); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${view === btn.value ? 'admin-tab-active' : 'admin-tab-inactive'}`}
                    >
                      {btn.label}
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs admin-tab-count">{btn.count}</span>
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 admin-text-faint text-sm" />
                  <input
                    type="text"
                    placeholder="Search hotels..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg border focus:outline-none transition-colors w-80 admin-input"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl border overflow-hidden admin-card">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b admin-table-head">
                      <tr>
                        {['ID', 'Hotel Name', 'Owner', 'Email', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="text-left px-6 py-4 text-xs font-medium uppercase tracking-wider admin-table-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan="6" className="text-center py-12">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                            </div>
                          </td>
                        </tr>
                      ) : filteredHotels.length > 0 ? (
                        filteredHotels.map((hotel) => (
                          <tr key={hotel.id} className="admin-table-row transition-colors">
                            <td className="px-6 py-4 text-sm admin-table-id">{hotel.id}</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => router.push(`/admin/hotel-profile/${hotel.id}`)}
                                className="font-medium transition-colors hover:text-purple-500 admin-text-primary"
                              >
                                {hotel.name}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-sm admin-table-cell">{hotel.owner || '—'}</td>
                            <td className="px-6 py-4 text-sm admin-table-email">{hotel.email || '—'}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${hotel.status === 'Active' ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                                {hotel.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleToggleStatus(hotel.id)}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${hotel.status === 'Active' ? 'admin-action-deactivate' : 'admin-action-activate'}`}
                                >
                                  {hotel.status === 'Active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleRemove(hotel.id)}
                                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 admin-action-remove"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-12">
                            <div className="flex flex-col items-center gap-2">
                              <FaHotel className="text-4xl admin-text-faint" />
                              <p className="admin-text-muted">No hotels found</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdminAnnouncementPanel isOpen={announcementOpen} onClose={() => setAnnouncementOpen(false)} />

      {/* Logout modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeInUp">
          <div className="rounded-2xl p-8 w-96 text-center border shadow-2xl admin-modal-bg">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/15 flex items-center justify-center">
              <FaSignOutAlt className="text-3xl" style={{ color: 'var(--logout-text)' }} />
            </div>
            <h2 className="text-xl font-semibold mb-2 admin-modal-text">Ready to leave?</h2>
            <p className="mb-6 admin-modal-sub">Are you sure you want to logout?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-6 py-2 rounded-lg transition-all duration-200 font-medium admin-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}