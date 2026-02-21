"use client";
import React, { useState, useEffect } from "react";

const ManageMaintenanceRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/requests/")
      .then((res) => {
        if (!res.ok) throw new Error("Problem in Fetching Real Data");
        return res.json();
      })
      .then((data) => {
        if (data.length > 0) {
          setRequests(data);
        } else {
          setError("No Requests Sent Yet!!");
        }
      })
      .catch(() => setError("Problem in Fetching!!"));
  }, []);

  const handleAction = (id, newStatus) => {
    const prevReq = requests.find((r) => r.id === id);
    if (!prevReq) return;

    fetch(`http://localhost:8000/api/requests/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Update failed");
        return res.json();
      })
      .then((updated) => {
        setRequests((prev) =>
          prev.map((req) => (req.id === id ? updated : req))
        );
      })
      .catch(() => {
        setRequests((prev) =>
          prev.map((req) =>
            req.id === id ? { ...req, status: newStatus } : req
          )
        );
      });
  };

  const handleUndo = (id) => {
    const prevReq = requests.find((r) => r.id === id);
    if (!prevReq) return;

    fetch(`http://localhost:8000/api/requests/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Pending" }),
    })
      .then((res) => res.json())
      .then((updated) => {
        setRequests((prev) =>
          prev.map((req) => (req.id === id ? updated : req))
        );
      })
      .catch(() => {
        setRequests((prev) =>
          prev.map((req) =>
            req.id === id ? { ...req, status: "Pending" } : req
          )
        );
      });
  };

  return (
    <div
      style={{
        padding: "20px",
        minHeight: "100vh",
        backgroundImage: "url('/1.jpg')", // <-- replace with your image path
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div style={{ backgroundColor: "rgba(255,255,255,0.7)", padding: "20px", borderRadius: "10px" }}>
        <h2 style={{ textAlign: "center", fontWeight: "bold", fontSize: "26px", marginBottom: "20px" }}>
          Manage Maintenance Requests
        </h2>

        {/* Summary Cards */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div style={cardStyle}>Total Requests: {requests.length}</div>
          <div style={cardStyle}>Pending: {requests.filter((r) => r.status === "Pending").length}</div>
          <div style={cardStyle}>In Progress: {requests.filter((r) => r.status === "In Progress").length}</div>
          <div style={cardStyle}>Resolved: {requests.filter((r) => r.status === "Resolved").length}</div>
        </div>

        {/* Requests Table */}
        {error ? (
          <div style={{ color: "red", marginTop: "20px", textAlign: "center" }}>{error}</div>
        ) : (
          <table border="1" cellPadding="10" style={{ width: "100%", textAlign: "center", backgroundColor: "rgba(255,255,255,0.9)" }}>
            <thead style={{ backgroundColor: "#333", color: "#fff" }}>
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
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>{req.room}</td>
                  <td>{req.issue}</td>
                  <td>{req.reported_by}</td>
                  <td>{req.date}</td>
                  <td>{req.status}</td>
                  <td>
                    {req.status === "Pending" && (
                      <button style={btnStyle} onClick={() => handleAction(req.id, "In Progress")}>
                        Start
                      </button>
                    )}
                    {req.status === "In Progress" && (
                      <>
                        <button style={undoBtnStyle} onClick={() => handleUndo(req.id)}>
                          ⬅
                        </button>
                        <button style={btnStyle} onClick={() => handleAction(req.id, "Resolved")}>
                          Resolved
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Styles
const cardStyle = {
  flex: "1",
  backgroundColor: "#222",
  color: "#0ff",
  padding: "15px",
  borderRadius: "8px",
  textAlign: "center",
  fontWeight: "bold",
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

const undoBtnStyle = {
  padding: "8px 12px",
  marginRight: "10px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "3px",
  cursor: "pointer",
};

export default ManageMaintenanceRequests;
