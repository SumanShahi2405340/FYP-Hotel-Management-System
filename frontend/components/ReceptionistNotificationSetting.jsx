'use client';
import { useState, useEffect } from 'react';
import { 
  FaBell, FaCog, FaVolumeMute, FaVolumeUp, FaStar, FaRegStar, 
  FaSpinner, FaTimes, FaBullhorn, FaHotel, FaTags 
} from 'react-icons/fa';

export default function NotificationSetting({ showMenu }) {
  const [muteStatus, setMuteStatus] = useState('Active');

  // ✅ FIX: Query params from Next.js router are always STRINGS.
  // "false" is a non-empty string → truthy → sidebar wrongly opens.
  // We must explicitly compare to the string "true".
  const [sidebarOpen, setSidebarOpen] = useState(showMenu === true || showMenu === 'true');

  const [activeFilter, setActiveFilter] = useState('all');
  const [announcements, setAnnouncements] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [starredIds, setStarredIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Fetch promotions
  const fetchPromotions = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:8000/api/promotions/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (response.ok) {
        const data = await response.json();
        const formattedPromotions = data.map(promo => ({
          id: `promo_${promo.id}`,
          title: promo.title,
          message: promo.description,
          hotelName: promo.hotel_name || 'Your Hotel',
          type: 'promotion',
          validFrom: promo.valid_from,
          validTo: promo.valid_to,
          status: promo.status,
          time: formatTimeAgo(promo.created_at || new Date().toISOString()),
          timestamp: promo.created_at,
          isStarred: starredIds.includes(`promo_${promo.id}`)
        }));
        setPromotions(formattedPromotions);
      }
    } catch (err) {
      console.error("Error fetching promotions:", err);
    }
  };

  // Fetch owner announcements from API
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:8000/api/owner-recent-announcements/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data) ? data : [];

        // Filter to show announcements sent to receptionist
        const receptionistAnnouncements = items.filter(ann =>
          ann.recipients?.includes('receptionist')
        );

        const formattedAnnouncements = receptionistAnnouncements.map(ann => ({
          id: `ann_${ann.id}`,
          title: 'Owner Announcement', // Changed from 'Receptionist Announcement'
          message: ann.content,
          hotelName: ann.hotel_name || 'Unknown Hotel',
          type: 'announcement',
          time: formatTimeAgo(ann.timestamp),
          timestamp: ann.timestamp,
          recipients: ann.recipients,
          isStarred: starredIds.includes(`ann_${ann.id}`)
        }));

        setAnnouncements(formattedAnnouncements);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to load announcements");
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError("Network error while loading announcements");
    } finally {
      setLoading(false);
    }
  };

  // Fetch starred notifications
  const fetchStarred = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:8000/api/starred-notifications/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (response.ok) {
        const data = await response.json();
        const starred = data.map(item => item.announcement);
        setStarredIds(starred);
      }
    } catch (err) {
      console.error("Error fetching starred:", err);
    }
  };

  // Star/Unstar notification
  const toggleStar = async (itemId, isStarred, type, originalId) => {
    try {
      const token = localStorage.getItem("authToken");
      const announcementId = originalId || itemId.replace(`${type}_`, '');

      if (isStarred) {
        await fetch(`http://localhost:8000/api/star-notification/${announcementId}/`, {
          method: "DELETE",
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });
        setStarredIds(prev => prev.filter(id => id !== announcementId && id !== itemId));
      } else {
        await fetch("http://localhost:8000/api/star-notification/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ announcement: parseInt(announcementId) }),
        });
        setStarredIds(prev => [...prev, announcementId]);
      }

      setAnnouncements(prev =>
        prev.map(item => item.id === itemId ? { ...item, isStarred: !isStarred } : item)
      );
      setPromotions(prev =>
        prev.map(item => item.id === itemId ? { ...item, isStarred: !isStarred } : item)
      );
    } catch (err) {
      console.error("Error toggling star:", err);
      setError("Failed to update star status");
      setTimeout(() => setError(''), 3000);
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    setMounted(true);
    fetchAnnouncements();
    fetchPromotions();
    fetchStarred();
  }, []);

  //  FIX: Keep sidebar in sync if showMenu prop changes, with correct boolean check
  useEffect(() => {
    setSidebarOpen(showMenu === true || showMenu === 'true');
  }, [showMenu]);

  const handleMuteOneHour = () => {
    setMuteStatus('Muted for 1 hour');
    setTimeout(() => setMuteStatus('Active'), 3600000);
  };
  const handleMuteUntilUnmute = () => setMuteStatus('Muted until unmuted');
  const handleUnmute = () => setMuteStatus('Active');

  const getAllItems = () =>
    [...announcements, ...promotions].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

  const getImportantItems = () =>
    [...announcements, ...promotions].filter(item => item.isStarred);

  const getFilteredItems = () => {
    switch (activeFilter) {
      case 'all':           return getAllItems();
      case 'important':     return getImportantItems();
      case 'announcements': return announcements;
      case 'promotions':    return promotions;
      default:              return getAllItems();
    }
  };

  const filteredItems = getFilteredItems();

  const getIcon = (type) => {
    switch (type) {
      case 'announcement': return <FaBullhorn className="text-purple-400 text-lg" />;
      case 'promotion':    return <FaTags className="text-green-400 text-lg" />;
      default:             return <FaBell className="text-amber-400 text-lg" />;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'announcement':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">Owner</span>; // Changed from purple to blue and "Receptionist" to "Owner"
      case 'promotion':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">Promotion</span>;
      default:
        return null;
    }
  };

  if (!mounted) return null;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap');

        :root {
          --gold:        #c8a96e;
          --gold-lt:     #e2cfa0;
          --gold-dim:    rgba(200,169,110,0.16);
          --gold-border: rgba(200,169,110,0.2);
          --ink:         #080706;
          --ivory:       #f4efe5;
          --ivory-60:    rgba(244,239,229,0.6);
          --ivory-30:    rgba(244,239,229,0.3);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Outfit', sans-serif; background: var(--ink); color: var(--ivory); }

        .glass-card {
          background: rgba(10,9,7,0.68);
          backdrop-filter: blur(18px);
          border: 1px solid var(--gold-border);
          transition: border-color 0.3s, box-shadow 0.4s, transform 0.3s;
        }
        .glass-card:hover {
          border-color: rgba(200,169,110,0.42);
          box-shadow: 0 28px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(200,169,110,0.1);
          transform: translateY(-4px);
        }
        .gold-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold-border), transparent);
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .star-btn { transition: all 0.2s ease; }
        .star-btn:hover { transform: scale(1.1); }
      `}</style>

      <div className="relative min-h-screen overflow-hidden">
        {/* Background */}
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

          {/* Sidebar — only rendered when sidebarOpen === true */}
          {sidebarOpen && (
            <aside className="w-64 glass-card rounded-none border-l-0 border-t-0 border-b-0 shadow-2xl flex flex-col">
              <div className="p-6 border-b border-gold-border">
                <h2 className="font-serif text-2xl font-light text-ivory flex items-center gap-2">
                  <FaBell className="text-gold" /> Owner Notifications
                </h2>
                <div className="gold-divider mt-2" />
              </div>

              <nav className="flex-1 p-4 space-y-2">
                {[
                  { key: 'all',           label: 'All',                    icon: <FaBell className="text-gold" /> },
                  { key: 'important',     label: 'Important',              icon: <FaStar className="text-yellow-400" /> },
                  { key: 'announcements', label: 'Announcements',          icon: <FaBullhorn className="text-purple-400" /> },
                  { key: 'promotions',    label: 'Promotions & Discounts', icon: <FaTags className="text-green-400" /> },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                      activeFilter === key
                        ? 'bg-gold-dim text-ivory'
                        : 'text-ivory-60 hover:text-ivory hover:bg-gold-dim'
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </nav>

              <div className="p-4 border-t border-gold-border">
                <h3 className="font-serif text-lg font-light text-ivory flex items-center gap-2 mb-3">
                  <FaCog className="text-gold" /> Sound Settings
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleMuteOneHour}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gold-dim hover:bg-gold-dim/80 text-gold-lt transition"
                  >
                    <FaVolumeMute /> Mute for 1 Hour
                  </button>
                  <button
                    onClick={handleMuteUntilUnmute}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gold-dim hover:bg-gold-dim/80 text-gold-lt transition"
                  >
                    <FaVolumeMute /> Mute Until Unmute
                  </button>
                  <button
                    onClick={handleUnmute}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 transition"
                  >
                    <FaVolumeUp /> Unmute
                  </button>
                </div>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 p-8">
            <div className="max-w-4xl mx-auto">

              {/* Toggle Sidebar Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-gold-border text-ivory-60 hover:text-ivory transition"
              >
                {sidebarOpen ? '← Hide Menu' : '☰ Show Menu'}
              </button>

              {/* Header */}
              <div className="mb-8">
                <h1 className="font-serif text-4xl md:text-5xl font-light text-ivory">
                  {activeFilter === 'all'           && 'All Notifications'}
                  {activeFilter === 'important'     && 'Important Items'}
                  {activeFilter === 'announcements' && 'Owner Announcements'}
                  {activeFilter === 'promotions'    && 'Promotions & Discounts'}
                </h1>
                <div className="gold-divider w-24 mt-2" />
                <div className="mt-3 text-sm text-ivory-60 flex items-center gap-2">
                  <span>Current Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    muteStatus === 'Active'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {muteStatus}
                  </span>
                  <span className="ml-auto text-xs">
                    {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                  <FaTimes className="text-red-400 text-sm" />
                  <p className="text-red-400 text-sm flex-1">{error}</p>
                  <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <FaSpinner className="text-gold text-3xl animate-spin" />
                </div>
              )}

              {/* Notifications List */}
              {!loading && (
                <div className="space-y-4">
                  {filteredItems.length === 0 ? (
                    <div className="glass-card rounded-lg p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        {activeFilter === 'promotions'
                          ? <FaTags className="text-gray-500 text-2xl" />
                          : <FaBell className="text-gray-500 text-2xl" />
                        }
                      </div>
                      <p className="text-gray-400">
                        {activeFilter === 'promotions'    && 'No promotions found'}
                        {activeFilter === 'announcements' && 'No announcements from owners yet'}
                        {activeFilter === 'important'     && 'No important items'}
                        {activeFilter === 'all'           && 'No notifications'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {activeFilter === 'promotions'    && 'New promotions will appear here'}
                        {activeFilter === 'announcements' && 'When hotel owners send announcements, they will appear here'}
                        {activeFilter === 'important'     && 'Star items to see them here'}
                        {activeFilter === 'all'           && 'New notifications will appear here'}
                      </p>
                    </div>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="glass-card rounded-lg p-5 fade-up group"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">{getIcon(item.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-serif text-lg font-medium text-ivory">{item.title}</h3>
                                {getTypeBadge(item.type)}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-ivory-30 uppercase tracking-wider">{item.time}</span>
                                <button
                                  onClick={() => toggleStar(item.id, item.isStarred, item.type, item.id.split('_')[1])}
                                  className="star-btn focus:outline-none"
                                  title={item.isStarred ? "Remove from important" : "Mark as important"}
                                >
                                  {item.isStarred
                                    ? <FaStar className="text-yellow-400 text-lg" />
                                    : <FaRegStar className="text-ivory-30 hover:text-yellow-400 text-lg transition" />
                                  }
                                </button>
                              </div>
                            </div>

                            {/* Hotel Info */}
                            <div className="flex items-center gap-2 mt-2 mb-2">
                              <FaHotel className="text-amber-400 text-xs" />
                              <span className="text-xs text-amber-400/80 font-medium">
                                From: {item.hotelName}
                              </span>
                            </div>

                            {/* Message */}
                            <p className="text-ivory-60 text-sm mt-2 leading-relaxed border-l-2 border-gold-border pl-3">
                              {item.message}
                            </p>

                            {/* Promotion validity */}
                            {item.type === 'promotion' && item.validFrom && item.validTo && (
                              <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gold-border/30">
                                <span className="text-xs text-green-400/80">
                                  Valid: {item.validFrom} - {item.validTo}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  item.status === 'Active'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {item.status || 'Upcoming'}
                                </span>
                              </div>
                            )}
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