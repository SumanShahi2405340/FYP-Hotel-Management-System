"use client";
import React, { useState, useEffect } from "react";

const ReceptionistPanel = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    room: "",
    issue: "",
    reported_by: "",
    date: "",
    status: "Pending",
  });

  // Fetch existing requests
  useEffect(() => {
    fetch("http://localhost:8000/api/requests/") // <-- adjust to your backend port
      .then((res) => {
        if (!res.ok) throw new Error("Problem in Fetching!!");
        return res.json();
      })
      .then((data) => {
        if (data.length > 0) {
          setRequests(data);
        } else {
          setError("No requests sent yet!!");
        }
      })
      .catch(() => setError("Problem in Fetching!!"));
  }, []);

  // Handle new request creation
  const handleCreateRequest = (e) => {
    e.preventDefault();
    fetch("http://localhost:8000/api/requests/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRequest),
    })
      .then((res) => res.json())
      .then((saved) => {
        setRequests((prev) => [...prev, saved]);
        setShowForm(false);
        setNewRequest({ room: "", issue: "", reported_by: "", date: "", status: "Pending" });
        setError(null);
      })
      .catch(() => setError("Failed to send request!!"));
  };

  // Handle request deletion
  const handleDelete = (id) => {
    fetch(`http://localhost:8000/api/requests/${id}/`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Delete failed");
        // remove from local state
        setRequests((prev) => prev.filter((req) => req.id !== id));
      })
      .catch(() => {
        // fallback: remove locally even if backend fails
        setRequests((prev) => prev.filter((req) => req.id !== id));
      });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", fontWeight: "bold", fontSize: "26px", marginBottom: "20px" }}>
        SendView Maintenance Requests
      </h2>

      {/* Create Request Button */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button style={btnStyle} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close Form" : "Create Request"}
        </button>
      </div>

      {/* Request Form */}
      {showForm && (
        <form onSubmit={handleCreateRequest} style={{ marginBottom: "20px", textAlign: "center" }}>
          <input type="text" placeholder="Room" value={newRequest.room}
            onChange={(e) => setNewRequest({ ...newRequest, room: e.target.value })} required />
          <input type="text" placeholder="Issue" value={newRequest.issue}
            onChange={(e) => setNewRequest({ ...newRequest, issue: e.target.value })} required />
          <input type="text" placeholder="Reported By" value={newRequest.reported_by}
            onChange={(e) => setNewRequest({ ...newRequest, reported_by: e.target.value })} required />
          <input type="date" value={newRequest.date}
            onChange={(e) => setNewRequest({ ...newRequest, date: e.target.value })} required />
          <button type="submit" style={btnStyle}>Send Request</button>
        </form>
      )}

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div style={cardStyle}>Total Requests: {requests.length}</div>
        <div style={cardStyle}>Pending: {requests.filter((r) => r.status === "Pending").length}</div>
        <div style={cardStyle}>In Progress: {requests.filter((r) => r.status === "In Progress").length}</div>
        <div style={cardStyle}>Resolved: {requests.filter((r) => r.status === "Resolved").length}</div>
      </div>

      {/* Requests Table */}
      {error ? (
        <div style={{ color: "red", marginTop: "20px" }}>{error}</div>
      ) : (
        <table border="1" cellPadding="10" style={{ width: "100%", textAlign: "center" }}>
          <thead style={{ backgroundColor: "#333", color: "#fff" }}>
            <tr>
              <th>Room</th><th>Issue</th><th>Reported By</th><th>Date</th><th>Status</th><th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.room}</td><td>{req.issue}</td><td>{req.reported_by}</td>
                <td>{req.date}</td><td>{req.status}</td>
                <td>
                  <button style={deleteBtnStyle} onClick={() => handleDelete(req.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const deleteBtnStyle = {
  padding: "6px 10px",
  backgroundColor: "#dc3545", // red for delete
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export default ReceptionistPanel;
