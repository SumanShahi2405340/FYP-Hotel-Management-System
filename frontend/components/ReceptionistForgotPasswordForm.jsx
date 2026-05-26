'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import recepApi from '../utils/recep';
import { FaEnvelope, FaArrowLeft, FaPaperPlane, FaSpinner } from 'react-icons/fa';

export default function ReceptionistForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const requestOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await recepApi.post('/api/receptionist/forgot-password/', { email });
      setMessage(res.data.message || 'OTP sent to your email');
      // Redirect to OTP verification page after 1.5 seconds
      setTimeout(() => {
        router.push(`/receptionist/verify-otp?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to send OTP');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-indigo-900/40"></div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Top/Bottom decorative lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent z-10"></div>

      <div className="relative z-20 w-full max-w-md mx-4">
        {/* Glass card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 hover:border-amber-500/30 transition-all duration-500">
          
          {/* Corner accents */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-amber-500/30 rounded-tl-lg"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-500/30 rounded-tr-lg"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-500/30 rounded-bl-lg"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-amber-500/30 rounded-br-lg"></div>

          {/* Icon and Heading */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative w-20 h-20 rounded-full mb-4 ring-4 ring-amber-500/30 ring-offset-2 ring-offset-gray-900 flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                <FaEnvelope className="w-10 h-10 text-amber-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              Forgot Password?
            </h2>
            <p className="text-sm text-gray-400 mt-1">Enter your email to reset password</p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-500/50"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70"></div>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-500/50"></div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={requestOTP}>
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
              Reset Instructions
            </h3>

            <div className="space-y-4">
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-amber-400 text-sm" />
                  </div>
                  <input
                    type="email"
                    placeholder="receptionist@cloudinn.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-300 hover:bg-white/10"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-98 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin h-5 w-5" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaPaperPlane className="text-sm" />
                    <span>Send OTP</span>
                  </div>
                )}
              </button>

              {message && (
                <div className={`mt-4 p-3 rounded-lg text-center text-sm ${
                  message.toLowerCase().includes('sent')
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    {message.toLowerCase().includes('sent') ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span>{message}</span>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Back to Login Link */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <Link
              href="/receptionist/login"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-amber-400 transition-colors duration-300 group"
            >
              <FaArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
              Back to Login
            </Link>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">A 6-digit OTP will be sent to your email</p>
          </div>
        </div>
      </div>
    </div>
  );
}