"use client";
import React, { useState } from "react";

const dummyPromotions = [
  {
    id: 1,
    title: "Winter Special",
    description: "Get 20% off on all Deluxe Rooms",
    validFrom: "2026-01-01",
    validTo: "2026-01-31",
    status: "Active",
  },
  {
    id: 2,
    title: "Weekend Saver",
    description: "Book 2 nights, get 1 free breakfast",
    validFrom: "2026-02-01",
    validTo: "2026-02-28",
    status: "Upcoming",
  },
];

const ManagePromotionsDiscounts = () => {
  const [promotions, setPromotions] = useState(dummyPromotions);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Manage Promotions & Discounts</h2>

      {/* Add New Promotion Button */}
      <button style={btnStyle}>➕ Create New Promotion</button>

      {/* Promotions Table */}
      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", textAlign: "left", marginTop: "20px" }}
      >
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Valid From</th>
            <th>Valid To</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {promotions.map((promo) => (
            <tr key={promo.id}>
              <td>{promo.title}</td>
              <td>{promo.description}</td>
              <td>{promo.validFrom}</td>
              <td>{promo.validTo}</td>
              <td>{promo.status}</td>
              <td>
                <button style={btnStyle}>Edit</button>
                <button style={btnStyle}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Reusable styles
const btnStyle = {
  padding: "8px 12px",
  marginRight: "10px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export default ManagePromotionsDiscounts;
