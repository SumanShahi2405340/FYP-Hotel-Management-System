import { useState } from 'react';
import api from '../utils/api';
import Link from 'next/link';
import { useRouter } from 'next/router';   // import router for navigation

export default function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();  // initialize router

  const handleLogin = async () => {
    try {
      // send login request to backend
      const res = await api.post('/admin/login/', { email, password });

      // show success message
      setMessage(res.data.message || 'Login successful');

      // if login is successful, redirect to admin dashboard
      if (res.status === 200) {
        router.push('/admin/dashboard');
      }
    } catch (err) {
      // show error message if login fails
      setMessage(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div>
      <h2>Admin Login</h2>
      {/* email input */}
      <input
        type="email"
        placeholder="Email"
        onChange={e => setEmail(e.target.value)}
      />
      {/* password input */}
      <input
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)}
      />
      {/* login button */}
      <button onClick={handleLogin}>Login</button>
      {/* message display */}
      <p>{message}</p>
      {/* forgot password link */}
      <Link href="/admin/forgot-password">Forgot Password?</Link>
    </div>
  );
}
