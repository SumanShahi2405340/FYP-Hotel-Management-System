"use client";
import { useState } from "react";

export default function ManageRooms() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [roomView, setRoomView] = useState("all");

  const [showRoomsForm, setShowRoomsForm] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);

  const [normalQty, setNormalQty] = useState("");
  const [deluxeQty, setDeluxeQty] = useState("");
  const [suiteQty, setSuiteQty] = useState("");

  const [roomPrices, setRoomPrices] = useState({
    normal: null,
    deluxe: null,
    suite: null,
  });

  const [roomData, setRoomData] = useState({
    normal: [],
    deluxe: [],
    suite: [],
    all: [],
  });

  const generateRooms = (start, count) =>
    Array.from({ length: count }, (_, i) => ({
      number: start + i,
      status: "available",
    }));

  const handleSaveAll = (e) => {
    e.preventDefault();

    const normal = Number(normalQty);
    const deluxe = Number(deluxeQty);
    const suite = Number(suiteQty);

    if (!normal && !deluxe && !suite) {
      alert("Please enter at least one quantity");
      return;
    }

    const updated = {
      normal: normal ? generateRooms(101, normal) : [],
      deluxe: deluxe ? generateRooms(201, deluxe) : [],
      suite: suite ? generateRooms(301, suite) : [],
    };

    updated.all = [...updated.normal, ...updated.deluxe, ...updated.suite];

    setRoomData(updated);
    alert("Room data updated (dummy only, no database used yet)");

    setShowRoomsForm(false);
  };

  const handleSavePrice = (e) => {
    e.preventDefault();

    const normal = Number(e.target.normal.value);
    const deluxe = Number(e.target.deluxe.value);
    const suite = Number(e.target.suite.value);

    setRoomPrices({ normal, deluxe, suite });
    alert("Room price updated (dummy only, no database used yet)");

    setShowPriceForm(false);
  };

  const renderRooms = (rooms) => (
    <div className="grid grid-cols-3 gap-4 mt-4">
      {rooms.map((room) => (
        <div
          key={room.number}
          className={`flex flex-col items-center justify-center border rounded-lg p-4 ${
            room.status === "booked"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          <div className="text-lg font-bold">Room {room.number}</div>
          <div className="text-sm">
            {room.status === "booked" ? "Booked" : "Available"}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      {showSidebar && (
        <aside className="w-64 bg-white shadow-md p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Manage Rooms</h2>
          <button
            onClick={() => setShowRoomsForm((prev) => !prev)}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              showRoomsForm ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            🛏️ Update Rooms
          </button>
          <button
            onClick={() => setShowPriceForm((prev) => !prev)}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              showPriceForm ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            💰 Update Room Price
          </button>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Top Controls */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            {showSidebar ? "Hide Menu" : "Show Menu"}
          </button>

          <select
            value={roomView}
            onChange={(e) => setRoomView(e.target.value)}
            className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Rooms</option>
            <option value="normal">Normal Rooms</option>
            <option value="deluxe">Deluxe Rooms</option>
            <option value="suite">Suites</option>
          </select>
        </div>

        {/* Update Rooms Form */}
        {showRoomsForm && (
          <div className="max-w-md bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Update Room Inventory</h2>
            <form onSubmit={handleSaveAll} className="space-y-4">
              <input
                type="number"
                value={normalQty}
                onChange={(e) => setNormalQty(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Normal rooms"
              />
              <input
                type="number"
                value={deluxeQty}
                onChange={(e) => setDeluxeQty(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Deluxe rooms"
              />
              <input
                type="number"
                value={suiteQty}
                onChange={(e) => setSuiteQty(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Suite rooms"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
            </form>
          </div>
        )}

        {/* Update Price Form */}
        {showPriceForm && (
          <div className="max-w-md bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Update Room Price</h2>
            <form onSubmit={handleSavePrice} className="space-y-4">
              <input
                name="normal"
                type="number"
                className="w-full border p-2 rounded"
                placeholder="Normal room price"
              />
              <input
                name="deluxe"
                type="number"
                className="w-full border p-2 rounded"
                placeholder="Deluxe room price"
              />
              <input
                name="suite"
                type="number"
                className="w-full border p-2 rounded"
                placeholder="Suite room price"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
            </form>
          </div>
        )}

        {/* Room Views */}
        {roomView === "all" && (
          <>
            <h2 className="text-lg font-bold">All Rooms</h2>
            {renderRooms(roomData.all)}
          </>
        )}
        {roomView === "normal" && (
          <>
            <h2 className="text-lg font-bold text-red-600">
              Normal Rooms{" "}
              {roomPrices.normal !== null && (
                <span className="text-sm text-gray-600">– Rs {roomPrices.normal}</span>
              )}
            </h2>
            {renderRooms(roomData.normal)}
          </>
        )}
        {roomView === "deluxe" && (
          <>
            <h2 className="text-lg font-bold text-purple-600">
              Deluxe Rooms{" "}
              {roomPrices.deluxe !== null && (
                <span className="text-sm text-gray-600">– Rs {roomPrices.deluxe}</span>
              )}
            </h2>
            {renderRooms(roomData.deluxe)}
          </>
        )}
        {roomView === "suite" && (
          <>
            <h2 className="text-lg font-bold text-green-600">
              Suites{" "}
              {roomPrices.suite !== null && (
                <span className="text-sm text-gray-600">– Rs {roomPrices.suite}</span>
              )}
            </h2>
            {renderRooms(roomData.suite)}
          </>
        )}
      </main>
    </div>
  );
}
