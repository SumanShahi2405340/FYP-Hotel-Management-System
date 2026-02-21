// components/ViewBookings.jsx
"use client";
import React from "react";

const dummyBookings = [
  { name: "John Doe", contact: "9876543210", room: "101 / Normal", days: 2 },
  { name: "Jane Smith", contact: "9812345678", room: "102 / Deluxe", days: 3 },
  { name: "Alex Johnson", contact: "9801122334", room: "103 / Suite", days: 5 },
  { name: "Emily Davis", contact: "9845566778", room: "104 / Normal", days: 1 },
  { name: "Michael Brown", contact: "9867788990", room: "105 / Deluxe", days: 4 },
  { name: "Sarah Wilson", contact: "9822334455", room: "106 / Suite", days: 2 },
  { name: "David Lee", contact: "9833445566", room: "107 / Normal", days: 6 },
  { name: "Laura Kim", contact: "9856677889", room: "108 / Deluxe", days: 2 },
  { name: "Chris Evans", contact: "9811223344", room: "109 / Suite", days: 7 },
  { name: "Sophia Turner", contact: "9823456789", room: "110 / Normal", days: 3 },
  { name: "Daniel Clark", contact: "9845678901", room: "111 / Deluxe", days: 2 },
  { name: "Olivia Harris", contact: "9867890123", room: "112 / Suite", days: 4 },
  { name: "Matthew Scott", contact: "9809876543", room: "113 / Normal", days: 5 },
  { name: "Isabella Lewis", contact: "9812340987", room: "114 / Deluxe", days: 1 },
  { name: "James Walker", contact: "9821098765", room: "115 / Suite", days: 3 },
];

export default function ViewBookings() {
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
      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", textAlign: "left", backgroundColor: "rgba(255,255,255,0.9)" }}
      >
        <thead>
          <tr>
            <th>Customer Name</th>
            <th>Contact</th>
            <th>Room Number / Class</th>
            <th>Stay Days</th>
          </tr>
        </thead>
        <tbody>
          {dummyBookings.map((booking, index) => (
            <tr key={index}>
              <td>{booking.name}</td>
              <td>{booking.contact}</td>
              <td>{booking.room}</td>
              <td>{booking.days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
