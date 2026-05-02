'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const ROLES = [
  {
    value: 'admin',
    label: 'Admin',
    sub: 'Full system access',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    value: 'owner',
    label: 'Owner',
    sub: 'Business oversight',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
  {
    value: 'receptionist',
    label: 'Receptionist',
    sub: 'Front desk operations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    value: 'guest',
    label: 'Guest',
    sub: 'Hotel booking & stays',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

const FEATURES = [
  {
    label: 'Room Management',
    desc: 'Live availability grid, housekeeping status, and instant room assignment across all floors.',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>),
  },
  {
    label: 'Reservations',
    desc: 'Full booking lifecycle — check-in, check-out, modifications, and cancellations in one place.',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>),
  },
  {
    label: 'Billing & Invoices',
    desc: 'Automated folio generation, tax calculation, and multi-payment method support.',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>),
  },
  {
    label: 'Staff Scheduling',
    desc: 'Shift planning, department assignments, and real-time task dispatch for your entire team.',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
  },
  {
    label: 'Analytics & Reports',
    desc: 'Occupancy rates, RevPAR, ADR and custom reports — downloadable in seconds.',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>),
  },
  {
    label: 'Guest Profiles',
    desc: 'Rich guest history, preferences, loyalty tracking, and personalized service notes.',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M9 11l1 4 2-2 2 2 1-4" /></svg>),
  },
];

const STATS = [
  { num: '2,400+', label: 'Rooms Managed' },
  { num: '98%',    label: 'Uptime Reliability' },
  { num: '340+',   label: 'Properties Served' },
  { num: '4.9★',   label: 'Average Rating' },
];

const GALLERY = [
  { src: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&auto=format&fit=crop', alt: 'Luxury hotel suite' },
  { src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&auto=format&fit=crop', alt: 'Hotel pool at sunset' },
  { src: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=900&auto=format&fit=crop', alt: 'Premium bedroom' },
  { src: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&auto=format&fit=crop', alt: 'Hotel balcony view' },
  { src: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=900&auto=format&fit=crop', alt: 'Grand hotel lobby' },
];

const ROOMS = [
  { src: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&auto=format&fit=crop', name: 'Deluxe Suite', desc: 'King bed · Ocean view · 68 m²', tag: 'Available' },
  { src: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=900&auto=format&fit=crop', name: 'Presidential Suite', desc: 'Two bedrooms · Private terrace · 142 m²', tag: 'Featured' },
  { src: 'https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=900&auto=format&fit=crop', name: 'Classic Double', desc: 'Twin or double · Garden view · 32 m²', tag: 'Available' },
];

export default function RoleSelector() {
  const [role, setRole] = useState('');
  const router = useRouter();
  useReveal();

  const handleRole = (value) => {
    setRole(value);
    setTimeout(() => {
      if (value === 'admin')        router.push('/admin/login');
      if (value === 'owner')        router.push('/owner/login');
      if (value === 'receptionist') router.push('/receptionist/login');
      if (value === 'guest')        router.push('/guest/login');
    }, 420);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --gold: #c8a96e; --gold-lt: #e2cfa0;
          --gold-dim: rgba(200,169,110,0.16); --gold-border: rgba(200,169,110,0.2);
          --ink: #080706; --ink-2: #0f0c09; --ink-3: #181410;
          --ivory: #f4efe5; --ivory-60: rgba(244,239,229,0.6);
          --ivory-30: rgba(244,239,229,0.3); --ivory-14: rgba(244,239,229,0.14);
        }
        html { scroll-behavior: smooth; }
        .ci-page { font-family: 'Outfit', sans-serif; background: var(--ink); color: var(--ivory); overflow-x: hidden; }

        [data-reveal] { opacity: 0; transform: translateY(28px); transition: opacity 0.88s cubic-bezier(0.22,1,0.36,1), transform 0.88s cubic-bezier(0.22,1,0.36,1); }
        [data-reveal="left"]  { transform: translateX(-28px); }
        [data-reveal="right"] { transform: translateX(28px); }
        [data-reveal].revealed { opacity: 1 !important; transform: none !important; }

        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 3rem; height: 62px;
          background: rgba(8,7,6,0.62); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid var(--gold-border);
          animation: navIn 0.8s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes navIn { from { opacity:0; transform:translateY(-100%) } to { opacity:1; transform:none } }
        .nav-logo { height: 36px; width: auto; position: relative; z-index: 2; }
        .nav-links { display: flex; align-items: center; gap: 0.1rem; position: absolute; left: 50%; transform: translateX(-50%); }
        .nav-btn {
          background: none; border: none; color: var(--ivory-60); font-family: 'Outfit', sans-serif;
          font-size: 0.7rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; padding: 0.4rem 0.9rem; transition: color 0.2s; position: relative;
        }
        .nav-btn::after { content: ''; position: absolute; bottom: 0; left: 50%; right: 50%; height: 1px; background: var(--gold); transition: left 0.25s ease, right 0.25s ease; }
        .nav-btn:hover { color: var(--gold-lt); }
        .nav-btn:hover::after { left: 0.9rem; right: 0.9rem; }

        .hero {
          position: relative; min-height: 100vh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 8rem 2rem 5rem; overflow: hidden;
        }
        .hero-bg { position: absolute; inset: 0; background-image: url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1800&auto=format&fit=crop'); background-size: cover; background-position: center 40%; z-index: 0; }
        .hero-overlay {
          position: absolute; inset: 0; z-index: 1;
          background: radial-gradient(ellipse 70% 55% at 50% 110%, rgba(8,7,6,0.97) 20%, transparent 100%), radial-gradient(ellipse 100% 40% at 50% 0%, rgba(8,7,6,0.78) 0%, transparent 100%), linear-gradient(180deg, rgba(8,7,6,0.48) 0%, rgba(8,7,6,0.1) 42%, rgba(8,7,6,0.6) 100%);
        }
        .hero-grain { position: absolute; inset: 0; z-index: 2; pointer-events: none; opacity: 0.038; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .hero-content { position: relative; z-index: 10; text-align: center; width: 100%; max-width: 1060px; }
        .hero-eyebrow { display: inline-flex; align-items: center; gap: 0.7rem; font-size: 0.62rem; font-weight: 600; letter-spacing: 0.44em; color: var(--gold); text-transform: uppercase; margin-bottom: 1.3rem; animation: fadeUp 0.8s ease 0.2s both; }
        .eyebrow-dash { width: 26px; height: 1px; background: var(--gold); opacity: 0.5; }
        .hero-h1 { font-family: 'Cormorant', serif; font-size: clamp(3.2rem, 6.2vw, 5.8rem); font-weight: 300; line-height: 1.06; letter-spacing: 0.01em; color: var(--ivory); margin-bottom: 0.55rem; animation: fadeUp 0.9s ease 0.35s both; }
        .hero-h1 em { font-style: italic; color: var(--gold-lt); font-weight: 400; }
        .hero-sub { font-size: 0.8rem; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ivory-30); margin-bottom: 2.8rem; animation: fadeUp 0.8s ease 0.5s both; }
        .ornament { display: flex; align-items: center; gap: 0.65rem; justify-content: center; margin-bottom: 3.5rem; animation: fadeUp 0.8s ease 0.58s both; }
        .orn-line { width: 48px; height: 1px; background: linear-gradient(90deg, transparent, var(--gold)); opacity: 0.45; }
        .orn-line.r { background: linear-gradient(90deg, var(--gold), transparent); }
        .orn-diamond { width: 4px; height: 4px; background: var(--gold); transform: rotate(45deg); opacity: 0.65; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }

        /* ── Role Cards ── */
        .role-cards { display: flex; gap: 1.1rem; justify-content: center; flex-wrap: wrap; animation: fadeUp 1s ease 0.7s both; }

        .role-card {
          flex: 1; min-width: 200px; max-width: 238px;
          padding: 2rem 1.6rem 1.8rem;
          background: rgba(10,9,7,0.68); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          border: 1px solid var(--gold-border); border-radius: 3px;
          cursor: pointer; text-align: center; position: relative; overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.3s, box-shadow 0.4s, background 0.3s;
        }
        .role-card::before { content: ''; position: absolute; top:0; left:0; right:0; height:1px; background: linear-gradient(90deg, transparent 5%, var(--gold) 50%, transparent 95%); opacity: 0; transition: opacity 0.35s; }
        .role-card::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(200,169,110,0.08), transparent 70%); opacity: 0; transition: opacity 0.35s; }
        .role-card:hover, .role-card.active { transform: translateY(-8px); border-color: rgba(200,169,110,0.42); background: rgba(16,13,9,0.82); box-shadow: 0 28px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(200,169,110,0.1); }
        .role-card:hover::before, .role-card.active::before { opacity: 1; }
        .role-card:hover::after,  .role-card.active::after  { opacity: 1; }

        /* Guest card: slightly warmer tint to stand out subtly */
        .role-card.guest-card { border-color: rgba(200,169,110,0.28); background: rgba(12,10,7,0.72); }
        .role-card.guest-card:hover, .role-card.guest-card.active { border-color: rgba(200,169,110,0.55); box-shadow: 0 28px 64px rgba(0,0,0,0.7), 0 0 24px rgba(200,169,110,0.08), 0 0 0 1px rgba(200,169,110,0.15); }

        .rc-icon-wrap {
          display: inline-flex; align-items: center; justify-content: center;
          width: 58px; height: 58px; border-radius: 50%;
          border: 1px solid var(--gold-border); background: var(--gold-dim);
          color: var(--gold); margin-bottom: 1.25rem;
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.3s, background 0.3s;
          position: relative; z-index: 1;
        }
        .rc-icon-wrap svg { width: 26px; height: 26px; }
        .role-card:hover .rc-icon-wrap, .role-card.active .rc-icon-wrap { transform: scale(1.1); border-color: rgba(200,169,110,0.48); background: rgba(200,169,110,0.16); }
        .role-card.active .rc-icon-wrap::after { content:''; position:absolute; inset:-5px; border-radius:50%; border:1px solid var(--gold); border-top-color:transparent; animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg) } }

        .rc-label { font-family: 'Cormorant', serif; font-size: 1.55rem; font-weight: 500; color: var(--ivory); letter-spacing: 0.02em; margin-bottom: 0.4rem; position: relative; z-index: 1; transition: color 0.3s; }
        .role-card:hover .rc-label, .role-card.active .rc-label { color: var(--gold-lt); }
        .rc-sub { font-size: 0.66rem; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ivory-30); position: relative; z-index: 1; transition: color 0.3s; }
        .role-card:hover .rc-sub, .role-card.active .rc-sub { color: rgba(200,169,110,0.6); }
        .rc-cta { display: inline-flex; align-items: center; gap: 0.3rem; margin-top: 1.35rem; font-size: 0.6rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); position: relative; z-index: 1; opacity: 0; transform: translateY(5px); transition: opacity 0.3s, transform 0.3s; }
        .rc-cta svg { width: 9px; height: 9px; }
        .role-card:hover .rc-cta, .role-card.active .rc-cta { opacity:1; transform:none; }

        /* Guest badge pill */
        .rc-badge { display: inline-block; margin-bottom: 0.7rem; padding: 0.18rem 0.6rem; background: rgba(200,169,110,0.1); border: 1px solid rgba(200,169,110,0.25); border-radius: 2px; font-size: 0.5rem; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); position: relative; z-index: 1; }

        .scroll-hint { position: absolute; bottom: 2.2rem; left: 50%; transform: translateX(-50%); z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; animation: fadeUp 0.8s ease 1.2s both; }
        .scroll-hint span { font-size: 0.58rem; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; color: var(--ivory-30); }
        .scroll-arrow { width: 1px; height: 36px; background: linear-gradient(180deg, var(--gold) 0%, transparent 100%); animation: scrollPulse 1.8s ease-in-out infinite; }
        @keyframes scrollPulse { 0%,100% { opacity:0.3; transform:scaleY(0.8) } 50% { opacity:1; transform:scaleY(1) } }

        .section-inner { max-width: 1160px; margin: 0 auto; }
        .section-label { font-size: 0.6rem; font-weight: 600; letter-spacing: 0.4em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.85rem; display: flex; align-items: center; gap: 0.6rem; }
        .section-label::before { content:''; width:20px; height:1px; background:var(--gold); opacity:0.5; }
        .section-h2 { font-family: 'Cormorant', serif; font-size: clamp(2.4rem, 4.5vw, 3.8rem); font-weight: 300; line-height: 1.1; color: var(--ivory); margin-bottom: 1rem; }
        .section-h2 em { font-style: italic; color: var(--gold-lt); }
        .section-body { font-size: 0.9rem; font-weight: 300; line-height: 1.88; color: var(--ivory-60); max-width: 480px; }

        .gallery-section { background: var(--ink-2); padding: 7rem 2rem; }
        .gallery-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 8px; margin-top: 3.5rem; }
        .gal-item { overflow: hidden; border-radius: 2px; position: relative; background: var(--ink-3); }
        .gal-item img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.7s cubic-bezier(0.22,1,0.36,1), filter 0.5s; filter: brightness(0.86) saturate(0.88); }
        .gal-item:hover img { transform: scale(1.06); filter: brightness(0.98) saturate(1.05); }
        .gal-item:nth-child(1) { grid-column: 1/6; grid-row: 1/3; min-height: 440px; }
        .gal-item:nth-child(2) { grid-column: 6/10; grid-row: 1/2; min-height: 210px; }
        .gal-item:nth-child(3) { grid-column: 10/13; grid-row: 1/2; min-height: 210px; }
        .gal-item:nth-child(4) { grid-column: 6/9; grid-row: 2/3; min-height: 220px; }
        .gal-item:nth-child(5) { grid-column: 9/13; grid-row: 2/3; min-height: 220px; }
        .gal-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 55%, rgba(8,7,6,0.72) 100%); opacity: 0; transition: opacity 0.4s; display: flex; align-items: flex-end; padding: 1.2rem; }
        .gal-item:hover .gal-overlay { opacity: 1; }
        .gal-overlay span { font-size: 0.62rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold-lt); }

        .stats-section { background: var(--ink); border-top: 1px solid var(--gold-border); border-bottom: 1px solid var(--gold-border); padding: 4.5rem 2rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); max-width: 980px; margin: 0 auto; }
        .stat-item { text-align: center; padding: 0 1.5rem; border-right: 1px solid var(--gold-border); }
        .stat-item:last-child { border-right: none; }
        .stat-num { font-family: 'Cormorant', serif; font-size: 3.2rem; font-weight: 300; color: var(--gold-lt); letter-spacing: 0.02em; line-height: 1; margin-bottom: 0.5rem; }
        .stat-label { font-size: 0.62rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ivory-30); }

        .rooms-section { background: var(--ink-2); padding: 7rem 2rem; }
        .rooms-header { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 2rem; margin-bottom: 3.5rem; }
        .rooms-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .room-card { border-radius: 3px; overflow: hidden; position: relative; background: var(--ink-3); border: 1px solid var(--gold-border); transition: border-color 0.3s, box-shadow 0.4s; }
        .room-card:hover { border-color: rgba(200,169,110,0.38); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .room-img-wrap { height: 256px; overflow: hidden; position: relative; }
        .room-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; transition: transform 0.65s cubic-bezier(0.22,1,0.36,1), filter 0.5s; filter: brightness(0.84) saturate(0.9); }
        .room-card:hover .room-img-wrap img { transform: scale(1.05); filter: brightness(0.95) saturate(1); }
        .room-tag { position: absolute; top: 1rem; left: 1rem; background: rgba(8,7,6,0.72); backdrop-filter: blur(8px); border: 1px solid var(--gold-border); border-radius: 1px; padding: 0.28rem 0.7rem; font-size: 0.58rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); }
        .room-info { padding: 1.4rem 1.35rem 1.5rem; }
        .room-name { font-family: 'Cormorant', serif; font-size: 1.3rem; font-weight: 500; color: var(--ivory); margin-bottom: 0.35rem; letter-spacing: 0.01em; }
        .room-desc { font-size: 0.7rem; font-weight: 400; letter-spacing: 0.08em; color: var(--ivory-30); }

        .features-section { background: var(--ink); padding: 7rem 2rem; }
        .features-header { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 2rem; margin-bottom: 3.5rem; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--gold-border); border-radius: 3px; overflow: hidden; }
        .feat-card { padding: 2rem 1.8rem; background: rgba(12,10,7,0.6); border-right: 1px solid var(--gold-border); border-bottom: 1px solid var(--gold-border); position: relative; overflow: hidden; transition: background 0.3s; }
        .feat-card:nth-child(3n) { border-right: none; }
        .feat-card:nth-child(4), .feat-card:nth-child(5), .feat-card:nth-child(6) { border-bottom: none; }
        .feat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background: linear-gradient(90deg, transparent, var(--gold), transparent); transform: scaleX(0); transition: transform 0.45s ease; }
        .feat-card:hover { background: rgba(20,16,10,0.85); }
        .feat-card:hover::before { transform: scaleX(1); }
        .feat-icon { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; color: var(--gold); margin-bottom: 1.1rem; border: 1px solid var(--gold-border); border-radius: 2px; background: var(--gold-dim); transition: background 0.3s, border-color 0.3s; }
        .feat-icon svg { width: 22px; height: 22px; }
        .feat-card:hover .feat-icon { background: rgba(200,169,110,0.22); border-color: rgba(200,169,110,0.4); }
        .feat-name { font-family: 'Cormorant', serif; font-size: 1.22rem; font-weight: 500; color: var(--ivory); margin-bottom: 0.55rem; }
        .feat-desc { font-size: 0.8rem; font-weight: 300; line-height: 1.75; color: var(--ivory-60); }

        .footer { background: var(--ink-2); border-top: 1px solid var(--gold-border); padding: 3.5rem 3rem 2rem; }
        .footer-top { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 2.5rem; padding-bottom: 2.5rem; border-bottom: 1px solid var(--gold-border); margin-bottom: 1.8rem; }
        .footer-brand p { font-size: 0.8rem; font-weight: 300; line-height: 1.75; color: var(--ivory-30); max-width: 250px; margin-top: 0.8rem; }
        .footer-col h4 { font-size: 0.6rem; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 1rem; }
        .footer-col ul { list-style: none; }
        .footer-col li { margin-bottom: 0.55rem; }
        .footer-col button { background: none; border: none; padding: 0; font-size: 0.8rem; font-weight: 300; color: var(--ivory-60); cursor: pointer; transition: color 0.2s; font-family: 'Outfit', sans-serif; }
        .footer-col button:hover { color: var(--gold-lt); }
        .footer-bottom { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
        .footer-bottom p { font-size: 0.65rem; font-weight: 400; letter-spacing: 0.1em; color: var(--ivory-30); }
        .f-dots { display: flex; gap: 0.5rem; align-items: center; }
        .f-dot { width: 3px; height: 3px; border-radius: 50%; background: rgba(200,169,110,0.28); }

        @media (max-width: 960px) {
          .gallery-grid { grid-template-columns: 1fr 1fr; }
          .gal-item:nth-child(1) { grid-column: 1/3; grid-row: auto; min-height: 280px; }
          .gal-item:nth-child(2),.gal-item:nth-child(3),.gal-item:nth-child(4),.gal-item:nth-child(5) { grid-column: auto; grid-row: auto; min-height: 200px; }
          .rooms-grid { grid-template-columns: 1fr 1fr; }
          .features-grid { grid-template-columns: 1fr 1fr; }
          .feat-card:nth-child(3n) { border-right: 1px solid var(--gold-border); }
          .feat-card:nth-child(2n) { border-right: none; }
          .feat-card:nth-child(4),.feat-card:nth-child(5),.feat-card:nth-child(6) { border-bottom: 1px solid var(--gold-border); }
          .feat-card:nth-child(5),.feat-card:nth-child(6) { border-bottom: none; }
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 2rem 0; }
          .stat-item:nth-child(2) { border-right: none; }
          .stat-item { padding-bottom: 2rem; border-bottom: 1px solid var(--gold-border); }
          .stat-item:nth-child(3),.stat-item:nth-child(4) { border-bottom: none; }
        }
        @media (max-width: 640px) {
          .nav { padding: 0 1.25rem; }
          .nav-links { display: none; }
          .hero { padding: 7rem 1.25rem 4rem; }
          .role-cards { flex-direction: column; align-items: center; }
          .role-card { min-width: 100%; max-width: 320px; }
          .gallery-section,.stats-section,.rooms-section,.features-section { padding: 5rem 1.25rem; }
          .rooms-grid,.features-grid { grid-template-columns: 1fr; }
          .feat-card:nth-child(n) { border-right: none; border-bottom: 1px solid var(--gold-border); }
          .feat-card:last-child { border-bottom: none; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .rooms-header,.features-header { flex-direction: column; align-items: flex-start; }
          .footer { padding: 2.5rem 1.25rem 1.5rem; }
          .footer-top { flex-direction: column; }
        }
      `}</style>

      <div className="ci-page">

        {/* NAV */}
        <nav className="nav">
          <Image src="/cloudinn.png" alt="CloudInn" width={150} height={46} className="nav-logo" priority />
          <div className="nav-links">
            {[['Home', '/'], ['Rooms', '#rooms'], ['Features', '#features'], ['About', '/role/about-us'], ['Contact', '/role/contact-us']].map(([label, path]) => (
              <button key={label} className="nav-btn" onClick={() => { if (path.startsWith('#')) document.querySelector(path)?.scrollIntoView({ behavior: 'smooth' }); else router.push(path); }}>{label}</button>
            ))}
          </div>
        </nav>

        {/* HERO */}
        <section className="hero" id="hero">
          <div className="hero-bg" />
          <div className="hero-overlay" />
          <div className="hero-grain" />
          <div className="hero-content">
            <p className="hero-eyebrow"><span className="eyebrow-dash" />CloudInn Hotel System<span className="eyebrow-dash" /></p>
            <h1 className="hero-h1">Manage Every Moment<br />of a <em>Perfect Stay</em></h1>
            <p className="hero-sub">Integrated Hotel Management — Select Your Role</p>
            <div className="ornament">
              <div className="orn-line" /><div className="orn-diamond" /><div className="orn-line r" />
            </div>

            <div className="role-cards" id="roles">
              {/* Staff cards — Admin, Owner, Receptionist */}
              {ROLES.filter(r => r.value !== 'guest').map((r) => (
                <div key={r.value} className={`role-card${role === r.value ? ' active' : ''}`}
                  onClick={() => handleRole(r.value)} role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleRole(r.value)}
                  aria-label={`Sign in as ${r.label}`}>
                  <div className="rc-icon-wrap">{r.icon}</div>
                  <div className="rc-label">{r.label}</div>
                  <div className="rc-sub">{r.sub}</div>
                  <span className="rc-cta">Enter portal
                    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M1 5h8M5.5 1.5L9 5l-3.5 3.5" /></svg>
                  </span>
                </div>
              ))}

              {/* Guest card — 4th card, same style */}
              <div
                className={`role-card guest-card${role === 'guest' ? ' active' : ''}`}
                onClick={() => handleRole('guest')} role="button" tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleRole('guest')}
                aria-label="Guest hotel booking login"
              >
                <div className="rc-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                
                <div className="rc-label">Guest</div>
                <div className="rc-sub">Hotel booking & stays</div>
                <span className="rc-cta">Enter portal
                  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M1 5h8M5.5 1.5L9 5l-3.5 3.5" /></svg>
                </span>
              </div>
            </div>
          </div>

          <div className="scroll-hint">
            <span>Scroll to explore</span>
            <div className="scroll-arrow" />
          </div>
        </section>

        {/* GALLERY */}
        <section className="gallery-section">
          <div className="section-inner">
            <div data-reveal>
              <p className="section-label">The Property</p>
              <h2 className="section-h2">Spaces That <em>Speak</em><br />for Themselves</h2>
            </div>
            <div className="gallery-grid">
              {GALLERY.map((img, i) => (
                <div key={i} className="gal-item" data-reveal style={{ transitionDelay: `${i * 0.1}s` }}>
                  <img src={img.src} alt={img.alt} loading="lazy" />
                  <div className="gal-overlay"><span>{img.alt}</span></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="stats-section">
          <div className="stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="stat-item" data-reveal style={{ transitionDelay: `${i * 0.11}s` }}>
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ROOMS */}
        <section className="rooms-section" id="rooms">
          <div className="section-inner">
            <div className="rooms-header">
              <div data-reveal><p className="section-label">Accommodations</p><h2 className="section-h2">Rooms <em>Crafted</em><br />for Every Guest</h2></div>
              <p className="section-body" data-reveal="right">From intimate classic doubles to expansive presidential suites — every room is managed with precision. Availability, housekeeping, and billing unified in one elegant dashboard.</p>
            </div>
            <div className="rooms-grid">
              {ROOMS.map((r, i) => (
                <div key={i} className="room-card" data-reveal style={{ transitionDelay: `${i * 0.13}s` }}>
                  <div className="room-img-wrap"><img src={r.src} alt={r.name} loading="lazy" /><div className="room-tag">{r.tag}</div></div>
                  <div className="room-info"><div className="room-name">{r.name}</div><div className="room-desc">{r.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features-section" id="features">
          <div className="section-inner">
            <div className="features-header">
              <div data-reveal><p className="section-label">What We Manage</p><h2 className="section-h2">Everything Under<br />One <em>Intelligent</em> Roof</h2></div>
              <p className="section-body" data-reveal="right">CloudInn brings every corner of hotel operations into a single, cohesive platform — so your team spends less time switching tools and more time delighting guests.</p>
            </div>
            <div className="features-grid">
              {FEATURES.map((f, i) => (
                <div key={i} className="feat-card" data-reveal style={{ transitionDelay: `${i * 0.08}s` }}>
                  <div className="feat-icon">{f.icon}</div>
                  <div className="feat-name">{f.label}</div>
                  <p className="feat-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-top">
            <div className="footer-brand">
              <Image src="/cloudinn.png" alt="CloudInn" width={120} height={38} />
              <p>A complete hotel management platform built for modern hospitality — elegant, fast, and reliable.</p>
            </div>
            <div className="footer-col">
              <h4>Portal</h4>
              <ul>
                <li><button onClick={() => handleRole('admin')}>Admin Login</button></li>
                <li><button onClick={() => handleRole('owner')}>Owner Login</button></li>
                <li><button onClick={() => handleRole('receptionist')}>Receptionist Login</button></li>
                <li><button onClick={() => router.push('/guest/login')}>Guest Login</button></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Explore</h4>
              <ul>
                <li><button onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior:'smooth' })}>Rooms</button></li>
                <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior:'smooth' })}>Features</button></li>
                <li><button onClick={() => router.push('/role/about-us')}>About Us</button></li>
                <li><button onClick={() => router.push('/role/contact-us')}>Contact</button></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>System</h4>
              <ul>
                <li><button>Room Management</button></li>
                <li><button>Reservations</button></li>
                <li><button>Analytics</button></li>
                <li><button>Billing</button></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 CloudInn · Hotel Management System</p>
            <div className="f-dots"><div className="f-dot" /><div className="f-dot" /><div className="f-dot" /></div>
            <p>All Rights Reserved</p>
          </div>
        </footer>

      </div>
    </>
  );
}