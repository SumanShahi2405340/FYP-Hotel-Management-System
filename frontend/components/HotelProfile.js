import { useState } from 'react';           
import { FaStar } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

//it depends on chart.js to do the actual rendering. Without chart.js, the <Line /> component can’t work, and the import fails.

export default function HotelProfile({ hotel }) {
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => setCurrentImage((currentImage + 1) % hotel.images.length);
  const prevImage = () => setCurrentImage((currentImage - 1 + hotel.images.length) % hotel.images.length);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Review Ratings',
        data: hotel.reviews,
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
      },
    ],
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{hotel.name}</h1>

      {/* Image carousel */}
      <div className="relative w-full max-w-xl mx-auto mb-4">
        <img
          src={hotel.images[currentImage]}
          alt="Hotel"
          className="w-full h-64 object-cover rounded"
        />
        <button onClick={prevImage} className="absolute left-2 top-1/2 bg-gray-700 text-white px-2 py-1 rounded">‹</button>
        <button onClick={nextImage} className="absolute right-2 top-1/2 bg-gray-700 text-white px-2 py-1 rounded">›</button>
      </div>

      {/* Hotel info */}
      <p><strong>Email:</strong> {hotel.email}</p>
      <p><strong>Contact:</strong> {hotel.contact}</p>
      <p><strong>Location:</strong> {hotel.location}</p>

      {/* Rating stars */}
      <div className="flex mt-2">
        {[...Array(5)].map((_, i) => (
          <FaStar key={i} className={i < hotel.rating ? 'text-yellow-400' : 'text-gray-300'} />
        ))}
      </div>

      {/* Reviews graph */}
      <div className="mt-6">
        <Line data={chartData} />
      </div>
    </div>
  );
}
