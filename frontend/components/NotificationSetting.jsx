"use client";

import { useEffect, useRef, useState } from "react";
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
} from "react-icons/fa";

const API_BASE_URL = "http://localhost:8000";
const SEEN_KEY = "cloudinn_admin_seen_owner_announcements_at";
const SEEN_IDS_KEY = "cloudinn_admin_seen_owner_announcement_ids";
const SOUND_KEY = "cloudinn_admin_notification_sound_status";
const MUTE_UNTIL_KEY = "cloudinn_admin_notification_mute_until";

export default function NotificationSetting({ showMenu }) {
  const [muteStatus, setMuteStatus] = useState("Active");
  const [sidebarOpen, setSidebarOpen] = useState(
    showMenu === true || showMenu === "true"
  );
  const [activeFilter, setActiveFilter] = useState("all");
  const [announcements, setAnnouncements] = useState([]);
  const [starredKeys, setStarredKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const latestNotificationTimeRef = useRef(null);

  const getToken = () => {
    if (typeof window === "undefined") return null;

    return (
      localStorage.getItem("authToken") ||
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token")
    );
  };

  const getHeaders = () => {
    const token = getToken();

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    return headers;
  };

  const getRefreshToken = () => {
    if (typeof window === "undefined") return null;

    return (
      localStorage.getItem("refreshToken") ||
      localStorage.getItem("refresh") ||
      localStorage.getItem("refresh_token")
    );
  };

  const saveAccessToken = (token) => {
    if (!token || typeof window === "undefined") return;
    localStorage.setItem("authToken", token);
    localStorage.setItem("access", token);
  };

  const refreshAccessToken = async () => {
    const refresh = getRefreshToken();
    if (!refresh) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.access) return null;

      saveAccessToken(data.access);
      return data.access;
    } catch (err) {
      console.error("Token refresh failed:", err);
      return null;
    }
  };

  const authFetch = async (url, options = {}) => {
    const makeRequest = (tokenOverride = null) =>
      fetch(url, {
        ...options,
        credentials: options.credentials || "include",
        headers: {
          ...(tokenOverride
            ? { "Content-Type": "application/json", Authorization: "Bearer " + tokenOverride }
            : getHeaders()),
          ...(options.headers || {}),
        },
      });

    let res = await makeRequest();

    if (res.status === 401) {
      const newAccess = await refreshAccessToken();
      if (newAccess) res = await makeRequest(newAccess);
    }

    return res;
  };

  const makeKey = (type, id) => `${type}_${id}`;

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";

    const diff = new Date() - new Date(timestamp);
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);

    if (m < 1) return "Just now";
    if (m < 60) return `${m} min ago`;
    if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;

    return `${d} day${d > 1 ? "s" : ""} ago`;
  };

  const syncMuteStatus = () => {
    const stored = localStorage.getItem(SOUND_KEY) || "Active";
    const until = Number(localStorage.getItem(MUTE_UNTIL_KEY) || 0);

    if (stored === "Muted for 1 hour" && until && Date.now() > until) {
      localStorage.setItem(SOUND_KEY, "Active");
      localStorage.removeItem(MUTE_UNTIL_KEY);
      setMuteStatus("Active");
      return;
    }

    setMuteStatus(stored);
  };

  const normaliseOwnerAnnouncementItems = (data) => {
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.announcements)
      ? data.announcements
      : Array.isArray(data?.notifications)
      ? data.notifications
      : [];

    // This page is ONLY for Owner -> Admin notifications.
    // Backend now returns owner_to_admin only for ?recipient=admin, but this extra
    // filter protects the UI if older mixed records are still returned.
    return items.filter((item) => {
      const type = String(item.type || item.announcement_type || item.recipient || '').toLowerCase();
      if (!type) return true;
      return type.includes('owner_to_admin') || type === 'admin' || type.includes('recipient');
    });
  };

  const fetchStarred = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/starred-notifications/`, {
        method: "GET",
      });

      const data = await res.json().catch(() => []);

      const keys = Array.isArray(data)
        ? data.map((x) =>
            makeKey(x.announcement_type || "owner_to_admin", x.announcement)
          )
        : [];

      setStarredKeys(keys);
      return keys;
    } catch (err) {
      console.error("Error fetching starred:", err);
      return [];
    }
  };

  const markSeen = (items = announcements) => {
    if (typeof window === "undefined") return;

    const ids = items
      .map((x) => x.id)
      .filter((id) => id !== null && id !== undefined)
      .map((id) => `owner_to_admin_${String(id).replace("owner_to_admin_", "")}`);

    localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(ids));

    const latest = items
      .map((x) => new Date(x.timestamp).getTime())
      .filter(Boolean)
      .sort((a, b) => b - a)[0];

    localStorage.setItem(SEEN_KEY, String(latest || Date.now()));

    window.dispatchEvent(new Event("cloudinn-admin-owner-notifications-seen"));
  };

  const fetchAnnouncements = async (keys = starredKeys) => {
    setLoading(true);
    setError("");

    try {
      const res = await authFetch(
        `${API_BASE_URL}/api/owner-recent-announcements/?recipient=admin`,
        {
          method: "GET",
        }
      );

      const data = await res.json().catch(() => []);

      if (!res.ok) {
        throw new Error(data.error || "Failed to load owner announcements");
      }

      let items = normaliseOwnerAnnouncementItems(data);

      if (items.length === 0) {
        const fallbackRes = await authFetch(`${API_BASE_URL}/api/owner-recent-announcements/`, {
          method: "GET",
        });

        const fallbackData = await fallbackRes.json().catch(() => []);

        if (fallbackRes.ok) {
          items = normaliseOwnerAnnouncementItems(fallbackData);
        }
      }

      const formatted = items
        .map((ann) => {
          const type = ann.type || ann.announcement_type || "owner_to_admin";
          const timestamp =
            ann.timestamp ||
            ann.created_at ||
            ann.createdAt ||
            ann.date ||
            new Date().toISOString();

          return {
            id: `owner_to_admin_${ann.id}`,
            originalId: ann.id,
            title: ann.title || "Announcement",
            message: ann.content || ann.message || ann.description || "",
            hotelName:
              ann.hotel_name ||
              ann.hotel?.name ||
              ann.owner_hotel_name ||
              ann.hotel ||
              ann.owner_name ||
              "Hotel Owner",
            type,
            time: formatTimeAgo(timestamp),
            timestamp,
            isStarred: keys.includes(makeKey(type, ann.id)),
          };
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      if (formatted.length > 0) {
        latestNotificationTimeRef.current = formatted[0].timestamp;
      }

      setAnnouncements(formatted);
      markSeen(formatted);
    } catch (err) {
      console.error("Error fetching owner announcements:", err);
      setError(err.message || "Network error while loading owner notifications");
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    const keys = await fetchStarred();
    await fetchAnnouncements(keys);
  };

  const toggleStar = async (item) => {
    const key = makeKey(item.type, item.originalId);
    const wasStarred = item.isStarred;

    setAnnouncements((prev) =>
      prev.map((x) =>
        x.id === item.id ? { ...x, isStarred: !wasStarred } : x
      )
    );

    setStarredKeys((prev) =>
      wasStarred
        ? prev.filter((k) => k !== key)
        : [...new Set([...prev, key])]
    );

    try {
      if (wasStarred) {
        const res = await authFetch(
          `${API_BASE_URL}/api/star-notification/${item.type}/${item.originalId}/`,
          {
            method: "DELETE",
          }
        );

        if (!res.ok) throw new Error("Failed to unstar notification");
      } else {
        const res = await authFetch(`${API_BASE_URL}/api/star-notification/`, {
          method: "POST",
          body: JSON.stringify({
            announcement: item.originalId,
            announcement_type: item.type,
          }),
        });

        if (!res.ok) throw new Error("Failed to star notification");
      }
    } catch (err) {
      console.error("Error toggling star:", err);
      setError("Failed to update important notification");
      await refreshAll();
      setTimeout(() => setError(""), 3000);
    }
  };

  useEffect(() => {
    setMounted(true);
    syncMuteStatus();
    refreshAll();
  }, []);

  useEffect(() => {
    setSidebarOpen(showMenu === true || showMenu === "true");
  }, [showMenu]);

  const handleMuteOneHour = () => {
    localStorage.setItem(SOUND_KEY, "Muted for 1 hour");
    localStorage.setItem(MUTE_UNTIL_KEY, String(Date.now() + 3600000));
    setMuteStatus("Muted for 1 hour");
  };

  const handleMuteUntilUnmute = () => {
    localStorage.setItem(SOUND_KEY, "Muted until unmuted");
    localStorage.removeItem(MUTE_UNTIL_KEY);
    setMuteStatus("Muted until unmuted");
  };

  const handleUnmute = () => {
    localStorage.setItem(SOUND_KEY, "Active");
    localStorage.removeItem(MUTE_UNTIL_KEY);
    setMuteStatus("Active");
  };

  const filteredItems =
    activeFilter === "important"
      ? announcements.filter((item) => item.isStarred)
      : announcements;

  const pageTitle =
    activeFilter === "important"
      ? "Important Notifications"
      : activeFilter === "announcements"
      ? "Announcements"
      : "All Notifications";

  const emptyTitle =
    activeFilter === "important"
      ? "No important notifications yet"
      : activeFilter === "announcements"
      ? "No announcements yet"
      : "No notifications yet";

  if (!mounted) return null;

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap");

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

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Outfit", sans-serif;
          background: var(--ink);
          color: var(--ivory);
        }

        .glass-card {
          background: rgba(10, 9, 7, 0.68);
          backdrop-filter: blur(18px);
          border: 1px solid var(--gold-border);
          transition: border-color 0.3s, box-shadow 0.4s, transform 0.3s;
        }

        .glass-card:hover {
          border-color: rgba(200, 169, 110, 0.42);
          box-shadow: 0 28px 64px rgba(0, 0, 0, 0.65);
          transform: translateY(-4px);
        }

        .gold-divider {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--gold-border),
            transparent
          );
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-up {
          animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .star-btn {
          transition: all 0.2s;
        }

        .star-btn:hover {
          transform: scale(1.1);
        }
      `}</style>

      <div className="relative min-h-screen overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800&auto=format')",
              filter: "brightness(.6) saturate(1.2)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-black/40 to-amber-800/30" />
        </div>

        <div className="relative z-10 flex min-h-screen">
          {sidebarOpen && (
            <aside className="w-64 glass-card rounded-none border-l-0 border-t-0 border-b-0 shadow-2xl flex flex-col">
              <div className="p-6 border-b border-gold-border">
                <h2 className="font-serif text-2xl font-light text-ivory flex items-center gap-2">
                  <FaBell className="text-gold" />
                  Admin Notifications
                </h2>
                <div className="gold-divider mt-2" />
              </div>

              <nav className="flex-1 p-4 space-y-2">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    activeFilter === "all"
                      ? "bg-gold-dim text-ivory"
                      : "text-ivory-60 hover:text-ivory hover:bg-gold-dim"
                  }`}
                >
                  <FaBell className="text-ivory" />
                  All
                </button>

                <button
                  onClick={() => setActiveFilter("important")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    activeFilter === "important"
                      ? "bg-gold-dim text-ivory"
                      : "text-ivory-60 hover:text-ivory hover:bg-gold-dim"
                  }`}
                >
                  <FaStar className="text-yellow-400" />
                  Important
                </button>

                <button
                  onClick={() => setActiveFilter("announcements")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    activeFilter === "announcements"
                      ? "bg-gold-dim text-ivory"
                      : "text-ivory-60 hover:text-ivory hover:bg-gold-dim"
                  }`}
                >
                  <FaBullhorn className="text-purple-400" />
                  Announcements
                </button>
              </nav>

              <div className="p-4 border-t border-gold-border">
                <h3 className="font-serif text-lg font-light text-ivory flex items-center gap-2 mb-3">
                  <FaCog className="text-gold" />
                  Sound Settings
                </h3>

                <div className="space-y-2">
                  <button
                    onClick={handleMuteOneHour}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gold-dim hover:bg-gold-dim/80 text-gold-lt transition"
                  >
                    <FaVolumeMute />
                    Mute for 1 Hour
                  </button>

                  <button
                    onClick={handleMuteUntilUnmute}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gold-dim hover:bg-gold-dim/80 text-gold-lt transition"
                  >
                    <FaVolumeMute />
                    Mute Until Unmute
                  </button>

                  <button
                    onClick={handleUnmute}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 transition"
                  >
                    <FaVolumeUp />
                    Unmute
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
                {sidebarOpen ? "← Hide Menu" : "☰ Show Menu"}
              </button>

              <div className="mb-8">
                <h1 className="font-serif text-4xl md:text-5xl font-light text-ivory">
                  {pageTitle}
                </h1>

                <div className="gold-divider w-24 mt-2" />

                <div className="mt-3 text-sm text-ivory-60 flex items-center gap-2">
                  <span>Status:</span>

                  <span
                    className={`px-2 py-.5 rounded-full text-xs font-medium ${
                      muteStatus === "Active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {muteStatus}
                  </span>

                  <span className="ml-auto text-xs">
                    {filteredItems.length} item
                    {filteredItems.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                  <FaTimes className="text-red-400 text-sm" />
                  <p className="text-red-400 text-sm flex-1">{error}</p>

                  <button onClick={() => setError("")}>
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
                        Notifications sent by hotel owners to Admin will appear
                        here.
                      </p>
                    </div>
                  ) : (
                    filteredItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="glass-card rounded-lg p-5 fade-up group"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-start gap-4">
                          <FaBullhorn className="text-purple-400 text-lg mt-1" />

                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-serif text-lg font-medium text-ivory">
                                  Announcement
                                </h3>

                                <span className="text-xs px-2 py-.5 rounded-full bg-purple-500/20 text-purple-300">
                                  Owner
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-xs text-ivory-30 uppercase tracking-wider">
                                  {item.time}
                                </span>

                                <button
                                  onClick={() => toggleStar(item)}
                                  className="star-btn focus:outline-none"
                                >
                                  {item.isStarred ? (
                                    <FaStar className="text-yellow-400 text-lg" />
                                  ) : (
                                    <FaRegStar className="text-ivory-30 hover:text-yellow-400 text-lg transition" />
                                  )}
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
