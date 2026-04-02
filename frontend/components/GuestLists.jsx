'use client';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { 
  FaEdit, FaTrash, FaSave, FaTimes, FaUserFriends, 
  FaArrowLeft, FaSearch, FaFilter, FaDownload, 
  FaCalendarAlt, FaEnvelope, FaPhone, FaDoorOpen,
  FaStar, FaHotel, FaUsers, FaBed
} from "react-icons/fa";

// ── Date helpers ──────────────────────────────────────────────────────────────
const formatDateTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
};

const toDateTimeLocal = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ── compute real booking status ──────────────────────────────────────────────
const computeBookingStatus = (checkin, checkout) => {
  if (!checkin || !checkout) return "Booked";
  const now = new Date();
  const checkIn = new Date(checkin);
  const checkOut = new Date(checkout);
  if (now < checkIn) return "Booked";
  if (now >= checkIn && now < checkOut) return "Checked In";
  return "Checked Out";
};

const StatusBadge = ({ checkin, checkout }) => {
  const status = computeBookingStatus(checkin, checkout);
  const statusConfig = {
    "Booked": { color: "from-blue-500 to-cyan-500", text: "text-blue-400", bg: "bg-blue-500/20", icon: "📅" },
    "Checked In": { color: "from-green-500 to-emerald-500", text: "text-green-400", bg: "bg-green-500/20", icon: "✅" },
    "Checked Out": { color: "from-gray-500 to-gray-600", text: "text-gray-400", bg: "bg-gray-500/20", icon: "🚪" },
  };
  const config = statusConfig[status] || statusConfig["Booked"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span>{config.icon}</span>
      {status}
    </span>
  );
};

export default function GuestLists() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [editingBooking, setEditingBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookRes = await api.get("/api/manage-bookings/");
        setBookings(bookRes.data);
        setFilteredBookings(bookRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter bookings based on search and filters
  useEffect(() => {
    let filtered = bookings;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.contact.includes(searchTerm) ||
        booking.room.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => {
        const status = computeBookingStatus(booking.checkin, booking.checkout);
        return status === statusFilter;
      });
    }
    
    // Room type filter
    if (roomTypeFilter !== "all") {
      filtered = filtered.filter(booking => {
        const roomLower = booking.room.toLowerCase();
        if (roomTypeFilter === "normal") return roomLower.includes("normal") || (parseInt(booking.room) >= 101 && parseInt(booking.room) <= 199);
        if (roomTypeFilter === "deluxe") return roomLower.includes("deluxe") || (parseInt(booking.room) >= 201 && parseInt(booking.room) <= 299);
        if (roomTypeFilter === "suite") return roomLower.includes("suite") || (parseInt(booking.room) >= 301 && parseInt(booking.room) <= 399);
        return true;
      });
    }
    
    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, roomTypeFilter, bookings]);

  const handleEditBooking = async (id, updatedBooking) => {
    try {
      const res = await api.put(`/api/manage-bookings/${id}/`, {
        ...updatedBooking,
        days: Number(updatedBooking.days),
        checkin: updatedBooking.checkin ? new Date(updatedBooking.checkin).toISOString() : null,
        checkout: updatedBooking.checkout ? new Date(updatedBooking.checkout).toISOString() : null,
      });
      setBookings(bookings.map(b => b.id === id ? res.data : b));
      setEditingBooking(null);
    } catch (err) {
      console.error("Error editing booking", err);
      alert("Failed to update booking. Please try again.");
    }
  };

  const handleCancelBooking = async (id) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await api.delete(`/api/manage-bookings/${id}/`);
      setBookings(bookings.filter(b => b.id !== id));
    } catch (err) {
      console.error("Error deleting booking", err);
      alert("Failed to cancel booking. Please try again.");
    }
  };

  const getRoomTypeIcon = (room) => {
    const roomLower = room.toLowerCase();
    if (roomLower.includes("normal") || (parseInt(room) >= 101 && parseInt(room) <= 199)) return "🏠";
    if (roomLower.includes("deluxe") || (parseInt(room) >= 201 && parseInt(room) <= 299)) return "✨";
    if (roomLower.includes("suite") || (parseInt(room) >= 301 && parseInt(room) <= 399)) return "👑";
    return "🛏️";
  };

  // Calculate statistics
  const stats = {
    total: bookings.length,
    checkedIn: bookings.filter(b => computeBookingStatus(b.checkin, b.checkout) === "Checked In").length,
    checkedOut: bookings.filter(b => computeBookingStatus(b.checkin, b.checkout) === "Checked Out").length,
    upcoming: bookings.filter(b => computeBookingStatus(b.checkin, b.checkout) === "Booked").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading guest lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-fixed z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-800/90"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen p-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl text-white transition-all duration-300 border border-white/20 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <FaArrowLeft className="text-sm" />
          Back to Dashboard
        </button>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fadeInUp">
            <div className="inline-block p-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-2xl">
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl px-8 py-4">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <FaUserFriends className="text-4xl text-purple-400" />
                  <FaUsers className="text-4xl text-pink-400" />
                  <FaBed className="text-4xl text-orange-400" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-3">
                  Guest Lists
                </h1>
                <p className="text-gray-300 text-lg">Manage and track all guest bookings</p>
                <div className="flex justify-center gap-1 mt-2">
                  {[1,2,3,4,5].map((star) => (
                    <FaStar key={star} className="text-yellow-500 text-sm" />
                  ))}
                  <span className="text-gray-400 text-sm ml-2">4.8 (2,345 reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Total Guests", value: stats.total, icon: FaUsers, color: "from-purple-500 to-pink-500", change: "+12%", bg: "bg-purple-500/20" },
              { label: "Checked In", value: stats.checkedIn, icon: FaCalendarAlt, color: "from-green-500 to-emerald-500", change: "+5", bg: "bg-green-500/20" },
              { label: "Checked Out", value: stats.checkedOut, icon: FaDoorOpen, color: "from-gray-500 to-gray-600", change: "+8", bg: "bg-gray-500/20" },
              { label: "Upcoming", value: stats.upcoming, icon: FaStar, color: "from-blue-500 to-cyan-500", change: "+3", bg: "bg-blue-500/20" },
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
                    <span className="text-xs text-green-400 font-medium bg-green-500/20 px-2 py-1 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                  <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Main Card */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 animate-fadeInUp">
            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, contact, or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>
              
              <div className="flex gap-3">
                <div className="relative">
                  <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all appearance-none"
                  >
                    <option value="all">All Status</option>
                    <option value="Booked">Booked</option>
                    <option value="Checked In">Checked In</option>
                    <option value="Checked Out">Checked Out</option>
                  </select>
                </div>
                
                <div className="relative">
                  <FaBed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={roomTypeFilter}
                    onChange={(e) => setRoomTypeFilter(e.target.value)}
                    className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all appearance-none"
                  >
                    <option value="all">All Rooms</option>
                    <option value="normal">Normal Rooms</option>
                    <option value="deluxe">Deluxe Rooms</option>
                    <option value="suite">Suite Rooms</option>
                  </select>
                </div>
                
                <button className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition flex items-center gap-2">
                  <FaDownload />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Room</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Days</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Check-In</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Check-Out</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                   </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, idx) => (
                    <tr 
                      key={booking.id} 
                      className="border-b border-white/10 hover:bg-white/5 transition-colors animate-fadeInUp"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      {editingBooking?.id === booking.id ? (
                        // Edit Mode
                        <>
                          <td className="px-4 py-3">
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingBooking.name || ""}
                                onChange={(e) => setEditingBooking({ ...editingBooking, name: e.target.value })}
                                className="px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm w-full focus:outline-none focus:border-purple-500"
                                placeholder="Name"
                              />
                              <input
                                type="email"
                                value={editingBooking.email || ""}
                                onChange={(e) => setEditingBooking({ ...editingBooking, email: e.target.value })}
                                className="px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm w-full focus:outline-none focus:border-purple-500"
                                placeholder="Email"
                              />
                            </div>
                           </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editingBooking.contact || ""}
                              onChange={(e) => setEditingBooking({ ...editingBooking, contact: e.target.value })}
                              className="px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm w-full focus:outline-none focus:border-purple-500"
                              placeholder="Contact"
                            />
                           </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editingBooking.room || ""}
                              onChange={(e) => setEditingBooking({ ...editingBooking, room: e.target.value })}
                              className="px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm w-full focus:outline-none focus:border-purple-500"
                              placeholder="Room"
                            />
                           </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={editingBooking.days || ""}
                              onChange={(e) => setEditingBooking({ ...editingBooking, days: e.target.value })}
                              className="px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm w-full focus:outline-none focus:border-purple-500"
                              placeholder="Days"
                            />
                           </td>
                          <td className="px-4 py-3">
                            <input
                              type="datetime-local"
                              value={toDateTimeLocal(editingBooking.checkin)}
                              onChange={(e) => setEditingBooking({ ...editingBooking, checkin: e.target.value })}
                              className="px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm w-full focus:outline-none focus:border-purple-500"
                            />
                           </td>
                          <td className="px-4 py-3">
                            <input
                              type="datetime-local"
                              value={toDateTimeLocal(editingBooking.checkout)}
                              onChange={(e) => setEditingBooking({ ...editingBooking, checkout: e.target.value })}
                              className="px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm w-full focus:outline-none focus:border-purple-500"
                            />
                           </td>
                          <td className="px-4 py-3">
                            <StatusBadge checkin={editingBooking.checkin} checkout={editingBooking.checkout} />
                           </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditBooking(editingBooking.id, editingBooking)}
                                className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition group"
                                title="Save"
                              >
                                <FaSave className="group-hover:scale-110 transition-transform" />
                              </button>
                              <button
                                onClick={() => setEditingBooking(null)}
                                className="p-2 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30 transition group"
                                title="Cancel"
                              >
                                <FaTimes className="group-hover:scale-110 transition-transform" />
                              </button>
                            </div>
                           </td>
                        </>
                      ) : (
                        // View Mode
                        <>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-white font-medium">{booking.name}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <FaEnvelope className="text-[10px]" />
                                {booking.email}
                              </p>
                            </div>
                           </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-300 flex items-center gap-2">
                              <FaPhone className="text-xs text-purple-400" />
                              {booking.contact}
                            </p>
                           </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getRoomTypeIcon(booking.room)}</span>
                              <span className="text-gray-300">{booking.room}</span>
                            </div>
                           </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-300">{booking.days} {booking.days === 1 ? 'night' : 'nights'}</span>
                           </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-300 text-sm">{formatDateTime(booking.checkin)}</p>
                           </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-300 text-sm">{formatDateTime(booking.checkout)}</p>
                           </td>
                          <td className="px-4 py-3">
                            <StatusBadge checkin={booking.checkin} checkout={booking.checkout} />
                           </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingBooking(booking)}
                                className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition group"
                                title="Edit Booking"
                              >
                                <FaEdit className="group-hover:scale-110 transition-transform" />
                              </button>
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition group"
                                title="Cancel Booking"
                              >
                                <FaTrash className="group-hover:scale-110 transition-transform" />
                              </button>
                            </div>
                           </td>
                        </>
                      )}
                     </tr>
                  ))}
                </tbody>
               </table>

              {filteredBookings.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <FaUserFriends className="text-4xl text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No guests found</h3>
                  <p className="text-gray-400">Try adjusting your search or filters</p>
                </div>
              )}
            </div>

            {/* Footer with pagination info */}
            {filteredBookings.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-center">
                <p className="text-sm text-gray-400">
                  Showing {filteredBookings.length} of {bookings.length} guests
                </p>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-white/5 rounded-lg text-gray-400 hover:bg-white/10 transition disabled:opacity-50" disabled>
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition">
                    1
                  </button>
                  <button className="px-3 py-1 bg-white/5 rounded-lg text-gray-400 hover:bg-white/10 transition">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
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
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease forwards;
        }
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .hover-scale {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-scale:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}