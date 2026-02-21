"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ReceptionistProfilePanel() {
  const router = useRouter();
  const [receptionist, setReceptionist] = useState(null);

  // Fetch receptionist data (static endpoint for now)
  useEffect(() => {
    fetch("http://localhost:8000/api/receptionist/profile/") // <-- adjust to your backend
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch receptionist profile");
        return res.json();
      })
      .then((data) => setReceptionist(data))
      .catch((err) => console.error("Error fetching receptionist:", err));
  }, []);

  if (!receptionist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading receptionist profile...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-cover bg-center"
      style={{
        backgroundImage: "url('/register.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="bg-blue-300/90 shadow-2xl rounded-2xl w-full max-w-4xl p-8 relative backdrop-blur-sm">
        
        {/* Top Right Buttons */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={() => router.push("/owner/receptionist/edit")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow font-medium transition-transform hover:scale-105"
          >
            Edit Profile
          </button>
          <button
            onClick={() => alert("Reset credentials triggered")}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow font-medium transition-transform hover:scale-105"
          >
            Reset Credentials
          </button>
        </div>

        {/* Photo Section */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={receptionist.photo || "/owner-photo.jpg"}
            alt="Receptionist"
            className="w-32 h-32 rounded-full border-4 border-gray-300 shadow-lg object-cover"
          />
          <h2 className="text-2xl font-bold mt-4 text-gray-800">{receptionist.name}</h2>
          <p className="text-gray-500">Receptionist</p>
        </div>

        {/* Details Section */}
        <div className="bg-blue-100/90 rounded-xl p-6 shadow-inner">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Profile Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-medium">Email:</p>
              <p>{receptionist.email}</p>
            </div>
            <div>
              <p className="font-medium">Contact:</p>
              <p>{receptionist.contact}</p>
            </div>
            <div>
              <p className="font-medium">Date Joined:</p>
              <p>{receptionist.joined}</p>
            </div>
            <div>
              <p className="font-medium">Status:</p>
              <p>{receptionist.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
