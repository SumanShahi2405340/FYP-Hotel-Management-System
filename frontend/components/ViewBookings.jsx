// components/ViewBookings.jsx
"use client";
import React, { useState, useEffect } from "react";

export default function ViewBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch bookings from backend
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://127.0.0.1:8000/api/manage-bookings/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        // Handle both paginated and plain list responses
        setBookings(data.results || data);
      } else {
        console.error("Failed to fetch bookings");
      }
    } catch (err) {
      console.error("Error fetching bookings", err);
    } finally {
      setLoading(false);
    }
  };

  // Load bookings when component mounts
  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.75)", // semi-transparent white
        backdropFilter: "blur(6px)",                // frosted glass effect
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        marginTop: "20px",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "15px" }}>View Bookings</h2>

      {loading ? (
        <p style={{ textAlign: "center" }}>Loading bookings...</p>
      ) : (
        <table
          border="1"
          cellPadding="10"
          style={{ width: "100%", textAlign: "left", backgroundColor: "rgba(255,255,255,0.9)" }}
        >
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Room Number / Class</th>
              <th>Stay Days</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((booking, index) => (
                <tr key={index}>
                  <td>{booking.name}</td>
                  <td>{booking.email}</td>
                  <td>{booking.contact}</td>
                  <td>{booking.room}</td>
                  <td>{booking.days}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
