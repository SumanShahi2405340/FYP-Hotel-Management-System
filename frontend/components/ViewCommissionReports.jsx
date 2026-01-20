"use client";
import React from "react";

const dummyCommissions = [
  { month: "January 2026", totalBookings: 120, commissionRate: "10%", commissionPaid: "₹ 45,000" },
  { month: "February 2026", totalBookings: 95, commissionRate: "10%", commissionPaid: "₹ 38,000" },
  { month: "March 2026", totalBookings: 110, commissionRate: "10%", commissionPaid: "₹ 42,500" },
  { month: "April 2026", totalBookings: 130, commissionRate: "10%", commissionPaid: "₹ 50,000" },
];

const ViewCommissionReports = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Commission Reports</h2>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div style={cardStyle}>
          Total Months: {dummyCommissions.length}
        </div>
        <div style={cardStyle}>
          Total Commission Paid: ₹{" "}
          {dummyCommissions.reduce((sum, c) => {
            return sum + parseInt(c.commissionPaid.replace(/[^\d]/g, ""));
          }, 0)}
        </div>
      </div>

      {/* Commission Table */}
      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", textAlign: "left" }}
      >
        <thead>
          <tr>
            <th>Month</th>
            <th>Total Bookings</th>
            <th>Commission Rate</th>
            <th>Commission Paid</th>
          </tr>
        </thead>
        <tbody>
          {dummyCommissions.map((c, index) => (
            <tr key={index}>
              <td>{c.month}</td>
              <td>{c.totalBookings}</td>
              <td>{c.commissionRate}</td>
              <td>{c.commissionPaid}</td>
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

export default ViewCommissionReports;
