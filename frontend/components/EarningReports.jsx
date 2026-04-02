'use client';
import React, { useState, useEffect } from "react";
import api from "@/utils/api";
import { 
  FaChartLine, FaDollarSign, FaCalendarAlt, 
  FaCheckCircle, FaWallet, FaBuilding, 
  FaArrowUp, FaArrowDown
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

// Check if booking has actual payment (offline or online)
const hasRealPayment = (payments) => {
  if (!payments || payments.length === 0) return false;
  
  return payments.some(p => 
    p.service?.toLowerCase().includes("offline") || 
    p.service?.toLowerCase().includes("reception") ||
    p.service?.toLowerCase().includes("esewa") || 
    p.service?.toLowerCase().includes("online")
  );
};

// Get paid amount from actual payments
const getPaidAmountFromPayments = (payments) => {
  if (!payments || payments.length === 0) return 0;
  
  const totalPaid = payments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
  return totalPaid;
};

// Earnings Summary Card Component
const EarningsCard = ({ title, value, icon: Icon, subtitle, trend, trendValue }) => (
  <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:scale-105 transition-all duration-300">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
        {subtitle && <p className="text-gray-500 text-xs mt-2">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <FaArrowUp /> : <FaArrowDown />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-white/10 rounded-xl">
        <Icon className="w-6 h-6 text-purple-400" />
      </div>
    </div>
  </div>
);

export default function EarningReports() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState(null);
  const [paymentsData, setPaymentsData] = useState({}); // Store payments for each booking

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
        
        // Fetch payments for each booking to get real payment data
        const paymentsMap = {};
        await Promise.all(
          bookingsData.map(async (booking) => {
            try {
              const payRes = await api.get(`/api/manage-bookings/${booking.id}/payments/`);
              paymentsMap[booking.id] = payRes.data;
            } catch (err) {
              console.error(`Error fetching payments for booking ${booking.id}:`, err);
              paymentsMap[booking.id] = [];
            }
          })
        );
        setPaymentsData(paymentsMap);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute earnings data from REAL payments
  const getEarningsData = () => {
    if (!prices || !bookings.length) return { 
      totalPaid: 0, 
      thisMonthPaid: 0, 
      totalExpected: 0, 
      paidCount: 0, 
      expectedCount: 0, 
      roomBreakdown: {}, 
      monthlyTrend: [],
      onlinePaid: 0,
      offlinePaid: 0,
      onlineCount: 0,
      offlineCount: 0
    };
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let totalPaid = 0;
    let totalExpected = 0;
    let thisMonthPaid = 0;
    let paidCount = 0;
    let expectedCount = 0;
    let onlinePaid = 0;
    let offlinePaid = 0;
    let onlineCount = 0;
    let offlineCount = 0;
    const roomBreakdown = { Normal: 0, Deluxe: 0, Suite: 0 };
    
    bookings.forEach(booking => {
      const amount = calculateBookingAmount(booking.room, booking.days, prices);
      const bookingPayments = paymentsData[booking.id] || [];
      const hasPayment = hasRealPayment(bookingPayments);
      const paidAmount = hasPayment ? getPaidAmountFromPayments(bookingPayments) : 0;
      
      if (amount > 0) {
        totalExpected += amount;
        expectedCount++;
        
        // Check if booking has actual payment record
        if (hasPayment) {
          totalPaid += paidAmount;
          paidCount++;
          
          // Check payment method
          const hasOffline = bookingPayments.some(p => 
            p.service?.toLowerCase().includes("offline") || 
            p.service?.toLowerCase().includes("reception")
          );
          const hasOnline = bookingPayments.some(p => 
            p.service?.toLowerCase().includes("esewa") || 
            p.service?.toLowerCase().includes("online")
          );
          
          if (hasOffline) {
            offlinePaid += paidAmount;
            offlineCount++;
          }
          if (hasOnline) {
            onlinePaid += paidAmount;
            onlineCount++;
          }
          
          // Check if booking is in current month (based on payment date or checkin date)
          let paymentDate = null;
          if (bookingPayments.length > 0) {
            const latestPayment = bookingPayments.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            paymentDate = new Date(latestPayment.date);
          } else {
            paymentDate = new Date(booking.checkin);
          }
          
          if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
            thisMonthPaid += paidAmount;
          }
          
          // Room type breakdown for paid bookings
          const roomLower = booking.room.toLowerCase();
          if (roomLower.includes("normal")) roomBreakdown.Normal += paidAmount;
          else if (roomLower.includes("deluxe")) roomBreakdown.Deluxe += paidAmount;
          else if (roomLower.includes("suite")) roomBreakdown.Suite += paidAmount;
          else {
            const match = booking.room.match(/\d+/);
            if (match) {
              const roomNum = parseInt(match[0]);
              if (roomNum >= 101 && roomNum <= 199) roomBreakdown.Normal += paidAmount;
              else if (roomNum >= 201 && roomNum <= 299) roomBreakdown.Deluxe += paidAmount;
              else if (roomNum >= 301 && roomNum <= 399) roomBreakdown.Suite += paidAmount;
            }
          }
        }
      }
    });
    
    // Simple monthly trend based on payment dates (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'short' });
      let monthTotal = 0;
      
      bookings.forEach(booking => {
        const bookingPayments = paymentsData[booking.id] || [];
        const hasPayment = hasRealPayment(bookingPayments);
        
        if (hasPayment) {
          // Use payment date for trend
          bookingPayments.forEach(payment => {
            const paymentDate = new Date(payment.date);
            if (paymentDate.getMonth() === d.getMonth() && paymentDate.getFullYear() === d.getFullYear()) {
              monthTotal += parseFloat(payment.amount) || 0;
            }
          });
        }
      });
      monthlyTrend.push({ month: monthName, amount: monthTotal });
    }
    
    return { 
      totalPaid, 
      thisMonthPaid, 
      totalExpected, 
      paidCount, 
      expectedCount, 
      roomBreakdown, 
      monthlyTrend,
      onlinePaid,
      offlinePaid,
      onlineCount,
      offlineCount
    };
  };
  
  const earnings = getEarningsData();
  const maxMonthlyAmount = Math.max(...earnings.monthlyTrend.map(m => m.amount), 1);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-sm border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Revenue Analytics</h2>
          <p className="text-gray-400">Track your hotel earnings and financial insights</p>
        </div>
        <div className="bg-purple-500/20 px-4 py-2 rounded-full">
          <p className="text-purple-300 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
      
      {/* Payment Method Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm mb-1">Online Payments (eSewa)</p>
              <h3 className="text-3xl font-bold text-white">Rs. {earnings.onlinePaid.toFixed(2)}</h3>
              <p className="text-gray-500 text-xs mt-2">{earnings.onlineCount} transactions</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-xl">
              <FaChartLine className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm mb-1">Offline Payments (Reception)</p>
              <h3 className="text-3xl font-bold text-white">Rs. {earnings.offlinePaid.toFixed(2)}</h3>
              <p className="text-gray-500 text-xs mt-2">{earnings.offlineCount} transactions</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <FaWallet className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <EarningsCard 
          title="Total Paid Revenue" 
          value={`Rs. ${earnings.totalPaid.toFixed(2)}`} 
          icon={FaWallet}
          subtitle={`From ${earnings.paidCount} completed bookings`}
        />
        <EarningsCard 
          title="This Month's Earnings" 
          value={`Rs. ${earnings.thisMonthPaid.toFixed(2)}`} 
          icon={FaCalendarAlt}
          subtitle="Based on payment date"
        />
        <EarningsCard 
          title="Expected Revenue" 
          value={`Rs. ${earnings.totalExpected.toFixed(2)}`} 
          icon={FaBuilding}
          subtitle={`From ${earnings.expectedCount} total bookings`}
        />
        <EarningsCard 
          title="Avg. Booking Value" 
          value={`Rs. ${(earnings.totalPaid / (earnings.paidCount || 1)).toFixed(2)}`} 
          icon={FaDollarSign}
          subtitle="Per completed stay"
        />
      </div>
      
      {/* Room Type Breakdown & Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FaBuilding className="text-purple-400" />
            Earnings by Room Type
          </h3>
          <div className="space-y-4">
            {Object.entries(earnings.roomBreakdown).map(([type, amount]) => (
              <div key={type} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{type}</span>
                  <span className="text-white font-medium">Rs. {amount.toFixed(2)}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${earnings.totalPaid ? (amount / earnings.totalPaid) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FaChartLine className="text-purple-400" />
            Monthly Revenue Trend (Based on Payment Date)
          </h3>
          <div className="space-y-3">
            {earnings.monthlyTrend.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{item.month}</span>
                  <span className="text-white font-medium">Rs. {item.amount.toFixed(2)}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(item.amount / maxMonthlyAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Recent Paid Bookings (with actual payments) */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FaCheckCircle className="text-green-400" />
          Recent Completed Payments
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Customer</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Room</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Payment Method</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Payment Date</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings
                .filter(b => hasRealPayment(paymentsData[b.id]))
                .sort((a, b) => {
                  const dateA = paymentsData[a.id]?.sort((x, y) => new Date(y.date) - new Date(x.date))[0]?.date;
                  const dateB = paymentsData[b.id]?.sort((x, y) => new Date(y.date) - new Date(x.date))[0]?.date;
                  return new Date(dateB) - new Date(dateA);
                })
                .slice(0, 5)
                .map(booking => {
                  const bookingPayments = paymentsData[booking.id] || [];
                  const paidAmount = getPaidAmountFromPayments(bookingPayments);
                  const latestPayment = bookingPayments.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                  const paymentMethod = latestPayment?.service?.toLowerCase().includes("esewa") ? "eSewa Online" : "Offline (Reception)";
                  
                  return (
                    <tr key={booking.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-2 text-white">{booking.name}</td>
                      <td className="px-4 py-2 text-gray-300">{booking.room}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          paymentMethod.includes("Online") ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-300">{latestPayment ? formatDateTime(latestPayment.date) : "-"}</td>
                      <td className="px-4 py-2 text-green-400 font-medium">Rs. {paidAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              {bookings.filter(b => hasRealPayment(paymentsData[b.id])).length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-400">No completed payments yet</td>
                </tr>
              )}
            </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}