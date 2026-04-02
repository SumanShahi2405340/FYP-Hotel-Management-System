// components/ViewBookings.jsx
"use client";
import React, { useState, useEffect } from "react";
import api from "@/utils/api";
import {
  FaUser, FaEnvelope, FaPhone, FaBed, FaCalendarAlt,
  FaSearch, FaSpinner, FaInbox
} from "react-icons/fa";

const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
};

const computeBookingStatus = (checkin, checkout) => {
  if (!checkin || !checkout) return "Booked";
  const now = new Date();
  const ci = new Date(checkin);
  const co = new Date(checkout);
  if (now < ci) return "Booked";
  if (now >= ci && now < co) return "Checked In";
  return "Checked Out";
};

const StatusBadge = ({ checkin, checkout }) => {
  const status = computeBookingStatus(checkin, checkout);
  const cfg = {
    "Booked":      { bg: "bg-blue-500/20",  text: "text-blue-400",  icon: "📅" },
    "Checked In":  { bg: "bg-green-500/20", text: "text-green-400", icon: "✅" },
    "Checked Out": { bg: "bg-gray-500/20",  text: "text-gray-400",  icon: "🚪" },
  }[status] || { bg: "bg-blue-500/20", text: "text-blue-400", icon: "📅" };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span>{cfg.icon}</span> {status}
    </span>
  );
};

export default function ViewBookings() {
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get("/api/manage-bookings/");
        const data = res.data?.results ?? res.data;
        setBookings(data);
        setFiltered(data);
      } catch (err) {
        console.error("Error fetching bookings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) { setFiltered(bookings); return; }
    const q = searchTerm.toLowerCase();
    setFiltered(bookings.filter(b =>
      b.name?.toLowerCase().includes(q) ||
      b.email?.toLowerCase().includes(q) ||
      b.contact?.includes(q) ||
      b.room?.toLowerCase().includes(q)
    ));
  }, [searchTerm, bookings]);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <FaSpinner className="animate-spin text-purple-400 text-3xl" />
    </div>
  );

  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaBed className="text-purple-400" /> View Bookings
        </h2>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-purple-500 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              {["Customer", "Email", "Contact", "Room", "Days", "Check-In", "Check-Out", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((b, idx) => (
              <tr
                key={b.id ?? idx}
                className="border-b border-white/10 hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <FaUser className="text-white text-xs" />
                    </div>
                    <span className="text-white font-medium">{b.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-300 flex items-center gap-1 text-sm">
                    <FaEnvelope className="text-[10px] text-purple-400" /> {b.email}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-300 flex items-center gap-1 text-sm">
                    <FaPhone className="text-[10px] text-purple-400" /> {b.contact}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-300 text-sm">{b.room}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-300 text-sm">{b.days} {b.days === 1 ? "night" : "nights"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-300 text-sm flex items-center gap-1">
                    <FaCalendarAlt className="text-[10px] text-purple-400" /> {formatDateTime(b.checkin)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-300 text-sm">{formatDateTime(b.checkout)}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge checkin={b.checkin} checkout={b.checkout} />
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" className="py-12 text-center">
                  <FaInbox className="text-4xl text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No bookings found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
          Showing {filtered.length} of {bookings.length} bookings
        </div>
      )}
    </div>
  );
}