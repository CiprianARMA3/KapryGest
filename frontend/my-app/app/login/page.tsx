"use client";

import React, { useState, useEffect } from "react";
import { FaApple, FaFacebook, FaGoogle } from "react-icons/fa";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/me`, {
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Not logged in');
      })
      .then((data) => {
        if (data.user?.admin) {
          window.location.href = "/admin-page";
        } else {
          window.location.href = "/main-page";
        }
      })
      .catch(() => {
        // not logged in, stay on login page
      });
  }, []);

  const showErrorMessage = (message: string) => {
    setError(message);
    setTimeout(() => setError(""), 3000);
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleContinue = () => {
    if (!email.trim()) {
      showErrorMessage("Please enter your email");
      return;
    }
    if (!validateEmail(email)) {
      showErrorMessage("Please enter a valid email");
      return;
    }
    setShowPassword(true);
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      showErrorMessage("Please enter your password");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // important to store the cookie
        body: JSON.stringify({ email, password }),
      });

      // First check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Received non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON. Check API URL.');
      }

      const data = await res.json();

      if (!res.ok) {
        showErrorMessage(data.error || "Login failed");
      } else {
        setSuccess("Login successful!");
        setTimeout(() => setSuccess(""), 3000);
        
        if (data.user?.admin) {
          window.location.href = "/admin-page";
        } else {       
          window.location.href = "/main-page";
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      showErrorMessage(err.message || "Server error, please try again later.");
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#111] overflow-hidden px-4">
      {/* Error / success notifications */}
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

      {/* Background overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none" />

      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm z-10">
        {/* Logo */}
        <div className="flex items-center mb-6">
          <a href="/">          
            <img
              src="logo-withoutbackground.png"
              alt="login"
              className="h-30 w-auto mr-2 mt-[-20px] mb-[-30px]"
            />
          </a>
        </div>

        {/* Heading */}
        <h2 className="text-gray-900 font-semibold text-lg mb-1">Login</h2>
        <p className="text-gray-500 mb-4 text-sm">Continue on KapryGest</p>

        {/* Email input */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
          disabled={showPassword}
        />

        {/* Password input (step 2) */}
        {showPassword && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md py-2.5 px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        )}

        {/* Login / Continue button */}
        <button
          onClick={showPassword ? handleLogin : handleContinue}
          className="w-full bg-gray-800 text-white py-2.5 rounded-md mb-4 hover:bg-gray-700 transition"
        >
          {showPassword ? "Login" : "Continue with your email"}
        </button>

        {/* Optional social login and access key */}
        {!showPassword && (
          <>
            <div className="flex items-center mb-4">
              <hr className="flex-grow border-gray-300" />
              <span className="mx-2 text-gray-400 text-sm">or</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300 transition text-gray-700">
              Login with an access key
            </button>

            <div className="flex gap-2 mb-4">
              <button className="flex-1 flex items-center justify-center py-2.5 rounded-md bg-gray-100 hover:bg-gray-200 transition">
                <FaApple className="text-xl" />
              </button>
              <button className="flex-1 flex items-center justify-center py-2.5 rounded-md bg-gray-100 hover:bg-blue-100 transition">
                <FaFacebook className="text-blue-600 text-xl" />
              </button>
              <button className="flex-1 flex items-center justify-center py-2.5 rounded-md bg-gray-100 hover:bg-red-100 transition">
                <FaGoogle className="text-red-600 text-xl" />
              </button>
            </div>
          </>
        )}

        {/* Sign up link */}
        <p className="text-gray-500 text-sm mb-6">
          First time on KapryGest?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Sign up →
          </a>
        </p>

        {/* Footer */}
        <div className="flex justify-between text-gray-400 text-xs">
          <a href="#">Support</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>
    </div>
  );
};

export default Login;