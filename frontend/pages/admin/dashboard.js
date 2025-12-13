// import AdminDashboard from '../../components/AdminDashboard';

// export default function DashboardPage() {
//   return <AdminDashboard />;
// }


import { useRouter } from 'next/router';
import HotelProfile from '../../components/HotelProfile';

export default function HProfilePage() {
  const router = useRouter();
  const { id } = router.query;

  // Demo hotel data (later replace with API fetch)
  const hotels = {
    1: {
      name: 'Hotel Everest',
      email: 'everest@example.com',
      contact: '9800000000',
      location: 'Kathmandu, Nepal',
      rating: 4,
      images: [
        'https://via.placeholder.com/600x300?text=Hotel+Front',
        'https://via.placeholder.com/600x300?text=Hotel+Lobby',
        'https://via.placeholder.com/600x300?text=Hotel+Room',
      ],
      reviews: [3, 4, 5, 4, 5, 4, 3],
    },
    2: {
      name: 'Hotel Sunshine',
      email: 'sunshine@example.com',
      contact: '9811111111',
      location: 'Pokhara, Nepal',
      rating: 5,
      images: [
        'https://via.placeholder.com/600x300?text=Hotel+Front',
        'https://via.placeholder.com/600x300?text=Hotel+Pool',
        'https://via.placeholder.com/600x300?text=Hotel+Room',
      ],
      reviews: [4, 5, 5, 5, 4, 5, 5],
    },
  };

  const hotel = hotels[id];

  if (!hotel) return <p>Loading hotel data...</p>;

  return <HotelProfile hotel={hotel} />;
}
