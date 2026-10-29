"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LogIn, UserPlus, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type AuthGateProps = {
    children: React.ReactNode;
    title?: string;
    description?: string;
};

export default function AuthGate({
    children,
    title = "Sign in to join this meeting",
    description = "You must be signed in with an OpenTL account to enter this meeting room."
}: AuthGateProps) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [callbackUrl, setCallbackUrl] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const path = window.location.pathname + window.location.search;
            setCallbackUrl(path);
        }
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1e1f22] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="text-zinc-400 text-sm">Verifying account...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        const signinHref = `/signin?callback=${encodeURIComponent(callbackUrl || "/dashboard")}`;
        const signupHref = `/signup?callback=${encodeURIComponent(callbackUrl || "/dashboard")}`;

        return (
            <div className="min-h-screen bg-[#1e1f22] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#2b2d31] border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center mx-auto border border-blue-500/30">
                        <Lock className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">{title}</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <button
                            onClick={() => router.push(signinHref)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 active:scale-98 shadow-lg shadow-blue-600/30"
                        >
                            <LogIn className="w-4 h-4" />
                            Sign in
                        </button>
                        <button
                            onClick={() => router.push(signupHref)}
                            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 active:scale-98"
                        >
                            <UserPlus className="w-4 h-4" />
                            Create account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

