'use client';

import { useState } from 'react';
import api from '../utils/api';   
import { useRouter } from 'next/navigation';

export default function OwnerLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(""); // success or error
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await api.post('http://127.0.0.1:8000/api/token/', { username, password });

      if (res.status === 200) {
        // Save JWT token + hotel info
        localStorage.setItem("authToken", res.data.access);
        localStorage.setItem("refreshToken", res.data.refresh);
        localStorage.setItem("hotelId", res.data.hotel_id);

        setMessage(res.data.message || 'Login successful');
        setStatus('success');

        console.log("Login response:", res.data);

        // Delay redirect by 1.5 seconds
        setTimeout(() => {
          router.push("/owner/owner-dashboard");
        }, 1500);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Login failed');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative z-10">
        
        {/* Greeting */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden mb-2 flex items-center justify-center bg-white">
            <img
              src="/ownerlog.png"
              alt="Owner Icon"
              className="w-full h-full object-cover block"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Hello!</h2>
          <p className="text-sm text-gray-500">Welcome Owner</p>
        </div>

        {/* Login Form */}
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Owner Login</h3>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Login
        </button>

        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              status === 'success' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
