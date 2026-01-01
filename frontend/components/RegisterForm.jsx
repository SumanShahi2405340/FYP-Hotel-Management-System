"use client";
import { useState } from "react";

export default function RegisterForm() {
  const [form, setForm] = useState({ name: "", contact: "", email: "", location: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Hotel name is required";
    if (!form.contact.trim()) newErrors.contact = "Contact is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!form.location.trim()) newErrors.location = "Location is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const credentials = {
      username: form.email.split("@")[0],
      password: Math.random().toString(36).slice(-8),
    };

    setTimeout(() => {
      setLoading(false);
      setMessage(` Hotel registered successfully. Credentials sent to ${form.email}`);
      setForm({ name: "", contact: "", email: "", location: "" });
    }, 1000);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/register.jpg')" }} // Background image
    >
      <div className="max-w-md w-full bg-white p-6 rounded shadow-lg">
        <h1 className="text-2xl font-bold mb-4"> Hotel Details Form!</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {["Hotel Name", "Owner Name", "Contact", "Email", "Location", "Pan Number"].map((field) => (
            <div key={field}>
              <input
                type={field === "Email" ? "email" : "text"}
                placeholder={field}
                className="w-full p-2 border rounded"
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
              {errors[field] && <p className="text-red-600 text-sm">{errors[field]}</p>}
            </div>
          ))}
          <button
            type="submit"
            className={`px-4 py-2 rounded text-white ${loading ? "bg-gray-400" : "bg-green-600"}`}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
        {message && <p className="mt-4 text-green-700 font-semibold">{message}</p>}
      </div>
    </div>
  );
}
