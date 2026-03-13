'use client';
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";

export default function Attendance() {
  const { id } = useParams();   // staff/receptionist ID from URL
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString()); // default current year
  const [month, setMonth] = useState(
    ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][new Date().getMonth()]
  ); // default current month

  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const years = Array.from({ length: 15 }, (_, i) => (2026 + i).toString()); // 2026–2040

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const monthIndex = months.indexOf(month) + 1; // convert to numeric month (1–12)

        const res = await api.get(
          `/api/attendance/monthly/?person_id=${id}&year=${year}&month=${monthIndex}`
        );

        setAttendanceData(res.data); // expect array of {name, role, date, status}
      } catch (err) {
        console.error("Error fetching attendance:", err.response?.data || err.message);
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAttendance();
  }, [id, year, month]);

  if (loading) return <p>Loading attendance...</p>;

  return (
    <div
      className="min-h-screen p-6"
      style={{
        backgroundImage: "url('/2.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Attendance Records</h2>

        {/* Dropdowns */}
        <div className="flex gap-4 mb-6">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Attendance Table */}
        {attendanceData.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300 bg-white">
            <thead>
              <tr className="bg-blue-200">
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Role</th>
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record, idx) => (
                <tr key={idx}>
                  <td className="border px-4 py-2">{record.name}</td>
                  <td className="border px-4 py-2">{record.role}</td>
                  <td className="border px-4 py-2">{record.date}</td>
                  <td className="border px-4 py-2">{record.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600">No attendance data for {month} {year}.</p>
        )}
      </div>
    </div>
  );
}
