"use client";
import api from "../utils/api";
import { useState, useEffect } from "react";

export default function ManageRoomsPrice() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [roomView, setRoomView] = useState("all");

  const [showRoomsForm, setShowRoomsForm] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);

  // Controlled inputs for inventory
  const [normalQty, setNormalQty] = useState("");
  const [deluxeQty, setDeluxeQty] = useState("");
  const [suiteQty, setSuiteQty] = useState("");

  // Controlled inputs for prices
  const [normalPrice, setNormalPrice] = useState("");
  const [deluxePrice, setDeluxePrice] = useState("");
  const [suitePrice, setSuitePrice] = useState("");

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

  const INVENTORY_API = "/api/room-inventory/";
  const PRICE_API = "/api/room-price/";

  useEffect(() => {
    async function fetchData() {
      try {
        // Inventory
        const invRes = await api.get(INVENTORY_API);
        const invData = invRes.data;

        const updated = {
          normal: generateRooms(101, invData.normal_rooms),
          deluxe: generateRooms(201, invData.deluxe_rooms),
          suite: generateRooms(301, invData.suite_rooms),
        };
        updated.all = [...updated.normal, ...updated.deluxe, ...updated.suite];
        setRoomData(updated);

        // Prices
        const priceRes = await api.get(PRICE_API);
        const priceData = priceRes.data;

        setRoomPrices({
          normal: priceData.normal_price,
          deluxe: priceData.deluxe_price,
          suite: priceData.suite_price,
        });
      } catch (err) {
        console.error("Error fetching data:", err.response?.data || err);
      }
    }

    fetchData();
  }, []);

  const generateRooms = (start, count) =>
    Array.from({ length: count }, (_, i) => ({
      number: start + i,
      status: "available",
    }));

  const handleSaveAll = async (e) => {
    e.preventDefault();

    const normal = Number(normalQty);
    const deluxe = Number(deluxeQty);
    const suite = Number(suiteQty);

    if ([normalQty, deluxeQty, suiteQty].every((val) => val === "")) {
      alert("Please enter at least one quantity");
      return;
    }

    try {
      const response = await api.put(INVENTORY_API, {
        normal_rooms: normal,
        deluxe_rooms: deluxe,
        suite_rooms: suite,
      });

      const inv = response.data;

      const updated = {
        normal: generateRooms(101, inv.normal_rooms),
        deluxe: generateRooms(201, inv.deluxe_rooms),
        suite: generateRooms(301, inv.suite_rooms),
      };
      updated.all = [...updated.normal, ...updated.deluxe, ...updated.suite];
      setRoomData(updated);

      alert("Room data saved to backend!");
      setShowRoomsForm(false);
    } catch (err) {
      console.error("Error saving inventory:", err.response?.data || err);
      alert("Error saving inventory");
    }
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();

    const normal = Number(normalPrice);
    const deluxe = Number(deluxePrice);
    const suite = Number(suitePrice);

    if ([normalPrice, deluxePrice, suitePrice].every((val) => val === "")) {
      alert("Please enter at least one price");
      return;
    }

    try {
      const response = await api.put(PRICE_API, {
        normal_price: normal,
        deluxe_price: deluxe,
        suite_price: suite,
      });

      const updated = response.data;
      setRoomPrices({
        normal: updated.normal_price,
        deluxe: updated.deluxe_price,
        suite: updated.suite_price,
      });

      alert("Room prices saved to backend!");
      setShowPriceForm(false);
    } catch (err) {
      console.error("Error saving prices:", err.response?.data || err);
      alert("Error saving prices");
    }
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
  <div
    className="flex min-h-screen"
    style={{
      backgroundImage: "url('/2.jpg')", // <-- replace with your image path
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    {/* Sidebar */}
    {showSidebar && (
      <aside className="w-64 bg-white/60 backdrop-blur-sm shadow-md p-6 space-y-4 rounded-r-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Manage Rooms</h2>
        <button
          onClick={() => setShowRoomsForm((prev) => !prev)}
          className={`w-full text-left px-4 py-2 rounded-lg ${
            showRoomsForm
              ? "bg-blue-600 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          🛏️ Update Rooms
        </button>
        <button
          onClick={() => setShowPriceForm((prev) => !prev)}
          className={`w-full text-left px-4 py-2 rounded-lg ${
            showPriceForm
              ? "bg-blue-600 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          💰 Update Room Price
        </button>
      </aside>
    )}

    {/* Main Content */}
    <main className="flex-1 p-8 bg-red/100 backdrop-blur-sm rounded-lg shadow-md m-4">
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
              type="number"
              value={normalPrice}
              onChange={(e) => setNormalPrice(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Normal room price"
            />
            <input
              type="number"
              value={deluxePrice}
              onChange={(e) => setDeluxePrice(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Deluxe room price"
            />
            <input
              type="number"
              value={suitePrice}
              onChange={(e) => setSuitePrice(e.target.value)}
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
};