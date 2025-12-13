import { useState } from 'react';
import api from '../utils/api';
import Link from 'next/link';

export default function OwnerLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      const res = await api.post('/owner/login/', { email, password });  
      setMessage(res.data.message || 'Login successful');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div>
      <h2>Owner Login</h2>
      <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
      <p>{message}</p>
      <Link href="/owner/forgot-password">Forgot Password?</Link> 
    </div>
  );
}
