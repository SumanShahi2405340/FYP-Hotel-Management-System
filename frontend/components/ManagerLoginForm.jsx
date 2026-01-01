'use client';

import { useState } from 'react';
import api from '../utils/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ManagerLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await api.post('/manager/login/', { email, password });
      setMessage(res.data.message || 'Login successful');

      if (res.status === 200) {
        router.push('/manager/dashboard'); // redirect after successful login
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div>
      <h2>Manager Login</h2>
      <input
        type="email"
        placeholder="Email"
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      <p>{message}</p>
      <Link href="/manager/forgot-password">Forgot Password?</Link>
    </div>
  );
}
