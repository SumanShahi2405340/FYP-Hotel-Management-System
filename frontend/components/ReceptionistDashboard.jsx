"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  FaCog, FaWrench, FaChartLine, FaBed,
  FaCalendarCheck, FaSignOutAlt, FaChevronDown, FaHotel, FaBuilding, FaTachometerAlt,
  FaUserPlus, FaList, FaUsers, FaUserCircle, FaBell, FaBook, FaPlus, FaUserFriends,
  FaDoorOpen, FaClipboardList, FaCheckCircle, FaSpinner, FaMoneyBillWave, FaTags, FaSun, FaMoon
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import recepApi from "@/utils/recep";
import api from "@/utils/api";
import ManagePaymentsDashboard from "@/components/ManagePaymentsDashboard";
import EarningReports from "@/components/EarningReports";
import RoomStatusPanel from "@/components/RoomStatusPanel";

const API_BASE_URL = "http://localhost:8000";
const RECEPTIONIST_NOTIFICATION_SEEN_IDS_KEY = "cloudinn_receptionist_seen_notification_ids";
const RECEPTIONIST_SOUND_STATUS_KEY = "receptionist_notification_sound_status";
const RECEPTIONIST_MUTE_UNTIL_KEY = "receptionist_notification_mute_until";
const RECEPTIONIST_THEME_KEY = "cloudinn_receptionist_dashboard_theme";

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
  const [notificationCount, setNotificationCount] = useState(0);
  const [newNotificationPopup, setNewNotificationPopup] = useState(null);
  const [themeMode, setThemeMode] = useState("dark");

  const notificationAudioRef = useRef(null);
  const previousUnseenIdsRef = useRef(new Set());
  const currentNotificationIdsRef = useRef([]);
  const soundUnlockedRef = useRef(false);

  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem(RECEPTIONIST_THEME_KEY) || "dark";
    setThemeMode(savedTheme);
    document.documentElement.setAttribute("data-receptionist-theme", savedTheme);
  }, []);

  const toggleThemeMode = () => {
    const nextTheme = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextTheme);
    localStorage.setItem(RECEPTIONIST_THEME_KEY, nextTheme);
    document.documentElement.setAttribute("data-receptionist-theme", nextTheme);
  };

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

  const getStoredAccessToken = () => {
    if (typeof window === "undefined") return null;

    return (
      localStorage.getItem("recepToken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token")
    );
  };

  const getAuthHeaders = () => {
    const token = getStoredAccessToken();

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    return headers;
  };

  const getSeenNotificationIds = () => {
    if (typeof window === "undefined") return new Set();

    try {
      const saved = JSON.parse(
        localStorage.getItem(RECEPTIONIST_NOTIFICATION_SEEN_IDS_KEY) || "[]"
      );

      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  };

  const saveSeenNotificationIds = (ids) => {
    if (typeof window === "undefined") return;

    localStorage.setItem(
      RECEPTIONIST_NOTIFICATION_SEEN_IDS_KEY,
      JSON.stringify([...new Set(ids)])
    );
  };

  const isSoundMuted = () => {
    if (typeof window === "undefined") return false;

    const status =
      localStorage.getItem(RECEPTIONIST_SOUND_STATUS_KEY) || "Active";

    const muteUntil = Number(
      localStorage.getItem(RECEPTIONIST_MUTE_UNTIL_KEY) || 0
    );

    if (status === "Muted until unmuted") return true;

    if (status === "Muted for 1 hour") {
      if (muteUntil && Date.now() < muteUntil) return true;

      localStorage.setItem(RECEPTIONIST_SOUND_STATUS_KEY, "Active");
      localStorage.removeItem(RECEPTIONIST_MUTE_UNTIL_KEY);
    }

    return false;
  };

  const playFallbackBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.12;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();

      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 250);
    } catch (err) {
      console.log("Fallback beep blocked:", err);
    }
  };

  const playNotificationSound = () => {
    if (isSoundMuted()) return;

    if (notificationAudioRef.current) {
      notificationAudioRef.current.currentTime = 0;

      notificationAudioRef.current.play().catch(() => {
        playFallbackBeep();
      });
    } else {
      playFallbackBeep();
    }
  };

  const unlockSound = () => {
    if (soundUnlockedRef.current) return;

    soundUnlockedRef.current = true;

    if (!notificationAudioRef.current) {
      notificationAudioRef.current = new Audio("/sounds/notification.mp3");
      notificationAudioRef.current.preload = "auto";
    }

    notificationAudioRef.current
      .play()
      .then(() => {
        notificationAudioRef.current.pause();
        notificationAudioRef.current.currentTime = 0;
      })
      .catch(() => {});
  };

  const normalizeReceptionistNotifications = (data) => {
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.announcements)
      ? data.announcements
      : Array.isArray(data?.notifications)
      ? data.notifications
      : [];

    return items
      .filter((item) => item && item.id !== null && item.id !== undefined)
      .map((item) => {
        const timestamp =
          item.timestamp ||
          item.created_at ||
          item.createdAt ||
          item.date ||
          new Date().toISOString();

        return {
          id: "receptionist_notification_" + item.id,
          originalId: item.id,
          message:
            item.content ||
            item.message ||
            item.description ||
            "New owner announcement",
          hotelName:
            item.hotel_name ||
            item.owner_hotel_name ||
            item.owner_name ||
            item.hotel ||
            hotel?.hotel_name ||
            "CloudInn",
          timestamp,
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const fetchReceptionistNotifications = async ({ playSoundForNew = true } = {}) => {
    try {
      const response = await fetch(API_BASE_URL + "/api/recent-announcements/", {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        console.error("Receptionist notification fetch failed:", data);
        return;
      }

      const notificationItems = normalizeReceptionistNotifications(data);

      currentNotificationIdsRef.current = notificationItems.map((item) => item.id);

      const seenIds = getSeenNotificationIds();
      const unseenItems = notificationItems.filter((item) => !seenIds.has(item.id));
      const unseenIds = new Set(unseenItems.map((item) => item.id));
      const oldUnseenIds = previousUnseenIdsRef.current || new Set();

      const hasNewId = [...unseenIds].some((id) => !oldUnseenIds.has(id));

      setNotificationCount(unseenItems.length);

      if (playSoundForNew && unseenItems.length > 0 && hasNewId) {
        playNotificationSound();

        setNewNotificationPopup(unseenItems[0]);

        setTimeout(() => {
          setNewNotificationPopup(null);
        }, 5000);
      }

      previousUnseenIdsRef.current = unseenIds;
    } catch (error) {
      console.error("Receptionist dashboard notification error:", error);
    }
  };

  const markReceptionistNotificationsAsSeen = () => {
    saveSeenNotificationIds(currentNotificationIdsRef.current || []);

    setNotificationCount(0);
    previousUnseenIdsRef.current = new Set();
    setNewNotificationPopup(null);
  };


  useEffect(() => {
    notificationAudioRef.current = new Audio("/sounds/notification.mp3");
    notificationAudioRef.current.preload = "auto";

    const handleFirstUserClick = () => unlockSound();

    window.addEventListener("click", handleFirstUserClick, { once: true });
    window.addEventListener("keydown", handleFirstUserClick, { once: true });

    fetchReceptionistNotifications({ playSoundForNew: false });

    const interval = setInterval(() => {
      fetchReceptionistNotifications({ playSoundForNew: true });
    }, 3000);

    const handleFocus = () => {
      fetchReceptionistNotifications({ playSoundForNew: true });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("click", handleFirstUserClick);
      window.removeEventListener("keydown", handleFirstUserClick);
    };
  }, [hotel?.hotel_name]);


  const handleLogout = () => {
    localStorage.removeItem("recepToken");
    localStorage.removeItem("recepRefreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    router.push("http://localhost:3000/role");
  };

  // Bell icon → sidebar CLOSED (showMenu=false)
  const handleNotificationFromBell = () => {
    unlockSound();
    markReceptionistNotificationsAsSeen();
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
        :root[data-receptionist-theme='dark'] {
          --receptionist-page-bg: linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%);
          --receptionist-card-bg: rgba(255, 255, 255, 0.05);
          --receptionist-border: rgba(255, 255, 255, 0.10);
          --receptionist-text: #ffffff;
          --receptionist-muted: #9ca3af;
          --receptionist-sidebar-bg: linear-gradient(180deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.95));
          --receptionist-topbar-bg: linear-gradient(90deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.95));
        }
        :root[data-receptionist-theme='light'] {
          --receptionist-page-bg: linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%);
          --receptionist-card-bg: rgba(255, 255, 255, 0.92);
          --receptionist-border: rgba(148, 163, 184, 0.35);
          --receptionist-text: #111827;
          --receptionist-muted: #64748b;
          --receptionist-sidebar-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.96));
          --receptionist-topbar-bg: linear-gradient(90deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
        }
        body { font-family: 'Inter', sans-serif; background: var(--receptionist-page-bg); }
        .receptionist-page-bg { background: var(--receptionist-page-bg) !important; }
        .receptionist-sidebar-bg { background: var(--receptionist-sidebar-bg) !important; }
        .receptionist-topbar-bg { background: var(--receptionist-topbar-bg) !important; }
        .receptionist-card-bg { background: var(--receptionist-card-bg) !important; border-color: var(--receptionist-border) !important; }
        :root[data-receptionist-theme='light'] .text-white { color: var(--receptionist-text) !important; }
        :root[data-receptionist-theme='light'] .text-gray-300,
        :root[data-receptionist-theme='light'] .text-gray-400,
        :root[data-receptionist-theme='light'] .text-gray-500 { color: var(--receptionist-muted) !important; }
        :root[data-receptionist-theme='light'] .bg-white\/5,
        :root[data-receptionist-theme='light'] .bg-white\/10 { background-color: var(--receptionist-card-bg) !important; }
        :root[data-receptionist-theme='light'] .border-white\/10,
        :root[data-receptionist-theme='light'] .border-white\/20 { border-color: var(--receptionist-border) !important; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease forwards; }
        .animate-slideIn  { animation: slideIn  0.3s ease forwards; }
        .animate-slideDown { animation: slideDown 0.35s ease forwards; }
        .hover-scale { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-scale:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); }
      `}</style>

      <div className="min-h-screen flex receptionist-page-bg">

        {newNotificationPopup && (
          <div className="fixed top-6 right-6 z-[9999] w-80 rounded-2xl bg-gray-900/95 border border-purple-500/40 shadow-2xl p-4 animate-slideDown">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <FaBell className="text-purple-400" />
              </div>

              <div className="flex-1">
                <p className="text-white font-semibold text-sm">New owner announcement</p>
                <p className="text-purple-300 text-xs mt-1">From: {newNotificationPopup.hotelName}</p>
                <p className="text-gray-300 text-sm mt-2 line-clamp-2">{newNotificationPopup.message}</p>
              </div>

              <button
                onClick={() => setNewNotificationPopup(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        )}


        {/* Sidebar */}
        <div className={`fixed top-0 left-0 h-screen w-80 receptionist-sidebar-bg backdrop-blur-xl text-white flex flex-col z-20 transform transition-all duration-300 shadow-2xl border-r border-white/10 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>

          {/* Hotel profile */}
          <div className="relative px-6 py-8 border-b border-white/10">
            <div className="flex flex-col items-center">
              <div
                className="relative group cursor-pointer"
                onClick={() => hotel && router.push(`/receptionist/hotel-profile/${hotel.hotel_id}`)}
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
                    <FaBell className="text-xs" /> Notifications & Settings
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
          <div className="sticky top-0 z-10 receptionist-topbar-bg backdrop-blur-xl border-b border-white/10 px-8 py-4">
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
                <button
                  onClick={toggleThemeMode}
                  className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 group receptionist-card-bg"
                  title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {themeMode === "dark" ? (
                    <FaSun className="text-xl text-yellow-400 group-hover:scale-110 transition-transform" />
                  ) : (
                    <FaMoon className="text-xl text-purple-500 group-hover:scale-110 transition-transform" />
                  )}
                </button>

                {/* ✅ Bell icon → showMenu=false → sidebar CLOSED */}
                <button
                  onClick={handleNotificationFromBell}
                  className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 group"
                >
                  <FaBell className="text-xl text-purple-400 group-hover:scale-110 transition-transform" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-pulse border border-white shadow-lg">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </span>
                  )}
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