"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";   // axios instance with owner tokens

const ManageStaffnAttendance = () => {
  const [filter, setFilter] = useState("all");
  const [staff, setStaff] = useState([]);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const recepRes = await api.get("/api/hotel/receptionist-info/");
        const staffRes = await api.get("/api/hotel/staff-info/");

        const recepList = Array.isArray(recepRes.data.receptionists) ? recepRes.data.receptionists : [];
        const staffList = Array.isArray(staffRes.data.staff) ? staffRes.data.staff : [];

        setHotel({
          hotel_id: recepRes.data.hotel_id || staffRes.data.hotel_id,
          hotel_name: recepRes.data.hotel_name || staffRes.data.hotel_name,
        });

        setStaff([...recepList, ...staffList]);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching staff/receptionists:", err.response?.data || err.message);
        setStaff([]);
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const filteredStaff =
    filter === "all"
      ? staff
      : staff.filter((s) => s.status === filter);

  const handleProfileClick = (person) => {
    if (person.role === "Receptionist") {
      router.push(`/owner/receptionist-profile/${person.id}`);
    } else {
      router.push(`/owner/staff-profile/${person.id}`);
    }
  };

  //  Fired button handler: calls backend delete endpoint
  const handleFired = async (person) => {
    try {
      await api.delete(`/api/staff/${person.id}/delete/`);  //  matches backend URL
      setStaff((prev) => prev.filter((s) => s.id !== person.id));
    } catch (err) {
      console.error("Error deleting staff:", err.response?.data || err.message);
    }
  };

  if (loading) return <p>Loading staff...</p>;

  return (
    <div style={{ padding: "20px", position: "relative", minHeight: "100vh",
                  backgroundImage: "url('/register.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div style={{ backgroundColor: "rgba(255,255,255,0.65)", padding: "20px", borderRadius: "10px" }}>
        <h2 style={{ textAlign: "center", fontWeight: "bold", fontSize: "26px", marginBottom: "30px" }}>
          Manage Staff & Attendance
        </h2>

        {/* Add Receptionist Button */}
        <div style={{ position: "absolute", top: "20px", right: "20px", textAlign: "center" }}>
          <button style={circleBtnStyle} onClick={() => router.push("/owner/add-receptionist")}>+</button>
          <div style={{ marginTop: "6px", fontWeight: "bold", color: "#007bff" }}>Add Receptionist</div>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <button onClick={() => setFilter("all")} style={btnStyle}>All</button>
          <button onClick={() => setFilter("Active")} style={btnStyle}>Active</button>
          <button onClick={() => setFilter("Inactive")} style={btnStyle}>Inactive</button>
        </div>

        {/* Staff Table */}
        <table border="1" cellPadding="10" style={{ width: "100%", textAlign: "left", backgroundColor: "rgba(255,255,255,0.9)" }}>
          <thead>
            <tr>
              <th>Name</th><th>Role</th><th>Contact</th><th>Email</th><th>Date Joined</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredStaff) && filteredStaff.map((person) => (
              <tr key={person.id}>
                <td>{person.name}</td>
                <td>{person.role}</td>
                <td>{person.contact}</td>
                <td>{person.email}</td>
                <td>{person.joined_date}</td>
                <td>{person.status}</td>
                <td>
                  <button style={btnStyle} onClick={() => handleProfileClick(person)}>Attendance</button>
                  <button style={fireBtnStyle} onClick={() => handleFired(person)}>Fired</button>
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
