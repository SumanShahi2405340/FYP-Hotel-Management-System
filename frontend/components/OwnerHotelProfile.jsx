'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaStar } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

export default function HotelProfile() {
  const router = useRouter();
  const { id } = useParams();

  const [hotel, setHotel] = useState(null);
  const [hotelImages, setHotelImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('Jan');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`http://127.0.0.1:8000/api/hotels/${id}/hprofile/`)
      .then(res => res.json())
      .then(data => {
        console.log("Fetched hotel data:", data);
        setHotel(data);
        setHotelImages([
          '/admindash1.jpg',
          '/register.jpg',
          '/hprofile3.jpg',
        ]);
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

  const performanceData = {
    '2025': {
      Jan: [3, 4, 5], Feb: [4, 3, 5], Mar: [5, 4, 4],
    },
    '2026': {
      Jan: [4, 5, 4], Feb: [5, 4, 4], Mar: [3, 4, 5],
    },
  };

  const chartData = {
    labels: ['Week 1', 'Week 2', 'Week 3'],
    datasets: [
      {
        label: `Performance in ${selectedMonth} ${selectedYear}`,
        data: performanceData[selectedYear]?.[selectedMonth] || [],
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
      },
    ],
  };

  if (loading) return <p className="text-white p-6">Loading...</p>;
  if (!hotel) return <p className="text-white p-6">Hotel not found</p>;

  return (
    <div
      className="min-h-screen text-white bg-cover bg-center"
      style={{
        backgroundImage: "url('/admindash1.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="p-6 max-w-6xl mx-auto bg-white/10 backdrop-blur-md rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center">{hotel.name}</h1>

        {/* Image Carousel */}
        <div className="relative w-full h-96 mb-8">
          {hotelImages.length > 0 ? (
            <>
              <img
                src={hotelImages[currentImage]}
                alt={`Hotel image ${currentImage + 1}`}
                className="w-full h-full object-cover rounded-lg shadow-md"
              />
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white px-3 py-1 rounded-full"
              >
                ‹
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white px-3 py-1 rounded-full"
              >
                ›
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-800 rounded-lg shadow-md text-gray-300">
              No images available
            </div>
          )}
        </div>

        {/* Hotel Info */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md space-y-2 text-white">
          <p><span className="font-semibold">Hotel Name:</span> {hotel.name}</p>
          <div className="flex items-center gap-4">
            <p><span className="font-semibold">Owner:</span> {hotel.owner || '-'}</p>
          </div>
          <p><span className="font-semibold">Hotel Contact:</span> {hotel.contact || '-'}</p>
          <p><span className="font-semibold">Email:</span> {hotel.email || '-'}</p>
          <p><span className="font-semibold">Hotel Location:</span> {hotel.location || '-'}</p>
          <p><span className="font-semibold">Pan Number:</span> {hotel.pan || '-'}</p>
        </div>

        {/* Rating Stars */}
        <div className="flex justify-center mt-4">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} className={i < (hotel.review_score || 0) ? 'text-yellow-400' : 'text-gray-600'} />
          ))}
        </div>

        {/* Hotel Performance Chart */}
        <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Hotel Performance Chart</h2>

          <div className="flex gap-4 mb-6">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white text-black px-3 py-1 rounded"
            >
              {['Jan','Feb','Mar'].map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white text-black px-3 py-1 rounded"
            >
              {['2025','2026'].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <Line data={chartData} />
        </div>
      </div>
    </div>
  );
}



