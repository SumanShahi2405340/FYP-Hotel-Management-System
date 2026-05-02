'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import guestApi from '../utils/guestApi';

export default function GuestOTPVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, canResend]);

  const verifyOTP = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    
    try {
      console.log('Verifying OTP with data:', { email, otp });
      
      const response = await guestApi.post('/guest/verify-otp/', {
        email: email.trim(),
        otp: otp.trim()
      });

      console.log('Verification response:', response.data);
      
      setMessage(response.data.message || 'OTP verified successfully!');
      
      setTimeout(() => {
        router.push(`/guest/reset-password?email=${encodeURIComponent(email)}`);
      }, 1500);
      
    } catch (err) {
      console.error('OTP verification error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      const errorMessage = err.response?.data?.error || 'Invalid OTP. Please try again.';
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    setMessage('');
    setIsLoading(true);
    
    try {
      const response = await guestApi.post('/guest/forgot-password/', {
        email: email.trim()
      });

      setMessage(response.data.message || 'OTP resent to your email');
      setTimer(60);
      setCanResend(false);
      
    } catch (err) {
      console.error('Resend OTP error:', err);
      setMessage(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-2">Invalid Request</h2>
          <p className="text-gray-400">No email address provided.</p>
          <Link href="/guest/forgot-password" className="text-amber-400 mt-4 inline-block">
            Back to Forgot Password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-2">Verify OTP</h2>
        <p className="text-gray-400 mb-6">Enter the 6-digit code sent to {email}</p>

        <form onSubmit={verifyOTP}>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            maxLength={6}
            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-white text-center text-2xl tracking-widest mb-4"
            required
          />

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-center text-sm ${
              message.includes('success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {message}
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          {canResend ? (
            <button onClick={resendOTP} className="text-amber-400">
              Resend OTP
            </button>
          ) : (
            <p className="text-gray-500">Resend OTP in {timer} seconds</p>
          )}
        </div>
      </div>
    </div>
  );
}