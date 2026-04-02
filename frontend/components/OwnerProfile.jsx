'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OwnerProfile() {
  const router = useRouter();
  const params = useParams();
  const id = params.id; // dynamic id from URL
  const [owner, setOwner] = useState(null);

  // Fetch owner data from backend
  useEffect(() => {
    if (id) {
      fetch(`http://localhost:8000/api/hotels/${id}/oprofile/`) // correct endpoint
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch owner profile");
          return res.json();
        })
        .then((data) => setOwner(data))
        .catch((err) => console.error('Error fetching owner:', err));
    }
  }, [id]);

  if (!owner) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        <div className="relative z-10 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
          <p className="text-gray-400">Loading owner profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1800&auto=format&fit=crop')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark Overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80 z-0"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-400/5 rounded-full blur-3xl"></div>
        
        {/* Decorative Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(200,169,110,0.1)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Decorative Lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent z-10"></div>

      <div className="relative z-20 w-full max-w-7xl transform -translate-y-16">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 hover:border-amber-500/30 transition-all duration-500 overflow-hidden">
          
          {/* Photo Section */}
          <div className="flex flex-col items-center pt-12 pb-6 bg-gradient-to-b from-amber-500/10 to-transparent">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse"></div>
              <img
                src={owner.photo || '/owner-photo.jpg'}
                alt="Owner"
                className="relative w-32 h-32 rounded-full border-4 border-amber-500/50 shadow-2xl object-cover bg-gradient-to-br from-amber-500/20 to-amber-600/20"
              />
              {/* Decorative ring */}
              <div className="absolute -inset-2 rounded-full border border-amber-500/30 opacity-50"></div>
            </div>
            <h2 className="text-2xl font-bold mt-4 bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              {owner.owner}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-amber-500/50"></div>
              <p className="text-amber-400 text-sm tracking-wider uppercase">Hotel Owner</p>
              <div className="w-8 h-px bg-gradient-to-l from-transparent to-amber-500/50"></div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => router.push(`/admin/owner-profile/${id}/edit`)}
              className="group flex items-center gap-2 px-6 py-2.5 mt-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 transform hover:scale-105 font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          </div>

          {/* Details Section */}
          <div className="bg-white/5 rounded-xl p-6 m-6 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-amber-500 rounded-full"></div>
              <h3 className="text-xl font-semibold text-white">Profile Details</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              {/* Age */}
              <div className="bg-black/40 rounded-lg p-4 border border-white/10 hover:border-amber-500/30 transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-all">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <p className="font-medium text-gray-400">Age</p>
                </div>
                <p className="text-white ml-11">{owner.age} years</p>
              </div>

              {/* Email */}
              <div className="bg-black/40 rounded-lg p-4 border border-white/10 hover:border-amber-500/30 transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-all">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <p className="font-medium text-gray-400">Email</p>
                </div>
                <p className="text-white ml-11 break-all">{owner.email}</p>
              </div>

              {/* Owner Contact */}
              <div className="bg-black/40 rounded-lg p-4 border border-white/10 hover:border-amber-500/30 transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-all">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                  </div>
                  <p className="font-medium text-gray-400">Owner Contact</p>
                </div>
                <p className="text-white ml-11">{owner.owner_contact}</p>
              </div>

              {/* Citizenship Number */}
              <div className="bg-black/40 rounded-lg p-4 border border-white/10 hover:border-amber-500/30 transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-all">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
                    </svg>
                  </div>
                  <p className="font-medium text-gray-400">Citizenship Number</p>
                </div>
                <p className="text-white ml-11">{owner.citizenship}</p>
              </div>

              {/* Permanent Address - Full Width */}
              <div className="md:col-span-2 bg-black/40 rounded-lg p-4 border border-white/10 hover:border-amber-500/30 transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-all">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <p className="font-medium text-gray-400">Permanent Address</p>
                </div>
                <p className="text-white ml-11">{owner.permanent_address}</p>
              </div>
            </div>
          </div>

          {/* Footer Decoration */}
          <div className="px-8 pb-6">
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500/30"></div>
              <div className="w-2 h-2 rounded-full bg-amber-500/30"></div>
              <div className="w-2 h-2 rounded-full bg-amber-500/30"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}