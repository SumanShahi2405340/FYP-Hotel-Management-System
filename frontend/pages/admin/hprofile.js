import HotelProfile from '../../components/HotelProfile';

export default function HProfilePage() {
  // Demo hotel data (later replace with API fetch or query params)
  const hotel = {
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
  };

  return <HotelProfile hotel={hotel} />;
}
