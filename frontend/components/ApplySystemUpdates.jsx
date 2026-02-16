'use client';
import { useState } from 'react';
import { FaTools } from 'react-icons/fa';

export default function ApplySystemUpdates() {
  const [status, setStatus] = useState('Up to date');
  const [lastUpdated, setLastUpdated] = useState('2025-12-01');
  const [loading, setLoading] = useState(false);

  const handleApplyUpdate = () => {
    setLoading(true);
    setTimeout(() => {
      setStatus('System updated successfully');
      setLastUpdated(new Date().toISOString().split('T')[0]);
      setLoading(false);
    }, 2000); // simulate update delay
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-10 py-16">
      <h1 className="text-4xl font-bold text-center mb-12">Apply System Updates</h1>

      <div className="max-w-xl mx-auto bg-white text-gray-800 rounded-xl shadow-2xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <FaTools className="text-3xl text-indigo-700" />
          <h2 className="text-2xl font-bold">System Update Panel</h2>
        </div>

        <button
          onClick={handleApplyUpdate}
          disabled={loading}
          className={`w-full px-6 py-4 rounded-lg font-semibold text-white transition ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-700 hover:bg-indigo-800'
          }`}
        >
          {loading ? 'Applying Update...' : 'Apply System Updates'}
        </button>

        <div className="mt-6 text-sm text-gray-600">
          Last update: <span className="font-medium">{lastUpdated}</span><br />
          Status: <span className="text-green-600 font-semibold">{status}</span>
        </div>
      </div>
    </div>
  );
}
