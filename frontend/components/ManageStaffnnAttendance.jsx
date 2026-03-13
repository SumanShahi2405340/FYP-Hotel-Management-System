"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";   // axios instance with owner tokens

const ManageStaffnnAttendance = () => {
  const [filter, setFilter] = useState("all");
  const [staff, setStaff] = useState([]);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState({});
  const router = useRouter();

  //  Fetch attendance for a person
  const fetchAttendance = async (person) => {
    try {
      const endpoint =
        person.role === "Receptionist"
          ? `/api/attendance/receptionist_history/?receptionist_id=${person.id}`
          : `/api/attendance/staff_history/?staff_id=${person.id}`;

      const res = await api.get(endpoint);
      const records = res.data;

      const today = new Date().toISOString().split("T")[0];
      const todayRecord = records.find((r) => r.date === today);

      if (todayRecord) {
        setAttendance((prev) => ({
          ...prev,
          [person.id]: {
            status: todayRecord.status,
            date: todayRecord.date,
            attendanceId: todayRecord.id,   //  store attendance record ID
          },
        }));
      }
    } catch (err) {
      console.error("Error fetching attendance:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const recepRes = await api.get("/api/hotel/receptionist-info/");
        const staffRes = await api.get("/api/hotel/staff-info/");

        const recepList = Array.isArray(recepRes.data.receptionists) ? recepRes.data.receptionists : [];
        const staffList = Array.isArray(staffRes.data.staff) ? staffRes.data.staff : [];

        const combined = [...recepList, ...staffList];

        setHotel({
          hotel_id: recepRes.data.hotel_id || staffRes.data.hotel_id,
          hotel_name: recepRes.data.hotel_name || staffRes.data.hotel_name,
        });

        setStaff(combined);

        await Promise.all(combined.map((person) => fetchAttendance(person)));

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

  //  Mark attendance
  const markAttendance = async (person, status) => {
    try {
      const payload =
        person.role === "Receptionist"
          ? { receptionist_id: person.id, status }
          : { staff_id: person.id, status };

      const res = await api.post("/api/attendance/mark/", payload);
      const todayRecord = res.data;

      setAttendance((prev) => ({
        ...prev,
        [person.id]: {
          status: todayRecord.status,
          date: todayRecord.date,
          attendanceId: todayRecord.id,   //  store ID from backend response
        },
      }));
    } catch (err) {
      console.error("Error marking attendance:", err.response?.data || err.message);
    }
  };

  //  Toggle Active/Inactive
  const toggleStatus = async (person) => {
    const todayAttendance = attendance[person.id];
    if (!todayAttendance || !todayAttendance.attendanceId) {
      console.error("No attendance record found for toggle");
      return;
    }

    const newStatus = person.status === "Active" ? "Inactive" : "Active";
    try {
      //  Use attendanceId, not person.id
      await api.patch(`/api/attendance/${todayAttendance.attendanceId}/status/`, { status: newStatus });

      setStaff((prev) =>
        prev.map((p) =>
          p.id === person.id ? { ...p, status: newStatus } : p
        )
      );
    } catch (err) {
      console.error("Error updating status:", err.response?.data || err.message);
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

        {/* Add Staff Button */}
        <div style={{ position: "absolute", top: "20px", right: "20px", textAlign: "center" }}>
          <button style={circleBtnStyle} onClick={() => router.push("/receptionist/add-staff")}>+</button>
          <div style={{ marginTop: "6px", fontWeight: "bold", color: "#007bff" }}>Add Staff</div>
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
              <th>Name</th><th>Role</th><th>Contact</th><th>Email</th><th>Date Joined</th><th>Status</th><th>Attendance</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredStaff) && filteredStaff.map((person) => {
              const todayAttendance = attendance[person.id];
              return (
                <tr key={person.id}>
                  <td>{person.name}</td>
                  <td>{person.role}</td>
                  <td>{person.contact}</td>
                  <td>{person.email}</td>
                  <td>{person.joined_date}</td>
                  <td>{person.status}</td>
                  <td>
                    <button style={btnStyle} onClick={() => markAttendance(person, "Present")}>Present</button>
                    <button style={fireBtnStyle} onClick={() => markAttendance(person, "Absent")}>Absent</button>
                    <div style={{ marginTop: "5px", fontSize: "12px" }}>
                      {todayAttendance
                        ? `${todayAttendance.date}: ${todayAttendance.status}`
                        : "Not Marked"}
                    </div>
                  </td>
                  <td>
                    <button 
                      style={btnStyle} 
                      onClick={() => router.push(`/receptionist/attendance/${person.id}`)}
                    >
                      Attendance
                    </button>

                    <button
                      style={{
                        ...toggleBtnStyle,
                        backgroundColor: person.status === "Active" ? "red" : "green"
                      }}
                      onClick={() => toggleStatus(person)}
                    >
                      {person.status === "Active" ? "Inactive" : "Active"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Styles
const btnStyle = { padding: "6px 10px", marginRight: "5px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" };
const fireBtnStyle = { padding: "6px 10px", marginRight: "5px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" };
const toggleBtnStyle = { padding: "6px 10px", marginLeft: "5px", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" };
const circleBtnStyle = { width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#007bff", color: "white", fontSize: "24px", fontWeight: "bold", border: "none", cursor: "pointer" };

export default ManageStaffnnAttendance



