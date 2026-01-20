"use client";
import React, { useState } from "react";

const dummyStaff = [
  {
    id: 1,
    name: "Ramesh Sharma",
    role: "Manager",
    contact: "9801234567",
    email: "ramesh@hotel.com",
    joined: "2022-05-10",
    status: "Active",
  },
  {
    id: 2,
    name: "Anita Koirala",
    role: "Receptionist",
    contact: "9812345678",
    email: "anita@hotel.com",
    joined: "2023-01-15",
    status: "Active",
  },
  {
    id: 3,
    name: "Suresh Thapa",
    role: "Housekeeping",
    contact: "9823456789",
    email: "suresh@hotel.com",
    joined: "2021-11-20",
    status: "Inactive",
  },
];

const ViewStaffDetails = () => {
  const [filter, setFilter] = useState("all");

  const filteredStaff =
    filter === "all"
      ? dummyStaff
      : dummyStaff.filter((s) => s.status === filter);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Staff Details</h2>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div style={cardStyle}>Total Staff: {dummyStaff.length}</div>
        <div style={cardStyle}>
          Active: {dummyStaff.filter((s) => s.status === "Active").length}
        </div>
        <div style={cardStyle}>
          Inactive: {dummyStaff.filter((s) => s.status === "Inactive").length}
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setFilter("all")} style={btnStyle}>
          All
        </button>
        <button onClick={() => setFilter("Active")} style={btnStyle}>
          Active
        </button>
        <button onClick={() => setFilter("Inactive")} style={btnStyle}>
          Inactive
        </button>
      </div>

      {/* Staff Table */}
      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", textAlign: "left" }}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Date Joined</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredStaff.map((staff) => (
            <tr key={staff.id}>
              <td>{staff.name}</td>
              <td>{staff.role}</td>
              <td>{staff.contact}</td>
              <td>{staff.email}</td>
              <td>{staff.joined}</td>
              <td>{staff.status}</td>
              <td>
                <button style={btnStyle}>View Profile</button>
                <button style={btnStyle}>Edit</button>
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

export default ViewStaffDetails;
