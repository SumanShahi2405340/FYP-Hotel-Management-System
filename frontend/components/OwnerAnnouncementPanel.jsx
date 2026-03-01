'use client';
import { useState, useEffect } from 'react';

export default function AnnouncementPanel({ isOpen, onClose }) {
  const [message, setMessage] = useState('');
  const [sendToAdmin, setSendToAdmin] = useState(false);
  const [sendToReceptionist, setSendToReceptionist] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  // Fetch recent announcements when panel opens
  useEffect(() => {
    if (isOpen) {
      fetch("http://localhost:8000/api/owner-recent-announcements/")
        .then(res => res.json())
        .then(data => {
          const items = Array.isArray(data) ? data : data.results || [];
          setAnnouncements(items);
        })
        .catch(err => console.error("Error fetching announcements:", err));
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      const response = await fetch("http://localhost:8000/api/owner-send-announcement/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          sendToAdmin: sendToAdmin,
          sendToReceptionist: sendToReceptionist,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const saved = [];
        if (data.saved?.admin) {
          saved.push({
            content: data.saved.admin.message,
            recipients: ["admin"],
            timestamp: data.saved.admin.created_at,
          });
        }
        if (data.saved?.receptionist) {
          saved.push({
            content: data.saved.receptionist.message,
            recipients: ["receptionist"],
            timestamp: data.saved.receptionist.created_at,
          });
        }

        setAnnouncements(prev => [...saved, ...prev]);
        setMessage('');
        setSendToAdmin(false);
        setSendToReceptionist(false);
        onClose();
      } else {
        console.error("Error saving announcement:", data.error);
      }
    } catch (err) {
      console.error("Network error:", err);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-30 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Send Announcement</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg font-bold"
          >
            ×
          </button>
        </div>

        {/* Message box */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your announcement... ✨📢"
          className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
        />

        {/* Recipient checkboxes */}
        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sendToAdmin}
              onChange={() => setSendToAdmin(!sendToAdmin)}
            />
            <span className="text-sm text-gray-700">Send to Admin</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sendToReceptionist}
              onChange={() => setSendToReceptionist(!sendToReceptionist)}
            />
            <span className="text-sm text-gray-700">Send to Receptionist</span>
          </label>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md"
        >
          Send Announcement
        </button>

        {/* Announcement history */}
        <div className="mt-6 overflow-y-auto flex-1">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            Recent Owner Announcements
          </h3>
          <ul className="space-y-2">
            {Array.isArray(announcements) &&
              announcements.map((a, idx) => (
                <li
                  key={idx}
                  className="bg-gray-100 p-3 rounded-lg text-sm text-gray-800"
                >
                  <div className="mb-1">{a.content}</div>
                  <div className="text-xs text-gray-500">
                    Sent to: {a.recipients?.join(', ') || 'None'} • 
                    From Owner of ({a.hotel_name}) •{" "}
                    {a.timestamp ? new Date(a.timestamp).toLocaleString() : ""}
                  </div>

                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
