'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaStar, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaUtensils,
  FaDumbbell, FaSwimmer, FaWifi, FaArrowLeft, FaCalendarAlt,
  FaUsers, FaCheckCircle, FaSpinner, FaParking, FaConciergeBell,
  FaShuttleVan, FaBan, FaSnowflake, FaBath, FaSearch, FaInfoCircle,
  FaShieldAlt, FaClock, FaSmoking, FaPaw, FaCreditCard, FaChevronRight,
  FaBed, FaCoffee, FaTv, FaHotTub, FaWind, FaChild, FaWheelchair,
  FaCocktail, FaSpa, FaPlane, FaDog, FaHeart, FaRegHeart, FaShareAlt,
  FaChevronLeft, FaTag, FaDoorOpen, FaDoorClosed, FaLock, FaHotel,
  FaFilter, FaPlus, FaMap, FaExternalLinkAlt,
  FaTimes, FaShower, FaSwimmingPool,
  FaChevronDown, FaChevronUp, FaExclamationCircle, FaDirections, FaRoute, FaCopy, FaLocationArrow,
  FaPause, FaPlay, FaCity, FaDesktop, FaUmbrellaBeach
} from 'react-icons/fa';
import guestApi from '../utils/guestApi';

/* ══════════════════════════════════════════════════════════════════════
   SHARED HELPERS
══════════════════════════════════════════════════════════════════════ */
const FALLBACK_IMGS = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80',
  'https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=1200&q=80',
];

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-1">
    {[...Array(5)].map((_, i) => (
      <FaStar key={i} className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`} />
    ))}
  </div>
);

const formatUSD = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

const extractRoomNumber = (roomStr) => {
  if (!roomStr) return null;
  const match = roomStr.toString().match(/\d+/);
  return match ? parseInt(match[0]) : null;
};

const mapRoomTypeDisplay = (type) => {
  const lower = type?.toLowerCase();
  if (lower === 'standard') return 'Normal';
  if (lower === 'deluxe') return 'Deluxe';
  if (lower === 'suite') return 'Suite';
  return type || 'Room';
};

/* ══════════════════════════════════════════════════════════════════════
   ROOM AMENITIES CONFIG (fallback)
══════════════════════════════════════════════════════════════════════ */
const roomAmenities = {
  normal: {
    name: 'Normal Room', priceRange: '$50–80',
    amenities: [
      { icon: FaWifi, name: 'Free High-Speed WiFi' }, { icon: FaTv, name: '40-inch Smart TV' },
      { icon: FaCoffee, name: 'Coffee/Tea Maker' }, { icon: FaSnowflake, name: 'Air Conditioning' },
      { icon: FaShower, name: 'Private Bathroom' }, { icon: FaBed, name: 'Comfortable Queen Bed' },
    ],
    facilities: [
      { icon: FaParking, name: 'Free Parking' }, { icon: FaConciergeBell, name: '24/7 Room Service' },
      { icon: FaUtensils, name: 'Complimentary Breakfast' },
    ],
    color: 'from-blue-500 to-cyan-500',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
  },
  deluxe: {
    name: 'Deluxe Room', priceRange: '$85–130',
    amenities: [
      { icon: FaWifi, name: 'Free High-Speed WiFi' }, { icon: FaTv, name: '55-inch 4K Smart TV' },
      { icon: FaCoffee, name: 'Premium Coffee Machine' }, { icon: FaSnowflake, name: 'Central AC' },
      { icon: FaShower, name: 'Luxury Bathroom' }, { icon: FaBed, name: 'King Size Bed' },
      { icon: FaUtensils, name: 'Mini Bar' },
    ],
    facilities: [
      { icon: FaParking, name: 'Reserved Parking' }, { icon: FaConciergeBell, name: '24/7 Concierge' },
      { icon: FaUtensils, name: 'Breakfast Buffet' }, { icon: FaSwimmingPool, name: 'Pool Access' },
      { icon: FaDumbbell, name: 'Gym Access' },
    ],
    color: 'from-purple-500 to-pink-500',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
  },
  suite: {
    name: 'Suite Room', priceRange: '$150–200',
    amenities: [
      { icon: FaWifi, name: 'Ultra Fast WiFi' }, { icon: FaTv, name: '65-inch OLED TV' },
      { icon: FaCoffee, name: 'Espresso Machine' }, { icon: FaSnowflake, name: 'Climate Control' },
      { icon: FaShower, name: 'Spa Bathroom' }, { icon: FaBed, name: 'Super King Bed' },
      { icon: FaUtensils, name: 'Stocked Mini Bar' }, { icon: FaConciergeBell, name: 'Butler Service' },
    ],
    facilities: [
      { icon: FaParking, name: 'VIP Parking' }, { icon: FaConciergeBell, name: 'Personal Butler' },
      { icon: FaUtensils, name: 'Gourmet Breakfast' }, { icon: FaSwimmingPool, name: 'Private Pool' },
      { icon: FaDumbbell, name: 'Personal Gym' },
    ],
    color: 'from-orange-500 to-red-500',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
  },
};

const SUGGESTED_QUESTIONS = [
  { emoji: '🏨', text: 'How many rooms are available right now?' },
  { emoji: '💰', text: 'What is the cheapest available room?' },
  { emoji: '👑', text: 'Which suite rooms are free today?' },
  { emoji: '📊', text: 'What is the current occupancy rate?' },
  { emoji: '🛏️', text: 'Compare Normal vs Deluxe rooms' },
  { emoji: '⏰', text: 'Who is checking out soon?' },
  { emoji: '💡', text: 'Which room should I book for 3 nights?' },
  { emoji: '🏷️', text: 'Show me all room prices and amenities' },
  { emoji: '🔢', text: 'How many rooms are currently booked?' },
  { emoji: '🌟', text: "What's the best value room right now?" },
  { emoji: '🛎️', text: 'Are all deluxe rooms occupied?' },
  { emoji: '📅', text: 'Which rooms will be free in 2 days?' },
];

/* ══════════════════════════════════════════════════════════════════════
   CALENDAR DATE TIME PICKER (unchanged)
══════════════════════════════════════════════════════════════════════ */
function CalendarDateTimePicker({ value, onChange, label, error, minDate }) {
  const [showPicker, setShowPicker] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  const [selectedDate, setSelectedDate] = useState(() => value ? new Date(value) : null);
  const [selectedTime, setSelectedTime] = useState(() => {
    if (value) {
      const d = new Date(value);
      return { h: d.getHours(), m: d.getMinutes() };
    }
    return { h: 14, m: 0 };
  });
  const pickerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setSelectedDate(d);
      setViewDate(d);
      setSelectedTime({ h: d.getHours(), m: d.getMinutes() });
    }
  }, [value]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleDayClick = (day) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, selectedTime.h, selectedTime.m);
    setSelectedDate(d);
    const pad = n => String(n).padStart(2, '0');
    const str = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(selectedTime.h)}:${pad(selectedTime.m)}`;
    onChange({ target: { value: str } });
  };

  const handleTimeChange = (field, val) => {
    const newTime = { ...selectedTime, [field]: parseInt(val) };
    setSelectedTime(newTime);
    if (selectedDate) {
      const d = new Date(selectedDate);
      d.setHours(newTime.h, newTime.m);
      const pad = n => String(n).padStart(2, '0');
      const str = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(newTime.h)}:${pad(newTime.m)}`;
      onChange({ target: { value: str } });
    }
  };

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const today = new Date(); today.setHours(0,0,0,0);
  const formatDisplay = () => {
    if (!selectedDate) return '';
    const pad = n => String(n).padStart(2,'0');
    return `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()].slice(0,3)} ${selectedDate.getFullYear()} ${pad(selectedTime.h)}:${pad(selectedTime.m)}`;
  };
  const isDateDisabled = (day) => {
    if (!minDate) return false;
    const d = new Date(year, month, day);
    const min = new Date(minDate);
    min.setHours(0,0,0,0);
    return d < min;
  };
  const isSelected = (day) => selectedDate && selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day;
  const isToday = (day) => {
    const d = new Date(year, month, day);
    return d.toDateString() === today.toDateString();
  };

  return (
    <div className="relative" ref={pickerRef}>
      <label className="block text-xs font-medium text-gray-300 mb-1">{label}</label>
      <button type="button" onClick={() => setShowPicker(v => !v)}
        className={`w-full pl-10 pr-3 py-2.5 bg-white/5 backdrop-blur-sm border rounded-xl text-left transition-all duration-200 focus:outline-none ${error ? 'border-red-500' : 'border-white/20 focus:border-purple-500'}`}>
        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
        {selectedDate ? <span className="text-white text-sm">{formatDisplay()}</span> : <span className="text-gray-400 text-sm">Select date & time</span>}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      {showPicker && (
        <div className="absolute z-[9999] mt-2 w-72 bg-gray-900 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp" style={{ left: 0, top: '100%' }}>
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10">
            <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition"><FaChevronLeft className="text-xs" /></button>
            <span className="text-white font-semibold text-sm">{monthNames[month]} {year}</span>
            <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition"><FaChevronRight className="text-xs" /></button>
          </div>
          <div className="grid grid-cols-7 px-3 pt-2">
            {dayNames.map(d => <div key={d} className="text-center text-[10px] font-semibold text-gray-500 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i+1;
              const disabled = isDateDisabled(day);
              const selected = isSelected(day);
              const todayMark = isToday(day);
              return (
                <button key={day} type="button" disabled={disabled} onClick={() => handleDayClick(day)}
                  className={`w-8 h-8 mx-auto rounded-lg text-xs font-medium transition-all duration-150
                    ${disabled ? 'text-gray-700 cursor-not-allowed' : 'hover:bg-purple-500/30 cursor-pointer'}
                    ${selected ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' : ''}
                    ${todayMark && !selected ? 'text-purple-400 ring-1 ring-purple-500/50' : ''}
                    ${!selected && !disabled ? 'text-gray-300' : ''}`}>
                  {day}
                </button>
              );
            })}
          </div>
          <div className="border-t border-white/10 px-4 py-3 bg-black/20">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><FaClock className="text-purple-400 text-[10px]" /> Select time</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 block mb-1">Hour</label>
                <select value={selectedTime.h} onChange={e => handleTimeChange('h', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500">
                  {Array.from({ length: 24 }).map((_, h) => <option key={h} value={h} className="bg-gray-900">{String(h).padStart(2,'0')}:00</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 block mb-1">Minute</label>
                <select value={selectedTime.m} onChange={e => handleTimeChange('m', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500">
                  {[0,15,30,45].map(m => <option key={m} value={m} className="bg-gray-900">:{String(m).padStart(2,'0')}</option>)}
                </select>
              </div>
              <button type="button" onClick={() => setShowPicker(false)} className="mt-4 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-lg font-semibold hover:opacity-90 transition">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════
   ROOM BOOKING POPUP - NO AI ASSISTANT
══════════════════════════════════════════════════════════════════════ */
function RoomBookingPopup({ hotelId, hotel, room, bookings, onBookingSuccess, setAllRooms, onClose }) {
  const getInitialRoomValue = () => {
    if (!room) return '';
    const type = room.room_type_display || room.type || 'Room';
    return `${room.number} / ${type}`;
  };

  const getInitialRoomType = () => {
    const type = (room?.internal_type || room?.internalType || room?.room_type_display || room?.type || '').toLowerCase();
    if (type.includes('deluxe')) return 'deluxe';
    if (type.includes('suite')) return 'suite';
    return 'normal';
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    room: getInitialRoomValue(),
    days: '',
    checkin: '',
    checkout: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(getInitialRoomType());
  const [overlapError, setOverlapError] = useState('');

  const selectedRoomNumber = extractRoomNumber(formData.room);

  const getRoomStatusForRoom = useCallback((roomNumber) => {
    const now = new Date();
    const activeBooking = bookings.find(b => {
      if (!b.room) return false;
      const extracted = extractRoomNumber(b.room);
      if (extracted !== roomNumber) return false;
      const checkIn = new Date(b.check_in);
      const checkOut = b.check_out ? new Date(b.check_out) : null;
      if (checkOut && now >= checkOut) return false;
      return now >= checkIn;
    });
    if (activeBooking) return 'occupied';

    const futureBooking = bookings.find(b => {
      if (!b.room) return false;
      const extracted = extractRoomNumber(b.room);
      if (extracted !== roomNumber) return false;
      const checkIn = new Date(b.check_in);
      return checkIn > now;
    });
    return futureBooking ? 'booked' : 'available';
  }, [bookings]);

  const selectedRoomStatus = selectedRoomNumber ? getRoomStatusForRoom(selectedRoomNumber) : 'available';

  const handleRoomChange = (value) => {
    setFormData(p => ({ ...p, room: value }));
    const lower = value.toLowerCase();
    if (lower.includes('deluxe')) setSelectedRoomType('deluxe');
    else if (lower.includes('suite')) setSelectedRoomType('suite');
    else setSelectedRoomType('normal');
  };

  const hasOverlappingBooking = useCallback(() => {
    if (!formData.email || !formData.checkin || !formData.checkout) return false;
    const newCheckIn = new Date(formData.checkin);
    const newCheckOut = new Date(formData.checkout);
    const guestBookings = bookings.filter(b => b.email?.toLowerCase() === formData.email.toLowerCase());
    return guestBookings.some(b => {
      const existingCheckIn = new Date(b.check_in);
      const existingCheckOut = new Date(b.check_out);
      return newCheckIn < existingCheckOut && newCheckOut > existingCheckIn;
    });
  }, [formData.email, formData.checkin, formData.checkout, bookings]);

  const validateForm = () => {
    const e = {};
    setOverlapError('');
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email address';
    if (!formData.contact.trim()) e.contact = 'Contact is required';
    if (!formData.room.trim()) e.room = 'Room is required';
    if (!formData.checkin) e.checkin = 'Check-in date is required';
    if (!formData.checkout) e.checkout = 'Check-out date is required';
    if (formData.checkin && formData.checkout && new Date(formData.checkin) >= new Date(formData.checkout)) {
      e.checkout = 'Check-out must be after check-in';
    }
    if (!e.email && !e.checkin && !e.checkout && hasOverlappingBooking()) {
      setOverlapError('Cannot Do Another Booking for Same Date');
      e.overlap = 'You already have a booking that overlaps with these dates.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const priceInfo = useMemo(() => {
    const unitPrice = parseFloat(room?.price_per_night || room?.price || 0);
    if (!unitPrice) return null;

    let days = 0;
    if (formData.checkin && formData.checkout) {
      const ms = new Date(formData.checkout) - new Date(formData.checkin);
      if (ms > 0) days = Math.max(1, Math.round(ms / 86400000));
    }
    if (!days && formData.days) days = Number(formData.days);
    if (!days || days < 1) return null;

    const rawTotal = days * unitPrice;
    const discount = days >= 3 ? 0.1 : 0;
    const total = rawTotal * (1 - discount);
    return {
      unit: unitPrice,
      days,
      rawTotal,
      total,
      discount: discount > 0,
      formatted: discount
        ? `${formatUSD(unitPrice)} × ${days} night${days > 1 ? 's' : ''} − 10% = ${formatUSD(total)}`
        : `${formatUSD(unitPrice)} × ${days} night${days > 1 ? 's' : ''} = ${formatUSD(total)}`,
    };
  }, [room, formData.checkin, formData.checkout, formData.days]);

  const derivedDays = useMemo(() => {
    if (formData.checkin && formData.checkout) {
      const ms = new Date(formData.checkout) - new Date(formData.checkin);
      if (ms > 0) return Math.max(1, Math.round(ms / 86400000));
    }
    return formData.days || '';
  }, [formData.checkin, formData.checkout, formData.days]);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateForm()) return;

    let days = Number(formData.days);
    if (formData.checkin && formData.checkout) {
      const ms = new Date(formData.checkout) - new Date(formData.checkin);
      if (ms > 0) days = Math.max(1, Math.round(ms / 86400000));
    }

    setSubmitting(true);
    try {
      await guestApi.post('/manage-bookings/', {
        ...formData,
        days,
        checkin: new Date(formData.checkin).toISOString(),
        checkout: new Date(formData.checkout).toISOString(),
        status: 'Booked',
        hotel: hotelId,
      });

      setShowSuccess(true);

      const refreshed = await guestApi.get(`/hotels/${hotelId}/guest-bookings/`);
      const newBookings = refreshed.data.bookings || [];
      if (onBookingSuccess) onBookingSuccess(newBookings);

      try {
        const refreshedRooms = await guestApi.get(`/hotels/${hotelId}/guest-rooms/`);
        const rawRooms = refreshedRooms.data.rooms || [];
        const updatedRooms = rawRooms.map(r => {
          const lowerType = r.room_type?.toLowerCase();
          let internalType = 'normal';
          if (lowerType === 'standard' || lowerType === 'normal') internalType = 'normal';
          else if (lowerType === 'deluxe') internalType = 'deluxe';
          else if (lowerType === 'suite') internalType = 'suite';
          return {
            number: r.room_number,
            type: mapRoomTypeDisplay(r.room_type),
            internalType,
            price: r.price_per_night,
          };
        });
        if (setAllRooms) setAllRooms(updatedRooms);
      } catch {}

      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      alert('Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (field) => `w-full pl-10 pr-3 py-2.5 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all duration-200 ${errors[field] ? 'border-red-500' : 'border-white/20'}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeInUp" onClick={onClose}>
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500/40 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
          <FaTimes />
        </button>

        <div className="mb-5 pr-10">
          <h2 className="text-2xl font-bold text-white mb-1">Book Your Stay</h2>
          <p className="text-gray-400 text-sm">{hotel?.name || 'Selected Hotel'} · Room {room?.number}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              Guest Information
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Full Name *</label>
                <div className="relative">
                  <FaUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input type="text" value={formData.name} placeholder="John Doe" onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className={inputCls('name')} />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Email *</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input type="email" value={formData.email} placeholder="john@example.com" onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className={inputCls('email')} />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Contact Number *</label>
                <div className="relative">
                  <FaPhoneAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input type="tel" value={formData.contact} placeholder="+977 98XXXXXXXX" onChange={e => setFormData(p => ({ ...p, contact: e.target.value }))} className={inputCls('contact')} />
                </div>
                {errors.contact && <p className="text-red-400 text-xs mt-1">{errors.contact}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Room *</label>
                <div className="relative">
                  <FaDoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input type="text" value={formData.room} placeholder="101 / Normal / Deluxe / Suite" onChange={e => handleRoomChange(e.target.value)} className={inputCls('room')} />
                </div>
                {errors.room && <p className="text-red-400 text-xs mt-1">{errors.room}</p>}
                {selectedRoomStatus !== 'available' && (
                  <p className="text-amber-400 text-xs mt-1">This room is currently {selectedRoomStatus}. Please check date availability before booking.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-white/10">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              Stay Details
            </h3>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Number of Days <span className="text-gray-500 ml-1">(auto-calc from dates)</span></label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input type="number" min="1" value={derivedDays} placeholder="2" onChange={e => setFormData(p => ({ ...p, days: e.target.value }))} className={inputCls('days')} />
              </div>
            </div>

            <CalendarDateTimePicker label="Check-in Date & Time *" value={formData.checkin} onChange={e => setFormData(p => ({ ...p, checkin: e.target.value }))} error={errors.checkin} />
            <CalendarDateTimePicker label="Check-out Date & Time *" value={formData.checkout} onChange={e => setFormData(p => ({ ...p, checkout: e.target.value }))} error={errors.checkout} minDate={formData.checkin ? formData.checkin.split('T')[0] : undefined} />
          </div>

          {priceInfo && (
            <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/50 animate-fadeInUp">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-white font-semibold text-sm">Total Price</p>
                  <p className="text-xs text-gray-300">{priceInfo.formatted}</p>
                  {priceInfo.discount && <p className="text-xs text-green-400 font-semibold">🎉 10% discount for 3+ nights!</p>}
                </div>
                <div className="text-right">
                  {priceInfo.discount && <p className="text-xs text-gray-400 line-through">{formatUSD(priceInfo.rawTotal)}</p>}
                  <p className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{formatUSD(priceInfo.total)}</p>
                </div>
              </div>
            </div>
          )}

          {selectedRoomType && roomAmenities[selectedRoomType] && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 animate-fadeInUp">
              <div className={`h-0.5 w-12 rounded-full bg-gradient-to-r ${roomAmenities[selectedRoomType].color} mb-2`} />
              <p className="text-xs font-semibold text-white mb-2">{roomAmenities[selectedRoomType].name} — {roomAmenities[selectedRoomType].priceRange}/night</p>
              <div className="grid grid-cols-2 gap-1">
                {roomAmenities[selectedRoomType].amenities.slice(0, 4).map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-300">
                    <a.icon className="text-purple-400 text-[10px] flex-shrink-0" />
                    <span>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {overlapError && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 animate-fadeInUp">
              <FaExclamationCircle className="text-red-400 text-lg" />
              <div>
                <p className="text-red-400 font-semibold text-sm">{overlapError}</p>
                <p className="text-red-300 text-xs">You already have a booking for this period. Please choose different dates.</p>
              </div>
            </div>
          )}

          <button type="submit" disabled={submitting} className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
            {submitting ? <><FaSpinner className="animate-spin text-sm" /> Creating Booking...</> : <><FaPlus className="text-sm" /> Create Booking</>}
          </button>
          <p className="text-xs text-gray-500 text-center">You won't be charged yet. Free cancellation available.</p>
        </form>

        {showSuccess && (
          <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3 animate-fadeInUp">
            <FaCheckCircle className="text-green-400 text-lg" />
            <div>
              <p className="text-green-400 font-semibold text-sm">Booking Created Successfully!</p>
              <p className="text-green-300 text-xs">Your booking has been added to the system.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   HOTEL MAP CARD (unchanged)
══════════════════════════════════════════════════════════════════════ */
const HotelMapCard = ({ hotel }) => {
  const [mapError, setMapError] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [directionsUrl, setDirectionsUrl] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const locationQuery = encodeURIComponent(hotel.location || hotel.name || 'Kathmandu, Nepal');
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${locationQuery}`;
  const score = hotel.review_score ? (hotel.review_score * 10 / 5).toFixed(1) : '8.5';
  const scoreLabel = parseFloat(score) >= 9 ? 'Excellent' : parseFloat(score) >= 8 ? 'Very Good' : 'Good';
  const getFormattedLocation = () => { if (!hotel) return 'Location not available'; const l = hotel.location || '', n = hotel.name || ''; if (l && n) return `${l}, ${n}`; return l || n || 'Location not available'; };
  const copyLocationToClipboard = () => { navigator.clipboard.writeText(getFormattedLocation()).then(() => { setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }); };
  const getUserLocation = () => {
    setGettingLocation(true); setLocationError(null);
    if (!navigator.geolocation) { setLocationError("Geolocation not supported"); setGettingLocation(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setUserLocation(loc); setGettingLocation(false); setShowDirections(true); const dest = hotel?.latitude && hotel?.longitude ? `${hotel.latitude},${hotel.longitude}` : encodeURIComponent(hotel?.location || hotel?.name || ''); setDirectionsUrl(`https://www.google.com/maps/dir/?api=1&origin=${loc.lat},${loc.lng}&destination=${dest}&travelmode=driving`); },
      (err) => { const msgs = { 1: 'Please allow location access.', 2: 'Location unavailable.', 3: 'Request timed out.' }; setLocationError('Unable to get your location. ' + (msgs[err.code] || '')); setGettingLocation(false); setShowDirections(true); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  return (
    <>
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover-scale h-full flex flex-col">
        <div className="p-5 border-b border-white/10"><div className="flex items-start gap-4"><div className="flex-shrink-0 text-center"><div className="bg-blue-600 text-white text-2xl font-bold px-3 py-2 rounded-lg leading-none">{score}</div><div className="text-xs text-gray-400 mt-1">{scoreLabel}</div></div><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-300 mb-1">Top-rated guest experiences</p><p className="text-sm text-gray-200 italic leading-snug line-clamp-3">"Good location, clean property, good value. Nice front desk staff."</p><div className="flex items-center gap-2 mt-2"><div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">M</div><span className="text-xs text-gray-400">Mridu</span><span className="text-xs text-gray-500">🇺🇸 United States</span></div></div><FaChevronRight className="text-gray-500 text-sm flex-shrink-0" /></div><div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10"><span className="text-sm text-gray-300 font-medium">Staff</span><span className="bg-transparent border border-gray-500 text-gray-200 text-sm font-semibold px-2 py-0.5 rounded">8.2</span></div></div>
        <div className="relative flex-1 min-h-52 bg-gray-800"><div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow"><FaTag className="text-blue-600 text-[10px]" /> We Price Match</div><button onClick={getUserLocation} disabled={gettingLocation} className="absolute bottom-3 left-3 z-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg transition-all flex items-center gap-2">{gettingLocation ? <FaSpinner className="animate-spin text-xs" /> : <FaDirections className="text-xs" />} Get Directions</button><button onClick={copyLocationToClipboard} className="absolute bottom-3 left-36 z-10 bg-purple-500/80 hover:bg-purple-600 backdrop-blur-sm text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg transition-all flex items-center gap-2">{copySuccess ? <FaCheckCircle className="text-xs text-green-300" /> : <FaCopy className="text-xs" />}{copySuccess ? 'Copied!' : 'Copy Location'}</button><a href={googleMapsLink} target="_blank" rel="noopener noreferrer" className="absolute bottom-3 right-3 z-10 bg-white/90 hover:bg-white backdrop-blur-sm text-gray-800 text-xs font-semibold px-4 py-2 rounded-full shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"><FaMapMarkerAlt className="text-blue-600 text-xs" /> Show on map</a><iframe title="Hotel location map" width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src="https://www.openstreetmap.org/export/embed.html?bbox=85.20,27.60,85.50,27.82&layer=mapnik&marker=27.7172,85.3240" className="w-full h-full absolute inset-0" onError={() => setMapError(true)} style={{ filter: 'saturate(0.8) brightness(0.9)' }} />{mapError && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/90"><FaMap className="text-4xl text-gray-500 mb-2" /><p className="text-gray-400 text-sm">Map unavailable</p><a href={googleMapsLink} target="_blank" rel="noopener noreferrer" className="mt-2 text-purple-400 text-xs underline flex items-center gap-1">Open in Google Maps <FaExternalLinkAlt className="text-[10px]" /></a></div>)}</div>
        <div className="px-5 py-3 flex items-center gap-2 border-t border-white/10"><FaMapMarkerAlt className="text-purple-400 text-xs flex-shrink-0" /><span className="text-sm text-gray-300 truncate">{getFormattedLocation()}</span><a href={googleMapsLink} target="_blank" rel="noopener noreferrer" className="ml-auto text-purple-400 text-xs hover:underline flex-shrink-0 flex items-center gap-1">Directions <FaExternalLinkAlt className="text-[8px]" /></a></div>
      </div>
      {showDirections && (<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeInUp"><div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-purple-500/30"><div className="p-6"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-white flex items-center gap-2"><FaRoute className="text-purple-400" /> Directions to {hotel?.name}</h3><button onClick={() => { setShowDirections(false); setUserLocation(null); setDirectionsUrl(null); setLocationError(null); }} className="p-1 hover:bg-white/10 rounded-lg transition"><FaTimes className="text-gray-400" /></button></div>{locationError ? (<div className="space-y-4"><div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4"><p className="text-red-400 text-sm">{locationError}</p></div><button onClick={() => { setShowDirections(false); setLocationError(null); }} className="w-full px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition">Close</button></div>) : userLocation && directionsUrl ? (<div className="space-y-4"><div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"><p className="text-blue-400 text-sm flex items-center gap-2"><FaLocationArrow className="animate-pulse" /> Your location detected!</p><p className="text-gray-300 text-xs mt-1">Lat: {userLocation.lat.toFixed(6)}, Lng: {userLocation.lng.toFixed(6)}</p></div><div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4"><p className="text-purple-400 text-sm">Destination: {hotel?.name}</p><p className="text-gray-300 text-xs mt-1 font-mono">{getFormattedLocation()}</p></div><button onClick={() => window.open(directionsUrl, '_blank')} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"><FaDirections /> Open Google Maps Directions</button></div>) : (<div className="text-center py-8"><FaSpinner className="animate-spin text-purple-400 text-3xl mx-auto mb-3" /><p className="text-gray-300">Getting your location...</p></div>)}</div></div></div>)}
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   WEEKEND DEALS CAROUSEL (unchanged)
══════════════════════════════════════════════════════════════════════ */
const WeekendDealsCarousel = ({ onBook, favHotels, toggleFav, onViewDeal }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [favLocal, setFavLocal] = useState(favHotels || []);
  const visibleCount = 4;
  const getWeekendDates = () => {
    const today = new Date(); const day = today.getDay();
    const daysUntilFri = (5 - day + 7) % 7 || 7;
    const fri = new Date(today); fri.setDate(today.getDate() + daysUntilFri);
    const sun = new Date(fri); sun.setDate(fri.getDate() + 2);
    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(fri)} - ${fmt(sun)}`;
  };
  const WEEKEND_DEALS = [
    { id: 'wd1', name: 'Club Himalaya, by ACE Hotels Nagarkot', location: 'Nagarkot, Nepal', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80', score: '8.8', ratingLabel: 'Excellent', reviewCount: 235, isGenius: true, dealLabel: null, discount: 18, originalPrice: 12000, dealPrice: 9840 },
    { id: 'wd2', name: 'Hotel Ganesh Himal', location: 'Kathmandu, Nepal', img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80', score: '9.2', ratingLabel: 'Wonderful', reviewCount: 320, isGenius: true, dealLabel: 'Getaway Deal', discount: 22, originalPrice: 9500, dealPrice: 7410 },
    { id: 'wd3', name: 'Hotel Crown Himalayas', location: 'Pokhara, Nepal', img: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80', score: '9.7', ratingLabel: 'Exceptional', reviewCount: 56, isGenius: true, dealLabel: null, discount: 15, originalPrice: 18000, dealPrice: 15300 },
    { id: 'wd4', name: 'Hotel Himalayan Glacier', location: 'Nagarkot, Nepal', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80', score: '8.5', ratingLabel: 'Very Good', reviewCount: 141, isGenius: false, dealLabel: 'Getaway Deal', discount: 20, originalPrice: 8500, dealPrice: 6800 },
    { id: 'wd5', name: 'Fishtail Lodge Pokhara', location: 'Lakeside, Pokhara', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80', score: '9.0', ratingLabel: 'Superb', reviewCount: 198, isGenius: true, dealLabel: 'Getaway Deal', discount: 25, originalPrice: 14000, dealPrice: 10500 },
    { id: 'wd6', name: 'Tiger Tops Tharu Lodge', location: 'Chitwan, Nepal', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', score: '8.9', ratingLabel: 'Excellent', reviewCount: 87, isGenius: false, dealLabel: null, discount: 12, originalPrice: 22000, dealPrice: 19360 },
  ];
  const maxIdx = WEEKEND_DEALS.length - visibleCount;
  const prev = () => setCurrentIdx(i => Math.max(0, i - 1));
  const next = () => setCurrentIdx(i => Math.min(maxIdx, i + 1));
  const getScoreBadgeColor = score => { const n = parseFloat(score); if (n >= 9.0) return 'bg-blue-600'; if (n >= 8.5) return 'bg-green-600'; if (n >= 8.0) return 'bg-yellow-600'; return 'bg-orange-600'; };
  const handleToggleFav = id => { setFavLocal(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); if (toggleFav) toggleFav(id); };
  return (
    <div className="mb-8 animate-fadeInUp">
      <div className="flex items-center justify-between mb-3"><div><h2 className="text-xl font-bold text-white">Deals for the weekend</h2><p className="text-gray-400 text-sm mt-0.5">Save on stays for {getWeekendDates()}</p></div><div className="flex items-center gap-2"><button onClick={prev} disabled={currentIdx === 0} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"><FaChevronLeft className="text-xs" /></button><button onClick={next} disabled={currentIdx >= maxIdx} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"><FaChevronRight className="text-xs" /></button></div></div>
      <div className="relative overflow-hidden"><div className="flex gap-4 transition-transform duration-500 ease-in-out" style={{ transform: `translateX(calc(-${currentIdx} * (25% + 4px)))` }}>{WEEKEND_DEALS.map(deal => (<div key={deal.id} className="flex-none w-[calc(25%-12px)] min-w-[220px] bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover-scale group cursor-pointer" onClick={() => onViewDeal && onViewDeal(deal)}><div className="relative h-44 overflow-hidden bg-gray-800"><img src={deal.img} alt={deal.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={e => { e.target.src = FALLBACK_IMGS[0]; }} /><div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1"><FaTag className="text-[10px]" /> -{deal.discount}%</div><button onClick={e => { e.stopPropagation(); handleToggleFav(deal.id); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-md">{favLocal.includes(deal.id) ? <FaHeart className="text-xs text-red-500" /> : <FaRegHeart className="text-xs text-gray-700" />}</button></div><div className="p-3"><div className="flex items-center gap-1.5 mb-2 flex-wrap">{deal.isGenius && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">Genius</span>}{deal.dealLabel && <span className="bg-green-600/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-sm">{deal.dealLabel}</span>}</div><h3 className="text-white font-semibold text-sm leading-tight mb-1 line-clamp-2 group-hover:text-purple-300 transition-colors">{deal.name}</h3><div className="flex items-center gap-1 text-gray-400 text-xs mb-2"><FaMapMarkerAlt className="text-purple-400 text-[10px] flex-shrink-0" /><span className="line-clamp-1">{deal.location}</span></div><div className="flex items-center gap-2 mb-3"><span className={`${getScoreBadgeColor(deal.score)} text-white text-xs font-bold px-1.5 py-0.5 rounded`}>{deal.score}</span><span className="text-white text-xs font-medium">{deal.ratingLabel}</span><span className="text-gray-500 text-xs">· {deal.reviewCount} reviews</span></div><div className="mb-3"><span className="text-gray-500 text-xs line-through">NPR {deal.originalPrice.toLocaleString()}</span><div className="flex items-baseline gap-1"><span className="text-purple-300 font-bold text-base">NPR {deal.dealPrice.toLocaleString()}</span><span className="text-gray-400 text-xs">/night</span></div></div><button onClick={e => { e.stopPropagation(); onBook && onBook(deal); }} className="w-full py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-all">Book Now</button></div></div>))}</div></div>
      <div className="flex justify-center gap-1.5 mt-4">{Array.from({ length: maxIdx + 1 }).map((_, i) => (<button key={i} onClick={() => setCurrentIdx(i)} className={`rounded-full transition-all ${i === currentIdx ? 'w-4 h-1.5 bg-purple-400' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/40'}`} />))}</div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   SUGGESTED HOTELS CAROUSEL (unchanged)
══════════════════════════════════════════════════════════════════════ */
const SuggestedHotelsCarousel = ({ currentHotelId, onBookNow }) => {
  const [hotels, setHotels] = useState([]);
  const [hotelRooms, setHotelRooms] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const visibleCount = 4;
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await guestApi.get('/hotels/');
        const allHotels = (res.data.results || res.data || []).filter(h => h.id !== currentHotelId);
        setHotels(allHotels);
        const hotelsToFetch = allHotels.slice(0, 6);
        const roomsMap = {};
        await Promise.allSettled(hotelsToFetch.map(async hotel => {
          try {
            const roomsRes = await guestApi.get(`/hotels/${hotel.id}/guest-rooms/`);
            const rooms = roomsRes.data.rooms || [];
            roomsMap[hotel.id] = rooms.map(room => ({ id: room.room_number, room_type: room.room_type, price_per_night: room.price_per_night }));
          } catch { roomsMap[hotel.id] = []; }
        }));
        setHotelRooms(roomsMap);
      } catch {
        setHotels([
          { id: 101, name: 'Hotel Ganesh Himal', location: 'Thamel, Kathmandu', star_rating: 4, review_score: 4.5, image1: FALLBACK_IMGS[1], normal_price: 5000 },
          { id: 102, name: 'Fishtail Lodge', location: 'Lakeside, Pokhara', star_rating: 5, review_score: 4.8, image1: FALLBACK_IMGS[0], normal_price: 7000 },
          { id: 103, name: 'Tiger Mountain Lodge', location: 'Nagarkot, Nepal', star_rating: 4, review_score: 4.3, image1: FALLBACK_IMGS[2], normal_price: 6000 },
          { id: 104, name: 'Club Himalaya', location: 'Nagarkot, Nepal', star_rating: 5, review_score: 4.6, image1: FALLBACK_IMGS[3], normal_price: 8000 },
          { id: 105, name: 'Barahi Jungle Lodge', location: 'Chitwan, Nepal', star_rating: 4, review_score: 4.4, image1: FALLBACK_IMGS[0], normal_price: 5500 },
          { id: 106, name: 'Hotel Crown Himalayas', location: 'Pokhara, Nepal', star_rating: 3, review_score: 4.1, image1: FALLBACK_IMGS[1], normal_price: 4000 },
        ]);
        setHotelRooms({ 101: [{ id:1, room_type:'Standard' }, { id:2, room_type:'Deluxe' }, { id:3, room_type:'Suite' }], 102: [{ id:4, room_type:'Standard' }, { id:5, room_type:'Deluxe' }], 103: [{ id:6, room_type:'Standard' }, { id:7, room_type:'Suite' }], 104: [{ id:8, room_type:'Deluxe' }, { id:9, room_type:'Suite' }], 105: [{ id:10, room_type:'Standard' }, { id:11, room_type:'Deluxe' }, { id:12, room_type:'Suite' }], 106: [{ id:13, room_type:'Standard' }, { id:14, room_type:'Deluxe' }] });
      } finally { setLoading(false); }
    };
    fetchHotels();
  }, [currentHotelId]);
  if (loading) return <div className="mb-8"><h2 className="text-xl font-bold text-white mb-3">Suggested Hotels</h2><div className="flex gap-4">{[...Array(4)].map((_,i) => <div key={i} className="flex-none w-[calc(25%-12px)] min-w-[220px] bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse"><div className="h-44 bg-white/10" /><div className="p-3 space-y-2"><div className="h-3 bg-white/10 rounded w-3/4" /><div className="h-3 bg-white/10 rounded w-1/2" /></div></div>)}</div></div>;
  if (!hotels.length) return null;
  const maxIdx = Math.max(0, hotels.length - visibleCount);
  const prev = () => setCurrentIdx(i => Math.max(0, i - 1));
  const next = () => setCurrentIdx(i => Math.min(maxIdx, i + 1));
  const getScoreLabel = score => { const n = score * 10 / 5; if (n >= 9) return { label: 'Exceptional', color: 'bg-blue-600' }; if (n >= 8.5) return { label: 'Excellent', color: 'bg-green-600' }; if (n >= 8) return { label: 'Very Good', color: 'bg-yellow-600' }; return { label: 'Good', color: 'bg-orange-600' }; };
  const getStartingPrice = hotel => { const rooms = hotelRooms[hotel.id] || []; if (rooms.length > 0 && rooms[0].price_per_night) return Math.min(...rooms.map(r => r.price_per_night || Infinity)); return hotel.normal_price || 5000; };
  const getRoomTypeSummary = hotel => { const rooms = hotelRooms[hotel.id] || []; if (!rooms.length) return 'Multiple room types'; const types = [...new Set(rooms.map(r => r.room_type))]; if (types.length === 1) return `${types[0]} rooms`; if (types.length === 2) return `${types[0]} & ${types[1]}`; return `${types.length} room types`; };
  return (
    <div className="mb-8 animate-fadeInUp">
      <div className="flex items-center justify-between mb-3"><div><h2 className="text-xl font-bold text-white">Suggested Hotels</h2><p className="text-gray-400 text-sm mt-0.5">More great stays across Nepal</p></div><div className="flex items-center gap-2"><span className="text-gray-500 text-xs mr-2">{hotels.length} properties</span><button onClick={prev} disabled={currentIdx === 0} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"><FaChevronLeft className="text-xs" /></button><button onClick={next} disabled={currentIdx >= maxIdx} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"><FaChevronRight className="text-xs" /></button></div></div>
      <div className="relative overflow-hidden"><div className="flex gap-4 transition-transform duration-500 ease-in-out" style={{ transform: `translateX(calc(-${currentIdx} * (25% + 4px)))` }}>{hotels.map(hotel => { const scoreInfo = getScoreLabel(hotel.review_score || 4); const numericScore = ((hotel.review_score || 4) * 10 / 5).toFixed(1); const startingPrice = getStartingPrice(hotel); const roomSummary = getRoomTypeSummary(hotel); const totalRooms = (hotelRooms[hotel.id] || []).length; return (<div key={hotel.id} className="flex-none w-[calc(25%-12px)] min-w-[220px] bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover-scale group cursor-pointer" onClick={() => onBookNow && onBookNow(hotel)}><div className="relative h-44 overflow-hidden bg-gray-800"><img src={hotel.image1 || hotel.image || FALLBACK_IMGS[0]} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={e => { e.target.src = FALLBACK_IMGS[0]; }} /><div className="absolute top-2 left-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">{[...Array(Math.min(hotel.star_rating || 3, 5))].map((_, i) => <FaStar key={i} className="text-yellow-400 text-[9px]" />)}</div>{totalRooms > 0 && (<div className="absolute bottom-2 right-2 bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"><FaBed className="text-[9px]" /> {totalRooms} rooms</div>)}</div><div className="p-3"><h3 className="text-white font-semibold text-sm leading-tight mb-1 line-clamp-2 group-hover:text-purple-300 transition-colors">{hotel.name}</h3><div className="flex items-center gap-1 text-gray-400 text-xs mb-2"><FaMapMarkerAlt className="text-purple-400 text-[10px] flex-shrink-0" /><span className="line-clamp-1">{hotel.location || 'Nepal'}</span></div><div className="flex items-center gap-1 text-gray-500 text-xs mb-2"><FaHotel className="text-[10px] flex-shrink-0" /><span>{roomSummary}</span></div><div className="flex items-center gap-2 mb-3"><span className={`${scoreInfo.color} text-white text-xs font-bold px-1.5 py-0.5 rounded`}>{numericScore}</span><span className="text-white text-xs font-medium">{scoreInfo.label}</span></div><div className="mb-3"><div className="text-gray-500 text-[10px]">Starting from</div><div className="flex items-baseline gap-1"><span className="text-purple-300 font-bold text-base">{formatUSD(startingPrice)}</span><span className="text-gray-400 text-xs">/night</span></div></div><button onClick={e => { e.stopPropagation(); onBookNow && onBookNow(hotel); }} className="w-full py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white text-xs font-semibold transition-all hover:opacity-90">Book Now</button></div></div>);})}</div></div>
      {hotels.length > visibleCount && <div className="flex justify-center gap-1.5 mt-4">{Array.from({ length: maxIdx + 1 }).map((_, i) => (<button key={i} onClick={() => setCurrentIdx(i)} className={`rounded-full transition-all ${i === currentIdx ? 'w-4 h-1.5 bg-purple-400' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/40'}`} />))}</div>}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   GUEST ROOM STATUS PANEL (key fixed)
══════════════════════════════════════════════════════════════════════ */
const GuestRoomStatusPanel = ({ hotelId, hotel, bookings, allRooms, onBookingSuccess, setAllRooms }) => {
  const [roomFilter, setRoomFilter] = useState('all');
  const [roomsData, setRoomsData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [checkInMonth, setCheckInMonth] = useState(new Date().getMonth());
  const [checkInYear, setCheckInYear] = useState(new Date().getFullYear());
  const [checkOutMonth, setCheckOutMonth] = useState(new Date().getMonth());
  const [checkOutYear, setCheckOutYear] = useState(new Date().getFullYear());
  const pickerRefIn = useRef(null);
  const pickerRefOut = useRef(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingRoom, setBookingRoom] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const getImagesForRoom = (type, roomNumber) => {
    const images = {
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
    return images[type] || images.normal;
  };

  const getFacilitiesForType = (type) => {
    const base = ["WiFi", "Air Conditioning", "Flat-screen TV", "Mini Bar"];
    if (type === "deluxe") return [...base, "Bathtub", "City View", "Work Desk"];
    if (type === "suite") return [...base, "Jacuzzi", "Sea View", "Kitchenette", "Private Balcony"];
    return base;
  };

  const getDescriptionForType = (type) => {
    if (type === "normal") return "Comfortable room with modern amenities, perfect for business travelers.";
    if (type === "deluxe") return "Spacious deluxe room with premium furnishings and a stunning city view.";
    return "Luxury suite with separate living area, jacuzzi, and breathtaking sea view.";
  };

  useEffect(() => {
    if (allRooms && allRooms.length > 0) {
      const enriched = allRooms.map(r => ({
        ...r,
        room_type_display: r.type,
        internal_type: r.internalType,
        price_per_night: r.price,
        images: getImagesForRoom(r.internalType, r.number),
        facilities: getFacilitiesForType(r.internalType),
        description: getDescriptionForType(r.internalType),
      }));
      setRoomsData(enriched);
      setDataLoading(false);
    } else {
      const fetchRooms = async () => {
        if (!hotelId) return;
        setDataLoading(true);
        try {
          const roomsRes = await guestApi.get(`/hotels/${hotelId}/guest-rooms/`);
          const rawRooms = roomsRes.data.rooms || [];
          const rooms = rawRooms.map(r => {
            const lowerType = r.room_type?.toLowerCase();
            let internalType = 'normal';
            if (lowerType === 'standard' || lowerType === 'normal') internalType = 'normal';
            else if (lowerType === 'deluxe') internalType = 'deluxe';
            else if (lowerType === 'suite') internalType = 'suite';
            else internalType = 'normal';
            return {
              id: r.room_number,
              number: r.room_number,
              type: mapRoomTypeDisplay(r.room_type),
              internalType,
              price: r.price_per_night,
              images: getImagesForRoom(internalType, r.room_number),
              facilities: getFacilitiesForType(internalType),
              description: getDescriptionForType(internalType),
              room_type_display: mapRoomTypeDisplay(r.room_type),
              internal_type: internalType,
              price_per_night: r.price_per_night,
            };
          });
          setRoomsData(rooms);
        } catch (error) {
          console.error('Guest room panel error:', error);
          const demoRooms = [];
          for (let i = 1; i <= 20; i++) {
            const internalType = i <= 10 ? 'normal' : (i <= 16 ? 'deluxe' : 'suite');
            const displayType = internalType === 'normal' ? 'Normal' : (internalType === 'deluxe' ? 'Deluxe' : 'Suite');
            demoRooms.push({
              id: 100 + i,
              number: 100 + i,
              type: displayType,
              internalType,
              price: internalType === 'normal' ? 5000 : (internalType === 'deluxe' ? 8500 : 15000),
              images: getImagesForRoom(internalType, 100 + i),
              facilities: getFacilitiesForType(internalType),
              description: getDescriptionForType(internalType),
              room_type_display: displayType,
              internal_type: internalType,
              price_per_night: internalType === 'normal' ? 5000 : (internalType === 'deluxe' ? 8500 : 15000),
              capacity: internalType === 'normal' ? 2 : (internalType === 'deluxe' ? 3 : 4),
              bed_type: internalType === 'normal' ? 'Queen Bed' : (internalType === 'deluxe' ? 'King Bed' : 'Super King Bed'),
            });
          }
          setRoomsData(demoRooms);
        } finally { setDataLoading(false); }
      };
      fetchRooms();
    }
  }, [hotelId, allRooms]);

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

  const getCurrentRoomStatus = (roomNumber) => {
    const now = new Date();
    const booking = bookings.find(b => {
      if (!b.room) return false;
      const extracted = extractRoomNumber(b.room);
      if (extracted !== roomNumber) return false;
      const checkIn = new Date(b.check_in);
      const checkOut = new Date(b.check_out);
      return now >= checkIn && now < checkOut;
    });
    if (booking) return 'occupied';
    const futureBooking = bookings.find(b => {
      if (!b.room) return false;
      const extracted = extractRoomNumber(b.room);
      if (extracted !== roomNumber) return false;
      const checkIn = new Date(b.check_in);
      return checkIn > now;
    });
    return futureBooking ? 'booked' : 'available';
  };

  const getRoomStatusForDates = (roomNumber, checkInDate, checkOutDate) => {
    if (!checkInDate || !checkOutDate) return { status: getCurrentRoomStatus(roomNumber), booking: null };
    const conflicting = bookings.find(b => {
      if (!b.room) return false;
      const extracted = extractRoomNumber(b.room);
      if (extracted !== roomNumber) return false;
      const bci = new Date(b.check_in);
      const bco = new Date(b.check_out);
      const sci = new Date(checkInDate);
      const sco = new Date(checkOutDate);
      return sci < bco && sco > bci;
    });
    if (conflicting) {
      const now = new Date();
      const isOccupied = now >= new Date(conflicting.check_in) && now < new Date(conflicting.check_out);
      return { status: isOccupied ? 'occupied' : 'booked', booking: conflicting };
    }
    return { status: 'available', booking: null };
  };

  let filtered = roomsData;
  if (roomFilter !== 'all') {
    filtered = roomsData.filter(r =>
      r.room_type_display?.toLowerCase() === roomFilter.toLowerCase() ||
      r.internal_type === roomFilter
    );
  }

  let totalRooms = filtered.length;
  let availableCount = 0, occupiedCount = 0, bookedCount = 0;
  if (searched && checkIn && checkOut) {
    filtered.forEach(room => {
      const { status } = getRoomStatusForDates(room.number, checkIn, checkOut);
      if (status === 'available') availableCount++;
      else if (status === 'occupied') occupiedCount++;
      else bookedCount++;
    });
  } else {
    filtered.forEach(room => {
      const status = getCurrentRoomStatus(room.number);
      if (status === 'available') availableCount++;
      else if (status === 'occupied') occupiedCount++;
      else bookedCount++;
    });
  }
  const occupancyRate = totalRooms ? (((occupiedCount + bookedCount) / totalRooms) * 100).toFixed(1) : 0;

  const getStatusConfig = (status) => {
    switch(status){
      case 'occupied': return { label:'Occupied', bg:'bg-red-500/20', text:'text-red-400', icon:<FaDoorClosed />, cardBorder:'border-red-500/20' };
      case 'booked':   return { label:'Booked',   bg:'bg-amber-500/20', text:'text-amber-400', icon:<FaLock />, cardBorder:'border-amber-500/20' };
      default:         return { label:'Available', bg:'bg-green-500/20', text:'text-green-400', icon:<FaDoorOpen />, cardBorder:'border-green-500/20' };
    }
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : 'Select date';
  const handleCheckInSelect = (year, month, day) => { const formatted = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; setCheckIn(formatted); setSearched(false); setShowCheckInPicker(false); if (checkOut && new Date(formatted) >= new Date(checkOut)) setCheckOut(''); };
  const handleCheckOutSelect = (year, month, day) => { const formatted = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; setCheckOut(formatted); setSearched(false); setShowCheckOutPicker(false); };
  const handleSearch = async () => {
    if (!checkIn || !checkOut || !guests) {
      alert('Please select check-in date, check-out date, and number of guests');
      return;
    }
    setLoading(true);
    setSearched(true);
    setLoading(false);
  };

  const CalendarPicker = ({ type, selectedDate, onSelect, currentMonth, currentYear, setMonth, setYear, show, setShow }) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    const getDaysInMonth = (y,m) => new Date(y,m+1,0).getDate();
    const getFirstDayOfMonth = (y,m) => new Date(y,m,1).getDay();
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const prevMonth = () => { if (currentMonth===0) { setMonth(11); setYear(currentYear-1); } else setMonth(currentMonth-1); };
    const nextMonth = () => { if (currentMonth===11) { setMonth(0); setYear(currentYear+1); } else setMonth(currentMonth+1); };
    const isDateDisabled = (y,m,day) => { const d = new Date(y,m,day); if (d < today) return true; if (type === 'checkout' && checkIn) { const ci = new Date(checkIn); ci.setHours(0,0,0,0); return d <= ci; } return false; };
    const isSelected = (y,m,day) => { if (!selectedDate) return false; const s = new Date(selectedDate); return s.getFullYear()===y && s.getMonth()===m && s.getDate()===day; };
    const isToday = (y,m,day) => { const d = new Date(y,m,day); return d.toDateString() === today.toDateString(); };
    if (!show) return null;
    return (
      <div ref={type==='checkin'?pickerRefIn:pickerRefOut} className="absolute z-50 mt-1 bg-gray-900 border border-purple-500/40 rounded-xl shadow-2xl overflow-hidden" style={{ top:'100%', left:0, minWidth:'300px' }}>
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10"><button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition"><FaChevronLeft className="text-sm" /></button><span className="text-white font-semibold text-base">{monthNames[currentMonth]} {currentYear}</span><button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition"><FaChevronRight className="text-sm" /></button></div>
        <div className="grid grid-cols-7 px-3 pt-3">{dayNames.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>)}</div>
        <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">{Array.from({ length: firstDay }).map((_,i) => <div key={`e-${i}`} className="h-10" />)}{Array.from({ length: daysInMonth }).map((_,i) => { const day = i+1; const disabled = isDateDisabled(currentYear,currentMonth,day); const selected = isSelected(currentYear,currentMonth,day); const isTodayDate = isToday(currentYear,currentMonth,day); return (<button key={day} disabled={disabled} onClick={() => { onSelect(currentYear,currentMonth,day); setShow(false); }} className={`h-10 rounded-lg text-sm font-medium transition-all duration-150 ${disabled ? 'text-gray-700 cursor-not-allowed bg-transparent' : 'hover:bg-purple-500/30 cursor-pointer'} ${selected ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : ''} ${isTodayDate && !selected ? 'text-purple-400 ring-1 ring-purple-500/50' : ''} ${!selected && !disabled && !isTodayDate ? 'text-gray-300 hover:text-white' : ''}`}>{day}</button>);})}</div>
        <button onClick={() => setShow(false)} className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-medium transition border-t border-white/10">Close</button>
      </div>
    );
  };

  const calcTotalPrice = (checkin, checkout, pricePerNight) => {
    if (!checkin || !checkout || !pricePerNight) return null;
    const ms = new Date(checkout) - new Date(checkin);
    const days = Math.max(1, Math.round(ms / (1000*60*60*24)));
    return { days, total: days * parseFloat(pricePerNight) };
  };

  if (dataLoading && !roomsData.length) return <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"><div className="flex justify-center items-center min-h-[400px]"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"/><p className="text-gray-400">Loading rooms...</p></div></div></div>;

  return (
    <>
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <FaHotel className="text-purple-400" /> Room Status & Availability
          <span className="text-xs text-gray-400 ml-2">({roomsData.length} rooms total)</span>
        </h2>

        <div className="bg-black/40 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px] relative">
              <label className="block text-gray-400 text-sm mb-1"><FaCalendarAlt className="inline text-purple-400 mr-1" /> Check-in Date</label>
              <button onClick={() => { setShowCheckInPicker(!showCheckInPicker); setShowCheckOutPicker(false); }} className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-left hover:bg-black/70 transition-all flex justify-between">
                <span className={checkIn ? 'text-white' : 'text-gray-400'}>{formatDate(checkIn)}</span>
                <FaCalendarAlt className="text-purple-400" />
              </button>
              <CalendarPicker type="checkin" selectedDate={checkIn} onSelect={handleCheckInSelect} currentMonth={checkInMonth} currentYear={checkInYear} setMonth={setCheckInMonth} setYear={setCheckInYear} show={showCheckInPicker} setShow={setShowCheckInPicker} />
            </div>
            <div className="flex-1 min-w-[200px] relative">
              <label className="block text-gray-400 text-sm mb-1"><FaCalendarAlt className="inline text-purple-400 mr-1" /> Check-out Date</label>
              <button onClick={() => { if (!checkIn) { alert('Please select check-in date first'); return; } setShowCheckOutPicker(!showCheckOutPicker); setShowCheckInPicker(false); }} className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-left hover:bg-black/70 transition-all flex justify-between">
                <span className={checkOut ? 'text-white' : 'text-gray-400'}>{formatDate(checkOut)}</span>
                <FaCalendarAlt className="text-purple-400" />
              </button>
              <CalendarPicker type="checkout" selectedDate={checkOut} onSelect={handleCheckOutSelect} currentMonth={checkOutMonth} currentYear={checkOutYear} setMonth={setCheckOutMonth} setYear={setCheckOutYear} show={showCheckOutPicker} setShow={setShowCheckOutPicker} />
            </div>
            <div className="w-[130px]">
              <label className="block text-gray-400 text-sm mb-1"><FaUsers className="inline text-purple-400 mr-1" /> Guests</label>
              <input type="number" min="1" max="10" value={guests} onChange={e => { setGuests(parseInt(e.target.value) || 1); setSearched(false); }} className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white" />
            </div>
            <button onClick={handleSearch} disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50">
              {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />} Check Availability
            </button>
          </div>
        </div>

        {!searched ? (
          <div className="rounded-2xl border border-dashed border-purple-500/40 bg-purple-500/10 p-10 text-center animate-fadeInUp">
            <FaSearch className="text-4xl text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Search room availability</h3>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">
              Please select check-in date, check-out date, and number of guests, then click Check Availability to view all rooms with available, booked, and occupied status.
            </p>
          </div>
        ) : (
          <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Rooms', value: totalRooms, icon: FaBed, color: 'from-blue-500/20 to-blue-600/20', textCls: 'text-blue-300', iconCls: 'text-blue-400' },
            { label: 'Available', value: availableCount, icon: FaDoorOpen, color: 'from-green-500/20 to-green-600/20', textCls: 'text-green-300', iconCls: 'text-green-400' },
            { label: 'Occupied', value: occupiedCount, icon: FaDoorClosed, color: 'from-red-500/20 to-red-600/20', textCls: 'text-red-300', iconCls: 'text-red-400' },
            { label: 'Booked', value: bookedCount, icon: FaLock, color: 'from-amber-500/20 to-yellow-600/20', textCls: 'text-amber-300', iconCls: 'text-amber-400' }
          ].map(({ label, value, icon: Icon, color, textCls, iconCls }) => (
            <div key={label} className={`bg-gradient-to-br ${color} rounded-xl p-4 border border-white/20`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${textCls} mb-1`}>{label}</p>
                  <p className="text-3xl font-bold text-white">{value}</p>
                </div>
                <Icon className={`text-3xl ${iconCls}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <FaFilter className="text-purple-400" />
          <span className="text-sm text-gray-300">Filter by room type:</span>
          <div className="flex gap-3 flex-wrap">
            {['all', 'Normal', 'Deluxe', 'Suite'].map(type => (
              <button key={type} onClick={() => setRoomFilter(type === 'all' ? 'all' : type)}
                className={`px-4 py-2 rounded-lg transition-all ${roomFilter === (type === 'all' ? 'all' : type) ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                {type === 'all' ? 'All Rooms' : type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mb-4 text-xs">
          <span className="flex items-center gap-1 text-green-400"><FaDoorOpen /> Available — free to book</span>
          <span className="flex items-center gap-1 text-amber-400"><FaLock /> Booked — upcoming reservation</span>
          <span className="flex items-center gap-1 text-red-400"><FaDoorClosed /> Occupied — currently checked in</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map(room => {
            let status;
            if (searched && checkIn && checkOut) status = getRoomStatusForDates(room.number, checkIn, checkOut).status;
            else status = getCurrentRoomStatus(room.number);
            const cfg = getStatusConfig(status);
            const priceCalc = (status !== 'available' && searched && checkIn && checkOut) ? calcTotalPrice(checkIn, checkOut, room.price_per_night) : null;
            return (
              <div
                key={room.number}
                onClick={() => setSelectedRoom({ ...room, status, priceCalc })}
                className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-105 cursor-pointer ${cfg.cardBorder} bg-white/5 hover:bg-white/10`}
              >
                <button
                  type="button"
                  title="Book this room"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBookingRoom({ ...room, status, priceCalc });
                  }}
                  className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-all"
                >
                  <FaPlus className="text-xs" />
                </button>
                <div className="p-4 text-center">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${cfg.bg}`}>
                    {cfg.icon}
                  </div>
                  <div className="text-white font-bold text-lg">Room {room.number}</div>
                  <div className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </div>
                  <div className="text-white text-sm mt-2">Room Type: {room.room_type_display}</div>
                  <div className="text-gray-300 text-sm">Price / Night: {formatUSD(room.price_per_night)}</div>
                  {priceCalc && (
                    <div className="mt-2 text-[10px] text-gray-400">
                      {priceCalc.days} nights · Total {formatUSD(priceCalc.total)}
                    </div>
                  )}
                </div>
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${status === 'available' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : status === 'booked' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`} />
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <FaBed className="text-4xl mx-auto mb-2 opacity-50" />
            <p>No rooms found for the selected filter.</p>
          </div>
        )}

        <div className="mt-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-300">Occupancy Rate (booked + occupied)</span>
            <span className="text-sm font-semibold text-white">{occupancyRate}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%` }} />
          </div>
        </div>
          </>
        )}
      </div>

      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeInUp" onClick={() => setSelectedRoom(null)}>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-72 md:h-96">
              <img
                src={selectedRoom.images[currentImageIndex]}
                alt={`Room ${selectedRoom.number}`}
                className="w-full h-full object-cover rounded-t-2xl"
                onError={(e) => { e.target.src = FALLBACK_IMGS[0]; }}
              />
              <button onClick={() => setSelectedRoom(null)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition">
                <FaTimes />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-full px-3 py-1">
                <button onClick={() => setCurrentImageIndex(p => p === 0 ? selectedRoom.images.length - 1 : p - 1)} className="text-white hover:text-purple-400 transition p-1"><FaChevronLeft /></button>
                <span className="text-white text-sm px-2">{currentImageIndex + 1} / {selectedRoom.images.length}</span>
                <button onClick={() => setCurrentImageIndex(p => p === selectedRoom.images.length - 1 ? 0 : p + 1)} className="text-white hover:text-purple-400 transition p-1"><FaChevronRight /></button>
                <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} className="text-white hover:text-purple-400 transition p-1">{isAutoPlaying ? <FaPause /> : <FaPlay />}</button>
              </div>
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedRoom.status === 'available' ? 'bg-green-500 text-white' : selectedRoom.status === 'booked' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                  {selectedRoom.status === 'available' ? 'Available' : selectedRoom.status === 'booked' ? 'Booked' : 'Occupied'}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">Room {selectedRoom.number}</h3>
                  <p className="text-gray-300 mt-1 capitalize">{selectedRoom.room_type_display} Room</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Price per night</p>
                  <p className="text-2xl font-bold text-purple-400">{formatUSD(selectedRoom.price_per_night)}</p>
                  {selectedRoom.priceCalc && (
                    <p className="text-sm text-green-400 font-semibold mt-1">
                      {selectedRoom.priceCalc.days} nights · Total {formatUSD(selectedRoom.priceCalc.total)}
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
                      {facility === "WiFi" && <FaWifi className="text-purple-400" />}
                      {facility === "Air Conditioning" && <FaSnowflake className="text-purple-400" />}
                      {facility === "Flat-screen TV" && <FaTv className="text-purple-400" />}
                      {facility === "Mini Bar" && <FaCoffee className="text-purple-400" />}
                      {facility === "Bathtub" && <FaBath className="text-purple-400" />}
                      {facility === "City View" && <FaCity className="text-purple-400" />}
                      {facility === "Work Desk" && <FaDesktop className="text-purple-400" />}
                      {facility === "Jacuzzi" && <FaHotTub className="text-purple-400" />}
                      {facility === "Sea View" && <FaUmbrellaBeach className="text-purple-400" />}
                      {facility === "Kitchenette" && <FaUtensils className="text-purple-400" />}
                      {facility === "Private Balcony" && <FaUmbrellaBeach className="text-purple-400" />}
                      <span>{facility}</span>
                    </div>
                  ))}
                </div>
              </div>
              {selectedRoom.status !== 'available' && (() => {
                const booking = bookings.find(b => extractRoomNumber(b.room) === selectedRoom.number);
                if (!booking) return null;
                return (
                  <div className={`mb-4 rounded-lg p-3 space-y-1 ${selectedRoom.status === 'occupied' ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                    <p className={`text-sm font-semibold flex items-center gap-2 ${selectedRoom.status === 'occupied' ? 'text-red-400' : 'text-amber-400'}`}>
                      {selectedRoom.status === 'occupied' ? <><FaDoorClosed /> Currently Occupied</> : <><FaLock /> Upcoming Reservation</>}
                    </p>
                    <p className="text-gray-300 text-sm">Check-in: <span className="text-white">{new Date(booking.check_in).toLocaleString()}</span></p>
                    <p className="text-gray-300 text-sm">Check-out: <span className="text-white">{new Date(booking.check_out).toLocaleString()}</span></p>
                    {selectedRoom.priceCalc && <p className="text-sm font-bold text-blue-300">Stay: {selectedRoom.priceCalc.days} nights · Total {formatUSD(selectedRoom.priceCalc.total)}</p>}
                  </div>
                );
              })()}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setBookingRoom(selectedRoom);
                    setSelectedRoom(null);
                  }}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition flex items-center gap-2"
                >
                  <FaPlus className="text-xs" /> Book This Room
                </button>
                <button onClick={() => setSelectedRoom(null)} className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {bookingRoom && (
        <RoomBookingPopup
          hotelId={hotelId}
          hotel={hotel}
          room={bookingRoom}
          bookings={bookings}
          onBookingSuccess={onBookingSuccess}
          setAllRooms={setAllRooms}
          onClose={() => setBookingRoom(null)}
        />
      )}
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   MAIN HotelInfo – with auto‑sliding carousel for hotel images
══════════════════════════════════════════════════════════════════════ */
export default function HotelInfo({ id: propId } = {}) {
  const router = useRouter();
  const id = propId;
  const [hotel, setHotel] = useState(null);
  const [hotelImages, setHotelImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [autoSlideActive, setAutoSlideActive] = useState(true);
  const autoSlideIntervalRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews, setReviews] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [favHotels, setFavHotels] = useState([]);
  const overviewRef = useRef(null);
  const pricesRef = useRef(null);
  const facilitiesRef = useRef(null);
  const legalRef = useRef(null);
  const reviewsRef = useRef(null);
  const dealsRef = useRef(null);
  const [showToast, setShowToast] = useState(null);
  const [globalBookings, setGlobalBookings] = useState([]);
  const [globalRooms, setGlobalRooms] = useState([]);

  useEffect(() => { if (!id && typeof window !== 'undefined') router.push('/guest/dashboard'); }, [id, router]);

  const startAutoSlide = () => {
    if (autoSlideIntervalRef.current) clearInterval(autoSlideIntervalRef.current);
    if (!autoSlideActive || hotelImages.length <= 1) return;
    autoSlideIntervalRef.current = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % hotelImages.length);
    }, 4000);
  };
  const stopAutoSlide = () => {
    if (autoSlideIntervalRef.current) {
      clearInterval(autoSlideIntervalRef.current);
      autoSlideIntervalRef.current = null;
    }
  };
  const resetAutoSlide = () => {
    stopAutoSlide();
    startAutoSlide();
  };
  const toggleAutoSlide = () => {
    setAutoSlideActive(prev => !prev);
  };
  useEffect(() => {
    if (autoSlideActive && hotelImages.length > 1) {
      startAutoSlide();
    } else {
      stopAutoSlide();
    }
    return () => stopAutoSlide();
  }, [autoSlideActive, hotelImages.length]);

  const nextImage = () => {
    if (hotelImages.length === 0) return;
    setCurrentImage((currentImage + 1) % hotelImages.length);
    resetAutoSlide();
  };
  const prevImage = () => {
    if (hotelImages.length === 0) return;
    setCurrentImage((currentImage - 1 + hotelImages.length) % hotelImages.length);
    resetAutoSlide();
  };
  const goToImage = (idx) => {
    setCurrentImage(idx);
    resetAutoSlide();
  };

  useEffect(() => {
    const fetchHotelData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await guestApi.get(`/hotels/${id}/hprofile/`);
        const hotelData = response.data;
        setHotel(hotelData);
        const imgs = [hotelData.image1, hotelData.image2, hotelData.image3, hotelData.image4].filter(Boolean);
        setHotelImages(imgs.length ? imgs : FALLBACK_IMGS);
        try {
          const roomsRes = await guestApi.get(`/hotels/${id}/guest-rooms/`);
          const rooms = roomsRes.data.rooms || [];
          const mapped = rooms.map(r => ({ id: r.room_number, room_type: mapRoomTypeDisplay(r.room_type), price_per_night: r.price_per_night, capacity: r.capacity, amenities: r.amenities, bed_type: r.bed_type }));
          setRoomTypes(mapped);
        } catch { setRoomTypes([ { id:1, room_type:'Normal', price_per_night: hotelData.normal_price || 5000, capacity:2 }, { id:2, room_type:'Deluxe', price_per_night: hotelData.deluxe_price || 8000, capacity:3 }, { id:3, room_type:'Suite', price_per_night: hotelData.suite_price || 12000, capacity:4 } ]); }
        setReviews([
          { id:1, user:{ first_name:'Mridu', last_name:'' }, country:'United States', rating:8.0, comment:'Good location, clean property, good value.', created_at:'2024-12-15' },
          { id:2, user:{ first_name:'Sunny', last_name:'' }, country:'India', rating:9.2, comment:'Our stay was truly exceptional!', created_at:'2024-12-10' },
          { id:3, user:{ first_name:'Neeraj', last_name:'' }, country:'United States', rating:8.5, comment:'Very clean and well-maintained property.', created_at:'2024-12-05' },
          { id:4, user:{ first_name:'Priya', last_name:'' }, country:'Nepal', rating:7.8, comment:'Great hospitality and wonderful food.', created_at:'2024-11-28' }
        ]);
        const facilitiesList = [
          { name:'Free High-Speed WiFi', icon:FaWifi, available:true },
          { name:'Air Conditioning', icon:FaSnowflake, available:true },
          { name:'24/7 Room Service', icon:FaConciergeBell, available:true },
          { name:'Free Parking', icon:FaParking, available:true },
          { name:'Multi-Cuisine Restaurant', icon:FaUtensils, available:true },
          { name:'Swimming Pool', icon:FaSwimmer, available:hotelData.has_pool !== false },
          { name:'Fitness Center', icon:FaDumbbell, available:hotelData.has_gym !== false }
        ];
        setFacilities(facilitiesList);
        const bookingsRes = await guestApi.get(`/hotels/${id}/guest-bookings/`);
        setGlobalBookings(bookingsRes.data.bookings || []);
        const roomsRes = await guestApi.get(`/hotels/${id}/guest-rooms/`);
        const rawRooms = roomsRes.data.rooms || [];
        const rooms = rawRooms.map(r => {
          const lowerType = r.room_type?.toLowerCase();
          let internalType = 'normal';
          if (lowerType === 'standard' || lowerType === 'normal') internalType = 'normal';
          else if (lowerType === 'deluxe') internalType = 'deluxe';
          else if (lowerType === 'suite') internalType = 'suite';
          else internalType = 'normal';
          return {
            number: r.room_number,
            type: mapRoomTypeDisplay(r.room_type),
            internalType,
            price: r.price_per_night,
          };
        });
        setGlobalRooms(rooms);
      } catch (err) {
        setError(err.message || 'Failed to load hotel details');
        const demo = { id:parseInt(id), name:'Grand Himalaya Hotel', location:'Lakeside, Pokhara', star_rating:5, review_score:4.8, description:'Experience unparalleled luxury...', contact:'+977-61-123456', email:'info@grandhimalaya.com', image1:FALLBACK_IMGS[0], image2:FALLBACK_IMGS[1], image3:FALLBACK_IMGS[2], image4:FALLBACK_IMGS[3], has_pool:true, has_gym:true, has_restaurant:true, has_parking:true, has_room_service:true, check_in_time:'14:00', check_out_time:'12:00', cancellation_policy:'Free cancellation up to 24 hours before check-in.', payment_methods:['Visa','Mastercard','American Express','Cash'], children_policy:'Children of all ages are welcome.', pet_policy:'Pets are not allowed.', smoking_policy:'Non-smoking rooms available.' };
        setHotel(demo);
        setHotelImages(FALLBACK_IMGS);
        setRoomTypes([ { id:1, room_type:'Normal', price_per_night:5000, capacity:2 }, { id:2, room_type:'Deluxe', price_per_night:8500, capacity:3 }, { id:3, room_type:'Suite', price_per_night:15000, capacity:4 } ]);
        setFacilities([
          { name:'Free High-Speed WiFi', icon:FaWifi, available:true },
          { name:'Air Conditioning', icon:FaSnowflake, available:true },
          { name:'24/7 Room Service', icon:FaConciergeBell, available:true },
          { name:'Free Parking', icon:FaParking, available:true },
          { name:'Multi-Cuisine Restaurant', icon:FaUtensils, available:true },
          { name:'Swimming Pool', icon:FaSwimmer, available:true },
          { name:'Fitness Center', icon:FaDumbbell, available:true }
        ]);
        setReviews([ { id:1, user:{ first_name:'Demo', last_name:'' }, country:'Nepal', rating:9.0, comment:'Great hotel!', created_at:new Date().toISOString() } ]);
        setGlobalBookings([]);
        const demoRooms = [];
        for (let i = 1; i <= 20; i++) {
          const internalType = i <= 10 ? 'normal' : (i <= 16 ? 'deluxe' : 'suite');
          demoRooms.push({
            number: 100 + i,
            type: internalType === 'normal' ? 'Normal' : (internalType === 'deluxe' ? 'Deluxe' : 'Suite'),
            internalType,
            price: internalType === 'normal' ? 5000 : (internalType === 'deluxe' ? 8500 : 15000),
          });
        }
        setGlobalRooms(demoRooms);
      } finally { setLoading(false); }
    };
    fetchHotelData();
  }, [id]);

  const toast = (msg,type='info') => { setShowToast({ message: msg, type }); setTimeout(() => setShowToast(null), 3000); };
  const scrollToSection = (key) => { const refs = { overview:overviewRef, prices:pricesRef, facilities:facilitiesRef, legal:legalRef, reviews:reviewsRef, deals:dealsRef }; const target = refs[key]; if (target?.current) target.current.scrollIntoView({ behavior:'smooth', block:'start' }); };
  const handleTabClick = (key) => { setActiveTab(key); scrollToSection(key); };
  const toggleFav = (hotelId) => { setFavHotels(prev => prev.includes(hotelId) ? prev.filter(x=>x!==hotelId) : [...prev, hotelId]); toast(hotelId ? (favHotels.includes(hotelId) ? 'Removed from favorites' : 'Added to favorites') : ''); };

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center"><div className="text-center"><FaSpinner className="animate-spin text-5xl mx-auto mb-4 text-purple-400" /><p className="text-white text-lg">Loading hotel details...</p></div></div>;
  if (error || !hotel) return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center"><div className="text-center text-red-400 bg-black/30 p-8 rounded-2xl"><p className="text-lg">{error || 'Hotel not found'}</p><button onClick={() => router.push('/guest/dashboard')} className="mt-6 px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-300 transition-all">← Back to Dashboard</button></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;} body{font-family:'Inter',sans-serif;background:#0a0a0a;}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulseGlow{0%,100%{opacity:.25;}50%{opacity:.45;}}
        .animate-fadeInUp{animation:fadeInUp .45s ease forwards;}
        .animate-slideDown{animation:slideDown .3s ease forwards;}
        .hover-scale{transition:transform .2s ease,box-shadow .2s ease;}
        .hover-scale:hover{transform:translateY(-2px);box-shadow:0 10px 25px -5px rgba(0,0,0,.25);}
        .animate-pulse-slow{animation:pulseGlow 3s ease-in-out infinite;}
        .line-clamp-1{overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;}
        .line-clamp-2{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
        .line-clamp-3{overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#7c3aed80;border-radius:4px;}
        select option{background-color:#1f2937;color:#fff;}
      `}</style>

      <div className="fixed inset-0 z-0 pointer-events-none"><div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/15 to-indigo-900/20" /><div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse-slow" /><div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-pink-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay:'1.2s' }} /></div>

      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10"><div className="max-w-7xl mx-auto px-4"><div className="flex items-center justify-between py-3"><button onClick={() => router.push('/guest/dashboard')} className="flex items-center gap-2 text-gray-300 hover:text-white"><FaArrowLeft /><span className="hidden sm:inline">Back to Hotels</span></button><div className="flex overflow-x-auto gap-1">{['overview','prices','facilities','legal','reviews','deals'].map(tab => (<button key={tab} onClick={() => handleTabClick(tab)} className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap transition-all border-b-2 ${activeTab===tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'}`}>{tab==='prices'?'Room Availability':tab==='deals'?'Weekend Deals':tab}</button>))}</div></div></div></div>

      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Auto-sliding carousel */}
        <div className="relative h-96 rounded-2xl overflow-hidden mb-8 shadow-2xl">
          <img src={hotelImages[currentImage]} alt={hotel.name} className="w-full h-full object-cover transition-all duration-500" onError={e=>{ e.target.src=FALLBACK_IMGS[0]; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          {hotelImages.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-sm z-10"><FaChevronLeft /></button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-sm z-10"><FaChevronRight /></button>
              <button onClick={toggleAutoSlide} className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-sm z-10">{autoSlideActive ? <FaPause size={14} /> : <FaPlay size={14} />}</button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {hotelImages.map((_, idx) => (<button key={idx} onClick={() => goToImage(idx)} className={`w-2 h-2 rounded-full transition ${idx === currentImage ? 'bg-purple-400 w-4' : 'bg-white/50'}`} />))}
              </div>
              {autoSlideActive && (<div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-purple-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>Auto-slide</div>)}
            </>
          )}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <StarRating rating={hotel.star_rating || 4} />
              {hotel.review_score && <span className="bg-green-600 text-white text-sm px-3 py-1 rounded-full font-bold">★ {(hotel.review_score*10/5).toFixed(1)}</span>}
              <span className="text-gray-300 text-sm">{reviews.length} reviews</span>
              <button onClick={() => toggleFav(hotel.id)} className="flex items-center gap-1 text-sm text-gray-300 hover:text-red-400 ml-auto">
                {favHotels.includes(hotel.id) ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                <span className="hidden sm:inline">{favHotels.includes(hotel.id) ? 'Saved' : 'Save'}</span>
              </button>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{hotel.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-200 text-sm">
              <div className="flex items-center gap-1"><FaMapMarkerAlt className="text-purple-400" /><span>{hotel.location || 'Nepal'}</span></div>
              <div className="flex items-center gap-1"><FaPhoneAlt className="text-purple-400 text-xs" /><span>{hotel.contact || '+977-1-1234567'}</span></div>
              <div className="flex items-center gap-1"><FaEnvelope className="text-purple-400 text-xs" /><span>{hotel.email || 'info@hotel.com'}</span></div>
            </div>
          </div>
        </div>

        <div ref={overviewRef} className="scroll-mt-20 mb-12"><div className="grid lg:grid-cols-2 gap-8 items-stretch"><div className="flex flex-col gap-6"><div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover-scale"><h2 className="text-xl font-semibold text-white mb-4">About {hotel.name}</h2><p className="text-gray-300 leading-relaxed">{hotel.description || 'Experience luxury and comfort at its finest.'}</p><div className="mt-5 p-4 bg-white/5 rounded-xl border border-white/10"><div className="flex items-center gap-2 mb-3"><div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" /><h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">About Dwarkias</h3></div><p className="text-gray-300 text-sm leading-relaxed">Dwarkias is a renowned hospitality brand deeply rooted in India's cultural and spiritual heritage, celebrated for its vegetarian cuisine and heritage accommodations across sacred pilgrimage destinations like Mathura, Vrindavan, Dwarka, and Pushkar. With a philosophy of service as devotion, Dwarkias offers clean, warm, and authentic hospitality, blending modern amenities with traditional values.</p></div><div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm"><div className="flex items-center gap-3 text-gray-300"><FaPhoneAlt className="text-purple-400" /><span>{hotel.contact || '+977-1-1234567'}</span></div><div className="flex items-center gap-3 text-gray-300"><FaEnvelope className="text-purple-400" /><span>{hotel.email || 'info@hotel.com'}</span></div><div className="flex items-center gap-3 text-gray-300 sm:col-span-2"><FaMapMarkerAlt className="text-purple-400" /><span>{hotel.location || 'Kathmandu, Nepal'}</span></div></div></div></div><div className="flex-1 min-h-0"><HotelMapCard hotel={hotel} /></div></div></div>

        <div ref={pricesRef} className="scroll-mt-20 mb-12"><GuestRoomStatusPanel hotelId={id} hotel={hotel} bookings={globalBookings} allRooms={globalRooms} onBookingSuccess={setGlobalBookings} setAllRooms={setGlobalRooms} /></div>

        <div ref={facilitiesRef} className="scroll-mt-20 mb-12"><div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"><div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-white flex items-center gap-2"><FaInfoCircle className="text-purple-400" /> Hotel Facilities & Amenities</h2><span className="text-xs text-purple-400 bg-purple-500/20 px-3 py-1 rounded-full">{facilities.length} Premium Amenities</span></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{facilities.map((f,i) => (<div key={i} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg hover:bg-black/40 transition-colors group"><div className={`p-2 rounded-lg ${f.available ? 'bg-purple-500/20' : 'bg-gray-500/20'} group-hover:scale-110 transition-transform`}><f.icon className={`text-lg ${f.available ? 'text-purple-400' : 'text-gray-500'}`} /></div><span className={`flex-1 text-sm ${f.available ? 'text-gray-300' : 'text-gray-500 line-through'}`}>{f.name}</span>{f.available ? <FaCheckCircle className="text-green-500" /> : <FaTimes className="text-gray-500" />}</div>))}</div></div></div>

        <div ref={legalRef} className="scroll-mt-20 mb-12"><div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"><h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><FaShieldAlt className="text-purple-400" /> Important Information</h2><div className="grid md:grid-cols-2 gap-6"><div className="space-y-4"><div className="flex items-start gap-3"><FaClock className="text-purple-400 mt-1" /><div><div className="text-white font-medium">Check-in / Check-out</div><div className="text-gray-400 text-sm">Check-in: From {hotel.check_in_time || '14:00'}</div><div className="text-gray-400 text-sm">Check-out: Until {hotel.check_out_time || '12:00'}</div></div></div><div className="flex items-start gap-3"><FaCreditCard className="text-purple-400 mt-1" /><div><div className="text-white font-medium">Payment Methods</div><div className="text-gray-400 text-sm">{hotel.payment_methods?.join(', ') || 'Visa, Mastercard, American Express, Cash'}</div></div></div><div className="flex items-start gap-3"><FaBan className="text-purple-400 mt-1" /><div><div className="text-white font-medium">Cancellation Policy</div><div className="text-gray-400 text-sm">{hotel.cancellation_policy || 'Free cancellation up to 24 hours before check-in.'}</div></div></div></div><div className="space-y-4"><div className="flex items-start gap-3"><FaChild className="text-purple-400 mt-1" /><div><div className="text-white font-medium">Children & Extra Beds</div><div className="text-gray-400 text-sm">{hotel.children_policy || 'Children of all ages are welcome.'}</div></div></div><div className="flex items-start gap-3"><FaDog className="text-purple-400 mt-1" /><div><div className="text-white font-medium">Pet Policy</div><div className="text-gray-400 text-sm">{hotel.pet_policy || 'Pets are not allowed.'}</div></div></div><div className="flex items-start gap-3"><FaSmoking className="text-purple-400 mt-1" /><div><div className="text-white font-medium">Smoking Policy</div><div className="text-gray-400 text-sm">{hotel.smoking_policy || 'Non-smoking rooms available.'}</div></div></div></div></div></div></div>

        <div ref={reviewsRef} className="scroll-mt-20 mb-12"><div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"><h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><FaStar className="text-purple-400" /> Guest Reviews</h2><div className="flex items-center gap-6 mb-8 pb-4 border-b border-white/10"><div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-4xl font-bold px-6 py-3 rounded-xl">{(hotel.review_score*10/5 || 8.5).toFixed(1)}</div><div><div className="text-white text-xl font-semibold">Good</div><div className="text-gray-400">Based on {reviews.length} guest reviews</div></div></div><div className="space-y-5">{reviews.map(r => (<div key={r.id} className="border-b border-white/10 pb-5 last:border-0 hover:bg-white/5 -mx-2 px-2 py-3 rounded-lg transition-colors"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">{r.user?.first_name?.[0] || 'G'}</div><div><div className="text-white font-medium">{r.user?.first_name} {r.user?.last_name}</div><div className="text-gray-500 text-xs">{r.country || 'Nepal'} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent'}</div></div></div><div className="bg-purple-600/30 text-purple-300 px-3 py-1 rounded-full text-sm font-bold">★ {r.rating}</div></div><p className="text-gray-300 text-sm leading-relaxed">{r.comment}</p></div>))}</div></div></div>

        <div ref={dealsRef} className="scroll-mt-20 mb-8"><WeekendDealsCarousel onBook={deal => toast(`Booking deal: ${deal.name}`, 'success')} favHotels={favHotels} toggleFav={toggleFav} onViewDeal={deal => toast(`Viewing deal: ${deal.name}`, 'info')} /></div>

        <div className="mb-12"><SuggestedHotelsCarousel currentHotelId={parseInt(id)} onBookNow={hotel => router.push(`/guest/hotel-info/${hotel.id}`)} /></div>
      </div>

      {showToast && <div className="fixed bottom-5 right-5 z-50 bg-gray-900 border-l-4 border-purple-500 text-white px-4 py-3 rounded-lg shadow-2xl animate-slideDown max-w-xs text-sm">{showToast.message}</div>}
    </div>
  );
}