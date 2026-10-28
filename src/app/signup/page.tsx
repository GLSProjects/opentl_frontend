"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const callbackUrl = searchParams.get("callback") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("https://opentl-backend-1.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        // Handle database connection errors
        if (data.message?.includes("Database connection not available")) {
          setError("Server is experiencing database connectivity issues. Please try again in a few minutes.");
        } else {
          setError(data.message);
        }
      } else {
        login(data);
        router.push(callbackUrl);
      }
    } catch (err) {
      setLoading(false);
      setError("Failed to connect to server");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12">

      <div className="w-full max-w-md p-8 rounded-2xl
                bg-gradient-to-br from-red-600/20 via-black/40 to-pink-600/20
                backdrop-blur-xl
                border border-red-500/30
                shadow-[0_0_40px_rgba(255,0,0,0.3)]">

        <h2 className="text-2xl font-semibold text-white text-center mb-1">
          Create Account
        </h2>

        <p className="text-gray-400 text-center mb-6 text-sm">
          Sign up to get started
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 
                          border border-red-500/30 p-2 rounded-md text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full h-10 px-3 text-sm
                         bg-white/10 border border-white/20
                         rounded-md text-white
                         placeholder-gray-400
                         focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full h-10 px-3 text-sm
                         bg-white/10 border border-white/20
                         rounded-md text-white
                         placeholder-gray-400
                         focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              className="w-full h-10 px-3 text-sm
                         bg-white/10 border border-white/20
                         rounded-md text-white
                         placeholder-gray-400
                         focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full h-10 px-3 text-sm
                         bg-white/10 border border-white/20
                         rounded-md text-white
                         placeholder-gray-400
                         focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md text-sm font-medium text-white
                       bg-gradient-to-r from-red-600 to-pink-600
                       hover:opacity-90 transition
                       disabled:opacity-50"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>

        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Already have an account?{" "}
          <span
            onClick={() => router.push(callbackUrl !== "/dashboard" ? `/signin?callback=${encodeURIComponent(callbackUrl)}` : "/signin")}
            className="text-red-500 hover:underline cursor-pointer"
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black"><span className="text-white text-sm">Loading...</span></div>}>
      <SignupPageContent />
    </Suspense>
  );
}
