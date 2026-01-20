'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OwnerProfile() {
  const router = useRouter();
  const params = useParams();
  const id = params.id; // dynamic id from URL
  const [owner, setOwner] = useState(null);

  // Fetch owner data from backend
  useEffect(() => {
    if (id) {
      fetch(`http://localhost:8000/api/hotels/${id}/oprofile/`) //  correct endpoint
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch owner profile");
          return res.json();
        })
        .then((data) => setOwner(data))
        .catch((err) => console.error('Error fetching owner:', err));
    }
  }, [id]);

  if (!owner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading owner profile...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-cover bg-center"
      style={{
        backgroundImage: "url('/admindash1.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="bg-blue-300/90 shadow-2xl rounded-2xl w-full max-w-7xl p-8 relative backdrop-blur-sm transform -translate-y-16">
        
        {/* Top Right Buttons */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={() => router.push(`/admin/owner-profile/${id}/edit`)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow font-medium transition-transform hover:scale-105"
          >
            Edit Profile
          </button>
          <button
            onClick={() => alert('Reset credentials triggered')}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow font-medium transition-transform hover:scale-105"
          >
            Reset Credentials
          </button>
        </div>

        {/* Photo Section */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={owner.photo || '/owner-photo.jpg'} // fallback photo
            alt="Owner"
            className="w-32 h-32 rounded-full border-4 border-gray-300 shadow-lg object-cover"
          />
          <h2 className="text-2xl font-bold mt-4 text-gray-800">{owner.owner}</h2> {/*  use owner field */}
          <p className="text-gray-500">Owner</p>
        </div>

        {/* Details Section */}
        <div className="bg-blue-100/90 rounded-xl p-6 shadow-inner">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Profile Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-medium">Age:</p>
              <p>{owner.age}</p>
            </div>
            <div>
              <p className="font-medium">Email:</p>
              <p>{owner.email}</p>
            </div>
            <div>
              <p className="font-medium">Owner Contact:</p>
              <p>{owner.owner_contact}</p> {/*  corrected */}
            </div>
            <div>
              <p className="font-medium">Citizenship Number:</p>
              <p>{owner.citizenship}</p> {/*  corrected */}
            </div>
            <div>
              <p className="font-medium">Permanent Address:</p>
              <p>{owner.permanent_address}</p> {/*  corrected */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}