'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RoleSelector() {
  const [role, setRole] = useState('');
  const router = useRouter();

  const handleRoleChange = (value) => {
    setRole(value);

    if (value === 'admin') router.push('/admin/login');
    if (value === 'owner') router.push('/owner/login');
    if (value === 'manager') router.push('/manager/login');
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center relative flex flex-col justify-between"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      {/* (1) Top Navbar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-2 bg-white/80 backdrop-blur-md shadow-md">
        {/* Logo + Navigation */}
        <div className="flex items-center space-x-6">
          {/* (2) Centered Logo */}
          <div className="flex items-center h-full">
            <Image
              src="/cloudinn.png"
              alt="CloudInn Logo"
              width={200}
              height={60}
              className="h-12 w-auto"
            />
          </div>

          {/* Navigation links */}
          <nav className="flex items-center space-x-4 font-medium text-sm">
            <Link
              href="/"
              className="bg-red-600 text-white px-4 py-1 rounded-full shadow hover:bg-red-700 transition text-sm"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="bg-red-600 text-white px-4 py-1 rounded-full shadow hover:bg-red-700 transition text-sm"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="bg-red-600 text-white px-4 py-1 rounded-full shadow hover:bg-red-700 transition text-sm"
            >
              Contacts
            </Link>
          </nav>
        </div>

        {/* Role selector */}
        <div className="flex items-center space-x-4">
          <select
            onChange={e => handleRoleChange(e.target.value)}
            className="bg-blue-600 text-white font-semibold rounded px-3 py-1 shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white text-sm"
          >
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
          </select>
        </div>
      </div>

      {/* (3) Bottom Navbar */}
      <div className="relative z-10 flex justify-center items-center px-6 py-2 bg-white/80 backdrop-blur-md shadow-md">
        <p className="text-sm text-gray-700">© 2025 CloudInn. All rights reserved.</p>
      </div>
    </div>
  );
}
