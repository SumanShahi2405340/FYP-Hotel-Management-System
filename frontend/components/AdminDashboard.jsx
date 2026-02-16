'use client';
import AnnouncementPanel from '@/components/AnnouncementPanel'; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCog, FaBullhorn } from 'react-icons/fa';

export default function AdminDashboard() {
  const router = useRouter();

  //  Hotel data (fetched from backend)
  const [hotels, setHotels] = useState([]);


  //  UI state
  const [view, setView] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);


  // Fetch Hotels Data from Database
  const fetchHotels = (status = 'all') => {
    const url =
      status === 'all'
        ? 'http://127.0.0.1:8000/api/hotels' //  no query param for "all"
        : `http://127.0.0.1:8000/api/hotels?status=${status === 'active' ? 'Active' : 'Inactive'}`;

    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setHotels(data); // safe to map
        } else {
          console.error("Unexpected response format:", data);
          setHotels([]); // fallback to empty array
        }
      })
      .catch(err => {
        console.error('Failed to fetch hotels:', err);
        setHotels([]); // prevent map crash
      });
  };


// Updating Ui and Database When Activate /Deactive button is clicked
  const handleToggleStatus = async (id) => {
  const hotel = hotels.find(h => h.id === id);
  if (!hotel) return;

  const newStatus = hotel.status === 'Active' ? 'Inactive' : 'Active';

  try {
    const response = await fetch(`http://127.0.0.1:8000/api/hotels/${id}/update/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      setHotels(prev =>
        prev.map(h =>
          h.id === id ? { ...h, status: newStatus } : h
        )
      );
    } else {
      console.error('Failed to update hotel:', response.statusText);
    }
  } catch (error) {
    console.error('Error updating hotel:', error);
  }
};


  //  Initial load
  useEffect(() => {
    fetchHotels('all');
  }, []);


  //  Action handlers or Deleting Hotel from Database and Ui
  const handleRemove = async (id) => {
  console.log('handleRemove received id:', id);
  // Defensive: ensure this id exists in current hotels list
  const exists = hotels.some(h => Number(h.id) === Number(id));
  if (!exists) {
    console.error('Refusing to delete: id not in hotels list →', id);
    return;
  }

  try {
    const response = await fetch(`http://127.0.0.1:8000/api/hotels/${id}/`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setHotels(prev => prev.filter(h => Number(h.id) !== Number(id)));
    } else {
      console.error('Failed to delete hotel:', response.statusText);
    }
  } catch (error) {
    console.error('Error deleting hotel:', error);
  }
};


  //  No local filtering needed, backend handles it
  const filteredHotels = hotels;
 

  return (
    <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('/admindash1.jpg')" }}>
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-indigo-900/90 via-gray-900/80 to-black/70 backdrop-blur-md text-white flex flex-col justify-start p-6 z-20 transform transition-transform duration-300 shadow-2xl border-r border-gray-700/40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">
            CloudInn
          </h2>
          <p className="text-sm text-gray-300">Hotel Management Platform</p>
        </div>
      
        <nav className="space-y-2">
          <button
            onClick={() => setAnnouncementOpen(!announcementOpen)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition whitespace-nowrap">
            <FaBullhorn /> <span>Send Announcement</span>
          </button>

          {/* Settings Dropdown */}
          <div>
            <button onClick={() => setSettingsOpen(!settingsOpen)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition w-full text-left">
              <FaCog /> <span>Settings</span>
            </button>

            {settingsOpen && (
              <div className="ml-6 mt-2 space-y-2">
                <button
                  onClick={() => router.push('/admin/commission-setting')}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
                  Commission Setting
                </button>

                <button
                  onClick={() => router.push('/admin/notification-setting?sidebar=true')}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
                 Notifications & Setting
                </button>

                <button
                  onClick={() => router.push('/admin/apply-system-updates')}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
                  Apply System Updates
                </button>                
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'} p-6 relative z-10`}>

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-8">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-gradient-to-r from-gray-700/80 to-gray-900/80 text-white px-3 py-1 rounded shadow hover:from-gray-600/80 hover:to-gray-800/80 transition">
              {sidebarOpen ? 'Hide Menu' : 'Show Menu'}
            </button>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg text-center mb-1">Admin Dashboard</h1>
          </div>
        </div>

        {/* Notification + Register Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-5 z-30">
          <button
            onClick={() => router.push('/admin/notification-setting')}
            className="relative -mt-5 text-4xl text-purple-600 hover:text-purple-700 transition">
            🔔
          </button>

          <div className="flex flex-col items-center">
            <button
              onClick={() => router.push('/admin/register')}
              className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-lg"
            >
              +
            </button>
            <span className="text-sm font-semibold mt-1 text-white drop-shadow">
              Register Hotel
            </span>
          </div>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex justify-center gap-3 mb-6 flex-wrap mt-12">
          <button onClick={() => { setView('all'); fetchHotels('all'); }} className={`px-4 py-1 rounded-full text-sm font-medium shadow-md transition-transform hover:scale-105 ${view === 'all' ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
            All Hotels
          </button>
          <button onClick={() => { setView('active'); fetchHotels('active'); }} className={`px-4 py-1 rounded-full text-sm font-medium shadow-md transition-transform hover:scale-105 ${view === 'active' ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'} text-white`}>
            Active Hotels
          </button>
          <button onClick={() => { setView('inactive'); fetchHotels('inactive'); }} className={`px-4 py-1 rounded-full text-sm font-medium shadow-md transition-transform hover:scale-105 ${view === 'inactive' ? 'bg-red-600' : 'bg-red-500 hover:bg-red-600'} text-white`}>
            Inactive Hotels
          </button>
        </div>

     
          <div className="bg-white/80 p-6 rounded-2xl shadow-2xl overflow-x-auto border border-gray-200">
            <p className="mb-4 font-semibold text-gray-700 text-sm">
              Total Hotels: {filteredHotels.length}
            </p>
            <table className="table-fixed w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="border p-2 w-[140px]">Hotel Name</th>
                  <th className="border p-2 w-[140px]">Owner</th>
                  <th className="border p-2 w-[180px]">Email</th>
                  <th className="border p-2 w-[80px]">Status</th>
                  <th className="border p-2 w-[240px]">Actions</th>
                </tr>
              </thead>
              <tbody>


                {/* {filteredHotels.map((hotel, index) => ( */}
                {filteredHotels.map((hotel) => (
                  <tr key={hotel.id} className="bg-white hover:bg-gray-50 transition">
                    <td className="border p-2">{hotel.id}. {hotel.name}</td>
                    <td className="border p-2">{hotel.owner || '-'}</td>
                    <td className="border p-2">{hotel.email || '-'}</td>
                    <td>{hotel.status}</td> 
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => router.push(`/admin/hotel-profile/${hotel.id}`)} 
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-xs shadow"
                        >
                          Profile
                        </button>

                        {/* Toggle Activate/Deactivate status button */}
                        <button
                          onClick={() => handleToggleStatus(hotel.id)}
                          className={`px-3 py-1 rounded-full text-xs shadow text-white ${
                            hotel.status === 'Active'
                              ? 'bg-yellow-500 hover:bg-yellow-600'
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {hotel.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>

                        {/* Remove button with permanent delete logic */}
                        <button
                          onClick={() => handleRemove(hotel.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-xs shadow"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        {/* Announcement Panel */}
        <AnnouncementPanel
          isOpen={announcementOpen}
          onClose={() => setAnnouncementOpen(false)}
        />
      </div>
    </div>
  );
}


