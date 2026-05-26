'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import recepApi from '../utils/recep';
import Image from 'next/image';

export default function ReceptionistLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (isLoading) return;

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setMessage('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // IMPORTANT: Receptionist login must use receptionist-token, not owner /api/token/
      const res = await recepApi.post('http://127.0.0.1:8000/api/receptionist/token/', {
        username: cleanUsername,
        password,
      });

      localStorage.setItem('recepToken', res.data.access);
      localStorage.setItem('recepRefreshToken', res.data.refresh);

      if (res.data.hotel_id) localStorage.setItem('hotelId', res.data.hotel_id);
      if (res.data.receptionist_id) localStorage.setItem('receptionistId', res.data.receptionist_id);
      if (res.data.receptionist_name) localStorage.setItem('receptionistName', res.data.receptionist_name);

      setMessage(res.data.message || 'Login successful');

      setTimeout(() => {
        // Your app route is /receptionist/dashboard, not /receptionist/dashboard/:id
        router.push('/receptionist/dashboard');
      }, 600);
    } catch (err) {
      console.error('Receptionist login error:', err);
      setMessage(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isSuccess = message.toLowerCase().includes('success');

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background layers must not catch clicks */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-indigo-900/40" />
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-700 pointer-events-none" />
        <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />
      </div>

      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent z-10 pointer-events-none" />

      <div className="relative z-20 w-full max-w-md mx-4 pointer-events-auto">
        <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 hover:border-amber-500/30 transition-all duration-500">
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-amber-500/30 rounded-tl-lg pointer-events-none" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-500/30 rounded-tr-lg pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-500/30 rounded-bl-lg pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-amber-500/30 rounded-br-lg pointer-events-none" />

          <div className="flex flex-col items-center mb-8">
            <div className="relative pointer-events-none">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 ring-4 ring-amber-500/30 ring-offset-2 ring-offset-gray-900">
                <Image
                  src="/recep.jpg"
                  alt="Receptionist Avatar"
                  width={96}
                  height={96}
                  priority
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              Hello!
            </h2>
            <p className="text-sm text-gray-400 mt-1">Welcome Receptionist</p>

            <div className="flex items-center gap-3 mt-4 pointer-events-none">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-500/50" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-amber-500 rounded-full" />
            Receptionist Login
          </h3>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="relative z-30 w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-300 hover:bg-white/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="relative z-30 w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-300 hover:bg-white/10"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/receptionist/forgot-password')}
                className="relative z-30 text-xs text-gray-400 hover:text-amber-400 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative z-30 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? 'Authenticating...' : 'Login'}
            </button>

            {message && (
              <div
                className={`relative z-30 mt-4 p-3 rounded-lg text-center text-sm ${
                  isSuccess
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {message}
              </div>
            )}
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center pointer-events-none">
            <p className="text-xs text-gray-500">Secure receptionist portal • Powered by CloudInn</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="relative z-30 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-amber-400 transition-colors duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
