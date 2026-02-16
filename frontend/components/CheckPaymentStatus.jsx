// components/CheckPaymentStatus.jsx
"use client";
import React, { useEffect, useState } from "react";

export default function CheckPaymentStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/owner/payment-status") // Adjust path if needed
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch payment status");
        return res.json();
      })
      .then((data) => {
        setStatus(data.status); // e.g., "Paid", "Pending", "Overdue"
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching payment status:", err);
        setError("Unable to retrieve payment status");
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Payment Status</h2>
      {loading && <p>Checking payment status...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {status && (
        <p>
          Current Status:{" "}
          <strong style={{ color: status === "Paid" ? "green" : "orange" }}>
            {status}
          </strong>
        </p>
      )}
    </div>
  );
}
