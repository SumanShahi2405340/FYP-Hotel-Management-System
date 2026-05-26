"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaQrcode, FaUniversity, FaWallet, FaChartLine, FaCheckCircle,
  FaClock, FaCoins, FaCalendarAlt, FaArrowUp, FaArrowDown
} from "react-icons/fa";

const parseMoneyAmount = (value) => {
  if (value === null || value === undefined) return 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value)
    .replace(/NPR/gi, "")
    .replace(/Rs\.?/gi, "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "")
    .trim();

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNPR = (value) => {
  const amount = parseMoneyAmount(value);
  return `Rs ${amount.toLocaleString("en-NP", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const OwnerCommissionSetting = () => {
  const [showSend, setShowSend] = useState(false);
  const [commissions, setCommissions] = useState([]);
  const [loadingCommissions, setLoadingCommissions] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('Dec');
  const [selectedYear, setSelectedYear] = useState('2025');

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch commission reports from Admin's commission setting API
  useEffect(() => {
    const fetchCommissions = async () => {
      setLoadingCommissions(true);
      try {
        // Get month number from selected month name
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthNumber = monthNames.indexOf(selectedMonth) + 1;
        const paddedMonth = monthNumber.toString().padStart(2, '0');
        
        const url = `http://localhost:8000/api/commission-revenue/?month=${paddedMonth}&year=${selectedYear}`;
        const res = await axios.get(url, {
          headers: getAuthHeaders(),
        });
        
        // Transform revenue data to commission format
        const transformedData = Array.isArray(res.data) ? res.data.map(item => {
          const amount = parseMoneyAmount(item.amount);
          return {
            id: item.payment_id,
            date: item.start_due_date || `${selectedYear}-${paddedMonth}-01`,
            time: new Date().toLocaleTimeString(),
            rate: amount,
            display_amount: formatNPR(amount),
            status: item.status || "Pending",
            hotel_name: item.hotel_name,
            hotel_id: item.hotel_id || item.payment_id
          };
        }) : [];
        
        setCommissions(transformedData);
      } catch (err) {
        console.error("Error fetching commissions:", err);
        setCommissions([]);
      } finally {
        setLoadingCommissions(false);
      }
    };
    fetchCommissions();
  }, [selectedMonth, selectedYear]);

  const totalPaid = commissions
    .filter(c => c.status === "Paid")
    .reduce((sum, c) => sum + parseMoneyAmount(c.rate), 0);

  const totalPending = commissions
    .filter(c => c.status === "Pending")
    .reduce((sum, c) => sum + parseMoneyAmount(c.rate), 0);

  // Month and Year selectors
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: 10 }, (_, i) => (2025 + i).toString());

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .ocs-root {
          min-height: 100vh;
          background: #080c14;
          font-family: 'DM Sans', sans-serif;
          color: #e2e8f0;
          padding: 40px 32px;
          position: relative;
          overflow-x: hidden;
        }

        .ocs-root::before {
          content: '';
          position: fixed;
          top: -200px;
          left: -200px;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .ocs-root::after {
          content: '';
          position: fixed;
          bottom: -150px;
          right: -150px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .ocs-inner {
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* Header */
        .ocs-header {
          margin-bottom: 36px;
        }
        .ocs-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #a5b4fc 60%, #6ee7b7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }
        .ocs-header p {
          color: #64748b;
          margin-top: 6px;
          font-size: 0.95rem;
        }

        /* Date Filter Bar */
        .ocs-filter-bar {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 16px 24px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .ocs-filter-label {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .ocs-filter-label svg {
          color: #6366f1;
        }

        .ocs-select {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          padding: 8px 16px;
          color: #e2e8f0;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ocs-select:hover {
          border-color: #6366f1;
          background: rgba(99,102,241,0.1);
        }

        .ocs-select:focus {
          outline: none;
          border-color: #6366f1;
        }

        /* Summary Cards */
        .ocs-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .ocs-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 22px 24px;
          backdrop-filter: blur(12px);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .ocs-card:hover {
          transform: translateY(-2px);
          border-color: rgba(99,102,241,0.3);
        }

        .ocs-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          margin-bottom: 14px;
        }

        .icon-purple { background: rgba(99,102,241,0.2); color: #818cf8; }
        .icon-green  { background: rgba(16,185,129,0.2); color: #34d399; }
        .icon-amber  { background: rgba(245,158,11,0.2); color: #fbbf24; }
        .icon-blue   { background: rgba(59,130,246,0.2); color: #60a5fa; }

        .ocs-card-value {
          font-family: 'Syne', sans-serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 4px;
        }
        .ocs-card-label {
          font-size: 0.8rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* Send Commission Section */
        .ocs-section {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 28px 32px;
          margin-bottom: 28px;
          backdrop-filter: blur(12px);
        }

        .ocs-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ocs-section-title span.dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #10b981);
        }

        .ocs-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s ease, transform 0.15s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .ocs-toggle-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .ocs-toggle-btn.active {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: #c4b5fd;
        }

        /* QR Panel */
        .ocs-qr-panel {
          margin-top: 24px;
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          animation: fadeUp 0.3s ease;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ocs-qr-card {
          flex: 1;
          min-width: 200px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          transition: border-color 0.2s ease;
        }
        .ocs-qr-card:hover { border-color: rgba(99,102,241,0.4); }

        .ocs-qr-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 0.8rem;
          color: #a5b4fc;
          font-weight: 600;
        }

        .ocs-qr-img {
          width: 140px;
          height: 140px;
          border-radius: 12px;
          object-fit: cover;
          border: 2px solid rgba(255,255,255,0.08);
        }

        .ocs-qr-label {
          font-size: 0.85rem;
          color: #94a3b8;
          text-align: center;
        }

        /* Commission History Table */
        .ocs-table-wrap {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.07);
        }

        table.ocs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .ocs-table thead tr {
          background: rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .ocs-table th {
          text-align: left;
          padding: 14px 20px;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748b;
          font-weight: 600;
        }

        .ocs-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s ease;
        }
        .ocs-table tbody tr:last-child { border-bottom: none; }
        .ocs-table tbody tr:hover { background: rgba(255,255,255,0.03); }

        .ocs-table td {
          padding: 14px 20px;
          color: #cbd5e1;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .status-paid    { background: rgba(16,185,129,0.15); color: #34d399; }
        .status-pending { background: rgba(245,158,11,0.15); color: #fbbf24; }

        .ocs-empty {
          text-align: center;
          padding: 48px 20px;
          color: #475569;
        }
        .ocs-empty svg { font-size: 2.5rem; margin-bottom: 12px; }

        .ocs-spinner {
          display: flex;
          justify-content: center;
          padding: 40px;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(99,102,241,0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .hotel-name {
          font-weight: 500;
          color: #a5b4fc;
        }
      `}</style>

      <div className="ocs-root">
        <div className="ocs-inner">

          {/* Header */}
          <div className="ocs-header">
            <h1>Commission Management</h1>
            <p>Manage your commission payments and track revenue history from admin records.</p>
          </div>

          {/* Date Filter Bar */}
          <div className="ocs-filter-bar">
            <div className="ocs-filter-label">
              <FaCalendarAlt />
              <span>Filter by Period:</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                className="ocs-select"
              >
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)} 
                className="ocs-select"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="ocs-summary">
            <div className="ocs-card">
              <div className="ocs-card-icon icon-purple"><FaCoins /></div>
              <div className="ocs-card-value">{commissions.length}</div>
              <div className="ocs-card-label">Total Records</div>
            </div>
            <div className="ocs-card">
              <div className="ocs-card-icon icon-green"><FaCheckCircle /></div>
              <div className="ocs-card-value">{formatNPR(totalPaid)}</div>
              <div className="ocs-card-label">Total Paid</div>
            </div>
            <div className="ocs-card">
              <div className="ocs-card-icon icon-amber"><FaClock /></div>
              <div className="ocs-card-value">{formatNPR(totalPending)}</div>
              <div className="ocs-card-label">Pending</div>
            </div>
            <div className="ocs-card">
              <div className="ocs-card-icon icon-blue"><FaChartLine /></div>
              <div className="ocs-card-value">{commissions.filter(c => c.status === 'Paid').length}</div>
              <div className="ocs-card-label">Paid Entries</div>
            </div>
          </div>

          {/* Send Commission */}
          <div className="ocs-section">
            <div className="ocs-section-title">
              <span className="dot" />
              Send Commission Payment
            </div>

            <button
              className={`ocs-toggle-btn ${showSend ? "active" : ""}`}
              onClick={() => setShowSend(!showSend)}
            >
              <FaQrcode />
              {showSend ? "Hide QR Codes" : "Show Payment QR Codes"}
            </button>

            {showSend && (
              <div className="ocs-qr-panel">
                <div className="ocs-qr-card">
                  <div className="ocs-qr-badge">
                    <FaUniversity /> Bank Transfer
                  </div>
                  <img src="/bank.png" alt="Bank QR" className="ocs-qr-img" />
                  <div className="ocs-qr-label">Scan to pay via Bank</div>
                </div>
                <div className="ocs-qr-card">
                  <div className="ocs-qr-badge">
                    <FaWallet /> Khalti Wallet
                  </div>
                  <img src="/khalti.png" alt="Khalti QR" className="ocs-qr-img" />
                  <div className="ocs-qr-label">Scan to pay via Khalti</div>
                </div>
              </div>
            )}
          </div>

          {/* Commission History - Renamed from Track Revenue */}
          <div className="ocs-section">
            <div className="ocs-section-title">
              <span className="dot" />
              Commission History
            </div>

            {loadingCommissions ? (
              <div className="ocs-spinner"><div className="spinner" /></div>
            ) : commissions.length === 0 ? (
              <div className="ocs-empty">
                <FaChartLine style={{ fontSize: "2.5rem", marginBottom: "12px", display: "block", margin: "0 auto 12px" }} />
                <p>No commission records found for {selectedMonth} {selectedYear}.</p>
              </div>
            ) : (
              <div className="ocs-table-wrap">
                <table className="ocs-table">
                  <thead>
                    <tr>
                      <th>Hotel ID</th>
                      <th>Hotel Name</th>
                      <th>Date</th>
                      <th>Commission Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c) => (
                      <tr key={c.id}>
                        <td>{c.hotel_id || c.id}</td>
                        <td className="hotel-name">{c.hotel_name || 'N/A'}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <FaCalendarAlt style={{ color: "#6366f1", fontSize: "0.8rem" }} />
                            {c.date}
                          </div>
                        </td>
                        <td>
                          <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{formatNPR(c.rate)}</span>
                        </td>
                        <td>
                          <span className={`status-pill ${c.status === "Paid" ? "status-paid" : "status-pending"}`}>
                            {c.status === "Paid" ? <FaCheckCircle /> : <FaClock />}
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default OwnerCommissionSetting;

