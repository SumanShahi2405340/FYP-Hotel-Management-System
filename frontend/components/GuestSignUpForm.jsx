'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import guestApi from '../utils/guestApi';

export default function GuestSignUpForm() {
  const router = useRouter();
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredName, setRegisteredName] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', idType: 'passport', idNumber: '',
  });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim())  e.firstName = 'First name required';
    if (!form.lastName.trim())   e.lastName  = 'Last name required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (!form.phone.trim())      e.phone     = 'Phone number required';
    if (!form.city.trim())       e.city      = 'City required';
    if (!form.idNumber.trim())   e.idNumber  = 'ID number required';
    return e;
  };

  const handleSubmit = async () => {
    setApiError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const registerData = {
        name: `${form.firstName} ${form.lastName}`,
        email: form.email.trim(),
        contact: form.phone,
        address: `${form.address}, ${form.city}`,
        id_proof: `${form.idType}: ${form.idNumber}`,
      };
      
      const response = await guestApi.post('/guest/register/', registerData);
      const data = response.data;

      if (response.status === 201 || response.status === 200) {
        // Store JWT tokens from registration response
        if (data.access && data.refresh) {
          localStorage.setItem('guest_access_token', data.access);
          localStorage.setItem('guest_refresh_token', data.refresh);
          console.log('JWT tokens stored successfully');
        } else {
          console.warn('No tokens received in registration response');
        }
        
        // Store guest info
        localStorage.setItem('guestUser', JSON.stringify({
          id: data.guest?.id || data.id,
          name: data.guest?.name || data.name,
          email: data.guest?.email || data.email
        }));
        
        setRegisteredEmail(form.email);
        setRegisteredName(`${form.firstName} ${form.lastName}`);
        setStep('success');
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          router.push('/guest/dashboard');
        }, 3000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setApiError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-indigo-900/40"></div>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`, backgroundRepeat: 'repeat' }}></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>
        <div className="relative z-20 w-full max-w-sm mx-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-200 to-emerald-400 bg-clip-text text-transparent">Welcome {registeredName}!</h2>
            <p className="text-gray-300 text-sm mt-1">Your account has been created successfully.</p>
            <div className="mt-3 p-2 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-gray-400">Credentials sent to</p>
              <p className="text-emerald-400 font-mono text-xs break-all">{registeredEmail}</p>
              <p className="text-xs text-gray-400 mt-2">Please check your email for login credentials.</p>
              <p className="text-xs text-amber-400 mt-1">You are now automatically logged in!</p>
            </div>
            <button onClick={() => router.push('/guest/dashboard')} className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 rounded-lg text-sm hover:from-emerald-600 hover:to-emerald-700 transition">
              Go to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form JSX
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-indigo-900/40"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`, backgroundRepeat: 'repeat' }}></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-1 h-1 bg-white/20 rounded-full animate-float"></div>
          <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-white/20 rounded-full animate-float delay-300"></div>
          <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-white/20 rounded-full animate-float delay-500"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white/20 rounded-full animate-float delay-700"></div>
        </div>
      </div>

      <div className="relative z-20 w-full max-w-3xl mx-4 my-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="relative px-4 pt-5 pb-3 text-center border-b border-white/10">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 mb-2">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">Create Account</h1>
            <p className="text-gray-400 text-xs mt-0.5">Join CloudInn and start your seamless hotel experience</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-6 h-px bg-gradient-to-r from-transparent to-amber-500/50"></div>
              <div className="w-1 h-1 rounded-full bg-amber-500/70"></div>
              <div className="w-6 h-px bg-gradient-to-l from-transparent to-amber-500/50"></div>
            </div>
          </div>

          <div className="p-4 md:p-5">
            {apiError && (
              <div className="mb-4 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {apiError}
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2"><span className="w-1 h-4 bg-amber-500 rounded-full"></span>Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-medium text-gray-400 mb-0.5">First Name *</label><input className="w-full px-3 py-1.5 bg-white/5 border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white text-sm" placeholder="John" value={form.firstName} onChange={set('firstName')} />{errors.firstName && <p className="text-[10px] text-red-400 mt-0.5">{errors.firstName}</p>}</div>
                <div><label className="block text-[10px] font-medium text-gray-400 mb-0.5">Last Name *</label><input className="w-full px-3 py-1.5 bg-white/5 border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white text-sm" placeholder="Doe" value={form.lastName} onChange={set('lastName')} />{errors.lastName && <p className="text-[10px] text-red-400 mt-0.5">{errors.lastName}</p>}</div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2"><span className="w-1 h-4 bg-amber-500 rounded-full"></span>Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-medium text-gray-400 mb-0.5">Email *</label><input type="email" className="w-full px-3 py-1.5 bg-white/5 border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" placeholder="you@example.com" value={form.email} onChange={set('email')} />{errors.email && <p className="text-[10px] text-red-400 mt-0.5">{errors.email}</p>}</div>
                <div><label className="block text-[10px] font-medium text-gray-400 mb-0.5">Phone *</label><input type="tel" className="w-full px-3 py-1.5 bg-white/5 border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" placeholder="+1 234 567 8900" value={form.phone} onChange={set('phone')} />{errors.phone && <p className="text-[10px] text-red-400 mt-0.5">{errors.phone}</p>}</div>
                <div className="md:col-span-2"><label className="block text-[10px] font-medium text-gray-400 mb-0.5">Address</label><input className="w-full px-3 py-1.5 bg-white/5 border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" placeholder="Street address" value={form.address} onChange={set('address')} /></div>
                <div><label className="block text-[10px] font-medium text-gray-400 mb-0.5">City *</label><input className="w-full px-3 py-1.5 bg-white/5 border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" placeholder="New York" value={form.city} onChange={set('city')} />{errors.city && <p className="text-[10px] text-red-400 mt-0.5">{errors.city}</p>}</div>
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2"><span className="w-1 h-4 bg-amber-500 rounded-full"></span>Identification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-medium text-gray-400 mb-0.5">ID Type</label><select className="w-full px-3 py-1.5 bg-white/5 border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 text-white text-sm" value={form.idType} onChange={set('idType')}><option value="passport">Passport</option><option value="national_id">National ID</option><option value="driving_license">Driving License</option></select></div>
                <div><label className="block text-[10px] font-medium text-gray-400 mb-0.5">ID Number *</label><input className="w-full px-3 py-1.5 bg-white/5 border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" placeholder="AB123456" value={form.idNumber} onChange={set('idNumber')} />{errors.idNumber && <p className="text-[10px] text-red-400 mt-0.5">{errors.idNumber}</p>}</div>
              </div>
            </div>

            <div className="mb-4 p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg text-[10px] text-gray-400 flex items-start gap-1.5">
              <svg className="w-3 h-3 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>After registration, your <strong className="text-amber-400">username</strong> and <strong className="text-amber-400">password</strong> will be emailed to you. You will be automatically logged in.</span>
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={handleSubmit} disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 rounded-lg font-semibold text-sm hover:from-amber-600 hover:to-amber-700 transition transform hover:scale-[1.01] disabled:opacity-50">
                {loading ? <div className="flex items-center justify-center gap-1"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Creating Account…</div> : 'Create My Account'}
              </button>
              <div className="relative my-1"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div><div className="relative flex justify-center text-[10px]"><span className="px-2 bg-transparent text-gray-400">Already have an account?</span></div></div>
              <button onClick={() => router.push('/guest/login')} className="w-full bg-white/5 border border-white/10 text-white py-2 rounded-lg font-semibold text-sm hover:bg-white/10 transition">Login Instead</button>
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-amber-400 transition"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Back to Home</Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float { 0%,100% { transform: translateY(0px); opacity: 0.2; } 50% { transform: translateY(-20px); opacity: 0.4; } }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}