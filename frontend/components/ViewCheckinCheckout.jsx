"use client";
import React, { useState } from "react";

const dummyGuests = [
  {
    id: 1,
    name: "John Doe",
    room: "101 / Normal",
    contact: "9876543210",
    checkIn: "2026-01-02 14:00",
    checkOut: "2026-01-04 11:00",
    status: "Pending",
  },
  {
    id: 2,
    name: "Jane Smith",
    room: "102 / Deluxe",
    contact: "9812345678",
    checkIn: "2026-01-02 15:00",
    checkOut: "2026-01-05 10:00",
    status: "Checked-in",
  },
];

const ViewCheckinCheckout = () => {
  const [filter, setFilter] = useState("all");

  const filteredGuests =
    filter === "all"
      ? dummyGuests
      : dummyGuests.filter((g) => g.status === filter);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Check-in / Check-out</h2>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div style={cardStyle}>Checked-in: 5</div>
        <div style={cardStyle}>Checked-out: 3</div>
        <div style={cardStyle}>Pending Check-ins: 2</div>
        <div style={cardStyle}>Pending Check-outs: 1</div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setFilter("all")} style={btnStyle}>
          All
        </button>
        <button onClick={() => setFilter("Checked-in")} style={btnStyle}>
          Checked-in
        </button>
        <button onClick={() => setFilter("Checked-out")} style={btnStyle}>
          Checked-out
        </button>
        <button onClick={() => setFilter("Pending")} style={btnStyle}>
          Pending
        </button>
      </div>

      {/* Table */}
      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", textAlign: "left" }}
      >
        <thead>
          <tr>
            <th>Guest Name</th>
            <th>Room</th>
            <th>Contact</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredGuests.map((guest) => (
            <tr key={guest.id}>
              <td>{guest.name}</td>
              <td>{guest.room}</td>
              <td>{guest.contact}</td>
              <td>{guest.checkIn}</td>
              <td>{guest.checkOut}</td>
              <td>{guest.status}</td>
              <td>
                {guest.status === "Pending" && (
                  <button style={btnStyle}>✔ Check-in</button>
                )}
                {guest.status === "Checked-in" && (
                  <button style={btnStyle}>⬅ Check-out</button>
                )}
                <button style={btnStyle}>View Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Reusable styles
const cardStyle = {
  flex: "1",
  backgroundColor: "#222",
  color: "#0ff",
  padding: "15px",
  borderRadius: "8px",
  textAlign: "center",
};

const btnStyle = {
  padding: "8px 12px",
  marginRight: "10px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export default ViewCheckinCheckout;
