"use client";
import React, { useState, useEffect } from "react";
import {
  FaCog, FaWrench, FaChartLine, FaBed,
  FaCalendarCheck, FaSignOutAlt, FaChevronDown, FaHotel, FaBuilding, FaTachometerAlt,
  FaUserPlus, FaList, FaUsers, FaUserCircle, FaBell, FaBook, FaPlus, FaUserFriends,
  FaDoorOpen, FaClipboardList, FaCheckCircle, FaSpinner, FaMoneyBillWave, FaTags
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import recepApi from "@/utils/recep";
import api from "@/utils/api";
import ManagePaymentsDashboard from "@/components/ManagePaymentsDashboard";
import EarningReports from "@/components/EarningReports";
import RoomStatusPanel from "@/components/RoomStatusPanel";

const ReceptionistDashboard = () => {
  const [activePanel, setActivePanel] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [staffSubmenuOpen, setStaffSubmenuOpen] = useState(false);
  const [bookingsSubmenuOpen, setBookingsSubmenuOpen] = useState(false);
  const [hotel, setHotel] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [stats, setStats] = useState({
    availableRooms: 0,
    todayBookings: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const router = useRouter();

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split("T")[0];
  };

  const computeBookingStatus = (checkin, checkout) => {
    if (!checkin || !checkout) return "Booked";
    const now = new Date();
    const checkIn = new Date(checkin);
    const checkOut = new Date(checkout);
    if (now < checkIn) return "Booked";
    if (now >= checkIn && now < checkOut) return "Checked In";
    return "Checked Out";
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setStatsLoading(true);

        let hotelData = null;
        try {
          const hotelRes = await recepApi.get("/api/hotel/receptionist/");
          hotelData = hotelRes.data;
        } catch (hotelErr) {
          console.error("Failed to fetch receptionist data:", hotelErr);
          setAuthError(true);
          try {
            const meRes = await api.get("/api/me/");
            if (meRes.data && meRes.data.hotel_id) {
              hotelData = {
                hotel_id: meRes.data.hotel_id,
                hotel_name: meRes.data.hotel_name || "Hotel",
              };
            }
          } catch (meErr) {
            console.error("Failed to fetch user info:", meErr);
          }
        }

        if (!hotelData) {
          hotelData = { hotel_id: 1, hotel_name: "CloudInn Hotel" };
        }

        let totalRooms = 0;
        try {
          const inventoryRes = await api.get("/api/room-inventory/");
          const inventory = inventoryRes.data;
          totalRooms =
            (inventory.normal_rooms || 0) +
            (inventory.deluxe_rooms || 0) +
            (inventory.suite_rooms || 0);
        } catch (invErr) {
          console.error("Failed to fetch inventory:", invErr);
          totalRooms = 20;
        }

        setHotel({
          hotel_id: hotelData.hotel_id,
          hotel_name: hotelData.hotel_name,
          total_rooms: totalRooms,
        });

        let bookings = [];
        try {
          const bookingsRes = await api.get("/api/manage-bookings/");
          bookings = Array.isArray(bookingsRes.data)
            ? bookingsRes.data
            : bookingsRes.data?.results || [];
        } catch (bookErr) {
          console.error("Failed to fetch bookings:", bookErr);
          bookings = [];
        }

        const today = new Date().toISOString().split("T")[0];
        let checkIns = 0;
        let checkOuts = 0;
        let todayBookings = 0;

        bookings.forEach((booking) => {
          const checkinDate = formatDate(booking.checkin);
          const checkoutDate = formatDate(booking.checkout);
          if (checkinDate === today) checkIns++;
          if (checkoutDate === today) checkOuts++;
          const bookingCreatedDate = formatDate(booking.created_at || booking.checkin);
          if (bookingCreatedDate === today) todayBookings++;
        });

        const occupiedRooms = bookings.filter(
          (booking) =>
            computeBookingStatus(booking.checkin, booking.checkout) === "Checked In"
        ).length;

        const availableRooms = totalRooms - occupiedRooms;

        setStats({
          availableRooms: availableRooms >= 0 ? availableRooms : 0,
          todayBookings,
          todayCheckIns: checkIns,
          todayCheckOuts: checkOuts,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setStats({ availableRooms: 0, todayBookings: 0, todayCheckIns: 0, todayCheckOuts: 0 });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("recepToken");
    localStorage.removeItem("recepRefreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    router.push("http://localhost:3000/role");
  };

  // Bell icon → sidebar CLOSED (showMenu=false)
  const handleNotificationFromBell = () => {
    router.push("/receptionist/receptionist-notification-setting?showMenu=false");
  };

  // Settings menu → sidebar OPEN (showMenu=true)
  const handleNotificationFromSettings = () => {
    router.push("/receptionist/receptionist-notification-setting?showMenu=true");
  };

  const handleViewPromotions = () => {
    router.push("/receptionist/manage-promotionsdiscounts");
  };

  const menuItems = [
    {
      id: "maintenance",
      label: "Manage Maintenance Requests",
      icon: FaWrench,
      color: "from-yellow-500 to-amber-500",
      route: "/receptionist/send-view-maintenancerequests",
    },
  ];

  const quickActions = [
    { id: "roomStatus", label: "Room Status", icon: FaBed, color: "bg-purple-500" },
    { id: "earnings", label: "Earning Reports", icon: FaChartLine, color: "bg-green-500" },
  ];

  const navigateToStaff = (tab) => {
    if (tab === "add") router.push("/receptionist/add-staff");
    else router.push(`/receptionist/manage-staffnnattendance?tab=${tab}`);
  };

  const navigateToBookings = (type) => {
    if (type === "add") router.push("/receptionist/add-bookings");
    else if (type === "guest-lists") router.push("/receptionist/guest-lists");
  };

  const handleManagePaymentsDashboard = () => {
    router.push("/receptionist/managepayments-dashboard");
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease forwards; }
        .animate-slideIn  { animation: slideIn  0.3s ease forwards; }
        .hover-scale { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-scale:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); }
      `}</style>

      <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">

        {/* Sidebar */}
        <div className={`fixed top-0 left-0 h-screen w-80 bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl text-white flex flex-col z-20 transform transition-all duration-300 shadow-2xl border-r border-white/10 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>

          {/* Hotel profile */}
          <div className="relative px-6 py-8 border-b border-white/10">
            <div className="flex flex-col items-center">
              <div
                className="relative group cursor-pointer"
                onClick={() => hotel && router.push(`/owner/hotel-profile/${hotel.hotel_id}`)}
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-800">
                    <img
                      src="/admindash1.jpg"
                      alt="Hotel Profile"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 border-2 border-gray-900">
                  <FaUserCircle className="text-white text-xs" />
                </div>
              </div>
              {hotel && (
                <div className="mt-4 text-center">
                  <h3 className="font-bold text-lg text-white">{hotel.hotel_name}</h3>
                  <p className="text-sm text-gray-400 mt-1">ID: {hotel.hotel_id}</p>
                </div>
              )}
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
            <p className="text-xs text-center text-gray-500 mt-1">Receptionist Portal</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">

            {/* Manage Staff */}
            <div>
              <button
                onClick={() => setStaffSubmenuOpen(!staffSubmenuOpen)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <FaUsers className="text-lg text-purple-400" />
                  <span className="text-sm font-medium text-gray-300">Manage Staffs</span>
                </div>
                <FaChevronDown className={`text-xs text-gray-500 transition-transform duration-200 ${staffSubmenuOpen ? "rotate-180" : ""}`} />
              </button>
              {staffSubmenuOpen && (
                <div className="ml-8 mt-2 space-y-1 animate-slideIn">
                  <button
                    onClick={() => navigateToStaff("add")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition flex items-center gap-2"
                  >
                    <FaUserPlus className="text-xs" /> Add Staffs
                  </button>
                  <button
                    onClick={() => navigateToStaff("view")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition flex items-center gap-2"
                  >
                    <FaList className="text-xs" /> Staffs List
                  </button>
                </div>
              )}
            </div>

            {/* Manage Bookings */}
            <div>
              <button
                onClick={() => setBookingsSubmenuOpen(!bookingsSubmenuOpen)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <FaBook className="text-lg text-purple-400" />
                  <span className="text-sm font-medium text-gray-300">Manage Bookings</span>
                </div>
                <FaChevronDown className={`text-xs text-gray-500 transition-transform duration-200 ${bookingsSubmenuOpen ? "rotate-180" : ""}`} />
              </button>
              {bookingsSubmenuOpen && (
                <div className="ml-8 mt-2 space-y-1 animate-slideIn">
                  <button
                    onClick={() => navigateToBookings("add")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition flex items-center gap-2"
                  >
                    <FaPlus className="text-xs" /> Add Bookings
                  </button>
                  <button
                    onClick={() => navigateToBookings("guest-lists")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition flex items-center gap-2"
                  >
                    <FaUserFriends className="text-xs" /> Guests List
                  </button>
                </div>
              )}
            </div>

            {/* Manage Payments */}
            <button
              onClick={handleManagePaymentsDashboard}
              className="group relative w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
              <FaMoneyBillWave className="text-lg text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Manage Payments</span>
            </button>

            {/* Manage Attendance */}
            <button
              onClick={() => navigateToStaff("attendance")}
              className="group relative w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
              <FaCalendarCheck className="text-lg text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Manage Attendance</span>
            </button>

            {/* Other menu items */}
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => router.push(item.route)}
                className="group relative w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 flex items-center gap-3 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-200`} />
                <item.icon className="text-lg text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{item.label}</span>
              </button>
            ))}

            {/* Settings */}
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
                  {/* ✅ Settings click → showMenu=true → sidebar OPEN */}
                  <button
                    onClick={handleNotificationFromSettings}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition flex items-center gap-2"
                  >
                    <FaBell className="text-xs" /> Notifications & Setting
                  </button>
                  <button
                    onClick={handleViewPromotions}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition flex items-center gap-2"
                  >
                    <FaTags className="text-xs" /> View Promotion/Discount in N&S
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Logout */}
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
                {/* ✅ Bell icon → showMenu=false → sidebar CLOSED */}
                <button
                  onClick={handleNotificationFromBell}
                  className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 group"
                >
                  <FaBell className="text-xl text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </button>
                <div className="h-8 w-px bg-white/20" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">R</span>
                  </div>
                  <span className="text-sm text-gray-300 hidden md:block">Receptionist</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard body */}
          <div className="p-8">
            {/* Welcome */}
            <div className="mb-8 animate-fadeInUp">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Welcome, {hotel?.hotel_name || "Receptionist"}!
              </h1>
              <p className="text-gray-400 mt-2">Manage check-ins, check-outs, and daily operations.</p>
            </div>

            {/* Auth Error Banner */}
            {authError && (
              <div className="mb-6 p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm">
                <p className="flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Using demo mode. Some features may be limited. Please contact administrator to set up your receptionist profile.
                </p>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Available Rooms",   value: stats.availableRooms,  icon: FaDoorOpen,      color: "from-blue-500 to-cyan-500",    subtitle: "Ready for check-in" },
                { label: "Today's Bookings",  value: stats.todayBookings,   icon: FaBook,          color: "from-green-500 to-emerald-500", subtitle: "New reservations today" },
                { label: "Today's Check-in",  value: stats.todayCheckIns,   icon: FaCalendarCheck, color: "from-purple-500 to-pink-500",   subtitle: "Expected arrivals" },
                { label: "Today's Check-out", value: stats.todayCheckOuts,  icon: FaSignOutAlt,    color: "from-orange-500 to-red-500",   subtitle: "Expected departures" },
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
                    </div>
                    <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                    <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FaTachometerAlt className="text-purple-400" /> Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {quickActions.map((action, idx) => (
                  <button
                    key={action.id}
                    onClick={() => setActivePanel(action.id)}
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

            {/* Active Panel */}
            {activePanel && (
              <div className="animate-fadeInUp">
                {activePanel === "roomStatus" && <RoomStatusPanel />}
                {activePanel === "earnings" && <EarningReports />}
              </div>
            )}

            {/* Empty state */}
            {!activePanel && (
              <div className="text-center py-16 animate-fadeInUp">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <FaHotel className="text-4xl text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Welcome to CloudInn</h3>
                <p className="text-gray-400">Select an option from the quick actions above to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeInUp">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 w-96 text-center border border-white/10 shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <FaSignOutAlt className="text-3xl text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Ready to leave?</h2>
            <p className="text-gray-400 mb-6">Are you sure you want to logout from CloudInn?</p>
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
    </>
  );
};

export default ReceptionistDashboard;