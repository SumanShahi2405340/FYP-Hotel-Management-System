"use client";

// AdminProfile.jsx
// Corrected version: works with Django endpoint /api/admin/profile/
// Fixes 403 fallback handling and removes missing /owner-photo.jpg dependency.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaUserShield,
  FaEnvelope,
  FaPhone,
  FaCheckCircle,
  FaArrowLeft,
  FaIdBadge,
  FaMapMarkerAlt,
  FaUserTie,
  FaCamera,
} from "react-icons/fa";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="300" height="300" fill="#1f1f1f"/>
    <circle cx="150" cy="105" r="55" fill="#f59e0b"/>
    <path d="M55 265c13-64 57-98 95-98s82 34 95 98" fill="#f59e0b"/>
  </svg>`);

const fallbackAdmin = {
  name: "Suman Shahi",
  email: "suman.shahi@example.com",
  contact: "+977 9800000000",
  address: "Kathmandu, Nepal",
  role: "System Admin",
  status: "Active",
  photo_url: null,
};

function getToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminProfile() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [admin, setAdmin] = useState(fallbackAdmin);
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATAR);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/profile/`, {
          method: "GET",
          headers: {
            ...authHeaders(),
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.detail || data?.error || "Could not load admin profile"
          );
        }

        if (ignore) return;
        const nextAdmin = { ...fallbackAdmin, ...data };
        setAdmin(nextAdmin);
        setProfileImage(data.photo_url || DEFAULT_AVATAR);
        setMessage("");
      } catch (error) {
        console.error("Admin profile load error:", error);
        if (!ignore) {
          setAdmin(fallbackAdmin);
          setProfileImage(DEFAULT_AVATAR);
          setMessage(
            "Backend profile not loaded. Showing default admin details. Please check backend URL and login token."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      ignore = true;
    };
  }, []);

  const handleChoosePicture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please choose a valid image file.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setProfileImage(previewUrl);
    setSaving(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(`${API_BASE}/admin/profile/`, {
        method: "PATCH",
        headers: {
          ...authHeaders(),
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || data?.error || "Image upload failed");
      }

      setAdmin((prev) => ({ ...prev, ...data }));
      setProfileImage(data.photo_url || previewUrl);
      setMessage("Profile picture updated successfully.");
    } catch (error) {
      console.error("Admin profile upload error:", error);
      setMessage(error.message || "Could not update profile picture.");
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat px-5 py-8"
      style={{ backgroundImage: "url('/register.jpg')" }}
    >
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 bg-black/40 text-amber-300 hover:bg-amber-500/15 transition"
        >
          <FaArrowLeft size={13} />
          Back
        </button>

        <div className="rounded-3xl border border-amber-500/35 bg-black/65 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="relative p-8 md:p-10">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
              <div className="w-full lg:w-[320px] rounded-2xl border border-amber-500/25 bg-black/45 p-7 text-center">
                <div className="mx-auto w-36 h-36 rounded-full border-4 border-amber-500/45 bg-amber-500/10 p-1 shadow-[0_0_35px_rgba(245,158,11,0.22)]">
                  <img
                    src={profileImage || DEFAULT_AVATAR}
                    alt="Admin profile"
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleChoosePicture}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60 transition"
                >
                  <FaCamera />
                  {saving ? "Uploading..." : "Add Picture"}
                </button>

                <h1 className="mt-5 text-2xl md:text-3xl font-bold text-white leading-tight">
                  {admin.name}
                </h1>

                <p className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-300">
                  <FaUserShield />
                  Admin
                </p>
              </div>

              <div className="flex-1 w-full">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.35em] text-amber-400">
                    Admin Profile
                  </p>
                  <h2 className="mt-2 text-3xl md:text-4xl font-bold text-white">
                    Profile Details
                  </h2>
                  <p className="mt-2 text-white/55">
                    {loading
                      ? "Loading profile from backend..."
                      : "This profile is loaded from Django backend and supports profile picture upload."}
                  </p>
                  {message && (
                    <p className="mt-3 text-sm text-amber-300">{message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <DetailCard icon={<FaIdBadge />} label="Full Name" value={admin.name} />
                  <DetailCard icon={<FaEnvelope />} label="Email" value={admin.email} />
                  <DetailCard icon={<FaPhone />} label="Contact" value={admin.contact} />
                  <DetailCard icon={<FaMapMarkerAlt />} label="Address" value={admin.address} />
                  <DetailCard icon={<FaUserTie />} label="Role" value={admin.role} />
                  <DetailCard icon={<FaCheckCircle />} label="Status" value={admin.status} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-white/40">Admin Profile Panel</p>
      </div>
    </div>
  );
}

function DetailCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-black/40 p-5 hover:border-amber-400/50 transition">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-400">{label}</p>
          <p className="mt-2 text-white font-semibold break-words">
            {value || "Not updated yet"}
          </p>
        </div>
      </div>
    </div>
  );
}
