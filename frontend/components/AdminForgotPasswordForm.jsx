'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../utils/api';

export default function AdminForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const requestOTP = async (e) => {
  e.preventDefault();
  try {
    console.log("Sending OTP to:", email);
    const res = await api.post('/api/forgot-password/', { email }); 
    setMessage(res.data.message || 'OTP sent to email');
    router.push(`/admin/verify-otp?email=${email}`);
  } catch (err) {
    setMessage(err.response?.data?.error || 'Failed to send OTP');
  }
};


  return (
    <form onSubmit={requestOTP} className="max-w-md mx-auto p-6 border rounded">
      <h2 className="text-xl font-bold mb-4">Admin Forgot Password</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
        required
      />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
        Send OTP
      </button>
      {message && <p className="mt-4 text-center">{message}</p>}
    </form>
  );
}

