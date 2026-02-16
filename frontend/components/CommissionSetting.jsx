'use client';
import { useState, useEffect } from 'react';
import { FaChartLine, FaMoneyCheckAlt, FaBookOpen } from 'react-icons/fa';

export default function CommissionSetting() {
  const [showRevenueTable, setShowRevenueTable] = useState(false);
  const [showPaymentTable, setShowPaymentTable] = useState(false);
  const [showRulesTable, setShowRulesTable] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rules, setRules] = useState([]);
  const [payments, setPayments] = useState([]);

  const [revenueData, setRevenueData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('Dec');
  const [selectedYear, setSelectedYear] = useState('2025');

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




  // Fetch comission revenew report 
  useEffect(() => {
  const fetchRevenue = async () => {
    try {
      let url = 'http://localhost:8000/api/commission-revenue/';

      // Convert month name to padded number (e.g. "Dec" → "12")
      const monthNumber = new Date(`${selectedMonth} 1, ${selectedYear}`).getMonth() + 1;
      const paddedMonth = monthNumber.toString().padStart(2, '0');

      url += `?month=${paddedMonth}&year=${selectedYear}`;

      const res = await fetch(url);
      const data = await res.json();
      setRevenueData(data);
    } catch (err) {
      console.error('Error fetching commission revenue:', err);
    }
  };

  if (showRevenueTable) {
    fetchRevenue();
  }
}, [selectedMonth, selectedYear, showRevenueTable]);




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

      //  Show alert if some hotels already had 2 entries
      if (response.already_full && response.already_full.length > 0) {
        alert(`Commission payment data already saved twice for: ${response.already_full.join(", ")}`);
      } else {
        alert(response.message);
      }

      // Reset UI: status → Pending, action → Mark Paid
      const reset = payments.map(p => ({
        ...p,
        status: 'Pending',
        action: 'Paid',
      }));
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
  const handleRevenueOverview = () => {
    setShowRevenueTable(!showRevenueTable);
    setShowPaymentTable(false);
    setShowRulesTable(false);
  };

  const handleTrackPayment = () => {
    setShowPaymentTable(!showPaymentTable);
    setShowRevenueTable(false);
    setShowRulesTable(false);
  };

  const handleViewRules = () => {
    setShowRulesTable(!showRulesTable);
    setShowRevenueTable(false);
    setShowPaymentTable(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-10 py-16">
      <h1 className="text-4xl font-bold text-center mb-12">Commission Setting</h1>

      <div className="flex justify-center gap-6 mb-12">
        <button onClick={handleRevenueOverview} className="flex items-center gap-3 px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 transition shadow-lg">
          <FaChartLine className="text-xl" />
          <span className="font-semibold whitespace-nowrap">Track Commission Revenue</span>
        </button>
        <button onClick={handleTrackPayment} className="flex items-center gap-3 px-6 py-4 rounded-xl bg-green-600 hover:bg-green-700 transition shadow-lg">
          <FaMoneyCheckAlt className="text-xl" />
          <span className="font-semibold whitespace-nowrap">Confirm Commission Payments</span>
        </button>
        <button onClick={handleViewRules} className="flex items-center gap-3 px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 transition shadow-lg">
          <FaBookOpen className="text-xl" />
          <span className="font-semibold whitespace-nowrap">View Commission Rules</span>
        </button>
      </div>


       {/* Track Revenue Table */}
      {showRevenueTable && (
        <div className="max-w-4xl mx-auto bg-white text-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Track Commission Revenue</h2>

          {/* Month and Year Dropdowns */}
          <div className="flex justify-end items-center gap-4 mb-4">
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="px-4 py-2 rounded bg-gray-100 text-gray-800">
              {Array.from({ length: 10 }, (_, i) => 2025 + i).map((year) => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-4 py-2 rounded bg-gray-100 text-gray-800">
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="px-4 py-2">Hotel ID</th>
                <th className="px-4 py-2">Hotel Name</th>
                <th className="px-4 py-2">Commission Revenue</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {revenueData.map((item) => (
                <tr key={item.payment_id} className="border-t">
                  <td className="px-4 py-2">{item.payment_id}</td>
                  <td className="px-4 py-2">{item.hotel_name}</td>
                  <td className="px-4 py-2">NPR {item.amount}</td>
                  <td className="px-4 py-2">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}




      {/* Payment Table */}
      {showPaymentTable && (
        <div className="max-w-4xl mx-auto bg-white text-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Confirm Commission Payments</h2>

          {/* Month and Year Dropdowns */}
          <div className="flex justify-end items-center gap-4 mb-4">
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="px-4 py-2 rounded bg-gray-100 text-gray-800">
              {Array.from({ length: 10 }, (_, i) => 2025 + i).map((year) => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-4 py-2 rounded bg-gray-100 text-gray-800">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="px-4 py-2">Payment ID</th>
                <th className="px-4 py-2">Hotel Name</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Start/Due Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, idx) => (
                <tr key={payment.id} className="border-t">
                  <td className="px-4 py-2">{payment.id}</td>
                  <td className="px-4 py-2">{payment.hotel}</td>
                  <td className="px-4 py-2">{payment.amount}</td>
                                    <td
                    className={`px-4 py-2 font-semibold ${
                      payment.status === 'Paid'
                        ? 'text-green-600'
                        : payment.status === 'Pending'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {payment.status}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => {
                        const updated = [...payments];
                        // Toggle both status and action together
                        if (updated[idx].status === 'Pending') {
                          updated[idx].status = 'Paid';
                          updated[idx].action = 'Pending';
                        } else {
                          updated[idx].status = 'Pending';
                          updated[idx].action = 'Paid';
                        }
                        setPayments(updated);
                      }}
                      className={`px-3 py-1 rounded text-white ${
                        payment.status === 'Paid'
                          ? 'bg-yellow-500 hover:bg-yellow-600'
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {payment.action}
                    </button>
                  </td>
                  <td className="px-4 py-2">{payment.start_due_date}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="6" className="px-4 py-4 text-right">
                  <button
                    onClick={handleConfirmPayments}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition"
                  >
                    Confirm All Payments
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    

      {/* Show Rules Table */}
      {showRulesTable && (
        <div className="max-w-4xl mx-auto bg-white text-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Commission Rules</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Rules'}
            </button>
          </div>

          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="px-4 py-2">Rule ID</th>
                <th className="px-4 py-2">Rule Name</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Effective Date</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, idx) => (
                <tr key={rule.id} className="border-t">
                  <td className="px-4 py-2">{rule.id}</td>
                  <td className="px-4 py-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) => {
                          const newRules = [...rules];
                          newRules[idx].name = e.target.value;
                          setRules(newRules);
                        }}
                        className="border px-2 py-1 rounded w-full"
                      />
                    ) : (
                      rule.name
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={rule.desc}
                        onChange={(e) => {
                          const newRules = [...rules];
                          newRules[idx].desc = e.target.value;
                          setRules(newRules);
                        }}
                        className="border px-2 py-1 rounded w-full"
                      />
                    ) : (
                      rule.desc
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {isEditing ? (
                      <input
                        type="date"
                        value={rule.date}
                        onChange={(e) => {
                          const newRules = [...rules];
                          newRules[idx].date = e.target.value;
                          setRules(newRules);
                        }}
                        className="border px-2 py-1 rounded"
                      />
                    ) : (
                      rule.date
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {isEditing && (
            <div className="flex justify-end mt-6">
              <button
                onClick={handleSaveRules}
                className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Save Rules
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
