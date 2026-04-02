// components/AddBookings.jsx
'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import {
  FaPlus, FaRobot, FaTimes, FaBed, FaGripVertical,
  FaWifi, FaCoffee, FaTv, FaSnowflake, FaShower,
  FaParking, FaDumbbell, FaSwimmingPool, FaUtensils, FaConciergeBell,
  FaCalendarAlt, FaUser, FaEnvelope, FaPhone, FaDoorOpen, FaDollarSign,
  FaInfoCircle, FaCheckCircle, FaArrowLeft, FaPaperPlane, FaStar,
  FaHotel, FaSpa, FaUmbrellaBeach, FaExclamationCircle, FaChevronDown,
  FaChevronUp, FaLightbulb
} from "react-icons/fa";

// ─── FIX: Register Chart.js Filler plugin globally ───────────────────────────
// This prevents "Tried to use the 'fill' option without the 'Filler' plugin" error
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,   // ← fixes the fill error
  Tooltip,
  Legend
);

// ─── Room Amenities Config ────────────────────────────────────────────────────
const roomAmenities = {
  normal: {
    name: "Normal Room",
    priceRange: "$50-80",
    amenities: [
      { icon: FaWifi, name: "Free High-Speed WiFi" },
      { icon: FaTv, name: "40-inch Smart TV" },
      { icon: FaCoffee, name: "Coffee/Tea Maker" },
      { icon: FaSnowflake, name: "Air Conditioning" },
      { icon: FaShower, name: "Private Bathroom" },
      { icon: FaBed, name: "Comfortable Queen Bed" },
    ],
    facilities: [
      { icon: FaParking, name: "Free Parking" },
      { icon: FaConciergeBell, name: "24/7 Room Service" },
      { icon: FaUtensils, name: "Complimentary Breakfast" },
    ],
    color: "from-blue-500 to-cyan-500",
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  deluxe: {
    name: "Deluxe Room",
    priceRange: "$100-150",
    amenities: [
      { icon: FaWifi, name: "Free High-Speed WiFi" },
      { icon: FaTv, name: "55-inch 4K Smart TV" },
      { icon: FaCoffee, name: "Premium Coffee Machine" },
      { icon: FaSnowflake, name: "Central AC" },
      { icon: FaShower, name: "Luxury Bathroom" },
      { icon: FaBed, name: "King Size Bed" },
      { icon: FaUtensils, name: "Mini Bar" },
    ],
    facilities: [
      { icon: FaParking, name: "Reserved Parking" },
      { icon: FaConciergeBell, name: "24/7 Concierge" },
      { icon: FaUtensils, name: "Breakfast Buffet" },
      { icon: FaSwimmingPool, name: "Pool Access" },
      { icon: FaDumbbell, name: "Gym Access" },
    ],
    color: "from-purple-500 to-pink-500",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  suite: {
    name: "Suite Room",
    priceRange: "$200-300",
    amenities: [
      { icon: FaWifi, name: "Ultra Fast WiFi" },
      { icon: FaTv, name: "65-inch OLED TV" },
      { icon: FaCoffee, name: "Espresso Machine" },
      { icon: FaSnowflake, name: "Climate Control" },
      { icon: FaShower, name: "Spa Bathroom" },
      { icon: FaBed, name: "Super King Bed" },
      { icon: FaUtensils, name: "Stocked Mini Bar" },
      { icon: FaConciergeBell, name: "Butler Service" },
    ],
    facilities: [
      { icon: FaParking, name: "VIP Parking" },
      { icon: FaConciergeBell, name: "Personal Butler" },
      { icon: FaUtensils, name: "Gourmet Breakfast" },
      { icon: FaSwimmingPool, name: "Private Pool" },
      { icon: FaDumbbell, name: "Personal Gym" },
    ],
    color: "from-orange-500 to-red-500",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  }
};

// ─── Suggested Questions ──────────────────────────────────────────────────────
const SUGGESTED_QUESTIONS = [
  { emoji: "🏨", text: "How many rooms are available right now?" },
  { emoji: "💰", text: "What is the cheapest available room?" },
  { emoji: "👑", text: "Which suite rooms are free today?" },
  { emoji: "📊", text: "What is the current occupancy rate?" },
  { emoji: "🛏️", text: "Compare Normal vs Deluxe rooms" },
  { emoji: "⏰", text: "Who is checking out soon?" },
  { emoji: "💡", text: "Which room should I book for 3 nights?" },
  { emoji: "🏷️", text: "Show me all room prices and amenities" },
  { emoji: "🔢", text: "How many rooms are currently booked?" },
  { emoji: "🌟", text: "What's the best value room right now?" },
  { emoji: "🛎️", text: "Are all deluxe rooms occupied?" },
  { emoji: "📅", text: "Which rooms will be free in 2 days?" },
];

// ─── Helper: extract room type from room number ───────────────────────────────
const getRoomType = (roomNumber) => {
  const n = parseInt(roomNumber);
  if (n >= 101 && n <= 199) return "normal";
  if (n >= 201 && n <= 299) return "deluxe";
  if (n >= 301 && n <= 399) return "suite";
  return null;
};

// ─── FIX: Robust room number extractor ───────────────────────────────────────
// Handles formats: "101", "101 / Normal", "Room 101", "normal", "deluxe", "suite"
const extractRoomNumber = (roomStr) => {
  if (!roomStr) return null;
  const match = roomStr.toString().match(/\d+/);
  return match ? parseInt(match[0]) : null;
};

// ─── Component ────────────────────────────────────────────────────────────────
const AddBookings = () => {
  const router = useRouter();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "", email: "", contact: "", room: "", days: "", checkin: "", checkout: ""
  });
  const [errors, setErrors]                     = useState({});
  const [loading, setLoading]                   = useState(false);
  const [showSuccess, setShowSuccess]           = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);

  // ── API data state ──────────────────────────────────────────────────────────
  const [prices, setPrices]           = useState(null);
  const [inventory, setInventory]     = useState(null);
  const [allRooms, setAllRooms]       = useState([]);
  const [bookings, setBookings]       = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError]     = useState(null);

  // ── Chatbot state ───────────────────────────────────────────────────────────
  const [showChatbot, setShowChatbot]           = useState(false);
  const [showSuggestions, setShowSuggestions]   = useState(true);
  const [chatMessages, setChatMessages]         = useState([
    {
      type: "bot",
      text: "👋 Hi! I'm your AI Booking Assistant powered by real-time hotel data.\n\nI can answer questions like:\n• How many rooms are available right now?\n• Which suite rooms are free?\n• What's the cheapest option today?\n• Who is checking out soon?\n• Which room is best for my budget?\n\nTap a suggestion below or ask me anything! 🏨"
    }
  ]);
  const [chatInput, setChatInput]               = useState("");
  const [isTyping, setIsTyping]                 = useState(false);
  const [chatPosition, setChatPosition]         = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging]             = useState(false);
  const [dragOffset, setDragOffset]             = useState({ x: 0, y: 0 });

  const messagesEndRef = useRef(null);
  const chatInputRef   = useRef(null);
  const chatbotRef     = useRef(null);

  // ── Fetch all real data once on mount ──────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        const [priceRes, invRes, bookingsRes] = await Promise.all([
          api.get("/api/room-price/"),
          api.get("/api/room-inventory/"),
          api.get("/api/manage-bookings/"),
        ]);

        const pr  = priceRes.data;
        const inv = invRes.data;
        const bks = Array.isArray(bookingsRes.data)
          ? bookingsRes.data
          : bookingsRes.data?.results ?? [];

        setPrices(pr);
        setInventory(inv);
        setBookings(bks);

        const rooms = [];
        const push = (count, type, price, start) => {
          for (let i = 0; i < count; i++) {
            rooms.push({ number: start + i, type, price });
          }
        };
        push(inv.normal_rooms, "Normal", pr.normal_price, 101);
        push(inv.deluxe_rooms, "Deluxe", pr.deluxe_price, 201);
        push(inv.suite_rooms,  "Suite",  pr.suite_price,  301);
        setAllRooms(rooms);
      } catch (err) {
        console.error("Error fetching hotel data:", err);
        setDataError("Failed to load hotel data. Please refresh the page.");
      } finally {
        setDataLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── FIX: Real-time occupancy check ─────────────────────────────────────────
  // A room is occupied only if now >= checkin AND now < checkout
  // Uses regex to extract the room number from any format like "101 / Normal"
  const isOccupied = useCallback((roomNumber) => {
    const now = new Date();
    return bookings.some((b) => {
      if (!b.room) return false;

      // ✅ Robustly extract number from "101 / Normal", "Room 101", "101", etc.
      const extractedNum = extractRoomNumber(b.room);
      if (extractedNum === null) return false;
      if (extractedNum !== roomNumber) return false;

      // ✅ Only count as occupied if currently checked in (now between checkin and checkout)
      const checkin  = b.checkin  ? new Date(b.checkin)  : null;
      const checkout = b.checkout ? new Date(b.checkout) : null;

      // If no dates at all, treat as occupied (safety)
      if (!checkin) return false;

      // If only checkin provided, treat as occupied from checkin onwards
      if (!checkout) return now >= checkin;

      // ✅ Core check: must be between checkin and checkout
      return now >= checkin && now < checkout;
    });
  }, [bookings]);

  const enrichedRooms = useMemo(
    () => allRooms.map((r) => ({ ...r, isAvailable: !isOccupied(r.number) })),
    [allRooms, isOccupied]
  );

  const availableRooms = useMemo(
    () => enrichedRooms.filter((r) => r.isAvailable),
    [enrichedRooms]
  );

  // ── Scroll chat to bottom ───────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── Drag logic ──────────────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (!e.target.closest(".chatbot-drag-handle")) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = chatbotRef.current.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging) return;
      setChatPosition({
        x: Math.min(Math.max(e.clientX - dragOffset.x, 10), window.innerWidth  - 440),
        y: Math.min(Math.max(e.clientY - dragOffset.y, 10), window.innerHeight - 680),
      });
    };
    const onUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup",   onUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [isDragging, dragOffset]);

  // ── Send message to Claude chatbot ─────────────────────────────────────────
  const handleSendMessage = async (overrideText = null) => {
    const userMsg = (overrideText ?? chatInput).trim();
    if (!userMsg || isTyping) return;

    const historyToSend = chatMessages.slice(-10);

    setChatMessages((prev) => [...prev, { type: "user", text: userMsg }]);
    setChatInput("");
    setIsTyping(true);
    setShowSuggestions(false);

    // ── Build accurate per-type availability summary for the AI ──────────────
    const normalAvail  = enrichedRooms.filter(r => r.type === "Normal" && r.isAvailable);
    const deluxeAvail  = enrichedRooms.filter(r => r.type === "Deluxe" && r.isAvailable);
    const suiteAvail   = enrichedRooms.filter(r => r.type === "Suite"  && r.isAvailable);
    const normalOccup  = enrichedRooms.filter(r => r.type === "Normal" && !r.isAvailable);
    const deluxeOccup  = enrichedRooms.filter(r => r.type === "Deluxe" && !r.isAvailable);
    const suiteOccup   = enrichedRooms.filter(r => r.type === "Suite"  && !r.isAvailable);

    try {
      const res = await fetch("/api/hotel-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: historyToSend,
          context: {
            // ✅ Send full enriched room list with correct isAvailable flag
            rooms: enrichedRooms,

            // ✅ Send explicit available/occupied room numbers so AI can't be confused
            availability: {
              normal: {
                total:     inventory?.normal_rooms ?? 0,
                available: normalAvail.length,
                occupied:  normalOccup.length,
                availableRooms: normalAvail.map(r => r.number),
                occupiedRooms:  normalOccup.map(r => r.number),
              },
              deluxe: {
                total:     inventory?.deluxe_rooms ?? 0,
                available: deluxeAvail.length,
                occupied:  deluxeOccup.length,
                availableRooms: deluxeAvail.map(r => r.number),
                occupiedRooms:  deluxeOccup.map(r => r.number),
              },
              suite: {
                total:     inventory?.suite_rooms ?? 0,
                available: suiteAvail.length,
                occupied:  suiteOccup.length,
                availableRooms: suiteAvail.map(r => r.number),
                occupiedRooms:  suiteOccup.map(r => r.number),
              },
              totalAvailable: availableRooms.length,
              totalRooms:     enrichedRooms.length,
            },

            bookings,
            prices:    prices    ?? {},
            inventory: inventory ?? {},
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      setChatMessages((prev) => [
        ...prev,
        { type: "bot", text: data.reply ?? "Sorry, no response received." }
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: `⚠️ ${err.message || "Connection error. Please try again."}\n\nMake sure your API route is set up at /api/hotel-chat`
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (text) => handleSendMessage(text);

  // ── Price calculator ────────────────────────────────────────────────────────
  const priceInfo = useMemo(() => {
    if (!prices || !formData.days || !formData.room) return null;
    const days = Number(formData.days);
    if (!days || days < 1) return null;

    const room = formData.room.toLowerCase();
    let unitPrice = 0;

    if      (room.includes("normal")) unitPrice = prices.normal_price;
    else if (room.includes("deluxe")) unitPrice = prices.deluxe_price;
    else if (room.includes("suite"))  unitPrice = prices.suite_price;
    else {
      const num = extractRoomNumber(formData.room);
      if (num) {
        if      (num >= 101 && num <= 199) unitPrice = prices.normal_price;
        else if (num >= 201 && num <= 299) unitPrice = prices.deluxe_price;
        else if (num >= 301 && num <= 399) unitPrice = prices.suite_price;
      }
    }

    if (!unitPrice) return null;
    const rawTotal = days * parseFloat(unitPrice);
    const discount = days >= 3 ? 0.1 : 0;
    const total    = rawTotal * (1 - discount);

    return {
      unit: unitPrice,
      total,
      rawTotal,
      discount: discount > 0,
      formatted: discount
        ? `$${unitPrice} × ${days} day${days > 1 ? "s" : ""} − 10% discount = $${total.toFixed(2)}`
        : `$${unitPrice} × ${days} day${days > 1 ? "s" : ""} = $${total.toFixed(2)}`,
    };
  }, [prices, formData.days, formData.room]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateForm = () => {
    const e = {};
    if (!formData.name.trim())    e.name    = "Name is required";
    if (!formData.email.trim())   e.email   = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Invalid email address";
    if (!formData.contact.trim()) e.contact = "Contact is required";
    if (!formData.room.trim())    e.room    = "Room is required";
    if (!formData.days || formData.days < 1) e.days = "Enter a valid number of days";
    if (!formData.checkin)        e.checkin  = "Check-in date is required";
    if (!formData.checkout)       e.checkout = "Check-out date is required";
    if (formData.checkin && formData.checkout &&
        new Date(formData.checkin) >= new Date(formData.checkout)) {
      e.checkout = "Check-out must be after check-in";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Form submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await api.post("/api/manage-bookings/", {
        ...formData,
        days:     Number(formData.days),
        checkin:  new Date(formData.checkin).toISOString(),
        checkout: new Date(formData.checkout).toISOString(),
        status: "Booked",
      });

      setShowSuccess(true);

      const refreshed = await api.get("/api/manage-bookings/");
      setBookings(
        Array.isArray(refreshed.data)
          ? refreshed.data
          : refreshed.data?.results ?? []
      );

      setTimeout(() => {
        setShowSuccess(false);
        setFormData({ name: "", email: "", contact: "", room: "", days: "", checkin: "", checkout: "" });
        setSelectedRoomType(null);
      }, 3000);
    } catch (err) {
      console.error("Booking error:", err);
      alert("Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Room input handler ──────────────────────────────────────────────────────
  const handleRoomChange = (value) => {
    setFormData((prev) => ({ ...prev, room: value }));
    const lower = value.toLowerCase();
    if      (lower.includes("normal")) setSelectedRoomType("normal");
    else if (lower.includes("deluxe")) setSelectedRoomType("deluxe");
    else if (lower.includes("suite"))  setSelectedRoomType("suite");
    else {
      const num = extractRoomNumber(value);
      setSelectedRoomType(num ? getRoomType(num) : null);
    }
  };

  const inputCls = (field) =>
    `w-full pl-10 pr-3 py-2.5 bg-white/5 backdrop-blur-sm border rounded-xl text-white
     placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all duration-300
     group-hover:bg-white/10 ${errors[field] ? "border-red-500" : "border-white/20"}`;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* ── Background ──────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-fixed z-0"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-800/90" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>
      </div>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <div className="relative z-10 min-h-screen p-8">

        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl text-white transition-all duration-300 border border-white/20 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <FaArrowLeft className="text-sm" />
          Back to Dashboard
        </button>

        {dataError && (
          <div className="mb-4 max-w-7xl mx-auto p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-300">
            <FaExclamationCircle /><span>{dataError}</span>
          </div>
        )}

        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8 animate-fadeInUp">
            <div className="inline-block p-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-2xl">
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl px-8 py-4">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <FaHotel className="text-4xl text-purple-400" />
                  <FaSpa className="text-4xl text-pink-400" />
                  <FaUmbrellaBeach className="text-4xl text-orange-400" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-3">
                  Create New Booking
                </h1>
                <p className="text-gray-300 text-lg">Experience luxury and comfort with our premium room selection</p>
                <div className="flex justify-center gap-1 mt-2">
                  {[1,2,3,4,5].map((s) => <FaStar key={s} className="text-yellow-500 text-sm" />)}
                  <span className="text-gray-400 text-sm ml-2">5.0 (1,234 reviews)</span>
                </div>
                {dataLoading ? (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-gray-500/20 border border-gray-500/40 rounded-full text-gray-400 text-sm">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                    Loading live room data...
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 text-sm">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    {availableRooms.length} rooms available right now
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">

            {/* ── Booking Form ─────────────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 animate-fadeInUp">

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Booking Details</h2>
                    <p className="text-gray-300 text-sm">Enter guest information and room preferences</p>
                  </div>
                  <button
                    onClick={() => setShowChatbot((v) => !v)}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg transform hover:scale-105"
                  >
                    <FaRobot className="text-lg" />
                    <span className="hidden sm:inline font-semibold">AI Assistant</span>
                  </button>
                </div>

                {showSuccess && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/50 rounded-xl animate-fadeInUp">
                    <div className="flex items-center gap-3">
                      <FaCheckCircle className="text-green-400 text-xl animate-bounce" />
                      <div>
                        <p className="text-green-400 font-semibold">Booking Created Successfully!</p>
                        <p className="text-green-300 text-sm">The booking has been added to your system.</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Guest Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                      Guest Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                        <div className="relative group">
                          <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-purple-400 transition-colors" />
                          <input type="text" value={formData.name} placeholder="John Doe"
                            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                            className={inputCls("name")} />
                        </div>
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                        <div className="relative group">
                          <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-purple-400 transition-colors" />
                          <input type="email" value={formData.email} placeholder="john@example.com"
                            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                            className={inputCls("email")} />
                        </div>
                        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Contact Number *</label>
                        <div className="relative group">
                          <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-purple-400 transition-colors" />
                          <input type="tel" value={formData.contact} placeholder="+1 234 567 8900"
                            onChange={(e) => setFormData((p) => ({ ...p, contact: e.target.value }))}
                            className={inputCls("contact")} />
                        </div>
                        {errors.contact && <p className="text-red-400 text-xs mt-1">{errors.contact}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Room *</label>
                        <div className="relative group">
                          <FaDoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-purple-400 transition-colors" />
                          <input type="text" value={formData.room} placeholder="101 / Normal / Deluxe / Suite"
                            onChange={(e) => handleRoomChange(e.target.value)}
                            className={inputCls("room")} />
                        </div>
                        {errors.room && <p className="text-red-400 text-xs mt-1">{errors.room}</p>}
                        {selectedRoomType && (
                          <p className="text-purple-400 text-xs mt-1 animate-pulse">
                            💡 {roomAmenities[selectedRoomType]?.name} selected
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stay Details */}
                  <div className="space-y-4 pt-4 border-t border-white/20">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                      Stay Details
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Number of Days *</label>
                        <div className="relative group">
                          <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-purple-400 transition-colors" />
                          <input type="number" min="1" value={formData.days} placeholder="2"
                            onChange={(e) => setFormData((p) => ({ ...p, days: e.target.value }))}
                            className={inputCls("days")} />
                        </div>
                        {errors.days && <p className="text-red-400 text-xs mt-1">{errors.days}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Check-in Date & Time *</label>
                        <input type="datetime-local" value={formData.checkin}
                          onChange={(e) => setFormData((p) => ({ ...p, checkin: e.target.value }))}
                          className={`w-full px-3 py-2.5 bg-white/5 backdrop-blur-sm border rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all duration-300 ${errors.checkin ? "border-red-500" : "border-white/20"}`} />
                        {errors.checkin && <p className="text-red-400 text-xs mt-1">{errors.checkin}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Check-out Date & Time *</label>
                        <input type="datetime-local" value={formData.checkout}
                          onChange={(e) => setFormData((p) => ({ ...p, checkout: e.target.value }))}
                          className={`w-full px-3 py-2.5 bg-white/5 backdrop-blur-sm border rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all duration-300 ${errors.checkout ? "border-red-500" : "border-white/20"}`} />
                        {errors.checkout && <p className="text-red-400 text-xs mt-1">{errors.checkout}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Price Summary */}
                  {priceInfo && (
                    <div className="p-5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl border border-purple-500/50 shadow-lg transform hover:scale-[1.02] transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <FaDollarSign className="text-white text-xl" />
                          </div>
                          <div>
                            <span className="text-white font-semibold text-lg">Total Price</span>
                            <p className="text-xs text-gray-300">{priceInfo.formatted}</p>
                            {priceInfo.discount && (
                              <p className="text-xs text-green-400 font-semibold">🎉 10% discount applied!</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {priceInfo.discount && (
                            <p className="text-sm text-gray-400 line-through">${priceInfo.rawTotal.toFixed(2)}</p>
                          )}
                          <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            ${priceInfo.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || dataLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
                  >
                    {loading ? (
                      <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />Creating Booking...</>
                    ) : (
                      <><FaPlus className="text-sm" />Create Booking</>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* ── Sidebar ──────────────────────────────────────────────── */}
            <div className="lg:col-span-1 space-y-6">

              {selectedRoomType && roomAmenities[selectedRoomType] && (
                <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 sticky top-8 animate-fadeInUp overflow-hidden group">
                  <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-700"
                    style={{ backgroundImage: `url('${roomAmenities[selectedRoomType].image}')`, backgroundSize: "cover", backgroundPosition: "center", transform: "scale(1.1)" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
                  <div className="relative z-10">
                    <div className={`h-1 w-20 rounded-full bg-gradient-to-r ${roomAmenities[selectedRoomType].color} mb-4`} />
                    <h3 className="text-xl font-bold text-white mb-2">{roomAmenities[selectedRoomType].name}</h3>
                    <p className="text-gray-300 text-sm mb-4">Price: {roomAmenities[selectedRoomType].priceRange}/night</p>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2"><FaInfoCircle /> Amenities</h4>
                        <div className="space-y-1">
                          {roomAmenities[selectedRoomType].amenities.slice(0, 4).map((a, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                              <a.icon className="text-xs text-purple-400" /><span>{a.name}</span>
                            </div>
                          ))}
                          {roomAmenities[selectedRoomType].amenities.length > 4 && (
                            <p className="text-xs text-gray-500">+{roomAmenities[selectedRoomType].amenities.length - 4} more</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-pink-400 mb-2 flex items-center gap-2"><FaInfoCircle /> Facilities</h4>
                        <div className="space-y-1">
                          {roomAmenities[selectedRoomType].facilities.slice(0, 3).map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                              <f.icon className="text-xs text-pink-400" /><span>{f.name}</span>
                            </div>
                          ))}
                          {roomAmenities[selectedRoomType].facilities.length > 3 && (
                            <p className="text-xs text-gray-500">+{roomAmenities[selectedRoomType].facilities.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!dataLoading && inventory && prices && (
                <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                      <span className="text-sm">📊</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">Live Room Stats</h4>
                  </div>
                  <div className="space-y-2 text-xs text-gray-300">
                    {[
                      { label: "Normal", range: "101–199", price: prices.normal_price, total: inventory.normal_rooms, avail: enrichedRooms.filter(r => r.type === "Normal" && r.isAvailable).length },
                      { label: "Deluxe", range: "201–299", price: prices.deluxe_price, total: inventory.deluxe_rooms, avail: enrichedRooms.filter(r => r.type === "Deluxe" && r.isAvailable).length },
                      { label: "Suite",  range: "301–399", price: prices.suite_price,  total: inventory.suite_rooms,  avail: enrichedRooms.filter(r => r.type === "Suite"  && r.isAvailable).length },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0">
                        <div>
                          <span className="text-white font-medium">{row.label}</span>
                          <span className="text-gray-500 ml-1">({row.range})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-green-400 font-semibold">{row.avail} free</span>
                          <span className="text-gray-500"> / {row.total}</span>
                          <div className="text-purple-400">${row.price}/night</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                    <span className="text-lg">💡</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">Quick Tips</h4>
                </div>
                <ul className="space-y-2 text-xs text-gray-300">
                  {[
                    "Ask the AI Assistant for real-time room availability",
                    "Check-in: 2:00 PM · Check-out: 11:00 AM",
                    "Normal: 101-199 · Deluxe: 201-299 · Suite: 301-399",
                    "All rooms include complimentary breakfast",
                    "Book 3+ nights for a 10% discount",
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-purple-400">•</span><span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎉</span>
                  <h4 className="text-sm font-semibold text-white">Special Offer</h4>
                </div>
                <p className="text-xs text-gray-300 mb-2">Book 3+ nights and get 10% off your stay!</p>
                <p className="text-xs text-purple-400 font-semibold">Limited time offer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Chatbot ───────────────────────────────────────────────────── */}
      {showChatbot && (
        <div
          ref={chatbotRef}
          style={{
            position: "fixed",
            left: `${chatPosition.x}px`,
            top: `${chatPosition.y}px`,
            width: "440px",
            maxHeight: "700px",
            zIndex: 99999,
            userSelect: "none",
            cursor: isDragging ? "grabbing" : "default",
          }}
        >
          <div className="bg-gradient-to-b from-gray-900/98 to-gray-800/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 flex flex-col overflow-hidden" style={{ maxHeight: "700px" }}>

            {/* Header */}
            <div
              className="chatbot-drag-handle p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-t-2xl select-none flex-shrink-0"
              onMouseDown={handleMouseDown}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <FaRobot className="text-white text-base" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">AI Booking Assistant</h3>
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" />
                      Powered by Claude · Live hotel data
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!dataLoading && (
                    <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-400">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      {availableRooms.length} free
                    </div>
                  )}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => setShowChatbot(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition pointer-events-auto"
                  >
                    <FaTimes className="text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="flex justify-center mt-1 pointer-events-none">
                <FaGripVertical className="text-gray-600 text-xs" />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: "380px" }}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.type === "bot" && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                      <FaRobot className="text-white text-xs" />
                    </div>
                  )}
                  <div className={`max-w-[82%] p-3 rounded-xl text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.type === "user"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-none"
                      : "bg-white/10 backdrop-blur-sm text-gray-200 rounded-bl-none border border-white/10"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <FaRobot className="text-white text-xs" />
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl rounded-bl-none border border-white/10 flex gap-1 items-center">
                    {[0, 150, 300].map((d) => (
                      <div key={d} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                    <span className="text-xs text-gray-500 ml-2">Analyzing hotel data...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            <div className="flex-shrink-0 border-t border-white/10 bg-gray-900/40">
              <button
                onClick={() => setShowSuggestions((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-400 hover:text-gray-300 hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-1">
                  <FaLightbulb className="text-yellow-500 text-xs" />
                  <span>Suggested questions</span>
                </div>
                {showSuggestions ? <FaChevronDown className="text-xs" /> : <FaChevronUp className="text-xs" />}
              </button>

              {showSuggestions && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(q.text)}
                      disabled={isTyping}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 rounded-lg text-xs text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-40"
                    >
                      <span>{q.emoji}</span>
                      <span className="truncate max-w-[160px]">{q.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-4 border-t border-white/10 bg-gray-900/60">
              <div className="flex gap-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask anything about rooms, prices, availability..."
                  disabled={isTyping}
                  className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm disabled:opacity-50 transition-colors"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isTyping || !chatInput.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <FaPaperPlane />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center">
                Powered by Claude AI · Using live database data
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease forwards; }
        .delay-1000 { animation-delay: 1s; }
        .delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
};

export default AddBookings;