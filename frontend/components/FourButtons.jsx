'use client';
import React, { useState, useEffect } from "react";
import api from "@/utils/api";   // axios instance with refresh token logic

export default function FourButtons() {
  const [activePanel, setActivePanel] = useState(null);
  const [bookings, setBookings] = useState([]); 
  const [newBooking, setNewBooking] = useState({
    name: "",
    email: "",
    contact: "",
    room: "",
    days: ""
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const [roomsData, setRoomsData] = useState(null);
  const [showRooms, setShowRooms] = useState(false);
  const [roomFilter, setRoomFilter] = useState("all");

  const handleClick = (panel) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  // Fetch existing bookings
  const fetchBookings = async () => {
    try {
      const res = await api.get("/api/manage-bookings/");
      setBookings(res.data.results || res.data);
    } catch (err) {
      console.error("Error fetching bookings", err);
    }
  };

 useEffect(() => {
  if (activePanel === "bookings") {
    const loadBookings = async () => {
      await fetchBookings();
    };
    loadBookings();
  }
}, [activePanel]);


  // Save booking
  const handleAddBooking = async () => {
    if (newBooking.name && newBooking.email && newBooking.contact && newBooking.room && newBooking.days) {
      try {
        const res = await api.post("/api/manage-bookings/", {
          ...newBooking,
          days: Number(newBooking.days),
        });
        setBookings([...bookings, res.data]);
        setNewBooking({ name: "", email: "", contact: "", room: "", days: "" });
        setShowAddForm(false);
      } catch (err) {
        console.error("Error saving booking", err);
      }
    }
  };

  // Fetch inventory + prices
  const fetchAvailableRooms = async () => {
    try {
      if (showRooms) {
        setShowRooms(false);
        return;
      }

      const [invRes, priceRes] = await Promise.all([
        api.get("/api/room-inventory/"),
        api.get("/api/room-price/"),
      ]);

      // Build initial room list with status Available
      const inventory = invRes.data;
      const prices = priceRes.data;
      let roomList = [];

      const pushRooms = (count, type, price, startNum) => {
        for (let i = 0; i < count; i++) {
          roomList.push({
            number: startNum + i,
            type,
            price,
            status: "Available"
          });
        }
      };

      pushRooms(inventory.normal_rooms, "Normal", prices.normal_price, 101);
      pushRooms(inventory.deluxe_rooms, "Deluxe", prices.deluxe_price, 201);
      pushRooms(inventory.suite_rooms, "Suite", prices.suite_price, 301);

      setRoomsData({ inventory, prices, rooms: roomList });
      setShowRooms(true);
    } catch (err) {
      console.error("Error fetching rooms", err);
    }
  };

  // Toggle room status
  const toggleRoomStatus = (roomNumber) => {
    setRoomsData((prev) => {
      if (!prev) return prev;
      const updatedRooms = prev.rooms.map((room) =>
        room.number === roomNumber
          ? { ...room, status: room.status === "Available" ? "Booked" : "Available" }
          : room
      );
      return { ...prev, rooms: updatedRooms };
    });
  };

  // Render grid using counts + prices
  const renderFilteredRooms = () => {
    if (!roomsData) return null;
    let roomList = roomsData.rooms;

    if (roomFilter !== "all") {
      roomList = roomList.filter((room) => room.type.toLowerCase() === roomFilter);
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {roomList.map((room) => (
          <div
            key={room.number}
            className={`border rounded-lg p-4 shadow text-center ${
              room.status === "Available" ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <h4 className="font-bold">Room {room.number}</h4>
            <p className={room.status === "Available" ? "text-green-600" : "text-red-600"}>
              {room.status}
            </p>
            <p className="text-sm text-gray-600">{room.type} Room</p>
            <p className="text-sm text-blue-600">Price: {room.price}</p>
            <button
              onClick={() => toggleRoomStatus(room.number)}
              className={`mt-2 px-3 py-1 rounded text-white ${
                room.status === "Available" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {room.status === "Available" ? "Mark Booked" : "Mark Available"}
            </button>
          </div>
        ))}
      </div>
    );
  };

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

      {activePanel === "bookings" && (
        <div className="bg-white/50 backdrop-blur-md rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Manage Bookings</h2>

          <button
            onClick={fetchAvailableRooms}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 mb-4"
          >
            {showRooms ? "Show Available Rooms" : "Show Available Rooms"}
          </button>

          {showRooms && roomsData && (
            <div>
              <label className="mr-2 font-semibold">Filter:</label>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="border px-2 py-1 rounded"
              >
                <option value="all">All Rooms</option>
                <option value="normal">Normal Rooms</option>
                <option value="deluxe">Deluxe Rooms</option>
                <option value="suite">Suite Rooms</option>
              </select>

              {renderFilteredRooms()}
            </div>
          )}

          {/* Add Booking Button */}
          <div className="mb-6 mt-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <span className="text-xl mr-2">+</span> Add Booking
            </button>
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
                <th className="border px-4 py-2">Customer Name</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Contact</th>
                <th className="border px-4 py-2">Room Number / Class</th>
                <th className="border px-4 py-2">Stay Days</th>
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


            