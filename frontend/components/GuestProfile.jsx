'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaArrowLeft,
  FaCamera,
  FaCheckCircle,
  FaEnvelope,
  FaIdBadge,
  FaMapMarkerAlt,
  FaPhone,
  FaSpinner,
  FaStar,
  FaTrophy,
  FaUser,
} from 'react-icons/fa';
import guestApi from '../utils/guestApi';

export default function GuestProfile() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [profile, setProfile] = useState({
    name: 'Guest User',
    email: '',
    contact: '',
    address: 'Kathmandu, Nepal',
    role: 'Guest',
    status: 'Active',
    tier: 'Silver',
    points: 4731,
  });

  useEffect(() => {
    const savedImage = localStorage.getItem('guestProfileImage') || '';
    setProfileImage(savedImage);
    fetchGuestProfile();
  }, []);

  const fetchGuestProfile = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await guestApi.get('/guest/profile/');
      const data = response.data || {};

      setProfile({
        name: data.name || data.username || 'Guest User',
        email: data.email || '',
        contact: data.contact || data.phone || '+977 9800000000',
        address: data.address || 'Kathmandu, Nepal',
        role: 'Guest',
        status: data.status || 'Active',
        tier: data.loyalty_tier || 'Silver',
        points: data.loyalty_points || 4731,
      });

      const savedImage = localStorage.getItem('guestProfileImage');
      if (!savedImage && (data.profile_picture || data.profile_image)) {
        setProfileImage(data.profile_picture || data.profile_image);
      }
    } catch (error) {
      console.error('Failed to load guest profile:', error);
      setMessage('Could not load profile from backend. Showing saved/default details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPictureClick = () => {
    fileInputRef.current?.click();
  };

  const handlePictureChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      setProfileImage(imageData);
      localStorage.setItem('guestProfileImage', imageData);
      setMessage('Profile picture added successfully.');
    };
    reader.readAsDataURL(file);
  };

  const firstLetter = profile.name?.trim()?.charAt(0)?.toUpperCase() || 'G';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <FaSpinner className="mx-auto text-yellow-400 text-4xl animate-spin mb-4" />
          <p className="text-gray-300">Loading guest profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07090f] text-white">
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800&auto=format')",
            filter: 'brightness(0.35) saturate(0.9)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1020]/95 via-black/90 to-[#1b1204]/90" />
      </div>

      <div className="relative z-10 p-4 md:p-6">
        <button
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 rounded-lg border border-yellow-500/40 bg-black/30 px-4 py-2 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 transition"
        >
          <FaArrowLeft />
          Back
        </button>

        <div className="max-w-6xl mx-auto rounded-3xl border border-yellow-600/45 bg-black/70 backdrop-blur-xl shadow-2xl p-5 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-7 items-start">
            <div className="rounded-2xl border border-yellow-600/35 bg-black/45 p-5 min-h-[340px] flex flex-col items-center justify-center text-center shadow-xl">
              <div className="relative mb-4">
                <div className="w-28 h-28 rounded-full border-[4px] border-yellow-700 bg-yellow-500/10 p-1 shadow-[0_0_25px_rgba(202,138,4,0.22)]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#1a1203] flex items-center justify-center">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={profile.name || 'Guest Profile'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-extrabold text-white">{firstLetter}</span>
                    )}
                  </div>
                </div>
                <span className="absolute bottom-2 right-3 w-4 h-4 rounded-full bg-green-500 border-2 border-black" />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePictureChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleAddPictureClick}
                className="mb-5 inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-yellow-400 transition shadow-lg shadow-yellow-500/20"
              >
                <FaCamera />
                Add Picture
              </button>

              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight break-words max-w-full">
                {profile.name || 'Guest User'}
              </h1>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-yellow-600/45 bg-yellow-500/10 px-4 py-1.5 text-sm text-yellow-400">
                <FaUser />
                Guest
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
                <FaTrophy className="text-yellow-400" />
                <span>{profile.tier} · {Number(profile.points || 0).toLocaleString()} pts</span>
              </div>
            </div>

            <div>
              <p className="tracking-[0.45em] text-xs text-yellow-400 uppercase mb-3">
                Guest Profile
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Profile Details</h2>
              <p className="text-gray-400 text-base max-w-3xl mb-6">
                This profile is loaded from the Django backend and supports profile picture selection from your laptop.
              </p>

              {message && (
                <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-yellow-200 text-sm">
                  {message}
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ProfileInfoCard icon={FaIdBadge} label="Full Name" value={profile.name || 'Guest User'} />
                <ProfileInfoCard icon={FaEnvelope} label="Email" value={profile.email || 'Not provided'} />
                <ProfileInfoCard icon={FaPhone} label="Contact" value={profile.contact || 'Not provided'} />
                <ProfileInfoCard icon={FaMapMarkerAlt} label="Address" value={profile.address || 'Kathmandu, Nepal'} />
                <ProfileInfoCard icon={FaUser} label="Role" value={profile.role || 'Guest'} />
                <ProfileInfoCard icon={FaCheckCircle} label="Status" value={profile.status || 'Active'} />
                <ProfileInfoCard icon={FaTrophy} label="Loyalty Tier" value={profile.tier || 'Silver'} />
                <ProfileInfoCard icon={FaStar} label="Points" value={`${Number(profile.points || 0).toLocaleString()} pts`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileInfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-yellow-600/35 bg-black/55 p-4 min-h-[95px] flex items-center gap-4 hover:border-yellow-500/60 transition">
      <div className="w-11 h-11 rounded-xl border border-yellow-500/45 bg-yellow-500/15 flex items-center justify-center shrink-0">
        <Icon className="text-yellow-400 text-lg" />
      </div>
      <div className="min-w-0">
        <p className="text-yellow-400 uppercase tracking-[0.28em] text-[11px] mb-2">{label}</p>
        <p className="text-white text-base font-semibold break-words">{value}</p>
      </div>
    </div>
  );
}
