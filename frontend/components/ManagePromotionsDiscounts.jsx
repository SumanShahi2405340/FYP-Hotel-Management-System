"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

const ManagePromotionsDiscounts = () => {
  const [promotions, setPromotions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  useEffect(() => {
    fetchPromotions();
  }, []);

  // Helper to attach JWT token
  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken"); // token saved after login
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPromotions = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/promotions/", {
        headers: getAuthHeaders(),
      });
      setPromotions(res.data);
    } catch (err) {
      console.error("Error fetching promotions:", err);
    }
  };

  const handleAddPromotion = async () => {
    if (title && description && validFrom && validTo) {
      const newPromo = { title, description, valid_from: validFrom, valid_to: validTo, status: "Upcoming" };
      try {
        await axios.post("http://localhost:8000/api/promotions/", newPromo, {
          headers: getAuthHeaders(),
        });
        await fetchPromotions();
        setShowForm(false);
        setTitle(""); setDescription(""); setValidFrom(""); setValidTo("");
      } catch (err) {
        console.error("Error adding promotion:", err);
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/promotions/${id}/`, {
        headers: getAuthHeaders(),
      });
      setPromotions(promotions.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error deleting promotion:", err);
    }
  };

  const handleToggleStatus = async (promo) => {
    const updated = { ...promo, status: promo.status === "Active" ? "Upcoming" : "Active" };
    try {
      await axios.put(`http://localhost:8000/api/promotions/${promo.id}/`, updated, {
        headers: getAuthHeaders(),
      });
      setPromotions(promotions.map((p) => (p.id === promo.id ? updated : p)));
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const handleEdit = (promo) => {
    setEditId(promo.id);
    setEditData({ ...promo });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`http://localhost:8000/api/promotions/${editId}/`, editData, {
        headers: getAuthHeaders(),
      });
      await fetchPromotions();
      setEditId(null);
      setEditData({});
    } catch (err) {
      console.error("Error saving edit:", err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundImage: "url('/5.jpg')", backgroundSize: "cover", backgroundPosition: "center", padding: "20px" }}>
      <div style={{ backgroundColor: "rgba(255,255,255,0.8)", backdropFilter: "blur(6px)", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "25px", fontSize: "26px", fontWeight: "bold" }}>
          Manage Promotions & Discounts
        </h2>

        <div style={{ textAlign: "left", marginBottom: "15px" }}>
          <button style={btnStyle} onClick={() => setShowForm(!showForm)}>➕ Create New Promotion</button>
        </div>

        {showForm && (
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} />
            <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} style={inputStyle} />
            <input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} style={inputStyle} />
            <button style={btnStyle} onClick={handleAddPromotion}>Send</button>
          </div>
        )}

        <table border="1" cellPadding="10" style={{ width: "100%", textAlign: "left", marginTop: "20px", backgroundColor: "rgba(255,255,255,0.9)", borderCollapse: "collapse" }}>
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
                <td>{editId === promo.id ? <input type="text" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} style={inputStyle} /> : promo.title}</td>
                <td>{editId === promo.id ? <input type="text" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} style={inputStyle} /> : promo.description}</td>
                <td>{editId === promo.id ? <input type="date" value={editData.valid_from} onChange={(e) => setEditData({ ...editData, valid_from: e.target.value })} style={inputStyle} /> : promo.valid_from}</td>
                <td>{editId === promo.id ? <input type="date" value={editData.valid_to} onChange={(e) => setEditData({ ...editData, valid_to: e.target.value })} style={inputStyle} /> : promo.valid_to}</td>
                <td>{promo.status}</td>
                <td>
                  <button style={btnStyle} onClick={() => handleToggleStatus(promo)}>
                    {promo.status === "Active" ? "Upcoming" : "Active"}
                  </button>
                  {editId === promo.id ? (
                    <>
                      <button style={btnStyle} onClick={handleSaveEdit}>Save Edit</button>
                      <button style={btnStyle} onClick={handleCancelEdit}>Cancel Edit</button>
                    </>
                  ) : (
                    <button style={btnStyle} onClick={() => handleEdit(promo)}>Edit</button>
                  )}
                  <button style={btnStyle} onClick={() => handleDelete(promo.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
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

const inputStyle = {
  padding: "6px",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

export default ManagePromotionsDiscounts;
