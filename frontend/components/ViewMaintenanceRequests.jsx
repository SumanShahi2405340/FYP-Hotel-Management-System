"use client";
import React, { useState } from "react";

const dummyRequests = [
  {
    id: 1,
    room: "101 / Deluxe",
    issue: "Air conditioner not working",
    reportedBy: "Reception",
    date: "2026-01-02",
    status: "Pending",
  },
  {
    id: 2,
    room: "205 / Normal",
    issue: "Leaking bathroom tap",
    reportedBy: "Housekeeping",
    date: "2026-01-01",
    status: "In Progress",
  },
  {
    id: 3,
    room: "310 / Suite",
    issue: "Broken TV remote",
    reportedBy: "Guest",
    date: "2025-12-30",
    status: "Resolved",
  },
];

const ViewMaintenanceRequests = () => {
  const [filter, setFilter] = useState("all");

  const filteredRequests =
    filter === "all"
      ? dummyRequests
      : dummyRequests.filter((r) => r.status === filter);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Manage Maintenance Requests</h2>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div style={cardStyle}>
          Total Requests: {dummyRequests.length}
        </div>
        <div style={cardStyle}>
          Pending: {dummyRequests.filter((r) => r.status === "Pending").length}
        </div>
        <div style={cardStyle}>
          In Progress: {dummyRequests.filter((r) => r.status === "In Progress").length}
        </div>
        <div style={cardStyle}>
          Resolved: {dummyRequests.filter((r) => r.status === "Resolved").length}
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setFilter("all")} style={btnStyle}>All</button>
        <button onClick={() => setFilter("Pending")} style={btnStyle}>Pending</button>
        <button onClick={() => setFilter("In Progress")} style={btnStyle}>In Progress</button>
        <button onClick={() => setFilter("Resolved")} style={btnStyle}>Resolved</button>
      </div>

      {/* Requests Table */}
      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", textAlign: "left" }}
      >
        <thead>
          <tr>
            <th>Room</th>
            <th>Issue</th>
            <th>Reported By</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.map((req) => (
            <tr key={req.id}>
              <td>{req.room}</td>
              <td>{req.issue}</td>
              <td>{req.reportedBy}</td>
              <td>{req.date}</td>
              <td>{req.status}</td>
              <td>
                {req.status === "Pending" && (
                  <button style={btnStyle}>Start</button>
                )}
                {req.status === "In Progress" && (
                  <button style={btnStyle}>Resolve</button>
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

export default ViewMaintenanceRequests;
