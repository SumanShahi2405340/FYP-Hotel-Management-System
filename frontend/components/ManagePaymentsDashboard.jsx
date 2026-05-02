'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import api from "@/utils/api";
import {
  FaMoneyBillWave, FaCheckCircle, FaTimesCircle,
  FaCreditCard, FaClock, FaWallet, FaArrowLeft,
  FaHotel, FaRupeeSign, FaTachometerAlt,
} from "react-icons/fa";

// ── Date helpers ──────────────────────────────────────────────────────────────
const formatDateTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
};

// ── Booking status ────────────────────────────────────────────────────────────
const computeBookingStatus = (checkin, checkout) => {
  if (!checkin || !checkout) return "Booked";
  const now = new Date();
  const ci = new Date(checkin);
  const co = new Date(checkout);
  if (now < ci) return "Booked";
  if (now >= ci && now < co) return "Checked In";
  return "Checked Out";
};

// ── Payment status from payments array ───────────────────────────────────────
const getPaymentStatus = (payments) => {
  if (!payments || payments.length === 0)
    return { text: "Not Yet", color: "bg-red-500/20 text-red-400", icon: FaTimesCircle };

  const hasOffline = payments.some(
    (p) => p.service?.toLowerCase().includes("offline") || p.service?.toLowerCase().includes("reception")
  );
  const hasOnline = payments.some(
    (p) => p.service?.toLowerCase().includes("esewa") || p.service?.toLowerCase().includes("online")
  );

  if (hasOffline) return { text: "Paid Offline", color: "bg-blue-500/20 text-blue-400",  icon: FaWallet,     method: "offline" };
  if (hasOnline)  return { text: "Paid Online",  color: "bg-green-500/20 text-green-400", icon: FaCreditCard, method: "online"  };
  return { text: "Not Yet", color: "bg-red-500/20 text-red-400", icon: FaTimesCircle };
};

// ── Amount helper ─────────────────────────────────────────────────────────────
const calcAmount = (room, days, prices) => {
  if (!prices || !days || !room) return 0;
  const d = Number(days);
  if (!d) return 0;
  const r = room.toLowerCase();
  let unit = 0;
  if      (r.includes("normal"))  unit = prices.normal_price;
  else if (r.includes("deluxe"))  unit = prices.deluxe_price;
  else if (r.includes("suite"))   unit = prices.suite_price;
  else {
    const n = parseInt(room.match(/\d+/)?.[0]);
    if (n >= 101 && n <= 199) unit = prices.normal_price;
    else if (n >= 201 && n <= 299) unit = prices.deluxe_price;
    else if (n >= 301 && n <= 399) unit = prices.suite_price;
  }
  return d * unit;
};

// ── Badges ────────────────────────────────────────────────────────────────────
const StatusBadge = ({ checkin, checkout }) => {
  const status = computeBookingStatus(checkin, checkout);
  const cfg = {
    "Booked":      { bg: "bg-blue-500/25",  text: "text-blue-200",  border: "border-blue-400/50",  icon: "📅" },
    "Checked In":  { bg: "bg-green-500/25", text: "text-green-200", border: "border-green-400/50", icon: "✅" },
    "Checked Out": { bg: "bg-gray-500/25",  text: "text-gray-200",  border: "border-gray-400/50",  icon: "🚪" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs border tracking-wider uppercase ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon} {status}
    </span>
  );
};

const PaymentBadge = ({ payments }) => {
  const { text, color, icon: Icon } = getPaymentStatus(payments);
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${color}`}>
      <Icon className="w-4 h-4" /> {text}
    </span>
  );
};

const RoomTypeBadge = ({ room }) => {
  const r = room?.toLowerCase() || "";
  const n = parseInt(room);
  if (r.includes("normal")  || (n >= 101 && n <= 199)) return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">Normal</span>;
  if (r.includes("deluxe")  || (n >= 201 && n <= 299)) return <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">Deluxe</span>;
  if (r.includes("suite")   || (n >= 301 && n <= 399)) return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">Suite</span>;
  return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400">Standard</span>;
};

// ── Shared TH style ───────────────────────────────────────────────────────────
const TH = ({ children }) => (
  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
    {children}
  </th>
);

// ══════════════════════════════════════════════════════════════════════════════
export default function ManagePaymentsDashboard() {
  const router   = useRouter();
  const pathname = usePathname();

  // ── Route detection ──────────────────────────────────────────────────────
  const isOwner       = pathname?.includes("/owner/");
  const isReceptionist = pathname?.includes("/receptionist/");

  const [bookings,     setBookings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [prices,       setPrices]       = useState(null);
  const [paymentsData, setPaymentsData] = useState({});
  const [stats, setStats] = useState({ totalRevenue: 0, paidOnline: 0, paidOffline: 0, pending: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [bookRes, priceRes] = await Promise.all([
          api.get("/api/manage-bookings/"),
          api.get("/api/room-price/"),
        ]);
        const bookingsData = bookRes.data;
        const pricesData   = priceRes.data;
        setBookings(bookingsData);
        setPrices(pricesData);

        const map = {};
        let totalRev = 0, online = 0, offline = 0, pending = 0;

        await Promise.all(
          bookingsData.map(async (b) => {
            try {
              const payRes = await api.get(`/api/manage-bookings/${b.id}/payments/`);
              map[b.id] = payRes.data;
              totalRev += calcAmount(b.room, b.days, pricesData);
              const { method } = getPaymentStatus(payRes.data);
              if      (method === "online")  online++;
              else if (method === "offline") offline++;
              else                           pending++;
            } catch {
              map[b.id] = [];
              pending++;
            }
          })
        );

        setPaymentsData(map);
        setStats({ totalRevenue: totalRev, paidOnline: online, paidOffline: offline, pending });
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading payment data...</p>
        </div>
      </div>
    );
  }

  // ── Shared stat cards ─────────────────────────────────────────────────────
  const statCards = [
    { label: "Total Revenue",     value: `Rs. ${stats.totalRevenue.toFixed(2)}`, icon: FaRupeeSign,    color: "from-purple-500 to-pink-500",   subtitle: "From all bookings"   },
    { label: "Online Payments",   value: stats.paidOnline,                       icon: FaCreditCard,   color: "from-green-500 to-emerald-500", subtitle: "eSewa payments"      },
    { label: "Offline Payments",  value: stats.paidOffline,                      icon: FaWallet,       color: "from-blue-500 to-cyan-500",     subtitle: "Reception payments"  },
    { label: "Pending Payments",  value: stats.pending,                          icon: FaClock,        color: "from-orange-500 to-red-500",    subtitle: "Awaiting payment"    },
  ];

  return (
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
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>

      <div className="relative z-10 min-h-screen p-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl text-white transition-all border border-white/20 shadow-lg hover:scale-105"
        >
          <FaArrowLeft className="text-sm" /> Back to Dashboard
        </button>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fadeInUp">
            <div className="inline-block p-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-2xl">
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl px-8 py-4">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <FaMoneyBillWave className="text-4xl text-purple-400" />
                  <FaCreditCard    className="text-4xl text-pink-400" />
                  <FaWallet        className="text-4xl text-orange-400" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-3">
                  {isOwner ? "Payment Records" : "Manage Payments"}
                </h1>
                <p className="text-gray-300 text-lg">
                  {isOwner ? "View all hotel payments" : "View and manage all hotel payments"}
                </p>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((s, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 hover:scale-105 transition-all duration-300 animate-fadeInUp"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${s.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                <div className="relative z-10">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${s.color} bg-opacity-20 w-fit mb-4`}>
                    <s.icon className="text-2xl text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">{s.value}</h3>
                  <p className="text-sm text-gray-400 mt-1">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.subtitle}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Table Panel ─────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 animate-fadeInUp">
            {/* Panel header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaTachometerAlt className="text-purple-400" />
                {isOwner ? "Payment Records" : "Manage Payments"}
              </h2>
              <div className="flex gap-3 flex-wrap">
                <span className="bg-green-500/20 px-4 py-2 rounded-full text-green-300 text-sm">Online: {stats.paidOnline}</span>
                <span className="bg-blue-500/20  px-4 py-2 rounded-full text-blue-300  text-sm">Offline: {stats.paidOffline}</span>
                <span className="bg-red-500/20   px-4 py-2 rounded-full text-red-300   text-sm">Pending: {stats.pending}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <TH>Customer</TH>
                    <TH>Email</TH>
                    <TH>Contact</TH>
                    <TH>Room</TH>
                    <TH>Days</TH>
                    <TH>Check-In</TH>
                    <TH>Check-Out</TH>
                    <TH>Status</TH>
                    {/* Receptionist shows Payment Status before Room Type; Owner shows it at the end */}
                    {isReceptionist && <TH>Payment Status</TH>}
                    <TH>Room Type</TH>
                    <TH>Total Price</TH>
                    {isOwner        && <TH>Payment Status</TH>}
                    {isReceptionist && <TH>Actions</TH>}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const amount   = calcAmount(booking.room, booking.days, prices);
                    const payments = paymentsData[booking.id] || [];

                    return (
                      <tr key={booking.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{booking.name}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{booking.email}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm whitespace-nowrap">{booking.contact}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{booking.room}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{booking.days}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm whitespace-nowrap">{formatDateTime(booking.checkin)}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm whitespace-nowrap">{formatDateTime(booking.checkout)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge checkin={booking.checkin} checkout={booking.checkout} />
                        </td>

                        {/* Receptionist: Payment Status column before Room Type */}
                        {isReceptionist && (
                          <td className="px-4 py-3">
                            <PaymentBadge payments={payments} />
                          </td>
                        )}

                        <td className="px-4 py-3">
                          <RoomTypeBadge room={booking.room} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300 font-semibold whitespace-nowrap">
                          Rs. {amount.toFixed(2)}
                        </td>

                        {/* Owner: Payment Status column at end (read-only, no actions) */}
                        {isOwner && (
                          <td className="px-4 py-3">
                            <PaymentBadge payments={payments} />
                          </td>
                        )}

                        {/* Receptionist only: Pay Now action */}
                        {isReceptionist && (
                          <td className="px-4 py-3">
                            <Link href={`/receptionist/manage-payments/${booking.id}`}>
                              <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium shadow-lg whitespace-nowrap">
                                <FaMoneyBillWave /> Pay Now
                              </button>
                            </Link>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {bookings.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <FaHotel className="text-4xl text-purple-400" />
                  </div>
                  <p className="text-gray-400">No payments found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease forwards; }
        .delay-1000 { animation-delay: 1s; }
      `}</style>
    </div>
  );
}