"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("https://opentl-backend-1.onrender.com/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitted(true);
            } else {
                setError(data.message || "Something went wrong. Please try again.");
            }
        } catch (err) {
            setError("Could not connect to the server. Please check your connection.");
            console.error(err);
        } finally {
            setLoading(false);
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
                    Forgot Password?
                </h2>

                {!submitted ? (
                    <>
                        <p className="text-gray-400 text-center mb-4 text-sm">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-md mb-4 text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
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

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-10 rounded-md text-sm font-medium text-white
                           bg-gradient-to-r from-red-600 to-pink-600
                           hover:opacity-90 transition
                           disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Reset Password"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <div className="text-red-500 text-lg font-medium mb-2">Check your email</div>
                        <p className="text-gray-400 text-sm mb-6">
                            If an account exists for {email}, you will receive a password reset link shortly.
                        </p>
                        <button
                            onClick={() => setSubmitted(false)}
                            className="text-xs text-red-500 hover:underline"
                        >
                            Didn't receive an email? Try again
                        </button>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-white/10 flex justify-center">
                    <Link
                        href="/signin"
                        className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition"
                    >
                        <ArrowLeft size={14} />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
