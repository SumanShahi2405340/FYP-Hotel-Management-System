"use client";
import React, { useState, useEffect } from "react";
import { FaCog } from "react-icons/fa";
import { useRouter } from "next/navigation";
import recepApi from "@/utils/recep";   // axios instance
import TwoButtons from "@/components/TwoButtons"; // import your bookings component

export default function ReceptionistDashboard() {
  const [menuOpen, setMenuOpen] = useState(true);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [hotel, setHotel] = useState(null);
  const [activePanel, setActivePanel] = useState(null); // NEW state for panel switching
  const router = useRouter();

  useEffect(() => {
    const fetchHotelInfo = async () => {
      try {
        const res = await recepApi.get("/api/hotel/receptionist/");
        if (res.status === 200) {
          setHotel({ hotel_id: res.data.hotel_id, hotel_name: res.data.hotel_name });
        }
      } catch (err) {
        console.error("Failed to fetch hotel info", err);
      }
    };

    fetchHotelInfo();
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      {menuOpen && (
        <div className="fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-indigo-900/90 via-gray-900/80 to-black/70 backdrop-blur-md text-white flex flex-col justify-start p-6 z-20 shadow-2xl border-r border-gray-700/40">
          
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

          {/* Sidebar buttons */}
          <button
            onClick={() => router.push("/receptionist/manage-staffnnattendance")}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left whitespace-nowrap"
          >
            <span className="text-white font-bold">Manage Staff & Attendance</span>
          </button>

          <button
            onClick={() => router.push("/receptionist/send-view-maintenancerequests")}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left whitespace-nowrap"
          >
            <span className="text-white font-bold">Send Maintenance Requests</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition w-full text-left mt-2"
          >
            <FaCog className="text-white" />
            <span className="text-white font-semibold">Settings</span>
          </button>

          {settingsOpen && (
            <div className="flex flex-col gap-2 ml-4 mt-2">
              <button className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
                Notifications & Setting
              </button>
              <button className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left whitespace-nowrap">
                View Promotion/Discount in N&S
              </button>
            </div>
          )}

          {/* Logout button */}
          <div className="mt-auto flex justify-center">
            <button
              onClick={() => setShowLogoutPopup(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`flex-1 p-5 transition-all duration-300 ${menuOpen ? "ml-72" : "ml-0"}`}
        style={{
          backgroundImage: "url('/5.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "100vh",
        }}
      >
        {/* Top Heading */}
        <div className="grid grid-cols-3 items-center mb-6">
          <div className="flex justify-start">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="px-2 py-1 text-xs bg-purple-600 text-white rounded"
            >
              {menuOpen ? "Hide Menu" : "Show Menu"}
            </button>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-4 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-green-400 drop-shadow-lg text-center">
              Receptionist Dashboard
            </h1>
          </div>
          <div className="flex justify-end">
            <div className="relative inline-block">
              <button className="text-4xl text-purple-600 hover:text-purple-700 transition">
                🔔
              </button>
              <span className="absolute top-0 right-0 translate-y-[-8px] bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                1
              </span>
            </div>
          </div>
        </div>

        {/* NEW Buttons for panels */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => setActivePanel("bookings")}
            className={`px-4 py-2 rounded-lg ${
              activePanel === "bookings" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Manage Bookings
          </button>
          <button
            onClick={() => setActivePanel("earnings")}
            className={`px-4 py-2 rounded-lg ${
              activePanel === "earnings" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Manage Earning Reports
          </button>
        </div>

        {/* Panel Content */}
        <div className="mt-6">
          {activePanel === "bookings" && (
            <TwoButtons/>
          )}

          {activePanel === "earnings" && (
            <div className="p-6 bg-white/70 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Manage Earning Report</h3>
              <p className="text-gray-700">Earning report functionality will go here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <h2 className="text-lg font-semibold mb-4">Do you really want to logout?</h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  localStorage.removeItem("recepToken");
                  localStorage.removeItem("recepRefreshToken");
                  setShowLogoutPopup(false);
                  router.push("http://localhost:3000/role");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutPopup(false)}
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
}
