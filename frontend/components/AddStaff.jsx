"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";   // axios instance with owner tokens

export default function AddStaff() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    role: "",          //  added role field
    age: "",
    email: "",
    contact: "",
    address: "",
    citizenship: "",
    joined_date: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // POST to backend
      const res = await api.post("/api/hotel/add-staff/", formData);
      if (res.status === 201) {
        alert("Staff added successfully!");
        router.push("/receptionist/manage-staffnnattendance");
      }
    } catch (err) {
      console.error("Error adding staff:", err.response?.data || err.message);
      alert("Failed to add staff. Please try again.");
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        minHeight: "100vh",
        backgroundImage: "url('/register.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "rgba(255,255,255,0.9)",
          padding: "30px",
          borderRadius: "10px",
          width: "480px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        }}
      >
        <h2 style={{ textAlign: "center", fontWeight: "bold", fontSize: "24px", marginBottom: "20px" }}>
          Staff Details Form
        </h2>
        
        <input type="text" name="name" placeholder="Staff Name" value={formData.name}
          onChange={handleChange} style={inputStyle} required />

        {/*  Fixed binding to formData.role */}
        <input type="text" name="role" placeholder="Staff Role" value={formData.role}
          onChange={handleChange} style={inputStyle} required />

        <input type="number" name="age" placeholder="Age" value={formData.age}
          onChange={handleChange} style={inputStyle} required />
        <input type="email" name="email" placeholder="Email" value={formData.email}
          onChange={handleChange} style={inputStyle} required />
        <input type="text" name="contact" placeholder="Contact Number" value={formData.contact}
          onChange={handleChange} style={inputStyle} required />
        <input type="text" name="address" placeholder="Permanent Address" value={formData.address}
          onChange={handleChange} style={inputStyle} required />
        <input type="text" name="citizenship" placeholder="Citizenship Number" value={formData.citizenship}
          onChange={handleChange} style={inputStyle} required />
        <input type="date" name="joined_date" placeholder="YYYY-MM-DD" value={formData.joined_date}
          onChange={handleChange} style={inputStyle} required />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "15px",
            marginTop: "12px",
          }}
        >
          Submit
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "14px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "15px",
};
