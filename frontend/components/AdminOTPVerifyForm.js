// // components/OTPVerifyForm.js

// import { useState } from 'react';
// import { useRouter } from 'next/router';
// import api from '../utils/api';  // adjust path if needed

// export default function OTPVerifyForm() {
//   const [otp, setOtp] = useState('');
//   const [message, setMessage] = useState('');
//   const router = useRouter();
//   const { email } = router.query;  // get email from URL

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       console.log('Sending:', { email, otp });  // ✅ Debug log
//       const res = await api.post('/admin/verify-otp/', { email, otp });
//       setMessage(res.data.message || 'Login successful via OTP');
//     } catch (err) {
//       setMessage(err.response?.data?.error || 'OTP verification failed');
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 border rounded">
//       <h2 className="text-xl font-bold mb-4">Verify OTP</h2>
//       <input
//         type="text"
//         placeholder="Enter OTP"
//         value={otp}
//         onChange={(e) => setOtp(e.target.value)}
//         className="w-full mb-3 p-2 border rounded"
//         required
//       />
//       <button
//         type="submit"
//         className="w-full bg-blue-600 text-white p-2 rounded"
//       >
//         Verify
//       </button>
//       {message && <p className="mt-4 text-center">{message}</p>}
//     </form>
//   );
// }



import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';

export default function AdminOTPVerifyForm() {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { email } = router.query;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Sending:', { email, otp });
      const res = await api.post('/admin/verify-otp/', { email, otp });
      setMessage(res.data.message || 'Login successful via OTP');
    } catch (err) {
      setMessage(err.response?.data?.error || 'OTP verification failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 border rounded">
      <h2 className="text-xl font-bold mb-4">Admin OTP Verification</h2>
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
        required
      />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
        Verify
      </button>
      {message && <p className="mt-4 text-center">{message}</p>}
    </form>
  );
}
