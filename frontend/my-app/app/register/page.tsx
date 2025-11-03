"use client";

import React, { useState } from "react";

const Register: React.FC = () => {
  const [form, setForm] = useState({
    username: "",
    name: "",
    surname: "",
    email: "",
    birthdate: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (
      !form.username ||
      !form.name ||
      !form.surname ||
      !form.email ||
      !form.birthdate ||
      !form.phone_number ||
      !form.password
    ) {
      setError("Please fill in all fields");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          name: form.name,
          surname: form.surname,
          email: form.email,
          birthdate: form.birthdate,
          phone_number: form.phone_number,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setTimeout(() => setError(""), 3000);
      } else {
        setSuccess("Account created successfully!");
        setForm({
          username: "",
          name: "",
          surname: "",
          email: "",
          birthdate: "",
          phone_number: "",
          password: "",
          confirmPassword: "",
        });
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setError("Server error, please try again later.");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#111] overflow-hidden px-4">
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-md z-50">
          {error}
        </div>
      )}
      {success && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-md z-50">
          {success}
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none" />
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm z-10">
        <div className="flex items-center mb-6">
          <a href="/">          <img
            src="logo-withoutbackground.png"
            alt="login"
            className="h-30 w-auto mr-2 mt-[-20px] mb-[-30px]"
          /></a>
        </div>
        <h2 className="text-gray-900 font-semibold text-lg mb-1">Register</h2>
        <p className="text-gray-500 mb-4 text-sm">Create your account on KapryGest</p>

        {/* New Inputs */}
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <input
          type="text"
          name="surname"
          placeholder="Surname"
          value={form.surname}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <input
          type="date"
          name="birthdate"
          placeholder="Birthdate"
          value={form.birthdate}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <input
          type="text"
          name="phone_number"
          placeholder="Phone Number"
          value={form.phone_number}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />

        <button
          onClick={handleRegister}
          className="w-full bg-gray-800 text-white py-2.5 rounded-md mb-4 hover:bg-gray-700 transition"
        >
          Register
        </button>

        <p className="text-gray-500 text-sm mb-6">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign in →
          </a>
        </p>

        <div className="flex justify-between text-gray-400 text-xs">
          <a href="#">Assistance</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
