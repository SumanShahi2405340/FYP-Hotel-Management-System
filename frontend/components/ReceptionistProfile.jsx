"use client";

// ReceptionistProfilePanel.jsx
// Shows registered receptionist details and uses a dummy profile image until receptionist uploads/updates one.

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FaUserTie,
  FaEnvelope,
  FaPhone,
  FaCheckCircle,
  FaArrowLeft,
  FaIdBadge,
  FaSpinner,
} from "react-icons/fa";

export default function ReceptionistProfilePanel() {
  const router = useRouter();
  const params = useParams();

  /*
    This supports route:
    /admin/receptionist-profile/70

    Folder example:
    app/admin/receptionist-profile/[id]/page.js
  */
  const hotelId = params?.id;

  const [receptionist, setReceptionist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dummyReceptionist = {
    name: "Receptionist",
    email: "Not updated yet",
    contact: "Not updated yet",
    status: "Active",
    photo: "/owner-photo.jpg",
  };

  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("authToken") ||
          localStorage.getItem("access") ||
          localStorage.getItem("access_token") ||
          localStorage.getItem("token")
        : null;

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const fetchReceptionistProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const url = hotelId
          ? `http://127.0.0.1:8000/api/hotels/${hotelId}/receptionists/`
          : "http://127.0.0.1:8000/api/receptionist/profile/";

        const res = await fetch(url, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          throw new Error("Failed to fetch receptionist profile");
        }

        const data = await res.json();

        let profile = null;

        if (Array.isArray(data?.receptionists)) {
          profile = data.receptionists[0] || null;
        } else if (Array.isArray(data)) {
          profile = data[0] || null;
        } else {
          profile = data;
        }

        if (!profile) {
          setReceptionist(dummyReceptionist);
          return;
        }

        setReceptionist({
          name:
            profile.name ||
            profile.full_name ||
            profile.username ||
            dummyReceptionist.name,

          email: profile.email || dummyReceptionist.email,

          contact:
            profile.contact ||
            profile.phone ||
            profile.phone_number ||
            profile.number ||
            dummyReceptionist.contact,

          status: profile.status || dummyReceptionist.status,

          photo:
            profile.photo ||
            profile.image ||
            profile.profile_image ||
            profile.profile_photo ||
            dummyReceptionist.photo,

          id: profile.id,
        });
      } catch (err) {
        console.error("Error fetching receptionist:", err);
        setError("Could not load receptionist from server. Showing dummy profile.");
        setReceptionist(dummyReceptionist);
      } finally {
        setLoading(false);
      }
    };

    fetchReceptionistProfile();
  }, [hotelId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <FaSpinner className="animate-spin text-amber-400 text-4xl mx-auto mb-4" />
          <p className="text-white/70">Loading receptionist profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat px-5 py-8"
      style={{
        backgroundImage: "url('/register.jpg')",
      }}
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

            {error && (
              <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {error}
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
              <div className="w-full lg:w-[320px] rounded-2xl border border-amber-500/25 bg-black/45 p-7 text-center">
                <div className="mx-auto w-36 h-36 rounded-full border-4 border-amber-500/45 bg-amber-500/10 p-1 shadow-[0_0_35px_rgba(245,158,11,0.22)]">
                  <img
                    src={receptionist.photo || dummyReceptionist.photo}
                    alt="Receptionist profile"
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = dummyReceptionist.photo;
                    }}
                  />
                </div>

                <h1 className="mt-5 text-2xl md:text-3xl font-bold text-white leading-tight">
                  {receptionist.name}
                </h1>

                <p className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-300">
                  <FaUserTie />
                  Receptionist
                </p>
              </div>

              <div className="flex-1 w-full">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.35em] text-amber-400">
                    Registered Receptionist
                  </p>
                  <h2 className="mt-2 text-3xl md:text-4xl font-bold text-white">
                    Profile Details
                  </h2>
                  <p className="mt-2 text-white/55">
                    Details are fetched from registered receptionist data. A dummy
                    image is shown until the receptionist updates their profile.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <DetailCard
                    icon={<FaIdBadge />}
                    label="Full Name"
                    value={receptionist.name}
                  />

                  <DetailCard
                    icon={<FaEnvelope />}
                    label="Email"
                    value={receptionist.email}
                  />

                  <DetailCard
                    icon={<FaPhone />}
                    label="Contact"
                    value={receptionist.contact}
                  />

                  <DetailCard
                    icon={<FaCheckCircle />}
                    label="Status"
                    value={receptionist.status}
                  />

                  <DetailCard
                    icon={<FaUserTie />}
                    label="Role"
                    value="Receptionist"
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
                  <p className="text-sm text-amber-200">
                    Note: If the card still shows dummy details, check that your
                    backend endpoint returns receptionist data for this hotel ID:
                    <span className="font-semibold text-white"> {hotelId || "No ID found"}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-white/40">
          Receptionist Profile Panel
        </p>
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
          <p className="text-xs uppercase tracking-[0.22em] text-amber-400">
            {label}
          </p>
          <p className="mt-2 text-white font-semibold break-words">
            {value || "Not updated yet"}
          </p>
        </div>
      </div>
    </div>
  );
}
