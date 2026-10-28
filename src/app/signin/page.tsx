"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, googleAuth } = useAuth();

  const callbackUrl = searchParams.get("callback") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(getFirebaseAuth(), googleProvider);
      const user = result.user;

      if (user.email) {
        const success = await googleAuth(
          user.email,
          user.displayName || user.email.split("@")[0],
          user.photoURL || ""
        );

        if (success) {
          router.push(callbackUrl);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Login popup was closed before completion");
      } else if (err.message?.includes("Server is experiencing database connectivity issues")) {
        setError("Server is temporarily unavailable. Please try again in a few minutes.");
      } else {
        setError(err.message || "Google login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("https://opentl-backend-1.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
    <div className="flex h-screen items-center justify-center bg-black px-4 overflow-hidden">

      <div className="w-full max-w-md p-8 rounded-2xl
                bg-gradient-to-br from-red-600/20 via-black/40 to-pink-600/20
                backdrop-blur-xl
                border border-red-500/30
                shadow-[0_0_40px_rgba(255,0,0,0.3)]">


        <h2 className="text-2xl font-semibold text-white text-center mb-1">
          Welcome Back
        </h2>

        <p className="text-gray-400 text-center mb-6 text-sm">
          Login to continue
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 
                          border border-red-500/30 p-2 rounded-md text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

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
              placeholder="Enter your password"
              className="w-full h-10 px-3 text-sm
                         bg-white/10 border border-white/20
                         rounded-md text-white
                         placeholder-gray-400
                         focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div className="text-right text-xs">
            <Link
              href="/forgot-password"
              className="text-gray-400 hover:text-red-500 cursor-pointer"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md text-sm font-medium text-white
                       bg-gradient-to-r from-red-600 to-pink-600
                       hover:opacity-90 transition
                       disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0c0c0c] px-2 text-gray-500 font-medium">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-10 rounded-md text-sm font-medium text-white
                     bg-white/5 border border-white/20
                     hover:bg-white/10 transition
                     flex items-center justify-center gap-2
                     disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">
          Don’t have an account?{" "}
          <Link
            href={callbackUrl !== "/dashboard" ? `/signup?callback=${encodeURIComponent(callbackUrl)}` : "/signup"}
            className="text-red-500 hover:underline"
          >
            Signup
          </Link>
        </p>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black"><span className="text-white text-sm">Loading...</span></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
