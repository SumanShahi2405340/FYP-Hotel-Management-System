'use client';

import { useState } from 'react';
import api from '../utils/api';   
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEyeSlash, FaSpinner, FaSignInAlt, FaHotel } from 'react-icons/fa';

export default function OwnerLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      setMessage("Please enter both username and password");
      setStatus('error');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await api.post('/api/token/', { username, password });

      if (res.status === 200) {
        // Save JWT token + hotel info
        localStorage.setItem("authToken", res.data.access);
        localStorage.setItem("refreshToken", res.data.refresh);
        localStorage.setItem("hotelId", res.data.hotel_id);

        setMessage(res.data.message || 'Login successful! Redirecting...');
        setStatus('success');

        console.log("Login response:", res.data);

        // Delay redirect by 1.5 seconds
        setTimeout(() => {
          router.push("/owner/owner-dashboard");
        }, 1500);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Login failed. Invalid credentials.');
      setStatus('error');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-400/5 rounded-full blur-3xl"></div>
        
        {/* Decorative Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(16,185,129,0.03)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Decorative Lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
      
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Main Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 relative">
          
          {/* Decorative Corner Accents */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-emerald-500/30 rounded-tl-lg"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-emerald-500/30 rounded-tr-lg"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-emerald-500/30 rounded-bl-lg"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-emerald-500/30 rounded-br-lg"></div>

          {/* Icon and Greeting */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 ring-4 ring-emerald-500/30 ring-offset-2 ring-offset-slate-900 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <FaHotel className="w-12 h-12 text-emerald-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-200 to-teal-400 bg-clip-text text-transparent">
              Welcome Back!
            </h2>
            <p className="text-sm text-gray-400 mt-1">Hotel Owner Portal</p>
            
            {/* Decorative Divider */}
            <div className="flex items-center gap-3 mt-4">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-emerald-500/50"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/70"></div>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-emerald-500/50"></div>
            </div>
          </div>

          {/* Login Form */}
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
            Owner Login
          </h3>

          <div className="space-y-4">
            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-300 hover:bg-white/10"
              />
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-300 hover:bg-white/10 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? 
                    <FaEyeSlash className="text-gray-400 hover:text-emerald-400 transition-colors" /> : 
                    <FaEye className="text-gray-400 hover:text-emerald-400 transition-colors" />
                  }
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link 
                href="/owner/forgot-password" 
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors duration-300 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="relative w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-98 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin h-5 w-5" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <FaSignInAlt className="text-sm" />
                  <span>Login to Dashboard</span>
                </>
              )}
            </button>

            {message && (
              <div className={`mt-4 p-3 rounded-lg text-center text-sm ${
                status === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {status === 'success' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  )}
                  <span>{message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-gray-500">
              Secure owner portal • Manage your properties
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors duration-300 group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Floating Particles Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-1 h-1 bg-emerald-400/50 rounded-full animate-ping"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-teal-400/50 rounded-full animate-ping delay-700"></div>
        <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-emerald-400/50 rounded-full animate-ping delay-300"></div>
        <div className="absolute bottom-20 right-1/3 w-1 h-1 bg-teal-400/50 rounded-full animate-ping delay-1000"></div>
      </div>
    </div>
  );
}