// 'use client';
// import { useState, useEffect } from 'react';

// export default function OwnerNotificationSetting({ showMenu }) {
//   // State for mute/unmute status
//   const [muteStatus, setMuteStatus] = useState('Active');

//   // Sidebar open/close toggle
//   const [sidebarOpen, setSidebarOpen] = useState(showMenu);

//   // Notifications data
//   const [announcements, setAnnouncements] = useState([]);
//   const [systemAlerts, setSystemAlerts] = useState([]);

//   // View toggles
//   const [showSystemAlertsOnly, setShowSystemAlertsOnly] = useState(false);
//   const [starredIds, setStarredIds] = useState([]);
//   const [showStarredOnly, setShowStarredOnly] = useState(false);

//   // Toggle star on/off for a notification
//   const toggleStar = (id) => {
//     setStarredIds((prev) =>
//       prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
//     );
//   };

//    // Load starred notifications from localStorage on first render
//   useEffect(() => {
//     const storedStars = localStorage.getItem('starredNotificationIds');
//     if (storedStars) {
//       setStarredIds(JSON.parse(storedStars));
//     }
//   }, []);

//   // Save starred notifications to localStorage whenever they change
//   useEffect(() => {
//     localStorage.setItem('starredNotificationIds', JSON.stringify(starredIds));
//   }, [starredIds]);


//    // Show starred notifications in (Important section)
//   const handleImportantNotifications = () => {
//     setShowStarredOnly(true);
//     setShowSystemAlertsOnly(false);
//   };



//   // Fetch system alerts (owner-only notifications)
//   const handleSystemAlerts = () => {
//     fetch('http://localhost:8000/api/recent-announcements/')
//       .then((res) => res.json())
//       .then((data) => {
//         const parsed = Array.isArray(data) ? data : data.announcements || [];
//         const ownerOnly = parsed.filter((item) =>
//           item.recipients.includes('owner')
//         );
//         setSystemAlerts(ownerOnly);
//         setShowSystemAlertsOnly(true);
//         setShowStarredOnly(false);
//       })
//       .catch((err) => console.error('Failed to fetch system alerts:', err));
//   };


//   // Sync sidebar state with props
//   useEffect(() => {
//     setSidebarOpen(showMenu);
//   }, [showMenu]);

//   // Fetch all notification but for now owner announcements notifications are only fetched 
//   useEffect(() => {
//     fetch('http://localhost:8000/api/recent-announcements/')
//       .then((res) => res.json())
//       .then((data) => {
//         const parsed = Array.isArray(data) ? data : data.announcements || [];
//         const ownerOnly = parsed.filter((item) =>
//           item.recipients.includes('owner')
//         );
//         setAnnouncements(ownerOnly);
//       })
//       .catch((err) => console.error('Failed to fetch announcements:', err));
//   }, []);

//   // Mute/unmute handlers
//   const handleMuteOneHour = () => {
//     setMuteStatus('Muted for 1 hour');
//     setTimeout(() => setMuteStatus('Active'), 3600000);
//   };
//   const handleMuteUntilUnmute = () => setMuteStatus('Muted until unmuted');
//   const handleUnmute = () => setMuteStatus('Active');

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       {/* Sidebar section */}
//       {sidebarOpen && (
//         <aside className="w-64 bg-gray-900 text-white p-6 space-y-6">
//           <h2 className="text-xl font-bold mb-4">Notifications</h2>
//           <div className="flex flex-col gap-3">
//             {/* Show all notifications */}
//             <button
//               onClick={() => {
//                 setShowSystemAlertsOnly(false);
//                 setShowStarredOnly(false);
//               }}
//               className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
//             >
//               Show All Notifications
//             </button>

//             {/* Show starred notifications */}
//             <button
//               onClick={handleImportantNotifications}
//               className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700"
//             >
//               Important Notifications
//             </button>

//             {/* Show system alerts */}
//             <button
//               onClick={handleSystemAlerts}
//               className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 whitespace-nowrap w-fit"
//             >
//               System Alert Notifications
//             </button>

//             {/* Feedback notifications placeholder */}
//             <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700">
//               Feedbacks Notifications
//             </button>
//           </div>

//           {/* Settings section */}
//           <h2 className="text-xl font-bold mt-8 mb-4">Settings</h2>
//           <div className="flex flex-col gap-3">
//             <button
//               onClick={handleMuteOneHour}
//               className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700"
//             >
//               Mute for 1 Hour
//             </button>
//             <button
//               onClick={handleMuteUntilUnmute}
//               className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700"
//             >
//               Mute Until Unmute
//             </button>
//             <button
//               onClick={handleUnmute}
//               className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700"
//             >
//               Unmute
//             </button>
//           </div>
//         </aside>
//       )}

//       {/* Main content section */}
//       <main className="flex-1 p-10">
//         {/* Toggle sidebar button */}
//         <button
//           onClick={() => setSidebarOpen(!sidebarOpen)}
//           className="mb-6 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
//         >
//           {sidebarOpen ? 'Hide Menu' : 'Show Menu'}
//         </button>

//         {/* Heading changes based on view */}
//         <h1 className="text-3xl font-bold mb-6">
//           {showSystemAlertsOnly
//             ? 'System Alerts'
//             : showStarredOnly
//             ? 'Important Notifications'
//             : 'All Notifications'}
//         </h1>

//         {/* Notifications list */}
//         <div className="space-y-4">
//           {showSystemAlertsOnly ? (
//             // System alerts (no stars here)
//             systemAlerts.length > 0 ? (
//               systemAlerts.map((item, index) => (
//                 <div
//                   key={item.id || index}
//                   className="p-4 bg-red-100 border border-red-400 rounded-lg shadow"
//                 >
//                   <div className="font-semibold">🚨 {item.content}</div>
//                   <div className="text-sm text-red-700">
//                     Sent to {item.recipients.join(', ')} from admin •{' '}
//                     {new Date(item.timestamp).toLocaleString()}
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div className="text-gray-500">No system alerts available.</div>
//             )
//           ) : (
//             // All notifications + starred notifications (stars visible here)
//             (showStarredOnly
//               ? announcements.filter((item, index) =>
//                   starredIds.includes(item.id || index)
//                 )
//               : announcements
//             ).map((item, index) => {
//               const id = item.id || index;
//               const isStarred = starredIds.includes(id);
//               return (
//                 <div
//                   key={id}
//                   className="p-4 bg-white rounded-lg shadow flex justify-between items-center"
//                 >
//                   <div>
//                     <div className="font-semibold">📢 {item.content}</div>
//                     <div className="text-sm text-gray-500">
//                       Sent to {item.recipients.join(', ')} from admin •{' '}
//                       {new Date(item.timestamp).toLocaleString()}
//                     </div>
                  
//                   {/* Star button only in All/Important notifications */}
//                   </div>
//                   <button
//                     onClick={() => toggleStar(id)}
//                     className="text-2xl"
//                     title="Star this notification"
//                   >
//                     {isStarred ? '⭐' : '☆'}
//                   </button>
//                 </div>
//               );
//             })
//           )}
//         </div>
        
//         {/* Status section */}
//         <div className="mt-10 text-gray-700">
//           <strong>Status:</strong> {muteStatus}
//         </div>
//       </main>
//     </div>
//   );
// }









// 'use client';
// import { useState, useEffect } from 'react';

// export default function OwnerNotificationSetting({ showMenu }) {
//   const [muteStatus, setMuteStatus] = useState('Active');
//   const [sidebarOpen, setSidebarOpen] = useState(showMenu);
//   const [announcements, setAnnouncements] = useState([]);
//   const [systemAlerts, setSystemAlerts] = useState([]);
//   const [showSystemAlertsOnly, setShowSystemAlertsOnly] = useState(false);
//   const [starredIds, setStarredIds] = useState([]);
//   const [showStarredOnly, setShowStarredOnly] = useState(false);

//   // Fetch starred notifications from backend 
//   useEffect(() => {
//     fetch('http://localhost:8000/api/starred-notifications/', {
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     })
//       .then((res) => res.json())
//       .then((data) => {
//         console.log('🔍 Starred response:', data); // Debug log

//         if (Array.isArray(data)) {
//           const ids = data.map((item) => item.announcement);
//           setStarredIds(ids);
//         } else {
//           console.error('❌ Unexpected response format:', data);
//         }
//       })
//       .catch((err) => console.error('Failed to fetch starred notifications:', err));
//   }, []);

//   // Toggle star/unstar and sync with backend
//   const toggleStar = (id) => {
//     if (starredIds.includes(id)) {
//       fetch(`http://localhost:8000/api/star-notification/${id}/`, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       })
//         .then(() => {
//           setStarredIds((prev) => prev.filter((item) => item !== id));
//         })
//         .catch((err) => console.error('Failed to unstar notification:', err));
//     } else {
//       fetch('http://localhost:8000/api/star-notification/', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ announcement: id }),
//       })
//         .then(() => {
//           setStarredIds((prev) => [...prev, id]);
//         })
//         .catch((err) => console.error('Failed to star notification:', err));
//     }
//   };

//   const handleImportantNotifications = () => {
//     setShowStarredOnly(true);
//     setShowSystemAlertsOnly(false);
//   };

//   const handleSystemAlerts = () => {
//     fetch('http://localhost:8000/api/recent-announcements/')
//       .then((res) => res.json())
//       .then((data) => {
//         const parsed = Array.isArray(data) ? data : data.announcements || [];
//         const ownerOnly = parsed.filter((item) =>
//           item.recipients.includes('owner')
//         );
//         setSystemAlerts(ownerOnly);
//         setShowSystemAlertsOnly(true);
//         setShowStarredOnly(false);
//       })
//       .catch((err) => console.error('Failed to fetch system alerts:', err));
//   };

//   useEffect(() => {
//     setSidebarOpen(showMenu);
//   }, [showMenu]);

//   useEffect(() => {
//     fetch('http://localhost:8000/api/recent-announcements/')
//       .then((res) => res.json())
//       .then((data) => {
//         const parsed = Array.isArray(data) ? data : data.announcements || [];
//         const ownerOnly = parsed.filter((item) =>
//           item.recipients.includes('owner')
//         );
//         setAnnouncements(ownerOnly);
//       })
//       .catch((err) => console.error('Failed to fetch announcements:', err));
//   }, []);

//   const handleMuteOneHour = () => {
//     setMuteStatus('Muted for 1 hour');
//     setTimeout(() => setMuteStatus('Active'), 3600000);
//   };
//   const handleMuteUntilUnmute = () => setMuteStatus('Muted until unmuted');
//   const handleUnmute = () => setMuteStatus('Active');

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       {sidebarOpen && (
//         <aside className="w-64 bg-gray-900 text-white p-6 space-y-6">
//           <h2 className="text-xl font-bold mb-4">Notifications</h2>
//           <div className="flex flex-col gap-3">
//             <button
//               onClick={() => {
//                 setShowSystemAlertsOnly(false);
//                 setShowStarredOnly(false);
//               }}
//               className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
//             >
//               Show All Notifications
//             </button>
//             <button
//               onClick={handleImportantNotifications}
//               className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700"
//             >
//               Important Notifications
//             </button>
//             <button
//               onClick={handleSystemAlerts}
//               className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 whitespace-nowrap w-fit"
//             >
//               System Alert Notifications
//             </button>
//             <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700">
//               Feedbacks Notifications
//             </button>
//           </div>

//           <h2 className="text-xl font-bold mt-8 mb-4">Settings</h2>
//           <div className="flex flex-col gap-3">
//             <button
//               onClick={handleMuteOneHour}
//               className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700"
//             >
//               Mute for 1 Hour
//             </button>
//             <button
//               onClick={handleMuteUntilUnmute}
//               className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700"
//             >
//               Mute Until Unmute
//             </button>
//             <button
//               onClick={handleUnmute}
//               className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700"
//             >
//               Unmute
//             </button>
//           </div>
//         </aside>
//       )}

//       <main className="flex-1 p-10">
//         <button
//           onClick={() => setSidebarOpen(!sidebarOpen)}
//           className="mb-6 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
//         >
//           {sidebarOpen ? 'Hide Menu' : 'Show Menu'}
//         </button>

//         <h1 className="text-3xl font-bold mb-6">
//           {showSystemAlertsOnly
//             ? 'System Alerts'
//             : showStarredOnly
//             ? 'Important Notifications'
//             : 'All Notifications'}
//         </h1>

//         <div className="space-y-4">
//           {showSystemAlertsOnly ? (
//             systemAlerts.length > 0 ? (
//               systemAlerts.map((item, index) => (
//                 <div
//                   key={item.id || index}
//                   className="p-4 bg-red-100 border border-red-400 rounded-lg shadow"
//                 >
//                   <div className="font-semibold">🚨 {item.content}</div>
//                   <div className="text-sm text-red-700">
//                     Sent to {item.recipients.join(', ')} from admin •{' '}
//                     {new Date(item.timestamp).toLocaleString()}
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div className="text-gray-500">No system alerts available.</div>
//             )
//           ) : (
//             (showStarredOnly
//               ? announcements.filter((item, index) =>
//                   starredIds.includes(item.id || index)
//                 )
//               : announcements
//             ).map((item, index) => {
//               const id = item.id || index;
//               const isStarred = starredIds.includes(id);
//               return (
//                 <div
//                   key={id}
//                   className="p-4 bg-white rounded-lg shadow flex justify-between items-center"
//                 >
//                   <div>
//                     <div className="font-semibold">📢 {item.content}</div>
//                     <div className="text-sm text-gray-500">
//                       Sent to {item.recipients.join(', ')} from admin •{' '}
//                       {new Date(item.timestamp).toLocaleString()}
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => toggleStar(id)}
//                     className="text-2xl"
//                     title="Star this notification"
//                   >
//                     {isStarred ? '⭐' : '☆'}
//                   </button>
//                 </div>
//               );
//             })
//           )}
//         </div>

//         <div className="mt-10 text-gray-700">
//           <strong>Status:</strong> {muteStatus}
//         </div>
//       </main>
//     </div>
//   );
// }












'use client';
import { useState, useEffect } from 'react';

export default function OwnerNotificationSetting({ showMenu }) {
  const [muteStatus, setMuteStatus] = useState('Active');
  const [sidebarOpen, setSidebarOpen] = useState(showMenu);
  const [announcements, setAnnouncements] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [showSystemAlertsOnly, setShowSystemAlertsOnly] = useState(false);
  const [starredIds, setStarredIds] = useState([]);
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // Fetch starred notifications
  useEffect(() => {
    fetch('http://localhost:8000/api/starred-notifications/', {
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const ids = data.map((item) => item.announcement);
          setStarredIds(ids);
        }
      })
      .catch((err) => console.error('Failed to fetch starred notifications:', err));
  }, []);

  // Toggle star/unstar
  const toggleStar = (id) => {
    if (starredIds.includes(id)) {
      fetch(`http://localhost:8000/api/star-notification/${id}/`, {
        method: 'DELETE',
      })
        .then((res) => {
          if (res.status === 204) {
            setStarredIds((prev) => prev.filter((item) => item !== id));
          } else {
            console.error('Failed to unstar notification:', res.status);
          }
        })
        .catch((err) => console.error('Failed to unstar notification:', err));
    } else {
      fetch('http://localhost:8000/api/star-notification/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement: id }),
      })
        .then((res) => {
          if (res.ok) {
            setStarredIds((prev) => [...prev, id]);
          } else {
            res.json().then((err) => console.error('Failed to star notification:', err));
          }
        })
        .catch((err) => console.error('Failed to star notification:', err));
    }
  };

  const handleImportantNotifications = () => {
    setShowStarredOnly(true);
    setShowSystemAlertsOnly(false);
  };

  const handleSystemAlerts = () => {
    fetch('http://localhost:8000/api/recent-announcements/')
      .then((res) => res.json())
      .then((data) => {
        const ownerOnly = data.filter((item) => item.recipients.includes('owner'));
        setSystemAlerts(ownerOnly);
        setShowSystemAlertsOnly(true);
        setShowStarredOnly(false);
      })
      .catch((err) => console.error('Failed to fetch system alerts:', err));
  };

  useEffect(() => {
    setSidebarOpen(showMenu);
  }, [showMenu]);

  useEffect(() => {
    fetch('http://localhost:8000/api/recent-announcements/')
      .then((res) => res.json())
      .then((data) => {
        const ownerOnly = data.filter((item) => item.recipients.includes('owner'));
        setAnnouncements(ownerOnly);
      })
      .catch((err) => console.error('Failed to fetch announcements:', err));
  }, []);

  const handleMuteOneHour = () => {
    setMuteStatus('Muted for 1 hour');
    setTimeout(() => setMuteStatus('Active'), 3600000);
  };
  const handleMuteUntilUnmute = () => setMuteStatus('Muted until unmuted');
  const handleUnmute = () => setMuteStatus('Active');

  return (
    <div className="flex min-h-screen bg-gray-100">
      {sidebarOpen && (
        <aside className="w-64 bg-gray-900 text-white p-6 space-y-6">
          <h2 className="text-xl font-bold mb-4">Notifications</h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setShowSystemAlertsOnly(false);
                setShowStarredOnly(false);
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              Show All Notifications
            </button>
            <button
              onClick={handleImportantNotifications}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700"
            >
              Important Notifications
            </button>
            <button
              onClick={handleSystemAlerts}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 whitespace-nowrap w-fit"
            >
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

      <main className="flex-1 p-10">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mb-6 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
        >
          {sidebarOpen ? 'Hide Menu' : 'Show Menu'}
        </button>

        <h1 className="text-3xl font-bold mb-6">
          {showSystemAlertsOnly
            ? 'System Alerts'
            : showStarredOnly
            ? 'Important Notifications'
            : 'All Notifications'}
        </h1>

        <div className="space-y-4">
          {showSystemAlertsOnly ? (
            systemAlerts.length > 0 ? (
              systemAlerts.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-red-100 border border-red-400 rounded-lg shadow"
                >
                  <div className="font-semibold">🚨 {item.content}</div>
                  <div className="text-sm text-red-700">
                    Sent to {item.recipients.join(', ')} •{' '}
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No system alerts available.</div>
            )
          ) : (
            (showStarredOnly ? announcements.filter((item) => starredIds.includes(item.id)) : announcements)
              .map((item) => {
                const isStarred = starredIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white rounded-lg shadow flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold">📢 {item.content}</div>
                      <div className="text-sm text-gray-500">
                        Sent to {item.recipients.join(', ')} •{' '}
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleStar(item.id)}
                      className="text-2xl"
                      title="Star this notification"
                    >
                      {isStarred ? '⭐' : '☆'}
                    </button>
                  </div>
                );
              })
          )}
        </div>

        <div className="mt-10 text-gray-700">
          <strong>Status:</strong> {muteStatus}
        </div>
      </main>
    </div>
  );
}
