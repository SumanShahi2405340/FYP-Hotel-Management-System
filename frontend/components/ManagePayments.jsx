'use client';
import React, { useState, useEffect } from "react";
import api from "@/utils/api";


const handlePay = () => {
  // Example: redirect to Citizens Bank payment page or call your backend
  console.log("Initiating payment for:", calculateTotal());

  // If Citizens Bank provides an API endpoint:
  // api.post("/citizens-bank/payment", { amount: calculateTotal() })
  //   .then(res => { ... })
  //   .catch(err => console.error(err));
};


const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
};

const calculateRoomPrice = (room, days, prices) => {
  if (!prices || !days) return "";
  const d = Number(days);
  if (room.toLowerCase().includes("normal")) {
    return `${prices.normal_price} * ${d} = ${d * prices.normal_price}`;
  }
  if (room.toLowerCase().includes("deluxe")) {
    return `${prices.deluxe_price} * ${d} = ${d * prices.deluxe_price}`;
  }
  if (room.toLowerCase().includes("suite")) {
    return `${prices.suite_price} * ${d} = ${d * prices.suite_price}`;
  }
  return "";
};

export default function PaymentsPage() {
  const [bills, setBills] = useState([]);
  const [adjustmentsList, setAdjustmentsList] = useState([]);
  const [prices, setPrices] = useState(null);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [adjustment, setAdjustment] = useState({
    customername: "",
    service: "",
    description: "",
    amount: "",
    date: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookRes, priceRes, adjRes] = await Promise.all([
          api.get("/api/manage-bookings/"),
          api.get("/api/room-price/"),
          api.get("/api/manage-payments/")
        ]);
        setBills(bookRes.data);
        setPrices(priceRes.data);
        setAdjustmentsList(adjRes.data);
      } catch (err) {
        console.error("Error fetching payments", err);
      }
    };
    fetchData();
  }, []);

  const handleAdjustment = async () => {
    try {
      await api.post("/api/manage-payments/", adjustment);
      setAdjustment({ customername:"", service: "", description: "", amount: "", date: "" });
      const adjRes = await api.get("/api/manage-payments/");
      setAdjustmentsList(adjRes.data);
    } catch (err) {
      console.error("Error applying adjustment", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/manage-payments/${id}/`);
      setAdjustmentsList(adjustmentsList.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Error deleting", err);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setEditData({ ...row });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (id) => {
    try {
      await api.put(`/api/manage-payments/${id}/`, editData);
      setAdjustmentsList(adjustmentsList.map((a) => (a.id === id ? editData : a)));
      setEditingId(null);
      setEditData({});
    } catch (err) {
      console.error("Error saving changes", err);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    bills.forEach((bill) => {
      if (prices) {
        if (bill.room.toLowerCase().includes("normal")) {
          total += bill.days * prices.normal_price;
        } else if (bill.room.toLowerCase().includes("deluxe")) {
          total += bill.days * prices.deluxe_price;
        } else if (bill.room.toLowerCase().includes("suite")) {
          total += bill.days * prices.suite_price;
        }
      }
    });
    adjustmentsList.forEach((adj) => {
      total += parseFloat(adj.amount);
    });
    return total.toFixed(2);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">Manage Payments</h2>

      {/* Add Services & Charges toggle */}
      <button
        onClick={() => setShowAdjustments(!showAdjustments)}
        className="px-4 py-2 mb-6 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
      >
        {showAdjustments ? "Add Services & Charges" : "Add Services & Charges"}
      </button>

      {/* Adjustments form */}
      {showAdjustments && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-inner">
          <div className="flex flex-wrap gap-3 mb-4">
            <input type="text" placeholder="Customer Name"
              value={adjustment.customername}
              onChange={(e) => setAdjustment({ ...adjustment, customername: e.target.value })}
              className="border px-3 py-2 rounded text-sm flex-1" />
            <input type="datetime-local"
              value={adjustment.date}
              onChange={(e) => setAdjustment({ ...adjustment, date: e.target.value })}
              className="border px-3 py-2 rounded text-sm flex-1" />
            <input type="text" placeholder="Service"
              value={adjustment.service}
              onChange={(e) => setAdjustment({ ...adjustment, service: e.target.value })}
              className="border px-3 py-2 rounded text-sm flex-1" />
            <input type="text" placeholder="Description"
              value={adjustment.description}
              onChange={(e) => setAdjustment({ ...adjustment, description: e.target.value })}
              className="border px-3 py-2 rounded text-sm flex-1" />
            <input type="number" placeholder="Amount"
              value={adjustment.amount}
              onChange={(e) => setAdjustment({ ...adjustment, amount: e.target.value })}
              className="border px-3 py-2 rounded text-sm flex-1" />
            <button onClick={handleAdjustment}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm">
              Add
            </button>
          </div>
        </div>
      )}

      {/* Outstanding Bills table */}
      <h3 className="text-lg font-semibold mb-3 text-gray-700">Outstanding Bills</h3>
      <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <thead>
          <tr className="bg-indigo-100 text-indigo-800">
            <th className="border px-4 py-2">Customer Name</th>
            <th className="border px-4 py-2">Date</th>
            <th className="border px-4 py-2">Service</th>
            <th className="border px-4 py-2">Description</th>
            <th className="border px-4 py-2">Amount</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Bookings rows */}
          {bills.map((bill) => (
            <tr key={`booking-${bill.id}`} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{bill.name}</td>
              <td className="border px-4 py-2">{formatDateTime(bill.checkin)}</td>
              <td className="border px-4 py-2">Room Booking</td>
              <td className="border px-4 py-2">
                {bill.room} Booked for {bill.days} {bill.days > 1 ? "days" : "day"}
              </td>
              <td className="border px-4 py-2">
                {calculateRoomPrice(bill.room, bill.days, prices)}
              </td>
              <td className="border px-4 py-2 text-center">—</td>
            </tr>
          ))}

          {/* Adjustments rows */}
          {adjustmentsList.map((adj) => {
            const isEditing = editingId === adj.id;
            return (
              <tr key={`adjustment-${adj.id}`} className="hover:bg-gray-50">
                <td className="border px-4 py-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.customername}
                      onChange={(e) =>
                        setEditData({ ...editData, customername: e.target.value })
                      }
                      className="border px-2 py-1 text-sm rounded"
                    />
                  ) : adj.customername}
                </td>
                                <td className="border px-4 py-2">
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={editData.date}
                      onChange={(e) =>
                        setEditData({ ...editData, date: e.target.value })
                      }
                      className="border px-2 py-1 text-sm rounded"
                    />
                  ) : formatDateTime(adj.date)}
                </td>
                <td className="border px-4 py-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.service}
                      onChange={(e) =>
                        setEditData({ ...editData, service: e.target.value })
                      }
                      className="border px-2 py-1 text-sm rounded"
                    />
                  ) : adj.service}
                </td>
                <td className="border px-4 py-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.description}
                      onChange={(e) =>
                        setEditData({ ...editData, description: e.target.value })
                      }
                      className="border px-2 py-1 text-sm rounded"
                    />
                  ) : adj.description}
                </td>
                <td className="border px-4 py-2">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.amount}
                      onChange={(e) =>
                        setEditData({ ...editData, amount: e.target.value })
                      }
                      className="border px-2 py-1 text-sm rounded"
                    />
                  ) : adj.amount}
                </td>
                <td className="border px-4 py-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSave(adj.id)}
                        className="px-2 py-1 bg-green-600 text-white rounded mr-2 text-sm hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-2 py-1 bg-gray-600 text-white rounded mr-2 text-sm hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(adj.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(adj)}
                        className="px-2 py-1 bg-blue-600 text-white rounded mr-2 text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(adj.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>   
      </table>

      {/* Summary card below table */}
      <div className="mt-6 p-4 bg-indigo-100 rounded-lg shadow text-center">
        <p className="text-lg font-semibold text-indigo-800">
          Grand Total: <span className="text-2xl">{calculateTotal()}</span>
        </p>

        {/* Pay Button */}
        <button
          onClick={() => handlePay()}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Pay Now
        </button>        
      </div>
    </div>
  );
}


