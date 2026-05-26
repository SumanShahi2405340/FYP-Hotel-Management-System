'use client';

import { FaArrowLeft, FaMoon, FaSun } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import useAdminTheme from '@/components/useAdminTheme';

export default function Page() {
  const router = useRouter();
  const { theme, isDark, classes, applyTheme } = useAdminTheme();

  return (
    <div className={`min-h-screen px-6 py-10 transition-all duration-500 ${classes.page}`}>
      <button
        onClick={() => router.push('/admin/dashboard')}
        className={`mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition ${classes.button}`}
      >
        <FaArrowLeft />
        Back to Dashboard
      </button>

      <div className={`max-w-3xl mx-auto rounded-3xl border p-8 transition-all duration-500 ${classes.card}`}>
        <div className="text-center mb-10">
          <h1 className={`text-4xl font-bold mb-3 ${classes.mainText}`}>
            Light / Dark Mode
          </h1>

          <p className={classes.subText}>
            Choose your preferred admin dashboard appearance.
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div
            className={`relative w-[350px] h-[88px] rounded-full p-2 flex items-center shadow-inner transition-all duration-500 ${
              isDark
                ? 'bg-black border border-white/20'
                : 'bg-slate-200 border border-slate-300'
            }`}
          >
            <button
              onClick={() => applyTheme('light')}
              className={`relative z-10 w-1/2 h-full rounded-full flex items-center justify-center gap-2 font-bold transition-all duration-500 ${
                !isDark ? 'text-slate-950' : 'text-slate-400'
              }`}
            >
              <FaSun className={!isDark ? 'text-amber-500' : 'text-slate-500'} />
              Light
            </button>

            <button
              onClick={() => applyTheme('dark')}
              className={`relative z-10 w-1/2 h-full rounded-full flex items-center justify-center gap-2 font-bold transition-all duration-500 ${
                isDark ? 'text-white' : 'text-slate-500'
              }`}
            >
              <FaMoon className={isDark ? 'text-blue-300' : 'text-slate-500'} />
              Dark
            </button>

            <div
              className={`absolute top-2 h-[70px] w-[163px] rounded-full shadow-xl transition-all duration-500 ${
                isDark
                  ? 'translate-x-[167px] bg-black border border-white/20'
                  : 'translate-x-0 bg-white border border-slate-200'
              }`}
            />
          </div>
        </div>

        <div
          className={`rounded-2xl p-6 border transition-all duration-500 ${
            isDark
              ? 'bg-black/40 border-white/10'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <h2 className={`text-2xl font-semibold mb-3 ${classes.mainText}`}>
            Current Mode: {theme === 'dark' ? 'Dark' : 'Light'}
          </h2>

          <p className={classes.subText}>
            {theme === 'dark'
              ? 'Dark mode is active. Admin dashboard and feature pages will use black theme.'
              : 'Light mode is active. Admin dashboard and feature pages will use a clean business theme.'}
          </p>
        </div>
      </div>
    </div>
  );
}
