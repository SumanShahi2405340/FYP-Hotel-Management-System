'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Create axios instance with credentials enabled
  const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
    withCredentials: true, // IMPORTANT: send cookies for session auth
  });

  const handleLogin = async () => {
    try {
      const res = await api.post('admin-login/', { email, password });

      if (res.status === 200 && res.data?.message) {
        setMessage(res.data.message);
        
      // Delay redirect by 1.5 seconds
      setTimeout(() => {
        router.push('/admin/dashboard');// redirect after login
      }, 1500);
      } else {
        setMessage('Unexpected response');
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative z-10">
        
        {/* Icon and Greeting */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden mb-2 flex items-center justify-center bg-white">
            <img
              src="/admin-photo.jpg"
              alt="Admin"
              className="w-full h-full object-cover block"
            />
          </div>

          <h2 className="text-xl font-bold text-gray-800">Hello!</h2>
          <p className="text-sm text-gray-500">Welcome Admin</p>
        </div>

        {/* Login Form */}
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Login</h3>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex justify-end mb-4">
          <Link 
            href="/admin/forgot-password" 
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Login
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-red-500">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}



