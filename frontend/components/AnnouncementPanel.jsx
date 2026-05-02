'use client';
import { useState, useEffect } from 'react';
import { 
  FaTimes, FaBullhorn, FaPaperPlane, FaCheckCircle, FaSpinner, 
  FaTags, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, 
  FaSave, FaTimesCircle, FaCalendarAlt, FaHotel
} from 'react-icons/fa';
import axios from 'axios';

export default function AdminAnnouncementPanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('announcements');
  const [message, setMessage] = useState('');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [announcements, setAnnouncements] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState('');
  const [sendError, setSendError] = useState('');

  // Promotions state
  const [promotions, setPromotions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch recent announcements (admin sent to hotels)
  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('http://localhost:8000/api/recent-announcements/', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await res.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  // Fetch promotions
  const fetchPromotions = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/promotions/', {
        headers: getAuthHeaders(),
      });
      setPromotions(res.data);
    } catch (err) {
      console.error('Error fetching promotions:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements();
      fetchPromotions();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setSendSuccess('');
    setSendError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/api/send-announcement/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message: message.trim(),
          hotel_status: hotelFilter,   // ✅ 'all' | 'active' | 'inactive'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSendSuccess(
          `✅ Announcement sent to ${data.sent_to} hotel(s) successfully!`
        );
        setMessage('');
        // Re-fetch history so it shows the newly saved records
        await fetchAnnouncements();
        setTimeout(() => setSendSuccess(''), 4000);
      } else {
        setSendError(data.error || 'Failed to send announcement.');
      }
    } catch (err) {
      console.error('Network error:', err);
      setSendError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // ─── Promotions handlers ────────────────────────────────────────────────────

  const handleAddPromotion = async () => {
    if (title && description && validFrom && validTo) {
      try {
        await axios.post(
          'http://localhost:8000/api/promotions/',
          { title, description, valid_from: validFrom, valid_to: validTo, status: 'Upcoming' },
          { headers: getAuthHeaders() }
        );
        await fetchPromotions();
        setShowForm(false);
        setTitle(''); setDescription(''); setValidFrom(''); setValidTo('');
      } catch (err) {
        console.error('Error adding promotion:', err);
      }
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this promotion?')) {
      try {
        await axios.delete(`http://localhost:8000/api/promotions/${id}/`, {
          headers: getAuthHeaders(),
        });
        setPromotions(promotions.filter((p) => p.id !== id));
      } catch (err) {
        console.error('Error deleting promotion:', err);
      }
    }
  };

  const handleToggleStatus = async (promo) => {
    const updated = { ...promo, status: promo.status === 'Active' ? 'Upcoming' : 'Active' };
    try {
      await axios.put(`http://localhost:8000/api/promotions/${promo.id}/`, updated, {
        headers: getAuthHeaders(),
      });
      setPromotions(promotions.map((p) => (p.id === promo.id ? updated : p)));
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleEdit = (promo) => { setEditId(promo.id); setEditData({ ...promo }); };
  const handleCancelEdit = () => { setEditId(null); setEditData({}); };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`http://localhost:8000/api/promotions/${editId}/`, editData, {
        headers: getAuthHeaders(),
      });
      await fetchPromotions();
      setEditId(null); setEditData({});
    } catch (err) {
      console.error('Error saving edit:', err);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Slide-out panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[550px] bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl shadow-2xl z-50 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } border-l border-white/10`}
      >
        <div className="flex flex-col h-full">

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                <FaBullhorn className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Admin Center</h2>
                <p className="text-xs text-gray-400">Manage announcements & promotions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <FaTimes className="text-gray-300 text-sm" />
            </button>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-3 p-4 border-b border-white/10">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'announcements'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/20'
              }`}
            >
              <FaBullhorn className="text-sm" /> Announcements
            </button>
            <button
              onClick={() => setActiveTab('promotions')}
              className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'promotions'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/20'
              }`}
            >
              <FaTags className="text-sm" /> Promotions & Discounts
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* ── Announcements Tab ── */}
            {activeTab === 'announcements' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Announcement Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your announcement... 📢✨"
                    className="w-full h-36 p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Hotel filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Send to
                  </label>
                  <select
                    value={hotelFilter}
                    onChange={(e) => setHotelFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="all">All Hotels</option>
                    <option value="active">Active Hotels</option>
                    <option value="inactive">Inactive Hotels</option>
                  </select>
                </div>

                {/* Success / Error feedback */}
                {sendSuccess && (
                  <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm">
                    {sendSuccess}
                  </div>
                )}
                {sendError && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
                    {sendError}
                    <button onClick={() => setSendError('')}><FaTimes className="text-xs" /></button>
                  </div>
                )}

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={sending || !message.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <><FaSpinner className="animate-spin" /> Sending...</>
                  ) : (
                    <><FaPaperPlane /> Send Announcement</>
                  )}
                </button>

                {/* Announcement history */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                    <FaCheckCircle className="text-green-400 text-xs" />
                    Recent Announcements Sent
                  </h3>
                  {announcements.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No announcements sent yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {announcements.map((a, idx) => (
                        <li
                          key={idx}
                          className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition"
                        >
                          <p className="text-sm text-white mb-1">{a.content}</p>
                          <div className="text-xs text-gray-400 flex flex-wrap gap-3 mt-1">
                            {a.hotel_name && (
                              <span className="flex items-center gap-1">
                                <FaHotel className="text-amber-400" />
                                {a.hotel_name}
                              </span>
                            )}
                            <span>🕒 {a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* ── Promotions Tab ── */}
            {activeTab === 'promotions' && (
              <div className="space-y-5">
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-200"
                >
                  <FaPlus className="text-sm" />
                  {showForm ? 'Hide Form' : 'Create New Promotion'}
                </button>

                {showForm && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3 animate-fadeInUp">
                    <input
                      type="text" placeholder="Promotion Title" value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
                    />
                    <input
                      type="text" placeholder="Description" value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="date" value={validFrom}
                        onChange={(e) => setValidFrom(e.target.value)}
                        className="px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                      <input type="date" value={validTo}
                        onChange={(e) => setValidTo(e.target.value)}
                        className="px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"
                      />
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
                        {['Title', 'Description', 'Valid From', 'Valid To', 'Status', 'Actions'].map(h => (
                          <th key={h} className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
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
                              {editId === promo.id
                                ? <input type="text" value={editData.title}
                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm" />
                                : promo.title}
                            </td>
                            <td className="px-3 py-3 text-gray-300 text-sm">
                              {editId === promo.id
                                ? <input type="text" value={editData.description}
                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm" />
                                : promo.description}
                            </td>
                            <td className="px-3 py-3 text-gray-300 text-sm">
                              {editId === promo.id
                                ? <input type="date" value={editData.valid_from}
                                    onChange={(e) => setEditData({ ...editData, valid_from: e.target.value })}
                                    className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm" />
                                : <div className="flex items-center gap-1"><FaCalendarAlt className="text-blue-400 text-xs" />{promo.valid_from}</div>}
                            </td>
                            <td className="px-3 py-3 text-gray-300 text-sm">
                              {editId === promo.id
                                ? <input type="date" value={editData.valid_to}
                                    onChange={(e) => setEditData({ ...editData, valid_to: e.target.value })}
                                    className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm" />
                                : <div className="flex items-center gap-1"><FaCalendarAlt className="text-blue-400 text-xs" />{promo.valid_to}</div>}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                promo.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {promo.status}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button onClick={() => handleToggleStatus(promo)}
                                  className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all flex items-center gap-1"
                                  title={promo.status === 'Active' ? 'Set as Upcoming' : 'Activate'}
                                >
                                  {promo.status === 'Active' ? <FaToggleOff /> : <FaToggleOn />}
                                  {promo.status === 'Active' ? 'Upcoming' : 'Active'}
                                </button>
                                {editId === promo.id ? (
                                  <>
                                    <button onClick={handleSaveEdit}
                                      className="px-2 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all flex items-center gap-1">
                                      <FaSave className="text-xs" /> Save
                                    </button>
                                    <button onClick={handleCancelEdit}
                                      className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-all flex items-center gap-1">
                                      <FaTimesCircle className="text-xs" /> Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button onClick={() => handleEdit(promo)}
                                    className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all flex items-center gap-1">
                                    <FaEdit className="text-xs" /> Edit
                                  </button>
                                )}
                                <button onClick={() => handleDelete(promo.id)}
                                  className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center gap-1">
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
          </div>

          {/* Footer */}
          <div className="p-4 pt-3 border-t border-white/10 text-center">
            <p className="text-xs text-gray-500">
              {activeTab === 'announcements'
                ? 'Announcements are saved per hotel and visible in owner dashboards'
                : 'Manage your promotional offers and discount campaigns'}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.3s ease forwards; }
      `}</style>
    </>
  );
}