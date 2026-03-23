"use client";
import React, { useState, useEffect } from "react";
import { FaCog } from "react-icons/fa";
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
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [hotel, setHotel] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); 
  const router = useRouter();

  useEffect(() => {
    const fetchHotelInfo = async () => {
      try {
        const res = await api.get("/api/me/");
        setHotel(res.data);
      } catch (err) {
        console.error("Failed to fetch hotel info", err);
      }
    };
    fetchHotelInfo();
  }, []);

  const handleLogout = () => {
    router.push("http://localhost:3000/role");
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-72   /* widened from w-64 */
          bg-gradient-to-b from-indigo-900/90 via-gray-900/80 to-black/70 
          backdrop-blur-md text-white flex flex-col justify-start p-6 z-20 
          transform transition-transform duration-300 shadow-2xl 
          border-r border-gray-700/40 
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Hotel Profile */}
        <div className="flex flex-col items-center mb-4">
          <button
            onClick={() => hotel && router.push(`/owner/hotel-profile/${hotel.hotel_id}`)}
            className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-600 shadow hover:shadow-lg transition"
          >
            <img src="/admindash1.jpg" alt="Hotel Profile" className="w-full h-full object-cover" />
          </button>
          {hotel && (
            <>
              <span className="mt-2 text-sm font-medium text-red-700">Hotel ID: {hotel.hotel_id}</span>
              <span className="mt-1 text-sm font-medium text-green-400">{hotel.hotel_name}</span>
            </>
          )}
        </div>

        <div className="flex justify-center mb-4">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">
            CloudInn
          </h2>
        </div>

        {/* Sidebar buttons above Settings */}
        <button 
          onClick={() => setActivePanel("announcement")}
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left whitespace-nowrap"
        >
          <span className="text-white font-bold">Send Announcements</span>
        </button>

        <button 
          onClick={() => router.push("/owner/manage-roomsprice")} 
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left whitespace-nowrap"
        >
          <span className="text-white font-bold">Manage Rooms</span>
        </button>

        <button 
          onClick={() => router.push("/owner/manage-staffnattendance")} 
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left whitespace-nowrap"
        >
          <span className="text-white font-bold">Manage Staff & Attendance</span>
        </button>

        <button 
          onClick={() => router.push("/owner/manage-promotionsdiscounts")} 
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left whitespace-nowrap"
        >
          <span className="text-white font-bold">Manage Promotions/Discounts</span>
        </button>

        <button 
          onClick={() => router.push("/owner/manage-maintenancerequests")} 
          className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left whitespace-nowrap"
        >
          <span className="text-white font-bold">Manage Maintenance Requests</span>
        </button>
        
        {/* Settings */}
        <button 
          onClick={() => setSettingsOpen(!settingsOpen)} 
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition w-full text-left"
        >
          <FaCog className="text-white" />
          <span className="text-white font-semibold">Settings</span>
        </button>

        {settingsOpen && (
          <div className="flex flex-col gap-2 ml-4 mt-2">
            <button 
              onClick={() => router.push("/owner/owner-comission-setting")} 
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left"
            >
              Commission Setting
            </button>
            <button 
              onClick={() => router.push('/owner/owner-notification-setting?sidebar=true')} 
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left"
            >
              Notifications & Setting
            </button>
          </div>
        )}

        {/* Logout button */}
        <div className="mt-auto flex justify-center">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Logout
          </button>
        </div>
      </div>



      {/* Main Content */}
      <div 
        className={`flex-1 p-5 transition-all duration-300 ${sidebarOpen ? "ml-72" : "ml-0"}`}  // adjusted margin to match wider sidebar
        style={{ 
          backgroundImage: "url('/hprofile3.jpg')", 
          backgroundSize: "cover", 
          backgroundPosition: "center", 
          minHeight: "100vh", 
        }}
      >
        {/* Top Heading */}
        <div className="grid grid-cols-3 items-center mb-6">
          <div className="flex justify-start">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="px-2 py-1 text-xs bg-purple-600 text-white rounded">
              {sidebarOpen ? "Hide Menu" : "Show Menu"}
            </button>
          </div>
          {/* Transparent Container */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-4 max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-green-400 drop-shadow-lg text-center">
                  Owner Dashboard
              </h1>   
          </div>  
          <div className="flex justify-end">
            <div className="relative inline-block">
              <button onClick={() => router.push('/owner/owner-notification-setting')} className="text-4xl text-purple-600 hover:text-purple-700 transition">
                🔔
              </button>
              <span className="absolute top-0 right-0 translate-x-[-0px] translate-y-[-8px] bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                1
              </span>
            </div>
          </div>
        </div>

        {/* Top buttons */}
        <div className="flex justify-center gap-2 flex-wrap mb-4">
          <button onClick={() => setActivePanel("bookings")} className="px-4 py-2 bg-blue-600 text-white rounded">View Bookings</button>
          
          <button onClick={() => setActivePanel("earnings")} className="px-4 py-2 bg-blue-600 text-white rounded">View Earning Reports</button>
        </div>

        {/* Panels */}
        {activePanel === "announcement" && (
          <OwnerAnnouncementPanel
            isOpen={true}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "bookings" && <ViewBookings />}
        {activePanel === "earnings" && <ViewEarningReports />}
        {activePanel === "reviews" && <ReviewsAndFeedbacks />}
        {activePanel === "payment" && <CheckPaymentStatus />}
        {activePanel === "profile" && <HotelProfile />}
        {activePanel === "checkincheckout" && <ViewCheckinCheckout />}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <h2 className="text-lg font-semibold mb-4">Do you really want to logout?</h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;










