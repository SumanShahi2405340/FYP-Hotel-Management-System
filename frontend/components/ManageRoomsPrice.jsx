"use client";
import React, { useState, useEffect } from "react";
import api from "../utils/api";
import {
  FaBed, FaHotel, FaMoneyBillWave, FaEdit, FaSave, FaTimes,
  FaPlus, FaMinus, FaBuilding, FaArrowLeft, FaArrowRight,
  FaWifi, FaSnowflake, FaTv, FaCoffee, FaBath, FaCity, FaDesktop,
  FaHotTub, FaUmbrellaBeach, FaUtensils, FaStar, FaFilter,
  FaChevronLeft, FaChevronRight, FaPause, FaPlay, FaImage,
  FaLock, FaDoorOpen, FaDoorClosed, FaUpload, FaTrash
} from "react-icons/fa";

// ── Return "available" | "occupied" | "booked" ──────────────────────────
const getRoomStatus = (checkin, checkout) => {
  if (!checkin) return "available";
  const now      = new Date();
  const checkIn  = new Date(checkin);
  const checkOut = checkout ? new Date(checkout) : null;

  if (checkOut && now >= checkOut) return "available";
  if (now >= checkIn)              return "occupied";
  return "booked";
};

// ── Calculate nights + total from checkin/checkout dates ─────────────────────
const calcTotalPrice = (checkin, checkout, pricePerNight) => {
  if (!checkin || !checkout || !pricePerNight) return null;
  const ms   = new Date(checkout) - new Date(checkin);
  const days = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  return { days, total: days * parseFloat(pricePerNight) };
};

export default function ManageRoomsPrice() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [roomView, setRoomView] = useState("all");
  const [showRoomsForm, setShowRoomsForm] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // Image upload states
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Controlled inputs for inventory
  const [normalQty, setNormalQty] = useState("");
  const [deluxeQty, setDeluxeQty] = useState("");
  const [suiteQty, setSuiteQty]   = useState("");

  // Controlled inputs for prices
  const [normalPrice, setNormalPrice] = useState("");
  const [deluxePrice, setDeluxePrice] = useState("");
  const [suitePrice, setSuitePrice]   = useState("");

  const [roomPrices, setRoomPrices] = useState({ normal: null, deluxe: null, suite: null });
  const [bookings, setBookings]     = useState([]);

  const [roomData, setRoomData] = useState({
    normal: [], deluxe: [], suite: [], all: [],
  });

  const INVENTORY_API = "/api/room-inventory/";
  const PRICE_API     = "/api/room-price/";

  // Auto-slide for modal carousel
  useEffect(() => {
    if (!selectedRoom || !isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === selectedRoom.images.length - 1 ? 0 : prev + 1
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedRoom, isAutoPlaying]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setIsAutoPlaying(true);
  }, [selectedRoom]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch images as well
        let imagesData = {};
        try {
          const imagesRes = await api.get("/api/room-images/");
          imagesData = imagesRes.data;
        } catch (imageErr) {
          console.warn("Images endpoint not available, using defaults", imageErr);
        }
        
        const [invRes, priceRes, bookRes] = await Promise.all([
          api.get(INVENTORY_API),
          api.get(PRICE_API),
          api.get("/api/manage-bookings/"),
        ]);

        const invData   = invRes.data;
        const priceData = priceRes.data;
        const bks       = Array.isArray(bookRes.data)
          ? bookRes.data
          : bookRes.data?.results ?? [];

        setBookings(bks);
        setRoomPrices({
          normal: priceData.normal_price,
          deluxe: priceData.deluxe_price,
          suite:  priceData.suite_price,
        });

        const updated = {
          normal: generateRooms(101, invData.normal_rooms, "normal", priceData.normal_price, imagesData),
          deluxe: generateRooms(201, invData.deluxe_rooms, "deluxe", priceData.deluxe_price, imagesData),
          suite:  generateRooms(301, invData.suite_rooms,  "suite",  priceData.suite_price, imagesData),
        };
        updated.all = [...updated.normal, ...updated.deluxe, ...updated.suite];
        setRoomData(updated);
      } catch (err) {
        console.error("Error fetching data:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ── compute status from bookings list ─────────────────────────────────
  const getRoomOccupancyInfo = (roomNumber) => {
    const booking = bookings.find((b) => {
      if (!b.room) return false;
      const match = b.room.toString().match(/\d+/);
      if (!match || parseInt(match[0]) !== roomNumber) return false;
      const s = getRoomStatus(b.checkin, b.checkout);
      return s === "occupied" || s === "booked";
    });
    if (!booking) return { status: "available", booking: null };
    return { status: getRoomStatus(booking.checkin, booking.checkout), booking };
  };

  const getHotelImages = (type, roomNumber = null, imagesData = {}) => {
    // If we have custom images for this room, use them
    if (roomNumber && imagesData[roomNumber] && imagesData[roomNumber].length > 0) {
      return imagesData[roomNumber];
    }
    
    const imgs = {
      normal: [
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop",
      ],
      deluxe: [
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
      ],
      suite: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop",
      ],
    };
    return imgs[type] || imgs.normal;
  };

  const getFacilitiesByType = (type) => {
    const base = ["WiFi", "Air Conditioning", "Flat-screen TV", "Mini Bar"];
    if (type === "deluxe") return [...base, "Bathtub", "City View", "Work Desk"];
    if (type === "suite")  return [...base, "Jacuzzi", "Sea View", "Kitchenette", "Private Balcony"];
    return base;
  };

  const getRoomDescription = (type) => {
    if (type === "normal") return "Comfortable room with modern amenities, perfect for business travelers.";
    if (type === "deluxe") return "Spacious deluxe room with premium furnishings and a stunning city view.";
    return "Luxury suite with separate living area, jacuzzi, and breathtaking sea view.";
  };

  const generateRooms = (start, count, type, price, imagesData = {}) =>
    Array.from({ length: count }, (_, i) => {
      const roomNumber = start + i;
      return {
        number:      roomNumber,
        type,
        images:      getHotelImages(type, roomNumber, imagesData),
        facilities:  getFacilitiesByType(type),
        description: getRoomDescription(type),
        price,
      };
    });

  // ── Image upload handlers ────────────────────────────────────────────────
  const handleImageSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 4) {
      alert("You can only upload up to 4 images");
      return;
    }
    
    setSelectedFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select images to upload");
      return;
    }

    setUploadingImages(true);
    const formData = new FormData();
    formData.append("roomNumber", selectedRoom.number);
    selectedFiles.forEach(file => {
      formData.append("images", file);
    });

    try {
      const response = await api.post("/api/room-images/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update the room's images in the state
      const updatedRooms = {
        normal: roomData.normal.map(room => {
          if (room.number === selectedRoom.number) {
            return { ...room, images: response.data.images };
          }
          return room;
        }),
        deluxe: roomData.deluxe.map(room => {
          if (room.number === selectedRoom.number) {
            return { ...room, images: response.data.images };
          }
          return room;
        }),
        suite: roomData.suite.map(room => {
          if (room.number === selectedRoom.number) {
            return { ...room, images: response.data.images };
          }
          return room;
        }),
      };
      updatedRooms.all = [...updatedRooms.normal, ...updatedRooms.deluxe, ...updatedRooms.suite];
      
      setRoomData(updatedRooms);
      setSelectedRoom({ ...selectedRoom, images: response.data.images });
      setShowImageUploader(false);
      setSelectedFiles([]);
      setImagePreviews([]);
      alert("Images uploaded successfully!");
    } catch (err) {
      console.error("Error uploading images", err);
      alert("Failed to upload images. Please try again.");
    } finally {
      setUploadingImages(false);
    }
  };

  const removePreview = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(imagePreviews[index]);
    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    if ([normalQty, deluxeQty, suiteQty].every((val) => val === "")) {
      alert("Please enter at least one quantity");
      return;
    }
    try {
      const response = await api.put(INVENTORY_API, {
        normal_rooms: Number(normalQty),
        deluxe_rooms: Number(deluxeQty),
        suite_rooms:  Number(suiteQty),
      });
      const inv = response.data;
      const updated = {
        normal: generateRooms(101, inv.normal_rooms, "normal", roomPrices.normal),
        deluxe: generateRooms(201, inv.deluxe_rooms, "deluxe", roomPrices.deluxe),
        suite:  generateRooms(301, inv.suite_rooms,  "suite",  roomPrices.suite),
      };
      updated.all = [...updated.normal, ...updated.deluxe, ...updated.suite];
      setRoomData(updated);
      alert("Room inventory saved successfully!");
      setShowRoomsForm(false);
      setNormalQty(""); setDeluxeQty(""); setSuiteQty("");
    } catch (err) {
      console.error("Error saving inventory:", err.response?.data || err);
      alert("Error saving inventory");
    }
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    if ([normalPrice, deluxePrice, suitePrice].every((val) => val === "")) {
      alert("Please enter at least one price");
      return;
    }
    try {
      const response = await api.put(PRICE_API, {
        normal_price: Number(normalPrice),
        deluxe_price: Number(deluxePrice),
        suite_price:  Number(suitePrice),
      });
      const updated = response.data;
      setRoomPrices({
        normal: updated.normal_price,
        deluxe: updated.deluxe_price,
        suite:  updated.suite_price,
      });
      setRoomData((prev) => ({
        normal: prev.normal.map((r) => ({ ...r, price: updated.normal_price })),
        deluxe: prev.deluxe.map((r) => ({ ...r, price: updated.deluxe_price })),
        suite:  prev.suite.map((r)  => ({ ...r, price: updated.suite_price })),
        all: [
          ...prev.normal.map((r) => ({ ...r, price: updated.normal_price })),
          ...prev.deluxe.map((r) => ({ ...r, price: updated.deluxe_price })),
          ...prev.suite.map((r)  => ({ ...r, price: updated.suite_price })),
        ],
      }));
      alert("Room prices saved successfully!");
      setShowPriceForm(false);
      setNormalPrice(""); setDeluxePrice(""); setSuitePrice("");
    } catch (err) {
      console.error("Error saving prices:", err.response?.data || err);
      alert("Error saving prices");
    }
  };

  const getRoomTypeColor = (type) => {
    switch (type) {
      case "normal": return "from-blue-500 to-cyan-500";
      case "deluxe": return "from-purple-500 to-pink-500";
      case "suite":  return "from-amber-500 to-orange-500";
      default:       return "from-gray-500 to-gray-600";
    }
  };

  const getRoomTypeIcon = (type) => {
    switch (type) {
      case "normal": return <FaBed   className="text-blue-400" />;
      case "deluxe": return <FaStar  className="text-purple-400" />;
      case "suite":  return <FaHotel className="text-amber-400" />;
      default:       return <FaBed />;
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "occupied":
        return { label: "Occupied",  bg: "bg-red-500/20",    text: "text-red-400",    border: "border-red-500/30",    cardBorder: "border-red-500" };
      case "booked":
        return { label: "Booked",    bg: "bg-amber-500/20",  text: "text-amber-400",  border: "border-amber-500/30",  cardBorder: "border-amber-500" };
      default:
        return { label: "Available", bg: "bg-green-500/20",  text: "text-green-400",  border: "border-green-500/30",  cardBorder: "border-green-500" };
    }
  };

  const renderRooms = (rooms, type) => {
    const typeName = type === "normal" ? "Normal" : type === "deluxe" ? "Deluxe" : "Suite";
    const price    = type === "normal" ? roomPrices.normal : type === "deluxe" ? roomPrices.deluxe : roomPrices.suite;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${getRoomTypeColor(type)} bg-opacity-20`}>
              {getRoomTypeIcon(type)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{typeName} Rooms</h3>
              <p className="text-sm text-gray-400">
                ${price !== null ? Number(price).toFixed(2) : "—"} per night
              </p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-sm">
            {rooms.length} rooms
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {rooms.map((room) => {
            const { status, booking: activeBooking } = getRoomOccupancyInfo(room.number);
            const cfg       = getStatusConfig(status);
            const priceCalc = activeBooking
              ? calcTotalPrice(activeBooking.checkin, activeBooking.checkout, room.price)
              : null;

            return (
              <div
                key={room.number}
                onClick={() => setSelectedRoom({ ...room, status, activeBooking, priceCalc })}
                className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-105 cursor-pointer ${
                  status === "available"
                    ? "bg-gradient-to-br from-green-50/10 to-emerald-50/10 border-green-500/30 hover:border-green-500"
                    : status === "booked"
                      ? "bg-gradient-to-br from-amber-50/10 to-yellow-50/10 border-amber-500/30 hover:border-amber-500"
                      : "bg-gradient-to-br from-red-50/10 to-rose-50/10 border-red-500/30 hover:border-red-500"
                }`}
              >
                <div className="p-4 text-center">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    status === "available" ? "bg-green-500/20" :
                    status === "booked"    ? "bg-amber-500/20" : "bg-red-500/20"
                  }`}>
                    {status === "available"
                      ? <FaBed  className="text-xl text-green-400" />
                      : status === "booked"
                        ? <FaLock className="text-xl text-amber-400" />
                        : <FaDoorClosed className="text-xl text-red-400" />}
                  </div>

                  <div className="text-white font-bold text-lg">Room {room.number}</div>
                  <div className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </div>
                  {priceCalc && (
                    <div className="mt-2 text-[10px] text-gray-400 leading-tight">
                      <p>{priceCalc.days}n · ${priceCalc.total.toFixed(0)}</p>
                    </div>
                  )}
                </div>
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                  status === "available"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : status === "booked"
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                      : "bg-gradient-to-r from-red-500 to-rose-500"
                }`} />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading room data...</p>
        </div>
      </div>
    );
  }

  const totalRooms     = roomData.all.length;
  const occupiedCount  = roomData.all.filter((r) => getRoomOccupancyInfo(r.number).status === "occupied").length;
  const bookedCount    = roomData.all.filter((r) => getRoomOccupancyInfo(r.number).status === "booked").length;
  const availableCount = totalRooms - occupiedCount - bookedCount;

  return (
    <>
      <div className="relative min-h-screen overflow-hidden">
        {/* Background */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-fixed z-0"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-800/90" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
          </div>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
        </div>

        <div className="relative z-10 min-h-screen p-8">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="text-center mb-8 animate-fadeInUp">
              <div className="inline-block p-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-2xl">
                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl px-8 py-4">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <FaBed className="text-4xl text-purple-400" />
                    <FaHotel className="text-4xl text-pink-400" />
                    <FaMoneyBillWave className="text-4xl text-orange-400" />
                  </div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-3">
                    Manage Rooms &amp; Prices
                  </h1>
                  <p className="text-gray-300 text-lg">
                    Configure room inventory and pricing for your hotel
                  </p>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Total Rooms",    value: totalRooms,     icon: FaHotel,      color: "from-purple-500 to-pink-500" },
                { label: "Available",      value: availableCount, icon: FaDoorOpen,   color: "from-green-500 to-emerald-500" },
                { label: "Occupied",       value: occupiedCount,  icon: FaDoorClosed, color: "from-red-500 to-rose-500" },
                { label: "Booked",         value: bookedCount,    icon: FaLock,       color: "from-amber-500 to-yellow-500" },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 hover-scale animate-fadeInUp"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                        <stat.icon className="text-2xl text-white" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                    <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8 justify-center">
              <button
                onClick={() => { setShowRoomsForm(!showRoomsForm); setShowPriceForm(false); }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                  showRoomsForm
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20"
                }`}
              >
                <FaEdit /> Update Room Inventory
              </button>
              <button
                onClick={() => { setShowPriceForm(!showPriceForm); setShowRoomsForm(false); }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                  showPriceForm
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20"
                }`}
              >
                <FaMoneyBillWave /> Update Room Prices
              </button>
            </div>

            {/* Inventory Form */}
            {showRoomsForm && (
              <div className="mb-8 animate-fadeInUp">
                <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <FaEdit className="text-purple-400" /> Update Room Inventory
                  </h2>
                  <form onSubmit={handleSaveAll} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: "Normal Rooms", val: normalQty, set: setNormalQty, cur: roomData.normal.length },
                        { label: "Deluxe Rooms", val: deluxeQty, set: setDeluxeQty, cur: roomData.deluxe.length },
                        { label: "Suite Rooms",  val: suiteQty,  set: setSuiteQty,  cur: roomData.suite.length },
                      ].map(({ label, val, set, cur }) => (
                        <div key={label}>
                          <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                          <input type="number" value={val} onChange={(e) => set(e.target.value)}
                            placeholder={`Current: ${cur}`}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center gap-2">
                        <FaSave /> Save Changes
                      </button>
                      <button type="button" onClick={() => setShowRoomsForm(false)} className="px-6 py-2.5 bg-white/10 text-gray-300 rounded-xl font-semibold hover:bg-white/20 transition">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Price Form */}
            {showPriceForm && (
              <div className="mb-8 animate-fadeInUp">
                <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <FaMoneyBillWave className="text-purple-400" /> Update Room Prices
                  </h2>
                  <form onSubmit={handleSavePrice} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: "Normal Room Price ($)", val: normalPrice, set: setNormalPrice, cur: roomPrices.normal },
                        { label: "Deluxe Room Price ($)", val: deluxePrice, set: setDeluxePrice, cur: roomPrices.deluxe },
                        { label: "Suite Room Price ($)",  val: suitePrice,  set: setSuitePrice,  cur: roomPrices.suite },
                      ].map(({ label, val, set, cur }) => (
                        <div key={label}>
                          <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                          <input type="number" step="0.01" value={val} onChange={(e) => set(e.target.value)}
                            placeholder={`Current: $${cur || 0}`}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center gap-2">
                        <FaSave /> Save Prices
                      </button>
                      <button type="button" onClick={() => setShowPriceForm(false)} className="px-6 py-2.5 bg-white/10 text-gray-300 rounded-xl font-semibold hover:bg-white/20 transition">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-300">Filter by room type:</span>
              </div>
              <div className="flex gap-3 flex-wrap">
                {["all", "normal", "deluxe", "suite"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setRoomView(type)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      roomView === type
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {type === "all" ? "All Rooms" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-3 text-xs flex-wrap">
                <span className="flex items-center gap-1 text-green-400"><FaDoorOpen /> Available</span>
                <span className="flex items-center gap-1 text-amber-400"><FaLock /> Booked (upcoming)</span>
                <span className="flex items-center gap-1 text-red-400"><FaDoorClosed /> Occupied (checked in)</span>
              </div>
            </div>

            {/* Room Views */}
            <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 animate-fadeInUp">
              {roomView === "all" && (
                <div className="space-y-8">
                  {renderRooms(roomData.normal, "normal")}
                  {renderRooms(roomData.deluxe, "deluxe")}
                  {renderRooms(roomData.suite,  "suite")}
                </div>
              )}
              {roomView === "normal" && renderRooms(roomData.normal, "normal")}
              {roomView === "deluxe" && renderRooms(roomData.deluxe, "deluxe")}
              {roomView === "suite"  && renderRooms(roomData.suite,  "suite")}
            </div>
          </div>
        </div>
      </div>

      {/* ROOM DETAILS MODAL WITH IMAGE UPLOAD BUTTON */}
      {selectedRoom && !showImageUploader && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeInUp"
          onClick={() => setSelectedRoom(null)}
        >
          <div
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Carousel */}
            <div className="relative h-72 md:h-96">
              <img
                src={selectedRoom.images[currentImageIndex]}
                alt={`Room ${selectedRoom.number}`}
                className="w-full h-full object-cover rounded-t-2xl"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop";
                }}
              />
              <button onClick={() => setSelectedRoom(null)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition">
                <FaTimes />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-full px-3 py-1">
                <button onClick={() => setCurrentImageIndex((p) => (p === 0 ? selectedRoom.images.length - 1 : p - 1))} className="text-white hover:text-purple-400 transition p-1"><FaChevronLeft /></button>
                <span className="text-white text-sm px-2">{currentImageIndex + 1} / {selectedRoom.images.length}</span>
                <button onClick={() => setCurrentImageIndex((p) => (p === selectedRoom.images.length - 1 ? 0 : p + 1))} className="text-white hover:text-purple-400 transition p-1"><FaChevronRight /></button>
                <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} className="text-white hover:text-purple-400 transition p-1">{isAutoPlaying ? <FaPause /> : <FaPlay />}</button>
              </div>

              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedRoom.status === "available" ? "bg-green-500 text-white" :
                  selectedRoom.status === "booked"    ? "bg-amber-500 text-white" :
                                                        "bg-red-500 text-white"
                }`}>
                  {selectedRoom.status === "available" ? "Available" :
                   selectedRoom.status === "booked"    ? "Booked" : "Occupied"}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">Room {selectedRoom.number}</h3>
                  <p className="text-gray-300 mt-1 capitalize">{selectedRoom.type} Room</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Price per night</p>
                  <p className="text-2xl font-bold text-purple-400">${Number(selectedRoom.price).toFixed(2)}</p>
                  {selectedRoom.priceCalc && (
                    <p className="text-sm text-green-400 font-semibold mt-1">
                      {selectedRoom.priceCalc.days} nights · Total ${selectedRoom.priceCalc.total.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-gray-300 mb-4">{selectedRoom.description}</p>

              {/* Facilities */}
              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2">Amenities &amp; Facilities</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedRoom.facilities.map((facility, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                      {facility === "WiFi"             && <FaWifi          className="text-purple-400" />}
                      {facility === "Air Conditioning" && <FaSnowflake     className="text-purple-400" />}
                      {facility === "Flat-screen TV"   && <FaTv            className="text-purple-400" />}
                      {facility === "Mini Bar"         && <FaCoffee        className="text-purple-400" />}
                      {facility === "Bathtub"          && <FaBath          className="text-purple-400" />}
                      {facility === "City View"        && <FaCity          className="text-purple-400" />}
                      {facility === "Work Desk"        && <FaDesktop       className="text-purple-400" />}
                      {facility === "Jacuzzi"          && <FaHotTub        className="text-purple-400" />}
                      {facility === "Sea View"         && <FaUmbrellaBeach className="text-purple-400" />}
                      {facility === "Kitchenette"      && <FaUtensils      className="text-purple-400" />}
                      {facility === "Private Balcony"  && <FaUmbrellaBeach className="text-purple-400" />}
                      {!["WiFi","Air Conditioning","Flat-screen TV","Mini Bar","Bathtub","City View","Work Desk","Jacuzzi","Sea View","Kitchenette","Private Balcony"].includes(facility) && (
                        <FaImage className="text-purple-400" />
                      )}
                      <span>{facility}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ADD IMAGE BUTTON */}
              <button
                onClick={() => setShowImageUploader(true)}
                className="w-full mb-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FaUpload /> Add / Replace Images (Up to 4)
              </button>

              {/* Booking info block */}
              {selectedRoom.status !== "available" && selectedRoom.activeBooking && (
                <div className={`mb-4 rounded-lg p-3 space-y-1 ${
                  selectedRoom.status === "occupied"
                    ? "bg-red-500/10 border border-red-500/30"
                    : "bg-amber-500/10 border border-amber-500/30"
                }`}>
                  <p className={`text-sm font-semibold flex items-center gap-2 ${
                    selectedRoom.status === "occupied" ? "text-red-400" : "text-amber-400"
                  }`}>
                    {selectedRoom.status === "occupied"
                      ? <><FaDoorClosed /> Currently Occupied</>
                      : <><FaLock /> Upcoming Reservation</>}
                  </p>
                  {selectedRoom.activeBooking.checkin && (
                    <p className="text-gray-300 text-sm">
                      Check-in: <span className="text-white">
                        {new Date(selectedRoom.activeBooking.checkin).toLocaleString("en-US", {
                          month: "2-digit", day: "2-digit", year: "numeric",
                          hour: "numeric", minute: "2-digit", hour12: true,
                        })}
                      </span>
                    </p>
                  )}
                  {selectedRoom.activeBooking.checkout && (
                    <p className="text-gray-300 text-sm">
                      Check-out: <span className="text-white">
                        {new Date(selectedRoom.activeBooking.checkout).toLocaleString("en-US", {
                          month: "2-digit", day: "2-digit", year: "numeric",
                          hour: "numeric", minute: "2-digit", hour12: true,
                        })}
                      </span>
                    </p>
                  )}
                  {selectedRoom.priceCalc && (
                    <p className="text-sm font-bold text-blue-300">
                      Stay: {selectedRoom.priceCalc.days} night{selectedRoom.priceCalc.days > 1 ? "s" : ""} · Total: ${selectedRoom.priceCalc.total.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button onClick={() => setSelectedRoom(null)} className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE UPLOAD MODAL */}
      {showImageUploader && selectedRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeInUp"
          onClick={() => {
            setShowImageUploader(false);
            setSelectedFiles([]);
            setImagePreviews([]);
          }}
        >
          <div
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-lg w-full mx-4 shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Manage Images for Room {selectedRoom.number}</h3>
                <button
                  onClick={() => {
                    setShowImageUploader(false);
                    setSelectedFiles([]);
                    setImagePreviews([]);
                  }}
                  className="p-1 hover:bg-white/10 rounded-lg transition"
                >
                  <FaTimes className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-purple-500/50 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelection}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <FaUpload className="text-4xl text-purple-400" />
                    <span className="text-gray-300">Click to select images (up to 4)</span>
                    <span className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB each</span>
                  </label>
                </div>

                {imagePreviews.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Preview</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removePreview(idx)}
                            className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowImageUploader(false);
                      setSelectedFiles([]);
                      setImagePreviews([]);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadImages}
                    disabled={uploadingImages || selectedFiles.length === 0}
                    className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {uploadingImages ? "Uploading..." : "Save Images"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse    { 0%,100% { opacity:.3; transform:scale(1); } 50% { opacity:.6; transform:scale(1.05); } }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease forwards; }
        .animate-pulse    { animation: pulse 3s ease-in-out infinite; }
        .delay-1000 { animation-delay: 1s; }
        .hover-scale { transition: transform .2s ease, box-shadow .2s ease; }
        .hover-scale:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); }
      `}</style>
    </>
  );
}