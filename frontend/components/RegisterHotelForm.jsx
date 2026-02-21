"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";   // import router

export default function RegisterHotelForm() {
  const router = useRouter();   // initialize router

  const [form, setForm] = useState({
    name: "",
    owner: "",
    contact: "",
    email: "",
    location: "",
    pan: "",
    age: "",
    owner_contact: "",
    citizenship: "",
    permanent_address: ""
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Hotel name is required";
    if (!form.owner.trim()) newErrors.owner = "Owner name is required";
    if (!form.contact.trim()) newErrors.contact = "Hotel contact is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!form.location.trim()) newErrors.location = "Hotel location is required";
    if (!form.pan.trim()) newErrors.pan = "PAN number is required";
    if (!form.age.trim()) newErrors.age = "Owner age is required";
    if (!form.owner_contact.trim()) newErrors.owner_contact = "Owner contact is required";
    if (!form.citizenship.trim()) newErrors.citizenship = "Citizenship number is required";
    if (!form.permanent_address.trim()) newErrors.permanent_address = "Permanent address is required";
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

    try {
      const res = await fetch("http://localhost:8000/api/hotels/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(`Hotel registered successfully. Credentials sent to ${form.email}`);

        // redirect to AdminDashboard after success
        router.push("/admin/dashboard");

        setForm({
          name: "",
          owner: "",
          contact: "",
          email: "",
          location: "",
          pan: "",
          age: "",
          owner_contact: "",
          citizenship: "",
          permanent_address: ""
        });
      } else {
        const errorData = await res.json();
        setMessage(`Error: ${errorData.detail || "Registration failed"}`);
      }
    } catch (err) {
      setMessage("Network error. Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: "Hotel Name", key: "name" },
    { label: "Owner Name", key: "owner" },
    { label: "Hotel Contact", key: "contact" },
    { label: "Owner Contact", key: "owner_contact" },
    { label: "Age", key: "age" },
    { label: "Email", key: "email" },
    { label: "Hotel Location", key: "location" },
    { label: "Permanent Address", key: "permanent_address" },
    { label: "Pan Number", key: "pan" },
    { label: "Citizenship Number", key: "citizenship" }
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/register.jpg')" }}
    >
      <div className="max-w-md w-full bg-white p-6 rounded shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Hotel Details Form!</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ label, key }) => (
            <div key={key}>
              <input
                type={key === "email" ? "email" : "text"}
                placeholder={label}
                className="w-full p-2 border rounded"
                value={form[key] || ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
              {errors[key] && (
                <p className="text-red-600 text-sm">{errors[key]}</p>
              )}
            </div>
          ))}
          <button
            type="submit"
            className={`px-4 py-2 rounded text-white ${
              loading ? "bg-gray-400" : "bg-green-600"
            }`}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
        {message && (
          <p className="mt-4 text-green-700 font-semibold">{message}</p>
        )}
      </div>
    </div>
  );
}
