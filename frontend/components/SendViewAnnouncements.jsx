"use client";
import React, { useState } from "react";

// Dummy data for announcements
const dummyAnnouncements = [
  {
    id: 1,
    title: "System Maintenance",
    description: "Scheduled maintenance on Jan 10, 2026 from 2 AM to 5 AM.",
    date: "2026-01-05",
    status: "Active",
  },
  {
    id: 2,
    title: "New Feature Release",
    description: "Introducing advanced analytics dashboard for managers.",
    date: "2026-01-15",
    status: "Upcoming",
  },
];

// Dummy data for admin updates
const dummyAdminUpdates = [
  {
    id: 1,
    title: "Policy Change",
    message: "New cancellation policy effective from Jan 15, 2026.",
    date: "2026-01-10",
    status: "Active",
  },
  {
    id: 2,
    title: "Staff Meeting",
    message: "All managers must attend the Jan 20 briefing.",
    date: "2026-01-12",
    status: "Upcoming",
  },
];

const ManageUpdatesAnnouncements = () => {
  const [announcements, setAnnouncements] = useState(dummyAnnouncements);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Send/View Announcements</h2>

      {/* Add New Announcement Button */}
      <button style={btnStyle}>➕ Create New Announcement</button>

      {/* Announcements Table */}
      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", textAlign: "left", marginTop: "20px" }}
      >
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {announcements.map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.description}</td>
              <td>{item.date}</td>
              <td>{item.status}</td>
              <td>
                <button style={btnStyle}>Edit</button>
                <button style={btnStyle}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Admin Updates Section */}
      <h2 style={{ marginTop: "40px" }}>View Updates From Admin</h2>
      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", textAlign: "left", marginTop: "20px" }}
      >
        <thead>
          <tr>
            <th>Title</th>
            <th>Message</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {dummyAdminUpdates.map((update) => (
            <tr key={update.id}>
              <td>{update.title}</td>
              <td>{update.message}</td>
              <td>{update.date}</td>
              <td>{update.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Reusable button style
const btnStyle = {
  padding: "8px 12px",
  marginRight: "10px",
  backgroundColor: "#28a745",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export default ManageUpdatesAnnouncements;
