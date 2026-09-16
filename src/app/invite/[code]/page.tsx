"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShieldCheck, AlertCircle, Users, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface InviteInfo {
    code: string;
    serverId: string;
    server: {
        _id: string;
        name: string;
        icon: string;
        color: string;
        server_type?: string;
        visibility?: string;
        memberCount: number;
    };
    createdBy?: {
        username: string;
        displayName?: string;
        avatar?: string;
    };
    expiresAt?: string;
    maxUses?: number;
    uses?: number;
}

export default function InviteCodePage() {
    const router = useRouter();
    const params = useParams();
    const { user, loading: authLoading } = useAuth();

    const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
    const [status, setStatus] = useState<"loading" | "preview" | "joining" | "success" | "error">("loading");
    const [error, setError] = useState("");

    const code = params?.code as string;

    /* Fetch Invite Details for Preview */
    useEffect(() => {
        const fetchInviteDetails = async () => {
            if (!code) {
                setStatus("error");
                setError("Invite is invalid or has expired.");
                return;
            }

            try {
                const token = user?.token;
                const headers: Record<string, string> = {};
                if (token) headers["Authorization"] = `Bearer ${token}`;

                const res = await fetch(`${api.base}/api/invite/${code}`, { headers });
                const data = await res.json();

                if (res.ok) {
                    setInviteInfo(data);
                    setStatus("preview");
                } else {
                    setStatus("error");
                    setError(data.message || "Invite is invalid or has expired.");
                }
            } catch (err) {
                setStatus("error");
                setError("Network error. Please try again.");
            }
        };

        if (authLoading) return;
        fetchInviteDetails();
    }, [code, user?.token, authLoading]);

    const handleAcceptInvite = async () => {
        if (!user?.token) {
            router.push(`/signin?callback=${encodeURIComponent(`/invite/${code}`)}`);
            return;
        }

        setStatus("joining");
        try {
            const res = await fetch(`${api.base}/api/invite/join/${code}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                const serverId = data.server?._id || inviteInfo?.serverId;
                setTimeout(() => {
                    router.push(`/dashboard?s=${serverId}`);
                }, 1500);
            } else {
                setStatus("error");
                setError(data.message || "Failed to join server.");
            }
        } catch (err) {
            setStatus("error");
            setError("Network error. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-[#313338] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#2b2d31] rounded-2xl p-8 shadow-2xl border border-zinc-800 text-center space-y-6">
                {status === "loading" && (
                    <>
                        <div className="flex justify-center py-6">
                            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                        </div>
                        <h1 className="text-xl font-bold text-white">Loading Invitation...</h1>
                        <p className="text-zinc-400 text-sm">Verifying server credentials and access token...</p>
                    </>
                )}

                {status === "preview" && inviteInfo && (
                    <>
                        <div className="space-y-3">
                            <div className="flex justify-center">
                                <div className={`w-20 h-20 rounded-full ${inviteInfo.server.color || "bg-red-600"} flex items-center justify-center text-white font-bold text-3xl shadow-xl overflow-hidden border-2 border-zinc-700`}>
                                    {inviteInfo.server.icon?.startsWith("http") || inviteInfo.server.icon?.startsWith("data:") ? (
                                        <img src={inviteInfo.server.icon} alt={inviteInfo.server.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{inviteInfo.server.icon || inviteInfo.server.name[0].toUpperCase()}</span>
                                    )}
                                </div>
                            </div>

                            {inviteInfo.createdBy?.username && (
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    @{inviteInfo.createdBy.displayName || inviteInfo.createdBy.username} invited you to join
                                </p>
                            )}

                            <h1 className="text-2xl font-bold text-white">{inviteInfo.server.name}</h1>

                            <div className="flex items-center justify-center gap-3 text-xs text-zinc-400">
                                <span className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                                    {inviteInfo.server.memberCount || 1} Members
                                </span>
                                {inviteInfo.server.server_type && (
                                    <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                                        {inviteInfo.server.server_type}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleAcceptInvite}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 group"
                        >
                            <span>Accept Invite</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </>
                )}

                {status === "joining" && (
                    <>
                        <div className="flex justify-center py-6">
                            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                        </div>
                        <h1 className="text-xl font-bold text-white">Joining Server...</h1>
                        <p className="text-zinc-400 text-sm">Granting channel access permissions...</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="flex justify-center py-4">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                                <ShieldCheck className="w-12 h-12 text-green-400" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Welcome to {inviteInfo?.server.name || "the server"}!</h1>
                        <p className="text-zinc-400 text-sm">Invitation accepted. Opening server layout...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="flex justify-center py-4">
                            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                                <AlertCircle className="w-12 h-12 text-red-500" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Invite Invalid</h1>
                        <p className="text-red-400 font-semibold text-sm">{error || "Invite is invalid or has expired."}</p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="w-full py-3 bg-[#4e5058] hover:bg-[#676a74] text-white rounded-xl font-bold transition-all text-sm"
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
