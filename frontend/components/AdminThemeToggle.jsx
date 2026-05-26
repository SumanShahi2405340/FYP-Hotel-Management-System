'use client';

import { FaMoon, FaSun } from 'react-icons/fa';

export default function AdminThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-[132px] h-11 rounded-full p-1 flex items-center border transition-all duration-300 ${
        isDark
          ? 'bg-black border-white/20 shadow-lg shadow-black/30'
          : 'bg-white border-slate-200 shadow-lg shadow-slate-200/90'
      }`}
      title="Toggle Light/Dark Mode"
    >
      <span
        className={`absolute top-1 h-9 w-[61px] rounded-full transition-all duration-300 ${
          isDark
            ? 'translate-x-[63px] bg-gray-900 border border-white/20 shadow-md shadow-black'
            : 'translate-x-0 bg-purple-100 border border-purple-200 shadow-md shadow-purple-200/80'
        }`}
      />

      <span
        className={`relative z-10 w-1/2 flex items-center justify-center gap-1 text-[11px] font-bold transition ${
          !isDark ? 'text-slate-950' : 'text-gray-500'
        }`}
      >
        <FaSun className={!isDark ? 'text-yellow-500' : 'text-gray-500'} />
        Light
      </span>

      <span
        className={`relative z-10 w-1/2 flex items-center justify-center gap-1 text-[11px] font-bold transition ${
          isDark ? 'text-white' : 'text-slate-500'
        }`}
      >
        <FaMoon className={isDark ? 'text-blue-300' : 'text-purple-500'} />
        Dark
      </span>
    </button>
  );
}
