'use client';
import { useState, useEffect } from 'react';
import { FaBell, FaCog, FaVolumeMute, FaVolumeUp, FaCheckCircle, FaExclamationTriangle, FaComment, FaGlobe } from 'react-icons/fa';

export default function NotificationSetting({ showMenu }) {
  const [muteStatus, setMuteStatus] = useState('Active');
  const [sidebarOpen, setSidebarOpen] = useState(showMenu);

  useEffect(() => {
    setSidebarOpen(showMenu);
  }, [showMenu]);

  const handleMuteOneHour = () => {
    setMuteStatus('Muted for 1 hour');
    setTimeout(() => setMuteStatus('Active'), 3600000);
  };

  const handleMuteUntilUnmute = () => {
    setMuteStatus('Muted until unmuted');
  };

  const handleUnmute = () => {
    setMuteStatus('Active');
  };

  // Sample notifications (can be fetched from API)
  const notifications = [
    { id: 1, title: 'New Booking', message: 'A new booking has been made for Deluxe Suite', type: 'info', time: '2 min ago' },
    { id: 2, title: 'System Update', message: 'System maintenance scheduled for tonight', type: 'warning', time: '1 hour ago' },
    { id: 3, title: 'Payment Received', message: 'Commission payment of NPR 12,000 received', type: 'success', time: '3 hours ago' },
    { id: 4, title: 'Feedback', message: 'New guest review: "Excellent service!"', type: 'comment', time: '5 hours ago' },
  ];

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <FaCheckCircle className="text-green-400" />;
      case 'warning': return <FaExclamationTriangle className="text-yellow-400" />;
      case 'comment': return <FaComment className="text-blue-400" />;
      default: return <FaBell className="text-amber-400" />;
    }
  };

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
          --ink-2:       #0f0c09;
          --ink-3:       #181410;
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
        .fade-up {
          animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
        }
      `}</style>

      <div className="relative min-h-screen overflow-hidden">
        {/* Bright background with overlay */}
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
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-ivory-60 hover:text-ivory hover:bg-gold-dim transition group">
                  <FaBell className="text-gold" /> Show All
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-ivory-60 hover:text-ivory hover:bg-gold-dim transition">
                  <FaExclamationTriangle className="text-yellow-400" /> Important
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-ivory-60 hover:text-ivory hover:bg-gold-dim transition">
                  <FaGlobe className="text-red-400" /> System Alerts
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-ivory-60 hover:text-ivory hover:bg-gold-dim transition">
                  <FaComment className="text-blue-400" /> Feedback
                </button>
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

              {/* Notifications Header */}
              <div className="mb-8" data-reveal>
                <h1 className="font-serif text-4xl md:text-5xl font-light text-ivory">All Notifications</h1>
                <div className="gold-divider w-24 mt-2" />
                <div className="mt-3 text-sm text-ivory-60 flex items-center gap-2">
                  <span>Current Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    muteStatus === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {muteStatus}
                  </span>
                </div>
              </div>

              {/* Notifications List */}
              <div className="space-y-4">
                {notifications.map((note, idx) => (
                  <div
                    key={note.id}
                    className="glass-card rounded-lg p-5 fade-up"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                    data-reveal
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(note.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h3 className="font-serif text-lg font-medium text-ivory">{note.title}</h3>
                          <span className="text-xs text-ivory-30 uppercase tracking-wider">{note.time}</span>
                        </div>
                        <p className="text-ivory-60 text-sm mt-1">{note.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Optional: Load More */}
              <div className="mt-8 text-center">
                <button className="px-6 py-2 rounded-full border border-gold-border text-ivory-60 hover:text-ivory hover:bg-gold-dim transition">
                  Load More Notifications
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Scroll reveal script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const reveals = document.querySelectorAll('[data-reveal]');
              const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                  if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                  }
                });
              }, { threshold: 0.12 });
              reveals.forEach(el => observer.observe(el));
            })();
          `,
        }}
      />
    </>
  );
}