"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";   // axios instance with owner tokens
import { FaUserPlus, FaArrowLeft, FaEnvelope, FaPhone, FaCalendarAlt, FaIdCard, FaMapMarkerAlt, FaUser, FaBriefcase, FaBirthdayCake } from "react-icons/fa";

export default function AddStaff() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    age: "",
    email: "",
    contact: "",
    address: "",
    citizenship: "",
    joined_date: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post("/api/hotel/add-staff/", formData);
      if (res.status === 201) {
        alert("Staff added successfully!");
        router.push("/owner/manage-staffnattendance?view=all");
      }
    } catch (err) {
      console.error("Error adding staff:", err.response?.data || err.message);
      alert("Failed to add staff. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputFields = [
    { name: "name", label: "Staff Name", type: "text", icon: FaUser, placeholder: "Enter full name", required: true },
    { name: "role", label: "Staff Role", type: "text", icon: FaBriefcase, placeholder: "e.g., Receptionist, Housekeeper", required: true },
    { name: "age", label: "Age", type: "number", icon: FaBirthdayCake, placeholder: "Enter age", required: true },
    { name: "email", label: "Email", type: "email", icon: FaEnvelope, placeholder: "staff@example.com", required: true },
    { name: "contact", label: "Contact Number", type: "text", icon: FaPhone, placeholder: "+977 98XXXXXXXX", required: true },
    { name: "address", label: "Permanent Address", type: "text", icon: FaMapMarkerAlt, placeholder: "Full address", required: true },
    { name: "citizenship", label: "Citizenship Number", type: "text", icon: FaIdCard, placeholder: "Citizenship ID", required: true },
    { name: "joined_date", label: "Joined Date", type: "date", icon: FaCalendarAlt, placeholder: "YYYY-MM-DD", required: true },
  ];

  return (
    <div style={containerStyle}>
      <div style={backgroundOverlay}></div>
      
      <div style={contentWrapperStyle}>
        {/* Header with Back Button */}
        <div style={headerStyle}>
          <button 
            onClick={() => router.back()} 
            style={backButtonStyle}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(-5px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}
          >
            <FaArrowLeft style={{ marginRight: "8px" }} />
            Back
          </button>
          <div style={headerIconStyle}>
            <FaUserPlus />
          </div>
        </div>

        {/* Form Container */}
        <div style={formContainerStyle}>
          <h2 style={titleStyle}>
            Add New Staff Member
          </h2>
          <p style={subtitleStyle}>
            Fill in the details below to add a new staff member to your team
          </p>

          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={formGridStyle}>
              {inputFields.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.name} style={inputWrapperStyle}>
                    <label style={labelStyle}>
                      <Icon style={labelIconStyle} />
                      {field.label}
                      {field.required && <span style={requiredStar}>*</span>}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name]}
                      onChange={handleChange}
                      style={inputStyle}
                      required={field.required}
                      onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
                    />
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={submitButtonStyle}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(102, 126, 234, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.3)";
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={spinnerStyle}></div>
                  Adding Staff...
                </>
              ) : (
                <>
                  <FaUserPlus style={{ marginRight: "8px" }} />
                  Add Staff Member
                </>
              )}
            </button>
          </form>
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
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 20px",
};

const backgroundOverlay = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "url('/register.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  opacity: 0.1,
  pointerEvents: "none",
};

const contentWrapperStyle = {
  maxWidth: "900px",
  width: "100%",
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

const headerIconStyle = {
  width: "50px",
  height: "50px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  color: "white",
  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
};

const formContainerStyle = {
  marginTop: "10px",
};

const titleStyle = {
  fontSize: "32px",
  fontWeight: "bold",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  marginBottom: "8px",
  textAlign: "center",
};

const subtitleStyle = {
  textAlign: "center",
  color: "#6b7280",
  marginBottom: "32px",
  fontSize: "14px",
};

const formStyle = {
  width: "100%",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "20px",
  marginBottom: "30px",
};

const inputWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const labelStyle = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#374151",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const labelIconStyle = {
  fontSize: "12px",
  color: "#667eea",
};

const requiredStar = {
  color: "#ef4444",
  marginLeft: "4px",
};

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  border: "2px solid #e5e7eb",
  borderRadius: "12px",
  fontSize: "14px",
  transition: "all 0.3s ease",
  outline: "none",
  backgroundColor: "white",
  fontFamily: "inherit",
};

const submitButtonStyle = {
  width: "100%",
  padding: "14px",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  transition: "all 0.3s ease",
  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
  position: "relative",
};

const spinnerStyle = {
  width: "20px",
  height: "20px",
  border: "2px solid rgba(255,255,255,0.3)",
  borderTop: "2px solid white",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
  marginRight: "8px",
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
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    
    input:focus {
      border-color: #667eea !important;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
    }
  `;
  document.head.appendChild(style);
}