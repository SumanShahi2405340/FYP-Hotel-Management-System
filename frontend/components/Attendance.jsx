'use client';
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import { 
  FaCalendarAlt, FaChartLine, FaUserCheck, FaUserTimes, 
  FaArrowLeft, FaFilter, FaDownload, FaSpinner 
} from "react-icons/fa";

export default function Attendance() {
  const { id } = useParams();   // staff/receptionist ID from URL
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(
    ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][new Date().getMonth()]
  );
  const [staffInfo, setStaffInfo] = useState(null);

  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const years = Array.from({ length: 15 }, (_, i) => (2026 + i).toString());

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const monthIndex = months.indexOf(month) + 1;
        const res = await api.get(
          `/api/attendance/monthly/?person_id=${id}&year=${year}&month=${monthIndex}`
        );
        setAttendanceData(res.data);
        
        // Get staff info if available
        if (res.data && res.data.length > 0) {
          setStaffInfo({
            name: res.data[0].name,
            role: res.data[0].role
          });
        }
      } catch (err) {
        console.error("Error fetching attendance:", err.response?.data || err.message);
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAttendance();
  }, [id, year, month]);

  // Calculate statistics
  const presentCount = attendanceData.filter(record => record.status === "Present").length;
  const absentCount = attendanceData.filter(record => record.status === "Absent").length;
  const totalDays = attendanceData.length;
  const attendanceRate = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : 0;

  const handleBack = () => {
    window.history.back();
  };

  const handleDownload = () => {
    // Create CSV content
    const headers = ["Name", "Role", "Date", "Status"];
    const csvData = attendanceData.map(record => [
      record.name,
      record.role,
      record.date,
      record.status
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.join(","))
      .join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${staffInfo?.name || "staff"}_${month}_${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={loadingSpinnerStyle}></div>
        <p style={{ color: "white", marginTop: "20px" }}>Loading attendance records...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={backgroundOverlay}></div>
      
      <div style={contentWrapperStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <button 
            onClick={handleBack} 
            style={backButtonStyle}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(-5px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}
          >
            <FaArrowLeft style={{ marginRight: "8px" }} />
            Back
          </button>
          
          <div style={headerTitleStyle}>
            <FaCalendarAlt style={headerIconStyle} />
            <h1 style={titleStyle}>Attendance Records</h1>
          </div>
          
          {attendanceData.length > 0 && (
            <button 
              onClick={handleDownload}
              style={downloadButtonStyle}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <FaDownload style={{ marginRight: "6px" }} />
              Export CSV
            </button>
          )}
        </div>

        {/* Staff Info Card */}
        {staffInfo && (
          <div style={staffInfoCardStyle}>
            <div style={staffInfoContentStyle}>
              <div style={staffAvatarStyle}>
                {staffInfo.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={staffNameStyle}>{staffInfo.name}</h3>
                <p style={staffRoleStyle}>{staffInfo.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {attendanceData.length > 0 && (
          <div style={statsContainerStyle}>
            <div style={statCardStyle}>
              <div style={statIconStyle} className="present-icon">
                <FaUserCheck />
              </div>
              <div>
                <p style={statLabelStyle}>Present Days</p>
                <p style={statValueStyle}>{presentCount}</p>
              </div>
            </div>
            
            <div style={statCardStyle}>
              <div style={statIconStyle} className="absent-icon">
                <FaUserTimes />
              </div>
              <div>
                <p style={statLabelStyle}>Absent Days</p>
                <p style={statValueStyle}>{absentCount}</p>
              </div>
            </div>
            
            <div style={statCardStyle}>
              <div style={statIconStyle} className="rate-icon">
                <FaChartLine />
              </div>
              <div>
                <p style={statLabelStyle}>Attendance Rate</p>
                <p style={statValueStyle}>{attendanceRate}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={filterContainerStyle}>
          <div style={filterLabelStyle}>
            <FaFilter style={{ marginRight: "8px" }} />
            Filter by:
          </div>
          
          <div style={selectWrapperStyle}>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={selectStyle}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div style={selectWrapperStyle}>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={selectStyle}
            >
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Attendance Table */}
        <div style={tableContainerStyle}>
          {attendanceData.length > 0 ? (
            <>
              <div style={tableHeaderStyle}>
                <div style={tableTitleStyle}>
                  Attendance Details - {month} {year}
                </div>
                <div style={tableCountStyle}>
                  {totalDays} records found
                </div>
              </div>
              
              <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderRowStyle}>
                      <th style={tableHeaderCellStyle}>Name</th>
                      <th style={tableHeaderCellStyle}>Role</th>
                      <th style={tableHeaderCellStyle}>Date</th>
                      <th style={tableHeaderCellStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((record, idx) => (
                      <tr 
                        key={idx} 
                        style={{
                          ...tableRowStyle,
                          animationDelay: `${idx * 0.03}s`
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                      >
                        <td style={tableCellStyle}>
                          <span style={tableCellNameStyle}>{record.name}</span>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={roleBadgeStyle}>{record.role}</span>
                        </td>
                        <td style={tableCellStyle}>{record.date}</td>
                        <td style={tableCellStyle}>
                          <span style={{
                            ...statusBadgeStyle,
                            backgroundColor: record.status === "Present" 
                              ? "rgba(34,197,94,0.1)" 
                              : "rgba(239,68,68,0.1)",
                            color: record.status === "Present" ? "#22c55e" : "#ef4444"
                          }}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={emptyStateStyle}>
              <div style={emptyIconStyle}>📊</div>
              <p style={emptyTextStyle}>No attendance data for {month} {year}</p>
              <p style={emptySubtextStyle}>Try selecting a different month or year</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Styles
const containerStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  position: "relative",
  padding: "40px 20px",
};

const backgroundOverlay = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "url('/2.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  opacity: 0.1,
  pointerEvents: "none",
};

const contentWrapperStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  backgroundColor: "rgba(255,255,255,0.98)",
  borderRadius: "24px",
  padding: "40px",
  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
  position: "relative",
  zIndex: 2,
  animation: "fadeInUp 0.5s ease-out",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "30px",
  flexWrap: "wrap",
  gap: "15px",
};

const backButtonStyle = {
  padding: "10px 20px",
  backgroundColor: "#f3f4f6",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  color: "#4b5563",
  display: "flex",
  alignItems: "center",
  transition: "all 0.3s ease",
};

const headerTitleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const headerIconStyle = {
  fontSize: "28px",
  color: "#667eea",
};

const titleStyle = {
  fontSize: "28px",
  fontWeight: "bold",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  margin: 0,
};

const downloadButtonStyle = {
  padding: "10px 20px",
  backgroundColor: "#10b981",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  color: "white",
  display: "flex",
  alignItems: "center",
  transition: "all 0.3s ease",
};

const staffInfoCardStyle = {
  background: "linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "30px",
  border: "1px solid rgba(102,126,234,0.2)",
};

const staffInfoContentStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

const staffAvatarStyle = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: "bold",
  color: "white",
};

const staffNameStyle = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#1f2937",
  margin: 0,
};

const staffRoleStyle = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "4px 0 0 0",
};

const statsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "20px",
  marginBottom: "30px",
};

const statCardStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  gap: "15px",
  border: "1px solid #e5e7eb",
  transition: "all 0.3s ease",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const statIconStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
};

const statLabelStyle = {
  fontSize: "12px",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: 0,
};

const statValueStyle = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "4px 0 0 0",
};

const filterContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  marginBottom: "30px",
  flexWrap: "wrap",
  padding: "20px",
  backgroundColor: "#f9fafb",
  borderRadius: "12px",
};

const filterLabelStyle = {
  display: "flex",
  alignItems: "center",
  fontSize: "14px",
  fontWeight: "500",
  color: "#4b5563",
};

const selectWrapperStyle = {
  position: "relative",
};

const selectStyle = {
  padding: "8px 32px 8px 16px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "14px",
  backgroundColor: "white",
  cursor: "pointer",
  outline: "none",
  transition: "all 0.3s ease",
};

const tableContainerStyle = {
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
};

const tableHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px",
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
};

const tableTitleStyle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1f2937",
};

const tableCountStyle = {
  fontSize: "14px",
  color: "#6b7280",
};

const tableWrapperStyle = {
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const tableHeaderRowStyle = {
  backgroundColor: "#f3f4f6",
  borderBottom: "2px solid #e5e7eb",
};

const tableHeaderCellStyle = {
  padding: "15px",
  textAlign: "left",
  fontWeight: "600",
  color: "#374151",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tableRowStyle = {
  borderBottom: "1px solid #f3f4f6",
  transition: "background-color 0.2s ease",
  animation: "fadeInUp 0.3s ease-out",
};

const tableCellStyle = {
  padding: "15px",
  fontSize: "14px",
  color: "#4b5563",
};

const tableCellNameStyle = {
  fontWeight: "500",
  color: "#1f2937",
};

const roleBadgeStyle = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "500",
  backgroundColor: "rgba(102,126,234,0.1)",
  color: "#667eea",
};

const statusBadgeStyle = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "500",
};

const emptyStateStyle = {
  textAlign: "center",
  padding: "60px 20px",
};

const emptyIconStyle = {
  fontSize: "48px",
  marginBottom: "16px",
};

const emptyTextStyle = {
  fontSize: "18px",
  fontWeight: "500",
  color: "#374151",
  marginBottom: "8px",
};

const emptySubtextStyle = {
  fontSize: "14px",
  color: "#9ca3af",
};

const loadingContainerStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
};

const loadingSpinnerStyle = {
  width: "50px",
  height: "50px",
  border: "3px solid rgba(255,255,255,0.3)",
  borderTop: "3px solid white",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

// Add keyframes to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
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
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .present-icon {
      background: rgba(34,197,94,0.1);
      color: #22c55e;
    }
    
    .absent-icon {
      background: rgba(239,68,68,0.1);
      color: #ef4444;
    }
    
    .rate-icon {
      background: rgba(102,126,234,0.1);
      color: #667eea;
    }
    
    select:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102,126,234,0.1);
    }
  `;
  document.head.appendChild(style);
}