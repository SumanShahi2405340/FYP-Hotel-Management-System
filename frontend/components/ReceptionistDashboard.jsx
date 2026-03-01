'use client';
import React, { useState } from "react";
import { FaCog } from "react-icons/fa";
import FourButtons from "@/components/FourButtons";

export default function ReceptionistDashboard() {
  const [menuOpen, setMenuOpen] = useState(true);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      {menuOpen && (
        <div
          className={`fixed top-0 left-0 h-screen w-72
            bg-gradient-to-b from-indigo-900/90 via-gray-900/80 to-black/70
            backdrop-blur-md text-white flex flex-col justify-start p-6 z-20
            transform transition-transform duration-300 shadow-2xl
            border-r border-gray-700/40`}
        >
          {/* Receptionist Profile */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-600 shadow">
              <img src="/admindash1.jpg" alt="Receptionist Profile" className="w-full h-full object-cover" />
            </div>
            <span className="mt-2 text-sm font-medium text-green-400">Receptionist Panel</span>
          </div>

          <div className="flex justify-center mb-4">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">
              CloudInn
            </h2>
          </div>

          {/* Sidebar buttons */}
          <button className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
            Manage Reservations
          </button>
          <button className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
            Guest Requests
          </button>
          <button className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
            Room Availability
          </button>
          <button className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm w-full text-left">
            Announcements
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
        {/* Transparent Container */}
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
        
        {/* Top buttons and panels */}
        <FourButtons />
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <h2 className="text-lg font-semibold mb-4">Do you really want to logout?</h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowLogoutPopup(false)}
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




 





