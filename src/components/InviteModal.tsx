"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check, Link as LinkIcon, Users, ShieldAlert, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";

interface InviteModalProps {
    serverId: string;
    serverName: string;
    serverIcon?: string;
    serverColor?: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function InviteModal({
    serverId,
    serverName,
    serverIcon,
    serverColor = "bg-red-600",
    isOpen,
    onClose,
}: InviteModalProps) {
    const { user } = useAuth();
    const [inviteLink, setInviteLink] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [maxUses, setMaxUses] = useState<number>(0);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && serverId && user?.token) {
            generateInviteLink();
        }
    }, [isOpen, serverId, user?.token]);

    const generateInviteLink = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${api.base}/api/invite/${serverId}`, {
                method: "POST",
                headers: api.authHeaders(user!.token),
            });
            const data = await res.json();
            if (res.ok && data.link) {
                setInviteLink(data.link);
                setExpiresAt(data.expiresAt || null);
                setMaxUses(data.maxUses || 0);
            } else {
                setError(data.message || "Failed to generate invite link");
            }
        } catch (err) {
            setError("Error generating invite link");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!inviteLink) return;
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Box */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="relative bg-[#313338] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-zinc-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 bg-[#2b2d31] relative border-b border-zinc-800 flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-zinc-400 hover:text-white transition"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className={`w-12 h-12 rounded-full ${serverColor} flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 overflow-hidden`}>
                        {serverIcon?.startsWith("http") || serverIcon?.startsWith("data:") ? (
                            <img src={serverIcon} alt={serverName} className="w-full h-full object-cover" />
                        ) : (
                            <span>{serverIcon || serverName[0]?.toUpperCase()}</span>
                        )}
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-white leading-tight">Invite friends to {serverName}</h2>
                        <p className="text-xs text-zinc-400 mt-0.5">Share this link to let others join your server.</p>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-5">
                    {loading ? (
                        <div className="py-8 text-center text-zinc-400 text-sm flex flex-col items-center gap-2">
                            <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                            <span>Generating secure invite link...</span>
                        </div>
                    ) : error ? (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                                    Server Invite Link
                                </label>

                                <div className="flex items-center gap-2 bg-[#1e1f22] p-1.5 rounded-lg border border-zinc-700/80 focus-within:border-indigo-500 transition">
                                    <input
                                        type="text"
                                        readOnly
                                        value={inviteLink}
                                        className="w-full bg-transparent text-zinc-200 text-sm px-3 outline-none font-mono selection:bg-indigo-600/40"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className={`px-4 py-2 rounded-md font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-md ${
                                            copied
                                                ? "bg-green-600 text-white"
                                                : "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95"
                                        }`}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800">
                                <span>Invite expires: <strong className="text-zinc-300 font-semibold">{expiresAt ? new Date(expiresAt).toLocaleDateString() : "Never"}</strong></span>
                                <span>Max uses: <strong className="text-zinc-300 font-semibold">{maxUses > 0 ? maxUses : "Unlimited"}</strong></span>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 bg-[#2b2d31] flex justify-between items-center border-t border-zinc-800 text-xs text-zinc-400">
                    <span>Need custom expiration or use limits?</span>
                    <button
                        onClick={onClose}
                        className="text-zinc-300 hover:text-white font-bold hover:underline"
                    >
                        Done
                    </button>
                </div>
            </motion.div>
        </div>
    );

    if (typeof document === "undefined") return null;
    return createPortal(modalContent, document.body);
}
