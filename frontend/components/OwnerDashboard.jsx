'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FaCog,
  FaBullhorn,
  FaBed,
  FaUsers,
  FaWrench,
  FaChartLine,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaCreditCard,
  FaUserCircle,
  FaBell,
  FaSignOutAlt,
  FaChevronDown,
  FaHotel,
  FaBuilding,
  FaTachometerAlt,
  FaClipboardList,
  FaUserPlus,
  FaListUl,
  FaStar,
  FaUserFriends,
  FaBookOpen,
  FaTimes,
  FaSpinner,
  FaEnvelope,
  FaCommentDots,
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import api from '../utils/api';

import OwnerAnnouncementPanel from '@/components/OwnerAnnouncementPanel';
import EarningReports from '@/components/EarningReports';

const API_BASE_URL = 'http://localhost:8000';

const OWNER_SEEN_ADMIN_IDS_KEY = 'cloudinn_owner_seen_admin_announcement_ids';
const OWNER_SOUND_STATUS_KEY = 'owner_notification_sound_status';
const OWNER_MUTE_UNTIL_KEY = 'owner_notification_mute_until';


const OwnerGuestReviewsPanel = ({ hotelId, hotelName }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('authToken') ||
      localStorage.getItem('access') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token')
    );
  };

  const normaliseReviews = (payload) => {
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload?.reviews)
      ? payload.reviews
      : Array.isArray(payload?.data)
      ? payload.data
      : [];

    return items.map((item) => ({
      id: item.id ?? item.review_id ?? `${item.email || 'guest'}-${item.created_at || Date.now()}`,
      guestName: item.guest_name || item.name || item.full_name || item.guest || 'Guest',
      email: item.email || item.guest_email || '',
      rating: Math.max(1, Math.min(5, Number(item.rating || item.stars || item.star || 5))),
      review: item.review || item.comment || item.feedback || item.message || '',
      createdAt: item.created_at || item.createdAt || item.date || item.timestamp || null,
    }));
  };

  const fetchGuestReviews = useCallback(async () => {
    if (!hotelId) return;

    setLoading(true);
    setError('');

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/hotels/${hotelId}/guest-reviews/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.detail || 'Failed to load guest reviews.');
      }

      const data = await response.json();
      setReviews(normaliseReviews(data));
    } catch (err) {
      console.error('Guest reviews fetch error:', err);
      setError(err.message || 'Failed to load guest reviews.');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchGuestReviews();
  }, [fetchGuestReviews]);

  const averageRating = reviews.length
    ? (reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const formatDate = (value) => {
    if (!value) return 'Recently';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recently';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaCommentDots className="text-yellow-400" /> Reviews & Feedback
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Guest reviews submitted for {hotelName || 'your hotel'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 flex items-center gap-2">
            <FaStar />
            <span className="font-bold">{averageRating}</span>
            <span className="text-xs text-yellow-200/80">average</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-sm font-semibold">
            {reviews.length} review{reviews.length === 1 ? '' : 's'}
          </div>
          <button
            onClick={fetchGuestReviews}
            disabled={loading || !hotelId}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaStar />}
            Refresh
          </button>
        </div>
      </div>

      {!hotelId && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-amber-200 text-sm">
          Hotel information is loading. Reviews will appear after the owner hotel ID is available.
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-300 gap-3">
          <FaSpinner className="animate-spin text-purple-400" /> Loading guest reviews...
        </div>
      )}

      {!loading && !error && hotelId && reviews.length === 0 && (
        <div className="text-center py-12 rounded-xl bg-white/5 border border-white/10">
          <FaStar className="text-4xl text-gray-500 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-1">No guest reviews yet</h3>
          <p className="text-gray-400 text-sm">When guests submit reviews from the hotel page, they will appear here.</p>
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reviews.map((item) => (
            <div key={item.id} className="rounded-2xl bg-gray-900/50 border border-white/10 p-5 hover:bg-white/10 transition-all duration-200">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <FaUserCircle className="text-white text-xl" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold truncate">{item.guestName}</h3>
                    {item.email && (
                      <p className="text-gray-500 text-xs truncate flex items-center gap-1">
                        <FaEnvelope className="text-[10px]" /> {item.email}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(item.createdAt)}</span>
              </div>

              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar key={star} className={`text-sm ${star <= item.rating ? 'text-yellow-400' : 'text-gray-600'}`} />
                ))}
                <span className="ml-2 text-xs text-gray-400">{item.rating}/5</span>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {item.review || 'No written feedback provided.'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const OwnerDashboard = () => {
  const [activePanel, setActivePanel] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [staffMenuOpen, setStaffMenuOpen] = useState(false);
  const [bookingsMenuOpen, setBookingsMenuOpen] = useState(false);
  const [paymentsMenuOpen, setPaymentsMenuOpen] = useState(false);
  const [hotel, setHotel] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAnnouncementPanel, setShowAnnouncementPanel] = useState(false);

  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const [newAdminPopup, setNewAdminPopup] = useState(null);

  const [stats, setStats] = useState({
    totalRooms: 0,
    todayBookings: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
  });

  const router = useRouter();

  const audioRef = useRef(null);
  const previousUnreadRef = useRef(0);
  const firstCheckRef = useRef(true);
  const soundUnlockedRef = useRef(false);

  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('authToken') ||
      localStorage.getItem('access') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token')
    );
  };

  const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const getSeenIds = () => {
    try {
      return JSON.parse(localStorage.getItem(OWNER_SEEN_ADMIN_IDS_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const saveSeenIds = (ids) => {
    localStorage.setItem(OWNER_SEEN_ADMIN_IDS_KEY, JSON.stringify(ids));
  };

  const isSoundActive = () => {
    if (typeof window === 'undefined') return false;

    const status = localStorage.getItem(OWNER_SOUND_STATUS_KEY) || 'Active';
    const muteUntil = Number(localStorage.getItem(OWNER_MUTE_UNTIL_KEY) || 0);

    if (status === 'Muted until unmuted') return false;

    if (status === 'Muted for 1 hour') {
      if (muteUntil && Date.now() < muteUntil) return false;
      localStorage.setItem(OWNER_SOUND_STATUS_KEY, 'Active');
      localStorage.removeItem(OWNER_MUTE_UNTIL_KEY);
    }

    return true;
  };

  const playFallbackBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.setValueAtTime(650, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.36);
    } catch (err) {
      console.warn('Notification sound blocked until first user interaction.', err);
    }
  };

  const playNotificationSound = () => {
    if (!isSoundActive()) return;

    if (!audioRef.current) {
      playFallbackBeep();
      return;
    }

    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => playFallbackBeep());
  };

  const unlockSound = () => {
    if (soundUnlockedRef.current) return;
    soundUnlockedRef.current = true;

    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.preload = 'auto';
    }

    audioRef.current
      .play()
      .then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      })
      .catch(() => {});
  };

  const normaliseAdminAnnouncements = (data) => {
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.announcements)
      ? data.announcements
      : Array.isArray(data?.notifications)
      ? data.notifications
      : [];

    return items
      .map((ann) => {
        const rawId = ann.id ?? ann.announcement_id ?? ann.pk;
        const id = `admin_to_owner_${rawId}`;
        const timestamp =
          ann.timestamp ||
          ann.created_at ||
          ann.createdAt ||
          ann.date ||
          new Date().toISOString();

        return {
          id,
          rawId,
          title: ann.title || 'Admin Announcement',
          message:
            ann.content ||
            ann.message ||
            ann.description ||
            'You have a new announcement from admin.',
          timestamp,
        };
      })
      .filter((item) => item.rawId !== undefined && item.rawId !== null);
  };

  const fetchAdminAnnouncementsForBell = useCallback(
    async ({ playSound = true } = {}) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/recent-announcements/`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error('Owner notification fetch failed:', response.status, errData);
          return;
        }

        const data = await response.json().catch(() => []);
        const items = normaliseAdminAnnouncements(data);
        const seenIds = getSeenIds();

        const unreadItems = items.filter((item) => !seenIds.includes(item.id));
        const unreadCount = unreadItems.length;

        setUnreadAdminCount(unreadCount);

        if (unreadCount > 0 && unreadCount > previousUnreadRef.current) {
          const latestUnread = [...unreadItems].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          )[0];

          if (!firstCheckRef.current && playSound) {
            playNotificationSound();
          }

          if (!firstCheckRef.current) {
            setNewAdminPopup(latestUnread);
            setTimeout(() => setNewAdminPopup(null), 5500);
          }
        }

        previousUnreadRef.current = unreadCount;
        firstCheckRef.current = false;
      } catch (err) {
        console.error('Failed to fetch admin announcements for owner bell:', err);
      }
    },
    []
  );

  const markAdminAnnouncementsAsSeen = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recent-announcements/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json().catch(() => []);
      const items = response.ok ? normaliseAdminAnnouncements(data) : [];
      const ids = items.map((item) => item.id);

      saveSeenIds(ids);
      setUnreadAdminCount(0);
      previousUnreadRef.current = 0;
      setNewAdminPopup(null);

      window.dispatchEvent(new Event('owner-admin-announcements-seen'));
    } catch (err) {
      console.error('Failed to mark owner notifications seen:', err);
      setUnreadAdminCount(0);
      previousUnreadRef.current = 0;
      setNewAdminPopup(null);
    }
  };

  useEffect(() => {
    const fetchHotelInfo = async () => {
      try {
        const res = await api.get('/api/me/');
        setHotel(res.data);
        setStats({
          totalRooms: 24,
          todayBookings: 8,
          monthlyRevenue: 45200,
          occupancyRate: 78,
        });
      } catch (err) {
        console.error('Failed to fetch hotel info', err);
      }
    };

    fetchHotelInfo();
  }, []);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.preload = 'auto';

    const unlock = () => unlockSound();

    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);

    fetchAdminAnnouncementsForBell({ playSound: false });

    const intervalId = setInterval(() => {
      fetchAdminAnnouncementsForBell({ playSound: true });
    }, 3000);

    const focusHandler = () => fetchAdminAnnouncementsForBell({ playSound: true });
    const seenHandler = () => {
      setUnreadAdminCount(0);
      previousUnreadRef.current = 0;
      setNewAdminPopup(null);
    };

    window.addEventListener('focus', focusHandler);
    window.addEventListener('owner-admin-announcements-seen', seenHandler);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('focus', focusHandler);
      window.removeEventListener('owner-admin-announcements-seen', seenHandler);
    };
  }, [fetchAdminAnnouncementsForBell]);

  const openNotificationSettings = async () => {
    await markAdminAnnouncementsAsSeen();
    router.push('/owner/owner-notification-setting?sidebar=true');
  };

  const handleLogout = () => router.push('http://localhost:3000/role');

  const quickActions = [
    { id: 'earnings', label: 'Earning Reports', icon: FaChartLine, color: 'from-green-500 to-green-600' },
    { id: 'reviews', label: 'Reviews & Feedback', icon: FaStar, color: 'from-yellow-500 to-yellow-600' },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #111827; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bellShake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(12deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(8deg); }
          80% { transform: rotate(-6deg); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease forwards; }
        .animate-slideDown { animation: slideDown 0.25s ease forwards; }
        .animate-slideIn { animation: slideIn 0.3s ease forwards; }
        .hover-scale { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-scale:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); }
        .bell-shake { animation: bellShake 0.9s ease-in-out infinite; transform-origin: top center; }
      `}</style>

      <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className={`fixed top-0 left-0 h-screen w-80 bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl text-white flex flex-col z-20 transform transition-all duration-300 shadow-2xl border-r border-white/10 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="relative px-6 py-8 border-b border-white/10">
            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer" onClick={() => hotel && router.push(`/owner/hotel-profile/${hotel.hotel_id}`)}>
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-800">
                    <img src="/admindash1.jpg" alt="Hotel" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 border-2 border-gray-900">
                  <FaUserCircle className="text-white text-xs" />
                </div>
              </div>
              {hotel && (
                <div className="mt-4 text-center">
                  <h3 className="font-bold text-lg text-white">{hotel.hotel_name}</h3>
                  <p className="text-sm text-gray-400 mt-1">ID: {hotel.hotel_id}</p>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-center gap-2">
              <FaHotel className="text-3xl text-purple-400" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">CloudInn</h2>
            </div>
            <p className="text-xs text-center text-gray-500 mt-1">Owner Portal</p>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <button onClick={() => setShowAnnouncementPanel(true)} className="group relative w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center gap-3 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
              <FaBullhorn className="text-lg text-purple-400 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Send Announcement</span>
            </button>

            <button onClick={() => router.push('/owner/manage-roomsprice')} className="group relative w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center gap-3 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
              <FaBed className="text-lg text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Manage Rooms</span>
            </button>

            <div>
              <button onClick={() => setStaffMenuOpen(!staffMenuOpen)} className="group relative w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-between gap-3 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                <div className="flex items-center gap-3">
                  <FaUsers className="text-lg text-green-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Manage Staffs</span>
                </div>
                <FaChevronDown className={`text-xs text-gray-500 transition-transform duration-300 ${staffMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {staffMenuOpen && (
                <div className="ml-4 mt-1 space-y-1 animate-slideDown border-l-2 border-green-500/40 pl-3">
                  <button onClick={() => router.push('/owner/add-receptionist')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 group">
                    <FaUserPlus className="text-green-400 text-sm group-hover:scale-110 transition-transform flex-shrink-0" />
                    Add Receptionist
                  </button>
                  <button onClick={() => router.push('/owner/manage-staffnattendance?tab=staff')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 group">
                    <FaListUl className="text-green-400 text-sm group-hover:scale-110 transition-transform flex-shrink-0" />
                    Staffs List
                  </button>
                </div>
              )}
            </div>

            <div>
              <button onClick={() => setBookingsMenuOpen(!bookingsMenuOpen)} className="group relative w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-between gap-3 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                <div className="flex items-center gap-3">
                  <FaBookOpen className="text-lg text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Manage Bookings</span>
                </div>
                <FaChevronDown className={`text-xs text-gray-500 transition-transform duration-300 ${bookingsMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {bookingsMenuOpen && (
                <div className="ml-4 mt-1 space-y-1 animate-slideDown border-l-2 border-blue-500/40 pl-3">
                  <button onClick={() => router.push('/owner/guest-lists')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 group">
                    <FaUserFriends className="text-blue-400 text-sm group-hover:scale-110 transition-transform flex-shrink-0" />
                    Guest List
                  </button>
                </div>
              )}
            </div>

            <div>
              <button onClick={() => setPaymentsMenuOpen(!paymentsMenuOpen)} className="group relative w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-between gap-3 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                <div className="flex items-center gap-3">
                  <FaCreditCard className="text-lg text-indigo-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Manage Payments</span>
                </div>
                <FaChevronDown className={`text-xs text-gray-500 transition-transform duration-300 ${paymentsMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {paymentsMenuOpen && (
                <div className="ml-4 mt-1 space-y-1 animate-slideDown border-l-2 border-indigo-500/40 pl-3">
                  <button onClick={() => router.push('/owner/managepayments-dashboard')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 group">
                    <FaMoneyBillWave className="text-indigo-400 text-sm group-hover:scale-110 transition-transform flex-shrink-0" />
                    Payment Records
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => router.push('/owner/manage-staffnattendance?tab=attendance&sub=report')} className="group relative w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center gap-3 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
              <FaClipboardList className="text-lg text-teal-400 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Manage Attendance</span>
            </button>

            <button onClick={() => router.push('/owner/manage-maintenancerequests')} className="group relative w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center gap-3 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
              <FaWrench className="text-lg text-yellow-400 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Manage Maintenance Requests</span>
            </button>

            <div className="pt-3 mt-2 border-t border-white/10">
              <button onClick={() => setSettingsOpen(!settingsOpen)} className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FaCog className="text-lg text-purple-400" />
                  <span className="text-sm font-medium text-gray-300">Settings</span>
                </div>
                <FaChevronDown className={`text-xs text-gray-500 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
              </button>
              {settingsOpen && (
                <div className="ml-8 mt-2 space-y-1 animate-slideIn">
                  <button onClick={() => router.push('/owner/owner-comission-setting')} className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition">
                    Commission Setting
                  </button>
                  <button onClick={openNotificationSettings} className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition">
                    Notifications & Settings
                  </button>
                </div>
              )}
            </div>
          </nav>

          <div className="p-6 border-t border-white/10">
            <button onClick={() => setShowLogoutConfirm(true)} className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 text-red-400 font-medium transition-all duration-200 flex items-center justify-center gap-2 group">
              <FaSignOutAlt className="group-hover:translate-x-1 transition-transform" />
              Logout
            </button>
          </div>
        </div>

        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'} min-h-screen`}>
          <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-b border-white/10 px-8 py-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all duration-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {sidebarOpen ? 'Hide Menu' : 'Show Menu'}
              </button>

              <div className="flex items-center gap-4">
                <button onClick={openNotificationSettings} className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 group" title="Open admin announcements">
                  <FaBell className={`text-xl text-purple-400 group-hover:scale-110 transition-transform ${unreadAdminCount > 0 ? 'bell-shake' : ''}`} />
                  {unreadAdminCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-gray-900 animate-pulse">
                      {unreadAdminCount > 99 ? '99+' : unreadAdminCount}
                    </span>
                  )}
                </button>
                <div className="h-8 w-px bg-white/20" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">O</span>
                  </div>
                  <span className="text-sm text-gray-300 hidden md:block">Owner</span>
                </div>
              </div>
            </div>
          </div>

          {newAdminPopup && (
            <div className="fixed top-24 right-8 z-40 w-80 rounded-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-purple-500/40 shadow-2xl p-4 animate-fadeInUp backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <FaBell className="text-purple-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-white text-sm font-semibold">{newAdminPopup.title}</h3>
                    <button onClick={() => setNewAdminPopup(null)} className="text-gray-400 hover:text-white transition">
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-1 line-clamp-3">{newAdminPopup.message}</p>
                  <button onClick={openNotificationSettings} className="mt-3 text-xs text-purple-300 hover:text-purple-200 font-medium">
                    View announcement
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-8">
            <div className="mb-8 animate-fadeInUp">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Welcome back, {hotel?.hotel_name || 'Owner'}!
              </h1>
              <p className="text-gray-400 mt-2">Here's what's happening with your property today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Rooms', value: stats.totalRooms, icon: FaBed, color: 'from-blue-500 to-cyan-500', change: '+12%' },
                { label: "Today's Bookings", value: stats.todayBookings, icon: FaCalendarCheck, color: 'from-green-500 to-emerald-500', change: '+3' },
                { label: 'Monthly Revenue', value: `$${stats.monthlyRevenue.toLocaleString()}`, icon: FaMoneyBillWave, color: 'from-purple-500 to-pink-500', change: '+18%' },
                { label: 'Occupancy Rate', value: `${stats.occupancyRate}%`, icon: FaBuilding, color: 'from-orange-500 to-red-500', change: '+5%' },
              ].map((stat, idx) => (
                <div key={idx} className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 hover-scale animate-fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                        <stat.icon className="text-2xl text-white" />
                      </div>
                      <span className="text-xs text-green-400 font-medium bg-green-500/20 px-2 py-1 rounded-full">{stat.change}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                    <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FaTachometerAlt className="text-purple-400" />
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-4">
                {quickActions.map((action, idx) => (
                  <button key={action.id} onClick={() => setActivePanel((prev) => (prev === action.id ? null : action.id))} className={`group relative overflow-hidden rounded-xl border px-6 py-4 transition-all duration-200 hover-scale animate-fadeInUp flex items-center gap-3 ${activePanel === action.id ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5 hover:bg-white/10 border-white/10'}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    <action.icon className={`text-2xl transition-transform group-hover:scale-110 ${activePanel === action.id ? 'text-purple-300' : 'text-purple-400'}`} />
                    <span className={`text-sm font-medium transition-colors ${activePanel === action.id ? 'text-purple-200' : 'text-gray-300 group-hover:text-white'}`}>{action.label}</span>
                    {activePanel === action.id && <span className="ml-1 px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-xs font-medium">Open</span>}
                  </button>
                ))}
              </div>
            </div>

            {activePanel === 'earnings' && (
              <div className="animate-fadeInUp">
                <EarningReports />
              </div>
            )}
            {activePanel === 'reviews' && (
              <div className="animate-fadeInUp">
                <OwnerGuestReviewsPanel hotelId={hotel?.hotel_id} hotelName={hotel?.hotel_name} />
              </div>
            )}

            {!activePanel && !showAnnouncementPanel && (
              <div className="text-center py-16 animate-fadeInUp">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <FaHotel className="text-4xl text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Welcome to CloudInn</h3>
                <p className="text-gray-400">Select an option from the sidebar or quick actions above to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <OwnerAnnouncementPanel isOpen={showAnnouncementPanel} onClose={() => setShowAnnouncementPanel(false)} />

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeInUp">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 w-96 text-center border border-white/10 shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <FaSignOutAlt className="text-3xl text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Ready to leave?</h2>
            <p className="text-gray-400 mb-6">Are you sure you want to logout from CloudInn?</p>
            <div className="flex justify-center gap-4">
              <button onClick={handleLogout} className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium">
                Yes, Logout
              </button>
              <button onClick={() => setShowLogoutConfirm(false)} className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OwnerDashboard;
