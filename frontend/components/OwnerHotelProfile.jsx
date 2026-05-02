'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaBuilding, FaUser, FaIdCard, 
  FaCamera, FaChevronLeft, FaChevronRight, FaWifi, FaParking, 
  FaSwimmingPool, FaUtensils, FaDumbbell, FaConciergeBell, FaRoute, FaLocationArrow,
  FaSpinner, FaTimes, FaDirections, FaCopy, FaCheck, FaPlus, FaTrash,
  FaUpload, FaBed, FaHotel, FaChevronCircleLeft, FaChevronCircleRight, FaPause, FaPlay
} from 'react-icons/fa';
import api from '../utils/api';

export default function OwnerHotelProfile() {
  const router = useRouter();
  const { id } = useParams();

  const [hotel, setHotel] = useState(null);
  const [hotelImages, setHotelImages] = useState([
    '/admindash1.jpg', '/register.jpg', '/hprofile3.jpg'
  ]);
  const [currentImage, setCurrentImage] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapLocation, setMapLocation] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [directionsUrl, setDirectionsUrl] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  // Room image carousel states
  const [roomImageIndex, setRoomImageIndex] = useState({});
  const [roomAutoPlay, setRoomAutoPlay] = useState({});

  // Image uploader
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [uploadImages, setUploadImages] = useState([null, null, null, null]);
  const [uploadPreviews, setUploadPreviews] = useState([null, null, null, null]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef0 = useRef(); const fileRef1 = useRef();
  const fileRef2 = useRef(); const fileRef3 = useRef();
  const fileRefs = [fileRef0, fileRef1, fileRef2, fileRef3];
  const carouselTimer = useRef(null);

  // Auto-slide preview every 4 seconds
  useEffect(() => {
    if (!showImageUploader) { clearInterval(carouselTimer.current); return; }
    const filled = uploadPreviews.filter(Boolean);
    if (filled.length < 2) return;
    clearInterval(carouselTimer.current);
    carouselTimer.current = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % filled.length);
    }, 4000);
    return () => clearInterval(carouselTimer.current);
  }, [showImageUploader, uploadPreviews]);

  useEffect(() => {
    if (!id) return;
    fetchHotelData();
    fetchRoomsData();
  }, [id]);

  const fetchHotelData = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/hotels/${id}/hprofile/`);
      const data = await res.json();
      setHotel(data);
      const imgs = [data.image1, data.image2, data.image3].filter(Boolean);
      if (imgs.length > 0) setHotelImages(imgs);
      if (data.latitude && data.longitude) {
        setMapLocation({ lat: data.latitude, lng: data.longitude, name: data.name, location: data.location });
      } else if (data.location) {
        setMapLocation({ address: data.location, name: data.name, location: data.location });
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch hotel:', err);
      setLoading(false);
    }
  };

  // Fetch rooms and their images from RoomImage API - Only one per type
  const fetchRoomsData = async () => {
    try {
      const [invRes, priceRes, imagesRes] = await Promise.all([
        api.get('/api/room-inventory/'),
        api.get('/api/room-price/'),
        api.get('/api/room-images/').catch(() => ({ data: {} }))
      ]);
      
      const inv = invRes.data;
      const prices = priceRes.data;
      const roomImages = imagesRes.data || {};

      // Create only one room per type (first available)
      const roomsList = [];
      
      // Normal room (first one)
      if (inv.normal_rooms > 0) {
        const roomNumber = 101;
        roomsList.push({
          id: roomNumber,
          number: roomNumber,
          room_type: 'normal',
          price: prices.normal_price,
          capacity: 2,
          images: roomImages[roomNumber] || getDefaultRoomImages('normal'),
          amenities: ['WiFi', 'Air Conditioning', 'TV', 'Mini Bar', 'Work Desk'],
          description: 'Comfortable room with modern amenities, perfect for business travelers.'
        });
      }
      
      // Deluxe room (first one)
      if (inv.deluxe_rooms > 0) {
        const roomNumber = 201;
        roomsList.push({
          id: roomNumber,
          number: roomNumber,
          room_type: 'deluxe',
          price: prices.deluxe_price,
          capacity: 3,
          images: roomImages[roomNumber] || getDefaultRoomImages('deluxe'),
          amenities: ['WiFi', 'Air Conditioning', 'TV', 'Bathtub', 'City View', 'Work Desk', 'Mini Bar'],
          description: 'Spacious deluxe room with premium furnishings and a stunning city view.'
        });
      }
      
      // Suite room (first one)
      if (inv.suite_rooms > 0) {
        const roomNumber = 301;
        roomsList.push({
          id: roomNumber,
          number: roomNumber,
          room_type: 'suite',
          price: prices.suite_price,
          capacity: 4,
          images: roomImages[roomNumber] || getDefaultRoomImages('suite'),
          amenities: ['WiFi', 'Air Conditioning', 'TV', 'Jacuzzi', 'Sea View', 'Kitchenette', 'Private Balcony', 'Mini Bar'],
          description: 'Luxury suite with separate living area, jacuzzi, and breathtaking sea view.'
        });
      }
      
      setRooms(roomsList);
      
      // Initialize carousel states for each room
      const initialIndex = {};
      const initialAutoPlay = {};
      roomsList.forEach(room => {
        initialIndex[room.id] = 0;
        initialAutoPlay[room.id] = true;
      });
      setRoomImageIndex(initialIndex);
      setRoomAutoPlay(initialAutoPlay);
      
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setRooms([]);
    }
  };

  const getDefaultRoomImages = (type) => {
    const images = {
      normal: [
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
      ],
      deluxe: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
      ],
      suite: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
      ],
    };
    return images[type] || images.normal;
  };

  const getRoomTypeName = (type) => {
    if (type === 'normal') return 'Normal Room';
    if (type === 'deluxe') return 'Deluxe Room';
    return 'Suite Room';
  };

  // Room carousel functions
  const nextRoomImage = (roomId, imagesLength) => {
    setRoomImageIndex(prev => ({
      ...prev,
      [roomId]: (prev[roomId] + 1) % imagesLength
    }));
  };

  const prevRoomImage = (roomId, imagesLength) => {
    setRoomImageIndex(prev => ({
      ...prev,
      [roomId]: (prev[roomId] - 1 + imagesLength) % imagesLength
    }));
  };

  const toggleRoomAutoPlay = (roomId) => {
    setRoomAutoPlay(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  // Auto-slide for room images
  useEffect(() => {
    const intervals = [];
    rooms.forEach(room => {
      if (roomAutoPlay[room.id] && room.images.length > 1) {
        const interval = setInterval(() => {
          setRoomImageIndex(prev => ({
            ...prev,
            [room.id]: (prev[room.id] + 1) % room.images.length
          }));
        }, 4000);
        intervals.push(interval);
      }
    });
    return () => intervals.forEach(interval => clearInterval(interval));
  }, [rooms, roomAutoPlay]);

  const nextImage = () => setCurrentImage((currentImage + 1) % hotelImages.length);
  const prevImage = () => setCurrentImage((currentImage - 1 + hotelImages.length) % hotelImages.length);

  const getFormattedLocation = () => {
    if (!hotel) return 'Location not available';
    const n = hotel.name || '', l = hotel.location || '';
    if (n && l) return `${n}, ${l}`;
    return n || l || 'Location not available';
  };

  const copyLocationToClipboard = () => {
    navigator.clipboard.writeText(getFormattedLocation()).then(() => {
      setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const getUserLocation = () => {
    setGettingLocation(true); setLocationError(null);
    if (!navigator.geolocation) { setLocationError("Geolocation not supported"); setGettingLocation(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc); setGettingLocation(false); setShowDirections(true);
        const dest = mapLocation?.lat && mapLocation?.lng
          ? `${mapLocation.lat},${mapLocation.lng}`
          : encodeURIComponent(hotel?.location || hotel?.name || '');
        setDirectionsUrl(`https://www.google.com/maps/dir/?api=1&origin=${loc.lat},${loc.lng}&destination=${dest}&travelmode=driving`);
      },
      (err) => {
        const msgs = { 1: 'Please allow location access.', 2: 'Location unavailable.', 3: 'Request timed out.' };
        setLocationError('Unable to get your location. ' + (msgs[err.code] || ''));
        setGettingLocation(false); setShowDirections(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ── Image uploader ─────────────────────────────────────────────────────
  const openImageUploader = () => {
    setUploadImages([null, null, null, null]);
    setUploadPreviews([null, null, null, null]);
    setCarouselIndex(0); setShowImageUploader(true);
  };

  const handleSlotFile = (slotIdx, e) => {
    const file = e.target.files[0]; if (!file) return;
    const newImgs = [...uploadImages]; const newPrevs = [...uploadPreviews];
    if (newPrevs[slotIdx]) URL.revokeObjectURL(newPrevs[slotIdx]);
    newImgs[slotIdx] = file; newPrevs[slotIdx] = URL.createObjectURL(file);
    setUploadImages(newImgs); setUploadPreviews(newPrevs);
    const filledSoFar = newPrevs.filter(Boolean);
    setCarouselIndex(filledSoFar.indexOf(newPrevs[slotIdx]));
  };

  const removeSlot = (slotIdx) => {
    const newImgs = [...uploadImages]; const newPrevs = [...uploadPreviews];
    if (newPrevs[slotIdx]) URL.revokeObjectURL(newPrevs[slotIdx]);
    newImgs[slotIdx] = null; newPrevs[slotIdx] = null;
    setUploadImages(newImgs); setUploadPreviews(newPrevs);
    setCarouselIndex(0);
  };

  const handleUploadImages = async () => {
    if (!uploadImages.some(Boolean)) { alert('Please select at least one image'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      ['image1','image2','image3','image4'].forEach((key, i) => {
        if (uploadImages[i]) formData.append(key, uploadImages[i]);
      });
      const res = await fetch(`http://127.0.0.1:8000/api/hotels/${id}/update/`, { method: 'PATCH', body: formData });
      if (res.ok) {
        await fetchHotelData();
        uploadPreviews.forEach(p => p && URL.revokeObjectURL(p));
        setShowImageUploader(false);
      } else { alert('Upload failed'); }
    } catch (err) { console.error(err); alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const filledPreviews = uploadPreviews.filter(Boolean);

  // ── helpers ────────────────────────────────────────────────────────────
  const getRoomGradient = (type) => {
    if (type === 'normal') return 'from-blue-600 to-cyan-500';
    if (type === 'deluxe') return 'from-purple-600 to-pink-500';
    return 'from-amber-600 to-orange-500';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent" />
        <p className="mt-4 text-white/70">Loading hotel details...</p>
      </div>
    </div>
  );
  if (!hotel) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center text-white/70">Hotel not found</div>
    </div>
  );

  const amenities = [
    { icon: FaWifi, label: 'Free WiFi' }, { icon: FaParking, label: 'Free Parking' },
    { icon: FaSwimmingPool, label: 'Pool' }, { icon: FaUtensils, label: 'Restaurant' },
    { icon: FaDumbbell, label: 'Gym' }, { icon: FaConciergeBell, label: '24hr Desk' },
  ];
  const formattedLocation = getFormattedLocation();

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
        :root{--gold:#C9A84C;--gold-light:#E8C97A;--gold-dim:rgba(201,168,76,0.18);--gold-border:rgba(201,168,76,0.35);--card-bg:rgba(10,10,10,0.68);--card-border:rgba(201,168,76,0.22);--text-primary:#F5EDD6;--text-muted:rgba(245,237,214,0.5);}
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Montserrat',sans-serif;background:#0D0D0D;color:var(--text-primary);}
        .serif{font-family:'Cormorant Garamond',serif;}
        .glass-card{background:var(--card-bg);border:1px solid var(--card-border);backdrop-filter:blur(20px);transition:border-color .4s,box-shadow .4s;}
        .glass-card:hover{border-color:rgba(201,168,76,0.55);box-shadow:0 0 30px -6px rgba(201,168,76,0.25);}
        .gold-divider{height:1px;background:linear-gradient(90deg,transparent,var(--gold-border),transparent);margin:20px 0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .5s ease forwards;}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .animate-fadeInUp{animation:fadeInUp .3s ease forwards;}
        @keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
        .slide-in{animation:slideIn .4s ease forwards;}
      `}</style>

      <div className="relative min-h-screen overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-cover bg-center"
            style={{backgroundImage:"url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800&auto=format')",filter:'brightness(0.5) saturate(0.95)'}}/>
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40"/>
        </div>

        <div className="relative z-10 mx-6 md:mx-12 my-8">
          <div className="max-w-7xl mx-auto rounded-2xl border-2 border-amber-500/30 bg-black/20 backdrop-blur-sm p-1">
            <div className="px-6 md:px-12 py-12">
              <div className="max-w-6xl mx-auto">

                <div className="mb-6">
                  <button onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-amber-500/30 hover:border-amber-500/60">
                    <FaChevronLeft size={12}/> Back to Dashboard
                  </button>
                </div>

                {/* Title + stars + Add Image */}
                <div className="text-center mb-8 fade-up" style={{animationDelay:'0.05s',opacity:0}}>
                  <h1 className="serif text-5xl md:text-6xl font-light text-white drop-shadow-lg">{hotel.name}</h1>
                  <div className="gold-divider w-24 mx-auto mt-4"/>
                  <div className="flex justify-center gap-1 mt-3">
                    {[...Array(5)].map((_,i)=>(
                      <FaStar key={i} className={i<(hotel.review_score||0)?'text-yellow-400 drop-shadow':'text-gray-600'} size={18}/>
                    ))}
                  </div>
                  <div className="mt-4">
                    <button onClick={openImageUploader}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition shadow-lg font-medium">
                      <FaPlus size={12}/> Add Image
                    </button>
                  </div>
                </div>

                {/* Main carousel */}
                <div className="glass-card rounded-2xl p-2 mb-8 fade-up" style={{animationDelay:'0.1s',opacity:0}}>
                  <div className="relative w-full h-96 overflow-hidden rounded-xl">
                    <img src={hotelImages[currentImage]} alt={`Hotel view ${currentImage+1}`}
                      className="w-full h-full object-cover transition-all duration-500"
                      onError={e=>{e.target.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';}}/>
                    <button onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-sm">
                      <FaChevronLeft/>
                    </button>
                    <button onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-sm">
                      <FaChevronRight/>
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {hotelImages.map((_,idx)=>(
                        <button key={idx} onClick={()=>setCurrentImage(idx)}
                          className={`w-2 h-2 rounded-full transition ${idx===currentImage?'bg-amber-400 w-4':'bg-white/50'}`}/>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">

                    {/* Hotel Info */}
                    <div className="glass-card rounded-2xl p-6 fade-up" style={{animationDelay:'0.15s',opacity:0}}>
                      <h2 className="serif text-2xl font-light text-white mb-4">Hotel Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {Icon:FaBuilding,label:'Hotel Name',value:hotel.name},
                          {Icon:FaUser,label:'Owner',value:hotel.owner},
                          {Icon:FaPhone,label:'Contact',value:hotel.contact},
                          {Icon:FaEnvelope,label:'Email',value:hotel.email},
                          {Icon:FaIdCard,label:'PAN Number',value:hotel.pan},
                        ].map(({Icon,label,value})=>(
                          <div key={label} className="flex items-center gap-3">
                            <Icon className="text-amber-400"/>
                            <div>
                              <p className="text-xs text-amber-400 uppercase tracking-wider">{label}</p>
                              <p className="text-white">{value||'—'}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center gap-3">
                          <FaMapMarkerAlt className="text-amber-400 cursor-pointer" onClick={()=>setShowLocationModal(true)}/>
                          <div className="flex-1 cursor-pointer" onClick={()=>setShowLocationModal(true)}>
                            <p className="text-xs text-amber-400 uppercase tracking-wider">Location</p>
                            <p className="text-white hover:text-amber-300 transition">{formattedLocation}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button onClick={getUserLocation} disabled={gettingLocation}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 shadow-lg group">
                          {gettingLocation?<FaSpinner className="animate-spin"/>:<FaDirections className="group-hover:scale-110 transition-transform"/>}
                          Get Directions <FaRoute size={14}/>
                        </button>
                        <button onClick={copyLocationToClipboard}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-400 hover:bg-amber-500/30 transition">
                          {copySuccess?<FaCheck className="text-green-400"/>:<FaCopy/>}
                          {copySuccess?'Copied!':'Copy Location'}
                        </button>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="glass-card rounded-2xl p-6 fade-up" style={{animationDelay:'0.2s',opacity:0}}>
                      <h2 className="serif text-2xl font-light text-white mb-4">Amenities & Services</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {amenities.map((item,idx)=>(
                          <div key={idx} className="flex items-center gap-3 text-white/80">
                            <item.icon className="text-amber-400" size={16}/>
                            <span className="text-sm">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rooms with Carousel - One per type */}
                    <div className="glass-card rounded-2xl p-6 fade-up" style={{animationDelay:'0.25s',opacity:0}}>
                      <h2 className="serif text-2xl font-light text-white mb-4">Rooms & Suites</h2>
                      {rooms.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                          {rooms.map(room => (
                            <div key={room.id} className="rounded-xl overflow-hidden glass-card hover:shadow-xl transition-all duration-300">
                              {/* Room Image Carousel */}
                              <div className="relative h-64 overflow-hidden">
                                <img 
                                  src={room.images[roomImageIndex[room.id] || 0]} 
                                  alt={`${room.room_type} room`}
                                  className="w-full h-full object-cover transition-all duration-500"
                                  onError={(e) => {
                                    e.target.src = getDefaultRoomImages(room.room_type)[0];
                                  }}
                                />
                                {room.images.length > 1 && (
                                  <>
                                    <button
                                      onClick={() => prevRoomImage(room.id, room.images.length)}
                                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-sm"
                                    >
                                      <FaChevronCircleLeft size={20} />
                                    </button>
                                    <button
                                      onClick={() => nextRoomImage(room.id, room.images.length)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-sm"
                                    >
                                      <FaChevronCircleRight size={20} />
                                    </button>
                                    <button
                                      onClick={() => toggleRoomAutoPlay(room.id)}
                                      className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition backdrop-blur-sm"
                                    >
                                      {roomAutoPlay[room.id] ? <FaPause size={12} /> : <FaPlay size={12} />}
                                    </button>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                      {room.images.map((_, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => setRoomImageIndex(prev => ({ ...prev, [room.id]: idx }))}
                                          className={`h-1.5 rounded-full transition-all ${
                                            idx === (roomImageIndex[room.id] || 0) 
                                              ? 'bg-amber-400 w-5' 
                                              : 'bg-white/50 w-1.5'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </>
                                )}
                                <div className="absolute top-3 left-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase bg-gradient-to-r ${getRoomGradient(room.room_type)} text-white shadow-lg`}>
                                    {getRoomTypeName(room.room_type)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h3 className="text-xl font-bold text-white">
                                      {getRoomTypeName(room.room_type)}
                                    </h3>
                                    <p className="text-sm text-gray-400">Room No. {room.number}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-amber-400">
                                      ${room.price != null ? Number(room.price).toFixed(0) : '—'}
                                    </p>
                                    <p className="text-xs text-gray-500">per night</p>
                                  </div>
                                </div>
                                
                                <p className="text-gray-300 text-sm mb-4">{room.description}</p>
                                
                                <div className="mb-3">
                                  <p className="text-xs text-amber-400 font-semibold mb-2">AMENITIES</p>
                                  <div className="flex flex-wrap gap-2">
                                    {room.amenities.slice(0, 5).map((a, i) => (
                                      <span key={i} className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-gray-300">{a}</span>
                                    ))}
                                    {room.amenities.length > 5 && (
                                      <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-gray-500">+{room.amenities.length - 5}</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                                  <FaBed className="text-amber-400 text-sm" />
                                  <span className="text-xs text-gray-400">Capacity: {room.capacity} guests</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-gray-400">
                          <FaBed size={32} className="mx-auto mb-3 opacity-30"/>
                          <p>No rooms added yet.</p>
                          <p className="text-xs mt-1 text-gray-500">Add rooms from Manage Rooms & Prices.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-8">
                    <div className="glass-card rounded-2xl p-6 text-center fade-up" style={{animationDelay:'0.15s',opacity:0}}>
                      <h2 className="serif text-xl font-light text-white mb-3">Contact Hotel</h2>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-300">Need assistance? Reach out directly:</p>
                        {hotel.contact&&<a href={`tel:${hotel.contact}`} className="block text-amber-400 hover:text-amber-300 transition"><FaPhone className="inline mr-2"/>{hotel.contact}</a>}
                        {hotel.email&&<a href={`mailto:${hotel.email}`} className="block text-amber-400 hover:text-amber-300 transition"><FaEnvelope className="inline mr-2"/>{hotel.email}</a>}
                      </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 fade-up" style={{animationDelay:'0.2s',opacity:0}}>
                      <h2 className="serif text-xl font-light text-white mb-3">Quick Stats</h2>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Room Types</span>
                          <span className="text-white font-semibold">{rooms.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Review Score</span>
                          <span className="text-white font-semibold">{hotel.review_score||'N/A'}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Status</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${hotel.status==='Active'?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>
                            {hotel.status||'Active'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 fade-up" style={{animationDelay:'0.25s',opacity:0}}>
                      <h2 className="serif text-xl font-light text-white mb-3">Location Details</h2>
                      <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition"
                        onClick={()=>setShowLocationModal(true)}>
                        <p className="text-sm text-amber-400 font-medium flex items-center gap-2"><FaMapMarkerAlt/> Full Address</p>
                        <p className="text-white text-sm mt-1 font-mono">{formattedLocation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── IMAGE UPLOADER MODAL ────────────────────────────────── */}
      {showImageUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeInUp">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-xl w-full mx-4 shadow-2xl border border-amber-500/30"
            onClick={e=>e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaCamera className="text-amber-400"/> Add Hotel Images
                </h3>
                <button onClick={()=>setShowImageUploader(false)} className="p-1 hover:bg-white/10 rounded-lg transition">
                  <FaTimes className="text-gray-400"/>
                </button>
              </div>

              {/* Auto-sliding preview — 4-second interval */}
              {filledPreviews.length > 0 && (
                <div className="mb-5 relative h-52 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                  <img key={carouselIndex} src={filledPreviews[carouselIndex]} alt="preview"
                    className="w-full h-full object-cover slide-in"/>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {filledPreviews.map((_,i)=>(
                      <button key={i} onClick={()=>setCarouselIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${i===carouselIndex?'bg-amber-400 w-6':'bg-white/40 w-1.5'}`}/>
                    ))}
                  </div>
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {carouselIndex+1}/{filledPreviews.length} · slides every 4s
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 mb-3">Select up to 4 images for your hotel gallery:</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[0,1,2,3].map(slotIdx=>(
                  <div key={slotIdx} className="relative">
                    <input ref={fileRefs[slotIdx]} type="file" accept="image/*" className="hidden"
                      onChange={e=>handleSlotFile(slotIdx,e)}/>
                    {uploadPreviews[slotIdx] ? (
                      <div className="relative group rounded-lg overflow-hidden h-28 border border-amber-500/40 cursor-pointer"
                        onClick={()=>fileRefs[slotIdx].current.click()}>
                        <img src={uploadPreviews[slotIdx]} alt={`slot ${slotIdx+1}`} className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <span className="p-1.5 bg-amber-500 rounded-full text-white"><FaUpload size={10}/></span>
                          <button onMouseDown={e=>{e.stopPropagation();removeSlot(slotIdx);}}
                            className="p-1.5 bg-red-500 rounded-full text-white"><FaTrash size={10}/></button>
                        </div>
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                          Image {slotIdx+1}
                        </span>
                      </div>
                    ) : (
                      <button onClick={()=>fileRefs[slotIdx].current.click()}
                        className="w-full h-28 border-2 border-dashed border-amber-500/30 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-amber-500/70 hover:text-amber-400 transition-all group">
                        <FaPlus size={20} className="group-hover:scale-110 transition-transform"/>
                        <span className="text-xs">Image {slotIdx+1}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={()=>setShowImageUploader(false)}
                  className="flex-1 px-4 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">
                  Cancel
                </button>
                <button onClick={handleUploadImages}
                  disabled={uploading||!uploadImages.some(Boolean)}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {uploading?<><FaSpinner className="animate-spin"/> Uploading...</>:<><FaUpload/> Save Images</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeInUp">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-amber-500/30">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><FaMapMarkerAlt className="text-amber-400"/> Location Details</h3>
                <button onClick={()=>setShowLocationModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition"><FaTimes className="text-gray-400"/></button>
              </div>
              <div className="space-y-4">
                <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30">
                  <p className="text-amber-400 text-sm font-medium mb-2">Full Address:</p>
                  <p className="text-white font-mono break-words">{formattedLocation}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={copyLocationToClipboard}
                    className="flex-1 px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-400 hover:bg-amber-500/30 transition flex items-center justify-center gap-2">
                    {copySuccess?<FaCheck/>:<FaCopy/>} {copySuccess?'Copied!':'Copy'}
                  </button>
                  <button onClick={()=>{setShowLocationModal(false);getUserLocation();}}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2">
                    <FaDirections/> Get Directions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Directions Modal */}
      {showDirections && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeInUp">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-amber-500/30">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><FaRoute className="text-amber-400"/> Directions</h3>
                <button onClick={()=>{setShowDirections(false);setUserLocation(null);setDirectionsUrl(null);setLocationError(null);}}
                  className="p-1 hover:bg-white/10 rounded-lg transition"><FaTimes className="text-gray-400"/></button>
              </div>
              {locationError?(
                <div className="space-y-4">
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4"><p className="text-red-400 text-sm">{locationError}</p></div>
                  <button onClick={()=>{setShowDirections(false);setLocationError(null);}} className="w-full px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition">Close</button>
                </div>
              ):userLocation&&directionsUrl?(
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-400 text-sm flex items-center gap-2"><FaLocationArrow className="animate-pulse"/> Your location detected!</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <p className="text-amber-400 text-sm">Destination:</p>
                    <p className="text-white text-sm mt-1 font-mono">{formattedLocation}</p>
                  </div>
                  <button onClick={()=>window.open(directionsUrl,'_blank')}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2">
                    <FaDirections/> Open Google Maps
                  </button>
                </div>
              ):(
                <div className="text-center py-8">
                  <FaSpinner className="animate-spin text-amber-400 text-3xl mx-auto mb-3"/>
                  <p className="text-gray-300">Getting your location...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}