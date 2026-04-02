'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { 
  FaMoneyBillWave, FaCheckCircle, FaTimesCircle,
  FaCreditCard, FaSpinner, FaClock, FaWallet, FaArrowLeft,
  FaHotel, FaUser, FaCalendarAlt, FaRupeeSign, FaTachometerAlt,
  FaChartLine, FaUsers, FaBook, FaDoorOpen
} from "react-icons/fa";

// ── Date helpers ──────────────────────────────────────────────────────────────
const formatDateTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
};

// ── compute real booking status from checkin/checkout datetimes ──────────
const computeBookingStatus = (checkin, checkout) => {
  if (!checkin || !checkout) return "Booked";
  const now = new Date();
  const checkIn = new Date(checkin);
  const checkOut = new Date(checkout);
  if (now < checkIn) return "Booked";
  if (now >= checkIn && now < checkOut) return "Checked In";
  return "Checked Out";
};

// ── compute payment status based on actual payment data from payments API ──
const getPaymentStatusFromPayments = (payments) => {
  if (!payments || payments.length === 0) {
    return { text: "Not Yet", color: "bg-red-500/20 text-red-400", icon: FaTimesCircle };
  }
  
  // Check for offline payment
  const offlinePayment = payments.find(p => 
    p.service?.toLowerCase().includes("offline") || 
    p.service?.toLowerCase().includes("reception")
  );
  
  // Check for online payment (eSewa)
  const onlinePayment = payments.find(p => 
    p.service?.toLowerCase().includes("esewa") || 
    p.service?.toLowerCase().includes("online")
  );
  
  if (offlinePayment) {
    return { 
      text: "Paid Offline", 
      color: "bg-blue-500/20 text-blue-400", 
      icon: FaWallet,
      method: "offline"
    };
  }
  
  if (onlinePayment) {
    return { 
      text: "Paid Online", 
      color: "bg-green-500/20 text-green-400", 
      icon: FaCreditCard,
      method: "online"
    };
  }
  
  return { text: "Not Yet", color: "bg-red-500/20 text-red-400", icon: FaTimesCircle };
};

// Status Badge Component
const StatusBadge = ({ checkin, checkout }) => {
  const status = computeBookingStatus(checkin, checkout);
  const cfg = {
    "Booked":      { bg: "bg-blue-500/25",  text: "text-blue-200",  border: "border-blue-400/50",  icon: "📅" },
    "Checked In":  { bg: "bg-green-500/25", text: "text-green-200", border: "border-green-400/50", icon: "✅" },
    "Checked Out": { bg: "bg-gray-500/25",  text: "text-gray-200",  border: "border-gray-400/50",  icon: "🚪" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-extrabold text-base border-2 tracking-widest uppercase shadow-lg ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className="text-lg">{cfg.icon}</span>{status}
    </span>
  );
};

// Payment Status Badge Component with real payment data
const PaymentStatusBadge = ({ payments }) => {
  const { text, color, icon: Icon } = getPaymentStatusFromPayments(payments);
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${color}`}>
      <Icon className="w-4 h-4" />
      {text}
    </span>
  );
};

// Helper to calculate numeric amount for a booking
const calculateBookingAmount = (room, days, prices) => {
  if (!prices || !days || !room) return 0;
  const d = Number(days);
  if (!d) return 0;
  const roomLower = room.toLowerCase();
  let unitPrice = 0;
  
  if (roomLower.includes("normal")) unitPrice = prices.normal_price;
  else if (roomLower.includes("deluxe")) unitPrice = prices.deluxe_price;
  else if (roomLower.includes("suite")) unitPrice = prices.suite_price;
  else {
    const match = room.match(/\d+/);
    if (match) {
      const roomNum = parseInt(match[0]);
      if (roomNum >= 101 && roomNum <= 199) unitPrice = prices.normal_price;
      else if (roomNum >= 201 && roomNum <= 299) unitPrice = prices.deluxe_price;
      else if (roomNum >= 301 && roomNum <= 399) unitPrice = prices.suite_price;
    }
  }
  return d * unitPrice;
};

const getRoomTypeBadge = (room) => {
  const r = room?.toLowerCase() || "";
  if (r.includes("normal") || (parseInt(room) >= 101 && parseInt(room) <= 199))
    return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">Normal</span>;
  if (r.includes("deluxe") || (parseInt(room) >= 201 && parseInt(room) <= 299))
    return <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">Deluxe</span>;
  if (r.includes("suite") || (parseInt(room) >= 301 && parseInt(room) <= 399))
    return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">Suite</span>;
  return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400">Standard</span>;
};

export default function ManagePaymentsDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState(null);
  const [paymentsData, setPaymentsData] = useState({}); // Store payments for each booking
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidOnline: 0,
    paidOffline: 0,
    pending: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all bookings
        const bookRes = await api.get("/api/manage-bookings/");
        const bookingsData = bookRes.data;
        setBookings(bookingsData);
        
        // Fetch room prices
        const priceRes = await api.get("/api/room-price/");
        setPrices(priceRes.data);
        
        // Fetch payments for each booking
        const paymentsMap = {};
        let totalRev = 0;
        let online = 0;
        let offline = 0;
        let pending = 0;
        
        await Promise.all(
          bookingsData.map(async (booking) => {
            try {
              const payRes = await api.get(`/api/manage-bookings/${booking.id}/payments/`);
              paymentsMap[booking.id] = payRes.data;
              
              // Calculate stats
              const amount = calculateBookingAmount(booking.room, booking.days, priceRes.data);
              totalRev += amount;
              
              if (payRes.data.length > 0) {
                const hasOnline = payRes.data.some(p => p.service?.toLowerCase().includes("esewa"));
                const hasOffline = payRes.data.some(p => p.service?.toLowerCase().includes("offline"));
                
                if (hasOnline) online++;
                else if (hasOffline) offline++;
                else pending++;
              } else {
                pending++;
              }
            } catch (err) {
              console.error(`Error fetching payments for booking ${booking.id}:`, err);
              paymentsMap[booking.id] = [];
              pending++;
            }
          })
        );
        setPaymentsData(paymentsMap);
        setStats({
          totalRevenue: totalRev,
          paidOnline: online,
          paidOffline: offline,
          pending: pending
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data", err);
        setLoading(false);
      }
    };
    fetchData();
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

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background with gradient and animation */}
      <div className="fixed inset-0 bg-cover bg-center bg-fixed z-0"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-800/90" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>

      <div className="relative z-10 min-h-screen p-8">
        {/* Back Button */}
        <button onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl text-white transition-all border border-white/20 shadow-lg hover:scale-105">
          <FaArrowLeft className="text-sm" /> Back to Dashboard
        </button>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fadeInUp">
            <div className="inline-block p-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-2xl">
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl px-8 py-4">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <FaMoneyBillWave className="text-4xl text-purple-400" />
                  <FaCreditCard className="text-4xl text-pink-400" />
                  <FaWallet className="text-4xl text-orange-400" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-3">
                  Payment Records
                </h1>
                <p className="text-gray-300 text-lg">View and manage all hotel payments</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Total Revenue", value: `Rs. ${stats.totalRevenue.toFixed(2)}`, icon: FaRupeeSign, color: "from-purple-500 to-pink-500", subtitle: "From all bookings" },
              { label: "Online Payments", value: stats.paidOnline, icon: FaCreditCard, color: "from-green-500 to-emerald-500", subtitle: "eSewa payments" },
              { label: "Offline Payments", value: stats.paidOffline, icon: FaWallet, color: "from-blue-500 to-cyan-500", subtitle: "Reception payments" },
              { label: "Pending Payments", value: stats.pending, icon: FaClock, color: "from-orange-500 to-red-500", subtitle: "Awaiting payment" },
            ].map((stat, idx) => (
              <div key={idx}
                className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 hover:scale-105 transition-all duration-300 animate-fadeInUp"
                style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                      <stat.icon className="text-2xl text-white" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                  <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Records Table */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 animate-fadeInUp">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaTachometerAlt className="text-purple-400" />
                Payment Records
              </h2>
              <div className="flex gap-3">
                <div className="bg-green-500/20 px-4 py-2 rounded-full">
                  <p className="text-green-300 text-sm">Online: {stats.paidOnline}</p>
                </div>
                <div className="bg-blue-500/20 px-4 py-2 rounded-full">
                  <p className="text-blue-300 text-sm">Offline: {stats.paidOffline}</p>
                </div>
                <div className="bg-red-500/20 px-4 py-2 rounded-full">
                  <p className="text-red-300 text-sm">Pending: {stats.pending}</p>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Room</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Days</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Check-In</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Check-Out</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Payment Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Room Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Total Price</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const totalAmount = calculateBookingAmount(booking.room, booking.days, prices);
                    const bookingPayments = paymentsData[booking.id] || [];
                    
                    return (
                      <tr key={booking.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{booking.name}</td>
                        <td className="px-4 py-3 text-gray-300">{booking.email}</td>
                        <td className="px-4 py-3 text-gray-300">{booking.contact}</td>
                        <td className="px-4 py-3 text-gray-300">{booking.room}</td>
                        <td className="px-4 py-3 text-gray-300">{booking.days}</td>
                        <td className="px-4 py-3 text-gray-300">{formatDateTime(booking.checkin)}</td>
                        <td className="px-4 py-3 text-gray-300">{formatDateTime(booking.checkout)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge checkin={booking.checkin} checkout={booking.checkout} />
                        </td>
                        <td className="px-4 py-3">
                          <PaymentStatusBadge payments={bookingPayments} />
                        </td>
                        <td className="px-4 py-3">
                          {getRoomTypeBadge(booking.room)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300 font-semibold">
                          Rs. {totalAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link href={`/receptionist/manage-payments/${booking.id}`}>
                              <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium shadow-lg" title="Manage Payments">
                                <FaMoneyBillWave /> Pay Now
                              </button>
                            </Link>
                          </div>
                        </td>
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
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes fadeIn { 
          from { opacity: 0; } 
          to { opacity: 1; } 
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease forwards; }
        .animate-fadeIn { animation: fadeIn 0.2s ease forwards; }
      `}</style>
    </div>
  );
}