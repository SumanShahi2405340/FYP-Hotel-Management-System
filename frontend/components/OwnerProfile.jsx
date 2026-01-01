'use client';
import { useRouter } from 'next/navigation';

export default function OwnerProfile() {
  const router = useRouter();

  return (
    //main conatainer
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-cover bg-center"
      style={{
        backgroundImage: "url('/admindash1.jpg')", // Replace with your background image path
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}       
    >
       {/* Second Last Container */}
      <div className="bg-blue-300/90 shadow-2xl rounded-2xl w-full max-w-7xl p-8 relative backdrop-blur-sm transform -translate-y-16">
        
        {/* Top Right Buttons */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={() => router.push('/admin/edit-owner')}
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
            src="/owner-photo.jpg" // replace with actual photo path
            alt="Owner"
            className="w-32 h-32 rounded-full border-4 border-gray-300 shadow-lg object-cover"
          />
          <h2 className="text-2xl font-bold mt-4 text-gray-800">Owner Name</h2>
          <p className="text-gray-500">Owner</p>
        </div>

        {/* Details Section */}
        <div className="bg-blue-100/90 rounded-xl p-6 shadow-inner">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Profile Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-medium">Age:</p>
              <p>32</p>
            </div>
            <div>
              <p className="font-medium">Email:</p>
              <p>owner@example.com</p>
            </div>
            <div>
              <p className="font-medium">Contact:</p>
              <p>+977-9800000000</p>
            </div>
             <div>
              <p className="font-medium">CitizenShip Number:</p>
              <p>22-32-01/0032</p>
            </div>
            <div>
              <p className="font-medium">Location:</p>
              <p>Kathmandu, Nepal</p>
            </div>
            <div>
              <p className="font-medium">Joined:</p>
              <p>Jan 2024</p>
            </div>
     
          </div>
        </div>
      </div>
    </div>
  );
}
