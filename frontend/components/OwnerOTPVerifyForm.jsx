import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';

export default function OwnerOTPVerifyForm() {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();
  const { email } = router.query;

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/owner/verify-otp/', { email, otp }); 
      setMessage(res.data.message || 'OTP verified successfully');
      setShowUpdatePassword(true);
    } catch (err) {
      setMessage(err.response?.data?.error || 'OTP verification failed');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    try {
      const res = await api.post('/owner/update-password/', {  
        email,
        new_password: newPassword,
      });
      setMessage(res.data.message || 'Password updated successfully');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update password');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded">
      <h2 className="text-xl font-bold mb-4">Owner OTP Verification</h2>

      {!showUpdatePassword && (
        <form onSubmit={handleVerifyOTP}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full mb-3 p-2 border rounded"
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
            Verify OTP
          </button>
        </form>
      )}

      {showUpdatePassword && (
        <form onSubmit={handleUpdatePassword}>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full mb-3 p-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full mb-3 p-2 border rounded"
            required
          />
          <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">
            Done
          </button>
        </form>
      )}

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
