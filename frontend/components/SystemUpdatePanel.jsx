'use client';
import { FaTools } from 'react-icons/fa';

export default function SystemUpdatePanel({ isOpen, onClose }) {
  const handleApplyUpdate = () => {
    console.log('System update logic triggered');
    // 🔧 Replace with actual update logic or API call
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-40 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">System Updates</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg font-bold"
          >
            ×
          </button>
        </div>

        {/* Update Button */}
        <button
          onClick={handleApplyUpdate}
          className="flex items-center gap-3 px-6 py-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-semibold shadow-lg"
        >
          <FaTools className="text-xl" />
          <span className="whitespace-nowrap">Apply System Updates</span>
        </button>

        {/* Optional Status */}
        <div className="mt-6 text-sm text-gray-600">
          Last update: 2025-12-01<br />
          Status: <span className="text-green-600 font-medium">Up to date</span>
        </div>
      </div>
    </div>
  );
}
