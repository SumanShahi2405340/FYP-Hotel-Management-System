'use client';
import { useState, useEffect } from 'react';
import { FaMoneyCheckAlt, FaBookOpen, FaEdit, FaSave, FaTimes, FaChartLine, FaCheckCircle, FaClock, FaCoins, FaCalendarAlt } from 'react-icons/fa';

export default function CommissionSetting() {
  const [showPaymentTable, setShowPaymentTable] = useState(false);
  const [showRulesTable, setShowRulesTable] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rules, setRules] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showHistoryTable, setShowHistoryTable] = useState(false);
  const [commissions, setCommissions] = useState([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState('Dec');
  const [selectedYear, setSelectedYear] = useState('2025');

  const getMoneyValue = (item) => {
    const raw =
      item?.amount ??
      item?.rate ??
      item?.commission_amount ??
      item?.commission ??
      item?.total_amount ??
      item?.payment_amount ??
      0;

    if (typeof raw === 'number') return raw;

    const cleaned = String(raw)
      .replace(/Rs\.?/gi, '')
      .replace(/NPR/gi, '')
      .replace(/,/g, '')
      .trim();

    const parsed = Number(cleaned);

    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatMoney = (value) => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return 'Rs 0';
    }

    return 'Rs ' + amount.toLocaleString();
  };


  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('access') || localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    return headers;
  };

  const fetchCommissionHistory = async () => {
    setLoadingCommissions(true);
    try {
      const monthNumber = new Date(`${selectedMonth} 1, ${selectedYear}`).getMonth() + 1;
      const paddedMonth = monthNumber.toString().padStart(2, '0');
      const res = await fetch(
        `http://localhost:8000/api/commission-revenue/?month=${paddedMonth}&year=${selectedYear}`,
        { method: 'GET', headers: getAuthHeaders() }
      );
      const data = await res.json();
      const formatted = Array.isArray(data)
        ? data.map((item) => ({
            id: item.payment_id || item.id,
            hotel_id: item.hotel_id || item.payment_id || item.id,
            hotel_name: item.hotel_name || 'N/A',
            date: `${selectedYear}-${paddedMonth}-01`,
            amount: getMoneyValue(item),
            status: item.status || 'Pending',
          }))
        : [];
      setCommissions(formatted);
    } catch (err) {
      console.error('Error fetching commission history:', err);
      setCommissions([]);
    } finally {
      setLoadingCommissions(false);
    }
  };

  const defaultRules = [
    {
      id: 'RL001',
      name: 'Standard Commission',
      desc: 'Applies Rs 8000 commission to all hotels using our services.',
      date: '2025-01-01',
    },
    {
      id: 'RL002',
      name: 'High-Value Bonus',
      desc: 'Applies Rs 5000 commission to all hotels using our services for more than 2 years.',
      date: '2025-06-01',
    },
    {
      id: 'RL003',
      name: 'Late Payment Penalty',
      desc: 'Add extra 10% penalty commission if payment is delayed beyond 10 days',
      date: '2025-09-01',
    },
  ];

  // Fetch active hotels for payments
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/commission-payments/active-hotels/');
        const data = await res.json();
        const monthNumber = new Date(`${selectedMonth} 1, ${selectedYear}`).getMonth() + 1;
        const paddedMonth = monthNumber.toString().padStart(2, '0');
        const startDue = `${selectedYear}-${paddedMonth}-15/25`;
        const formatted = data.map(p => ({
          ...p,
          start_due_date: startDue,
          status: p.status || 'Pending',
          action: p.status === 'Pending' ? 'Paid' : 'Pending',
        }));
        setPayments(formatted);
      } catch (err) {
        console.error('Error fetching payments:', err);
      }
    };
    fetchPayments();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (showHistoryTable) fetchCommissionHistory();
  }, [selectedMonth, selectedYear, showHistoryTable]);

  const totalPaid = commissions
    .filter(c => c.status === 'Paid')
    .reduce((sum, c) => sum + getMoneyValue(c), 0);

  const totalPending = commissions
    .filter(c => c.status === 'Pending')
    .reduce((sum, c) => sum + getMoneyValue(c), 0);

  // Confirm all payments
  const handleConfirmPayments = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/commission-payments/confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payments),
      });
      if (res.ok) {
        const response = await res.json();
        if (response.already_full && response.already_full.length > 0) {
          alert(`Commission payment data already saved twice for: ${response.already_full.join(", ")}`);
        } else {
          alert(response.message);
        }
        const reset = payments.map(p => ({ ...p, status: 'Pending', action: 'Paid' }));
        setPayments(reset);
      } else {
        alert('Error confirming payments');
      }
    } catch (err) {
      console.error('Error confirming payments:', err);
    }
  };

  // Fetch commission rules
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/commission-rules/');
        if (response.ok) {
          const data = await response.json();
          if (data.length === 0) {
            await fetch('http://localhost:8000/api/commission-rules/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(defaultRules),
            });
            setRules(defaultRules);
          } else {
            const formatted = data.map(rule => ({
              id: rule.rule_id,
              name: rule.name,
              desc: rule.description,
              date: rule.effective_date,
            }));
            setRules(formatted);
          }
        }
      } catch (error) {
        console.error('Error fetching rules:', error);
      }
    };
    fetchRules();
  }, []);

  // Save rules
  const handleSaveRules = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/commission-rules/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules),
      });
      if (response.ok) {
        alert('Rules saved to DB');
        setIsEditing(false);
        const updated = await fetch('http://localhost:8000/api/commission-rules/');
        const data = await updated.json();
        const formatted = data.map(rule => ({
          id: rule.rule_id,
          name: rule.name,
          desc: rule.description,
          date: rule.effective_date,
        }));
        setRules(formatted);
      } else {
        alert('Failed to save rules');
      }
    } catch (error) {
      console.error('Error saving rules:', error);
      alert('Error saving rules');
    }
  };

  // Toggle tables
  const handleTrackPayment = () => {
    setShowPaymentTable(!showPaymentTable);
    setShowRulesTable(false);
    setShowHistoryTable(false);
  };

  const handleViewHistory = () => {
    const nextState = !showHistoryTable;
    setShowHistoryTable(nextState);
    setShowPaymentTable(false);
    setShowRulesTable(false);
    if (nextState) fetchCommissionHistory();
  };

  const handleViewRules = () => {
    setShowRulesTable(!showRulesTable);
    setShowPaymentTable(false);
    setShowHistoryTable(false);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
        :root {
          --gold: #C9A84C;
          --gold-light: #E8C97A;
          --gold-dim: rgba(201,168,76,0.18);
          --gold-border: rgba(201,168,76,0.35);
          --dark: #0D0D0D;
          --card-bg: rgba(10,10,10,0.72);
          --card-border: rgba(201,168,76,0.22);
          --text-primary: #F5EDD6;
          --text-muted: rgba(245,237,214,0.5);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Montserrat', sans-serif; background: var(--dark); color: var(--text-primary); }
        .serif { font-family: 'Cormorant Garamond', serif; }
        .lux-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          backdrop-filter: blur(20px);
          transition: border-color 0.4s ease, box-shadow 0.4s ease;
        }
        .lux-card:hover {
          border-color: rgba(201,168,76,0.55);
          box-shadow: 0 0 30px -6px rgba(201,168,76,0.25);
        }
        .gold-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold-border), transparent);
          margin: 20px 0;
        }
        .lux-table th {
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--gold);
          font-weight: 600;
          padding: 12px 16px;
          border-bottom: 1px solid var(--gold-border);
        }
        .lux-table td {
          padding: 12px 16px;
          font-size: 13px;
          color: var(--text-muted);
          border-bottom: 1px solid rgba(201,168,76,0.08);
        }
        .lux-table tr:hover td {
          color: var(--text-primary);
          background: var(--gold-dim);
        }
        .select-lux {
          background: var(--card-bg);
          border: 1px solid var(--gold-border);
          color: var(--text-primary);
          padding: 6px 24px 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23C9A84C' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 14px;
        }
        .select-lux:focus { outline: none; border-color: var(--gold); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }

        .history-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .history-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 22px 24px; backdrop-filter: blur(12px); transition: transform 0.2s ease, border-color 0.2s ease; }
        .history-card:hover { transform: translateY(-2px); border-color: rgba(201,168,76,0.45); }
        .history-card-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.05rem; margin-bottom: 12px; }
        .icon-purple { background: rgba(139,92,246,0.22); color: #c4b5fd; }
        .icon-green { background: rgba(16,185,129,0.20); color: #34d399; }
        .icon-amber { background: rgba(245,158,11,0.20); color: #fbbf24; }
        .icon-blue { background: rgba(59,130,246,0.20); color: #60a5fa; }
        .history-card-value { font-family: 'Cormorant Garamond', serif; font-size: 1.7rem; font-weight: 600; color: #fff; margin-bottom: 4px; }
        .history-card-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
        .status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
        .status-paid { background: rgba(16,185,129,0.15); color: #34d399; }
        .status-pending { background: rgba(245,158,11,0.15); color: #fbbf24; }
        .history-empty { text-align: center; padding: 48px 20px; color: var(--text-muted); }
        .history-spinner { display: flex; justify-content: center; padding: 40px; }
        .spinner { width: 32px; height: 32px; border: 3px solid rgba(201,168,76,0.25); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="relative min-h-screen bg-black overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800&auto=format')",
              filter: 'brightness(0.45) saturate(0.9)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-gray-900/40 to-black/50" />
        </div>

        <div className="relative z-10 px-6 md:px-12 py-16">
          <div className="max-w-6xl mx-auto">

            {/* Page Header */}
            <div className="text-center mb-12 fade-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border" style={{ background: 'var(--gold-dim)', borderColor: 'var(--gold-border)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)' }} />
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--gold-light)' }}>Commission Management</span>
              </div>
              <h1 className="serif text-5xl md:text-6xl font-light text-white mt-6 mb-4">Commission Setting</h1>
              <div className="gold-divider w-24 mx-auto" />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-5 mb-16 fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
              <button
                onClick={handleTrackPayment}
                className="flex items-center gap-3 px-6 py-3 rounded-full text-white transition-all shadow-lg hover:scale-105"
                style={{ background: showPaymentTable ? '#059669' : 'rgba(16,185,129,0.75)' }}
              >
                <FaMoneyCheckAlt size={18} />
                <span className="font-semibold">Confirm Commission Payments</span>
              </button>

              <button
                onClick={handleViewHistory}
                className="flex items-center gap-3 px-6 py-3 rounded-full text-white transition-all shadow-lg hover:scale-105"
                style={{ background: showHistoryTable ? '#2563EB' : 'rgba(37,99,235,0.78)' }}
              >
                <FaChartLine size={18} />
                <span className="font-semibold">View Commission History</span>
              </button>

              <button
                onClick={handleViewRules}
                className="flex items-center gap-3 px-6 py-3 rounded-full text-white transition-all shadow-lg hover:scale-105"
                style={{ background: showRulesTable ? '#7C3AED' : 'rgba(139,92,246,0.75)' }}
              >
                <FaBookOpen size={18} />
                <span className="font-semibold">View Commission Rules</span>
              </button>
            </div>

            {/* Payment Table */}
            {showPaymentTable && (
              <div className="lux-card rounded-2xl p-6 mb-8 fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                <div className="flex flex-wrap justify-between items-center mb-6">
                  <h2 className="serif text-2xl font-light text-white">Confirm Commission Payments</h2>
                  <div className="flex gap-3">
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="select-lux">
                      {Array.from({ length: 10 }, (_, i) => 2025 + i).map(y => <option key={y}>{y}</option>)}
                    </select>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="select-lux">
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="lux-table w-full">
                    <thead>
                      <tr>
                        <th>Payment ID</th>
                        <th>Hotel Name</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                        <th>Start/Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment, idx) => (
                        <tr key={payment.id}>
                          <td>{payment.id}</td>
                          <td>{payment.hotel}</td>
                          <td><span style={{ color: 'var(--gold-light)' }}>{formatMoney(getMoneyValue(payment))}</span></td>
                          <td>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>{payment.status}</span>
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                const updated = [...payments];
                                if (updated[idx].status === 'Pending') {
                                  updated[idx].status = 'Paid';
                                  updated[idx].action = 'Pending';
                                } else {
                                  updated[idx].status = 'Pending';
                                  updated[idx].action = 'Paid';
                                }
                                setPayments(updated);
                              }}
                              className={`px-3 py-1 rounded-md text-xs font-medium transition text-white ${
                                payment.status === 'Paid'
                                  ? 'bg-yellow-500/80 hover:bg-yellow-600'
                                  : 'bg-green-500/80 hover:bg-green-600'
                              }`}
                            >
                              {payment.action}
                            </button>
                          </td>
                          <td>{payment.start_due_date}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="6" className="pt-6 text-right">
                          <button
                            onClick={handleConfirmPayments}
                            className="px-6 py-2 rounded-lg text-white font-semibold transition shadow-lg"
                            style={{ background: 'rgba(99,102,241,0.8)' }}
                          >
                            Confirm All Payments
                          </button>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}


            {/* Commission History */}
            {showHistoryTable && (
              <div className="lux-card rounded-2xl p-6 mb-8 fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                <div className="flex flex-wrap justify-between items-center mb-6">
                  <h2 className="serif text-2xl font-light text-white">Commission History</h2>
                  <div className="flex gap-3">
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="select-lux">
                      {Array.from({ length: 10 }, (_, i) => 2025 + i).map(y => <option key={y}>{y}</option>)}
                    </select>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="select-lux">
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="history-summary">
                  <div className="history-card"><div className="history-card-icon icon-purple"><FaCoins /></div><div className="history-card-value">{commissions.length}</div><div className="history-card-label">Total Records</div></div>
                  <div className="history-card"><div className="history-card-icon icon-green"><FaCheckCircle /></div><div className="history-card-value">{formatMoney(totalPaid)}</div><div className="history-card-label">Total Paid</div></div>
                  <div className="history-card"><div className="history-card-icon icon-amber"><FaClock /></div><div className="history-card-value">{formatMoney(totalPending)}</div><div className="history-card-label">Pending</div></div>
                  <div className="history-card"><div className="history-card-icon icon-blue"><FaChartLine /></div><div className="history-card-value">{commissions.filter(c => c.status === 'Paid').length}</div><div className="history-card-label">Paid Entries</div></div>
                </div>

                {loadingCommissions ? (
                  <div className="history-spinner"><div className="spinner" /></div>
                ) : commissions.length === 0 ? (
                  <div className="history-empty">
                    <FaChartLine style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
                    <p>No commission records found for {selectedMonth} {selectedYear}.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="lux-table w-full">
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
                            <td><span style={{ color: 'var(--gold-light)', fontWeight: 500 }}>{c.hotel_name || 'N/A'}</span></td>
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCalendarAlt style={{ color: 'var(--gold)', fontSize: '0.8rem' }} />{c.date}</div></td>
                            <td><span style={{ color: '#fff', fontWeight: 600 }}>{formatMoney(getMoneyValue(c))}</span></td>
                            <td><span className={`status-pill ${c.status === 'Paid' ? 'status-paid' : 'status-pending'}`}>{c.status === 'Paid' ? <FaCheckCircle /> : <FaClock />}{c.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Rules Table */}
            {showRulesTable && (
              <div className="lux-card rounded-2xl p-6 fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                <div className="flex flex-wrap justify-between items-center mb-6">
                  <h2 className="serif text-2xl font-light text-white">Commission Rules</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition"
                    style={{ background: 'rgba(59,130,246,0.8)' }}
                  >
                    {isEditing ? <FaTimes size={14} /> : <FaEdit size={14} />}
                    {isEditing ? 'Cancel' : 'Edit Rules'}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="lux-table w-full">
                    <thead>
                      <tr>
                        <th>Rule ID</th>
                        <th>Rule Name</th>
                        <th>Description</th>
                        <th>Effective Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule, idx) => (
                        <tr key={rule.id}>
                          <td>{rule.id}</td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={rule.name}
                                onChange={(e) => {
                                  const newRules = [...rules];
                                  newRules[idx].name = e.target.value;
                                  setRules(newRules);
                                }}
                                className="bg-black/40 border rounded px-2 py-1 w-full text-white"
                                style={{ borderColor: 'var(--gold-border)' }}
                              />
                            ) : rule.name}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={rule.desc}
                                onChange={(e) => {
                                  const newRules = [...rules];
                                  newRules[idx].desc = e.target.value;
                                  setRules(newRules);
                                }}
                                className="bg-black/40 border rounded px-2 py-1 w-full text-white"
                                style={{ borderColor: 'var(--gold-border)' }}
                              />
                            ) : rule.desc}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="date"
                                value={rule.date}
                                onChange={(e) => {
                                  const newRules = [...rules];
                                  newRules[idx].date = e.target.value;
                                  setRules(newRules);
                                }}
                                className="bg-black/40 border rounded px-2 py-1 text-white"
                                style={{ borderColor: 'var(--gold-border)' }}
                              />
                            ) : rule.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {isEditing && (
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleSaveRules}
                      className="flex items-center gap-2 px-6 py-2 rounded-lg text-white transition"
                      style={{ background: 'rgba(16,185,129,0.8)' }}
                    >
                      <FaSave size={14} />
                      Save Rules
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}