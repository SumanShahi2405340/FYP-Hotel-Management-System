'use client';
import { useState, useEffect } from 'react';
import { 
  FaTimes, FaPaperPlane, FaBell, FaUsers, FaUserTie, FaHistory, 
  FaCheckCircle, FaTags, FaPlus, FaEdit, FaTrash, FaToggleOn, 
  FaToggleOff, FaSave, FaTimesCircle, FaCalendarAlt, FaExclamationTriangle
} from 'react-icons/fa';
import axios from 'axios';

export default function AnnouncementPanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('announcements');
  const [message, setMessage] = useState('');
  const [sendToAdmin, setSendToAdmin] = useState(false);
  const [sendToReceptionist, setSendToReceptionist] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Promotions state
  const [promotions, setPromotions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  // Helper to attach JWT token
  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch promotions
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

  // Fetch recent announcements when panel opens
  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:8000/api/owner-recent-announcements/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data) ? data : [];
        setAnnouncements(items);
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch announcements:", errorData);
        setError(errorData.error || "Failed to load announcements");
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError("Network error while loading announcements");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements();
      fetchPromotions();
      // Clear messages when panel opens
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const handleSend = async () => {
    // Reset messages
    setError('');
    setSuccess('');
    
    // Validate message
    if (!message.trim()) {
      setError('Please enter an announcement message.');
      return;
    }
    
    // Validate recipient selection
    if (!sendToAdmin && !sendToReceptionist) {
      setError('Please select at least one recipient (Admin or Receptionist).');
      return;
    }

    setIsSending(true);
    
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:8000/api/owner-send-announcement/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message: message.trim(),
          sendToAdmin: sendToAdmin,
          sendToReceptionist: sendToReceptionist,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success
        setSuccess(data.message || 'Announcement sent successfully!');
        
        // Refresh announcements list
        await fetchAnnouncements();
        
        // Reset form
        setMessage('');
        setSendToAdmin(false);
        setSendToReceptionist(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
        
        // Optional: Close panel after successful send (after 1.5 seconds)
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to send announcement. Please try again.');
      }
    } catch (err) {
      console.error("Network error:", err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Promotions handlers
  const handleAddPromotion = async () => {
    if (!title || !description || !validFrom || !validTo) {
      setError("Please fill in all promotion fields");
      return;
    }
    
    const newPromo = { 
      title, 
      description, 
      valid_from: validFrom, 
      valid_to: validTo, 
      status: "Upcoming" 
    };
    
    try {
      const response = await axios.post("http://localhost:8000/api/promotions/", newPromo, {
        headers: getAuthHeaders(),
      });
      
      if (response.status === 201) {
        await fetchPromotions();
        setShowForm(false);
        setTitle(""); 
        setDescription(""); 
        setValidFrom(""); 
        setValidTo("");
        setSuccess("Promotion added successfully!");
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error("Error adding promotion:", err);
      setError(err.response?.data?.message || "Failed to add promotion");
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this promotion?")) {
      try {
        await axios.delete(`http://localhost:8000/api/promotions/${id}/`, {
          headers: getAuthHeaders(),
        });
        setPromotions(promotions.filter((p) => p.id !== id));
        setSuccess("Promotion deleted successfully!");
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error("Error deleting promotion:", err);
        setError("Failed to delete promotion");
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleToggleStatus = async (promo) => {
    const updated = { ...promo, status: promo.status === "Active" ? "Upcoming" : "Active" };
    try {
      await axios.put(`http://localhost:8000/api/promotions/${promo.id}/`, updated, {
        headers: getAuthHeaders(),
      });
      setPromotions(promotions.map((p) => (p.id === promo.id ? updated : p)));
      setSuccess(`Promotion ${updated.status} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Error toggling status:", err);
      setError("Failed to update promotion status");
      setTimeout(() => setError(''), 3000);
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
      setSuccess("Promotion updated successfully!");
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Error saving edit:", err);
      setError("Failed to save promotion changes");
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-[550px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl z-30 transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Full gradient border */}
      <div className="absolute inset-0 rounded-l-2xl pointer-events-none">
        <div className="absolute inset-0 rounded-l-2xl bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 opacity-40"></div>
        <div className="absolute inset-[1px] rounded-l-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
      </div>

      {/* Decorative gradient border top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 z-10"></div>

      <div className="p-6 flex flex-col h-full relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <FaBell className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Admin Center
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Manage announcements & promotions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all duration-200"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
            <FaExclamationTriangle className="text-red-400 text-sm" />
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
              <FaTimes className="text-xs" />
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2">
            <FaCheckCircle className="text-green-400 text-sm" />
            <p className="text-green-400 text-sm flex-1">{success}</p>
            <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300">
              <FaTimes className="text-xs" />
            </button>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'announcements'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/20'
            }`}
          >
            <FaBell className="text-sm" />
            Announcements
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'promotions'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/20'
            }`}
          >
            <FaTags className="text-sm" />
            Promotions & Discounts
          </button>
        </div>

        {/* Announcements Tab Content */}
        {activeTab === 'announcements' && (
          <>
            {/* Message box */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Announcement Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement... ✨📢"
                className="w-full h-36 p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
              <p className="text-xs text-gray-500 mt-2 text-right">
                {message.length} characters
              </p>
            </div>

            {/* Recipient checkboxes */}
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <FaUsers className="text-purple-400 text-sm" />
                Select Recipients
              </p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sendToAdmin}
                    onChange={() => setSendToAdmin(!sendToAdmin)}
                    className="w-4 h-4 rounded border-white/30 bg-white/5 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <FaUserTie className="text-blue-400 text-sm" />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      Send to Admin
                    </span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sendToReceptionist}
                    onChange={() => setSendToReceptionist(!sendToReceptionist)}
                    className="w-4 h-4 rounded border-white/30 bg-white/5 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-green-400 text-sm" />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      Send to Receptionist
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={isSending || !message.trim() || (!sendToAdmin && !sendToReceptionist)}
              className={`relative overflow-hidden group bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                (isSending || !message.trim() || (!sendToAdmin && !sendToReceptionist)) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-xl hover:scale-105'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="text-sm" />
                    Send Announcement
                  </>
                )}
              </span>
            </button>

            {/* Announcement history */}
            <div className="mt-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                <FaHistory className="text-purple-400 text-sm" />
                <h3 className="text-sm font-semibold text-gray-300">
                  Recent Announcements
                </h3>
                <span className="text-xs text-gray-500 ml-auto">
                  {announcements.length} total
                </span>
              </div>
              
              {announcements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                    <FaBell className="text-gray-500 text-xl" />
                  </div>
                  <p className="text-sm text-gray-500">No announcements yet</p>
                  <p className="text-xs text-gray-600 mt-1">Your sent announcements will appear here</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {announcements.map((a, idx) => (
                    <li
                      key={idx}
                      className="bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all duration-200 border border-white/10 group"
                    >
                      <div className="mb-2 text-sm text-gray-200 leading-relaxed">
                        {a.content}
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                            {a.recipients?.join(', ') || 'No recipients'}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-500">
                            {a.timestamp ? new Date(a.timestamp).toLocaleString() : ""}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* Promotions Tab Content */}
        {activeTab === 'promotions' && (
          <div className="flex-1 overflow-y-auto">
            {/* Create Promotion Button */}
            <div className="mb-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-200"
              >
                <FaPlus className="text-sm" />
                {showForm ? "Hide Form" : "Create New Promotion"}
              </button>
            </div>

            {/* Add Promotion Form */}
            {showForm && (
              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 space-y-3 animate-fadeInUp">
                <input
                  type="text"
                  placeholder="Promotion Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
                />
                <textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Valid From</label>
                    <input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Valid To</label>
                    <input
                      type="date"
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddPromotion}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-200"
                >
                  Add Promotion
                </button>
              </div>
            )}

            {/* Promotions Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Valid From</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Valid To</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-400">
                        <FaTags className="text-3xl mx-auto mb-2 text-gray-500" />
                        No promotions found
                      </td>
                    </tr>
                  ) : (
                    promotions.map((promo) => (
                      <tr key={promo.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="px-3 py-3 text-white text-sm">
                          {editId === promo.id ? (
                            <input
                              type="text"
                              value={editData.title}
                              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                              className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                            />
                          ) : promo.title}
                        </td>
                        <td className="px-3 py-3 text-gray-300 text-sm">
                          {editId === promo.id ? (
                            <textarea
                              value={editData.description}
                              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                              className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm resize-none"
                              rows="2"
                            />
                          ) : (
                            <div className="max-w-[200px] truncate">{promo.description}</div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-gray-300 text-sm">
                          {editId === promo.id ? (
                            <input
                              type="date"
                              value={editData.valid_from}
                              onChange={(e) => setEditData({ ...editData, valid_from: e.target.value })}
                              className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                            />
                          ) : (
                            <div className="flex items-center gap-1">
                              <FaCalendarAlt className="text-purple-400 text-xs" />
                              {promo.valid_from}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-gray-300 text-sm">
                          {editId === promo.id ? (
                            <input
                              type="date"
                              value={editData.valid_to}
                              onChange={(e) => setEditData({ ...editData, valid_to: e.target.value })}
                              className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                            />
                          ) : (
                            <div className="flex items-center gap-1">
                              <FaCalendarAlt className="text-purple-400 text-xs" />
                              {promo.valid_to}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            promo.status === "Active" 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {promo.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleToggleStatus(promo)}
                              className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all flex items-center gap-1"
                              title={promo.status === "Active" ? "Set as Upcoming" : "Activate"}
                            >
                              {promo.status === "Active" ? <FaToggleOff /> : <FaToggleOn />}
                              {promo.status === "Active" ? "Upcoming" : "Active"}
                            </button>
                            {editId === promo.id ? (
                              <>
                                <button
                                  onClick={handleSaveEdit}
                                  className="px-2 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all flex items-center gap-1"
                                >
                                  <FaSave className="text-xs" /> Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-all flex items-center gap-1"
                                >
                                  <FaTimesCircle className="text-xs" /> Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleEdit(promo)}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all flex items-center gap-1"
                              >
                                <FaEdit className="text-xs" /> Edit
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(promo.id)}
                              className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center gap-1"
                            >
                              <FaTrash className="text-xs" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500">
            {activeTab === 'announcements' 
              ? "Announcements are sent instantly to selected recipients" 
              : "Manage your promotional offers and discount campaigns"}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease forwards;
        }
      `}</style>
    </div>
  );
}