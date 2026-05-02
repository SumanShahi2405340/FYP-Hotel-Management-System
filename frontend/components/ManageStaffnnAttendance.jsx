"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/utils/api";
import { 
  FaUserPlus, FaUserCheck, FaUserTimes, FaCalendarCheck, FaArrowLeft, 
  FaUsers, FaUserTie, FaPhone, FaEnvelope, FaCalendarAlt, FaChartLine,
  FaStar, FaStarHalfAlt, FaHotel, FaSpa, FaUmbrellaBeach, FaSearch,
  FaFilter, FaDownload, FaEye, FaUserCircle, FaClock, FaCheckCircle,
  FaTimesCircle, FaToggleOn, FaToggleOff, FaQuestionCircle, FaRegClock
} from "react-icons/fa";

const ManageStaffnnAttendance = () => {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "view";

  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState("");
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState({});
  const router = useRouter();

  const fetchAttendance = async (person) => {
    try {
      const endpoint =
        person.role === "Receptionist"
          ? `/api/attendance/receptionist_history/?receptionist_id=${person.id}`
          : `/api/attendance/staff_history/?staff_id=${person.id}`;

      const res = await api.get(endpoint);
      const today = new Date().toISOString().split("T")[0];
      const todayRecord = res.data.find((r) => r.date === today);

      if (todayRecord) {
        setAttendance((prev) => ({
          ...prev,
          [person.id]: {
            status: todayRecord.status,
            date: todayRecord.date,
            attendanceId: todayRecord.id,
          },
        }));
      }
    } catch (err) {
      console.error("fetchAttendance error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recepRes, staffRes] = await Promise.all([
          api.get("/api/hotel/receptionist-info/"),
          api.get("/api/hotel/staff-info/"),
        ]);

        const recepList = Array.isArray(recepRes.data.receptionists) ? recepRes.data.receptionists : [];
        const staffList = Array.isArray(staffRes.data.staff) ? staffRes.data.staff : [];
        const combined = [...recepList, ...staffList];

        setStaff(combined);
        await Promise.all(combined.map(fetchAttendance));
        setLoading(false);
      } catch (err) {
        console.error("fetchData error:", err.response?.data || err.message);
        setStaff([]);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter staff based on search and status for main view
  const filteredStaff = staff.filter(person => {
    const matchesSearch = searchTerm === "" || 
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.contact.includes(searchTerm) ||
      person.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === "all" || person.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  // Filter staff for attendance view based on search only
  const filteredAttendanceStaff = staff.filter(person => {
    const matchesSearch = attendanceSearchTerm === "" || 
      person.name.toLowerCase().includes(attendanceSearchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(attendanceSearchTerm.toLowerCase()) ||
      person.contact.includes(attendanceSearchTerm) ||
      person.role.toLowerCase().includes(attendanceSearchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleProfileClick = (person) => {
    router.push(
      person.role === "Receptionist"
        ? `/owner/receptionist-profile/${person.id}`
        : `/owner/staff-profile/${person.id}`
    );
  };

  const markAttendance = async (person, status) => {
    try {
      const payload =
        person.role === "Receptionist"
          ? { receptionist_id: person.id, status }
          : { staff_id: person.id, status };

      const res = await api.post("/api/attendance/mark/", payload);
      const rec = res.data;
      setAttendance((prev) => ({
        ...prev,
        [person.id]: { status: rec.status, date: rec.date, attendanceId: rec.id },
      }));
    } catch (err) {
      console.error("markAttendance error:", err.response?.data || err.message);
    }
  };

  const toggleStatus = async (person) => {
    const att = attendance[person.id];
    if (!att?.attendanceId) { console.error("No attendance record for toggle"); return; }
    const newStatus = person.status === "Active" ? "Inactive" : "Active";
    try {
      await api.patch(`/api/attendance/${att.attendanceId}/status/`, { status: newStatus });
      setStaff((prev) => prev.map((p) => (p.id === person.id ? { ...p, status: newStatus } : p)));
    } catch (err) {
      console.error("toggleStatus error:", err.response?.data || err.message);
    }
  };

  // Calculate statistics based on current tab
  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === "Active").length,
    inactive: staff.filter(s => s.status === "Inactive").length,
    receptionists: staff.filter(s => s.role === "Receptionist").length,
  };

  // Attendance-specific stats
  const presentToday = staff.filter(person => attendance[person.id]?.status === "Present").length;
  const absentToday = staff.filter(person => attendance[person.id]?.status === "Absent").length;
  const notMarkedToday = stats.total - presentToday - absentToday;

  if (loading) return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 bg-cover bg-center bg-fixed z-0" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-800/90"></div>
      </div>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading staff data...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-fixed z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-800/90"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen p-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl text-white transition-all duration-300 border border-white/20 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <FaArrowLeft className="text-sm" />
          Back to Dashboard
        </button>

        <div className="max-w-7xl mx-auto">
          {/* Header with Glassmorphism */}
          <div className="text-center mb-8 animate-fadeInUp">
            <div className="inline-block p-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-2xl">
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl px-8 py-4">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <FaUsers className="text-4xl text-purple-400" />
                  <FaUserTie className="text-4xl text-pink-400" />
                  <FaUserCheck className="text-4xl text-orange-400" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-3">
                  {tab === "view" ? "Staff Management" : "Attendance Management"}
                </h1>
                <p className="text-gray-300 text-lg">
                  {tab === "view" ? "Manage and monitor all hotel staff members" : "Track daily staff attendance"}
                </p>
                <div className="flex justify-center gap-1 mt-2">
                  {[1,2,3,4,5].map((star) => (
                    <FaStar key={star} className="text-yellow-500 text-sm" />
                  ))}
                  <span className="text-gray-400 text-sm ml-2">4.9 (1,567 reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Statistics Cards */}
          {tab === "view" ? (
            // Staff Management View: Show Total Staff, Active Staff, Inactive Staff, Receptionists
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Total Staff", value: stats.total, icon: FaUsers, color: "from-purple-500 to-pink-500", change: "+8%", bg: "bg-purple-500/20" },
                { label: "Active Staff", value: stats.active, icon: FaUserCheck, color: "from-green-500 to-emerald-500", change: "+12%", bg: "bg-green-500/20" },
                { label: "Inactive Staff", value: stats.inactive, icon: FaUserTimes, color: "from-red-500 to-rose-500", change: "-2%", bg: "bg-red-500/20" },
                { label: "Receptionists", value: stats.receptionists, icon: FaUserTie, color: "from-blue-500 to-cyan-500", change: "+3", bg: "bg-blue-500/20" },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 hover-scale animate-fadeInUp"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                        <stat.icon className="text-2xl text-white" />
                      </div>
                      <span className="text-xs text-green-400 font-medium bg-green-500/20 px-2 py-1 rounded-full">
                        {stat.change}
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                    <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Attendance Management View: Show Total Staff, Present Today, Absent Today, Not Marked
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Total Staff", value: stats.total, icon: FaUsers, color: "from-purple-500 to-pink-500", change: "", bg: "bg-purple-500/20" },
                { label: "Present Today", value: presentToday, icon: FaCheckCircle, color: "from-green-500 to-emerald-500", change: "", bg: "bg-green-500/20" },
                { label: "Absent Today", value: absentToday, icon: FaTimesCircle, color: "from-red-500 to-rose-500", change: "", bg: "bg-red-500/20" },
                { label: "Not Marked", value: notMarkedToday, icon: FaRegClock, color: "from-yellow-500 to-orange-500", change: "", bg: "bg-yellow-500/20" },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 hover-scale animate-fadeInUp"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                        <stat.icon className="text-2xl text-white" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                    <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Main Card */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 animate-fadeInUp">
            {/* Search Bar for Attendance Management Table */}
            {tab === "attendance" && (
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, contact, or role..."
                    value={attendanceSearchTerm}
                    onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Search and Filter Bar - Only for View All Staffs tab */}
            {tab === "view" && (
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, contact, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                
                <div className="flex gap-3">
                  <div className="relative">
                    <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all appearance-none"
                    >
                      <option value="all">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <button className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition flex items-center gap-2">
                    <FaDownload />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              </div>
            )}

            {/* Status Filters for View All Staffs */}
            {tab === "view" && (
              <div className="flex gap-3 mb-6 flex-wrap">
                {[
                  { key: "all", label: `All Staff`, icon: FaUsers, count: stats.total },
                  { key: "Active", label: "Active", icon: FaUserCheck, count: stats.active, color: "green" },
                  { key: "Inactive", label: "Inactive", icon: FaUserTimes, count: stats.inactive, color: "red" },
                ].map(({ key, label, icon: Icon, count, color }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                      filter === key
                        ? `bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg`
                        : `bg-white/5 text-gray-300 hover:bg-white/10 border border-white/20`
                    }`}
                  >
                    <Icon className="text-sm" />
                    <span>{label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      filter === key ? "bg-white/20 text-white" : "bg-white/10 text-gray-400"
                    }`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Table for View All Staffs */}
            {tab === "view" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Staff Member</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Joined Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((person, idx) => (
                      <tr 
                        key={person.id} 
                        className="border-b border-white/10 hover:bg-white/5 transition-colors animate-fadeInUp"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleProfileClick(person)}
                            className="text-white font-medium hover:text-purple-400 transition-colors flex items-center gap-2"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                              <span className="text-xs font-bold">{person.name.charAt(0)}</span>
                            </div>
                            {person.name}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            person.role === "Receptionist" 
                              ? "bg-purple-500/20 text-purple-400" 
                              : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {person.role === "Receptionist" ? "👑 Receptionist" : "👥 Staff"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          <div className="flex items-center gap-2">
                            <FaPhone className="text-xs text-purple-400" />
                            {person.contact}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          <div className="flex items-center gap-2">
                            <FaEnvelope className="text-xs text-purple-400" />
                            {person.email}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-xs text-purple-400" />
                            {person.joined_date}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            person.status === "Active" 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {person.status === "Active" ? "🟢 Active" : "🔴 Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleStatus(person)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1 ${
                              person.status === "Active" 
                                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                                : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            }`}
                          >
                            {person.status === "Active" ? <FaToggleOn /> : <FaToggleOff />}
                            {person.status === "Active" ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredStaff.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <FaUsers className="text-4xl text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No staff members found</h3>
                    <p className="text-gray-400">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            )}

            {/* Table for Manage Attendance */}
            {tab === "attendance" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Staff Member</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Today's Attendance</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendanceStaff.map((person, idx) => {
                      const att = attendance[person.id];
                      return (
                        <tr 
                          key={person.id} 
                          className="border-b border-white/10 hover:bg-white/5 transition-colors animate-fadeInUp"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-xs font-bold">{person.name.charAt(0)}</span>
                              </div>
                              <span className="text-white font-medium">{person.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              person.role === "Receptionist" 
                                ? "bg-purple-500/20 text-purple-400" 
                                : "bg-blue-500/20 text-blue-400"
                            }`}>
                              {person.role === "Receptionist" ? "👑 Receptionist" : "👥 Staff"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            <div className="flex items-center gap-2">
                              <FaPhone className="text-xs text-purple-400" />
                              {person.contact}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              person.status === "Active" 
                                ? "bg-green-500/20 text-green-400" 
                                : "bg-red-500/20 text-red-400"
                            }`}>
                              {person.status === "Active" ? "🟢 Active" : "🔴 Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => markAttendance(person, "Present")}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1 ${
                                    att?.status === "Present" 
                                      ? "bg-green-500 text-white" 
                                      : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                  }`}
                                >
                                  <FaCheckCircle className="text-xs" />
                                  Present
                                </button>
                                <button
                                  onClick={() => markAttendance(person, "Absent")}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1 ${
                                    att?.status === "Absent" 
                                      ? "bg-red-500 text-white" 
                                      : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                  }`}
                                >
                                  <FaTimesCircle className="text-xs" />
                                  Absent
                                </button>
                              </div>
                              {att && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <FaClock className="text-[10px]" />
                                  Last marked: {att.date} ({att.status})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => router.push(`/receptionist/attendance/${person.id}`)}
                              className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all duration-300 flex items-center gap-1 text-xs font-medium"
                            >
                              <FaEye className="text-xs" />
                              View Reports
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredAttendanceStaff.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <FaCalendarCheck className="text-4xl text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No attendance records found</h3>
                    <p className="text-gray-400">Staff members will appear here once added</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer with pagination info */}
            {tab === "view" && filteredStaff.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-center">
                <p className="text-sm text-gray-400">
                  Showing {filteredStaff.length} of {staff.length} staff members
                </p>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-white/5 rounded-lg text-gray-400 hover:bg-white/10 transition disabled:opacity-50" disabled>
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition">
                    1
                  </button>
                  <button className="px-3 py-1 bg-white/5 rounded-lg text-gray-400 hover:bg-white/10 transition">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease forwards;
        }
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .hover-scale {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-scale:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default ManageStaffnnAttendance;