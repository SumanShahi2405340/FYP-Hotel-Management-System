// components/FilterHotels.jsx
import { FaSearch, FaMapMarkedAlt, FaSync } from 'react-icons/fa';

// 🏞️ Authentic images for each destination from free, reliable sources
const NEARBY_PLACES = [
  {
    name: 'Kathmandu',
    dist: '1.4 km',
    // Dharahara Tower - Reconstructed tower in Sundhara, Kathmandu[reference:0]
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Kathmandu_-_panoramio_%282%29.jpg/1920px-Kathmandu_-_panoramio_%282%29.jpg',
  },
  {
    name: 'Pokhara',
    dist: '197 km',
    img: 'https://i.imgur.com/CAkyO1u.jpeg', // Lakeside view
  },
  {
    name: 'Bhaktapur',
    dist: '11 km',
    // Changunarayan Temple - Ancient temple on a hilltop near Bhaktapur[reference:2]
    img: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Changunarayan_Temple_Changunarayan_Bhaktapur_Nepal_Rajesh_Dhungana_%2812%29.jpg',
  },
  {
    name: 'Lalitpur',
    dist: '5 km',
    img: 'https://wallpaperaccess.com/full/25793232.jpg', // Patan Durbar Square
  },
  {
    name: 'Nepalgunj',
    dist: '520 km',
    img: 'https://lh3.googleusercontent.com/gps-cs-s/APNQkAEl90NiOsNIYTRGyf0zm_1Iwf0LeFr0B-YOqrIJXLTyW3GMX_0gF3dfqtJETuYyOk0GbQh_CP2gn4RfR88K4h3lrTLwY73mTQOrUkrGv02mHcRI3uYs3xMYVc-YydnP6aX-bjJWLg=s1360-w1360-h1020-rw', // City life image, 
  },
  {
    name: 'Biratnagar',
    dist: '400 km',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Biratnagar_Eye_Hospital_2.jpg/3840px-Biratnagar_Eye_Hospital_2.jpg', // Generic Nepal mountains
  },
  {
    name: 'Chitwan',
    dist: '148 km',
    img: 'https://wallpaperaccess.com/full/25749148.jpg', // Elephant safari
  },
  {
    name: 'Lumbini',
    dist: '280 km',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/The_World_Peace_Pagoda_-_Lumbini.jpg/330px-The_World_Peace_Pagoda_-_Lumbini.jpg', // Generic Nepal mountains
  },
  {
    name: 'Nagarkot',
    dist: '32 km',
    img: 'https://wallpaperaccess.com/full/25740149.jpg', // Himalayan sunrise
  },
  {
    name: 'Dharan',
    dist: '370 km',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Dharan_Clock_tower.jpg/960px-Dharan_Clock_tower.jpg', // Dhurandhar hill area
  },
  {
      name: 'Janakpur',
    dist: '230 km',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Janki_Mandir.JPG/1920px-Janki_Mandir.JPG', // Janaki Temple (high-res)
  },
  {
    name: 'Mustang',
    dist: '340 km',
    img: 'https://wallpaperaccess.com/full/166021.jpg', // Generic Nepal mountains
  },
];

export default function FilterHotels({
  searchParams,
  setSearchParams,
  filters,
  setFilters,
  onSearch,
  onRefresh,
  onMapToggle,
  showMap,
  loadingHotels,
  onSelectDestination,
}) {
  return (
    <div>
      {/* Search Form */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 mb-7">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="City or area…"
              value={searchParams.location}
              onChange={(e) => setSearchParams((p) => ({ ...p, location: e.target.value }))}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2 pl-9 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <input
            type="date"
            value={searchParams.checkIn}
            onChange={(e) => setSearchParams((p) => ({ ...p, checkIn: e.target.value }))}
            className="bg-black/30 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
          />
          <input
            type="date"
            value={searchParams.checkOut}
            onChange={(e) => setSearchParams((p) => ({ ...p, checkOut: e.target.value }))}
            className="bg-black/30 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
          />
          <input
            type="number"
            min="1"
            value={searchParams.guests}
            placeholder="Guests"
            onChange={(e) => setSearchParams((p) => ({ ...p, guests: e.target.value }))}
            className="bg-black/30 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex gap-3 mt-3 flex-wrap items-center">
          <button
            onClick={onSearch}
            className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2"
          >
            <FaSearch className="text-xs" /> Search
          </button>
          <select
            onChange={(e) => setFilters((f) => ({ ...f, rating: parseFloat(e.target.value) }))}
            className="bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="0">Any Rating</option>
            <option value="7">7+ Score</option>
            <option value="8">8+ Score</option>
            <option value="9">9+ Score</option>
          </select>
          <button
            onClick={onMapToggle}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all flex items-center gap-2"
          >
            <FaMapMarkedAlt /> {showMap ? 'Hide Map' : 'Map'}
          </button>
          <button
            onClick={onRefresh}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-all flex items-center gap-2"
          >
            <FaSync className={loadingHotels ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Explore Destinations Grid */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-white mb-4">Explore Destinations</h2>
        <div className="grid grid-cols-6 lg:grid-cols-12 gap-2.5">
          {NEARBY_PLACES.map((place, idx) => (
            <button
              key={idx}
              onClick={() => onSelectDestination(place.name)}
              className="group flex flex-col items-center gap-1.5 hover-scale"
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-transparent group-hover:border-purple-400 transition-all duration-200 bg-gray-800">
                <img
                  src={place.img}
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    // Ultimate fallback: show a gradient with first letter
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    parent.style.background = 'linear-gradient(135deg,#6366f1,#a855f7)';
                    parent.style.display = 'flex';
                    parent.style.alignItems = 'center';
                    parent.style.justifyContent = 'center';
                    parent.innerHTML = `
                      <div class="text-center">
                        <div class="text-white text-2xl font-bold">${place.name.charAt(0)}</div>
                        <div class="text-white/70 text-xs mt-1">🏔️</div>
                      </div>
                    `;
                  }}
                />
              </div>
              <p className="text-white text-xs font-semibold leading-tight text-center">{place.name}</p>
              <p className="text-gray-500 text-xs">{place.dist}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}