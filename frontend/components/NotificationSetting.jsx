'use client';
import { useState, useEffect } from 'react';
import { 
  FaBell, FaCog, FaVolumeMute, FaVolumeUp, FaStar, FaRegStar, 
  FaSpinner, FaTimes, FaBullhorn, FaHotel, FaTags 
} from 'react-icons/fa';

export default function NotificationSetting({ showMenu }) {
  const [muteStatus, setMuteStatus] = useState('Active');
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
        const formatted = data.map(promo => ({
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
        setPromotions(formatted);
      }
    } catch (err) {
      console.error("Error fetching promotions:", err);
    }
  };

  // ✅ FIXED: This is the ADMIN's inbox.
  // Shows ONLY what owners sent TO admin (type === 'admin').
  // Does NOT show SendAdminAnnouncement (those are admin→owner, not owner→admin).
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

        // ✅ type === 'admin' means the owner sent this message TO the admin
        const ownerToAdminOnly = items.filter(ann => ann.type === 'admin');

        const formatted = ownerToAdminOnly.map(ann => ({
          id: `ann_${ann.id}`,
          title: 'Owner Announcement',   // ✅ was "Admin Announcement" — now correct
          message: ann.content,
          hotelName: ann.hotel_name || 'Unknown Hotel',
          type: 'announcement',
          time: formatTimeAgo(ann.timestamp),
          timestamp: ann.timestamp,
          isStarred: starredIds.includes(`ann_${ann.id}`)
        }));

        setAnnouncements(formatted);
      } else {
        const errorData = await response.json().catch(() => ({}));
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
        setStarredIds(data.map(item => item.announcement));
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

      const toggle = list =>
        list.map(item => item.id === itemId ? { ...item, isStarred: !isStarred } : item);
      setAnnouncements(toggle);
      setPromotions(toggle);
    } catch (err) {
      console.error("Error toggling star:", err);
      setError("Failed to update star status");
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diffMs = new Date() - new Date(timestamp);
    const m = Math.floor(diffMs / 60000);
    const h = Math.floor(diffMs / 3600000);
    const d = Math.floor(diffMs / 86400000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m} min ago`;
    if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
    return `${d} day${d > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    setMounted(true);
    fetchStarred();
    fetchAnnouncements();
    fetchPromotions();
  }, []);

  useEffect(() => {
    setSidebarOpen(showMenu === true || showMenu === 'true');
  }, [showMenu]);

  const handleMuteOneHour     = () => { setMuteStatus('Muted for 1 hour'); setTimeout(() => setMuteStatus('Active'), 3600000); };
  const handleMuteUntilUnmute = () => setMuteStatus('Muted until unmuted');
  const handleUnmute          = () => setMuteStatus('Active');

  const allItems = () =>
    [...announcements, ...promotions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const getFilteredItems = () => {
    switch (activeFilter) {
      case 'important':     return allItems().filter(i => i.isStarred);
      case 'announcements': return announcements;
      case 'promotions':    return promotions;
      default:              return allItems();
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

  // ✅ Badge says "Owner" for announcements (was "A" / "Admin")
  const getTypeBadge = (type) => {
    switch (type) {
      case 'announcement':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">Owner</span>;
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
          --gold: #c8a96e; --gold-lt: #e2cfa0;
          --gold-dim: rgba(200,169,110,0.16); --gold-border: rgba(200,169,110,0.2);
          --ink: #080706; --ink-2: #0f0c09; --ink-3: #181410;
          --ivory: #f4efe5; --ivory-60: rgba(244,239,229,0.6); --ivory-30: rgba(244,239,229,0.3);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Outfit', sans-serif; background: var(--ink); color: var(--ivory); }
        .glass-card {
          background: rgba(10,9,7,0.68); backdrop-filter: blur(18px);
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
        .fade-up { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .star-btn { transition: all 0.2s ease; }
        .star-btn:hover { transform: scale(1.1); }
      `}</style>

      <div className="relative min-h-screen overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800&auto=format')", filter: 'brightness(0.6) saturate(1.2)' }} />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-black/40 to-amber-800/30" />
        </div>

        <div className="relative z-10 flex min-h-screen">

          {/* Sidebar */}
          {sidebarOpen && (
            <aside className="w-64 glass-card rounded-none border-l-0 border-t-0 border-b-0 shadow-2xl flex flex-col">
              <div className="p-6 border-b border-gold-border">
                <h2 className="font-serif text-2xl font-light text-ivory flex items-center gap-2">
                  <FaBell className="text-gold" /> Notifications
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
                  <button key={key} onClick={() => setActiveFilter(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                      activeFilter === key ? 'bg-gold-dim text-ivory' : 'text-ivory-60 hover:text-ivory hover:bg-gold-dim'
                    }`}>
                    {icon} {label}
                  </button>
                ))}
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

          {/* Main Content */}
          <main className="flex-1 p-8">
            <div className="max-w-4xl mx-auto">
              <button onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur border border-gold-border text-ivory-60 hover:text-ivory transition">
                {sidebarOpen ? '← Hide Menu' : '☰ Show Menu'}
              </button>

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
                    muteStatus === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>{muteStatus}</span>
                  <span className="ml-auto text-xs">
                    {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                  <FaTimes className="text-red-400 text-sm" />
                  <p className="text-red-400 text-sm flex-1">{error}</p>
                  <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
                    <FaTimes className="text-xs" />
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
                        {activeFilter === 'promotions'
                          ? <FaTags className="text-gray-500 text-2xl" />
                          : <FaBell className="text-gray-500 text-2xl" />}
                      </div>
                      <p className="text-gray-400">
                        {activeFilter === 'promotions'    && 'No promotions found'}
                        {activeFilter === 'announcements' && 'No owner announcements yet'}
                        {activeFilter === 'important'     && 'No important items'}
                        {activeFilter === 'all'           && 'No notifications'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {activeFilter === 'promotions'    && 'New promotions will appear here'}
                        {activeFilter === 'announcements' && 'When hotel owners send announcements to admin, they appear here'}
                        {activeFilter === 'important'     && 'Star items to see them here'}
                        {activeFilter === 'all'           && 'New notifications will appear here'}
                      </p>
                    </div>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <div key={item.id} className="glass-card rounded-lg p-5 fade-up group"
                        style={{ animationDelay: `${idx * 0.05}s` }}>
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
                                  title={item.isStarred ? "Remove from important" : "Mark as important"}>
                                  {item.isStarred
                                    ? <FaStar className="text-yellow-400 text-lg" />
                                    : <FaRegStar className="text-ivory-30 hover:text-yellow-400 text-lg transition" />}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2 mb-2">
                              <FaHotel className="text-amber-400 text-xs" />
                              <span className="text-xs text-amber-400/80 font-medium">
                                From: {item.hotelName}
                              </span>
                            </div>

                            <p className="text-ivory-60 text-sm mt-2 leading-relaxed border-l-2 border-gold-border pl-3">
                              {item.message}
                            </p>

                            {item.type === 'promotion' && item.validFrom && item.validTo && (
                              <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gold-border/30">
                                <span className="text-xs text-green-400/80">
                                  Valid: {item.validFrom} — {item.validTo}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  item.status === 'Active'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>{item.status || 'Upcoming'}</span>
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