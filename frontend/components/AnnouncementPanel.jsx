"use client";

import { useEffect, useState } from "react";
import { FaTimes, FaBullhorn, FaPaperPlane, FaCheckCircle, FaSpinner } from "react-icons/fa";

const API_BASE_URL = "http://localhost:8000";

export default function AnnouncementPanel({ isOpen, onClose }) {
  const [message, setMessage] = useState("");
  const [hotelFilter, setHotelFilter] = useState("active");
  const [announcements, setAnnouncements] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState("");
  const [sendError, setSendError] = useState("");

  const getToken = () =>
    localStorage.getItem("authToken") ||
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const getAuthHeaders = () => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const getTargetName = (value) => {
    if (value === "active") return "Active Hotels";
    if (value === "inactive") return "Inactive Hotels";
    return "All Hotels";
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString([], {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/recent-announcements/`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => []);
      setAnnouncements(res.ok && Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching recent announcements:", err);
      setAnnouncements([]);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAnnouncements();
  }, [isOpen]);

  const handleSend = async () => {
    if (!message.trim()) {
      setSendError("Please write announcement message.");
      return;
    }

    setSending(true);
    setSendSuccess("");
    setSendError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/send-announcement/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: message.trim(),
          hotel_status: hotelFilter,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        setSendError(data.error || "Failed to send announcement.");
        return;
      }

      setSendSuccess(`Announcement sent to ${getTargetName(hotelFilter)}. Total hotels: ${data.sent_to || 0}`);
      setMessage("");
      await fetchAnnouncements();
      setTimeout(() => setSendSuccess(""), 3500);
    } catch (err) {
      console.error("Network error:", err);
      setSendError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />}

      <div className={`fixed top-0 right-0 h-full w-full sm:w-[550px] bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl shadow-2xl z-50 transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"} border-l border-white/10`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                <FaBullhorn className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Announcement Center</h2>
                <p className="text-xs text-gray-400">Send announcements to active, inactive or all hotels</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <FaTimes className="text-gray-300 text-sm" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Announcement Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your announcement..."
                  className="w-full h-36 p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Send to</label>
                <select
                  value={hotelFilter}
                  onChange={(e) => setHotelFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  <option value="active">Active Hotels</option>
                  <option value="inactive">Inactive Hotels</option>
                  <option value="all">All Hotels</option>
                </select>
              </div>

              {sendSuccess && <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm">{sendSuccess}</div>}
              {sendError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
                  <span>{sendError}</span>
                  <button onClick={() => setSendError("")}><FaTimes className="text-xs" /></button>
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <><FaSpinner className="animate-spin" />Sending...</> : <><FaPaperPlane />Send to {getTargetName(hotelFilter)}</>}
              </button>

              <div className="mt-6 pt-4 border-t border-white/10">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <FaCheckCircle className="text-green-400 text-xs" />Recent Announcements
                </h3>

                {announcements.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No recent announcements sent yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {announcements.map((item) => (
                      <li key={`${item.type || "admin_to_owner"}-${item.id}`} className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition">
                        <p className="text-sm text-white mb-2">{item.content || item.message}</p>
                        <div className="text-xs text-gray-400 flex items-center flex-wrap gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200">Admin</span>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200">{item.target_label || item.display_name || "Hotels"}</span>
                          <span>•</span>
                          <span>{formatDateTime(item.timestamp || item.created_at)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
