'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/utils/api";   // axios instance with auth/refresh logic

// Helper: format for table display (MM/DD/YYYY, HH:MM AM/PM)
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

// Helper: format for datetime-local input (YYYY-MM-DDTHH:mm)
const toDateTimeLocal = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function ManageBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [newBooking, setNewBooking] = useState({
    name: "",
    email: "",
    contact: "",
    room: "",
    days: "",
    checkin: "",
    checkout: ""
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [roomsData, setRoomsData] = useState(null);
  const [showRooms, setShowRooms] = useState(false);
  const [roomFilter, setRoomFilter] = useState("all");
  const [prices, setPrices] = useState(null);

  // Fetch bookings + prices
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookRes, priceRes] = await Promise.all([
          api.get("/api/manage-bookings/"),
          api.get("/api/room-price/")
        ]);
        setBookings(bookRes.data);
        setPrices(priceRes.data);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    fetchData();
  }, []);

  const handleAddBooking = async () => {
    try {
      const res = await api.post("/api/manage-bookings/", {
        ...newBooking,
        days: Number(newBooking.days),
        // convert datetime-local string to ISO for backend
        checkin: newBooking.checkin ? new Date(newBooking.checkin).toISOString() : null,
        checkout: newBooking.checkout ? new Date(newBooking.checkout).toISOString() : null,
        status: "Booked"
      });
      setBookings([...bookings, res.data]);
      setNewBooking({ name:"", email:"", contact:"", room:"", days:"", checkin:"", checkout:"" });
      setShowAddForm(false);
    } catch (err) {
      console.error("Error saving booking", err);
    }
  };

  const handleEditBooking = async (id, updatedBooking) => {
    try {
      const res = await api.put(`/api/manage-bookings/${id}/`, {
        ...updatedBooking,
        days: Number(updatedBooking.days),
        // convert datetime-local string to ISO for backend
        checkin: updatedBooking.checkin ? new Date(updatedBooking.checkin).toISOString() : null,
        checkout: updatedBooking.checkout ? new Date(updatedBooking.checkout).toISOString() : null
      });
      setBookings(bookings.map(b => b.id === id ? res.data : b));
      setEditingBooking(null);
    } catch (err) {
      console.error("Error editing booking", err);
    }
  };

  const handleCancelBooking = async (id) => {
    try {
      await api.delete(`/api/manage-bookings/${id}/`);
      setBookings(bookings.filter(b => b.id !== id));
    } catch (err) {
      console.error("Error deleting booking", err);
    }
  };

  // Fetch available rooms
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
      setPrices(prices);
      setShowRooms(true);
    } catch (err) {
      console.error("Error fetching rooms", err);
    }
  };

  const renderFilteredRooms = () => {
    if (!roomsData) return null;
    let roomList = roomsData.rooms;
    if (roomFilter !== "all") {
      roomList = roomList.filter((room) => room.type.toLowerCase() === roomFilter);
    }
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {roomList.map((room) => {
          const booking = bookings.find(b => b.room.startsWith(room.number.toString()));
          const status = booking ? booking.current_status : "Available";
          return (
            <div
              key={room.number}
              className={`border rounded-lg p-4 shadow text-center ${
                status === "Available" ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <h4 className="font-bold">Room {room.number}</h4>
              <p className={status === "Available" ? "text-green-600" : "text-red-600"}>
                {status}
              </p>
              <p className="text-sm text-gray-600">{room.type} Room</p>
              <p className="text-sm text-blue-600">Price: {room.price}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const calculateRoomPrice = (room, days) => {
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

  return (
    <div className="p-6 bg-white/50 backdrop-blur-md rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Manage Bookings</h2>

      <button
        onClick={fetchAvailableRooms}
        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 mb-4"
      >
        {showRooms ? "Hide Rooms" : "Show Rooms"}
      </button>

      {showRooms && (
        <div className="mt-6">
          <div className="mb-4">
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="px-3 py-2 border rounded bg-white text-gray-800"
            >
              <option value="all">All Rooms</option>
              <option value="normal">Normal</option>
              <option value="deluxe">Deluxe</option>
              <option value="suite">Suite</option>
            </select>
          </div>
          {renderFilteredRooms()}
        </div>
      )}

      {/* Add Booking Form */}
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
            <input type="datetime-local" value={newBooking.checkin}
              onChange={(e) => setNewBooking({ ...newBooking, checkin: e.target.value })}
              className="border px-2 py-1 w-52 text-sm" />
            <input type="datetime-local" value={newBooking.checkout}
              onChange={(e) => setNewBooking({ ...newBooking, checkout: e.target.value })}
              className="border px-2 py-1 w-52 text-sm" />
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
            <th className="border px-4 py-2">Check-in</th>
            <th className="border px-4 py-2">Check-out</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Room Price</th>
            <th className="border px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              {editingBooking?.id === b.id ? (
                <>
                  <td className="border px-4 py-2">
                    <input type="text" value={editingBooking.name || ""}
                      onChange={(e) => setEditingBooking({ ...editingBooking, name: e.target.value })}
                      className="border px-2 py-1 text-sm w-full" />
                  </td>
                  <td className="border px-4 py-2">
                    <input type="email" value={editingBooking.email || ""}
                      onChange={(e) => setEditingBooking({ ...editingBooking, email: e.target.value })}
                      className="border px-2 py-1 text-sm w-full" />
                  </td>
                  <td className="border px-4 py-2">
                    <input type="text" value={editingBooking.contact || ""}
                      onChange={(e) => setEditingBooking({ ...editingBooking, contact: e.target.value })}
                      className="border px-2 py-1 text-sm w-full" />
                  </td>
                  <td className="border px-4 py-2">
                    <input type="text" value={editingBooking.room || ""}
                      onChange={(e) => setEditingBooking({ ...editingBooking, room: e.target.value })}
                      className="border px-2 py-1 text-sm w-full" />
                  </td>
                  <td className="border px-4 py-2">
                    <input type="number" value={editingBooking.days || ""}
                      onChange={(e) => setEditingBooking({ ...editingBooking, days: e.target.value })}
                      className="border px-2 py-1 text-sm w-full" />
                  </td>
                  <td className="border px-4 py-2">
                    <input type="datetime-local"
                      value={toDateTimeLocal(editingBooking.checkin)}
                      onChange={(e) => setEditingBooking({ ...editingBooking, checkin: e.target.value })}
                      className="border px-2 py-1 text-sm w-full" />
                  </td>
                  <td className="border px-4 py-2">
                    <input type="datetime-local"
                      value={toDateTimeLocal(editingBooking.checkout)}
                      onChange={(e) => setEditingBooking({ ...editingBooking, checkout: e.target.value })}
                      className="border px-2 py-1 text-sm w-full" />
                  </td>
                  <td className="border px-4 py-2">{editingBooking.current_status}</td>
                  <td className="border px-4 py-2">
                    {calculateRoomPrice(editingBooking.room, editingBooking.days)}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEditBooking(editingBooking.id, editingBooking)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingBooking(null)}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="border px-4 py-2">{b.name}</td>
                  <td className="border px-4 py-2">{b.email}</td>
                  <td className="border px-4 py-2">{b.contact}</td>
                  <td className="border px-4 py-2">{b.room}</td>
                  <td className="border px-4 py-2">{b.days}</td>
                  <td className="border px-4 py-2">{formatDateTime(b.checkin)}</td>
                  <td className="border px-4 py-2">{formatDateTime(b.checkout)}</td>
                  <td className="border px-4 py-2">{b.current_status}</td>
                  <td className="border px-4 py-2">
                    {calculateRoomPrice(b.room, b.days)}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <Link href="/receptionist/manage-payments">
                        <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                          Manage Payments
                        </button>
                      </Link>
                      <button
                        onClick={() => setEditingBooking(b)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                      >
                        Edit Booking
                      </button>
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
