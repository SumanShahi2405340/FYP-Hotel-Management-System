"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

const OwnerComissionSetting = () => {
  const [showSend, setShowSend] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [commissions, setCommissions] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [datetime, setDatetime] = useState("");
  const [time, setTime] = useState("");
  const [rate, setRate] = useState("");
  const [status, setStatus] = useState("Pending");

  // Helper to attach JWT token
  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch commissions from backend
  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/commission-reports/", {
          headers: getAuthHeaders(),
        });
        setCommissions(res.data);
      } catch (err) {
        console.error("Error fetching commissions:", err);
      }
    };
    fetchCommissions();
  }, []);

  // Save commission to backend
  const handleSave = async () => {
    if (datetime && time && rate && status) {
      try {
        await axios.post("http://localhost:8000/api/commission-reports/", {
          date: datetime,
          time: time,
          rate: rate,
          status: status,
        }, {
          headers: getAuthHeaders(),
        });
        // Refresh list
        const res = await axios.get("http://localhost:8000/api/commission-reports/", {
          headers: getAuthHeaders(),
        });
        setCommissions(res.data);
        setShowForm(false);
        setDatetime(""); setTime(""); setRate(""); setStatus("Pending");
      } catch (err) {
        console.error("Error saving commission:", err);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/6.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px",
      }}
    >
      {/* Frosted Glass Panel */}
      <div
        style={{
          marginTop: "20px",
          backgroundColor: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(6px)",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          width: "100%",
          maxWidth: "1100px",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Commission Settings</h2>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "15px", marginBottom: "20px", justifyContent: "center" }}>
          <button
            onClick={() => {
              setShowSend(!showSend);
              setShowSave(false);
            }}
            style={buttonStyle}
          >
            Send Commission
          </button>
          <button
            onClick={() => {
              setShowSave(!showSave);
              setShowSend(false);
            }}
            style={buttonStyle}
          >
            Save Commission Reports
          </button>
        </div>

        {/* Conditional Panels */}
        {showSend && (
          <div style={panelStyle}>
            <p>Scan one of the QR codes below to send commission payments:</p>
            <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "15px" }}>
              <div style={{ textAlign: "center" }}>
                <img src="/bank.png" alt="Bank QR" style={{ width: "120px", height: "120px", borderRadius: "8px" }} />
                <p style={{ marginTop: "8px" }}>Payment QR 1</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <img src="/khalti.png" alt="Khalti QR" style={{ width: "120px", height: "120px", borderRadius: "8px" }} />
                <p style={{ marginTop: "8px" }}>Payment QR 2</p>
              </div>
            </div>
          </div>
        )}

        {showSave && (
          <div style={panelStyle}>
            <h3>Commission Reports</h3>

            {/* Add Commission Button */}
            <div style={{ textAlign: "right", marginBottom: "15px" }}>
              <button style={addButtonStyle} onClick={() => setShowForm(!showForm)}>
                + Add Commission
              </button>
            </div>

            {/* Add Commission Form */}
            {showForm && (
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <input type="date" value={datetime} onChange={(e) => setDatetime(e.target.value)} style={inputStyle} />
                <input type="time" placeholder="Time (AM/PM)"value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
                <input type="number" placeholder="Rate (Rs)" value={rate} onChange={(e) => setRate(e.target.value)} style={inputStyle} />
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
                <button style={saveButtonStyle} onClick={handleSave}>Save</button>
              </div>
            )}

            {/* Commission Table */}
            <table border="1" cellPadding="12" style={{ width: "100%", textAlign: "left", backgroundColor: "rgba(255,255,255,0.95)", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Commission Rate</th>
                  <th>Commission Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id}>
                    <td>{c.date}</td>
                    <td>{c.time}</td>
                    <td>{c.rate} Rs</td>
                    <td>{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable styles
const buttonStyle = { padding: "10px 20px", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };
const panelStyle = { marginTop: "20px", padding: "20px", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" };
const addButtonStyle = { padding: "8px 16px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };
const inputStyle = { padding: "8px", borderRadius: "6px", border: "1px solid #ccc" };
const saveButtonStyle = { padding: "8px 16px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };

export default OwnerComissionSetting;
