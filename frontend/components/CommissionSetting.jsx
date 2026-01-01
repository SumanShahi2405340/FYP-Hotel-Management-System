'use client';
import { useState } from 'react';
import { FaChartLine, FaMoneyCheckAlt, FaBookOpen } from 'react-icons/fa';

export default function CommissionSetting() {
  const [showRevenueTable, setShowRevenueTable] = useState(false);
  const [showPaymentTable, setShowPaymentTable] = useState(false);
  const [showRulesTable, setShowRulesTable] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [rules, setRules] = useState([
    {
      id: 'RL001',
      name: 'Standard Commission',
      desc: 'Applies 10% commission to all bookings under NPR 20,000',
      date: '2025-01-01',
    },
    {
      id: 'RL002',
      name: 'High-Value Bonus',
      desc: 'Adds 5% bonus for bookings above NPR 30,000',
      date: '2025-06-01',
    },
    {
      id: 'RL003',
      name: 'Late Payment Penalty',
      desc: 'Deducts 2% from commission if payment is delayed beyond 30 days',
      date: '2025-09-01',
    },
  ]);

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

  const handleSaveRules = () => {
    alert('Rules saved to DB (dummy)');
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-10 py-16">
      {/* Title */}
      <h1 className="text-4xl font-bold text-center mb-12">Commission Setting</h1>

      {/* Button Group */}
      <div className="flex justify-center gap-6 mb-12">
        <button
          onClick={handleRevenueOverview}
          className="flex items-center gap-3 px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 transition shadow-lg"
        >
          <FaChartLine className="text-xl" />
          <span className="font-semibold whitespace-nowrap">Commission Revenue Overview</span>
        </button>
        <button
          onClick={handleTrackPayment}
          className="flex items-center gap-3 px-6 py-4 rounded-xl bg-green-600 hover:bg-green-700 transition shadow-lg"
        >
          <FaMoneyCheckAlt className="text-xl" />
          <span className="font-semibold whitespace-nowrap">Track Commission Payment</span>
        </button>
        <button
          onClick={handleViewRules}
          className="flex items-center gap-3 px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 transition shadow-lg"
        >
          <FaBookOpen className="text-xl" />
          <span className="font-semibold whitespace-nowrap">View Commission Rules</span>
        </button>
      </div>

      {/* Revenue Table */}
      {showRevenueTable && (
        <div className="max-w-4xl mx-auto bg-white text-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Commission Revenue Overview</h2>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="px-4 py-2">Hotel ID</th>
                <th className="px-4 py-2">Hotel Name</th>
                <th className="px-4 py-2">Commission %</th>
                <th className="px-4 py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-2">HT-101</td>
                <td className="px-4 py-2">Hotel Everest</td>
                <td className="px-4 py-2">12%</td>
                <td className="px-4 py-2">NPR 18,000</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2">HT-102</td>
                <td className="px-4 py-2">Mountain View Inn</td>
                <td className="px-4 py-2">10%</td>
                <td className="px-4 py-2">NPR 12,500</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2">HT-103</td>
                <td className="px-4 py-2">Lumbini Palace</td>
                <td className="px-4 py-2">15%</td>
                <td className="px-4 py-2">NPR 22,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Table */}
      {showPaymentTable && (
        <div className="max-w-4xl mx-auto bg-white text-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Track Commission Payment</h2>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="px-4 py-2">Payment ID</th>
                <th className="px-4 py-2">Hotel</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-2">PMT001</td>
                <td className="px-4 py-2">Hotel Everest</td>
                <td className="px-4 py-2">NPR 18,000</td>
                <td className="px-4 py-2 text-green-600 font-semibold">Paid</td>
                <td className="px-4 py-2">2025-12-01</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2">PMT002</td>
                <td className="px-4 py-2">Mountain View Inn</td>
                <td className="px-4 py-2">NPR 12,500</td>
                <td className="px-4 py-2 text-yellow-600 font-semibold">Pending</td>
                <td className="px-4 py-2">2025-12-15</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2">PMT003</td>
                <td className="px-4 py-2">Lumbini Palace</td>
                <td className="px-4 py-2">NPR 22,000</td>
                <td className="px-4 py-2 text-red-600 font-semibold">Failed</td>
                <td className="px-4 py-2">2025-12-20</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Rules Table */}
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

          {/* Save Button */}
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
