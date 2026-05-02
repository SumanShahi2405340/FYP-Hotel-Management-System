'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with localStorage / useParams
const HotelInfo = dynamic(() => import('@/components/HotelInfo'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading hotel details...</p>
      </div>
    </div>
  ),
});

export default function HotelInfoPage() {
  const params = useParams();
  const id = params?.id;

  if (!id) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-400">Invalid hotel ID</p>
      </div>
    );
  }

  return <HotelInfo id={id} />;
}