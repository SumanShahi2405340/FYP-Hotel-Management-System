"use client";

import { useState } from "react";
import recepApi from "../utils/recep";   // 👈 use the receptionist API wrapper
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ReceptionistLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(""); // success or error
  const router = useRouter();

  const handleLogin = async () => {
    try {
      // Call your receptionist login endpoint
      const res = await recepApi.post("http://127.0.0.1:8000/api/token/", {
        username,
        password,
      });

      if (res.status === 200) {
        // Save JWT tokens under receptionist-specific keys
        localStorage.setItem("recepToken", res.data.access);
        localStorage.setItem("recepRefreshToken", res.data.refresh);

        if (res.data.hotel_id) {
          localStorage.setItem("hotelId", res.data.hotel_id);
        }

        setMessage(res.data.message || "Login successful");
        setStatus("success");

        console.log("Receptionist login response:", res.data);

        // Redirect after short delay
        setTimeout(() => {
          if (res.data.hotel_id) {
            router.push(`/receptionist/dashboard/${res.data.hotel_id}`);
          } else {
            router.push("/receptionist/dashboard");
          }
        }, 1500);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "Login failed");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative z-10">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <Image
            src="/recep.jpg"
            alt="Receptionist Avatar"
            width={80}
            height={80}
            className="rounded-full"
          />
        </div>

        {/* Greeting */}
        <h2 className="text-xl font-bold text-center text-gray-800">Hello!</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Welcome Receptionist
        </p>

        {/* Login Form */}
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Receptionist Login
        </h3>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Login
        </button>

        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              status === "success" ? "text-green-500" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
