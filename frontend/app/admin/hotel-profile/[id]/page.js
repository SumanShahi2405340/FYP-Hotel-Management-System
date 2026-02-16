"use client";
import React, { useState, useEffect } from "react";
import { FaCog } from "react-icons/fa";
import { useRouter } from "next/navigation";
import api from "../utils/api";

import ViewBookings from "./ViewBookings";
import ViewEarningReports from "./ViewEarningReports";
import ViewCheckinCheckout from "./ViewCheckinCheckout";
import ViewCommissionReports from "./ViewCommissionReports";
import ReviewsAndFeedbacks from "./Reviews&Feedbacks"; 
import CheckPaymentStatus from "./CheckPaymentStatus";
import HotelProfile from "./HotelProfile";

const OwnerDashboard = () => {
  const [view, setView] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [hotel, setHotel] = useState(null);   // store hotel object from /api/me/
  const router = useRouter();

  // Fetch logged-in hotel info using token
  useEffect(() => {
    const fetchHotelInfo = async () => {
      try {
        const res = await api.get("/api/me/"); // backend returns {hotel_id, hotel_name}
        setHotel(res.data);
      } catch (err) {
        console.error("Failed to fetch hotel info", err);
      }
    };
    fetchHotelInfo();
  }, []);

  return (
    <div className="min-h-screen flex">
      
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 
          bg-gradient-to-b from-indigo-900/90 via-gray-900/80 to-black/70 
          backdrop-blur-md text-white flex flex-col justify-start p-6 z-20 
          transform transition-transform duration-300 shadow-2xl 
          border-r border-gray-700/40 
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
      
        {/* Hotel Profile button */}
        <div className="flex flex-col items-center mb-4">
          <button
            onClick={() => hotel && router.push(`/owner/hotel-profile/${hotel.hotel_id}`)}
            className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-600 shadow hover:shadow-lg transition"
          >
            <img
              src="/admindash1.jpg"
              alt="Hotel Profile"
              className="w-full h-full object-cover"
            />
          </button>
          {hotel && (
            <>
              <span className="mt-2 text-sm font-medium text-red-700">
                Hotel ID: {hotel.hotel_id}
              </span>
              <span className="mt-1 text-sm font-medium text-green-400">
                {hotel.hotel_name}
              </span>
            </>
          )}
        </div>

        <div className="flex justify-center mb-4">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">
            CloudInn
          </h2>
        </div>

        {/* Sidebar buttons */}
        <button onClick={() => router.push("/owner/sendview-announcements")} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
          <span className="text-white font-bold">Send Announcements</span>
        </button>

        <button onClick={() => router.push("/owner/room-price-available")} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
          <span className="text-white font-bold">Manage Rooms</span>
        </button>

        <button onClick={() => router.push("/owner/manage-staffdetails")} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
          <span className="text-white font-bold">Manage Staff Details</span>
        </button>

        <button onClick={() => router.push("/owner/view-maintenancerequests")} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
          <span className="text-white font-bold">Manage Maintenance Requests</span>
        </button>

        <button onClick={() => setView("commission")} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
          <span className="text-white font-bold">Commission Reports</span>
        </button>

        {/* Settings */}
        <button onClick={() => setSettingsOpen(!settingsOpen)} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition w-full text-left">
          <FaCog className="text-white" />
          <span className="text-white font-semibold">Settings</span>
        </button>

        {settingsOpen && (
          <div className="flex flex-col gap-2 ml-4 mt-2">
            <button onClick={() => router.push("/owner/manage-promotionsdiscounts")} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
              Promotions/Discounts Setting
            </button>
            <button onClick={() => router.push('/owner/owner-notification-setting?sidebar=true')} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
              Notifications & Setting
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`flex-1 p-5 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="px-2 py-1 text-xs bg-purple-600 text-white rounded">
              {sidebarOpen ? "Hide Menu" : "Show Menu"}
            </button>
            <h1 className="text-3xl font-bold text-black drop-shadow-lg ml-1">
              Owner Dashboard
            </h1>
          </div>

          {/* Notification bell */}
          <div className="relative inline-block">
            <button onClick={() => router.push('/owner/owner-notification-setting')} className="text-4xl text-purple-600 hover:text-purple-700 transition">
              🔔
            </button>
            <span className="absolute top-0 right-0 translate-x-[-0px] translate-y-[-8px] bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              1
            </span>
          </div>
        </div>

        {/* Top buttons */}
        <div className="flex justify-center gap-2 flex-wrap mb-4">
          <button onClick={() => setView("bookings")} className="px-4 py-2 bg-blue-600 text-white rounded">
            View Bookings
          </button>
          <button onClick={() => setView("checkincheckout")} className="px-4 py-2 bg-purple-600 text-white rounded">
            View Check-in/Check-out
          </button>
          <button onClick={() => setView("payment")} className="px-4 py-2 bg-purple-600 text-white rounded">
            View Payment Status
          </button>
          <button onClick={() => setView("earnings")} className="px-4 py-2 bg-blue-600 text-white rounded">
            View Earning Reports
          </button>
        </div>

        {/* Conditional Views */}
        {view === "bookings" && <ViewBookings />}
        {view === "earnings" && <ViewEarningReports />}
        {view === "commission" && <ViewCommissionReports />}
        {view === "reviews" && <ReviewsAndFeedbacks />}
        {view === "payment" && <CheckPaymentStatus />}
        {view === "profile" && <HotelProfile />}
        {view === "checkincheckout" && <ViewCheckinCheckout />}
      </div>
    </div>
  );
};

export default OwnerDashboard;
