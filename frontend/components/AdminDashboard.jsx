'use client';
import AdminAnnouncementPanel from '@/components/AnnouncementPanel';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaCog, FaBullhorn, FaCheckCircle, FaTimesCircle, FaSearch, 
  FaHotel, FaBell, FaSignOutAlt, FaChevronDown, FaChartLine, 
  FaBuilding, FaUsers, FaUserCircle, FaTachometerAlt,
  FaPlus, FaDollarSign, FaTimes, FaCalendarAlt
} from 'react-icons/fa';

export default function AdminDashboard() {
  const router = useRouter();

  const [hotels, setHotels] = useState([]);
  const [view, setView] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [activePanel, setActivePanel] = useState('hotels'); // Set hotels as default

  const [revenueData, setRevenueData] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('Dec');
  const [selectedYear, setSelectedYear] = useState('2025');

  // ✅ FIXED: Add credentials: 'include' to send session cookie
  const fetchHotels = (status = 'all') => {
    setIsLoading(true);
    const url = status === 'all'
      ? 'http://127.0.0.1:8000/api/hotels'
      : `http://127.0.0.1:8000/api/hotels?status=${status === 'active' ? 'Active' : 'Inactive'}`;
    
    fetch(url, {
      method: 'GET',
      credentials: 'include', // ✅ CRITICAL - sends session cookie
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(res => { 
        if (!res.ok) throw new Error(`HTTP error ${res.status}`); 
        return res.json(); 
      })
      .then(data => { 
        console.log('Fetched hotels:', data);
        if (Array.isArray(data)) setHotels(data); 
        else setHotels([]); 
      })
      .catch((error) => {
        console.error('Error fetching hotels:', error);
        setHotels([]);
      })
      .finally(() => setIsLoading(false));
  };

  // ✅ Fetch hotels on component mount
  useEffect(() => {
    fetchHotels('all');
  }, []);

  const totalHotels = hotels.length;
  const activeHotels = hotels.filter(h => h.status === 'Active').length;
  const inactiveHotels = hotels.filter(h => h.status === 'Inactive').length;

  const [stats] = useState({
    totalRevenue: 284500,
    activeBookings: 156,
    avgRating: 4.8
  });

  const filteredHotels = hotels.filter(hotel =>
    hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      // Optional: Call logout endpoint to clear session
      await fetch('http://127.0.0.1:8000/api/admin-logout/', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    router.push('/admin/login');
  };

  const fetchRevenueData = async (month, year) => {
    setRevenueLoading(true);
    try {
      const monthNumber = new Date(`${month} 1, ${year}`).getMonth() + 1;
      const paddedMonth = monthNumber.toString().padStart(2, '0');
      const res = await fetch(`http://localhost:8000/api/commission-revenue/?month=${paddedMonth}&year=${year}`, {
        credentials: 'include', // ✅ Add credentials
      });
      const data = await res.json();
      setRevenueData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching commission revenue:', err);
      setRevenueData([]);
    } finally {
      setRevenueLoading(false);
    }
  };

  const handleManageHotels = () => {
    if (activePanel === 'hotels') {
      setActivePanel(null);
    } else {
      setActivePanel('hotels');
      fetchHotels(view === 'all' ? 'all' : view);
    }
  };

  const handleCommissionReports = () => {
    if (activePanel === 'commission') {
      setActivePanel(null);
    } else {
      setActivePanel('commission');
      fetchRevenueData(selectedMonth, selectedYear);
    }
  };

  useEffect(() => {
    if (activePanel === 'commission') fetchRevenueData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const handleToggleStatus = async (id) => {
    const hotel = hotels.find(h => h.id === id);
    if (!hotel) return;
    const newStatus = hotel.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/hotels/${id}/update/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ Add credentials
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setHotels(prev => prev.map(h => h.id === id ? { ...h, status: newStatus } : h));
        fetchHotels(view); // Refresh list
      }
    } catch (error) { console.error(error); }
  };

  const handleRemove = async (id) => {
    if (!hotels.some(h => Number(h.id) === Number(id))) return;
    if (confirm('Are you sure you want to remove this hotel?')) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/hotels/${id}/`, { 
          method: 'DELETE',
          credentials: 'include', // ✅ Add credentials
        });
        if (response.ok) {
          setHotels(prev => prev.filter(h => Number(h.id) !== Number(id)));
          fetchHotels(view); // Refresh list
        }
      } catch (error) { console.error(error); }
    }
  };

  const menuItems = [
    { id: "announcement", label: "Announcements/Discounts", icon: FaBullhorn, color: "from-purple-500 to-pink-500" },
    { id: "hotels", label: "Manage Hotels", icon: FaHotel, color: "from-blue-500 to-cyan-500" },
    { id: "users", label: "Manage Users", icon: FaUsers, color: "from-green-500 to-emerald-500", route: "/admin/manage-users" },
  ];

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const years = Array.from({ length: 10 }, (_, i) => String(2025 + i));

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #0a0a0a; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease forwards; }
        .animate-slideIn { animation: slideIn 0.3s ease forwards; }
        .animate-slideDown { animation: slideDown 0.35s ease forwards; }
        .hover-scale { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-scale:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); }
        .rev-select {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.15);
          color: #e2e8f0;
          padding: 6px 28px 6px 10px;
          border-radius: 8px;
          font-size: 12px;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a78bfa' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 6px center;
          background-size: 14px;
          cursor: pointer;
          transition: border-color 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .rev-select:focus { outline: none; border-color: #a78bfa; }
        .rev-select option { background: #1e1e2e; color: #e2e8f0; }
      `}</style>

      <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">

        {/* Sidebar */}
        <div className={`fixed top-0 left-0 h-screen w-80 bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl text-white flex flex-col z-20 transform transition-all duration-300 shadow-2xl border-r border-white/10 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>

          <div className="relative px-6 py-8 border-b border-white/10">
            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer" onClick={() => router.push('/admin/profile')}>
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-800">
                    <img src="/admindash1.jpg" alt="Admin Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 border-2 border-gray-900">
                  <FaUserCircle className="text-white text-xs" />
                </div>
              </div>
              <div className="mt-4 text-center">
                <h3 className="font-bold text-lg text-white">Administrator</h3>
                <p className="text-sm text-gray-400 mt-1">System Admin</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-center gap-2">
              <FaHotel className="text-3xl text-purple-400" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                CloudInn
              </h2>
            </div>
            <p className="text-xs text-center text-gray-500 mt-1">Admin Portal</p>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "announcement") {
                    setAnnouncementOpen(true);
                  } else if (item.id === "hotels") {
                    handleManageHotels();
                  } else if (item.route) {
                    router.push(item.route);
                  }
                }}
                className={`group relative w-full px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 overflow-hidden
                  ${item.id === 'hotels' && activePanel === 'hotels'
                    ? 'bg-blue-500/20 border border-blue-500/40'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-200`} />
                <item.icon className={`text-lg transition-transform group-hover:scale-110 ${item.id === 'hotels' && activePanel === 'hotels' ? 'text-blue-400' : 'text-purple-400'}`} />
                <span className={`text-sm font-medium transition-colors ${item.id === 'hotels' && activePanel === 'hotels' ? 'text-blue-200' : 'text-gray-300 group-hover:text-white'}`}>
                  {item.label}
                </span>
                {item.id === 'hotels' && activePanel === 'hotels' && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-xs font-medium">Open</span>
                )}
              </button>
            ))}

            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <FaCog className="text-lg text-purple-400" />
                  <span className="text-sm font-medium text-gray-300">Settings</span>
                </div>
                <FaChevronDown className={`text-xs text-gray-500 transition-transform duration-200 ${settingsOpen ? "rotate-180" : ""}`} />
              </button>
              {settingsOpen && (
                <div className="ml-8 mt-2 space-y-1 animate-slideIn">
                  <button onClick={() => router.push("/admin/commission-setting")} className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition">Commission Setting</button>
                  <button onClick={() => router.push('/admin/notification-setting?sidebar=true')} className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition">Notifications & Settings</button>
                  <button onClick={() => router.push('/admin/apply-system-updates')} className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition">Apply System Updates</button>
                </div>
              )}
            </div>
          </nav>

          <div className="p-6 border-t border-white/10">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 text-red-400 font-medium transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <FaSignOutAlt className="group-hover:translate-x-1 transition-transform" />
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-80" : "ml-0"} min-h-screen`}>
          <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-b border-white/10 px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {sidebarOpen ? "Hide Menu" : "Show Menu"}
              </button>
              <div className="flex items-center gap-4">
                <button onClick={() => router.push('/admin/notification-setting')} className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 group">
                  <FaBell className="text-xl text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </button>
                <div className="h-8 w-px bg-white/20" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">A</span>
                  </div>
                  <span className="text-sm text-gray-300 hidden md:block">Admin</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8 animate-fadeInUp">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Welcome back, Administrator!
              </h1>
              <p className="text-gray-400 mt-2">Here's an overview of your platform's performance.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Total Hotels", value: totalHotels, icon: FaHotel, color: "from-blue-500 to-cyan-500", change: "+12%", prefix: "" },
                { label: "Active Hotels", value: activeHotels, icon: FaCheckCircle, color: "from-green-500 to-emerald-500", change: "+5", prefix: "" },
                { label: "Inactive Hotels", value: inactiveHotels, icon: FaTimesCircle, color: "from-orange-500 to-red-500", change: "-3", prefix: "" },
                { label: "Total Commission Revenue", value: stats.totalRevenue, icon: FaDollarSign, color: "from-purple-500 to-pink-500", change: "+18%", prefix: "$" },
              ].map((stat, idx) => (
                <div key={idx} className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 hover-scale animate-fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                        <stat.icon className="text-2xl text-white" />
                      </div>
                      <span className="text-xs text-green-400 font-medium bg-green-500/20 px-2 py-1 rounded-full">{stat.change}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">{stat.prefix}{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</h3>
                    <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Hotels Section - Always Visible */}
            <div className="mb-8 animate-slideDown">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaBuilding className="text-purple-400" />
                  Registered Hotels
                </h2>
                <button onClick={() => router.push('/admin/register-hotel')} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all duration-200 flex items-center gap-2">
                  <FaPlus className="text-xs" />
                  Add New Hotel
                </button>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex gap-2">
                  {[
                    { label: 'All Hotels', value: 'all', count: totalHotels },
                    { label: 'Active', value: 'active', count: activeHotels },
                    { label: 'Inactive', value: 'inactive', count: inactiveHotels }
                  ].map(btn => (
                    <button key={btn.value} onClick={() => { setView(btn.value); fetchHotels(btn.value); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${view === btn.value ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                      {btn.label}
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">{btn.count}</span>
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input type="text" placeholder="Search hotels..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors w-80" />
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                        <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Hotel Name</th>
                        <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Owner</th>
                        <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan="6" className="text-center py-12"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div></td></tr>
                      ) : filteredHotels.length > 0 ? (
                        filteredHotels.map((hotel) => (
                          <tr key={hotel.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-400">{hotel.id}</td>
                            <td className="px-6 py-4">
                              <button onClick={() => router.push(`/admin/hotel-profile/${hotel.id}`)} className="text-white hover:text-purple-400 transition-colors font-medium">
                                {hotel.name}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">{hotel.owner || '—'}</td>
                            <td className="px-6 py-4 text-sm text-gray-400">{hotel.email || '—'}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${hotel.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {hotel.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button onClick={() => handleToggleStatus(hotel.id)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${hotel.status === 'Active' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}>
                                  {hotel.status === 'Active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button onClick={() => handleRemove(hotel.id)} className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium transition-all duration-200">
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="6" className="text-center py-12"><div className="flex flex-col items-center gap-2"><FaHotel className="text-4xl text-gray-600" /><p className="text-gray-400">No hotels found</p></div></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdminAnnouncementPanel isOpen={announcementOpen} onClose={() => setAnnouncementOpen(false)} />

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeInUp">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 w-96 text-center border border-white/10 shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <FaSignOutAlt className="text-3xl text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Ready to leave?</h2>
            <p className="text-gray-400 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-center gap-4">
              <button onClick={handleLogout} className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium">Yes, Logout</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}