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
  FaTags,
  FaCheckCircle,
  FaGift,
} from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:8000';
const GUEST_SOUND_STATUS_KEY = 'guest_notification_sound_status';
const GUEST_MUTE_UNTIL_KEY = 'guest_notification_mute_until';
const GUEST_STARRED_OFFERS_KEY = 'guest_starred_offer_ids';

export default function GuestNotificationSetting({ showMenu = false }) {
  const [muteStatus, setMuteStatus] = useState('Active');
  const [sidebarOpen, setSidebarOpen] = useState(showMenu === true || showMenu === 'true');
  const [activeFilter, setActiveFilter] = useState('all');
  const [offers, setOffers] = useState([]);
  const [starredIds, setStarredIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const getToken = () => {
    if (typeof window === 'undefined') return null;

    return (
      localStorage.getItem('guest_access_token') ||
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
    if (minutes < 60) return String(minutes) + ' min ago';
    if (hours < 24) return String(hours) + ' hour' + (hours > 1 ? 's' : '') + ' ago';

    return String(days) + ' day' + (days > 1 ? 's' : '') + ' ago';
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Not set';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return 'Not set';

    return date.toLocaleDateString();
  };

  const loadStarredIds = () => {
    if (typeof window === 'undefined') return [];

    try {
      const saved = localStorage.getItem(GUEST_STARRED_OFFERS_KEY);
      const parsed = saved ? JSON.parse(saved) : [];

      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  };

  const saveStarredIds = (ids) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(GUEST_STARRED_OFFERS_KEY, JSON.stringify(ids));
  };

  const fetchOffers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_BASE_URL + '/api/guest/notifications/', {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to load offers and discounts');
      }

      const data = await response.json();

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.promotions)
        ? data.promotions
        : [];

      const currentStarredIds = loadStarredIds();

      const formatted = items
        .filter((item) => {
          const status = String(item.status || '').toLowerCase();

          return !status || status === 'active' || status === 'upcoming';
        })
        .map((item) => {
          const timestamp =
            item.created_at ||
            item.createdAt ||
            item.timestamp ||
            item.valid_from ||
            new Date().toISOString();

          return {
            id: item.id,
            title: item.title || 'Special Offer',
            message: item.description || item.content || item.message || '',
            status: item.status || 'Active',
            timestamp: timestamp,
            time: formatTimeAgo(timestamp),
            validFrom: item.valid_from,
            validTo: item.valid_to,
            isStarred: item.is_starred === true || currentStarredIds.includes(item.id),
          };
        })
        .filter((item) => item.title.trim() !== '' || item.message.trim() !== '')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setStarredIds(currentStarredIds);
      setOffers(formatted);
    } catch (err) {
      console.error('Error fetching guest offers:', err);
      setError(err.message || 'Network error while loading offers and discounts');
    } finally {
      setLoading(false);
    }
  };

  const toggleStar = async (id, isStarred) => {
    const previousStarredIds = starredIds;
    const nextStarredIds = isStarred
      ? starredIds.filter((itemId) => itemId !== id)
      : starredIds.concat(id);

    setStarredIds(nextStarredIds);
    saveStarredIds(nextStarredIds);

    setOffers((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isStarred: !isStarred,
            }
          : item
      )
    );

    try {
      const response = await fetch(
        isStarred
          ? API_BASE_URL + '/api/guest/star-promotion/' + id + '/'
          : API_BASE_URL + '/api/guest/star-promotion/',
        {
          method: isStarred ? 'DELETE' : 'POST',
          headers: getHeaders(),
          body: isStarred ? undefined : JSON.stringify({ promotion: id }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update important offer');
      }
    } catch (err) {
      console.error('Error updating guest starred promotion:', err);
      setStarredIds(previousStarredIds);
      saveStarredIds(previousStarredIds);
      setOffers((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                isStarred,
              }
            : item
        )
      );
      setError(err.message || 'Failed to update important offer');
    }
  };

  const syncMuteStatus = () => {
    const storedStatus = localStorage.getItem(GUEST_SOUND_STATUS_KEY) || 'Active';
    const muteUntil = Number(localStorage.getItem(GUEST_MUTE_UNTIL_KEY) || 0);

    if (storedStatus === 'Muted for 1 hour' && muteUntil && Date.now() > muteUntil) {
      localStorage.setItem(GUEST_SOUND_STATUS_KEY, 'Active');
      localStorage.removeItem(GUEST_MUTE_UNTIL_KEY);
      setMuteStatus('Active');
      return;
    }

    setMuteStatus(storedStatus);
  };

  useEffect(() => {
    setMounted(true);
    syncMuteStatus();
    setStarredIds(loadStarredIds());
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchOffers();
    }
  }, [mounted]);

  useEffect(() => {
    setSidebarOpen(showMenu === true || showMenu === 'true');
  }, [showMenu]);

  const handleMuteOneHour = () => {
    localStorage.setItem(GUEST_SOUND_STATUS_KEY, 'Muted for 1 hour');
    localStorage.setItem(GUEST_MUTE_UNTIL_KEY, String(Date.now() + 3600000));
    setMuteStatus('Muted for 1 hour');
  };

  const handleMuteUntilUnmute = () => {
    localStorage.setItem(GUEST_SOUND_STATUS_KEY, 'Muted until unmuted');
    localStorage.removeItem(GUEST_MUTE_UNTIL_KEY);
    setMuteStatus('Muted until unmuted');
  };

  const handleUnmute = () => {
    localStorage.setItem(GUEST_SOUND_STATUS_KEY, 'Active');
    localStorage.removeItem(GUEST_MUTE_UNTIL_KEY);
    setMuteStatus('Active');
  };

  const filteredItems = useMemo(() => {
    if (activeFilter === 'important') {
      return offers.filter((item) => item.isStarred);
    }

    return offers;
  }, [activeFilter, offers]);

  if (!mounted) return null;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap');

        :root {
          --gold: #c8a96e;
          --gold-lt: #e2cfa0;
          --gold-dim: rgba(200, 169, 110, 0.16);
          --gold-border: rgba(200, 169, 110, 0.2);
          --ink: #080706;
          --ivory: #f4efe5;
          --ivory-60: rgba(244, 239, 229, 0.6);
          --ivory-30: rgba(244, 239, 229, 0.3);
        }

        body {
          font-family: 'Outfit', sans-serif;
          background: var(--ink);
          color: var(--ivory);
        }

        .guest-glass-card {
          background: rgba(10, 9, 7, 0.68);
          backdrop-filter: blur(18px);
          border: 1px solid var(--gold-border);
          transition: border-color 0.3s, box-shadow 0.4s, transform 0.3s;
        }

        .guest-glass-card:hover {
          border-color: rgba(200, 169, 110, 0.42);
          box-shadow: 0 28px 64px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(200, 169, 110, 0.1);
          transform: translateY(-4px);
        }

        .guest-gold-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold-border), transparent);
        }

        @keyframes guestFadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .guest-fade-up {
          animation: guestFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .guest-star-btn {
          transition: all 0.2s ease;
        }

        .guest-star-btn:hover {
          transform: scale(1.1);
        }
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
            <aside className="w-64 guest-glass-card rounded-none border-l-0 border-t-0 border-b-0 shadow-2xl flex flex-col">
              <div className="p-6 border-b border-[var(--gold-border)]">
                <h2 className="font-serif text-2xl font-light text-[var(--ivory)] flex items-center gap-2">
                  <FaBell className="text-[var(--gold)]" /> Guest Notifications
                </h2>
                <div className="guest-gold-divider mt-2" />
              </div>

              <nav className="flex-1 p-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ' +
                    (activeFilter === 'all'
                      ? 'bg-[var(--gold-dim)] text-[var(--ivory)]'
                      : 'text-[var(--ivory-60)] hover:text-[var(--ivory)] hover:bg-[var(--gold-dim)]')
                  }
                >
                  <FaGift className="text-[var(--gold)]" /> All Offers
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('important')}
                  className={
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ' +
                    (activeFilter === 'important'
                      ? 'bg-[var(--gold-dim)] text-[var(--ivory)]'
                      : 'text-[var(--ivory-60)] hover:text-[var(--ivory)] hover:bg-[var(--gold-dim)]')
                  }
                >
                  <FaStar className="text-yellow-400" /> Important
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('offers')}
                  className={
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ' +
                    (activeFilter === 'offers'
                      ? 'bg-[var(--gold-dim)] text-[var(--ivory)]'
                      : 'text-[var(--ivory-60)] hover:text-[var(--ivory)] hover:bg-[var(--gold-dim)]')
                  }
                >
                  <FaTags className="text-purple-400" /> Offers & Discounts
                </button>
              </nav>

              <div className="p-4 border-t border-[var(--gold-border)]">
                <h3 className="font-serif text-lg font-light text-[var(--ivory)] flex items-center gap-2 mb-3">
                  <FaCog className="text-[var(--gold)]" /> Sound Settings
                </h3>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleMuteOneHour}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--gold-dim)] hover:bg-[rgba(200,169,110,0.25)] text-[var(--gold-lt)] transition"
                  >
                    <FaVolumeMute /> Mute for 1 Hour
                  </button>

                  <button
                    type="button"
                    onClick={handleMuteUntilUnmute}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--gold-dim)] hover:bg-[rgba(200,169,110,0.25)] text-[var(--gold-lt)] transition"
                  >
                    <FaVolumeMute /> Mute Until Unmute
                  </button>

                  <button
                    type="button"
                    onClick={handleUnmute}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 transition"
                  >
                    <FaVolumeUp /> Unmute
                  </button>
                </div>
              </div>
            </aside>
          )}

          <main className="flex-1 p-8">
            <div className="max-w-4xl mx-auto">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-[var(--gold-border)] text-[var(--ivory-60)] hover:text-[var(--ivory)] transition"
              >
                {sidebarOpen ? '← Hide Menu' : '☰ Show Menu'}
              </button>

              <div className="mb-8">
                <h1 className="font-serif text-4xl md:text-5xl font-light text-[var(--ivory)]">
                  {activeFilter === 'important' ? 'Important Guest Offers' : 'Guest Offers & Notifications'}
                </h1>

                <div className="guest-gold-divider w-24 mt-2" />

                <div className="mt-3 text-sm text-[var(--ivory-60)] flex items-center gap-2">
                  <span>Status:</span>
                  <span
                    className={
                      'px-2 py-0.5 rounded-full text-xs font-medium ' +
                      (muteStatus === 'Active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400')
                    }
                  >
                    {muteStatus}
                  </span>

                  <span className="ml-auto text-xs flex items-center gap-1">
                    <FaCheckCircle className="text-green-400" /> Seen
                  </span>

                  <span className="text-xs">
                    {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                  <FaTimes className="text-red-400 text-sm" />
                  <p className="text-red-400 text-sm flex-1">{error}</p>
                  <button type="button" onClick={() => setError('')}>
                    <FaTimes className="text-red-400 text-xs" />
                  </button>
                </div>
              )}

              {loading && (
                <div className="flex justify-center items-center py-12">
                  <FaSpinner className="text-[var(--gold)] text-3xl animate-spin" />
                </div>
              )}

              {!loading && (
                <div className="space-y-4">
                  {filteredItems.length === 0 ? (
                    <div className="guest-glass-card rounded-lg p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <FaBell className="text-gray-500 text-2xl" />
                      </div>
                      <p className="text-gray-400">
                        {activeFilter === 'important'
                          ? 'No important guest offers'
                          : 'No offers or discounts yet'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Offers and discounts created from the Owner Announcement Panel will appear here.
                      </p>
                    </div>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="guest-glass-card rounded-lg p-5 guest-fade-up group"
                        style={{ animationDelay: String(idx * 0.05) + 's' }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <FaTags className="text-purple-400 text-lg" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-serif text-lg font-medium text-[var(--ivory)]">
                                  {item.title}
                                </h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                                  {item.status}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-xs text-[var(--ivory-30)] uppercase tracking-wider">
                                  {item.time}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => toggleStar(item.id, item.isStarred)}
                                  className="guest-star-btn focus:outline-none"
                                  title={item.isStarred ? 'Remove from important' : 'Mark as important'}
                                >
                                  {item.isStarred ? (
                                    <FaStar className="text-yellow-400 text-lg" />
                                  ) : (
                                    <FaRegStar className="text-[var(--ivory-30)] hover:text-yellow-400 text-lg transition" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2 mb-2">
                              <FaGift className="text-amber-400 text-xs" />
                              <span className="text-xs text-amber-400/80 font-medium">
                                From: Owner Offers & Discounts
                              </span>
                            </div>

                            <p className="text-[var(--ivory-60)] text-sm mt-2 leading-relaxed border-l-2 border-[var(--gold-border)] pl-3">
                              {item.message || 'No description available.'}
                            </p>

                            <div className="flex items-center gap-2 mt-3 flex-wrap text-xs">
                              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[var(--ivory-60)]">
                                Valid From: {formatDate(item.validFrom)}
                              </span>

                              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[var(--ivory-60)]">
                                Valid To: {formatDate(item.validTo)}
                              </span>
                            </div>
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
