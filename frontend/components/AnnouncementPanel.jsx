'use client';
import { useState } from 'react';

export default function AnnouncementPanel({ isOpen, onClose }) {
  const [message, setMessage] = useState('');
  const [sendToOwner, setSendToOwner] = useState(false);
  const [sendToManager, setSendToManager] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  const handleSend = () => {
    if (!message.trim()) return;

    const payload = {
      content: message,
      recipients: sendToManager
        ? ['owner', 'manager']
        : sendToOwner
        ? ['owner']
        : [],
      timestamp: new Date().toISOString(),
    };

    // 🔧 Replace with actual DB/API call
    console.log('Saving announcement to DB:', payload);

    setAnnouncements(prev => [payload, ...prev]);
    setMessage('');
    setSendToOwner(false);
    setSendToManager(false);
    onClose(); // close panel after sending
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
              checked={sendToOwner}
              onChange={() => setSendToOwner(!sendToOwner)}
            />
            <span className="text-sm text-gray-700">Send to Owner</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sendToManager}
              onChange={() => setSendToManager(!sendToManager)}
            />
            <span className="text-sm text-gray-700">Send to Owner & Manager</span>
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
            Recent Announcements
          </h3>
          <ul className="space-y-2">
            {announcements.map((a, idx) => (
              <li
                key={idx}
                className="bg-gray-100 p-3 rounded-lg text-sm text-gray-800"
              >
                <div className="mb-1">{a.content}</div>
                <div className="text-xs text-gray-500">
                  Sent to: {a.recipients.join(', ') || 'None'} •{' '}
                  {new Date(a.timestamp).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
