"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

function InvitePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [error, setError] = useState("");

    const serverId = searchParams.get("s");
    const code = searchParams.get("code");

    useEffect(() => {
        if (code) {
            router.push(`/invite/${code}`);
            return;
        }

        const joinServer = async () => {
            if (!user?.token || !serverId) {
                if (!serverId) {
                    setStatus("error");
                    setError("Invite is invalid or has expired.");
                }
                return;
            }

            try {
                const res = await fetch(`${api.base}/api/servers/${serverId}/join`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });

                if (res.ok) {
                    setStatus("success");
                    setTimeout(() => {
                        router.push(`/dashboard?s=${serverId}`);
                    }, 1500);
                } else {
                    const data = await res.json();
                    setStatus("error");
                    setError(data.message || "Invite is invalid or has expired.");
                }
            } catch (err) {
                setStatus("error");
                setError("Network error. Please try again.");
            }
        };

        if (authLoading) return;

        if (user) {
            joinServer();
        } else {
            router.push(`/signin?callback=${encodeURIComponent(`/invite?s=${serverId}`)}`);
        }
    }, [user, authLoading, serverId, code, router]);

    return (
        <div className="min-h-screen bg-[#313338] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#2b2d31] rounded-xl p-8 shadow-2xl border border-white/5 text-center space-y-6">
                {status === "loading" && (
                    <>
                        <div className="flex justify-center">
                            <Loader2 className="w-16 h-16 text-red-600 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Accepting Invitation...</h1>
                        <p className="text-zinc-400">Verifying access token, please wait.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                                <ShieldCheck className="w-12 h-12 text-green-500" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Welcome to the Server!</h1>
                        <p className="text-zinc-400">Invitation accepted. Redirecting you to the hub...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-12 h-12 text-red-500" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Invite Failed</h1>
                        <p className="text-red-400 font-medium text-sm">{error}</p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="w-full py-3 bg-[#4e5058] hover:bg-[#676a74] text-white rounded-lg font-bold transition-all text-sm mt-2"
                        >
                            Return to Dashboard
                        </button>
                    </>
                )}
            </div>

            <p className="mt-8 text-zinc-500 text-xs font-medium tracking-widest uppercase">
                OpenTL • Spider-Network Platform
            </p>
        </div>
    );
}

export default function InvitePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#313338] flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-red-600 animate-spin" />
            </div>
        }>
            <InvitePageContent />
        </Suspense>
    );
}
