'use client';
// Owner signup form for registering hotel details using the same CloudInn guest signup design.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OwnerSignupForm() {
  const router = useRouter();

  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredHotel, setRegisteredHotel] = useState('');

  const [form, setForm] = useState({
    name: '',
    owner: '',
    contact: '',
    email: '',
    location: '',
    pan: '',
    age: '',
    owner_contact: '',
    citizenship: '',
    permanent_address: '',
  });

  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = 'Hotel name is required';
    if (!form.owner.trim()) newErrors.owner = 'Owner name is required';
    if (!form.contact.trim()) newErrors.contact = 'Hotel contact is required';

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!form.location.trim()) newErrors.location = 'Hotel location is required';
    if (!form.pan.trim()) newErrors.pan = 'PAN number is required';
    if (!form.age.trim()) newErrors.age = 'Owner age is required';
    if (!form.owner_contact.trim()) newErrors.owner_contact = 'Owner contact is required';
    if (!form.citizenship.trim()) newErrors.citizenship = 'Citizenship number is required';
    if (!form.permanent_address.trim()) newErrors.permanent_address = 'Permanent address is required';

    return newErrors;
  };

  const handleSubmit = async () => {
    setApiError('');

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/hotels/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setRegisteredEmail(form.email);
        setRegisteredHotel(form.name);
        setStep('success');

        setForm({
          name: '',
          owner: '',
          contact: '',
          email: '',
          location: '',
          pan: '',
          age: '',
          owner_contact: '',
          citizenship: '',
          permanent_address: '',
        });
      } else {
        setApiError(data.detail || data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Hotel registration error:', err);
      setApiError('Network error. Could not connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-indigo-900/40"></div>

          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
            }}
          ></div>

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

            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-200 to-emerald-400 bg-clip-text text-transparent">
              Hotel Registered!
            </h2>

            <p className="text-gray-300 text-sm mt-1">
              {registeredHotel} has been submitted successfully.
            </p>

            <div className="mt-3 p-2 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-gray-400">Credentials will be sent to</p>
              <p className="text-emerald-400 font-mono text-xs break-all">{registeredEmail}</p>
              <p className="text-xs text-gray-400 mt-2">
                Please check your email for owner login username and password.
              </p>
            </div>

            <button
              onClick={() => router.push('/owner/login')}
              className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 rounded-lg text-sm hover:from-emerald-600 hover:to-emerald-700 transition"
            >
              Go to Owner Login →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-indigo-900/40"></div>

        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        ></div>

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-20 w-full max-w-3xl mx-4 my-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="relative px-4 pt-5 pb-3 text-center border-b border-white/10">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 mb-2">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9h1M9 13h1M9 17h1M14 13h1M14 17h1" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              Create Owner Account
            </h1>

            <p className="text-gray-400 text-xs mt-0.5">
              Register your hotel and join CloudInn owner portal
            </p>
          </div>

          <div className="p-4 md:p-5">
            {apiError && (
              <div className="mb-4 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                {apiError}
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                Hotel Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Hotel Name *" placeholder="Hotel CloudInn" value={form.name} onChange={set('name')} error={errors.name} />
                <Input label="Hotel Contact *" placeholder="+977 9800000000" value={form.contact} onChange={set('contact')} error={errors.contact} />
                <Input label="Hotel Location *" placeholder="Kathmandu" value={form.location} onChange={set('location')} error={errors.location} />
                <Input label="PAN Number *" placeholder="PAN number" value={form.pan} onChange={set('pan')} error={errors.pan} />
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                Owner Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Owner Name *" placeholder="Owner full name" value={form.owner} onChange={set('owner')} error={errors.owner} />
                <Input type="number" label="Owner Age *" placeholder="Age" value={form.age} onChange={set('age')} error={errors.age} />
                <Input label="Owner Contact *" placeholder="+977 9800000000" value={form.owner_contact} onChange={set('owner_contact')} error={errors.owner_contact} />
                <Input type="email" label="Email *" placeholder="owner@example.com" value={form.email} onChange={set('email')} error={errors.email} />
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                Verification Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Citizenship Number *" placeholder="Citizenship number" value={form.citizenship} onChange={set('citizenship')} error={errors.citizenship} />
                <Input label="Permanent Address *" placeholder="Permanent address" value={form.permanent_address} onChange={set('permanent_address')} error={errors.permanent_address} />
              </div>
            </div>

            <div className="mb-4 p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg text-[10px] text-gray-400">
              After registration, your <strong className="text-amber-400">owner username</strong> and{' '}
              <strong className="text-amber-400">password</strong> will be emailed to you after hotel approval.
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 rounded-lg font-semibold text-sm hover:from-amber-600 hover:to-amber-700 transition transform hover:scale-[1.01] disabled:opacity-50"
              >
                {loading ? 'Creating Account…' : 'Create Owner Account'}
              </button>

              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="px-2 bg-transparent text-gray-400">
                    Already have an owner account?
                  </span>
                </div>
              </div>

              <button
                onClick={() => router.push('/owner/login')}
                className="w-full bg-white/5 border border-white/10 text-white py-2 rounded-lg font-semibold text-sm hover:bg-white/10 transition"
              >
                Login Instead
              </button>
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-amber-400 transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px);
            opacity: 0.4;
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function Input({ label, placeholder, value, onChange, error, type = 'text' }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-gray-400 mb-0.5">
        {label}
      </label>
      <input
        type={type}
        className="w-full px-3 py-1.5 bg-white/5 border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white text-sm"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {error && <p className="text-[10px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}