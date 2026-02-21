"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ManageStaffnAttendance = () => {
  const [filter, setFilter] = useState("all");
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken"); // must be set after login
    if (!token) {
      console.error("No token found, redirecting to login");
      router.push("/login");
      return;
    }

    fetch("http://localhost:8000/api/hotel/receptionists/", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // must match backend JWT setup
      },
    })
      .then((res) => {
        if (res.status === 401) {
          throw new Error("Unauthorized - invalid or expired token");
        }
        return res.json();
      })
      .then((data) => {
        setStaff(Array.isArray(data) ? data : []); // ensure staff is always an array
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching staff:", err);
        setStaff([]);
        setLoading(false);
      });
  }, [router]);

  const filteredStaff =
    filter === "all"
      ? staff
      : staff.filter((s) => s.status === filter);

  const handleProfileClick = (staff) => {
    if (staff.role === "Receptionist") {
      router.push(`/owner/receptionist-profile/${staff.id}`);
    } else {
      alert(`${staff.role} profile panel not yet available.`);
    }
  };

  if (loading) return <p>Loading staff...</p>;

  return (
    <div
      style={{
        padding: "20px",
        position: "relative",
        minHeight: "100vh",
        backgroundImage: "url('/register.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div style={{ backgroundColor: "rgba(255,255,255,0.65)", padding: "20px", borderRadius: "10px" }}>
        <h2 style={{ textAlign: "center", fontWeight: "bold", fontSize: "26px", marginBottom: "30px" }}>
          Manage Staff & Attendance
        </h2>

        <div style={{ position: "absolute", top: "20px", right: "20px", textAlign: "center" }}>
          <button style={circleBtnStyle} onClick={() => router.push("/owner/add-receptionist")}>
            +
          </button>
          <div style={{ marginTop: "6px", fontWeight: "bold", color: "#007bff" }}>
            Add Receptionist
          </div>
        </div>

        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <button onClick={() => setFilter("all")} style={btnStyle}>All</button>
          <button onClick={() => setFilter("Active")} style={btnStyle}>Active</button>
          <button onClick={() => setFilter("Inactive")} style={btnStyle}>Inactive</button>
        </div>

        <table border="1" cellPadding="10" style={{ width: "100%", textAlign: "left", backgroundColor: "rgba(255,255,255,0.9)" }}>
          <thead>
            <tr>
              <th>Name</th><th>Role</th><th>Contact</th><th>Email</th><th>Date Joined</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredStaff) && filteredStaff.map((staff) => (
              <tr key={staff.id}>
                <td>{staff.name}</td>
                <td>Receptionist</td>
                <td>{staff.contact}</td>
                <td>{staff.email}</td>
                <td>{staff.joined_date}</td>
                <td>{staff.status}</td>
                <td>
                  <button style={btnStyle} onClick={() => handleProfileClick(staff)}>Profile</button>
                  <button style={fireBtnStyle}>Fired</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Styles
const btnStyle = { padding: "8px 12px", marginRight: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" };
const fireBtnStyle = { padding: "8px 12px", marginRight: "10px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" };
const circleBtnStyle = { width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#007bff", color: "white", fontSize: "24px", fontWeight: "bold", border: "none", cursor: "pointer" };

export default ManageStaffnAttendance;
