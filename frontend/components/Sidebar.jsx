"use client";
import React from "react";

const Sidebar = ({ setView }) => {
  return (
    <div
      style={{
        width: "220px",
        height: "100vh",
        backgroundColor: "#343a40",
        color: "white",
        padding: "20px",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <h2 style={{ marginBottom: "30px" }}>Owner Dashboard</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li style={linkStyle} onClick={() => setView("bookings")}>📖 View Bookings</li>
        <li style={linkStyle} onClick={() => setView("earnings")}>💰 View Earnings</li>
        <li style={linkStyle} onClick={() => setView("checkincheckout")}>🛎️ Check-in/Check-out</li>
        <li style={linkStyle} onClick={() => setView("staff")}>👥 Staff Details</li>
        <li style={linkStyle} onClick={() => setView("commission")}>📊 Commission Reports</li>
        <li style={linkStyle} onClick={() => setView("managePromotionsDiscounts")}>🎉 Promotions/Discounts</li>
        <li style={linkStyle} onClick={() => setView("maintenance")}>🛠️ Maintenance Requests</li>
        <li style={linkStyle} onClick={() => setView("manageUpdatesAnnouncements")}>📰 Updates/Announcements</li>
      </ul>
    </div>
  );
};

const linkStyle = {
  marginBottom: "15px",
  cursor: "pointer",
  padding: "8px",
  borderRadius: "5px",
  backgroundColor: "#495057",
};

export default Sidebar;
