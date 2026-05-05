'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaCalendarAlt, FaCreditCard, FaClipboardList, FaStar, FaTrophy, FaGift, FaUser, FaBell, FaSignOutAlt, FaHotel,
  FaHome, FaDollarSign, FaPlus, FaShareAlt, FaHeart, FaRegHeart, FaMapMarkerAlt, FaPhoneAlt, FaPhone, FaEnvelope,
  FaExclamationTriangle, FaExclamationCircle, FaChevronLeft, FaChevronRight, FaChevronDown, FaChevronUp, FaTag, FaWifi, FaTv, FaCoffee,
  FaSnowflake, FaShower, FaBed, FaParking, FaConciergeBell, FaUtensils, FaDumbbell, FaSwimmingPool, FaClock, FaRobot,
  FaTimes, FaGripVertical, FaPaperPlane, FaLightbulb, FaSpinner, FaCheckCircle, FaDoorOpen
} from 'react-icons/fa';
import FilterHotels from '@/components/FilterHotels';
import guestApi from '../utils/guestApi';

const FALLBACK_IMGS = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80',
  'https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=600&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
];

const getRatingMeta = (score) => {
  if (!score) return { label: 'New', color: 'from-gray-600 to-gray-700', score10: null };
  const n = parseFloat(score);
  const s10 = (n * 2).toFixed(1);
  if (n >= 4.5) return { label: 'Outstanding', color: 'from-blue-600 to-blue-700', score10: s10 };
  if (n >= 4.0) return { label: 'Excellent', color: 'from-green-600 to-green-700', score10: s10 };
  if (n >= 3.0) return { label: 'Good', color: 'from-yellow-600 to-yellow-700', score10: s10 };
  return { label: 'Average', color: 'from-orange-600 to-orange-700', score10: s10 };
};

const priceLevel = (price) => {
  const p = parseFloat(price) || 0;
  if (p >= 300) return '$$$$';
  if (p >= 150) return '$$$';
  if (p >= 75) return '$$';
  return '$';
};

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
   EMBEDDED BOOKING WIDGET – with overlap validation
══════════════════════════════════════════════════════════════════════ */
function EmbeddedBookingWidget({ hotelId, hotel, bookings, onBookingSuccess, allRooms, setAllRooms }) {
  const [formData, setFormData] = useState({ name: '', email: '', contact: '', room: '', days: '', checkin: '', checkout: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [overlapError, setOverlapError] = useState('');

  const [showChatbot, setShowChatbot] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [chatMessages, setChatMessages] = useState([{
    type: 'bot',
    text: "👋 Hi! I'm your AI Booking Assistant powered by real-time hotel data.\n\nI can answer questions like:\n• How many rooms are available right now?\n• Which suite rooms are free?\n• What's the cheapest option today?\n• Who is checking out soon?\n• Which room is best for my budget?\n\nTap a suggestion below or ask me anything! 🏨",
  }]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatPosition, setChatPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const messagesEndRef = useRef(null);
  const chatbotRef = useRef(null);

  const getRoomStatusForRoom = useCallback((roomNumber) => {
    const now = new Date();
    const booking = bookings.find(b => {
      if (!b.room) return false;
      const extracted = extractRoomNumber(b.room);
      if (extracted !== roomNumber) return false;
      const checkIn = new Date(b.check_in);
      const checkOut = b.check_out ? new Date(b.check_out) : null;
      if (checkOut && now >= checkOut) return false;
      if (now >= checkIn) return true;
      return false;
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
  }, [bookings]);

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
    const fetchRooms = async () => {
      if (allRooms && allRooms.length > 0) {
        setDataLoading(false);
        return;
      }
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
            number: r.room_number,
            type: mapRoomTypeDisplay(r.room_type),
            internalType,
            price: r.price_per_night,
            images: getImagesForRoom(internalType, r.room_number),
            facilities: getFacilitiesForType(internalType),
            description: getDescriptionForType(internalType),
          };
        });
        if (setAllRooms) setAllRooms(rooms);
      } catch (error) {
        console.error('Booking widget error:', error);
        const demoRooms = [];
        for (let i = 1; i <= 20; i++) {
          const internalType = i <= 10 ? 'normal' : (i <= 16 ? 'deluxe' : 'suite');
          const displayType = internalType === 'normal' ? 'Normal' : (internalType === 'deluxe' ? 'Deluxe' : 'Suite');
          demoRooms.push({
            number: 100 + i,
            type: displayType,
            internalType,
            price: internalType === 'normal' ? 5000 : (internalType === 'deluxe' ? 8500 : 15000),
            images: getImagesForRoom(internalType, 100 + i),
            facilities: getFacilitiesForType(internalType),
            description: getDescriptionForType(internalType),
          });
        }
        if (setAllRooms) setAllRooms(demoRooms);
      } finally {
        setDataLoading(false);
      }
    };
    fetchRooms();
  }, [hotelId, allRooms, setAllRooms]);

  const roomsList = allRooms || [];
  const enrichedRooms = useMemo(() => roomsList.map(r => ({
    ...r,
    roomStatus: getRoomStatusForRoom(r.number),
    isAvailable: getRoomStatusForRoom(r.number) === 'available',
  })), [roomsList, getRoomStatusForRoom]);

  const availableRooms = useMemo(() => enrichedRooms.filter(r => r.isAvailable), [enrichedRooms]);
  const normalRooms = enrichedRooms.filter(r => r.type === 'Normal');
  const deluxeRooms = enrichedRooms.filter(r => r.type === 'Deluxe');
  const suiteRooms = enrichedRooms.filter(r => r.type === 'Suite');
  const availabilityDetail = {
    normal: {
      total: normalRooms.length,
      available: normalRooms.filter(r => r.isAvailable).length,
      occupied: normalRooms.filter(r => r.roomStatus === 'occupied').length,
      booked: normalRooms.filter(r => r.roomStatus === 'booked').length,
      availableRooms: normalRooms.filter(r => r.isAvailable).map(r => r.number),
      occupiedRooms: normalRooms.filter(r => r.roomStatus === 'occupied').map(r => r.number),
    },
    deluxe: {
      total: deluxeRooms.length,
      available: deluxeRooms.filter(r => r.isAvailable).length,
      occupied: deluxeRooms.filter(r => r.roomStatus === 'occupied').length,
      booked: deluxeRooms.filter(r => r.roomStatus === 'booked').length,
      availableRooms: deluxeRooms.filter(r => r.isAvailable).map(r => r.number),
      occupiedRooms: deluxeRooms.filter(r => r.roomStatus === 'occupied').map(r => r.number),
    },
    suite: {
      total: suiteRooms.length,
      available: suiteRooms.filter(r => r.isAvailable).length,
      occupied: suiteRooms.filter(r => r.roomStatus === 'occupied').length,
      booked: suiteRooms.filter(r => r.roomStatus === 'booked').length,
      availableRooms: suiteRooms.filter(r => r.isAvailable).map(r => r.number),
      occupiedRooms: suiteRooms.filter(r => r.roomStatus === 'occupied').map(r => r.number),
    },
    totalAvailable: availableRooms.length,
    totalRooms: enrichedRooms.length,
  };

  const prices = useMemo(() => {
    const normalPrice = normalRooms[0]?.price || 5000;
    const deluxePrice = deluxeRooms[0]?.price || 8500;
    const suitePrice = suiteRooms[0]?.price || 15000;
    return { normal_price: normalPrice, deluxe_price: deluxePrice, suite_price: suitePrice };
  }, [normalRooms, deluxeRooms, suiteRooms]);

  const selectedRoomStatus = useMemo(() => {
    const num = extractRoomNumber(formData.room);
    if (!num) return 'available';
    return getRoomStatusForRoom(num);
  }, [formData.room, getRoomStatusForRoom]);

  const priceInfo = useMemo(() => {
    if (!formData.room) return null;
    const lower = formData.room.toLowerCase();
    let unitPrice = 0;
    if (lower.includes('normal')) unitPrice = prices.normal_price;
    else if (lower.includes('deluxe')) unitPrice = prices.deluxe_price;
    else if (lower.includes('suite')) unitPrice = prices.suite_price;
    else {
      const num = extractRoomNumber(formData.room);
      if (num) {
        if (num >= 101 && num <= 199) unitPrice = prices.normal_price;
        else if (num >= 201 && num <= 299) unitPrice = prices.deluxe_price;
        else if (num >= 301 && num <= 399) unitPrice = prices.suite_price;
      }
    }
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
      total,
      rawTotal,
      discount: discount > 0,
      formatted: discount
        ? `${formatUSD(unitPrice)} × ${days} night${days > 1 ? 's' : ''} − 10% = ${formatUSD(total)}`
        : `${formatUSD(unitPrice)} × ${days} night${days > 1 ? 's' : ''} = ${formatUSD(total)}`,
    };
  }, [prices, formData.room, formData.checkin, formData.checkout, formData.days]);

  // Chatbot drag & drop
  const handleMouseDown = (e) => {
    if (!e.target.closest('.chatbot-drag-handle')) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = chatbotRef.current.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging) return;
      setChatPosition({
        x: Math.min(Math.max(e.clientX - dragOffset.x, 10), window.innerWidth - 440),
        y: Math.min(Math.max(e.clientY - dragOffset.y, 10), window.innerHeight - 680),
      });
    };
    const onUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (overrideText = null) => {
    const userMsg = (overrideText ?? chatInput).trim();
    if (!userMsg || isTyping) return;
    const historyToSend = chatMessages.slice(-10);
    setChatMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);
    setShowSuggestions(false);
    try {
      const res = await fetch('/api/hotel-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: historyToSend,
          context: {
            rooms: enrichedRooms,
            availability: availabilityDetail,
            bookings,
            prices,
            hotel: { name: hotel?.name, location: hotel?.location },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setChatMessages(prev => [...prev, { type: 'bot', text: data.reply ?? 'Sorry, no response received.' }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { type: 'bot', text: `⚠️ ${err.message || 'Connection error. Please try again.'}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRoomChange = (value) => {
    setFormData(p => ({ ...p, room: value }));
    const lower = value.toLowerCase();
    if (lower.includes('normal')) setSelectedRoomType('normal');
    else if (lower.includes('deluxe')) setSelectedRoomType('deluxe');
    else if (lower.includes('suite')) setSelectedRoomType('suite');
    else {
      const num = extractRoomNumber(value);
      if (num >= 101 && num <= 199) setSelectedRoomType('normal');
      else if (num >= 201 && num <= 299) setSelectedRoomType('deluxe');
      else if (num >= 301 && num <= 399) setSelectedRoomType('suite');
      else setSelectedRoomType(null);
    }
  };

  // Check if guest already has an overlapping booking (by email)
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

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateForm()) return;
    if (hasOverlappingBooking()) {
      setOverlapError('Cannot Do Another Booking for Same Date');
      return;
    }
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
      const refreshedRooms = await guestApi.get(`/hotels/${hotelId}/guest-rooms/`);
      const rawRooms = refreshedRooms.data.rooms || [];
      const updatedRooms = rawRooms.map(r => ({
        number: r.room_number,
        type: mapRoomTypeDisplay(r.room_type),
        internalType: r.room_type?.toLowerCase().includes('deluxe') ? 'deluxe' : (r.room_type?.toLowerCase().includes('suite') ? 'suite' : 'normal'),
        price: r.price_per_night,
      }));
      if (setAllRooms) setAllRooms(updatedRooms);
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({ name: '', email: '', contact: '', room: '', days: '', checkin: '', checkout: '' });
        setSelectedRoomType(null);
        setOverlapError('');
      }, 3000);
    } catch (err) {
      alert('Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (field) => `w-full pl-10 pr-3 py-2.5 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all duration-200 ${errors[field] ? 'border-red-500' : 'border-white/20'}`;
  const derivedDays = useMemo(() => {
    if (formData.checkin && formData.checkout) {
      const ms = new Date(formData.checkout) - new Date(formData.checkin);
      if (ms > 0) return Math.max(1, Math.round(ms / 86400000));
    }
    return formData.days || '';
  }, [formData.checkin, formData.checkout, formData.days]);

  return (
    <>
      <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 animate-fadeInUp">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Book Your Stay</h2>
            <p className="text-gray-400 text-xs">Enter guest information and room preferences</p>
          </div>
          <button
            onClick={() => setShowChatbot(v => !v)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg text-sm font-semibold"
          >
            <FaRobot className="text-base" /> AI Assistant
          </button>
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
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input type="text" value={formData.name} placeholder="John Doe"
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className={inputCls('name')} />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Email *</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input type="email" value={formData.email} placeholder="john@example.com"
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    className={inputCls('email')} />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Contact Number *</label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input type="tel" value={formData.contact} placeholder="+977 98XXXXXXXX"
                    onChange={e => setFormData(p => ({ ...p, contact: e.target.value }))}
                    className={inputCls('contact')} />
                </div>
                {errors.contact && <p className="text-red-400 text-xs mt-1">{errors.contact}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Room *</label>
                <div className="relative">
                  <FaDoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input type="text" value={formData.room} placeholder="101 / Normal / Deluxe / Suite"
                    onChange={e => handleRoomChange(e.target.value)}
                    className={inputCls('room')} />
                </div>
                {errors.room && <p className="text-red-400 text-xs mt-1">{errors.room}</p>}
                {selectedRoomType && selectedRoomStatus === 'available' && (
                  <p className="text-purple-400 text-xs mt-1 animate-pulse">💡 {roomAmenities[selectedRoomType]?.name} selected</p>
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
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Number of Days <span className="text-gray-500 ml-1">(auto-calc from dates)</span>
              </label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input type="number" min="1" value={derivedDays} placeholder="2"
                  onChange={e => setFormData(p => ({ ...p, days: e.target.value }))}
                  className={inputCls('days')} />
              </div>
              {errors.days && <p className="text-red-400 text-xs mt-1">{errors.days}</p>}
            </div>
            <div className="relative">
              <CalendarDateTimePicker
                label="Check-in Date & Time *"
                value={formData.checkin}
                onChange={e => setFormData(p => ({ ...p, checkin: e.target.value }))}
                error={errors.checkin}
              />
            </div>
            <div className="relative">
              <CalendarDateTimePicker
                label="Check-out Date & Time *"
                value={formData.checkout}
                onChange={e => setFormData(p => ({ ...p, checkout: e.target.value }))}
                error={errors.checkout}
                minDate={formData.checkin ? formData.checkin.split('T')[0] : undefined}
              />
            </div>
          </div>

          {priceInfo && (
            <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/50 animate-fadeInUp">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <FaDollarSign className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Total Price</p>
                    <p className="text-xs text-gray-300">{priceInfo.formatted}</p>
                    {priceInfo.discount && <p className="text-xs text-green-400 font-semibold">🎉 10% discount for 3+ nights!</p>}
                  </div>
                </div>
                <div className="text-right">
                  {priceInfo.discount && <p className="text-xs text-gray-400 line-through">{formatUSD(priceInfo.rawTotal)}</p>}
                  <p className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{formatUSD(priceInfo.total)}</p>
                  <p className="text-xs text-gray-400">{priceInfo.days} night{priceInfo.days > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          )}

          {selectedRoomType && roomAmenities[selectedRoomType] && selectedRoomStatus === 'available' && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 animate-fadeInUp">
              <div className={`h-0.5 w-12 rounded-full bg-gradient-to-r ${roomAmenities[selectedRoomType].color} mb-2`} />
              <p className="text-xs font-semibold text-white mb-2">{roomAmenities[selectedRoomType].name} — {roomAmenities[selectedRoomType].priceRange}/night</p>
              <div className="grid grid-cols-2 gap-1">
                {roomAmenities[selectedRoomType].amenities.slice(0, 4).map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-300">
                    <a.icon className="text-purple-400 text-[10px] flex-shrink-0" /><span>{a.name}</span>
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

          <button
            type="submit"
            disabled={submitting || dataLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
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

      {showChatbot && (
        <div ref={chatbotRef} style={{ position: 'fixed', left: `${chatPosition.x}px`, top: `${chatPosition.y}px`, width: '420px', maxHeight: '680px', zIndex: 99999, userSelect: 'none', cursor: isDragging ? 'grabbing' : 'default' }}>
          <div className="bg-gradient-to-b from-gray-900/98 to-gray-800/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 flex flex-col overflow-hidden" style={{ maxHeight: '680px' }}>
            <div className="chatbot-drag-handle p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-t-2xl select-none flex-shrink-0" onMouseDown={handleMouseDown} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"><FaRobot className="text-white text-base" /></div>
                  <div><h3 className="text-white font-bold text-sm">AI Booking Assistant</h3><p className="text-xs text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" />Powered by Claude · Live hotel data</p></div>
                </div>
                <div className="flex items-center gap-2">
                  {!dataLoading && (
                    <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-400">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />{availabilityDetail.totalAvailable} free
                    </div>
                  )}
                  <button onMouseDown={e => e.stopPropagation()} onClick={() => setShowChatbot(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition pointer-events-auto"><FaTimes className="text-gray-400" /></button>
                </div>
              </div>
              <div className="flex justify-center mt-1 pointer-events-none"><FaGripVertical className="text-gray-600 text-xs" /></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '340px' }}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.type === 'bot' && <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mr-2 mt-1 flex-shrink-0"><FaRobot className="text-white text-xs" /></div>}
                  <div className={`max-w-[82%] p-3 rounded-xl text-sm whitespace-pre-wrap leading-relaxed ${msg.type === 'user' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-none' : 'bg-white/10 backdrop-blur-sm text-gray-200 rounded-bl-none border border-white/10'}`}>{msg.text}</div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0"><FaRobot className="text-white text-xs" /></div>
                  <div className="bg-white/10 p-3 rounded-xl rounded-bl-none border border-white/10 flex gap-1 items-center">
                    {[0, 150, 300].map(d => <div key={d} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                    <span className="text-xs text-gray-500 ml-2">Analyzing hotel data...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex-shrink-0 border-t border-white/10 bg-gray-900/40">
              <button onClick={() => setShowSuggestions(v => !v)} className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-400 hover:text-gray-300 hover:bg-white/5 transition">
                <div className="flex items-center gap-1"><FaLightbulb className="text-yellow-500 text-xs" /> Suggested questions</div>{showSuggestions ? <FaChevronDown className="text-xs" /> : <FaChevronUp className="text-xs" />}
              </button>
              {showSuggestions && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button key={i} onClick={() => handleSendMessage(q.text)} disabled={isTyping} className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 rounded-lg text-xs text-gray-300 hover:text-white transition-all disabled:opacity-40">
                      <span>{q.emoji}</span><span className="truncate max-w-[150px]">{q.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 p-3 border-t border-white/10 bg-gray-900/60">
              <div className="flex gap-2">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Ask about rooms, prices, availability..." disabled={isTyping} className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm disabled:opacity-50" />
                <button onClick={() => handleSendMessage()} disabled={isTyping || !chatInput.trim()} className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"><FaPaperPlane className="text-sm" /></button>
              </div>
              <p className="text-xs text-gray-600 mt-1.5 text-center">Powered by Claude AI · Live database data</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


const DEMO_HOTELS = [
  { id: 1, name: 'Hyatt Regency Kathmandu', location: 'Thamel, Kathmandu', status: 'Active', contact: '+977-1-4491234', email: 'info@hyatt.com.np' },
  { id: 2, name: 'Hotel Annapurna', location: 'Durbar Marg, Kathmandu', status: 'Active', contact: '+977-1-4221711', email: 'info@annapurna.com' },
  { id: 3, name: 'Fishtail Lodge Pokhara', location: 'Lakeside, Pokhara', status: 'Active', contact: '+977-61-520071', email: 'info@fishtail.com' },
  { id: 4, name: 'Tiger Tops Tharu Lodge', location: 'Chitwan', status: 'Active', contact: '+977-1-4361500', email: 'info@tigertops.com' },
  { id: 5, name: 'Hotel Yak & Yeti', location: 'Durbarmarg, Kathmandu', status: 'Active', contact: '+977-1-4248999', email: 'info@yaknyeti.com' },
  { id: 6, name: 'Biratnagar Hotel Himalaya', location: 'Biratnagar', status: 'Active', contact: '+977-21-470000', email: 'info@himalaya.com' },
];

const getWeekendDates = () => {
  const today = new Date();
  const day = today.getDay();
  const daysUntilFri = (5 - day + 7) % 7 || 7;
  const fri = new Date(today);
  fri.setDate(today.getDate() + daysUntilFri);
  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

const WeekendDealsCarousel = ({ onBook, favHotels, toggleFav, onViewDeal }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [favLocal, setFavLocal] = useState(favHotels || []);
  const visibleCount = 4;
  const maxIdx = WEEKEND_DEALS.length - visibleCount;

  const prev = () => setCurrentIdx((i) => Math.max(0, i - 1));
  const next = () => setCurrentIdx((i) => Math.min(maxIdx, i + 1));

  const getScoreBadgeColor = (score) => {
    const n = parseFloat(score);
    if (n >= 9.0) return 'bg-blue-600';
    if (n >= 8.5) return 'bg-green-600';
    if (n >= 8.0) return 'bg-yellow-600';
    return 'bg-orange-600';
  };

  const handleToggleFav = (id) => {
    setFavLocal((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    if (toggleFav) toggleFav(id);
  };

  return (
    <div className="mb-8 animate-fadeInUp">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-white">Deals for the weekend</h2>
          <p className="text-gray-400 text-sm mt-0.5">Save on stays for {getWeekendDates()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prev} disabled={currentIdx === 0} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <FaChevronLeft className="text-xs" />
          </button>
          <button onClick={next} disabled={currentIdx >= maxIdx} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <FaChevronRight className="text-xs" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="flex gap-4 transition-transform duration-500 ease-in-out" style={{ transform: `translateX(calc(-${currentIdx} * (25% + 4px)))` }}>
          {WEEKEND_DEALS.map((deal) => (
            <div key={deal.id} className="flex-none w-[calc(25%-12px)] min-w-[220px] bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover-scale group cursor-pointer" onClick={() => onViewDeal && onViewDeal(deal)}>
              <div className="relative h-44 overflow-hidden bg-gray-800">
                <img src={deal.img} alt={deal.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { e.target.src = FALLBACK_IMGS[0]; }} />
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <FaTag className="text-[10px]" /> -{deal.discount}%
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleToggleFav(deal.id); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-md">
                  {favLocal.includes(deal.id) ? <FaHeart className="text-xs text-red-500" /> : <FaRegHeart className="text-xs text-gray-700" />}
                </button>
              </div>

              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {deal.isGenius && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">Genius</span>}
                  {deal.dealLabel && <span className="bg-green-600/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-sm">{deal.dealLabel}</span>}
                </div>
                <h3 className="text-white font-semibold text-sm leading-tight mb-1 line-clamp-2 group-hover:text-purple-300 transition-colors">{deal.name}</h3>
                <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
                  <FaMapMarkerAlt className="text-purple-400 text-[10px] flex-shrink-0" />
                  <span className="line-clamp-1">{deal.location}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`${getScoreBadgeColor(deal.score)} text-white text-xs font-bold px-1.5 py-0.5 rounded`}>{deal.score}</span>
                  <span className="text-white text-xs font-medium">{deal.ratingLabel}</span>
                  <span className="text-gray-500 text-xs">· {deal.reviewCount} reviews</span>
                </div>
                <div className="mb-3">
                  <span className="text-gray-500 text-xs line-through">NPR {deal.originalPrice.toLocaleString()}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-purple-300 font-bold text-base">NPR {deal.dealPrice.toLocaleString()}</span>
                    <span className="text-gray-400 text-xs">/night</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onBook && onBook(deal); }} className="w-full py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-all">
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-1.5 mt-4">
        {Array.from({ length: maxIdx + 1 }).map((_, i) => (
          <button key={i} onClick={() => setCurrentIdx(i)} className={`rounded-full transition-all ${i === currentIdx ? 'w-4 h-1.5 bg-purple-400' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
};

export default function GuestDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookingMenuOpen, setBookingMenuOpen] = useState(false);
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [bookingPopupRooms, setBookingPopupRooms] = useState([]);
  const [hotelBookings, setHotelBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useState({
    location: '',
    checkIn: '2025-06-15',
    checkOut: '2025-06-18',
    guests: 2,
  });

  const [filters, setFilters] = useState({ roomType: 'all', rating: 0 });
  const [hotels, setHotels] = useState([]);
  const [hotelDetails, setHotelDetails] = useState({});
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [hotelError, setHotelError] = useState(null);
  const [favHotels, setFavHotels] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');

  const [bookingStep, setBookingStep] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [extras, setExtras] = useState({ breakfast: false, airportTransfer: false });
  const [bookingDetails, setBookingDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentStatus, setPaymentStatus] = useState(null);

  const [userBookings, setUserBookings] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [tier, setTier] = useState('Bronze');
  const [pointsHistory, setPointsHistory] = useState([]);
  const [promoDiscount, setPromoDiscount] = useState(0);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    preferences: { pillowType: 'Memory Foam', floorLevel: 'High' },
  });

  const [notifications, setNotifications] = useState([]);
  const [showToast, setShowToast] = useState(null);

  const verifyToken = async () => {
    const accessToken = localStorage.getItem('guest_access_token');

    if (!accessToken) {
      router.push('/guest/login');
      return false;
    }

    try {
      await guestApi.get('/guest/profile/');
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('guest_access_token');
        localStorage.removeItem('guest_refresh_token');
        localStorage.removeItem('guestUser');
        router.push('/guest/login');
      }
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const isValid = await verifyToken();
      if (isValid) fetchGuestProfile();
    };

    initAuth();
  }, []);

  const fetchGuestProfile = async () => {
    try {
      const response = await guestApi.get('/guest/profile/');
      const data = response.data;

      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.contact || '',
        preferences: { pillowType: 'Memory Foam', floorLevel: 'High' },
      });

      setLoyaltyPoints(data.loyalty_points || Math.floor(Math.random() * 5000) + 1000);
      setTier(data.loyalty_tier || 'Silver');
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('guest_access_token');
        localStorage.removeItem('guest_refresh_token');
        localStorage.removeItem('guestUser');
        router.push('/guest/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const toast = (message, type = 'info') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const fetchHotels = useCallback(async (loc = '') => {
    setLoadingHotels(true);
    setHotelError(null);
    setSearchLocation(loc);

    try {
      const url = loc ? `/hotels?location=${encodeURIComponent(loc)}&status=Active` : `/hotels?status=Active`;
      const response = await guestApi.get(url);
      const data = response.data;
      const list = Array.isArray(data) ? data : data.results || [];
      const active = list.filter((h) => h.status === 'Active');

      if (active.length === 0) {
        setHotelError('No active hotels found. Showing demo data.');
        setHotels(DEMO_HOTELS);
        DEMO_HOTELS.forEach((h) => fetchHotelProfile(h.id));
      } else {
        setHotels(active);
        active.forEach((h) => fetchHotelProfile(h.id));
      }
    } catch {
      setHotelError('Unable to connect to server. Showing demo hotels.');
      setHotels(DEMO_HOTELS);
      DEMO_HOTELS.forEach((h) => fetchHotelProfile(h.id));
    } finally {
      setLoadingHotels(false);
    }
  }, []);

  const fetchHotelProfile = async (id) => {
    try {
      const response = await guestApi.get(`/hotels/${id}/hprofile/`);
      setHotelDetails((prev) => ({ ...prev, [id]: response.data }));
    } catch {}
  };

  useEffect(() => {
    fetchHotels('');
  }, []);

  const enrichedHotels = useMemo(() => hotels.map((h, idx) => {
    const p = hotelDetails[h.id] || {};
    const img = p.image1 || h.image1 || FALLBACK_IMGS[idx % FALLBACK_IMGS.length];
    const rawScore = p.review_score || h.review_score || null;
    const { label, color, score10 } = getRatingMeta(rawScore);
    const normalPr = parseFloat(p.normal_price || 0) || 5000 + idx * 1000;
    const deluxePr = parseFloat(p.deluxe_price || 0) || 8000 + idx * 1500;
    const suitePr = parseFloat(p.suite_price || 0) || 15000 + idx * 2000;

    const amenities = [
      'Free WiFi',
      p.has_pool && 'Swimming Pool',
      p.has_gym && 'Gym',
      p.has_restaurant && 'Restaurant',
      'Air Conditioning',
    ].filter(Boolean).slice(0, 4);

    return {
      ...h,
      img,
      score10,
      ratingLabel: label,
      ratingColor: color,
      ratingCount: p.total_reviews ? p.total_reviews.toLocaleString() : null,
      stars: p.star_rating || 4,
      priceLevel: priceLevel(normalPr / 100),
      normalPr,
      deluxePr,
      suitePr,
      amenities,
      badge: p.badge || null,
      fullLoc: p.location || h.location || 'Nepal',
      contact: p.contact || h.contact || '',
      email: p.email || h.email || '',
    };
  }), [hotels, hotelDetails]);

  const filteredHotels = useMemo(() => {
    let result = enrichedHotels;

    if (searchLocation) {
      const q = searchLocation.toLowerCase();
      result = result.filter((h) => h.fullLoc.toLowerCase().includes(q) || h.name.toLowerCase().includes(q));
    }

    if (filters.rating > 0) {
      result = result.filter((h) => h.score10 && parseFloat(h.score10) >= filters.rating);
    }

    return result;
  }, [enrichedHotels, searchLocation, filters.rating]);

  const goToHotelInfo = (hotelId) => {
    router.push(`/guest/hotel-info/${hotelId}`);
  };

  const handleHomeClick = () => {
    setActiveTab('home');
    setBookingMenuOpen(false);
    setSearchLocation('');
    fetchHotels('');
    setSearchParams((prev) => ({ ...prev, location: '' }));
  };

  const handleDestinationClick = (destinationName) => {
    setSearchParams((prev) => ({ ...prev, location: destinationName }));
    fetchHotels(destinationName);
  };

  const handleSearch = () => fetchHotels(searchParams.location);

  const handleRefresh = () => {
    setSearchLocation('');
    fetchHotels('');
    setSearchParams((prev) => ({ ...prev, location: '' }));
  };

  const toggleMap = () => setShowMap((m) => !m);

  const startBooking = async (hotel) => {
    setSelectedHotel(hotel);
    setBookingStep('selectDates');
    setSelectedRoom(null);
    setExtras({ breakfast: false, airportTransfer: false });
    setBookingPopupRooms([]);
    setShowBookingPopup(true);

    try {
      const res = await guestApi.get(`/hotels/${hotel.id}/guest-bookings/`);
      setHotelBookings(res.data.bookings || []);
    } catch {
      setHotelBookings([]);
    }
  };

  const startBookingFromDeal = (deal) => {
    const hotelLike = {
      id: deal.id,
      name: deal.name,
      img: deal.img,
      fullLoc: deal.location,
      normalPr: deal.dealPrice,
      deluxePr: Math.round(deal.dealPrice * 1.4),
      suitePr: Math.round(deal.dealPrice * 2),
      score10: deal.score,
      ratingLabel: deal.ratingLabel,
      ratingColor: 'from-blue-600 to-blue-700',
      stars: 4,
      priceLevel: priceLevel(deal.dealPrice / 100),
      amenities: ['Free WiFi', 'Air Conditioning', 'Restaurant'],
      contact: '',
      badge: deal.dealLabel,
    };

    startBooking(hotelLike);
    toast(`Weekend deal applied! ${deal.discount}% off`, 'success');
  };

  const calcTotal = () => {
    if (!selectedHotel || !selectedRoom) return 0;

    const base = selectedRoom === 'Normal'
      ? selectedHotel.normalPr
      : selectedRoom === 'Deluxe'
        ? selectedHotel.deluxePr
        : selectedHotel.suitePr;

    const nights = Math.max(1, (new Date(searchParams.checkOut) - new Date(searchParams.checkIn)) / 86400000);
    let total = base * nights;

    if (extras.breakfast) total += 3000 * nights;
    if (extras.airportTransfer) total += 5000;

    total -= promoDiscount;
    return Math.max(0, total);
  };

  const cancelBooking = (b) => {
    if (window.confirm(`Cancel booking at ${b.hotel}?`)) {
      setUserBookings((prev) =>
        prev.map((x) => x.id === b.id ? { ...x, status: 'cancelled', refundStatus: 'Processing' } : x)
      );
      toast('Booking cancelled. Refund initiated.', 'warning');
    }
  };

  const toggleFav = (id) => {
    setFavHotels((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const totalBookings = userBookings.length;
  const upcomingBookings = userBookings.filter((b) => ['upcoming', 'confirmed'].includes(b.status)).length;
  const totalSpent = userBookings.reduce((s, b) => s + b.amount, 0);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('guest_refresh_token');
      if (refreshToken) await guestApi.post('/guest/logout/', { refresh: refreshToken });
    } catch {}

    localStorage.removeItem('guest_access_token');
    localStorage.removeItem('guest_refresh_token');
    localStorage.removeItem('guestUser');
    router.push('/guest/login');
  };

  const navItems = [
    { id: 'home', name: 'Home', icon: FaHome, color: 'from-blue-500 to-cyan-500' },
    {
      id: 'booking',
      name: 'Bookings',
      icon: FaCalendarAlt,
      color: 'from-green-500 to-emerald-500',
      children: [
        { id: 'details', name: 'Details', icon: FaClipboardList },
      ],
    },
    { id: 'payment', name: 'Payment', icon: FaCreditCard, color: 'from-purple-500 to-pink-500' },
    { id: 'feedback', name: 'Feedback', icon: FaStar, color: 'from-pink-500 to-rose-500' },
    { id: 'rewards', name: 'Rewards', icon: FaTrophy, color: 'from-amber-500 to-yellow-500' },
    { id: 'offers', name: 'Offers', icon: FaGift, color: 'from-red-500 to-pink-500' },
    { id: 'profile', name: 'Profile', icon: FaUser, color: 'from-indigo-500 to-purple-500' },
    { id: 'alerts', name: 'Alerts', icon: FaBell, color: 'from-cyan-500 to-blue-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const renderHome = () => (
    <div className="animate-fadeInUp">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Welcome back, {profile.name?.split(' ')[0] || 'Guest'}!
        </h1>
        <p className="text-gray-400 mt-1">
          {searchLocation ? `Hotels in ${searchLocation}` : 'Discover amazing hotels across Nepal'}
        </p>
      </div>

      <FilterHotels
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        onMapToggle={toggleMap}
        showMap={showMap}
        loadingHotels={loadingHotels}
        onSelectDestination={handleDestinationClick}
      />

      {hotelError && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/25">
          <FaExclamationTriangle className="text-yellow-400 flex-shrink-0" />
          <span className="text-yellow-300 text-sm">{hotelError}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">
          {searchLocation ? `Hotels in ${searchLocation}` : 'All Hotels'}
          {loadingHotels ? (
            <span className="text-gray-400 text-sm font-normal ml-2">Loading…</span>
          ) : (
            <span className="text-gray-400 text-sm font-normal ml-2">{filteredHotels.length} results</span>
          )}
        </h2>
      </div>

      {loadingHotels && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden animate-pulse">
              <div className="h-48 bg-white/10" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-white/10 rounded w-2/3" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
                <div className="h-3 bg-white/10 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loadingHotels && (
        filteredHotels.length === 0 ? (
          <div className="text-center py-14 text-gray-400 mb-8">
            <FaHotel className="text-5xl mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No hotels found {searchLocation ? `in "${searchLocation}"` : ''}</p>
            <p className="text-sm mt-1">Try a different city or check back later.</p>
            <button onClick={handleRefresh} className="mt-4 px-5 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-all text-sm">
              Show All Hotels
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {filteredHotels.map((hotel, idx) => (
              <div key={hotel.id} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover-scale animate-fadeInUp group" style={{ animationDelay: `${idx * 0.07}s` }}>
                <div className="relative h-48 overflow-hidden bg-gray-800 cursor-pointer" onClick={() => goToHotelInfo(hotel.id)}>
                  <img src={hotel.img} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { e.target.src = FALLBACK_IMGS[idx % FALLBACK_IMGS.length]; }} />

                  {hotel.badge && (
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-medium">
                      {hotel.badge}
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); toast(`Sharing ${hotel.name}…`); }} className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-gray-700 transition-all shadow-md">
                      <FaShareAlt className="text-xs" />
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); toggleFav(hotel.id); }} className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-md">
                      {favHotels.includes(hotel.id) ? <FaHeart className="text-xs text-red-500" /> : <FaRegHeart className="text-xs text-gray-700" />}
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); startBooking(hotel); }} title="Quick Book" className="w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-400 flex items-center justify-center text-white transition-all shadow-md">
                      <FaPlus className="text-xs" />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className={`rounded-full ${i === 0 ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`} />
                    ))}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {hotel.score10 ? (
                      <span className={`bg-gradient-to-r ${hotel.ratingColor} text-white text-xs font-bold px-2 py-0.5 rounded-md`}>
                        {hotel.score10} / 10.0
                      </span>
                    ) : (
                      <span className="bg-gray-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">New</span>
                    )}
                    <span className="text-white text-sm font-semibold">{hotel.ratingLabel}</span>
                    {hotel.ratingCount && <span className="text-gray-400 text-xs">({hotel.ratingCount} reviews)</span>}
                  </div>

                  <h3 onClick={() => goToHotelInfo(hotel.id)} className="text-white font-semibold text-base leading-tight mb-1 line-clamp-1 group-hover:text-purple-300 transition-colors cursor-pointer hover:underline">
                    {hotel.name}
                  </h3>

                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <FaMapMarkerAlt className="text-purple-400 text-xs flex-shrink-0" />
                      <span className="line-clamp-1">{hotel.fullLoc}</span>
                    </div>
                    <span className="flex items-center gap-0.5 bg-black/30 rounded px-1.5 py-0.5 flex-shrink-0">
                      <FaStar className="text-yellow-400 text-xs" />
                      <span className="text-white text-xs font-medium">{hotel.stars} star</span>
                    </span>
                  </div>

                  {hotel.contact && (
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
                      <FaPhoneAlt className="text-xs" /> {hotel.contact}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mb-3">
                    {hotel.amenities.map((a, i) => (
                      <span key={i} className="text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                        {a}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 mb-3">
                    From <strong className="text-purple-300 text-sm">NPR {Math.round(hotel.normalPr).toLocaleString()}</strong>/night
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-gray-400 text-sm font-semibold">{hotel.priceLevel}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => goToHotelInfo(hotel.id)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-medium transition-all border border-white/10">
                        View Details
                      </button>
                      <button onClick={() => startBooking(hotel)} className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all">
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <WeekendDealsCarousel
        onBook={startBookingFromDeal}
        favHotels={favHotels}
        toggleFav={toggleFav}
        onViewDeal={(deal) => toast(`Viewing deal: ${deal.name}`)}
      />

      {showMap && (
        <div className="mt-6 bg-black/50 p-4 rounded-2xl text-center border border-white/10 text-gray-400">
          🗺️ Map view — interactive hotel map for Nepal would render here.
        </div>
      )}
    </div>
  );

  const renderBookings = () => (
    <div className="animate-fadeInUp">
      <h2 className="text-2xl font-bold text-white mb-6">Booking Details</h2>

      {userBookings.length === 0 ? (
        <div className="text-center py-14 text-gray-400">
          <FaClipboardList className="text-5xl mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No booking details yet</p>
          <p className="text-sm mt-1">Start your first booking by searching for hotels!</p>
          <button onClick={() => setActiveTab('home')} className="mt-4 px-5 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-all text-sm">
            Browse Hotels
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {userBookings.map((booking) => (
            <div key={booking.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-semibold text-lg">{booking.hotel}</h3>
                  <p className="text-gray-400 text-sm mt-1">Room: {booking.room}</p>
                  <p className="text-gray-400 text-sm">Check-in: {booking.checkIn}</p>
                  <p className="text-gray-400 text-sm">Check-out: {booking.checkOut}</p>
                  <p className="text-purple-300 font-semibold mt-2">NPR {booking.amount.toLocaleString()}</p>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                    booking.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                    booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {booking.status?.toUpperCase()}
                  </span>

                  {booking.status !== 'cancelled' && (
                    <button onClick={() => cancelBooking(booking)} className="block mt-2 text-xs text-red-400 hover:text-red-300 transition-colors">
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="animate-fadeInUp">
      <h2 className="text-2xl font-bold text-white mb-6">My Profile</h2>
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">
            {profile.name?.charAt(0) || 'G'}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{profile.name || 'Guest User'}</h3>
            <p className="text-gray-400">{profile.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
            <p className="text-white">{profile.phone || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Loyalty Tier</label>
            <p className="text-purple-300 font-semibold">{tier}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Points Balance</label>
            <p className="text-purple-300 font-semibold">{loyaltyPoints.toLocaleString()} pts</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlaceholder = (label) => (
    <div className="text-gray-400 p-6 text-center">
      <p className="text-lg">{label} coming soon...</p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHome();
      case 'booking':
        return null;
      case 'details':
        return renderBookings();
      case 'payment':
        return renderPlaceholder('Payment');
      case 'feedback':
        return renderPlaceholder('Feedback');
      case 'rewards':
        return renderPlaceholder('Rewards');
      case 'offers':
        return renderPlaceholder('Offers');
      case 'profile':
        return renderProfile();
      case 'alerts':
        return renderPlaceholder('Alerts');
      default:
        return renderHome();
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #0a0a0a; }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseGlow { 0%,100% { opacity:.25; } 50% { opacity:.45; } }
        .animate-fadeInUp { animation: fadeInUp 0.45s ease forwards; }
        .animate-slideDown { animation: slideDown 0.3s ease forwards; }
        .hover-scale { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-scale:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,.25); }
        .animate-pulse-slow { animation: pulseGlow 3s ease-in-out infinite; }
        .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
        .line-clamp-2 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#7c3aed80; border-radius:4px; }
      `}</style>

      <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/15 to-indigo-900/20" />
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-pink-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.2s' }} />
        </div>

        <aside className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-gray-900/97 via-gray-800/97 to-gray-900/97 backdrop-blur-xl text-white flex flex-col z-20 transform transition-all duration-300 shadow-2xl border-r border-white/10 ${sidebarCollapsed ? 'w-20 -translate-x-full md:translate-x-0' : 'w-72 translate-x-0'}`}>
          <div className="px-5 py-6 border-b border-white/10">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                  <div className="w-full h-full rounded-xl bg-gray-800 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{profile.name?.charAt(0) || 'G'}</span>
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-3.5 h-3.5 border-2 border-gray-900" />
              </div>

              {!sidebarCollapsed && (
                <div className="mt-3 text-center">
                  <h3 className="font-semibold text-base text-white">{profile.name || 'Guest User'}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{tier} · {loyaltyPoints.toLocaleString()} pts</p>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-center gap-2">
            <FaHotel className="text-2xl text-purple-400 flex-shrink-0" />
            {!sidebarCollapsed && (
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                CloudInn
              </h2>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isChildActive = hasChildren && item.children.some((child) => child.id === activeTab);
              const isActive = activeTab === item.id || isChildActive;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (item.id === 'home') {
                        handleHomeClick();
                      } else if (hasChildren) {
                        setBookingMenuOpen((prev) => !prev);
                      } else {
                        setActiveTab(item.id);
                        setBookingMenuOpen(false);
                      }
                    }}
                    className={`group relative w-full px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-3 overflow-hidden
                      ${isActive ? 'bg-purple-500/20 border border-purple-500/35' : 'bg-white/4 hover:bg-white/10 border border-transparent'}
                      ${sidebarCollapsed ? 'justify-center' : ''}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

                    <item.icon className={`text-base flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} />

                    {!sidebarCollapsed && (
                      <>
                        <span className={`text-sm font-medium ${isActive ? 'text-purple-200' : 'text-gray-300 group-hover:text-white'}`}>
                          {item.name}
                        </span>

                        {hasChildren ? (
                          <FaChevronDown className={`ml-auto text-xs text-gray-400 transition-transform duration-200 ${bookingMenuOpen ? 'rotate-180' : ''}`} />
                        ) : (
                          isActive && item.id !== 'alerts' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
                        )}
                      </>
                    )}
                  </button>

                  {hasChildren && !sidebarCollapsed && (
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${bookingMenuOpen ? 'max-h-32 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                      <div className="ml-6 pl-3 border-l border-white/10 space-y-1 py-1">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => setActiveTab(child.id)}
                            className={`group w-full px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-3
                              ${activeTab === child.id ? 'bg-purple-500/15 text-purple-200' : 'text-gray-400 hover:text-white hover:bg-white/8'}`}
                          >
                            <child.icon className="text-xs flex-shrink-0" />
                            <span className="text-sm font-medium">{child.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button onClick={handleLogout} className={`w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-400 text-sm font-medium transition-all flex items-center justify-center gap-2 group ${sidebarCollapsed ? 'px-2' : ''}`}>
              <FaSignOutAlt className="group-hover:translate-x-0.5 transition-transform" />
              {!sidebarCollapsed && 'Logout'}
            </button>
          </div>
        </aside>

        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} min-h-screen relative z-10`}>
          <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-3">
            <div className="flex items-center justify-between">
              <button onClick={() => setSidebarCollapsed((c) => !c)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {sidebarCollapsed ? 'Show' : 'Hide'}
              </button>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{profile.name?.charAt(0) || 'G'}</span>
                </div>
                <span className="text-sm text-gray-300 hidden md:block">{profile.name?.split(' ')[0] || 'Guest'}</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
              {[
                { label: 'Total Bookings', value: totalBookings, icon: FaClipboardList, color: 'from-blue-500 to-cyan-500', badge: `${totalBookings} total` },
                { label: 'Upcoming Stays', value: upcomingBookings, icon: FaCalendarAlt, color: 'from-green-500 to-emerald-500', badge: 'next 30 days' },
                { label: 'Loyalty Points', value: loyaltyPoints.toLocaleString(), icon: FaTrophy, color: 'from-amber-500 to-yellow-500', badge: `${tier} Tier` },
                { label: 'Total Spent', value: `NPR ${totalSpent.toLocaleString()}`, icon: FaDollarSign, color: 'from-purple-500 to-pink-500', badge: 'lifetime' },
              ].map((stat, idx) => (
                <div key={idx} className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 hover-scale animate-fadeInUp" style={{ animationDelay: `${idx * 0.08}s` }}>
                  <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                        <stat.icon className="text-xl text-white" />
                      </div>
                      <span className="text-xs text-purple-400 font-medium bg-purple-500/20 px-2 py-0.5 rounded-full">{stat.badge}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{stat.value}</h3>
                    <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {renderContent()}
          </div>
        </div>

        {showBookingPopup && selectedHotel && (
          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-gray-900 border border-purple-500/30 shadow-2xl">
              <button
                onClick={() => setShowBookingPopup(false)}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                ×
              </button>

              <div className="p-4">
                <EmbeddedBookingWidget
                  hotelId={selectedHotel.id}
                  hotel={selectedHotel}
                  bookings={hotelBookings}
                  onBookingSuccess={(newBookings) => {
                    setHotelBookings(newBookings);
                    setActiveTab('details');
                    setBookingMenuOpen(true);
                  }}
                  allRooms={bookingPopupRooms}
                  setAllRooms={setBookingPopupRooms}
                />
              </div>
            </div>
          </div>
        )}

        {showToast && (
          <div className="fixed bottom-5 right-5 z-50 bg-gray-900 border-l-4 border-purple-500 text-white px-4 py-3 rounded-lg shadow-2xl animate-slideDown max-w-xs text-sm">
            {showToast.message}
          </div>
        )}
      </div>
    </>
  );
}