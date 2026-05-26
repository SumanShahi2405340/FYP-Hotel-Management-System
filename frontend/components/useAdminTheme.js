'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'cloudinn_admin_theme';
const LIGHT_STYLE_ID = 'cloudinn-admin-light-mode-fix';

function installLightModeCssFix() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(LIGHT_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = LIGHT_STYLE_ID;
  style.innerHTML = `
    html[data-admin-theme='light'] body {
      background: #eef2ff !important;
      color: #0f172a !important;
    }

    html[data-admin-theme='light'] .admin-theme-page {
      background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f4f0ff 100%) !important;
      color: #0f172a !important;
    }

    html[data-admin-theme='light'] .admin-theme-page h1,
    html[data-admin-theme='light'] .admin-theme-page h2,
    html[data-admin-theme='light'] .admin-theme-page h3,
    html[data-admin-theme='light'] .admin-theme-page h4 {
      color: #0f172a !important;
      -webkit-text-fill-color: #0f172a !important;
    }

    html[data-admin-theme='light'] .admin-theme-page .text-white,
    html[data-admin-theme='light'] .admin-theme-page .text-slate-100,
    html[data-admin-theme='light'] .admin-theme-page .text-slate-200,
    html[data-admin-theme='light'] .admin-theme-page .text-slate-300 {
      color: #1e293b !important;
      -webkit-text-fill-color: #1e293b !important;
    }

    html[data-admin-theme='light'] .admin-theme-page p,
    html[data-admin-theme='light'] .admin-theme-page td,
    html[data-admin-theme='light'] .admin-theme-page .text-slate-400,
    html[data-admin-theme='light'] .admin-theme-page .text-gray-400,
    html[data-admin-theme='light'] .admin-theme-page .text-gray-300 {
      color: #475569 !important;
      -webkit-text-fill-color: #475569 !important;
    }

    html[data-admin-theme='light'] .admin-theme-page table,
    html[data-admin-theme='light'] .admin-theme-page .admin-table-card {
      background: #ffffff !important;
      border-color: #e2e8f0 !important;
      box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08) !important;
    }

    html[data-admin-theme='light'] .admin-theme-page thead,
    html[data-admin-theme='light'] .admin-theme-page .admin-table-head {
      background: #f8fafc !important;
      color: #334155 !important;
      border-color: #e2e8f0 !important;
    }

    html[data-admin-theme='light'] .admin-theme-page tbody tr {
      border-color: #f1f5f9 !important;
    }

    html[data-admin-theme='light'] .admin-theme-page input,
    html[data-admin-theme='light'] .admin-theme-page select,
    html[data-admin-theme='light'] .admin-theme-page textarea {
      background: #ffffff !important;
      color: #0f172a !important;
      border-color: #cbd5e1 !important;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08) !important;
    }

    html[data-admin-theme='light'] .admin-theme-page input::placeholder,
    html[data-admin-theme='light'] .admin-theme-page textarea::placeholder {
      color: #94a3b8 !important;
    }

    html[data-admin-theme='light'] .admin-theme-page .bg-white\/5,
    html[data-admin-theme='light'] .admin-theme-page .bg-white\/10 {
      background-color: #ffffff !important;
    }

    html[data-admin-theme='light'] .admin-theme-page .border-white\/5,
    html[data-admin-theme='light'] .admin-theme-page .border-white\/10,
    html[data-admin-theme='light'] .admin-theme-page .border-white\/20 {
      border-color: #e2e8f0 !important;
    }

    html[data-admin-theme='light'] .admin-sidebar {
      background: #ffffff !important;
      color: #0f172a !important;
      border-color: #e2e8f0 !important;
      box-shadow: 4px 0 24px rgba(15, 23, 42, 0.08) !important;
    }

    html[data-admin-theme='light'] .admin-sidebar .text-white,
    html[data-admin-theme='light'] .admin-sidebar .text-slate-100,
    html[data-admin-theme='light'] .admin-sidebar .text-slate-200,
    html[data-admin-theme='light'] .admin-sidebar .text-slate-300 {
      color: #1e293b !important;
      -webkit-text-fill-color: #1e293b !important;
    }

    html[data-admin-theme='light'] .admin-sidebar .text-slate-400,
    html[data-admin-theme='light'] .admin-sidebar .text-gray-400 {
      color: #64748b !important;
      -webkit-text-fill-color: #64748b !important;
    }

    html[data-admin-theme='light'] .admin-topbar {
      background: #ffffff !important;
      color: #0f172a !important;
      border-color: #e2e8f0 !important;
      box-shadow: 0 2px 12px rgba(15, 23, 42, 0.07) !important;
    }
  `;
  document.head.appendChild(style);
}

export default function useAdminTheme() {
  const [theme, setTheme] = useState('dark');

  const applyTheme = useCallback((nextTheme) => {
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      installLightModeCssFix();
      localStorage.setItem(THEME_KEY, nextTheme);
      document.documentElement.setAttribute('data-admin-theme', nextTheme);
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      window.dispatchEvent(new Event('cloudinn-admin-theme-change'));
    }
  }, []);

  useEffect(() => {
    installLightModeCssFix();
    const savedTheme =
      typeof window !== 'undefined'
        ? localStorage.getItem(THEME_KEY) || 'dark'
        : 'dark';
    applyTheme(savedTheme);

    const syncTheme = () => {
      const currentTheme = localStorage.getItem(THEME_KEY) || 'dark';
      setTheme(currentTheme);
      document.documentElement.setAttribute('data-admin-theme', currentTheme);
      document.documentElement.classList.toggle('dark', currentTheme === 'dark');
    };

    window.addEventListener('storage', syncTheme);
    window.addEventListener('cloudinn-admin-theme-change', syncTheme);
    return () => {
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener('cloudinn-admin-theme-change', syncTheme);
    };
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }, [applyTheme, theme]);

  const isDark = theme === 'dark';

  const classes = useMemo(
    () => ({
      page: isDark
        ? 'admin-theme-page bg-[#0b1020] text-white'
        : 'admin-theme-page bg-[#eef2ff] text-slate-900',

      sidebar: isDark
        ? 'admin-sidebar bg-[#0f172a]/95 text-white border-white/10 shadow-2xl'
        : 'admin-sidebar bg-white text-slate-900 border-slate-200 shadow-lg',

      sidebarSectionBorder: isDark ? 'border-white/10' : 'border-slate-200',

      sidebarButton: isDark
        ? 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-transparent'
        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200',

      sidebarButtonActive: isDark
        ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-100'
        : 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm',

      topbar: isDark
        ? 'admin-topbar bg-[#0f172a]/90 border-white/10'
        : 'admin-topbar bg-white text-slate-900 border-slate-200 shadow-sm',

      card: isDark
        ? 'bg-white/5 border-white/10 text-white'
        : 'bg-white border-slate-200 text-slate-900 shadow-md',

      statCard: isDark
        ? 'bg-white/5 border-white/10 text-white'
        : 'bg-white border-slate-200 text-slate-900 shadow-md shadow-slate-200/60',

      table: isDark
        ? 'admin-table-card bg-white/5 border-white/10'
        : 'admin-table-card bg-white border-slate-200 shadow-md',

      tableHead: isDark
        ? 'admin-table-head bg-white/5 border-white/10 text-slate-300'
        : 'admin-table-head bg-slate-50 border-slate-200 text-slate-600',

      tableRow: isDark
        ? 'border-white/5 hover:bg-white/5'
        : 'border-slate-100 hover:bg-indigo-50/50',

      // ✅ KEY FIX: no bg-clip-text in light mode — solid dark color instead
      heading: isDark
        ? 'bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent'
        : 'text-slate-900',

      mainText: isDark ? 'text-white' : 'text-slate-900',
      subText: isDark ? 'text-slate-300' : 'text-slate-600',
      mutedText: isDark ? 'text-slate-300' : 'text-slate-500',
      faintText: isDark ? 'text-slate-400' : 'text-slate-500',

      button: isDark
        ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-sm',

      primaryButton: isDark
        ? 'bg-purple-500 hover:bg-purple-600 text-white border-purple-400/40'
        : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-md',

      input: isDark
        ? 'bg-white/5 border-white/10 text-white placeholder-slate-500'
        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm',

      tabActive: isDark
        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
        : 'bg-purple-600 text-white shadow-md',

      tabInactive: isDark
        ? 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
        : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200',

      statusActive: isDark
        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
        : 'bg-green-50 text-green-700 border border-green-200',

      statusInactive: isDark
        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
        : 'bg-red-50 text-red-600 border border-red-200',

      dangerButton: isDark
        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
        : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200',

      successButton: isDark
        ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30'
        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',

      iconSoft: isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700',
    }),
    [isDark]
  );

  return { theme, isDark, classes, applyTheme, toggleTheme };
}