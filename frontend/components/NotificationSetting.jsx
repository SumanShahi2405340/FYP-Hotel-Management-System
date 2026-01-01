'use client';
import { useState, useEffect } from 'react';

export default function NotificationSetting({ showMenu }) {
  const [muteStatus, setMuteStatus] = useState('Active');
  const [sidebarOpen, setSidebarOpen] = useState(showMenu); // local toggle state

  // keep local state in sync if prop changes
  useEffect(() => {
    setSidebarOpen(showMenu);
  }, [showMenu]);

  const handleMuteOneHour = () => {
    setMuteStatus('Muted for 1 hour');
    setTimeout(() => setMuteStatus('Active'), 3600000); // reset after 1 hour
  };

  const handleMuteUntilUnmute = () => {
    setMuteStatus('Muted until unmuted');
  };

  const handleUnmute = () => {
    setMuteStatus('Active');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar — only shows when sidebarOpen is true */}
      {sidebarOpen && (
        <aside className="w-64 bg-gray-900 text-white p-6 space-y-6">
          <h2 className="text-xl font-bold mb-4">Notifications</h2>
          <div className="flex flex-col gap-3">
            <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">
              Show All Notifications
            </button>

            <button className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700">
              Important Notifications
            </button>

            <button className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black">
              Email Notifications
            </button>
            
            <button className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 whitespace-nowrap w-fit">
              System Alert Notifications
            </button>

            <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700">
              Feedbacks Notifications
            </button>
          </div>


          <h2 className="text-xl font-bold mt-8 mb-4">Settings</h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleMuteOneHour}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700"
            >
              Mute for 1 Hour
            </button>
            <button
              onClick={handleMuteUntilUnmute}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700"
            >
              Mute Until Unmute
            </button>
            <button
              onClick={handleUnmute}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700"
            >
              Unmute
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 p-10">
        {/* Toggle Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mb-6 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
        >
          {sidebarOpen ? 'Hide Menu' : 'Show Menu'}
        </button>

        <h1 className="text-3xl font-bold mb-6">All Notifications</h1>
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg shadow">📢 Notification 1</div>
          <div className="p-4 bg-white rounded-lg shadow">📢 Notification 2</div>
          <div className="p-4 bg-white rounded-lg shadow">📢 Notification 3</div>
        </div>

        <div className="mt-10 text-gray-700">
          <strong>Status:</strong> {muteStatus}
        </div>
      </main>
    </div>
  );
}


