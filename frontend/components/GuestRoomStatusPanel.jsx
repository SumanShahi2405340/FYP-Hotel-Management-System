/* ══════════════════════════════════════════════════════════════════════
   GUEST ROOM STATUS PANEL - Uses new guest-accessible endpoints
   Shows rooms exactly like receptionist panel but for guests
══════════════════════════════════════════════════════════════════════ */
const GuestRoomStatusPanel = ({ hotelId }) => {
  const [roomFilter, setRoomFilter] = useState('all');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [roomsData, setRoomsData] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [checkInMonth, setCheckInMonth] = useState(new Date().getMonth());
  const [checkInYear, setCheckInYear] = useState(new Date().getFullYear());
  const [checkOutMonth, setCheckOutMonth] = useState(new Date().getMonth());
  const [checkOutYear, setCheckOutYear] = useState(new Date().getFullYear());
  
  const pickerRefIn = useRef(null);
  const pickerRefOut = useRef(null);

  // Fetch data using NEW guest-accessible endpoints
  useEffect(() => {
    const fetchData = async () => {
      if (!hotelId) return;
      
      try {
        setDataLoading(true);
        
        // Use the new guest-accessible endpoints
        const [roomsRes, bookingsRes] = await Promise.all([
          guestApi.get(`/hotels/${hotelId}/guest-rooms/`),
          guestApi.get(`/hotels/${hotelId}/guest-bookings/`),
        ]);

        const rooms = roomsRes.data.rooms || [];
        const bookingsData = bookingsRes.data.bookings || [];
        
        setBookings(bookingsData);
        setRoomsData(rooms);
        
      } catch (error) {
        console.error('Error fetching room data for guest:', error);
        // Fallback demo data
        const demoRooms = [];
        for (let i = 1; i <= 5; i++) {
          demoRooms.push({
            id: 100 + i,
            room_number: 100 + i,
            room_type: 'Standard',
            type: 'standard',
            price_per_night: 5000,
            capacity: 2,
            bed_type: 'Queen Bed',
            amenities: ['Free WiFi', 'Air Conditioning', 'TV'],
            description: 'Comfortable standard room.',
            status: 'available'
          });
        }
        for (let i = 1; i <= 3; i++) {
          demoRooms.push({
            id: 200 + i,
            room_number: 200 + i,
            room_type: 'Deluxe',
            type: 'deluxe',
            price_per_night: 8500,
            capacity: 3,
            bed_type: 'King Bed',
            amenities: ['Free WiFi', 'Air Conditioning', 'TV', 'Mini Bar'],
            description: 'Spacious deluxe room.',
            status: 'available'
          });
        }
        for (let i = 1; i <= 2; i++) {
          demoRooms.push({
            id: 300 + i,
            room_number: 300 + i,
            room_type: 'Suite',
            type: 'suite',
            price_per_night: 15000,
            capacity: 4,
            bed_type: 'Super King Bed',
            amenities: ['Free WiFi', 'Air Conditioning', 'TV', 'Jacuzzi'],
            description: 'Luxury suite room.',
            status: 'available'
          });
        }
        setRoomsData(demoRooms);
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchData();
  }, [hotelId]);

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRefIn.current && !pickerRefIn.current.contains(e.target)) {
        setShowCheckInPicker(false);
      }
      if (pickerRefOut.current && !pickerRefOut.current.contains(e.target)) {
        setShowCheckOutPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Select date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleCheckInSelect = (year, month, day) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setCheckIn(formatted);
    setShowCheckInPicker(false);
    if (checkOut) {
      const checkOutDate = new Date(checkOut);
      const selectedDate = new Date(year, month, day);
      if (selectedDate >= checkOutDate) {
        setCheckOut('');
      }
    }
  };

  const handleCheckOutSelect = (year, month, day) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setCheckOut(formatted);
    setShowCheckOutPicker(false);
  };

  const handleSearch = async () => {
    if (!checkIn || !checkOut) { 
      alert('Please select both check-in and check-out dates'); 
      return; 
    }
    setLoading(true); 
    setSearched(true);
    try {
      const bookingsRes = await guestApi.get(`/hotels/${hotelId}/guest-bookings/`);
      const allBookings = bookingsRes.data.bookings || [];
      setBookings(allBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally { 
      setLoading(false); 
    }
  };

  // Calendar Picker Component
  const CalendarPicker = ({ type, selectedDate, onSelect, currentMonth, currentYear, setMonth, setYear, show, setShow }) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    
    const prevMonth = () => {
      if (currentMonth === 0) { setMonth(11); setYear(currentYear - 1); } 
      else { setMonth(currentMonth - 1); }
    };
    const nextMonth = () => {
      if (currentMonth === 11) { setMonth(0); setYear(currentYear + 1); } 
      else { setMonth(currentMonth + 1); }
    };
    const isDateDisabled = (year, month, day) => {
      const date = new Date(year, month, day); date.setHours(0, 0, 0, 0);
      if (date < today) return true;
      if (type === 'checkout' && checkIn) {
        const checkInDate = new Date(checkIn); checkInDate.setHours(0, 0, 0, 0);
        return date <= checkInDate;
      }
      return false;
    };
    const isSelected = (year, month, day) => {
      if (!selectedDate) return false;
      const selected = new Date(selectedDate);
      return selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
    };
    const isToday = (year, month, day) => {
      const date = new Date(year, month, day);
      return date.toDateString() === today.toDateString();
    };
    if (!show) return null;
    
    return (
      <div ref={type === 'checkin' ? pickerRefIn : pickerRefOut} className="absolute z-50 mt-1 bg-gray-900 border border-purple-500/40 rounded-xl shadow-2xl overflow-hidden" style={{ top: '100%', left: 0, minWidth: '300px' }}>
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition"><FaChevronLeft className="text-sm" /></button>
          <span className="text-white font-semibold text-base">{monthNames[currentMonth]} {currentYear}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition"><FaChevronRight className="text-sm" /></button>
        </div>
        <div className="grid grid-cols-7 px-3 pt-3">
          {dayNames.map(day => <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="h-10" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const disabled = isDateDisabled(currentYear, currentMonth, day);
            const selected = isSelected(currentYear, currentMonth, day);
            const isTodayDate = isToday(currentYear, currentMonth, day);
            return (
              <button key={day} disabled={disabled} onClick={() => { onSelect(currentYear, currentMonth, day); setShow(false); }}
                className={`h-10 rounded-lg text-sm font-medium transition-all duration-150 ${disabled ? 'text-gray-700 cursor-not-allowed bg-transparent' : 'hover:bg-purple-500/30 cursor-pointer'} ${selected ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : ''} ${isTodayDate && !selected ? 'text-purple-400 ring-1 ring-purple-500/50' : ''} ${!selected && !disabled && !isTodayDate ? 'text-gray-300 hover:text-white' : ''}`}>
                {day}
              </button>
            );
          })}
        </div>
        <button onClick={() => setShow(false)} className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-medium transition border-t border-white/10">Close</button>
      </div>
    );
  };

  // Get room status based on check-in/check-out dates
  const getRoomStatusForDates = (roomNumber, checkInDate, checkOutDate) => {
    if (!checkInDate || !checkOutDate) return { status: 'available', booking: null };
    
    const conflictingBooking = bookings.find(booking => {
      if (!booking.room) return false;
      const match = booking.room.toString().match(/\d+/);
      const bookingRoomNumber = match ? parseInt(match[0]) : null;
      if (bookingRoomNumber !== roomNumber) return false;
      
      const bookingCheckIn = new Date(booking.check_in);
      const bookingCheckOut = new Date(booking.check_out);
      const searchCheckIn = new Date(checkInDate);
      const searchCheckOut = new Date(checkOutDate);
      
      return searchCheckIn < bookingCheckOut && searchCheckOut > bookingCheckIn;
    });
    
    if (conflictingBooking) {
      const now = new Date();
      const isCurrentlyOccupied = now >= new Date(conflictingBooking.check_in) && now < new Date(conflictingBooking.check_out);
      return { 
        status: isCurrentlyOccupied ? 'occupied' : 'booked', 
        booking: conflictingBooking 
      };
    }
    return { status: 'available', booking: null };
  };

  let filteredRooms = roomsData;
  if (roomFilter !== 'all') {
    filteredRooms = roomsData.filter(r => r.room_type?.toLowerCase() === roomFilter);
  }

  const totalRooms = roomsData.length;
  let occupiedCount = 0;
  let bookedCount = 0;
  let availableCount = 0;
  
  if (searched && checkIn && checkOut) {
    filteredRooms.forEach(room => {
      const { status } = getRoomStatusForDates(room.room_number, checkIn, checkOut);
      if (status === 'occupied') occupiedCount++;
      else if (status === 'booked') bookedCount++;
      else availableCount++;
    });
  } else {
    availableCount = totalRooms;
  }
  
  const occupancyRate = searched && totalRooms > 0 ? (((occupiedCount + bookedCount) / totalRooms) * 100).toFixed(1) : 0;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'occupied': 
        return { 
          label: 'Occupied', 
          cardCls: 'border-red-500/30 bg-red-500/10', 
          iconBg: 'bg-red-500/20', 
          iconCls: 'text-red-400', 
          badgeCls: 'bg-red-500 text-white', 
          badgeIcon: <FaDoorClosed className="text-xs" />, 
          stripCls: 'bg-gradient-to-r from-red-500 to-rose-500' 
        };
      case 'booked': 
        return { 
          label: 'Booked', 
          cardCls: 'border-amber-500/30 bg-amber-500/10', 
          iconBg: 'bg-amber-500/20', 
          iconCls: 'text-amber-400', 
          badgeCls: 'bg-amber-500 text-white', 
          badgeIcon: <FaLock className="text-xs" />, 
          stripCls: 'bg-gradient-to-r from-amber-500 to-yellow-500' 
        };
      default: 
        return { 
          label: 'Available', 
          cardCls: 'border-green-500/30 bg-green-500/10', 
          iconBg: 'bg-green-500/20', 
          iconCls: 'text-green-400', 
          badgeCls: 'bg-green-500 text-white', 
          badgeIcon: <FaDoorOpen className="text-xs" />, 
          stripCls: 'bg-gradient-to-r from-green-500 to-emerald-500' 
        };
    }
  };

  if (dataLoading && roomsData.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
            <p className="text-gray-400">Loading rooms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <FaHotel className="text-purple-400" /> Room Status & Availability
        {!searched && <span className="text-xs text-gray-400 ml-2">({totalRooms} rooms total)</span>}
      </h2>
      
      <div className="bg-black/40 rounded-xl p-4 mb-8">
        <div className="flex flex-wrap gap-4 items-end">
          
          {/* Check-in Date Picker */}
          <div className="flex-1 min-w-[200px] relative">
            <label className="block text-gray-400 text-sm mb-1 flex items-center gap-1">
              <FaCalendarAlt className="text-purple-400 text-xs" /> Check-in Date *
            </label>
            <button
              onClick={() => {
                setShowCheckInPicker(!showCheckInPicker);
                setShowCheckOutPicker(false);
              }}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white text-left focus:outline-none focus:border-purple-500 flex items-center justify-between transition-all hover:bg-black/70"
            >
              <span className={checkIn ? 'text-white' : 'text-gray-400'}>
                {formatDate(checkIn)}
              </span>
              <FaCalendarAlt className="text-purple-400 text-sm" />
            </button>
            <CalendarPicker
              type="checkin"
              selectedDate={checkIn}
              onSelect={handleCheckInSelect}
              currentMonth={checkInMonth}
              currentYear={checkInYear}
              setMonth={setCheckInMonth}
              setYear={setCheckInYear}
              show={showCheckInPicker}
              setShow={setShowCheckInPicker}
            />
          </div>
          
          {/* Check-out Date Picker */}
          <div className="flex-1 min-w-[200px] relative">
            <label className="block text-gray-400 text-sm mb-1 flex items-center gap-1">
              <FaCalendarAlt className="text-purple-400 text-xs" /> Check-out Date *
            </label>
            <button
              onClick={() => {
                if (!checkIn) {
                  alert('Please select check-in date first');
                  return;
                }
                setShowCheckOutPicker(!showCheckOutPicker);
                setShowCheckInPicker(false);
              }}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white text-left focus:outline-none focus:border-purple-500 flex items-center justify-between transition-all hover:bg-black/70"
            >
              <span className={checkOut ? 'text-white' : 'text-gray-400'}>
                {formatDate(checkOut)}
              </span>
              <FaCalendarAlt className="text-purple-400 text-sm" />
            </button>
            <CalendarPicker
              type="checkout"
              selectedDate={checkOut}
              onSelect={handleCheckOutSelect}
              currentMonth={checkOutMonth}
              currentYear={checkOutYear}
              setMonth={setCheckOutMonth}
              setYear={setCheckOutYear}
              show={showCheckOutPicker}
              setShow={setShowCheckOutPicker}
            />
          </div>
          
          {/* Guests */}
          <div className="w-[130px]">
            <label className="block text-gray-400 text-sm mb-1 flex items-center gap-1">
              <FaUsers className="text-purple-400 text-xs" /> Guests
            </label>
            <input 
              type="number" 
              min="1" 
              max="10" 
              value={guests} 
              onChange={e => setGuests(parseInt(e.target.value) || 1)} 
              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          
          {/* Search Button */}
          <button 
            onClick={handleSearch} 
            disabled={loading || !checkIn || !checkOut} 
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />} 
            {loading ? 'Checking...' : 'Check Availability'}
          </button>
        </div>
      </div>
      
      {searched && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Rooms', value: totalRooms, icon: FaBed, color: 'from-blue-500/20 to-blue-600/20', textCls: 'text-blue-300', iconCls: 'text-blue-400' },
              { label: 'Available', value: availableCount, icon: FaDoorOpen, color: 'from-green-500/20 to-green-600/20', textCls: 'text-green-300', iconCls: 'text-green-400' },
              { label: 'Occupied', value: occupiedCount, icon: FaDoorClosed, color: 'from-red-500/20 to-red-600/20', textCls: 'text-red-300', iconCls: 'text-red-400' },
              { label: 'Booked', value: bookedCount, icon: FaLock, color: 'from-amber-500/20 to-yellow-600/20', textCls: 'text-amber-300', iconCls: 'text-amber-400' },
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
          
          {/* Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FaFilter className="text-purple-400" />
              <span className="text-sm text-gray-300">Filter by room type:</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {['all', 'standard', 'deluxe', 'suite'].map(type => (
                <button 
                  key={type} 
                  onClick={() => setRoomFilter(type)} 
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    roomFilter === type 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {type === 'all' ? 'All Rooms' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex gap-4 mb-4 text-xs flex-wrap">
            <span className="flex items-center gap-1 text-green-400"><FaDoorOpen /> Available — free to book</span>
            <span className="flex items-center gap-1 text-amber-400"><FaLock /> Booked — upcoming reservation</span>
            <span className="flex items-center gap-1 text-red-400"><FaDoorClosed /> Occupied — currently checked in</span>
          </div>
          
          {/* Room Cards Grid - Similar to receptionist panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map(room => {
              const { status, booking: activeBooking } = getRoomStatusForDates(room.room_number, checkIn, checkOut);
              const cfg = getStatusConfig(status);
              
              return (
                <div 
                  key={room.id} 
                  className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer ${cfg.cardCls}`}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-3 rounded-xl ${cfg.iconBg}`}>
                        <FaBed className={`text-2xl ${cfg.iconCls}`} />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.badgeCls}`}>
                        <span className="flex items-center gap-1">{cfg.badgeIcon} {cfg.label}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{room.room_type} Room</h3>
                    <p className="text-gray-400 text-sm mb-3">{room.bed_type || 'Comfortable Bed'}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Capacity:</span>
                        <span className="font-semibold text-white flex items-center gap-1">
                          <FaUsers className="text-purple-400 text-xs" /> Up to {room.capacity} guests
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Price / Night:</span>
                        <span className="font-bold text-purple-400">{formatNPR(room.price_per_night)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(room.amenities || ['WiFi', 'AC', 'TV']).slice(0, 3).map((amenity, idx) => (
                          <span key={idx} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-300">
                            {amenity}
                          </span>
                        ))}
                        {(room.amenities?.length || 3) > 3 && (
                          <span className="text-xs text-gray-500">+{(room.amenities?.length || 3) - 3}</span>
                        )}
                      </div>
                      
                      {status !== 'available' && activeBooking && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                          {status === 'booked' && (
                            <p className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                              <FaLock className="text-[10px]" /> Reserved
                            </p>
                          )}
                          {status === 'occupied' && (
                            <p className="text-xs font-semibold text-red-400">Currently checked in</p>
                          )}
                          {activeBooking.check_in && (
                            <p className="text-xs text-gray-400">
                              Check-in: {new Date(activeBooking.check_in).toLocaleDateString()}
                            </p>
                          )}
                          {activeBooking.check_out && (
                            <p className="text-xs text-gray-400">
                              Check-out: {new Date(activeBooking.check_out).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {status === 'available' && (
                    <button className="absolute bottom-3 right-3 bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-all duration-200 shadow-lg hover:scale-110" title="Book Now">
                      <FaPlus className="text-xs" />
                    </button>
                  )}
                  
                  {status !== 'available' && (
                    <div className="absolute bottom-3 right-3 opacity-50">
                      {status === 'occupied' ? 
                        <FaDoorClosed className="text-red-400 text-lg" /> : 
                        <FaLock className="text-amber-400 text-lg" />
                      }
                    </div>
                  )}
                  
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${cfg.stripCls}`} />
                </div>
              );
            })}
          </div>
          
          {filteredRooms.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <FaBed className="text-4xl mx-auto mb-2 opacity-50" />
              <p>No rooms found for the selected filter.</p>
            </div>
          )}
          
          {/* Occupancy Rate Bar */}
          <div className="mt-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-300">Occupancy Rate (booked + occupied)</span>
              <span className="text-sm font-semibold text-white">{occupancyRate}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500" 
                style={{ width: `${occupancyRate}%` }} 
              />
            </div>
          </div>
        </>
      )}
      
      {!searched && (
        <div className="text-center text-gray-400 py-12">
          <FaCalendarAlt className="text-5xl mx-auto mb-3 opacity-50" />
          <p className="text-lg">Select check-in and check-out dates to see real-time room availability</p>
          <p className="text-sm mt-1">Click the date fields above to choose your travel dates</p>
        </div>
      )}
    </div>
  );
};