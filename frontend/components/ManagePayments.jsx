'use client';
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/api";
import { 
  FaArrowLeft, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaQrcode, 
  FaMoneyBillWave, FaCreditCard, FaCheckCircle, FaSpinner, FaWallet,
  FaCoffee, FaUtensils, FaWifi, FaConciergeBell, FaCar, FaPhone,
  FaCalendarAlt, FaUser, FaHotel, FaRupeeSign,
  FaKey, FaMobileAlt, FaShieldAlt, FaEye, FaHistory, FaUserCircle,
  FaQrcode as FaQrCodeScanner, FaArrowRight
} from "react-icons/fa";

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

const computeBookingStatus = (checkin, checkout) => {
  if (!checkin || !checkout) return "Booked";
  const now = new Date(), ci = new Date(checkin), co = new Date(checkout);
  if (now < ci) return "Booked";
  if (now >= ci && now < co) return "Checked In";
  return "Checked Out";
};

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

const getServiceIcon = (service) => {
  const s = service?.toLowerCase() || "";
  if (s.includes("food") || s.includes("restaurant")) return <FaUtensils className="text-orange-400" />;
  if (s.includes("coffee") || s.includes("bar")) return <FaCoffee className="text-amber-500" />;
  if (s.includes("wifi")) return <FaWifi className="text-blue-400" />;
  if (s.includes("spa") || s.includes("massage")) return <FaConciergeBell className="text-purple-400" />;
  if (s.includes("transport") || s.includes("taxi")) return <FaCar className="text-green-400" />;
  if (s.includes("phone")) return <FaPhone className="text-indigo-400" />;
  return <FaWallet className="text-gray-400" />;
};

export default function PaymentsPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.bookingId;

  const [booking, setBooking] = useState(null);
  const [prices, setPrices] = useState(null);
  const [adjustmentsList, setAdjustmentsList] = useState([]);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [adjustment, setAdjustment] = useState({ service: "", description: "", amount: "", date: "" });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [hotelName, setHotelName] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'offline' or 'online'

  // payment
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentStep, setPaymentStep] = useState("select");

  // eSewa Dashboard State
  const [esewaConfig, setEsewaConfig] = useState({ merchantId: "EPAYTEST", secretKey: "8gBm/:&EnhH.1/q", environment: "test", isConfigured: true });
  const [esewaError, setEsewaError] = useState("");
  const [esewaLoading, setEsewaLoading] = useState(false);
  const [esewaUser, setEsewaUser] = useState({ mobile: "", password: "" });
  const [esewaQrData, setEsewaQrData] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // add method modal
  const [showPaymentMethodForm, setShowPaymentMethodForm] = useState(false);
  const [showEsewaConfig, setShowEsewaConfig] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    (async () => {
      setLoading(true);
      try {
        const [bookRes, priceRes, payRes] = await Promise.all([
          api.get(`/api/manage-bookings/${bookingId}/`),
          api.get("/api/room-price/"),
          api.get(`/api/manage-bookings/${bookingId}/payments/`),
        ]);
        setBooking(bookRes.data);
        setPrices(priceRes.data);
        setAdjustmentsList(payRes.data);
        
        const existingPayment = payRes.data.find(p => p.service?.includes("Offline Payment") || p.service?.includes("eSewa Online Payment"));
        if (existingPayment) {
          if (existingPayment.service?.includes("Offline")) {
            setPaymentStatus("completed");
            setPaymentMethod("offline");
          } else if (existingPayment.service?.includes("eSewa")) {
            setPaymentStatus("completed");
            setPaymentMethod("online");
          }
        } else {
          setPaymentStatus("pending");
        }
        
        try {
          const meRes = await api.get("/api/me/");
          if (meRes.data?.hotel_name) {
            setHotelName(meRes.data.hotel_name);
          }
        } catch (err) {
          console.error("Error fetching hotel:", err);
        }
        
        const saved = localStorage.getItem("esewa_config");
        if (saved) setEsewaConfig(JSON.parse(saved));
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  useEffect(() => {
    if (esewaConfig.secretKey) localStorage.setItem("esewa_config", JSON.stringify(esewaConfig));
  }, [esewaConfig]);

  const handleAdjustment = async () => {
    try {
      await api.post("/api/manage-payments/", { booking: bookingId, name: booking.name, ...adjustment });
      setAdjustment({ service: "", description: "", amount: "", date: "" });
      const payRes = await api.get(`/api/manage-bookings/${bookingId}/payments/`);
      setAdjustmentsList(payRes.data);
    } catch { alert("Failed to add service charge"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this charge?")) return;
    try {
      await api.delete(`/api/manage-payments/${id}/`);
      setAdjustmentsList(adjustmentsList.filter((a) => a.id !== id));
    } catch { alert("Failed to delete"); }
  };

  const handleEdit = (row) => { setEditingId(row.id); setEditData({ ...row }); };
  const handleCancel = () => { setEditingId(null); setEditData({}); };
  const handleSave = async (id) => {
    try {
      await api.put(`/api/manage-payments/${id}/`, editData);
      setAdjustmentsList(adjustmentsList.map((a) => (a.id === id ? editData : a)));
      setEditingId(null); setEditData({});
    } catch { alert("Failed to save"); }
  };

  const getRoomUnitPrice = (room, prices) => {
    if (!prices) return 0;
    const r = room.toLowerCase();
    if (r.includes("normal") || (parseInt(room) >= 101 && parseInt(room) <= 199)) return prices.normal_price;
    if (r.includes("deluxe") || (parseInt(room) >= 201 && parseInt(room) <= 299)) return prices.deluxe_price;
    if (r.includes("suite") || (parseInt(room) >= 301 && parseInt(room) <= 399)) return prices.suite_price;
    return 0;
  };
  const calcRoomTotal = (room, days, prices) => (!prices || !days) ? 0 : days * getRoomUnitPrice(room, prices);
  const getRoomDesc = (b) => {
    if (!b) return "";
    const rn = b.room_number || b.room_no || b.room;
    return `${rn} / ${b.room} • ${b.days} night${b.days > 1 ? "s" : ""}`;
  };
  const calculateTotal = () => {
    let total = 0;
    if (booking && prices) total += calcRoomTotal(booking.room, booking.days, prices);
    adjustmentsList.forEach((a) => { total += parseFloat(a.amount) || 0; });
    return total.toFixed(2);
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

  const saveEsewaConfig = () => {
    if (!esewaConfig.merchantId.trim() || !esewaConfig.secretKey.trim()) { alert("Fill both fields"); return; }
    const updated = { ...esewaConfig, isConfigured: true };
    setEsewaConfig(updated);
    localStorage.setItem("esewa_config", JSON.stringify(updated));
    setShowEsewaConfig(false);
    alert("eSewa configuration saved!");
  };

  const recordOfflinePayment = async () => {
    setPaymentProcessing(true);
    try {
      await api.post("/api/manage-payments/", {
        booking: bookingId,
        name: booking.name,
        service: "Offline Payment (Reception)",
        description: `Payment received at reception for room ${booking.room} - ${booking.days} nights`,
        amount: calculateTotal(),
        date: new Date().toISOString(),
      });
      setPaymentStatus("completed");
      setPaymentMethod("offline");
      alert(`✅ Payment of Rs. ${calculateTotal()} recorded successfully!`);
      const payRes = await api.get(`/api/manage-bookings/${bookingId}/payments/`);
      setAdjustmentsList(payRes.data);
      closePaymentModal();
    } catch (err) {
      console.error("Error recording offline payment:", err);
      alert("Failed to record payment. Please try again.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleEsewaPayment = () => {
    setPaymentStep("esewa_login");
    setEsewaError("");
    setEsewaUser({ mobile: "", password: "" });
    setEsewaQrData(null);
    setLoggedInUser(null);
  };

  const handleEsewaLogin = async () => {
    if (!esewaUser.mobile || esewaUser.mobile.length < 10) { setEsewaError("Enter a valid 10-digit eSewa ID"); return; }
    if (!esewaUser.password) { setEsewaError("Enter your password"); return; }
    
    setEsewaLoading(true);
    setEsewaError("");
    
    setTimeout(() => {
      setLoggedInUser({
        name: hotelName || "Hotel Merchant",
        mobile: esewaUser.mobile,
        email: "merchant@esewa.com",
      });
      setPaymentStep("esewa_dashboard");
      setEsewaLoading(false);
    }, 1500);
  };

  const handleShowMyQr = async () => {
    setEsewaLoading(true);
    try {
      const res = await api.post("/api/payments/esewa/initiate/", {
        booking_id: bookingId,
        amount: calculateTotal(),
        esewa_id: esewaUser.mobile,
        password: esewaUser.password,
        merchant_id: esewaConfig.merchantId,
        secret_key: esewaConfig.secretKey,
        environment: esewaConfig.environment,
        product_name: `Room Booking - ${booking?.name}`,
        success_url: `${window.location.origin}/payments/${bookingId}/esewa/verify`,
        failure_url: `${window.location.origin}/payments/${bookingId}/esewa/failed`,
      });
      setEsewaQrData(res.data);
      setTransactionId(res.data.transaction_uuid);
      setPaymentStep("esewa_my_qr");
    } catch (err) {
      setEsewaError(err.response?.data?.message || "Failed to generate QR");
    } finally {
      setEsewaLoading(false);
    }
  };

  const handlePayToMerchant = async () => {
    setEsewaLoading(true);
    try {
      const res = await api.post("/api/payments/esewa/initiate/", {
        booking_id: bookingId,
        amount: calculateTotal(),
        esewa_id: esewaUser.mobile,
        password: esewaUser.password,
        merchant_id: esewaConfig.merchantId,
        secret_key: esewaConfig.secretKey,
        environment: esewaConfig.environment,
        product_name: `Room Booking - ${booking?.name}`,
        success_url: `${window.location.origin}/payments/${bookingId}/esewa/verify`,
        failure_url: `${window.location.origin}/payments/${bookingId}/esewa/failed`,
      });
      setEsewaQrData(res.data);
      setTransactionId(res.data.transaction_uuid);
      setPaymentStep("esewa_pay_qr");
    } catch (err) {
      setEsewaError(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setEsewaLoading(false);
    }
  };

  const handleEsewaVerify = async () => {
    setPaymentStep("verifying");
    try {
      const res = await api.post("/api/payments/esewa/verify/", {
        transaction_uuid: transactionId,
        booking_id: bookingId,
        amount: calculateTotal(),
        environment: esewaConfig.environment,
      });
      if (res.data.status === "COMPLETE") {
        await api.post("/api/manage-payments/", {
          booking: bookingId,
          name: booking.name,
          service: "eSewa Online Payment",
          description: `Online payment via eSewa - Transaction ID: ${transactionId}`,
          amount: calculateTotal(),
          date: new Date().toISOString(),
        });
        setPaymentStatus("completed");
        setPaymentMethod("online");
        setPaymentStep("success");
      } else {
        setEsewaError(`Payment status: ${res.data.status}`);
        setPaymentStep("failed");
      }
    } catch (err) {
      setEsewaError(err.response?.data?.message || "Verification failed.");
      setPaymentStep("failed");
    }
  };

  const handleOfflinePayment = () => {
    recordOfflinePayment();
  };
  
  const openPayment = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPaymentStep("select");
    setEsewaError("");
    setShowPaymentPopup(true);
  };
  
  const closePaymentModal = () => {
    setShowPaymentPopup(false);
    setPaymentStep("select");
    setEsewaError("");
    setEsewaLoading(false);
    setEsewaQrData(null);
    setLoggedInUser(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
        <p className="text-gray-400">Loading payment details...</p>
      </div>
    </div>
  );
  if (!booking) return null;

  return (
    <div className="relative min-h-screen overflow-hidden">
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
        <button onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl text-white transition-all border border-white/20 shadow-lg hover:scale-105">
          <FaArrowLeft className="text-sm" /> Back to Dashboard
        </button>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 animate-fadeInUp">
            <div className="inline-block p-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-2xl">
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl px-8 py-4">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <FaMoneyBillWave className="text-4xl text-purple-400" />
                  <FaCreditCard className="text-4xl text-pink-400" />
                  <FaQrcode className="text-4xl text-orange-400" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-3">
                   Payment Records
                </h1>
                <p className="text-gray-300 text-lg">Track bills, add charges, and process payments</p>
                <div className="flex justify-center gap-1 mt-2">
                  <FaHotel className="text-yellow-500 text-sm" />
                  <span className="text-gray-400 text-sm ml-2">Guest: {booking.name}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 mb-8 animate-fadeInUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <FaUser className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{booking.name}</h2>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <FaCalendarAlt className="text-xs" /> {formatDateTime(booking.checkin)} – {formatDateTime(booking.checkout)}
                    </span>
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <FaHotel className="text-xs" /> Room {booking.room}
                    </span>
                    {getRoomTypeBadge(booking.room)}
                  </div>
                </div>
              </div>
              <StatusBadge checkin={booking.checkin} checkout={booking.checkout} />
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 animate-fadeInUp">
            <div className="flex flex-wrap gap-4 mb-6">
              <button onClick={() => setShowAdjustments(!showAdjustments)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${showAdjustments ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'}`}>
                {showAdjustments ? <FaTimes /> : <FaPlus />}
                {showAdjustments ? 'Close Form' : 'Add Services & Charges'}
              </button>
              <button onClick={() => setShowPaymentMethodForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl text-white transition border border-white/20">
                <FaPlus /> Add Payment Method
              </button>
            </div>

            {showAdjustments && (
              <div className="mb-8 p-5 bg-white/5 rounded-xl border border-white/10 animate-fadeInUp">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FaPlus className="text-purple-400" /> Add New Service Charge
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <input type="datetime-local" value={adjustment.date} onChange={(e) => setAdjustment({ ...adjustment, date: e.target.value })} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" />
                  <input type="text" placeholder="Service" value={adjustment.service} onChange={(e) => setAdjustment({ ...adjustment, service: e.target.value })} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" />
                  <input type="text" placeholder="Description" value={adjustment.description} onChange={(e) => setAdjustment({ ...adjustment, description: e.target.value })} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" />
                  <input type="number" placeholder="Amount (Rs.)" value={adjustment.amount} onChange={(e) => setAdjustment({ ...adjustment, amount: e.target.value })} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" />
                  <button onClick={handleAdjustment} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg px-4 py-2 hover:opacity-90 transition">Add Entry</button>
                </div>
              </div>
            )}

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FaWallet className="text-purple-400" /> Billing Details
                </h3>
                <div className="text-sm text-gray-400">{adjustmentsList.length} additional charges</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Date & Time</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Service</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Amount (Rs.)</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/10 bg-white/5">
                      <td className="px-4 py-3 text-sm text-gray-300">{formatDateTime(booking.checkin)}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><FaHotel className="text-purple-400" /><span className="text-white">Room Booking</span></div></td>
                      <td className="px-4 py-3 text-sm text-gray-300">{getRoomDesc(booking)}</td>
                      <td className="px-4 py-3 text-sm text-white font-medium">Rs. {calcRoomTotal(booking.room, booking.days, prices)}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">—</td>
                    </tr>
                    {adjustmentsList.map((adj) => {
                      const isEditing = editingId === adj.id;
                      return (
                        <tr key={`adj-${adj.id}`} className="border-b border-white/10 hover:bg-white/5 transition">
                          <td className="px-4 py-3">{isEditing ? <input type="datetime-local" value={toDateTimeLocal(editData.date)} onChange={(e) => setEditData({ ...editData, date: e.target.value })} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm w-full" /> : <span className="text-sm text-gray-300">{formatDateTime(adj.date)}</span>}</td>
                          <td className="px-4 py-3">{isEditing ? <input type="text" value={editData.service} onChange={(e) => setEditData({ ...editData, service: e.target.value })} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm w-full" /> : <div className="flex items-center gap-2">{getServiceIcon(adj.service)}<span className="text-white text-sm">{adj.service}</span></div>}</td>
                          <td className="px-4 py-3">{isEditing ? <input type="text" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm w-full" /> : <span className="text-sm text-gray-300">{adj.description}</span>}</td>
                          <td className="px-4 py-3">{isEditing ? <input type="number" value={editData.amount} onChange={(e) => setEditData({ ...editData, amount: e.target.value })} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm w-24" /> : <span className="text-white font-medium">Rs. {parseFloat(adj.amount).toFixed(2)}</span>}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {isEditing ? (
                                <><button onClick={() => handleSave(adj.id)} className="p-1.5 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30"><FaSave size={12} /></button><button onClick={handleCancel} className="p-1.5 bg-gray-600/20 text-gray-400 rounded hover:bg-gray-600/30"><FaTimes size={12} /></button></>
                              ) : (
                                <><button onClick={() => handleEdit(adj)} className="p-1.5 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30"><FaEdit size={12} /></button><button onClick={() => handleDelete(adj.id)} className="p-1.5 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"><FaTrash size={12} /></button></>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {adjustmentsList.length === 0 && <div className="text-center py-8 text-gray-400">No additional charges added yet.</div>}
              </div>
            </div>

            {/* Grand Total, Payment Status, and Button */}
            <div className="pt-6 border-t border-white/20 flex flex-col items-center gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-400 uppercase tracking-wider">Grand Total</div>
                <div className="text-4xl font-bold text-white flex items-center justify-center gap-1">
                  <FaRupeeSign className="text-2xl" /> {calculateTotal()}
                </div>
                <div className="text-xs text-gray-500 mt-1">Inclusive of all taxes</div>
              </div>
              
              {/* Payment Status Indicator */}
              {paymentStatus === "pending" && (
                <div className="w-full max-w-md mx-auto mt-2 mb-2">
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <FaWallet className="text-yellow-400 text-lg" />
                      <span className="text-yellow-400 font-semibold text-base">⚠️ Payment Pending</span>
                    </div>
                  </div>
                </div>
              )}
              
              {paymentStatus === "completed" && paymentMethod === "offline" && (
                <div className="w-full max-w-md mx-auto mt-2 mb-2">
                  <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <FaCheckCircle className="text-green-400 text-lg" />
                      <span className="text-green-400 font-semibold text-base">✓ Payment Completed</span>
                    </div>
                  </div>
                </div>
              )}
              
              {paymentStatus === "completed" && paymentMethod === "online" && (
                <div className="w-full max-w-md mx-auto mt-2 mb-2">
                  <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <FaCheckCircle className="text-green-400 text-lg" />
                      <span className="text-green-400 font-semibold text-base">✓ Payment Completed</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Button - Non-clickable when payment completed */}
              {paymentStatus === "pending" ? (
                <button 
                  onClick={openPayment}
                  className="px-8 py-4 rounded-xl transition transform hover:scale-105 flex items-center gap-3 text-lg font-semibold shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
                  type="button"
                >
                  <FaMoneyBillWave /> Proceed to Payment
                </button>
              ) : (
                <div className="px-8 py-4 rounded-xl flex items-center gap-3 text-lg font-semibold shadow-lg bg-gray-500/50 text-gray-300 cursor-not-allowed">
                  {paymentMethod === "offline" ? (
                    <><FaWallet /> Paid at Reception (Offline)</>
                  ) : (
                    <><FaCreditCard /> Paid with eSewa (Online)</>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT POPUP */}
      {showPaymentPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 text-center">
                Select Payment Method
              </h3>
              <div className="min-h-[280px] flex flex-col">
                <button 
                  onClick={handleOfflinePayment}
                  disabled={paymentProcessing}
                  className="w-full mb-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {paymentProcessing ? <><FaSpinner className="animate-spin" /> Processing...</> : <><FaWallet className="text-purple-400" /> Pay at Reception (Offline)</>}
                </button>
                <button onClick={handleEsewaPayment}
                  className="w-full mb-4 py-4 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl text-white font-medium hover:opacity-90 transition flex items-center justify-center gap-3 shadow-lg">
                  <FaMobileAlt className="text-xl" /> Pay with eSewa (Online)
                </button>
                <button onClick={closePaymentModal} className="mt-auto text-gray-400 hover:text-white transition text-sm text-center">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD METHOD MODAL */}
      {showPaymentMethodForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 w-full max-w-md shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">eSewa API Configuration</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Environment</label>
                  <select value={esewaConfig.environment} onChange={(e) => setEsewaConfig({ ...esewaConfig, environment: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none">
                    <option value="test">Test Mode</option>
                    <option value="live">Live Mode</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Merchant ID / Product Code {esewaConfig.environment === "test" && <span className="text-yellow-400 ml-1">(Test: EPAYTEST)</span>}</label>
                  <input type="text" value={esewaConfig.merchantId} onChange={(e) => setEsewaConfig({ ...esewaConfig, merchantId: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Secret Key {esewaConfig.environment === "test" && <span className="text-yellow-400 ml-1">(Test: 8gBm/:&EnhH.1/q)</span>}</label>
                  <input type="password" value={esewaConfig.secretKey} onChange={(e) => setEsewaConfig({ ...esewaConfig, secretKey: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-green-500" />
                </div>
                <button onClick={saveEsewaConfig} className="w-full py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition text-sm">Save eSewa Configuration</button>
              </div>

              <button onClick={() => { setShowPaymentMethodForm(false); }}
                className="w-full mt-4 py-2 text-gray-400 hover:text-white transition text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease forwards; }
        .animate-fadeIn { animation: fadeIn 0.2s ease forwards; }
      `}</style>
    </div>
  );
}