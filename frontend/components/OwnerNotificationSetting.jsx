'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FaBell,
  FaCog,
  FaVolumeMute,
  FaVolumeUp,
  FaStar,
  FaRegStar,
  FaSpinner,
  FaTimes,
  FaBullhorn,
  FaHotel,
  FaCheckCircle,
} from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:8000';
const OWNER_SEEN_ADMIN_IDS_KEY = 'cloudinn_owner_seen_admin_announcement_ids';
const OWNER_SOUND_STATUS_KEY = 'owner_notification_sound_status';
const OWNER_MUTE_UNTIL_KEY = 'owner_notification_mute_until';

export default function OwnerNotificationSetting({ showMenu }) {
  const [muteStatus, setMuteStatus] = useState('Active');
  const [sidebarOpen, setSidebarOpen] = useState(showMenu === true || showMenu === 'true');
  const [activeFilter, setActiveFilter] = useState('all');
  const [announcements, setAnnouncements] = useState([]);
  const [starredIds, setStarredIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const getToken = () => {
    if (typeof window === 'undefined') return null;

    return (
      localStorage.getItem('authToken') ||
      localStorage.getItem('access') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token')
    );
  };

  const getHeaders = () => {
    const token = getToken();

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }

    return headers;
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diffMs = new Date() - new Date(timestamp);
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const markAnnouncementsAsSeen = (items) => {
    if (typeof window === 'undefined') return;

    const ids = items
      .map((item) => item.id)
      .filter(Boolean)
      .map((id) => `admin_to_owner_${String(id).replace('admin_to_owner_', '')}`);

    localStorage.setItem(OWNER_SEEN_ADMIN_IDS_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event('owner-admin-announcements-seen'));
  };

  const fetchStarred = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/starred-notifications/`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setStarredIds(Array.isArray(data) ? data.map((item) => item.announcement) : []);
      }
    } catch (err) {
      console.error('Error fetching starred notifications:', err);
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/recent-announcements/`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load admin announcements');
      }

      const data = await response.json();
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.announcements)
        ? data.announcements
        : [];

      const formatted = items
        .map((ann) => {
          const timestamp =
            ann.timestamp ||
            ann.created_at ||
            ann.createdAt ||
            ann.date ||
            new Date().toISOString();

          return {
            id: ann.id,
            title: 'Admin Announcement',
            message: ann.content || ann.message || ann.description || '',
            hotelName: 'CloudInn Admin',
            type: 'admin-announcement',
            time: formatTimeAgo(timestamp),
            timestamp,
            isStarred: starredIds.includes(ann.id),
          };
        })
        .filter((ann) => ann.message.trim() !== '')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setAnnouncements(formatted);
      markAnnouncementsAsSeen(formatted);
    } catch (err) {
      console.error('Error fetching admin announcements:', err);
      setError(err.message || 'Network error while loading admin announcements');
    } finally {
      setLoading(false);
    }
  };

  const toggleStar = async (itemId, isStarred) => {
    try {
      if (isStarred) {
        await fetch(`${API_BASE_URL}/api/star-notification/admin-announcement/${itemId}/`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        setStarredIds((prev) => prev.filter((id) => id !== itemId));
      } else {
        await fetch(`${API_BASE_URL}/api/star-notification/`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            announcement: itemId,
            announcement_type: 'admin-announcement',
          }),
        });
        setStarredIds((prev) => [...prev, itemId]);
      }

      setAnnouncements((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, isStarred: !isStarred } : item))
      );
    } catch (err) {
      console.error('Error toggling star:', err);
      setError('Failed to update important status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const syncMuteStatus = () => {
    const storedStatus = localStorage.getItem(OWNER_SOUND_STATUS_KEY) || 'Active';
    const muteUntil = Number(localStorage.getItem(OWNER_MUTE_UNTIL_KEY) || 0);

    if (storedStatus === 'Muted for 1 hour' && muteUntil && Date.now() > muteUntil) {
      localStorage.setItem(OWNER_SOUND_STATUS_KEY, 'Active');
      localStorage.removeItem(OWNER_MUTE_UNTIL_KEY);
      setMuteStatus('Active');
      return;
    }

    setMuteStatus(storedStatus);
  };

  useEffect(() => {
    setMounted(true);
    syncMuteStatus();
    fetchStarred();
  }, []);

  useEffect(() => {
    if (mounted) fetchAnnouncements();
  }, [mounted, starredIds.length]);

  useEffect(() => {
    setSidebarOpen(showMenu === true || showMenu === 'true');
  }, [showMenu]);

  const handleMuteOneHour = () => {
    localStorage.setItem(OWNER_SOUND_STATUS_KEY, 'Muted for 1 hour');
    localStorage.setItem(OWNER_MUTE_UNTIL_KEY, String(Date.now() + 3600000));
    setMuteStatus('Muted for 1 hour');
  };

  const handleMuteUntilUnmute = () => {
    localStorage.setItem(OWNER_SOUND_STATUS_KEY, 'Muted until unmuted');
    localStorage.removeItem(OWNER_MUTE_UNTIL_KEY);
    setMuteStatus('Muted until unmuted');
  };

  const handleUnmute = () => {
    localStorage.setItem(OWNER_SOUND_STATUS_KEY, 'Active');
    localStorage.removeItem(OWNER_MUTE_UNTIL_KEY);
    setMuteStatus('Active');
  };

  const filteredItems = useMemo(() => {
    if (activeFilter === 'important') return announcements.filter((item) => item.isStarred);
    return announcements;
  }, [activeFilter, announcements]);

  const pageTitle =
    activeFilter === 'important'
      ? 'Important Notifications'
      : activeFilter === 'announcements'
      ? 'Announcements'
      : 'All Notifications';

  const emptyTitle =
    activeFilter === 'important'
      ? 'No important admin announcements'
      : 'No admin announcements yet';

  if (!mounted) return null;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap');
        :root {
          --gold: #c8a96e;
          --gold-lt: #e2cfa0;
          --gold-dim: rgba(200,169,110,0.16);
          --gold-border: rgba(200,169,110,0.2);
          --ink: #080706;
          --ivory: #f4efe5;
          --ivory-60: rgba(244,239,229,0.6);
          --ivory-30: rgba(244,239,229,0.3);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Outfit', sans-serif; background: var(--ink); color: var(--ivory); }
        .glass-card {
          background: rgba(10,9,7,0.68);
          backdrop-filter: blur(18px);
          border: 1px solid var(--gold-border);
          transition: border-color .3s, box-shadow .4s, transform .3s;
        }
        .glass-card:hover {
          border-color: rgba(200,169,110,0.42);
          box-shadow: 0 28px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(200,169,110,0.1);
          transform: translateY(-4px);
        }
        .gold-divider { height: 1px; background: linear-gradient(90deg, transparent, var(--gold-border), transparent); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) forwards; }
        .star-btn { transition: all .2s ease; }
        .star-btn:hover { transform: scale(1.1); }
      `}</style>

      <div className="relative min-h-screen overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800&auto=format')",
              filter: 'brightness(0.6) saturate(1.2)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-black/40 to-amber-800/30" />
        </div>

        <div className="relative z-10 flex min-h-screen">
          {sidebarOpen && (
            <aside className="w-64 glass-card rounded-none border-l-0 border-t-0 border-b-0 shadow-2xl flex flex-col">
              <div className="p-6 border-b border-gold-border">
                <h2 className="font-serif text-2xl font-light text-ivory flex items-center gap-2">
                  <FaBell className="text-gold" /> Owner Notifications
                </h2>
                <div className="gold-divider mt-2" />
              </div>

              <nav className="flex-1 p-4 space-y-2">
                <button onClick={() => setActiveFilter('all')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${activeFilter === 'all' ? 'bg-gold-dim text-ivory' : 'text-ivory-60 hover:text-ivory hover:bg-gold-dim'}`}>
                  <FaBell className="text-gold" /> All 
                </button>
                <button onClick={() => setActiveFilter('important')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${activeFilter === 'important' ? 'bg-gold-dim text-ivory' : 'text-ivory-60 hover:text-ivory hover:bg-gold-dim'}`}>
                  <FaStar className="text-yellow-400" /> Important
                </button>
                <button onClick={() => setActiveFilter('announcements')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${activeFilter === 'announcements' ? 'bg-gold-dim text-ivory' : 'text-ivory-60 hover:text-ivory hover:bg-gold-dim'}`}>
                  <FaBullhorn className="text-purple-400" /> Announcements
                </button>
              </nav>

              <div className="p-4 border-t border-gold-border">
                <h3 className="font-serif text-lg font-light text-ivory flex items-center gap-2 mb-3">
                  <FaCog className="text-gold" /> Sound Settings
                </h3>
                <div className="space-y-2">
                  <button onClick={handleMuteOneHour} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gold-dim hover:bg-gold-dim/80 text-gold-lt transition">
                    <FaVolumeMute /> Mute for 1 Hour
                  </button>
                  <button onClick={handleMuteUntilUnmute} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gold-dim hover:bg-gold-dim/80 text-gold-lt transition">
                    <FaVolumeMute /> Mute Until Unmute
                  </button>
                  <button onClick={handleUnmute} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 transition">
                    <FaVolumeUp /> Unmute
                  </button>
                </div>
              </div>
            </aside>
          )}

          <main className="flex-1 p-8">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-gold-border text-ivory-60 hover:text-ivory transition"
              >
                {sidebarOpen ? '← Hide Menu' : '☰ Show Menu'}
              </button>

              <div className="mb-8">
                <h1 className="font-serif text-4xl md:text-5xl font-light text-ivory">
                  {pageTitle}
                </h1>
                <div className="gold-divider w-24 mt-2" />
                <div className="mt-3 text-sm text-ivory-60 flex items-center gap-2">
                  <span>Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${muteStatus === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {muteStatus}
                  </span>
                  <span className="ml-auto text-xs flex items-center gap-1">
                    <FaCheckCircle className="text-green-400" /> Seen
                  </span>
                  <span className="text-xs">{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                  <FaTimes className="text-red-400 text-sm" />
                  <p className="text-red-400 text-sm flex-1">{error}</p>
                  <button onClick={() => setError('')}>
                    <FaTimes className="text-red-400 text-xs" />
                  </button>
                </div>
              )}

              {loading && (
                <div className="flex justify-center items-center py-12">
                  <FaSpinner className="text-gold text-3xl animate-spin" />
                </div>
              )}

              {!loading && (
                <div className="space-y-4">
                  {filteredItems.length === 0 ? (
                    <div className="glass-card rounded-lg p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <FaBell className="text-gray-500 text-2xl" />
                      </div>
                      <p className="text-gray-400">
                        {emptyTitle}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Only announcements sent from the Admin panel will appear here.
                      </p>
                    </div>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <div key={item.id} className="glass-card rounded-lg p-5 fade-up group" style={{ animationDelay: `${idx * 0.05}s` }}>
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <FaBullhorn className="text-purple-400 text-lg" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-serif text-lg font-medium text-ivory">Admin Announcement</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">Admin</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-ivory-30 uppercase tracking-wider">{item.time}</span>
                                <button onClick={() => toggleStar(item.id, item.isStarred)} className="star-btn focus:outline-none" title={item.isStarred ? 'Remove from important' : 'Mark as important'}>
                                  {item.isStarred ? <FaStar className="text-yellow-400 text-lg" /> : <FaRegStar className="text-ivory-30 hover:text-yellow-400 text-lg transition" />}
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 mb-2">
                              <FaHotel className="text-amber-400 text-xs" />
                              <span className="text-xs text-amber-400/80 font-medium">From: {item.hotelName}</span>
                            </div>
                            <p className="text-ivory-60 text-sm mt-2 leading-relaxed border-l-2 border-gold-border pl-3">
                              {item.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
