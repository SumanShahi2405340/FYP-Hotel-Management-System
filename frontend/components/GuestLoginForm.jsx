'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import guestApi from '../utils/guestApi';

export default function GuestLoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username required';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async () => {
    setApiError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const response = await guestApi.post('/guest/login/', {
        username: form.username.trim(),
        password: form.password
      });

      const data = response.data;

      if (response.status === 200) {
        // Store JWT tokens
        if (data.access && data.refresh) {
          localStorage.setItem('guest_access_token', data.access);
          localStorage.setItem('guest_refresh_token', data.refresh);
        }
        
        // Store guest info
        localStorage.setItem('guestUser', JSON.stringify({
          id: data.guest_id,
          name: data.name,
          email: data.email,
          username: data.username
        }));
        
        // Redirect to guest dashboard
        router.push('/guest/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setApiError(err.response?.data?.error || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Rest of the JSX (same as before)
  const handleKey = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background (same as before) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-indigo-900/40"></div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        ></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-1 h-1 bg-white/20 rounded-full animate-float"></div>
          <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-white/20 rounded-full animate-float delay-300"></div>
          <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-white/20 rounded-full animate-float delay-500"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white/20 rounded-full animate-float delay-700"></div>
          <div className="absolute bottom-20 right-10 w-1 h-1 bg-white/20 rounded-full animate-float delay-1000"></div>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent z-10"></div>

      <div className="relative z-20 w-full max-w-md mx-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 hover:border-amber-500/30 transition-all duration-500 relative">
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-amber-500/30 rounded-tl-lg"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-500/30 rounded-tr-lg"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-500/30 rounded-bl-lg"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-amber-500/30 rounded-br-lg"></div>

          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 ring-4 ring-amber-500/30 ring-offset-2 ring-offset-gray-900">
                <Image
                  src="/guest.jpg"
                  alt="Guest Avatar"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">Welcome Back!</h2>
            <p className="text-sm text-gray-400 mt-1">Sign in to your guest account</p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-500/50"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70"></div>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-500/50"></div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
            Guest Login
          </h3>

          <div className="space-y-4">
            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={set('username')}
                onKeyDown={handleKey}
                autoComplete="username"
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-300 hover:bg-white/10"
              />
              {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username}</p>}
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                onKeyDown={handleKey}
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-300 hover:bg-white/10"
              />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <div className="flex justify-end">
              <button onClick={() => router.push('/guest/forgot-password')} className="text-xs text-gray-400 hover:text-amber-400 transition-colors">Forgot password?</button>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="relative w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-98 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Logging in…</span>
                </div>
              ) : ('Login')}
            </button>

            {apiError && (
              <div className="mt-4 p-3 rounded-lg text-center text-sm bg-red-500/10 border border-red-500/30 text-red-400">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{apiError}</span>
                </div>
              </div>
            )}
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-2 bg-transparent text-gray-400">New to CloudInn?</span></div>
          </div>

          <button onClick={() => router.push('/guest/signup')} className="w-full bg-white/5 border border-white/10 text-white py-3 rounded-lg font-semibold hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02] active:scale-98">Create New Account</button>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-gray-500">Secure guest portal • Powered by CloudInn</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-amber-400 transition-colors duration-300 group">
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes float { 0%,100% { transform: translateY(0px); opacity: 0.2; } 50% { transform: translateY(-20px); opacity: 0.4; } }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}