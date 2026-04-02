// components/ViewCheckinCheckout.jsx
"use client";
import React, { useState, useEffect } from "react";
import api from "@/utils/api";
import {
  FaCalendarCheck, FaSignOutAlt, FaClock, FaExclamationCircle,
  FaUser, FaBed, FaPhone, FaSearch, FaFilter, FaSpinner, FaInbox,
  FaChevronRight
} from "react-icons/fa";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
};

const computeStatus = (checkin, checkout) => {
  if (!checkin || !checkout) return "Booked";
  const now = new Date(), ci = new Date(checkin), co = new Date(checkout);
  if (now < ci)             return "Booked";
  if (now >= ci && now < co) return "Checked In";
  return "Checked Out";
};

const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
};

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    "Booked":      { bg: "bg-blue-500/20",   text: "text-blue-300",   border: "border-blue-500/40",   icon: "📅" },
    "Checked In":  { bg: "bg-green-500/20",  text: "text-green-300",  border: "border-green-500/40",  icon: "✅" },
    "Checked Out": { bg: "bg-gray-500/20",   text: "text-gray-300",   border: "border-gray-500/40",   icon: "🚪" },
  }[status] || { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/40", icon: "📅" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span>{cfg.icon}</span> {status}
    </span>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const ViewCheckinCheckout = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/api/manage-bookings/");
        setBookings(res.data?.results ?? res.data);
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Enrich with computed status
  const enriched = bookings.map((b) => ({
    ...b,
    computedStatus: computeStatus(b.checkin, b.checkout),
  }));

  // Stats
  const stats = {
    checkedIn:        enriched.filter((b) => b.computedStatus === "Checked In").length,
    checkedOut:       enriched.filter((b) => b.computedStatus === "Checked Out").length,
    todayCheckIns:    enriched.filter((b) => isToday(b.checkin) && b.computedStatus !== "Checked Out").length,
    todayCheckOuts:   enriched.filter((b) => isToday(b.checkout)).length,
  };

  // Filter + search
  const displayed = enriched.filter((b) => {
    const matchFilter =
      filter === "all"         ? true :
      filter === "Booked"      ? b.computedStatus === "Booked" :
      filter === "Checked In"  ? b.computedStatus === "Checked In" :
      filter === "Checked Out" ? b.computedStatus === "Checked Out" :
      true;

    const q = search.toLowerCase();
    const matchSearch = !q ||
      b.name?.toLowerCase().includes(q) ||
      b.room?.toLowerCase().includes(q) ||
      b.contact?.includes(q);

    return matchFilter && matchSearch;
  });

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <FaSpinner className="animate-spin text-purple-400 text-3xl" />
    </div>
  );

  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 mt-4">

      {/* Header */}
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <FaCalendarCheck className="text-purple-400" /> Check-In / Check-Out Overview
      </h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Checked In",       value: stats.checkedIn,      icon: FaCalendarCheck,   color: "from-green-500 to-emerald-500",   bg: "bg-green-500/20"  },
          { label: "Checked Out",      value: stats.checkedOut,     icon: FaSignOutAlt,      color: "from-gray-500 to-gray-600",        bg: "bg-gray-500/20"   },
          { label: "Today's Check-Ins",value: stats.todayCheckIns,  icon: FaClock,           color: "from-blue-500 to-cyan-500",        bg: "bg-blue-500/20"   },
          { label: "Today's Check-Outs",value: stats.todayCheckOuts,icon: FaExclamationCircle,color:"from-orange-500 to-red-500",       bg: "bg-orange-500/20" },
        ].map((s, i) => (
          <div key={i} className={`relative overflow-hidden rounded-xl ${s.bg} border border-white/10 p-4`}>
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
            <div className="relative z-10">
              <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${s.color} mb-2`}>
                <s.icon className="text-white text-sm" />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by name, room, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-purple-500 transition-all"
          />
        </div>

        {/* Status filter buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <FaFilter className="text-gray-400 text-sm" />
          {["all", "Booked", "Checked In", "Checked Out"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? "bg-purple-500 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              {["Guest", "Room", "Contact", "Check-In", "Check-Out", "Status", "Action"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.length > 0 ? displayed.map((b, idx) => (
              <tr
                key={b.id ?? idx}
                className="border-b border-white/10 hover:bg-white/5 transition-colors"
              >
                {/* Guest */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <FaUser className="text-white text-xs" />
                    </div>
                    <span className="text-white font-medium text-sm">{b.name}</span>
                  </div>
                </td>

                {/* Room */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <FaBed className="text-purple-400 text-xs" />
                    <span className="text-gray-300 text-sm">{b.room}</span>
                  </div>
                </td>

                {/* Contact */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <FaPhone className="text-purple-400 text-xs" />
                    <span className="text-gray-300 text-sm">{b.contact}</span>
                  </div>
                </td>

                {/* Check-In */}
                <td className="px-4 py-3">
                  <div>
                    <span className="text-gray-300 text-sm">{fmt(b.checkin)}</span>
                    {isToday(b.checkin) && b.computedStatus !== "Checked Out" && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 font-semibold">TODAY</span>
                    )}
                  </div>
                </td>

                {/* Check-Out */}
                <td className="px-4 py-3">
                  <div>
                    <span className="text-gray-300 text-sm">{fmt(b.checkout)}</span>
                    {isToday(b.checkout) && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-400 font-semibold">TODAY</span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusBadge status={b.computedStatus} />
                </td>

                {/* Action */}
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {b.computedStatus === "Booked" && (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium">
                        <FaCalendarCheck className="text-[10px]" /> Awaiting Check-In
                      </span>
                    )}
                    {b.computedStatus === "Checked In" && (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium">
                        <FaSignOutAlt className="text-[10px]" /> In-House
                      </span>
                    )}
                    {b.computedStatus === "Checked Out" && (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-500/10 border border-gray-500/30 text-gray-400 text-xs font-medium">
                        <FaChevronRight className="text-[10px]" /> Completed
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="py-12 text-center">
                  <FaInbox className="text-4xl text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No guests match your filters</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {displayed.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
          Showing {displayed.length} of {bookings.length} guests
        </div>
      )}
    </div>
  );
};

export default ViewCheckinCheckout;