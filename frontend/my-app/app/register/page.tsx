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
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    // Reset messages
    setError("");
    setSuccess("");

    // Validation
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

    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      console.log('Registering user...', { API_URL });
      
      const res = await fetch(`${API_URL}/auth/register`, {  // CHANGED FROM /users TO /auth/register
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: 'include', // Important for cookies/sessions
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

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned an invalid response. Please check if the backend is running.');
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Registration failed: ${res.status} ${res.statusText}`);
        setTimeout(() => setError(""), 5000);
      } else {
        setSuccess("Account created successfully! Redirecting to login...");
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
        
        // Redirect to login after success
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please check if the backend is running on localhost:5000');
      } else if (err.message.includes('HTML')) {
        setError('Server error. Please check if the backend API is properly configured.');
      } else {
        setError(err.message || "Server error, please try again later.");
      }
      
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#111] overflow-hidden px-4">
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-md z-50 max-w-md text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-md z-50 max-w-md text-center">
          {success}
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none" />
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm z-10">
        <div className="flex items-center mb-6">
          <a href="/">
            <img
              src="logo-withoutbackground.png"
              alt="login"
              className="h-30 w-auto mr-2 mt-[-20px] mb-[-30px]"
            />
          </a>
        </div>
        <h2 className="text-gray-900 font-semibold text-lg mb-1">Register</h2>
        <p className="text-gray-500 mb-4 text-sm">Create your account on KapryGest</p>

        {/* Input Fields */}
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
          disabled={loading}
        />
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
          disabled={loading}
        />
        <input
          type="text"
          name="surname"
          placeholder="Surname"
          value={form.surname}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
          disabled={loading}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
          disabled={loading}
        />
        <input
          type="date"
          name="birthdate"
          placeholder="Birthdate"
          value={form.birthdate}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
          disabled={loading}
        />
        <input
          type="text"
          name="phone_number"
          placeholder="Phone Number"
          value={form.phone_number}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
          disabled={loading}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
          disabled={loading}
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
          disabled={loading}
        />

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-gray-800 text-white py-2.5 rounded-md mb-4 hover:bg-gray-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Registering...
            </>
          ) : (
            'Register'
          )}
        </button>

        <p className="text-gray-500 text-sm mb-6">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign in →
          </a>
        </p>

        <div className="flex justify-between text-gray-400 text-xs">
          <a href="#" className="hover:text-gray-600">Assistance</a>
          <a href="#" className="hover:text-gray-600">Privacy</a>
          <a href="#" className="hover:text-gray-600">Terms</a>
        </div>
      </div>
    </div>
  );
};

export default Register;