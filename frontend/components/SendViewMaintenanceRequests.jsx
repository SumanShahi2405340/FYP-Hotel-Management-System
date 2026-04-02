"use client";
import React, { useState, useEffect } from "react";
import {
  FaWrench,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaHourglassHalf,
  FaCheckDouble,
  FaBed,
  FaUser,
  FaCalendarAlt,
} from "react-icons/fa";

const ReceptionistPanel = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    room: "",
    issue: "",
    reported_by: "",
    date: "",
    status: "Pending",
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch existing requests
  useEffect(() => {
    fetch("http://localhost:8000/api/requests/")
      .then((res) => {
        if (!res.ok) throw new Error("Problem in Fetching!!");
        return res.json();
      })
      .then((data) => {
        if (data.length > 0) {
          setRequests(data);
          setError(null);
        } else {
          setError("No requests sent yet!!");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Problem in Fetching!!");
        setLoading(false);
      });
  }, []);

  // Handle new request creation
  const handleCreateRequest = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage("");
    setError(null);

    fetch("http://localhost:8000/api/requests/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRequest),
    })
      .then((res) => res.json())
      .then((saved) => {
        setRequests((prev) => [saved, ...prev]);
        setShowForm(false);
        setNewRequest({
          room: "",
          issue: "",
          reported_by: "",
          date: "",
          status: "Pending",
        });
        setSuccessMessage("Request created successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      })
      .catch(() => {
        setError("Failed to send request!!");
      })
      .finally(() => setSubmitting(false));
  };

  // Handle request deletion
  const handleDelete = (id) => {
    fetch(`http://localhost:8000/api/requests/${id}/`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Delete failed");
        setRequests((prev) => prev.filter((req) => req.id !== id));
      })
      .catch(() => {
        // fallback: remove locally even if backend fails
        setRequests((prev) => prev.filter((req) => req.id !== id));
      });
  };

  // Statistics
  const total = requests.length;
  const pending = requests.filter((r) => r.status === "Pending").length;
  const inProgress = requests.filter((r) => r.status === "In Progress").length;
  const resolved = requests.filter((r) => r.status === "Resolved").length;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', sans-serif;
        }

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

        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease forwards;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fadeInUp">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Maintenance Requests
                </h1>
                <p className="text-gray-400 mt-2">Manage and track all maintenance issues</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                {showForm ? "Close Form" : <><FaPlus /> Create Request</>}
              </button>
            </div>
          </div>

          {/* Create Request Form */}
          {showForm && (
            <div className="mb-8 animate-fadeInUp">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <FaWrench className="text-purple-400" />
                  New Maintenance Request
                </h2>
                <form onSubmit={handleCreateRequest} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <FaBed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Room Number"
                        value={newRequest.room}
                        onChange={(e) => setNewRequest({ ...newRequest, room: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Reported By"
                        value={newRequest.reported_by}
                        onChange={(e) => setNewRequest({ ...newRequest, reported_by: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={newRequest.date}
                        onChange={(e) => setNewRequest({ ...newRequest, date: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                    <div className="relative">
                      <FaWrench className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Issue Description"
                        value={newRequest.issue}
                        onChange={(e) => setNewRequest({ ...newRequest, issue: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {submitting ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaCheckCircle />
                      )}
                      Send Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Total Requests", value: total, icon: FaWrench, color: "from-blue-500 to-cyan-500" },
              { label: "Pending", value: pending, icon: FaHourglassHalf, color: "from-yellow-500 to-orange-500" },
              { label: "In Progress", value: inProgress, icon: FaSpinner, color: "from-purple-500 to-pink-500" },
              { label: "Resolved", value: resolved, icon: FaCheckDouble, color: "from-green-500 to-emerald-500" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 hover-scale animate-fadeInUp"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                      <stat.icon className="text-2xl text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                  <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Requests Table */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 animate-fadeInUp">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <FaSpinner className="animate-spin text-4xl text-purple-400" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FaExclamationCircle className="text-5xl text-red-400 mb-4" />
                <p className="text-red-400 text-lg">{error}</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16">
                <FaWrench className="text-5xl text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No maintenance requests found.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition"
                >
                  Create your first request
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-gray-400 text-sm">
                      <th className="pb-3">Room</th>
                      <th className="pb-3">Issue</th>
                      <th className="pb-3">Reported By</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-3 text-white font-medium">{req.room}</td>
                        <td className="py-3 text-gray-300">{req.issue}</td>
                        <td className="py-3 text-gray-300">{req.reported_by}</td>
                        <td className="py-3 text-gray-300">{req.date}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              req.status === "Pending"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : req.status === "In Progress"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDelete(req.id)}
                            className="p-2 text-red-400 hover:text-red-300 transition"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Success message snackbar (optional) */}
          {successMessage && (
            <div className="fixed bottom-4 right-4 z-50 animate-fadeInUp">
              <div className="bg-green-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                <FaCheckCircle />
                {successMessage}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .hover-scale {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-scale:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </>
  );
};

export default ReceptionistPanel;