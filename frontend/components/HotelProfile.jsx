'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FaStar,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaBuilding,
  FaUser,
  FaIdCard,
  FaChevronLeft,
  FaChevronRight,
  FaWifi,
  FaParking,
  FaSwimmingPool,
  FaUtensils,
  FaDumbbell,
  FaConciergeBell,
  FaRoute,
  FaLocationArrow,
  FaSpinner,
  FaTimes,
  FaDirections,
  FaBed,
  FaChevronCircleLeft,
  FaChevronCircleRight,
  FaPause,
  FaPlay,
  FaUserTie,
  FaUsers,
  FaUnlockAlt,
  FaExclamationTriangle,
} from 'react-icons/fa';

export default function HotelProfile() {
  const router = useRouter();
  const { id } = useParams();

  const [hotel, setHotel] = useState(null);
  const [receptionists, setReceptionists] = useState([]);

  const [hotelImages, setHotelImages] = useState([
    '/admindash1.jpg',
    '/register.jpg',
    '/hprofile3.jpg',
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

  const [roomImageIndex, setRoomImageIndex] = useState({});
  const [roomAutoPlay, setRoomAutoPlay] = useState({});
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetMessageType, setResetMessageType] = useState('');

  useEffect(() => {
    if (!id) return;

    fetchHotelData();
    fetchRoomsData();
    fetchReceptionists();
  }, [id]);

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem('authToken') ||
      localStorage.getItem('access') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token');

    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const handleResetCredentials = async () => {
    if (!id) return;

    const confirmed = window.confirm(
      'Are you sure you want to reset this owner account? This will unblock the owner login and clear failed login attempts.'
    );

    if (!confirmed) return;

    setResetLoading(true);
    setResetMessage('');
    setResetMessageType('');

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/hotels/${id}/reset-owner-credentials/`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset owner credentials.');
      }

      setResetMessage(data.message || 'Owner credentials reset successfully.');
      setResetMessageType('success');

      // Refresh hotel data so the status/card information stays updated.
      fetchHotelData();
    } catch (err) {
      console.error('Failed to reset owner credentials:', err);
      setResetMessage(err.message || 'Failed to reset owner credentials.');
      setResetMessageType('error');
    } finally {
      setResetLoading(false);
    }
  };

  const fetchHotelData = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/hotels/${id}/hprofile/`);
      const data = await res.json();

      setHotel(data);

      const imgs = [data.image1, data.image2, data.image3].filter(Boolean);
      if (imgs.length > 0) setHotelImages(imgs);

      if (data.latitude && data.longitude) {
        setMapLocation({
          lat: data.latitude,
          lng: data.longitude,
          name: data.name,
          location: data.location,
        });
      } else if (data.location) {
        setMapLocation({
          address: data.location,
          name: data.name,
          location: data.location,
        });
      }
    } catch (err) {
      console.error('Failed to fetch hotel:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceptionists = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/hotels/${id}/receptionists/`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      const data = await res.json();

      if (res.ok && Array.isArray(data.receptionists)) {
        setReceptionists(data.receptionists);
      } else {
        setReceptionists([]);
      }
    } catch (err) {
      console.error('Failed to fetch receptionists:', err);
      setReceptionists([]);
    }
  };

  const fetchRoomsData = async () => {
    try {
      if (!id) {
        setRooms([]);
        return;
      }

      // IMPORTANT:
      // This admin hotel profile page is public/admin-view only, so it must not depend
      // on the blocked owner's token. The backend public views expect hotel_id.
      const inventoryUrl = `http://127.0.0.1:8000/api/room-inventory/?hotel_id=${id}`;
      const priceUrl = `http://127.0.0.1:8000/api/room-price/?hotel_id=${id}`;
      const imagesUrl = `http://127.0.0.1:8000/api/room-images/?hotel_id=${id}`;

      const [invRes, priceRes, imagesRes] = await Promise.all([
        fetch(inventoryUrl),
        fetch(priceUrl),
        fetch(imagesUrl).catch(() => null),
      ]);

      if (!invRes.ok) {
        const errorData = await invRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Room inventory request failed: ${invRes.status}`);
      }

      if (!priceRes.ok) {
        const errorData = await priceRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Room price request failed: ${priceRes.status}`);
      }

      const inv = await invRes.json();
      const prices = await priceRes.json();
      const roomImages = imagesRes && imagesRes.ok ? await imagesRes.json() : {};

      const roomsList = [];

      if (Number(inv.normal_rooms) > 0) {
        roomsList.push({
          id: 101,
          number: 101,
          room_type: 'normal',
          price: prices.normal_price,
          capacity: 2,
          images: roomImages[101] || getDefaultRoomImages('normal'),
          amenities: ['WiFi', 'Air Conditioning', 'TV', 'Mini Bar', 'Work Desk'],
          description:
            'Comfortable room with modern amenities, perfect for business travelers.',
        });
      }

      if (Number(inv.deluxe_rooms) > 0) {
        roomsList.push({
          id: 201,
          number: 201,
          room_type: 'deluxe',
          price: prices.deluxe_price,
          capacity: 3,
          images: roomImages[201] || getDefaultRoomImages('deluxe'),
          amenities: [
            'WiFi',
            'Air Conditioning',
            'TV',
            'Bathtub',
            'City View',
            'Work Desk',
            'Mini Bar',
          ],
          description:
            'Spacious deluxe room with premium furnishings and a stunning city view.',
        });
      }

      if (Number(inv.suite_rooms) > 0) {
        roomsList.push({
          id: 301,
          number: 301,
          room_type: 'suite',
          price: prices.suite_price,
          capacity: 4,
          images: roomImages[301] || getDefaultRoomImages('suite'),
          amenities: [
            'WiFi',
            'Air Conditioning',
            'TV',
            'Jacuzzi',
            'Sea View',
            'Kitchenette',
            'Private Balcony',
            'Mini Bar',
          ],
          description:
            'Luxury suite with separate living area, jacuzzi, and breathtaking sea view.',
        });
      }

      setRooms(roomsList);

      const initialIndex = {};
      const initialAutoPlay = {};

      roomsList.forEach((room) => {
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
      ],
      deluxe: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
      ],
      suite: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop',
      ],
    };

    return images[type] || images.normal;
  };

  const getRoomTypeName = (type) => {
    if (type === 'normal') return 'Normal Room';
    if (type === 'deluxe') return 'Deluxe Room';
    return 'Suite Room';
  };

  const nextRoomImage = (roomId, imagesLength) => {
    setRoomImageIndex((prev) => ({
      ...prev,
      [roomId]: (prev[roomId] + 1) % imagesLength,
    }));
  };

  const prevRoomImage = (roomId, imagesLength) => {
    setRoomImageIndex((prev) => ({
      ...prev,
      [roomId]: (prev[roomId] - 1 + imagesLength) % imagesLength,
    }));
  };

  const toggleRoomAutoPlay = (roomId) => {
    setRoomAutoPlay((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));
  };

  useEffect(() => {
    const intervals = [];

    rooms.forEach((room) => {
      if (roomAutoPlay[room.id] && room.images.length > 1) {
        const interval = setInterval(() => {
          setRoomImageIndex((prev) => ({
            ...prev,
            [room.id]: (prev[room.id] + 1) % room.images.length,
          }));
        }, 4000);

        intervals.push(interval);
      }
    });

    return () => intervals.forEach((interval) => clearInterval(interval));
  }, [rooms, roomAutoPlay]);

  const nextImage = () => {
    setCurrentImage((currentImage + 1) % hotelImages.length);
  };

  const prevImage = () => {
    setCurrentImage((currentImage - 1 + hotelImages.length) % hotelImages.length);
  };

  const getFormattedLocation = () => {
    if (!hotel) return 'Location not available';

    const location = hotel.location || '';
    const name = hotel.name || '';

    if (location && name) return `${location}, ${name}`;
    return location || name || 'Location not available';
  };

  const getMapEmbedUrl = () => {
    const query =
      mapLocation?.lat && mapLocation?.lng
        ? `${mapLocation.lat},${mapLocation.lng}`
        : formattedLocation;

    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
  };

  const openHotelMap = () => {
    const query =
      mapLocation?.lat && mapLocation?.lng
        ? `${mapLocation.lat},${mapLocation.lng}`
        : formattedLocation;

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      '_blank'
    );
  };


  const getUserLocation = () => {
    setGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setUserLocation(loc);
        setGettingLocation(false);
        setShowDirections(true);

        const dest =
          mapLocation?.lat && mapLocation?.lng
            ? `${mapLocation.lat},${mapLocation.lng}`
            : encodeURIComponent(hotel?.location || hotel?.name || '');

        setDirectionsUrl(
          `https://www.google.com/maps/dir/?api=1&origin=${loc.lat},${loc.lng}&destination=${dest}&travelmode=driving`
        );
      },
      (err) => {
        const msgs = {
          1: 'Please allow location access.',
          2: 'Location unavailable.',
          3: 'Request timed out.',
        };

        setLocationError('Unable to get your location. ' + (msgs[err.code] || ''));
        setGettingLocation(false);
        setShowDirections(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const getRoomGradient = (type) => {
    if (type === 'normal') return 'from-blue-600 to-cyan-500';
    if (type === 'deluxe') return 'from-purple-600 to-pink-500';
    return 'from-amber-600 to-orange-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent" />
          <p className="mt-4 text-white/70">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white/70">Hotel not found</div>
      </div>
    );
  }

  const firstReceptionist = receptionists[0];

  const amenities = [
    { icon: FaWifi, label: 'Free WiFi' },
    { icon: FaParking, label: 'Free Parking' },
    { icon: FaSwimmingPool, label: 'Pool' },
    { icon: FaUtensils, label: 'Restaurant' },
    { icon: FaDumbbell, label: 'Gym' },
    { icon: FaConciergeBell, label: '24hr Desk' },
  ];

  const formattedLocation = getFormattedLocation();

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@300;400;500;600;700&display=swap');

        body {
          font-family: 'Montserrat', sans-serif;
          background: #0d0d0d;
          color: #f5edd6;
        }

        .serif {
          font-family: 'Cormorant Garamond', serif;
        }

        .glass-card {
          background: rgba(10, 10, 10, 0.68);
          border: 1px solid rgba(201, 168, 76, 0.22);
          backdrop-filter: blur(20px);
          transition: border-color 0.4s, box-shadow 0.4s;
        }

        .glass-card:hover {
          border-color: rgba(201, 168, 76, 0.55);
          box-shadow: 0 0 30px -6px rgba(201, 168, 76, 0.25);
        }

        .gold-divider {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(201, 168, 76, 0.35),
            transparent
          );
          margin: 20px 0;
        }

        .same-person-card {
          min-height: 230px;
          overflow: hidden;
        }
      `}</style>

      <div className="relative min-h-screen overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800&auto=format')",
              filter: 'brightness(0.5) saturate(0.95)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />
        </div>

        <div className="relative z-10 mx-6 md:mx-12 my-8">
          <div className="max-w-7xl mx-auto rounded-2xl border-2 border-amber-500/30 bg-black/20 backdrop-blur-sm p-1">
            <div className="px-6 md:px-12 py-12">
              <div className="max-w-6xl mx-auto">
                <button
                  onClick={() => router.back()}
                  className="mb-6 inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-amber-500/30 hover:border-amber-500/60"
                >
                  <FaChevronLeft size={12} />
                  Back to Dashboard
                </button>

                <div className="text-center mb-8">
                  <h1 className="serif text-5xl md:text-6xl font-light text-white drop-shadow-lg">
                    {hotel.name}
                  </h1>

                  <div className="gold-divider w-24 mx-auto mt-4" />

                  <div className="flex justify-center gap-1 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={
                          i < (hotel.review_score || 0)
                            ? 'text-yellow-400 drop-shadow'
                            : 'text-gray-600'
                        }
                        size={18}
                      />
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-2 mb-8">
                  <div className="relative w-full h-96 overflow-hidden rounded-xl">
                    <img
                      src={hotelImages[currentImage]}
                      alt={`Hotel view ${currentImage + 1}`}
                      className="w-full h-full object-cover transition-all duration-500"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
                      }}
                    />

                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-sm"
                    >
                      <FaChevronLeft />
                    </button>

                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-sm"
                    >
                      <FaChevronRight />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {hotelImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImage(idx)}
                          className={`w-2 h-2 rounded-full transition ${
                            idx === currentImage
                              ? 'bg-amber-400 w-4'
                              : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="serif text-2xl font-light text-white mb-6">
                      Hotel Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <InfoItem Icon={FaBuilding} label="Hotel Name" value={hotel.name} />
                      <InfoItem Icon={FaPhone} label="Contact" value={hotel.contact} />
                      <InfoItem Icon={FaEnvelope} label="Email" value={hotel.email} />
                      <InfoItem Icon={FaIdCard} label="PAN Number" value={hotel.pan} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
                    <div className="xl:col-span-2 glass-card rounded-2xl p-6 h-full">
                      <h2 className="serif text-2xl font-light text-white mb-6">
                        Owner & Receptionists
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PersonCard
                          Icon={FaUser}
                          label="Owner"
                          name={hotel.owner || '—'}
                          onProfile={() => router.push(`/admin/owner-profile/${hotel.id}`)}
                        />

                        <PersonCard
                          Icon={FaUserTie}
                          label="Receptionists"
                          name={firstReceptionist?.name || 'No receptionist added'}
                          onProfile={
                            firstReceptionist
                              ? () => router.push(`/admin/receptionist-profile/${hotel.id}`)
                              : null
                          }
                        />
                      </div>

                      <div className="mt-6 rounded-xl bg-black/35 border border-amber-500/20 p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                              <FaExclamationTriangle className="text-amber-400" />
                            </div>
                            <div>
                              <h3 className="text-white font-semibold">Owner Account Access</h3>
                              <p className="text-sm text-gray-400 mt-1">
                                Use this when the owner account is blocked after repeated wrong login attempts.
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={handleResetCredentials}
                            disabled={resetLoading}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-semibold hover:from-amber-400 hover:to-yellow-500 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                          >
                            {resetLoading ? (
                              <>
                                <FaSpinner className="animate-spin" />
                                Resetting...
                              </>
                            ) : (
                              <>
                                <FaUnlockAlt />
                                Reset Credentials
                              </>
                            )}
                          </button>
                        </div>

                        {resetMessage && (
                          <div
                            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                              resetMessageType === 'success'
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}
                          >
                            {resetMessage}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 h-full">
                      <h2 className="serif text-2xl font-light text-white mb-6">
                        Quick Stats
                      </h2>

                      <div className="grid grid-cols-1 gap-4">
                        <StatRow label="Receptionists" value={receptionists.length} />
                        <StatRow label="Room Types" value={rooms.length} />
                        <StatRow label="Review Score" value={`${hotel.review_score || 'N/A'}/5`} />
                        <div className="flex justify-between items-center border-b border-white/10 pb-3 last:border-b-0">
                          <span className="text-gray-300">Status</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              hotel.status === 'Active'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {hotel.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="serif text-2xl font-light text-white mb-6">
                      Location
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                      <div className="lg:col-span-2 bg-black/30 rounded-xl p-5 border border-amber-500/20 flex flex-col justify-between gap-5">
                        <div className="flex items-start gap-3">
                          <FaMapMarkerAlt className="text-amber-400 mt-1 shrink-0" />
                          <div>
                            <p className="text-xs text-amber-400 uppercase tracking-wider">
                              Full Address
                            </p>
                            <p className="text-white font-medium leading-relaxed">
                              {formattedLocation}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={getUserLocation}
                            disabled={gettingLocation}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 shadow-lg group"
                          >
                            {gettingLocation ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaDirections />
                            )}
                            Get Location <FaRoute size={14} />
                          </button>

                          <button
                            onClick={openHotelMap}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-400 hover:bg-amber-500/30 transition"
                          >
                            <FaLocationArrow />
                            Open Map
                          </button>
                        </div>
                      </div>

                      <div className="lg:col-span-3 rounded-xl overflow-hidden border border-amber-500/25 bg-black/40 min-h-[260px]">
                        <iframe
                          title={`${hotel.name} map`}
                          src={getMapEmbedUrl()}
                          className="w-full h-[260px] lg:h-full min-h-[260px]"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="serif text-2xl font-light text-white mb-4">
                      Amenities & Services
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                      {amenities.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 bg-black/25 border border-amber-500/15 rounded-xl p-4 text-white/80"
                        >
                          <item.icon className="text-amber-400" size={16} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="serif text-2xl font-light text-white mb-4">
                      Rooms & Suites
                    </h2>

                    {rooms.length > 0 ? (
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {rooms.map((room) => (
                          <div
                            key={room.id}
                            className="rounded-xl overflow-hidden glass-card"
                          >
                            <div className="relative h-64 overflow-hidden">
                              <img
                                src={room.images[roomImageIndex[room.id] || 0]}
                                alt={`${room.room_type} room`}
                                className="w-full h-full object-cover transition-all duration-500"
                                onError={(e) => {
                                  e.target.src = getDefaultRoomImages(
                                    room.room_type
                                  )[0];
                                }}
                              />

                              {room.images.length > 1 && (
                                <>
                                  <button
                                    onClick={() =>
                                      prevRoomImage(room.id, room.images.length)
                                    }
                                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-sm"
                                  >
                                    <FaChevronCircleLeft size={20} />
                                  </button>

                                  <button
                                    onClick={() =>
                                      nextRoomImage(room.id, room.images.length)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-sm"
                                  >
                                    <FaChevronCircleRight size={20} />
                                  </button>

                                  <button
                                    onClick={() => toggleRoomAutoPlay(room.id)}
                                    className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition backdrop-blur-sm"
                                  >
                                    {roomAutoPlay[room.id] ? (
                                      <FaPause size={12} />
                                    ) : (
                                      <FaPlay size={12} />
                                    )}
                                  </button>
                                </>
                              )}

                              <div className="absolute top-3 left-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase bg-gradient-to-r ${getRoomGradient(
                                    room.room_type
                                  )} text-white shadow-lg`}
                                >
                                  {getRoomTypeName(room.room_type)}
                                </span>
                              </div>
                            </div>

                            <div className="p-5">
                              <div className="flex justify-between items-start gap-4 mb-3">
                                <div>
                                  <h3 className="text-xl font-bold text-white">
                                    {getRoomTypeName(room.room_type)}
                                  </h3>
                                  <p className="text-sm text-gray-400">
                                    Room No. {room.number}
                                  </p>
                                </div>

                                <div className="text-right shrink-0">
                                  <p className="text-2xl font-bold text-amber-400">
                                    ${room.price != null ? Number(room.price).toFixed(0) : '—'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    per night
                                  </p>
                                </div>
                              </div>

                              <p className="text-gray-300 text-sm mb-4">
                                {room.description}
                              </p>

                              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                                <FaBed className="text-amber-400 text-sm" />
                                <span className="text-xs text-gray-400">
                                  Capacity: {room.capacity} guests
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-400">
                        <FaBed size={32} className="mx-auto mb-3 opacity-30" />
                        <p>No rooms available at the moment.</p>
                      </div>
                    )}
                  </div>

                  <div className="glass-card rounded-2xl p-6 text-center">
                    <h2 className="serif text-xl font-light text-white mb-3">
                      Contact Hotel
                    </h2>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                      <p className="text-sm text-gray-300">
                        Need assistance? Reach out directly:
                      </p>

                      {hotel.contact && (
                        <a
                          href={`tel:${hotel.contact}`}
                          className="text-amber-400 hover:text-amber-300 transition"
                        >
                          <FaPhone className="inline mr-2" />
                          {hotel.contact}
                        </a>
                      )}

                      {hotel.email && (
                        <a
                          href={`mailto:${hotel.email}`}
                          className="text-amber-400 hover:text-amber-300 transition"
                        >
                          <FaEnvelope className="inline mr-2" />
                          {hotel.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDirections && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-amber-500/30">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaRoute className="text-amber-400" />
                  Directions to {hotel?.name}
                </h3>

                <button
                  onClick={() => {
                    setShowDirections(false);
                    setUserLocation(null);
                    setDirectionsUrl(null);
                    setLocationError(null);
                  }}
                  className="p-1 hover:bg-white/10 rounded-lg transition"
                >
                  <FaTimes className="text-gray-400" />
                </button>
              </div>

              {locationError ? (
                <div className="space-y-4">
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{locationError}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowDirections(false);
                      setLocationError(null);
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                  >
                    Close
                  </button>
                </div>
              ) : userLocation && directionsUrl ? (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-400 text-sm flex items-center gap-2">
                      <FaLocationArrow className="animate-pulse" />
                      Your location detected!
                    </p>

                    <p className="text-gray-300 text-xs mt-1">
                      Lat: {userLocation.lat.toFixed(6)}, Lng:{' '}
                      {userLocation.lng.toFixed(6)}
                    </p>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <p className="text-amber-400 text-sm">
                      Destination: {hotel?.name}
                    </p>

                    <p className="text-gray-300 text-xs mt-1 font-mono">
                      {formattedLocation}
                    </p>
                  </div>

                  <button
                    onClick={() => window.open(directionsUrl, '_blank')}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    <FaDirections />
                    Open Google Maps Directions
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaSpinner className="animate-spin text-amber-400 text-3xl mx-auto mb-3" />
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

function InfoItem({ Icon, label, value }) {
  return (
    <div className="min-w-0 flex items-start gap-4 rounded-xl bg-black/30 border border-amber-500/15 p-4">
      <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0">
        <Icon className="text-amber-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">
          {label}
        </p>

        <p className="text-white leading-relaxed break-words overflow-hidden">
          {value || '—'}
        </p>
      </div>
    </div>
  );
}


function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-white/10 pb-3 last:border-b-0">
      <span className="text-gray-300">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}

function PersonCard({ Icon, label, name, onProfile }) {
  return (
    <div className="same-person-card bg-black/40 border border-amber-500/25 rounded-xl p-6 flex flex-col justify-between gap-6 hover:border-amber-400/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.18)] transition-all duration-300">
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-700/30 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-lg">
          <Icon className="text-amber-400 text-3xl" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-amber-400 uppercase tracking-[0.35em] mb-2">
            {label}
          </p>

          <h3 className="text-white text-xl md:text-2xl font-semibold leading-tight break-normal whitespace-normal">
            {name}
          </h3>
        </div>
      </div>

      {onProfile && (
        <button
          onClick={onProfile}
          className="w-full py-3 rounded-lg bg-amber-500/15 border border-amber-500/45 text-amber-300 hover:bg-amber-500/25 hover:text-amber-200 hover:border-amber-400 transition text-sm font-semibold"
        >
          Profile
        </button>
      )}
    </div>
  );
}
