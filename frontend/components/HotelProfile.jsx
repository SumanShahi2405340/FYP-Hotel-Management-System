'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaBuilding, FaUser, FaIdCard, FaCamera, FaChevronLeft, FaChevronRight, FaExternalLinkAlt, FaWifi, FaParking, FaSwimmingPool, FaUtensils, FaDumbbell, FaConciergeBell } from 'react-icons/fa';

export default function HotelProfile() {
  const router = useRouter();
  const { id } = useParams();

  const [hotel, setHotel] = useState(null);
  const [hotelImages, setHotelImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [mapLocation, setMapLocation] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch(`http://127.0.0.1:8000/api/hotels/${id}/hprofile/`)
      .then(res => res.json())
      .then(data => {
        console.log("Fetched hotel data:", data);
        setHotel(data);
        // Use provided images or fallback
        setHotelImages([
          data.image1 || '/admindash1.jpg',
          data.image2 || '/register.jpg',
          data.image3 || '/hprofile3.jpg',
        ].filter(Boolean));
        
        // If hotel has rooms data, set it (assuming API returns rooms array)
        if (data.rooms && Array.isArray(data.rooms)) {
          setRooms(data.rooms);
        } else {
          // Fallback sample rooms for demonstration
          setRooms([
            { id: 1, name: 'Deluxe Suite', price: 120, image: '/room1.jpg', capacity: 2, amenities: ['King Bed', 'Ocean View'] },
            { id: 2, name: 'Executive Room', price: 95, image: '/room2.jpg', capacity: 2, amenities: ['Queen Bed', 'City View'] },
            { id: 3, name: 'Family Suite', price: 180, image: '/room3.jpg', capacity: 4, amenities: ['Two Double Beds', 'Living Area'] },
          ]);
        }
        
        // Set map location from hotel data
        if (data.latitude && data.longitude) {
          setMapLocation({ lat: data.latitude, lng: data.longitude, name: data.name, location: data.location });
        } else if (data.location) {
          setMapLocation({ address: data.location, name: data.name, location: data.location });
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch hotel:', err);
        setLoading(false);
      });
  }, [id]);

  const nextImage = () => {
    if (hotelImages.length > 0) {
      setCurrentImage((currentImage + 1) % hotelImages.length);
    }
  };

  const prevImage = () => {
    if (hotelImages.length > 0) {
      setCurrentImage((currentImage - 1 + hotelImages.length) % hotelImages.length);
    }
  };

  const openMap = () => {
    // Create search query: Location + Hotel Name for better results
    let searchQuery = '';
    let mapUrl = '';
    
    const hotelName = hotel?.name || '';
    const hotelLocation = hotel?.location || '';
    
    // Format: "Location, Hotel Name" - this helps Google Maps find the exact location
    if (hotelLocation && hotelName) {
      searchQuery = `${hotelLocation}, ${hotelName}`;
    } else if (hotelLocation) {
      searchQuery = hotelLocation;
    } else if (hotelName) {
      searchQuery = hotelName;
    } else {
      searchQuery = 'Hotel location';
    }
    
    // If we have coordinates, use them for exact location with search query
    if (mapLocation?.lat && mapLocation?.lng) {
      // This format: q=search query + coordinates for exact positioning
      mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(searchQuery)}&ll=${mapLocation.lat},${mapLocation.lng}&z=16`;
    } else {
      // Just search with the query
      mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(searchQuery)}`;
    }
    
    console.log('Opening map with search:', searchQuery);
    console.log('Map URL:', mapUrl);
    
    // Open the map URL
    window.open(mapUrl, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
        <p className="mt-4 text-white/70">Loading hotel details...</p>
      </div>
    </div>
  );
  
  if (!hotel) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center text-white/70">Hotel not found</div>
    </div>
  );

  // Sample amenities list (you can map from hotel data if available)
  const amenities = [
    { icon: FaWifi, label: 'Free WiFi' },
    { icon: FaParking, label: 'Free Parking' },
    { icon: FaSwimmingPool, label: 'Outdoor Pool' },
    { icon: FaUtensils, label: 'Restaurant' },
    { icon: FaDumbbell, label: 'Fitness Center' },
    { icon: FaConciergeBell, label: '24hr Front Desk' },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
        :root {
          --gold: #C9A84C;
          --gold-light: #E8C97A;
          --gold-dim: rgba(201,168,76,0.18);
          --gold-border: rgba(201,168,76,0.35);
          --card-bg: rgba(10,10,10,0.68);
          --card-border: rgba(201,168,76,0.22);
          --text-primary: #F5EDD6;
          --text-muted: rgba(245,237,214,0.5);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Montserrat', sans-serif; background: #0D0D0D; color: var(--text-primary); }
        .serif { font-family: 'Cormorant Garamond', serif; }
        .glass-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          backdrop-filter: blur(20px);
          transition: border-color 0.4s ease, box-shadow 0.4s ease;
        }
        .glass-card:hover {
          border-color: rgba(201,168,76,0.55);
          box-shadow: 0 0 30px -6px rgba(201,168,76,0.25);
        }
        .gold-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold-border), transparent);
          margin: 20px 0;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up {
          animation: fadeUp 0.5s ease forwards;
        }
      `}</style>

      {/* Main Container - With visible border to show its boundaries */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Background Image */}
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800&auto=format')",
              filter: 'brightness(0.5) saturate(0.95)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40" />
        </div>

        {/* Transparent Outer Container with visible border - Shows the container boundaries */}
        <div className="relative z-10 mx-6 md:mx-12 my-8">
          <div className="max-w-7xl mx-auto rounded-2xl border-2 border-amber-500/30 bg-black/20 backdrop-blur-sm p-1">
            <div className="px-6 md:px-12 py-12">
              <div className="max-w-6xl mx-auto">
                {/* Back Button */}
                <button
                  onClick={() => router.back()}
                  className="mb-6 inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-amber-500/30 hover:border-amber-500/60"
                >
                  <FaChevronLeft size={12} /> Back to Dashboard
                </button>

                {/* Hotel Header */}
                <div className="text-center mb-8 fade-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
                  <h1 className="serif text-5xl md:text-6xl font-light text-white drop-shadow-lg">{hotel.name}</h1>
                  <div className="gold-divider w-24 mx-auto mt-4" />
                  <div className="flex justify-center gap-1 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={i < (hotel.review_score || 0) ? 'text-yellow-400 drop-shadow' : 'text-gray-600'} size={18} />
                    ))}
                  </div>
                </div>

                {/* Image Carousel */}
                <div className="glass-card rounded-2xl p-2 mb-8 fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                  <div className="relative w-full h-96 overflow-hidden rounded-xl">
                    {hotelImages.length > 0 ? (
                      <>
                        <img
                          src={hotelImages[currentImage]}
                          alt={`Hotel view ${currentImage + 1}`}
                          className="w-full h-full object-cover transition-all duration-500"
                        />
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-sm"
                        >
                          <FaChevronLeft />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition backdrop-blur-sm"
                        >
                          <FaChevronRight />
                        </button>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                          {hotelImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImage(idx)}
                              className={`w-2 h-2 rounded-full transition ${
                                idx === currentImage ? 'bg-amber-400 w-4' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-black/50 text-gray-300">
                        <FaCamera size={40} />
                        <span className="ml-2">No images available</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Info Card */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Hotel Details */}
                    <div className="glass-card rounded-2xl p-6 fade-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
                      <h2 className="serif text-2xl font-light text-white mb-4">Hotel Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <FaBuilding className="text-amber-400" />
                          <div>
                            <p className="text-xs text-amber-400 uppercase tracking-wider">Hotel Name</p>
                            <p className="text-white">{hotel.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <FaUser className="text-amber-400" />
                          <div>
                            <p className="text-xs text-amber-400 uppercase tracking-wider">Owner</p>
                            <p className="text-white">{hotel.owner || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <FaPhone className="text-amber-400" />
                          <div>
                            <p className="text-xs text-amber-400 uppercase tracking-wider">Contact</p>
                            <p className="text-white">{hotel.contact || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <FaEnvelope className="text-amber-400" />
                          <div>
                            <p className="text-xs text-amber-400 uppercase tracking-wider">Email</p>
                            <p className="text-white">{hotel.email || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <FaMapMarkerAlt className="text-amber-400" />
                          <div>
                            <p className="text-xs text-amber-400 uppercase tracking-wider">Location</p>
                            <p className="text-white">{hotel.location || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <FaIdCard className="text-amber-400" />
                          <div>
                            <p className="text-xs text-amber-400 uppercase tracking-wider">PAN Number</p>
                            <p className="text-white">{hotel.pan || '—'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Map Button with Hotel Name */}
                      <div className="mt-6">
                        <button
                          onClick={openMap}
                          className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-400 hover:bg-amber-500/30 transition backdrop-blur-sm group"
                        >
                          <FaMapMarkerAlt className="group-hover:scale-110 transition-transform" /> 
                          View {hotel.name} on Map 
                          <FaExternalLinkAlt size={10} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="text-xs text-amber-400/50 mt-2 ml-1">
                          Opens Google Maps with: <span className="font-mono text-amber-400/70">"{hotel.location || ''}, {hotel.name}"</span>
                        </p>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="glass-card rounded-2xl p-6 fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                      <h2 className="serif text-2xl font-light text-white mb-4">Amenities & Services</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {amenities.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-white/80">
                            <item.icon className="text-amber-400" size={16} />
                            <span className="text-sm">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rooms Section */}
                    <div className="glass-card rounded-2xl p-6 fade-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
                      <h2 className="serif text-2xl font-light text-white mb-4">Rooms & Suites</h2>
                      {rooms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {rooms.map((room) => (
                            <div key={room.id} className="bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-amber-500/30 transition backdrop-blur-sm">
                              <div className="h-48 overflow-hidden">
                                <img src={room.image} alt={room.name} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                              </div>
                              <div className="p-4">
                                <h3 className="font-semibold text-white">{room.name}</h3>
                                <p className="text-sm text-gray-300 mt-1">Capacity: {room.capacity} guests</p>
                                <p className="text-amber-400 font-bold mt-2">${room.price}/night</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {room.amenities?.map((item, i) => (
                                    <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300">{item}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-300">No room information available.</p>
                      )}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-8">
                    {/* Contact Card */}
                    <div className="glass-card rounded-2xl p-6 text-center fade-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
                      <h2 className="serif text-xl font-light text-white mb-3">Contact Hotel</h2>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-300">Need assistance? Reach out directly:</p>
                        {hotel.contact && (
                          <a href={`tel:${hotel.contact}`} className="block text-amber-400 hover:text-amber-300 transition">
                            <FaPhone className="inline mr-2" /> {hotel.contact}
                          </a>
                        )}
                        {hotel.email && (
                          <a href={`mailto:${hotel.email}`} className="block text-amber-400 hover:text-amber-300 transition">
                            <FaEnvelope className="inline mr-2" /> {hotel.email}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="glass-card rounded-2xl p-6 fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                      <h2 className="serif text-xl font-light text-white mb-3">Quick Stats</h2>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Total Rooms</span>
                          <span className="text-white font-semibold">{rooms.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Review Score</span>
                          <span className="text-white font-semibold">{hotel.review_score || 'N/A'}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Status</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${hotel.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {hotel.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Location Info Card */}
                    <div className="glass-card rounded-2xl p-6 fade-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
                      <h2 className="serif text-xl font-light text-white mb-3">Location Details</h2>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-300 flex items-start gap-2">
                          <FaMapMarkerAlt className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <span>{hotel.location || 'Address not available'}</span>
                        </p>
                        <div className="mt-3 p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
                          <p className="text-xs text-amber-400/80 font-mono">
                            🔍 Search format: <strong>"{hotel.location || ''}, {hotel.name}"</strong>
                          </p>
                          <p className="text-xs text-amber-400/60 mt-1">
                            ✓ Google Maps will automatically search for this exact location
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}