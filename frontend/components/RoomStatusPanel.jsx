"use client";
import React, { useState, useEffect } from "react";
import api from "@/utils/api";
import {
  FaBed, FaFilter, FaDoorOpen, FaDoorClosed, FaHotel,
  FaWifi, FaSnowflake, FaTv, FaCoffee, FaImage, FaTimes,
  FaChevronLeft, FaChevronRight, FaPause, FaPlay, FaPlus,
  FaCalendarAlt, FaUser, FaEnvelope, FaPhone, FaHashtag,
  FaLock, FaClock, FaUpload, FaTrash
} from "react-icons/fa";

// ── Helper: format for datetime-local input (YYYY-MM-DDTHH:mm) ────────────────
const toDateTimeLocal = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const pad  = (n) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// ── Compute exact room status from checkin/checkout datetimes ─────────────
const getRoomStatus = (checkin, checkout) => {
  if (!checkin) return "available";
  const now      = new Date();
  const checkIn  = new Date(checkin);
  const checkOut = checkout ? new Date(checkout) : null;

  if (checkOut && now >= checkOut) return "available";
  if (now >= checkIn) return "occupied";
  return "booked";
};

// ── Calculate total price from checkin/checkout + nightly rate ────────────────
const calcTotalPrice = (checkin, checkout, pricePerNight) => {
  if (!checkin || !checkout || !pricePerNight) return null;
  const ms   = new Date(checkout) - new Date(checkin);
  const days = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  return { days, total: days * parseFloat(pricePerNight) };
};

export default function RoomStatusPanel() {
  const [roomsData,         setRoomsData]         = useState(null);
  const [roomFilter,        setRoomFilter]        = useState("all");
  const [bookings,          setBookings]          = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [selectedRoom,      setSelectedRoom]      = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying,     setIsAutoPlaying]     = useState(true);
  const [showBookingForm,   setShowBookingForm]   = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [uploadingImages,   setUploadingImages]   = useState(false);
  const [selectedFiles,     setSelectedFiles]     = useState([]);
  const [imagePreviews,     setImagePreviews]     = useState([]);
  const [bookingData,       setBookingData]       = useState({
    name: "", email: "", contact: "", days: "", checkin: "", checkout: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Auto-slide for modal carousel ──────────────────────────────────────────
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

  // ── Fetch all data ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to fetch images, but don't fail if the endpoint doesn't exist yet
        let imagesData = {};
        try {
          const imagesRes = await api.get("/api/room-images/");
          imagesData = imagesRes.data;
        } catch (imageErr) {
          console.warn("Images endpoint not available yet, using default images", imageErr);
        }

        const [invRes, priceRes, bookRes] = await Promise.all([
          api.get("/api/room-inventory/"),
          api.get("/api/room-price/"),
          api.get("/api/manage-bookings/"),
        ]);

        const inventory    = invRes.data;
        const pricesData   = priceRes.data;
        const bookingsData = Array.isArray(bookRes.data)
          ? bookRes.data
          : bookRes.data?.results ?? [];

        setBookings(bookingsData);

        const roomList = [];
        const pushRooms = (count, type, price, startNum) => {
          for (let i = 0; i < count; i++) {
            const roomNumber = startNum + i;
            // Check if we have custom images for this room
            const roomImages = (imagesData[roomNumber] && imagesData[roomNumber].length > 0) 
              ? imagesData[roomNumber] 
              : getHotelImages(type);
            roomList.push({
              number:      roomNumber,
              type,
              price,
              facilities:  getFacilitiesByType(type),
              images:      roomImages,
              description: getRoomDescription(type),
            });
          }
        };

        pushRooms(inventory.normal_rooms, "Normal", pricesData.normal_price, 101);
        pushRooms(inventory.deluxe_rooms, "Deluxe", pricesData.deluxe_price, 201);
        pushRooms(inventory.suite_rooms,  "Suite",  pricesData.suite_price,  301);

        setRoomsData({ inventory, prices: pricesData, rooms: roomList });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching rooms data", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Static helpers ──────────────────────────────────────────────────────────
  const getFacilitiesByType = (type) => {
    const base = ["WiFi", "Air Conditioning", "Flat-screen TV", "Mini Bar"];
    if (type === "Deluxe") return [...base, "Bathtub", "City View", "Work Desk"];
    if (type === "Suite")  return [...base, "Jacuzzi", "Sea View", "Kitchenette", "Private Balcony"];
    return base;
  };

  const getRoomDescription = (type) => {
    if (type === "Normal") return "Comfortable room with modern amenities, perfect for business travelers.";
    if (type === "Deluxe") return "Spacious deluxe room with premium furnishings and a stunning city view.";
    return "Luxury suite with separate living area, jacuzzi, and breathtaking sea view.";
  };

  const getHotelImages = (type) => {
    const imgs = {
      Normal: [
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop",
      ],
      Deluxe: [
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
      ],
      Suite: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop",
      ],
    };
    return imgs[type] || imgs.Normal;
  };

  // ── Image upload handler ────────────────────────────────────────────────────
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
      const updatedRooms = roomsData.rooms.map(room => {
        if (room.number === selectedRoom.number) {
          return { ...room, images: response.data.images };
        }
        return room;
      });

      setRoomsData({ ...roomsData, rooms: updatedRooms });
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

  // ── Occupancy lookup ───────────────────────────────────────────────────────
  const getRoomOccupancyInfo = (roomNumber) => {
    const booking = bookings.find((b) => {
      if (!b.room) return false;
      const match = b.room.toString().match(/\d+/);
      if (!match || parseInt(match[0]) !== roomNumber) return false;
      const status = getRoomStatus(b.checkin, b.checkout);
      return status === "occupied" || status === "booked";
    });

    if (!booking) return { status: "available", booking: null };
    const status = getRoomStatus(booking.checkin, booking.checkout);
    return { status, booking };
  };

  // ── Book room handler ──────────────────────────────────────────────────────
  const handleBookNow = async () => {
    if (!bookingData.name || !bookingData.email || !bookingData.contact ||
        !bookingData.checkin || !bookingData.checkout) {
      alert("Please fill in all required fields");
      return;
    }
    const ms   = new Date(bookingData.checkout) - new Date(bookingData.checkin);
    const days = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));

    setSubmitting(true);
    try {
      const res = await api.post("/api/manage-bookings/", {
        name:     bookingData.name,
        email:    bookingData.email,
        contact:  bookingData.contact,
        room:     `${selectedRoom.number} / ${selectedRoom.type}`,
        days,
        checkin:  bookingData.checkin  ? new Date(bookingData.checkin).toISOString()  : null,
        checkout: bookingData.checkout ? new Date(bookingData.checkout).toISOString() : null,
        status:   "Booked",
      });

      setBookings((prev) => [...prev, res.data]);
      alert(`Room ${selectedRoom.number} booked successfully for ${days} night${days > 1 ? "s" : ""}!`);
      setShowBookingForm(false);
      setSelectedRoom(null);
      setBookingData({ name: "", email: "", contact: "", days: "", checkin: "", checkout: "" });
    } catch (err) {
      console.error("Error booking room", err);
      alert("Failed to book room. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Status UI helpers ──────────────────────────────────────────────────────
  const getStatusConfig = (status) => {
    switch (status) {
      case "occupied":
        return {
          label:      "Occupied",
          cardCls:    "bg-gradient-to-br from-red-50 to-rose-50 border-red-300 hover:border-red-500",
          iconBg:     "bg-red-100",
          iconCls:    "text-red-600",
          badgeCls:   "bg-red-500 text-white",
          badgeIcon:  <FaDoorClosed className="text-xs" />,
          stripCls:   "bg-gradient-to-r from-red-500 to-rose-500",
        };
      case "booked":
        return {
          label:      "Booked",
          cardCls:    "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 hover:border-amber-500",
          iconBg:     "bg-amber-100",
          iconCls:    "text-amber-600",
          badgeCls:   "bg-amber-500 text-white",
          badgeIcon:  <FaLock className="text-xs" />,
          stripCls:   "bg-gradient-to-r from-amber-500 to-yellow-500",
        };
      default:
        return {
          label:      "Available",
          cardCls:    "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 hover:border-green-500",
          iconBg:     "bg-green-100",
          iconCls:    "text-green-600",
          badgeCls:   "bg-green-500 text-white",
          badgeIcon:  <FaDoorOpen className="text-xs" />,
          stripCls:   "bg-gradient-to-r from-green-500 to-emerald-500",
        };
    }
  };

  // ── Room grid ──────────────────────────────────────────────────────────────
  const renderFilteredRooms = () => {
    if (!roomsData) return null;
    let roomList = roomsData.rooms;
    if (roomFilter !== "all") {
      roomList = roomList.filter((r) => r.type.toLowerCase() === roomFilter);
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
        {roomList.map((room) => {
          const { status, booking: activeBooking } = getRoomOccupancyInfo(room.number);
          const cfg      = getStatusConfig(status);
          const priceCalc = activeBooking
            ? calcTotalPrice(activeBooking.checkin, activeBooking.checkout, room.price)
            : null;

          return (
            <div
              key={room.number}
              className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer ${cfg.cardCls}`}
            >
              <div
                className="p-5"
                onClick={() => setSelectedRoom({ ...room, status, activeBooking, priceCalc })}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-xl ${cfg.iconBg}`}>
                    <FaBed className={`text-2xl ${cfg.iconCls}`} />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.badgeCls}`}>
                    <span className="flex items-center gap-1">
                      {cfg.badgeIcon} {cfg.label}
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-2">Room {room.number}</h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Room Type:</span>
                    <span className={`font-semibold px-2 py-1 rounded ${
                      room.type === "Normal" ? "bg-blue-100 text-blue-700" :
                      room.type === "Deluxe" ? "bg-purple-100 text-purple-700" :
                                               "bg-amber-100 text-amber-700"
                    }`}>
                      {room.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Price / Night:</span>
                    <span className="font-bold text-blue-600">${Number(room.price).toFixed(2)}</span>
                  </div>

                  {status !== "available" && activeBooking && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                      {status === "booked" && (
                        <p className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                          <FaLock className="text-[10px]" /> Reserved — not yet checked in
                        </p>
                      )}
                      {status === "occupied" && (
                        <p className="text-xs font-semibold text-red-600">Currently checked in</p>
                      )}
                      {activeBooking.checkin && (
                        <p className="text-xs text-gray-500">
                          Check-in:{" "}
                          <span className="font-medium text-gray-700">
                            {new Date(activeBooking.checkin).toLocaleString("en-US", {
                              month: "2-digit", day: "2-digit", year: "numeric",
                              hour: "numeric", minute: "2-digit", hour12: true,
                            })}
                          </span>
                        </p>
                      )}
                      {activeBooking.checkout && (
                        <p className="text-xs text-gray-500">
                          Check-out:{" "}
                          <span className="font-medium text-gray-700">
                            {new Date(activeBooking.checkout).toLocaleString("en-US", {
                              month: "2-digit", day: "2-digit", year: "numeric",
                              hour: "numeric", minute: "2-digit", hour12: true,
                            })}
                          </span>
                        </p>
                      )}
                      {priceCalc && (
                        <p className="text-xs font-bold text-blue-700 mt-1">
                          {priceCalc.days} night{priceCalc.days > 1 ? "s" : ""} · Total: ${priceCalc.total.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {status === "available" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRoom({ ...room, status, activeBooking: null, priceCalc: null });
                    setShowBookingForm(true);
                  }}
                  className="absolute bottom-3 right-3 bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-all duration-200 shadow-lg hover:scale-110"
                  title="Book Now"
                >
                  <FaPlus className="text-xs" />
                </button>
              )}

              {status !== "available" && (
                <div className="absolute bottom-3 right-3 opacity-30">
                  <FaLock className={`text-lg ${status === "occupied" ? "text-red-600" : "text-amber-600"}`} />
                </div>
              )}

              <div className={`absolute bottom-0 left-0 right-0 h-1 ${cfg.stripCls}`} />
            </div>
          );
        })}
      </div>
    );
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading room status...</p>
        </div>
      </div>
    );
  }

  const totalRooms     = roomsData?.rooms.length || 0;
  const occupiedCount  = roomsData?.rooms.filter((r) => getRoomOccupancyInfo(r.number).status === "occupied").length || 0;
  const bookedCount    = roomsData?.rooms.filter((r) => getRoomOccupancyInfo(r.number).status === "booked").length || 0;
  const availableCount = totalRooms - occupiedCount - bookedCount;
  const occupancyRate  = totalRooms > 0 ? (((occupiedCount + bookedCount) / totalRooms) * 100).toFixed(1) : 0;

  return (
    <>
      <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <FaHotel className="text-purple-400" />
            Room Status Overview
          </h2>
          <p className="text-gray-400">Real-time occupancy based on check-in / check-out times</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300 mb-1">Total Rooms</p>
                <p className="text-3xl font-bold text-white">{totalRooms}</p>
              </div>
              <FaBed className="text-3xl text-blue-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300 mb-1">Available</p>
                <p className="text-3xl font-bold text-white">{availableCount}</p>
              </div>
              <FaDoorOpen className="text-3xl text-green-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl p-4 border border-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-300 mb-1">Occupied</p>
                <p className="text-3xl font-bold text-white">{occupiedCount}</p>
              </div>
              <FaDoorClosed className="text-3xl text-red-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500/20 to-yellow-600/20 rounded-xl p-4 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-300 mb-1">Booked</p>
                <p className="text-3xl font-bold text-white">{bookedCount}</p>
              </div>
              <FaLock className="text-3xl text-amber-400" />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FaFilter className="text-purple-400" />
            <span className="text-sm text-gray-300">Filter by room type:</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {["all", "normal", "deluxe", "suite"].map((type) => (
              <button
                key={type}
                onClick={() => setRoomFilter(type)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  roomFilter === type
                    ? "bg-purple-500 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {type === "all" ? "All Rooms" : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mb-4 text-xs flex-wrap">
          <span className="flex items-center gap-1 text-green-400"><FaDoorOpen /> Available — free to book</span>
          <span className="flex items-center gap-1 text-amber-400"><FaLock /> Booked — upcoming reservation</span>
          <span className="flex items-center gap-1 text-red-400"><FaDoorClosed /> Occupied — currently checked in</span>
        </div>

        {renderFilteredRooms()}

        <div className="mt-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-300">Occupancy Rate (booked + occupied)</span>
            <span className="text-sm font-semibold text-white">{occupancyRate}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* ROOM DETAILS MODAL WITH IMAGE UPLOAD BUTTON */}
      {selectedRoom && !showBookingForm && !showImageUploader && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeInUp"
          onClick={() => setSelectedRoom(null)}
        >
          <div
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72 md:h-96">
              <img
                src={selectedRoom.images[currentImageIndex]}
                alt={`Room ${selectedRoom.number}`}
                className="w-full h-full object-cover rounded-t-2xl"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop";
                }}
              />
              <button
                onClick={() => setSelectedRoom(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition"
              >
                <FaTimes />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-full px-3 py-1">
                <button
                  onClick={() => setCurrentImageIndex((p) => (p === 0 ? selectedRoom.images.length - 1 : p - 1))}
                  className="text-white hover:text-purple-400 transition p-1"
                ><FaChevronLeft /></button>
                <span className="text-white text-sm px-2">
                  {currentImageIndex + 1} / {selectedRoom.images.length}
                </span>
                <button
                  onClick={() => setCurrentImageIndex((p) => (p === selectedRoom.images.length - 1 ? 0 : p + 1))}
                  className="text-white hover:text-purple-400 transition p-1"
                ><FaChevronRight /></button>
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="text-white hover:text-purple-400 transition p-1"
                >{isAutoPlaying ? <FaPause /> : <FaPlay />}</button>
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

            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">Room {selectedRoom.number}</h3>
                  <p className="text-gray-300 mt-1">{selectedRoom.type} Room</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Price per night</p>
                  <p className="text-2xl font-bold text-purple-400">
                    ${Number(selectedRoom.price).toFixed(2)}
                  </p>
                  {selectedRoom.priceCalc && (
                    <p className="text-sm text-green-400 font-semibold mt-1">
                      {selectedRoom.priceCalc.days} nights · Total ${ selectedRoom.priceCalc.total.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-gray-300 mb-4">{selectedRoom.description}</p>

              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2">Amenities &amp; Facilities</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedRoom.facilities.map((facility, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                      {facility === "WiFi"             && <FaWifi      className="text-purple-400" />}
                      {facility === "Air Conditioning" && <FaSnowflake className="text-purple-400" />}
                      {facility === "Flat-screen TV"   && <FaTv        className="text-purple-400" />}
                      {facility === "Mini Bar"         && <FaCoffee    className="text-purple-400" />}
                      {!["WiFi","Air Conditioning","Flat-screen TV","Mini Bar"].includes(facility) && (
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
                      : <><FaLock /> Reserved — upcoming booking</>}
                  </p>
                  {selectedRoom.activeBooking.checkin && (
                    <p className="text-gray-300 text-sm">
                      Check-in:{" "}
                      <span className="text-white">
                        {new Date(selectedRoom.activeBooking.checkin).toLocaleString("en-US", {
                          month: "2-digit", day: "2-digit", year: "numeric",
                          hour: "numeric", minute: "2-digit", hour12: true,
                        })}
                      </span>
                    </p>
                  )}
                  {selectedRoom.activeBooking.checkout && (
                    <p className="text-gray-300 text-sm">
                      Check-out:{" "}
                      <span className="text-white">
                        {new Date(selectedRoom.activeBooking.checkout).toLocaleString("en-US", {
                          month: "2-digit", day: "2-digit", year: "numeric",
                          hour: "numeric", minute: "2-digit", hour12: true,
                        })}
                      </span>
                    </p>
                  )}
                  {selectedRoom.priceCalc && (
                    <p className="text-sm font-bold text-blue-300 mt-1">
                      Stay: {selectedRoom.priceCalc.days} night{selectedRoom.priceCalc.days > 1 ? "s" : ""}
                      {" · "}Total: ${selectedRoom.priceCalc.total.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {selectedRoom.status === "available" ? (
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FaPlus /> Book This Room
                </button>
              ) : (
                <div className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
                  selectedRoom.status === "occupied"
                    ? "bg-red-500/10 border border-red-500/30 text-red-400"
                    : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                }`}>
                  <FaLock />
                  {selectedRoom.status === "occupied"
                    ? "This room is currently occupied and unavailable for new bookings."
                    : "This room is reserved. It becomes available after check-out."}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                >
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

      {/* BOOKING FORM MODAL */}
      {showBookingForm && selectedRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeInUp"
          onClick={() => { setShowBookingForm(false); setSelectedRoom(null); }}
        >
          <div
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Book Room {selectedRoom.number}</h3>
                <button
                  onClick={() => { setShowBookingForm(false); setSelectedRoom(null); }}
                  className="p-1 hover:bg-white/10 rounded-lg transition"
                >
                  <FaTimes className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <FaUser className="text-purple-400 text-sm" />
                    <input type="text" placeholder="Enter customer name"
                      value={bookingData.name}
                      onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                      className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <FaEnvelope className="text-purple-400 text-sm" />
                    <input type="email" placeholder="customer@example.com"
                      value={bookingData.email}
                      onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                      className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Contact Number</label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <FaPhone className="text-purple-400 text-sm" />
                    <input type="text" placeholder="+977 98XXXXXXXX"
                      value={bookingData.contact}
                      onChange={(e) => setBookingData({ ...bookingData, contact: e.target.value })}
                      className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Check-in Date &amp; Time</label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <FaCalendarAlt className="text-purple-400 text-sm" />
                    <input type="datetime-local" value={bookingData.checkin}
                      onChange={(e) => setBookingData({ ...bookingData, checkin: e.target.value })}
                      className="flex-1 bg-transparent text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Check-out Date &amp; Time</label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <FaCalendarAlt className="text-purple-400 text-sm" />
                    <input type="datetime-local" value={bookingData.checkout}
                      onChange={(e) => setBookingData({ ...bookingData, checkout: e.target.value })}
                      className="flex-1 bg-transparent text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                  <p className="text-sm text-gray-300">
                    Room {selectedRoom.number} — {selectedRoom.type}
                  </p>
                  <p className="text-lg font-bold text-purple-400">
                    ${Number(selectedRoom.price).toFixed(2)} / night
                  </p>
                  {(() => {
                    const calc = bookingData.checkin && bookingData.checkout
                      ? calcTotalPrice(bookingData.checkin, bookingData.checkout, selectedRoom.price)
                      : null;
                    return calc ? (
                      <p className="text-sm text-green-400 font-semibold mt-1">
                        {calc.days} night{calc.days > 1 ? "s" : ""} · Total: ${calc.total.toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Select dates to see total price</p>
                    );
                  })()}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowBookingForm(false); setSelectedRoom(null); }}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBookNow}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {submitting ? "Booking..." : "Confirm Booking"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.3s ease forwards; }
      `}</style>
    </>
  );
}