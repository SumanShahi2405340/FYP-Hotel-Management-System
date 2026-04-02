"use client";
import React, { useState, useEffect } from "react";
import { FaCog, FaBullhorn, FaBed, FaUsers, FaTags, FaWrench, FaChartLine, FaCalendarCheck, FaMoneyBillWave, FaStar, FaCreditCard, FaUserCircle, FaBell, FaSignOutAlt, FaChevronDown, FaHotel, FaBuilding, FaTachometerAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import api from "../utils/api";

import OwnerAnnouncementPanel from '@/components/OwnerAnnouncementPanel'; 
import ViewBookings from "./ViewBookings";
import ViewEarningReports from "./ViewEarningReports";
import ViewCheckinCheckout from "./ViewCheckinCheckout";
import ReviewsAndFeedbacks from "./Reviews&Feedbacks"; 
import CheckPaymentStatus from "./CheckPaymentStatus";
import HotelProfile from "./HotelProfile";

const OwnerDashboard = () => {
  const [activePanel, setActivePanel] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hotel, setHotel] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [stats, setStats] = useState({
    totalRooms: 0,
    todayBookings: 0,
    monthlyRevenue: 0,
    occupancyRate: 0
  });
  const router = useRouter();

  useEffect(() => {
    const fetchHotelInfo = async () => {
      try {
        const res = await api.get("/api/me/");
        setHotel(res.data);
        // Fetch stats would go here
        setStats({
          totalRooms: 24,
          todayBookings: 8,
          monthlyRevenue: 45200,
          occupancyRate: 78
        });
      } catch (err) {
        console.error("Failed to fetch hotel info", err);
      }
    };
    fetchHotelInfo();
  }, []);

  const handleLogout = () => {
    router.push("http://localhost:3000/role");
  };

  const menuItems = [
    { id: "announcement", label: "Send Announcements", icon: FaBullhorn, color: "from-purple-500 to-pink-500" },
    { id: "rooms", label: "Manage Rooms", icon: FaBed, color: "from-blue-500 to-cyan-500", route: "/owner/manage-roomsprice" },
    { id: "staff", label: "Manage Staff & Attendance", icon: FaUsers, color: "from-green-500 to-emerald-500", route: "/owner/manage-staffnattendance" },
    { id: "promotions", label: "Manage Promotions/Discounts", icon: FaTags, color: "from-orange-500 to-red-500", route: "/owner/manage-promotionsdiscounts" },
    { id: "maintenance", label: "Manage Maintenance", icon: FaWrench, color: "from-yellow-500 to-amber-500", route: "/owner/manage-maintenancerequests" },
  ];

  const quickActions = [
    { id: "bookings", label: "View Bookings", icon: FaCalendarCheck, color: "bg-blue-500" },
    { id: "earnings", label: "Earning Reports", icon: FaChartLine, color: "bg-green-500" },
    { id: "checkincheckout", label: "Check-in/out", icon: FaUsers, color: "bg-purple-500" },
    { id: "reviews", label: "Reviews & Feedback", icon: FaStar, color: "bg-yellow-500" },
    { id: "payment", label: "Payment Status", icon: FaCreditCard, color: "bg-indigo-500" },
    { id: "profile", label: "Hotel Profile", icon: FaHotel, color: "bg-rose-500" },
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
              <div className="relative group cursor-pointer" onClick={() => hotel && router.push(`/owner/hotel-profile/${hotel.hotel_id}`)}>
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
            <p className="text-xs text-center text-gray-500 mt-1">Owner Portal</p>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => item.route ? router.push(item.route) : setActivePanel(item.id)}
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
                    onClick={() => router.push("/owner/owner-comission-setting")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                  >
                    Commission Setting
                  </button>
                  <button
                    onClick={() => router.push('/owner/owner-notification-setting?sidebar=true')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                  >
                    Notifications & Settings
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
                    onClick={() => router.push('/owner/owner-notification-setting')} 
                    className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 group"
                  >
                    <FaBell className="text-xl text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </button>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">O</span>
                  </div>
                  <span className="text-sm text-gray-300 hidden md:block">Owner</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-8">
            {/* Welcome Section */}
            <div className="mb-8 animate-fadeInUp">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Welcome back, {hotel?.hotel_name || "Owner"}!
              </h1>
              <p className="text-gray-400 mt-2">Here's what's happening with your property today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Total Rooms", value: stats.totalRooms, icon: FaBed, color: "from-blue-500 to-cyan-500", change: "+12%" },
                { label: "Today's Bookings", value: stats.todayBookings, icon: FaCalendarCheck, color: "from-green-500 to-emerald-500", change: "+3" },
                { label: "Monthly Revenue", value: `$${stats.monthlyRevenue.toLocaleString()}`, icon: FaMoneyBillWave, color: "from-purple-500 to-pink-500", change: "+18%" },
                { label: "Occupancy Rate", value: `${stats.occupancyRate}%`, icon: FaBuilding, color: "from-orange-500 to-red-500", change: "+5%" },
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
                    <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
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

            {/* Active Panel Content */}
            {activePanel && (
              <div className="animate-fadeInUp">
                {activePanel === "announcement" && (
                  <OwnerAnnouncementPanel isOpen={true} onClose={() => setActivePanel(null)} />
                )}
                {activePanel === "bookings" && <ViewBookings />}
                {activePanel === "earnings" && <ViewEarningReports />}
                {activePanel === "reviews" && <ReviewsAndFeedbacks />}
                {activePanel === "payment" && <CheckPaymentStatus />}
                {activePanel === "profile" && <HotelProfile />}
                {activePanel === "checkincheckout" && <ViewCheckinCheckout />}
              </div>
            )}

            {/* Empty State */}
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

      {/* Logout Confirmation Modal */}
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

export default OwnerDashboard;