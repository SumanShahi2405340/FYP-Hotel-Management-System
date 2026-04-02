'use client';
import AnnouncementPanel from '@/components/AnnouncementPanel';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaCog, FaBullhorn, FaCheckCircle, FaTimesCircle, FaSearch, 
  FaHotel, FaBell, FaSignOutAlt, FaChevronDown, FaChartLine, 
  FaBuilding, FaUsers, FaCreditCard, FaUserCircle, FaTachometerAlt,
  FaPlus, FaEnvelope, FaCalendarAlt, FaDollarSign
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

  const totalHotels = hotels.length;
  const activeHotels = hotels.filter(h => h.status === 'Active').length;
  const inactiveHotels = hotels.filter(h => h.status === 'Inactive').length;
  
  // Mock stats data
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

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    router.push('http://localhost:3000/role');
  };

  const fetchHotels = (status = 'all') => {
    setIsLoading(true);
    const url =
      status === 'all'
        ? 'http://127.0.0.1:8000/api/hotels'
        : `http://127.0.0.1:8000/api/hotels?status=${status === 'active' ? 'Active' : 'Inactive'}`;
    fetch(url)
      .then(res => { if (!res.ok) throw new Error(`HTTP error ${res.status}`); return res.json(); })
      .then(data => { if (Array.isArray(data)) setHotels(data); else setHotels([]); })
      .catch(() => setHotels([]))
      .finally(() => setIsLoading(false));
  };

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
      if (response.ok) setHotels(prev => prev.map(h => h.id === id ? { ...h, status: newStatus } : h));
    } catch (error) { console.error(error); }
  };

  const handleRemove = async (id) => {
    if (!hotels.some(h => Number(h.id) === Number(id))) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/hotels/${id}/`, { method: 'DELETE' });
      if (response.ok) setHotels(prev => prev.filter(h => Number(h.id) !== Number(id)));
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchHotels('all'); }, []);

  const menuItems = [
    { id: "announcement", label: "Send Announcements", icon: FaBullhorn, color: "from-purple-500 to-pink-500" },
    { id: "hotels", label: "Manage Hotels", icon: FaHotel, color: "from-blue-500 to-cyan-500", route: "/admin/manage-hotels" },
    { id: "users", label: "Manage Users", icon: FaUsers, color: "from-green-500 to-emerald-500", route: "/admin/manage-users" },
    { id: "reports", label: "Reports", icon: FaChartLine, color: "from-orange-500 to-red-500", route: "/admin/reports" },
  ];

  const quickActions = [
    { id: "announcement", label: "Send Announcement", icon: FaBullhorn, color: "bg-purple-500" },
    { id: "register", label: "Add Hotel", icon: FaPlus, color: "bg-green-500", onClick: () => router.push('/admin/register-hotel') },
    { id: "reports", label: "View Reports", icon: FaChartLine, color: "bg-blue-500", onClick: () => router.push('/admin/reports') },
    { id: "notifications", label: "Notifications", icon: FaBell, color: "bg-yellow-500", onClick: () => router.push('/admin/notification-setting') },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          background: #0a0a0a;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease forwards;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease forwards;
        }
        
        .hover-scale {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .hover-scale:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
        }
      `}</style>

      <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Sidebar */}
        <div
          className={`fixed top-0 left-0 h-screen w-80 bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl text-white flex flex-col z-20 transform transition-all duration-300 shadow-2xl border-r border-white/10 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Profile Section */}
          <div className="relative px-6 py-8 border-b border-white/10">
            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer" onClick={() => router.push('/admin/profile')}>
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-800">
                    <img 
                      src="/admindash1.jpg" 
                      alt="Admin Profile" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
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

          {/* Logo */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-center gap-2">
              <FaHotel className="text-3xl text-purple-400" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                CloudInn
              </h2>
            </div>
            <p className="text-xs text-center text-gray-500 mt-1">Admin Portal</p>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => item.id === "announcement" ? setAnnouncementOpen(true) : (item.route ? router.push(item.route) : null)}
                className="group relative w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center gap-3 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-200`} />
                <item.icon className="text-lg text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  {item.label}
                </span>
              </button>
            ))}

            {/* Settings Section */}
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
                  <button
                    onClick={() => router.push("/admin/commission-setting")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                  >
                    Commission Setting
                  </button>
                  <button
                    onClick={() => router.push('/admin/notification-setting?sidebar=true')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                  >
                    Notifications & Settings
                  </button>
                  <button
                    onClick={() => router.push('/admin/apply-system-updates')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                  >
                    Apply System Updates
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Logout Button */}
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
        <div 
          className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-80" : "ml-0"} min-h-screen`}
        >
          {/* Header */}
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
                <div className="relative">
                  <button 
                    onClick={() => router.push('/admin/notification-setting')} 
                    className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 group"
                  >
                    <FaBell className="text-xl text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </button>
                </div>
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

          {/* Dashboard Content */}
          <div className="p-8">
            {/* Welcome Section */}
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
                { label: "Total Revenue", value: stats.totalRevenue, icon: FaDollarSign, color: "from-purple-500 to-pink-500", change: "+18%", prefix: "$" },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 hover-scale animate-fadeInUp"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                        <stat.icon className="text-2xl text-white" />
                      </div>
                      <span className="text-xs text-green-400 font-medium bg-green-500/20 px-2 py-1 rounded-full">
                        {stat.change}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {stat.prefix}{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FaTachometerAlt className="text-purple-400" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, idx) => (
                  <button
                    key={action.id}
                    onClick={action.onClick || (() => action.id === "announcement" ? setAnnouncementOpen(true) : null)}
                    className="group relative overflow-hidden rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 p-4 transition-all duration-200 hover-scale animate-fadeInUp"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <action.icon className="text-2xl text-purple-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-gray-300 text-center group-hover:text-white transition-colors">
                        {action.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hotels Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaBuilding className="text-purple-400" />
                  Registered Hotels
                </h2>
                <button
                  onClick={() => router.push('/admin/register-hotel')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all duration-200 flex items-center gap-2"
                >
                  <FaPlus className="text-xs" />
                  Add New Hotel
                </button>
              </div>

              {/* Filters and Search */}
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex gap-2">
                  {[
                    { label: 'All Hotels', value: 'all', count: totalHotels },
                    { label: 'Active', value: 'active', count: activeHotels },
                    { label: 'Inactive', value: 'inactive', count: inactiveHotels }
                  ].map(btn => (
                    <button
                      key={btn.value}
                      onClick={() => { setView(btn.value); fetchHotels(btn.value); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        view === btn.value 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {btn.label}
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                        {btn.count}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search hotels by name, owner or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors w-80"
                  />
                </div>
              </div>

              {/* Hotels Table */}
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
                        <tr>
                          <td colSpan="6" className="text-center py-12">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            </div>
                          </td>
                        </tr>
                      ) : filteredHotels.length > 0 ? (
                        filteredHotels.map((hotel, idx) => (
                          <tr key={hotel.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-400">{hotel.id}</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => router.push(`/admin/hotel-profile/${hotel.id}`)}
                                className="text-white hover:text-purple-400 transition-colors font-medium"
                              >
                                {hotel.name}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">{hotel.owner || '—'}</td>
                            <td className="px-6 py-4 text-sm text-gray-400">{hotel.email || '—'}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                hotel.status === 'Active' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {hotel.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleToggleStatus(hotel.id)}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                                    hotel.status === 'Active'
                                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                  }`}
                                >
                                  {hotel.status === 'Active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleRemove(hotel.id)}
                                  className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium transition-all duration-200"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-12">
                            <div className="flex flex-col items-center gap-2">
                              <FaHotel className="text-4xl text-gray-600" />
                              <p className="text-gray-400">No hotels found</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Panel */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl transform transition-transform duration-300 z-50 border-l border-white/10 ${
        announcementOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Send Announcement</h2>
            <button
              onClick={() => setAnnouncementOpen(false)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
              <textarea
                rows={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Type your announcement message here..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Recipients</label>
              <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors">
                <option>All Hotels</option>
                <option>Active Hotels Only</option>
                <option>Inactive Hotels Only</option>
              </select>
            </div>
            <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-all duration-200">
              Send Announcement
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeInUp">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 w-96 text-center border border-white/10 shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <FaSignOutAlt className="text-3xl text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Ready to leave?</h2>
            <p className="text-gray-400 mb-6">Are you sure you want to logout from CloudInn Admin Portal?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <AnnouncementPanel isOpen={false} onClose={() => setAnnouncementOpen(false)} />
    </>
  );
}