'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaSearch, FaCalendarAlt, FaCreditCard, FaClipboardList, FaCheckCircle,
  FaConciergeBell, FaStar, FaTrophy, FaGift, FaUser, FaBell, FaSignOutAlt,
  FaHotel, FaMapMarkedAlt, FaDollarSign, FaPlus, FaCheck, FaSpinner,
  FaRegBell, FaRegStar, FaShareAlt, FaHeart, FaRegHeart, FaWallet,
  FaQrcode, FaRegCreditCard, FaMapMarkerAlt, FaPhoneAlt, FaHome,
  FaExclamationTriangle, FaChevronLeft, FaChevronRight, FaTag
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
  if (n >= 4.0) return { label: 'Excellent',   color: 'from-green-600 to-green-700',  score10: s10 };
  if (n >= 3.0) return { label: 'Good',        color: 'from-yellow-600 to-yellow-700', score10: s10 };
  return              { label: 'Average',      color: 'from-orange-600 to-orange-700', score10: s10 };
};

const priceLevel = (price) => {
  const p = parseFloat(price) || 0;
  if (p >= 300) return '$$$$';
  if (p >= 150) return '$$$';
  if (p >= 75)  return '$$';
  return '$';
};

const DEMO_HOTELS = [
  { id: 1, name: 'Hyatt Regency Kathmandu',   location: 'Thamel, Kathmandu',      status: 'Active', contact: '+977-1-4491234', email: 'info@hyatt.com.np' },
  { id: 2, name: 'Hotel Annapurna',           location: 'Durbar Marg, Kathmandu', status: 'Active', contact: '+977-1-4221711', email: 'info@annapurna.com' },
  { id: 3, name: 'Fishtail Lodge Pokhara',    location: 'Lakeside, Pokhara',      status: 'Active', contact: '+977-61-520071', email: 'info@fishtail.com' },
  { id: 4, name: 'Tiger Tops Tharu Lodge',    location: 'Chitwan',                status: 'Active', contact: '+977-1-4361500', email: 'info@tigertops.com' },
  { id: 5, name: 'Hotel Yak & Yeti',          location: 'Durbarmarg, Kathmandu',  status: 'Active', contact: '+977-1-4248999', email: 'info@yaknyeti.com' },
  { id: 6, name: 'Biratnagar Hotel Himalaya', location: 'Biratnagar',             status: 'Active', contact: '+977-21-470000', email: 'info@himalaya.com' },
];

// ─── Weekend Deals Data ───────────────────────────────────────────────────────
const getWeekendDates = () => {
  const today = new Date();
  const day = today.getDay();
  const daysUntilFri = (5 - day + 7) % 7 || 7;
  const fri = new Date(today); fri.setDate(today.getDate() + daysUntilFri);
  const sun = new Date(fri);   sun.setDate(fri.getDate() + 2);
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(fri)} - ${fmt(sun)}`;
};

const WEEKEND_DEALS = [
  { id: 'wd1', name: 'Club Himalaya, by ACE Hotels Nagarkot', location: 'Nagarkot, Nepal',    img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80', score: '8.8', ratingLabel: 'Excellent',    reviewCount: 235, isGenius: true,  dealLabel: null,           discount: 18, originalPrice: 12000, dealPrice: 9840  },
  { id: 'wd2', name: 'Hotel Ganesh Himal',                    location: 'Kathmandu, Nepal',   img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80', score: '9.2', ratingLabel: 'Wonderful',    reviewCount: 320, isGenius: true,  dealLabel: 'Getaway Deal', discount: 22, originalPrice: 9500,  dealPrice: 7410  },
  { id: 'wd3', name: 'Hotel Crown Himalayas',                 location: 'Pokhara, Nepal',     img: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80', score: '9.7', ratingLabel: 'Exceptional',  reviewCount: 56,  isGenius: true,  dealLabel: null,           discount: 15, originalPrice: 18000, dealPrice: 15300 },
  { id: 'wd4', name: 'Hotel Himalayan Glacier',               location: 'Nagarkot, Nepal',    img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80', score: '8.5', ratingLabel: 'Very Good',    reviewCount: 141, isGenius: false, dealLabel: 'Getaway Deal', discount: 20, originalPrice: 8500,  dealPrice: 6800  },
  { id: 'wd5', name: 'Fishtail Lodge Pokhara',                location: 'Lakeside, Pokhara',  img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80', score: '9.0', ratingLabel: 'Superb',       reviewCount: 198, isGenius: true,  dealLabel: 'Getaway Deal', discount: 25, originalPrice: 14000, dealPrice: 10500 },
  { id: 'wd6', name: 'Tiger Tops Tharu Lodge',                location: 'Chitwan, Nepal',     img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', score: '8.9', ratingLabel: 'Excellent',    reviewCount: 87,  isGenius: false, dealLabel: null,           discount: 12, originalPrice: 22000, dealPrice: 19360 },
];

// ─── Weekend Deals Carousel ───────────────────────────────────────────────────
const WeekendDealsCarousel = ({ onBook, favHotels, toggleFav, onViewDeal }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [favLocal, setFavLocal]     = useState(favHotels || []);
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
          <button onClick={prev} disabled={currentIdx === 0}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <FaChevronLeft className="text-xs" />
          </button>
          <button onClick={next} disabled={currentIdx >= maxIdx}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <FaChevronRight className="text-xs" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex gap-4 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(calc(-${currentIdx} * (25% + 4px)))` }}
        >
          {WEEKEND_DEALS.map((deal) => (
            <div
              key={deal.id}
              className="flex-none w-[calc(25%-12px)] min-w-[220px] bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover-scale group cursor-pointer"
              onClick={() => onViewDeal && onViewDeal(deal)}
            >
              <div className="relative h-44 overflow-hidden bg-gray-800">
                <img src={deal.img} alt={deal.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { e.target.src = FALLBACK_IMGS[0]; }} />
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <FaTag className="text-[10px]" /> -{deal.discount}%
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleFav(deal.id); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-md">
                  {favLocal.includes(deal.id) ? <FaHeart className="text-xs text-red-500" /> : <FaRegHeart className="text-xs text-gray-700" />}
                </button>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {deal.isGenius && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">Genius</span>}
                  {deal.dealLabel && <span className="bg-green-600/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-sm">{deal.dealLabel}</span>}
                </div>
                <h3 className="text-white font-semibold text-sm leading-tight mb-1 line-clamp-2 group-hover:text-purple-300 transition-colors">
                  {deal.name}
                </h3>
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
                <button
                  onClick={(e) => { e.stopPropagation(); onBook && onBook(deal); }}
                  className="w-full py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-all">
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-1.5 mt-4">
        {Array.from({ length: maxIdx + 1 }).map((_, i) => (
          <button key={i} onClick={() => setCurrentIdx(i)}
            className={`rounded-full transition-all ${i === currentIdx ? 'w-4 h-1.5 bg-purple-400' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function GuestDashboard() {
  const router = useRouter();
  const [activeTab,        setActiveTab]        = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading,          setLoading]          = useState(true);

  // Search & filters
  const [searchParams, setSearchParams] = useState({
    location: '', checkIn: '2025-06-15', checkOut: '2025-06-18', guests: 2,
  });
  const [filters,        setFilters]        = useState({ roomType: 'all', rating: 0 });
  const [hotels,         setHotels]         = useState([]);
  const [hotelDetails,   setHotelDetails]   = useState({});
  const [loadingHotels,  setLoadingHotels]  = useState(false);
  const [hotelError,     setHotelError]     = useState(null);
  const [favHotels,      setFavHotels]      = useState([]);
  const [showMap,        setShowMap]        = useState(false);
  const [searchLocation, setSearchLocation] = useState('');

  // Booking state
  const [bookingStep,    setBookingStep]    = useState(null);
  const [selectedHotel,  setSelectedHotel]  = useState(null);
  const [selectedRoom,   setSelectedRoom]   = useState(null);
  const [extras,         setExtras]         = useState({ breakfast: false, airportTransfer: false });
  const [bookingDetails, setBookingDetails] = useState(null);
  const [paymentMethod,  setPaymentMethod]  = useState('card');
  const [paymentStatus,  setPaymentStatus]  = useState(null);

  // User data
  const [userBookings,  setUserBookings]  = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [tier,          setTier]          = useState('Bronze');
  const [pointsHistory, setPointsHistory] = useState([]);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [profile,       setProfile]       = useState({
    name: '', email: '', phone: '',
    preferences: { pillowType: 'Memory Foam', floorLevel: 'High' },
  });
  const [notifications, setNotifications] = useState([]);
  const [showToast,     setShowToast]     = useState(null);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const verifyToken = async () => {
    const accessToken = localStorage.getItem('guest_access_token');
    if (!accessToken) { router.push('/guest/login'); return false; }
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

  // ── Hotels ────────────────────────────────────────────────────────────────
  const fetchHotels = useCallback(async (loc = '') => {
    setLoadingHotels(true);
    setHotelError(null);
    setSearchLocation(loc);
    try {
      const url = loc
        ? `/hotels?location=${encodeURIComponent(loc)}&status=Active`
        : `/hotels?status=Active`;
      const response = await guestApi.get(url);
      const data = response.data;
      const list = Array.isArray(data) ? data : (data.results || []);
      const active = list.filter(h => h.status === 'Active');
      if (active.length === 0) {
        setHotelError('No active hotels found. Showing demo data.');
        setHotels(DEMO_HOTELS);
        DEMO_HOTELS.forEach(h => fetchHotelProfile(h.id));
      } else {
        setHotels(active);
        active.forEach(h => fetchHotelProfile(h.id));
      }
    } catch {
      setHotelError('Unable to connect to server. Showing demo hotels.');
      setHotels(DEMO_HOTELS);
      DEMO_HOTELS.forEach(h => fetchHotelProfile(h.id));
    } finally {
      setLoadingHotels(false);
    }
  }, []);

  const fetchHotelProfile = async (id) => {
    try {
      const response = await guestApi.get(`/hotels/${id}/hprofile/`);
      setHotelDetails(prev => ({ ...prev, [id]: response.data }));
    } catch {}
  };

  useEffect(() => { fetchHotels(''); }, []);

  // ── Derived hotel list ────────────────────────────────────────────────────
  const enrichedHotels = useMemo(() => hotels.map((h, idx) => {
    const p = hotelDetails[h.id] || {};
    const img       = p.image1 || h.image1 || FALLBACK_IMGS[idx % FALLBACK_IMGS.length];
    const rawScore  = p.review_score || h.review_score || null;
    const { label, color, score10 } = getRatingMeta(rawScore);
    const normalPr  = parseFloat(p.normal_price || 0) || 5000 + idx * 1000;
    const deluxePr  = parseFloat(p.deluxe_price || 0) || 8000 + idx * 1500;
    const suitePr   = parseFloat(p.suite_price  || 0) || 15000 + idx * 2000;
    const amenities = ['Free WiFi', p.has_pool && 'Swimming Pool', p.has_gym && 'Gym', p.has_restaurant && 'Restaurant', 'Air Conditioning'].filter(Boolean).slice(0, 4);
    return {
      ...h, img, score10, ratingLabel: label, ratingColor: color,
      ratingCount: p.total_reviews ? p.total_reviews.toLocaleString() : null,
      stars: p.star_rating || 4,
      priceLevel: priceLevel(normalPr / 100),
      normalPr, deluxePr, suitePr, amenities,
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
      result = result.filter(h =>
        h.fullLoc.toLowerCase().includes(q) || h.name.toLowerCase().includes(q)
      );
    }
    if (filters.rating > 0) {
      result = result.filter(h => h.score10 && parseFloat(h.score10) >= filters.rating);
    }
    return result;
  }, [enrichedHotels, searchLocation, filters.rating]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  const goToHotelInfo = (hotelId) => {
    router.push(`/guest/hotel-info/${hotelId}`);
  };

  const handleHomeClick = () => {
    setActiveTab('home');
    setSearchLocation('');
    fetchHotels('');
    setSearchParams(prev => ({ ...prev, location: '' }));
  };

  const handleDestinationClick = (destinationName) => {
    setSearchParams(prev => ({ ...prev, location: destinationName }));
    fetchHotels(destinationName);
  };

  const handleSearch  = () => fetchHotels(searchParams.location);
  const handleRefresh = () => {
    setSearchLocation('');
    fetchHotels('');
    setSearchParams(prev => ({ ...prev, location: '' }));
  };
  const toggleMap = () => setShowMap(m => !m);

  const startBooking = (hotel) => {
    setSelectedHotel(hotel);
    setBookingStep('selectDates');
    setSelectedRoom(null);
    setExtras({ breakfast: false, airportTransfer: false });
    setActiveTab('booking');
  };

  const startBookingFromDeal = (deal) => {
    const hotelLike = {
      id: deal.id, name: deal.name, img: deal.img, fullLoc: deal.location,
      normalPr: deal.dealPrice,
      deluxePr: Math.round(deal.dealPrice * 1.4),
      suitePr:  Math.round(deal.dealPrice * 2),
      score10: deal.score, ratingLabel: deal.ratingLabel,
      ratingColor: 'from-blue-600 to-blue-700',
      stars: 4, priceLevel: priceLevel(deal.dealPrice / 100),
      amenities: ['Free WiFi', 'Air Conditioning', 'Restaurant'],
      contact: '', badge: deal.dealLabel,
    };
    startBooking(hotelLike);
    toast(`Weekend deal applied! ${deal.discount}% off`, 'success');
  };

  const calcTotal = () => {
    if (!selectedHotel || !selectedRoom) return 0;
    const base = selectedRoom === 'Normal' ? selectedHotel.normalPr
               : selectedRoom === 'Deluxe' ? selectedHotel.deluxePr
               :                             selectedHotel.suitePr;
    const nights = Math.max(1, (new Date(searchParams.checkOut) - new Date(searchParams.checkIn)) / 86400000);
    let total = base * nights;
    if (extras.breakfast)       total += 3000 * nights;
    if (extras.airportTransfer) total += 5000;
    total -= promoDiscount;
    return Math.max(0, total);
  };

  const handlePayment = () => {
    setPaymentStatus('processing');
    setTimeout(() => {
      setPaymentStatus('success');
      const earned  = Math.floor(calcTotal() / 100);
      const booking = {
        id: Date.now(), hotel: selectedHotel.name, room: selectedRoom,
        checkIn: searchParams.checkIn, checkOut: searchParams.checkOut,
        status: 'confirmed', amount: calcTotal(), refundStatus: null,
      };
      setUserBookings(prev => [booking, ...prev]);
      setBookingDetails(booking);
      setBookingStep('confirmation');
      setLoyaltyPoints(p => p + earned);
      setPointsHistory(prev => [
        { date: new Date().toISOString(), points: earned, reason: `Booking at ${selectedHotel.name}` },
        ...prev,
      ]);
      setNotifications(prev => [
        { id: Date.now(), message: `Booking confirmed at ${selectedHotel.name}`, read: false, type: 'booking' },
        ...prev,
      ]);
      toast(`Booking confirmed! +${earned} loyalty points.`, 'success');
    }, 1500);
  };

  const cancelBooking = (b) => {
    if (window.confirm(`Cancel booking at ${b.hotel}?`)) {
      setUserBookings(prev =>
        prev.map(x => x.id === b.id ? { ...x, status: 'cancelled', refundStatus: 'Processing' } : x)
      );
      toast('Booking cancelled. Refund initiated.', 'warning');
    }
  };

  const toggleFav = (id) =>
    setFavHotels(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const totalBookings    = userBookings.length;
  const upcomingBookings = userBookings.filter(b => ['upcoming', 'confirmed'].includes(b.status)).length;
  const totalSpent       = userBookings.reduce((s, b) => s + b.amount, 0);

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
    { id: 'home',     name: 'Home',     icon: FaHome,          color: 'from-blue-500 to-cyan-500' },
    { id: 'booking',  name: 'Booking',  icon: FaCalendarAlt,   color: 'from-green-500 to-emerald-500' },
    { id: 'payment',  name: 'Payment',  icon: FaCreditCard,    color: 'from-purple-500 to-pink-500' },
    { id: 'bookings', name: 'Bookings', icon: FaClipboardList, color: 'from-orange-500 to-red-500' },
    { id: 'checkin',  name: 'Check-in', icon: FaCheckCircle,   color: 'from-teal-500 to-green-500' },
    { id: 'instay',   name: 'In-Stay',  icon: FaConciergeBell, color: 'from-yellow-500 to-orange-500' },
    { id: 'feedback', name: 'Feedback', icon: FaStar,          color: 'from-pink-500 to-rose-500' },
    { id: 'rewards',  name: 'Rewards',  icon: FaTrophy,        color: 'from-amber-500 to-yellow-500' },
    { id: 'offers',   name: 'Offers',   icon: FaGift,          color: 'from-red-500 to-pink-500' },
    { id: 'profile',  name: 'Profile',  icon: FaUser,          color: 'from-indigo-500 to-purple-500' },
    { id: 'alerts',   name: 'Alerts',   icon: FaBell,          color: 'from-cyan-500 to-blue-500' },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading your dashboard...</p>
      </div>
    </div>
  );

  // ── Render: Home ──────────────────────────────────────────────────────────
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

      {/* ── Hotel Grid Header ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">
          {searchLocation ? `Hotels in ${searchLocation}` : 'All Hotels'}
          {loadingHotels
            ? <span className="text-gray-400 text-sm font-normal ml-2">Loading…</span>
            : <span className="text-gray-400 text-sm font-normal ml-2">{filteredHotels.length} results</span>
          }
        </h2>
      </div>

      {/* Loading skeletons */}
      {loadingHotels && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {[1, 2, 3, 4].map(i => (
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

      {/* ── Hotel Cards ── */}
      {!loadingHotels && (
        filteredHotels.length === 0 ? (
          <div className="text-center py-14 text-gray-400 mb-8">
            <FaHotel className="text-5xl mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No hotels found {searchLocation ? `in "${searchLocation}"` : ''}</p>
            <p className="text-sm mt-1">Try a different city or check back later.</p>
            <button onClick={handleRefresh}
              className="mt-4 px-5 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-all text-sm">
              Show All Hotels
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {filteredHotels.map((hotel, idx) => (
              <div
                key={hotel.id}
                className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover-scale animate-fadeInUp group"
                style={{ animationDelay: `${idx * 0.07}s` }}
              >
                {/* ── Hotel Image ── */}
                <div
                  className="relative h-48 overflow-hidden bg-gray-800 cursor-pointer"
                  onClick={() => goToHotelInfo(hotel.id)}
                >
                  <img
                    src={hotel.img}
                    alt={hotel.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.src = FALLBACK_IMGS[idx % FALLBACK_IMGS.length]; }}
                  />
                  {hotel.badge && (
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-medium">
                      {hotel.badge}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); toast(`Sharing ${hotel.name}…`); }}
                      className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-gray-700 transition-all shadow-md">
                      <FaShareAlt className="text-xs" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFav(hotel.id); }}
                      className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-md">
                      {favHotels.includes(hotel.id)
                        ? <FaHeart className="text-xs text-red-500" />
                        : <FaRegHeart className="text-xs text-gray-700" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); startBooking(hotel); }}
                      title="Quick Book"
                      className="w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-400 flex items-center justify-center text-white transition-all shadow-md">
                      <FaPlus className="text-xs" />
                    </button>
                  </div>
                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {[0,1,2,3,4].map(i => (
                      <div key={i} className={`rounded-full ${i === 0 ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`} />
                    ))}
                  </div>
                </div>

                {/* ── Hotel Info ── */}
                <div className="p-4">
                  {/* Rating badge row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {hotel.score10
                      ? <span className={`bg-gradient-to-r ${hotel.ratingColor} text-white text-xs font-bold px-2 py-0.5 rounded-md`}>{hotel.score10} / 10.0</span>
                      : <span className="bg-gray-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">New</span>
                    }
                    <span className="text-white text-sm font-semibold">{hotel.ratingLabel}</span>
                    {hotel.ratingCount && <span className="text-gray-400 text-xs">({hotel.ratingCount} reviews)</span>}
                  </div>

                  {/* Hotel name — clickable */}
                  <h3
                    onClick={() => goToHotelInfo(hotel.id)}
                    className="text-white font-semibold text-base leading-tight mb-1 line-clamp-1
                               group-hover:text-purple-300 transition-colors cursor-pointer hover:underline"
                  >
                    {hotel.name}
                  </h3>

                  {/* Location & stars */}
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

                  {/* Amenity chips */}
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

                  {/* Action row */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-gray-400 text-sm font-semibold">{hotel.priceLevel}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => goToHotelInfo(hotel.id)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-medium transition-all border border-white/10"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => startBooking(hotel)}
                        className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                      >
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

      {/* ── Weekend Deals Carousel — BELOW all hotel cards ── */}
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

  // ── Render: Bookings ──────────────────────────────────────────────────────
  const renderBookings = () => (
    <div className="animate-fadeInUp">
      <h2 className="text-2xl font-bold text-white mb-6">My Bookings</h2>
      {userBookings.length === 0 ? (
        <div className="text-center py-14 text-gray-400">
          <FaClipboardList className="text-5xl mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No bookings yet</p>
          <p className="text-sm mt-1">Start your first booking by searching for hotels!</p>
          <button onClick={() => setActiveTab('home')}
            className="mt-4 px-5 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-all text-sm">
            Browse Hotels
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {userBookings.map(booking => (
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
                    booking.status === 'confirmed'  ? 'bg-green-500/20 text-green-400' :
                    booking.status === 'upcoming'   ? 'bg-blue-500/20 text-blue-400'  :
                    booking.status === 'cancelled'  ? 'bg-red-500/20 text-red-400'    :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {booking.status?.toUpperCase()}
                  </span>
                  {booking.status !== 'cancelled' && (
                    <button onClick={() => cancelBooking(booking)}
                      className="block mt-2 text-xs text-red-400 hover:text-red-300 transition-colors">
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

  // ── Render: Profile ───────────────────────────────────────────────────────
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

  // Placeholder tabs
  const renderPlaceholder = (label) => (
    <div className="text-gray-400 p-6 text-center">
      <p className="text-lg">{label} coming soon...</p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':     return renderHome();
      case 'booking':  return renderPlaceholder('Booking flow');
      case 'payment':  return renderPlaceholder('Payment');
      case 'bookings': return renderBookings();
      case 'checkin':  return renderPlaceholder('Check-in');
      case 'instay':   return renderPlaceholder('In-Stay services');
      case 'feedback': return renderPlaceholder('Feedback');
      case 'rewards':  return renderPlaceholder('Rewards');
      case 'offers':   return renderPlaceholder('Offers');
      case 'profile':  return renderProfile();
      case 'alerts':   return renderPlaceholder('Alerts');
      default:         return renderHome();
    }
  };

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #0a0a0a; }
        @keyframes fadeInUp  { from { opacity:0; transform:translateY(20px);  } to { opacity:1; transform:translateY(0);   } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0);   } }
        @keyframes pulseGlow { 0%,100% { opacity:.25; } 50% { opacity:.45; } }
        .animate-fadeInUp  { animation: fadeInUp  0.45s ease forwards; }
        .animate-slideDown { animation: slideDown 0.3s  ease forwards; }
        .hover-scale       { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-scale:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,.25); }
        .animate-pulse-slow { animation: pulseGlow 3s ease-in-out infinite; }
        .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
        .line-clamp-2 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        ::-webkit-scrollbar       { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#7c3aed80; border-radius:4px; }
      `}</style>

      <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">

        {/* Background glows */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/15 to-indigo-900/20" />
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-pink-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.2s' }} />
        </div>

        {/* ── Sidebar ── */}
        <aside className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-gray-900/97 via-gray-800/97 to-gray-900/97 backdrop-blur-xl text-white flex flex-col z-20 transform transition-all duration-300 shadow-2xl border-r border-white/10 ${sidebarCollapsed ? 'w-20 -translate-x-full md:translate-x-0' : 'w-72 translate-x-0'}`}>

          {/* User avatar */}
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

          {/* Brand */}
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-center gap-2">
            <FaHotel className="text-2xl text-purple-400 flex-shrink-0" />
            {!sidebarCollapsed && (
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                CloudInn
              </h2>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => item.id === 'home' ? handleHomeClick() : setActiveTab(item.id)}
                className={`group relative w-full px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-3 overflow-hidden
                  ${activeTab === item.id ? 'bg-purple-500/20 border border-purple-500/35' : 'bg-white/4 hover:bg-white/10 border border-transparent'}
                  ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <item.icon className={`text-base flex-shrink-0 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-purple-400' : 'text-gray-400'}`} />
                {!sidebarCollapsed && (
                  <>
                    <span className={`text-sm font-medium ${activeTab === item.id ? 'text-purple-200' : 'text-gray-300 group-hover:text-white'}`}>
                      {item.name}
                    </span>
                    {activeTab === item.id && item.id !== 'alerts' && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className={`w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-400 text-sm font-medium transition-all flex items-center justify-center gap-2 group ${sidebarCollapsed ? 'px-2' : ''}`}>
              <FaSignOutAlt className="group-hover:translate-x-0.5 transition-transform" />
              {!sidebarCollapsed && 'Logout'}
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} min-h-screen relative z-10`}>

          {/* Top bar */}
          <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarCollapsed(c => !c)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all flex items-center gap-2">
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
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
              {[
                { label: 'Total Bookings', value: totalBookings,                icon: FaClipboardList, color: 'from-blue-500 to-cyan-500',     badge: `${totalBookings} total` },
                { label: 'Upcoming Stays', value: upcomingBookings,             icon: FaCalendarAlt,   color: 'from-green-500 to-emerald-500',  badge: 'next 30 days' },
                { label: 'Loyalty Points', value: loyaltyPoints.toLocaleString(), icon: FaTrophy,      color: 'from-amber-500 to-yellow-500',   badge: `${tier} Tier` },
                { label: 'Total Spent',    value: `NPR ${totalSpent.toLocaleString()}`, icon: FaDollarSign, color: 'from-purple-500 to-pink-500', badge: 'lifetime' },
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

        {/* Toast */}
        {showToast && (
          <div className="fixed bottom-5 right-5 z-50 bg-gray-900 border-l-4 border-purple-500 text-white px-4 py-3 rounded-lg shadow-2xl animate-slideDown max-w-xs text-sm">
            {showToast.message}
          </div>
        )}
      </div>
    </>
  );
}