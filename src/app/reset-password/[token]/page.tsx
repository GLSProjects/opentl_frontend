"use client";

import { useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`https://opentl-backend-1.onrender.com/api/auth/reset-password/${token}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitted(true);
                setTimeout(() => {
                    router.push("/signin");
                }, 3000);
            } else {
                setError(data.message || "Something went wrong. The link may have expired.");
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
                    Reset Password
                </h2>

                {!submitted ? (
                    <>
                        <p className="text-gray-400 text-center mb-4 text-sm">
                            Enter your new password below.
                        </p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-md mb-4 text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-300 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock size={14} className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        className="w-full h-10 pl-10 pr-3 text-sm
                                 bg-white/10 border border-white/20
                                 rounded-md text-white
                                 placeholder-gray-400
                                 focus:outline-none focus:ring-1 focus:ring-red-600"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-300 mb-1">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Lock size={14} className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your password"
                                        className="w-full h-10 pl-10 pr-3 text-sm
                                 bg-white/10 border border-white/20
                                 rounded-md text-white
                                 placeholder-gray-400
                                 focus:outline-none focus:ring-1 focus:ring-red-600"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-10 rounded-md text-sm font-medium text-white
                           bg-gradient-to-r from-red-600 to-pink-600
                           hover:opacity-90 transition
                           disabled:opacity-50"
                            >
                                {loading ? "Updating..." : "Update Password"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <div className="flex justify-center mb-4 text-red-500">
                            <CheckCircle2 size={48} />
                        </div>
                        <div className="text-red-500 text-lg font-medium mb-2">Password Updated!</div>
                        <p className="text-gray-400 text-sm mb-6">
                            Your password has been successfully reset. Redirecting you to login...
                        </p>
                        <Link
                            href="/signin"
                            className="text-xs text-red-500 hover:underline"
                        >
                            Click here if not redirected
                        </Link>
                    </div>
                )}

                {!submitted && (
                    <div className="mt-8 pt-6 border-t border-white/10 flex justify-center">
                        <Link
                            href="/signin"
                            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition"
                        >
                            <ArrowLeft size={14} />
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
