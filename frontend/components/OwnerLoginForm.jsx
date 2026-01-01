'use client';

import { useState } from 'react';
import api from '../utils/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OwnerLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await api.post('/owner/login/', { email, password });  
      setMessage(res.data.message || 'Login successful');

      if (res.status === 200) {
        router.push('/owner/dashboard');
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
          type="email"
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex justify-end mb-4">
          <Link 
            href="/owner/forgot-password" 
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
