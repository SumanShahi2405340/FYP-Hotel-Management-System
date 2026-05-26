'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import recepApi from '../utils/recep';
import { FaArrowLeft, FaCheckCircle, FaEye, FaEyeSlash, FaLock, FaSpinner } from 'react-icons/fa';

export default function ReceptionistResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!email) {
      setMessage('Email is missing. Please verify OTP again.');
      setMessageType('error');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setMessage('Please enter and confirm your new password.');
      setMessageType('error');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.');
      setMessageType('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const res = await recepApi.post('/api/receptionist/update-password/', {
        email,
        new_password: newPassword,
      });

      setMessage(res.data?.message || 'Password reset successfully.');
      setMessageType('success');

      setTimeout(() => {
        router.push('/receptionist/login');
      }, 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to reset password. Please try again.');
      setMessageType('error');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
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
      </div>

      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent z-10"></div>

      <div className="relative z-20 w-full max-w-md mx-4">
        <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 hover:border-amber-500/30 transition-all duration-500">
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-amber-500/30 rounded-tl-lg"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-500/30 rounded-tr-lg"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-500/30 rounded-bl-lg"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-amber-500/30 rounded-br-lg"></div>

          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative w-20 h-20 rounded-full mb-4 ring-4 ring-amber-500/30 ring-offset-2 ring-offset-gray-900 flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                <FaLock className="w-10 h-10 text-amber-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              Reset Receptionist Password
            </h2>
            <p className="text-sm text-gray-400 mt-1 text-center">
              Create a new password for<br />
              <span className="text-amber-400 font-medium">{email || 'your account'}</span>
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-500/50"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70"></div>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-500/50"></div>
            </div>
          </div>

          <form onSubmit={handleResetPassword}>
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
              New Password
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-amber-400 text-sm" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-400"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-amber-400 text-sm" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-400"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                  messageType === 'success'
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                  {messageType === 'success' && <FaCheckCircle className="flex-shrink-0" />}
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/receptionist/login" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-amber-400 transition-colors">
              <FaArrowLeft className="text-xs" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
