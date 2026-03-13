"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Helper: refresh access token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const res = await fetch("http://localhost:8000/api/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("authToken", data.access);
      return data.access;
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      return null;
    }
  } catch (err) {
    console.error("Refresh failed", err);
    return null;
  }
};

export default function ReceptionistDetailsForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    email: "",
    contact: "",
    permanent_address: "",
    citizenship: "",
    joined_date: "",
    status: "Active",
    role: "Receptionist",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    let token = localStorage.getItem("authToken");

    try {
      let res = await fetch("http://localhost:8000/api/receptionist/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.status === 401 || res.status === 400) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          res = await fetch("http://localhost:8000/api/receptionist/register/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newToken}`,
            },
            body: JSON.stringify(formData),
          });
        }
      }

      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));

      setMessage(data.message || "Receptionist registered successfully!");

      //  Redirect after success
      router.push("/owner/manage-staffnattendance");

    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-6"
      style={{ backgroundImage: "url('/register.jpg')" }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-md shadow-2xl rounded-xl p-8 w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
          Receptionist Details Form
        </h2>

        <div className="space-y-4">
          <input type="text" name="name" placeholder="Receptionist Name"
            value={formData.name} onChange={handleChange}
            className="w-full border p-2 rounded" required />
          <input type="number" name="age" placeholder="Age"
            value={formData.age} onChange={handleChange}
            className="w-full border p-2 rounded" />
          <input type="email" name="email" placeholder="Email"
            value={formData.email} onChange={handleChange}
            className="w-full border p-2 rounded" required />
          <input type="text" name="contact" placeholder="Contact Number"
            value={formData.contact} onChange={handleChange}
            className="w-full border p-2 rounded" />
          <input type="text" name="permanent_address" placeholder="Permanent Address"
            value={formData.permanent_address} onChange={handleChange}
            className="w-full border p-2 rounded" />
          <input type="text" name="citizenship" placeholder="Citizenship Number"
            value={formData.citizenship} onChange={handleChange}
            className="w-full border p-2 rounded" />
          <input type="text" name="joined_date" placeholder="YYYY-MM-DD"
            value={formData.joined_date} onChange={handleChange}
            className="w-full border p-2 rounded"
            pattern="\d{4}-\d{2}-\d{2}" title="Enter date in YYYY-MM-DD format" required />
        </div>

        <button type="submit" disabled={loading}
          className="w-full mt-6 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          {loading ? "Submitting..." : "Submit"}
        </button>

        {message && (
          <p className="mt-4 text-center text-gray-700 font-medium">{message}</p>
        )}
      </form>
    </div>
  );
}

