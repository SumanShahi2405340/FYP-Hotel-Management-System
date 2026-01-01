'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Added for routing
import { FaStar } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

export default function HotelProfile() {
  const router = useRouter(); // Initialize router

  const hotel = {
    name: 'Hotel Everest',
    ownername: 'Mukesh Habibulla',
    email: 'everest@example.com',
    contact: '9800000000',
    location: 'Kathmandu, Nepal',
    pannumber: '234-234-234',
    rating: 4,
  };

  const [uploadedImages, setUploadedImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('Jan');
  const [selectedYear, setSelectedYear] = useState('2026');

  const performanceData = {
    '2025': {
      Jan: [3, 4, 5], Feb: [4, 3, 5], Mar: [5, 4, 4], Apr: [3, 3, 4],
      May: [4, 5, 5], Jun: [3, 4, 4], Jul: [4, 4, 5], Aug: [5, 5, 4],
      Sep: [3, 4, 3], Oct: [4, 4, 4], Nov: [5, 3, 4], Dec: [4, 5, 5],
    },
    '2026': {
      Jan: [4, 5, 4], Feb: [5, 4, 4], Mar: [3, 4, 5], Apr: [4, 4, 4],
      May: [5, 5, 5], Jun: [4, 3, 4], Jul: [5, 4, 4], Aug: [4, 5, 5],
      Sep: [3, 4, 4], Oct: [4, 4, 5], Nov: [5, 5, 4], Dec: [4, 4, 4],
    },
  };

  const nextImage = () => {
    if (uploadedImages.length > 0) {
      setCurrentImage((currentImage + 1) % uploadedImages.length);
    }
  };

  const prevImage = () => {
    if (uploadedImages.length > 0) {
      setCurrentImage((currentImage - 1 + uploadedImages.length) % uploadedImages.length);
    }
  };

  const handleUpload = (e) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files)
        .filter(file => file.type.startsWith('image/'))
        .map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newImages]);
      setCurrentImage(0);
    }
  };

  const chartData = {
    labels: ['Week 1', 'Week 2', 'Week 3'],
    datasets: [
      {
        label: `Performance in ${selectedMonth} ${selectedYear}`,
        data: performanceData[selectedYear][selectedMonth],
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
      },
    ],
  };

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

        {/* Upload Button */}
        <div className="flex justify-end mb-2">
          <label
            htmlFor="fileUpload"
            className="cursor-pointer block text-sm font-semibold bg-white text-blue-700 px-4 py-2 rounded-full hover:bg-blue-100"
          >
            Upload Images
          </label>
          <input
            id="fileUpload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        {/* Image Carousel */}
        <div className="relative w-full h-96 mb-8">
          {uploadedImages.length > 0 ? (
            <>
              <img
                src={uploadedImages[currentImage]}
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
              No images uploaded yet
            </div>
          )}
        </div>

        {/* Hotel Info */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md space-y-2 text-white">
          <p><span className="font-semibold">Hotel Name:</span> {hotel.name}</p>

          {/* Owner Profile */}
          <div className="flex items-center gap-3">
            <p>
              <span className="font-semibold">Owner Name:</span> {hotel.ownername}
            </p>
            <button
              onClick={() => router.push('/admin/owner-profile')} // ✅ Redirect to owner profile
              className="px-3 py-1 text-xs font-medium text-white border border-white rounded bg-white/10 hover:bg-white/20 transition"
            >
              Profile
            </button>
          </div>

          <p><span className="font-semibold">Contact:</span> {hotel.contact}</p>
          <p><span className="font-semibold">Email:</span> {hotel.email}</p>
          <p><span className="font-semibold">Location:</span> {hotel.location}</p>
          <p><span className="font-semibold">Pan Number:</span> {hotel.pannumber}</p>
        </div>

        {/* Rating Stars */}
        <div className="flex justify-center mt-4">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} className={i < hotel.rating ? 'text-yellow-400' : 'text-gray-600'} />
          ))}
        </div>

        {/* Hotel Performance Chart */}
        <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Hotel Performance Chart</h2>

          {/* Month and Year Selectors */}
          <div className="flex gap-4 mb-6">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white text-black px-3 py-1 rounded"
            >
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white text-black px-3 py-1 rounded"
            >
              {['2025','2026','2027'].map(year => (
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
