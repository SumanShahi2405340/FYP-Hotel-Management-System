'use client';
import React, { useState } from "react";

export default function FourButtons() {
  const [activePanel, setActivePanel] = useState(null);
  const [bookings, setBookings] = useState([
    { name: "John Doe", email: "john@example.com", contact: "9876543210", room: "101 / Normal", days: 2 },
    { name: "Jane Smith", email: "jane@example.com", contact: "9812345678", room: "102 / Deluxe", days: 3 },
  ]);
  const [newBooking, setNewBooking] = useState({
    name: "",
    email: "",
    contact: "",
    room: "",
    days: ""
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleClick = (panel) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const handleAddBooking = () => {
    if (newBooking.name && newBooking.email && newBooking.contact && newBooking.room && newBooking.days) {
      setBookings([...bookings, newBooking]);
      setNewBooking({ name: "", email: "", contact: "", room: "", days: "" });
      setShowAddForm(false); // hide form after saving
    }
  };

  const availableRooms = ["101 / Normal", "102 / Deluxe", "103 / Suite", "104 / Luxury"];

  return (
    <div className="p-6">
      {/* Top Buttons */}
      <div className="flex justify-center gap-4 flex-wrap mb-6">
        <button onClick={() => handleClick("bookings")} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Manage Bookings
        </button>
        <button onClick={() => handleClick("checkin")} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
          Manage Check-in/Check-out
        </button>
        <button onClick={() => handleClick("payments")} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Manage Payments
        </button>
        <button onClick={() => handleClick("earnings")} className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">
          View Earning Reports
        </button>
      </div>

      {/* Panels */}
      {activePanel === "bookings" && (
        <div className="bg-white/50 backdrop-blur-md rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Manage Bookings</h2>

          {/* Available Rooms Button */}
          <button
            onClick={() => alert("Available Rooms:\n" + availableRooms.join("\n"))}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 mb-4"
          >
            Show Available Rooms
          </button>

          {/* Add Booking Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <span className="text-xl mr-2">+</span> Add Booking
            </button>

            {/* Add Booking Form (shown when + clicked) */}
            {showAddForm && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <input type="text" placeholder="Customer Name" value={newBooking.name}
                  onChange={(e) => setNewBooking({ ...newBooking, name: e.target.value })}
                  className="border px-2 py-1 w-32 text-sm" />
                <input type="email" placeholder="Email" value={newBooking.email}
                  onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })}
                  className="border px-2 py-1 w-40 text-sm" />
                <input type="text" placeholder="Contact" value={newBooking.contact}
                  onChange={(e) => setNewBooking({ ...newBooking, contact: e.target.value })}
                  className="border px-2 py-1 w-32 text-sm" />
                <input type="text" placeholder="Room Number / Class" value={newBooking.room}
                  onChange={(e) => setNewBooking({ ...newBooking, room: e.target.value })}
                  className="border px-2 py-1 w-40 text-sm" />
                <input type="number" placeholder="Stay Days" value={newBooking.days}
                  onChange={(e) => setNewBooking({ ...newBooking, days: e.target.value })}
                  className="border px-2 py-1 w-20 text-sm" />
                {/* Save button inline with fields */}
                <button
                  onClick={handleAddBooking}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Bookings Table */}
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-4 py-2">Customer Name</th>
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">Contact</th>
                <th className="border border-gray-300 px-4 py-2">Room Number / Class</th>
                <th className="border border-gray-300 px-4 py-2">Stay Days</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, idx) => (
                <tr key={idx}>
                  <td className="border px-4 py-2">{b.name}</td>
                  <td className="border px-4 py-2">{b.email}</td>
                  <td className="border px-4 py-2">{b.contact}</td>
                  <td className="border px-4 py-2">{b.room}</td>
                  <td className="border px-4 py-2">{b.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
