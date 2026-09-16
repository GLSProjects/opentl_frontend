"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Search, Users, Compass, CheckCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Community {
    id: string;
    name: string;
    icon: string;
    color: string;
    server_type: "community" | "friends";
    memberCount: number;
}

interface JoinedServer {
    _id?: string;
    id: string;
    name: string;
    icon: string;
    color: string;
    channels: { id: string; name: string; type: "text" | "voice" }[];
}

interface DiscoverCommunitiesModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called when user joins a new community so the sidebar updates immediately */
    onServerJoined: (server: JoinedServer) => void;
    /** IDs of servers the user has already joined – used to show "Joined" state */
    joinedServerIds: string[];
}

// ─── Join State per server ─────────────────────────────────────────────────────

type JoinState = "idle" | "joining" | "joined" | "already";

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DiscoverCommunitiesModal({
    isOpen,
    onClose,
    onServerJoined,
    joinedServerIds,
}: DiscoverCommunitiesModalProps) {
    const { user } = useAuth();

    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [communities, setCommunities] = useState<Community[]>([]);
    const [searchState, setSearchState] = useState<"initial" | "loading" | "results" | "empty" | "error">("initial");
    const [joinStates, setJoinStates] = useState<Record<string, JoinState>>({});
    const [toast, setToast] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Reset on open ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setDebouncedQuery("");
            setCommunities([]);
            setSearchState("initial");
            setJoinStates({});
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // ── ESC to close ───────────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        if (isOpen) window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    // ── Debounce user input (400 ms) ───────────────────────────────────────────
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 400);
        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [query]);

    // ── Fetch when debounced query changes ─────────────────────────────────────
    useEffect(() => {
        if (!debouncedQuery) {
            setCommunities([]);
            setSearchState("initial");
            return;
        }
        fetchCommunities(debouncedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQuery]);

    const fetchCommunities = useCallback(async (q: string) => {
        if (!user?.token) {
            setSearchState("error");
            return;
        }
        setSearchState("loading");
        try {
            const res = await fetch(
                `${api.base}/api/communities/search?q=${encodeURIComponent(q)}&limit=20`,
                { headers: api.authHeaders(user.token) }
            );
            if (!res.ok) throw new Error("API error");
            const data = await res.json();
            const list: Community[] = data.communities ?? [];
            setCommunities(list);
            setSearchState(list.length === 0 ? "empty" : "results");
        } catch {
            setSearchState("error");
        }
    }, [user]);

    // ── Join handler ───────────────────────────────────────────────────────────
    const handleJoin = async (community: Community) => {
        if (!user?.token) return;
        const sid = community.id.toString();
        setJoinStates(prev => ({ ...prev, [sid]: "joining" }));
        try {
            const res = await fetch(`${api.base}/api/servers/${sid}/join`, {
                method: "POST",
                headers: api.authHeaders(user.token),
            });
            const data = await res.json();
            if (res.ok) {
                setJoinStates(prev => ({ ...prev, [sid]: "joined" }));
                // Update member count locally
                setCommunities(prev =>
                    prev.map(c =>
                        c.id.toString() === sid
                            ? { ...c, memberCount: c.memberCount + (data.message === "Already a member" ? 0 : 1) }
                            : c
                    )
                );
                // Push server to sidebar
                if (data.server) {
                    const s = data.server;
                    const transformed: JoinedServer = {
                        _id: s._id,
                        id: s._id,
                        name: s.name,
                        icon: s.icon,
                        color: s.color,
                        channels: (s.channels || []).map((c: any) => ({
                            id: c._id || c.id,
                            name: c.name,
                            type: c.type,
                        })),
                    };
                    onServerJoined(transformed);
                }
                // Short toast notification
                setToast(`Joined ${community.name}`);
                setTimeout(() => setToast(null), 3000);
            } else {
                setJoinStates(prev => ({ ...prev, [sid]: "idle" }));
                alert(data.message || "Failed to join community.");
            }
        } catch {
            setJoinStates(prev => ({ ...prev, [sid]: "idle" }));
        }
    };

    const isAlreadyJoined = (id: string) =>
        joinedServerIds.includes(id.toString()) ||
        joinStates[id.toString()] === "joined" ||
        joinStates[id.toString()] === "already";

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-2xl bg-[#313338] rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="px-6 pt-6 pb-4 border-b border-zinc-800 shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                                <Compass className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Discover Communities</h2>
                                <p className="text-xs text-zinc-400">Find and join public community servers</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* ── Search input ── */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search communities by name..."
                            className="w-full bg-[#1e1f22] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none border border-zinc-700 focus:border-indigo-500 transition placeholder-zinc-500"
                        />
                        {searchState === "loading" && (
                            <Loader2 className="w-4 h-4 text-indigo-400 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin" />
                        )}
                    </div>
                </div>

                {/* ── Results area ── */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* Initial state */}
                    {searchState === "initial" && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                                <Compass className="w-8 h-8 text-indigo-400" />
                            </div>
                            <p className="text-zinc-300 font-semibold">Find a community to join</p>
                            <p className="text-xs text-zinc-500 mt-1">Search for a community by name above</p>
                        </div>
                    )}

                    {/* Loading skeletons */}
                    {searchState === "loading" && (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-[#2b2d31] rounded-xl p-4 border border-zinc-800 flex items-center gap-4 animate-pulse"
                                >
                                    <div className="w-12 h-12 rounded-full bg-zinc-700 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-zinc-700 rounded w-1/3" />
                                        <div className="h-3 bg-zinc-800 rounded w-1/4" />
                                    </div>
                                    <div className="w-16 h-8 bg-zinc-700 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No results */}
                    {searchState === "empty" && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                                <Search className="w-7 h-7 text-zinc-500" />
                            </div>
                            <p className="text-zinc-300 font-semibold">No communities found</p>
                            <p className="text-xs text-zinc-500 mt-1">
                                No communities found for &ldquo;<span className="text-zinc-300">{debouncedQuery}</span>&rdquo;
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {searchState === "error" && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-14 h-14 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-4">
                                <AlertCircle className="w-7 h-7 text-red-400" />
                            </div>
                            <p className="text-zinc-300 font-semibold">Unable to load communities</p>
                            <p className="text-xs text-zinc-500 mt-1">Please try again later.</p>
                            <button
                                onClick={() => fetchCommunities(debouncedQuery)}
                                className="mt-4 text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg transition"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Results */}
                    {searchState === "results" && (
                        <AnimatePresence>
                            {communities.map((community, idx) => {
                                const sid = community.id.toString();
                                const jsState = joinStates[sid] ?? "idle";
                                const joined = isAlreadyJoined(sid);

                                return (
                                    <motion.div
                                        key={sid}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="bg-[#2b2d31] rounded-xl border border-zinc-800 hover:border-zinc-700 transition p-4 flex items-center gap-4"
                                    >
                                        {/* Icon */}
                                        <div
                                            className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden border-2 border-zinc-700",
                                                community.icon.startsWith("http") || community.icon.startsWith("data:")
                                                    ? ""
                                                    : community.color
                                            )}
                                        >
                                            {community.icon.startsWith("http") || community.icon.startsWith("data:") ? (
                                                <img src={community.icon} alt={community.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{community.icon}</span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white text-sm truncate">{community.name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Users className="w-3 h-3 text-zinc-400 shrink-0" />
                                                <span className="text-xs text-zinc-400">
                                                    {community.memberCount.toLocaleString()} member{community.memberCount !== 1 ? "s" : ""}
                                                </span>
                                                <span className="text-zinc-700">•</span>
                                                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                                                    Community
                                                </span>
                                            </div>
                                        </div>

                                        {/* Join / Joined */}
                                        {joined ? (
                                            <button
                                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600/20 border border-green-600/40 text-green-400 rounded-lg text-xs font-bold cursor-default"
                                                disabled
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Joined
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleJoin(community)}
                                                disabled={jsState === "joining"}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition shrink-0",
                                                    jsState === "joining"
                                                        ? "bg-indigo-600/40 text-indigo-300 cursor-not-allowed"
                                                        : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95"
                                                )}
                                            >
                                                {jsState === "joining" ? (
                                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" />Joining...</>
                                                ) : (
                                                    <><ArrowRight className="w-3.5 h-3.5" />Join</>
                                                )}
                                            </button>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>

                {/* ── Footer with result count ── */}
                {searchState === "results" && (
                    <div className="px-6 py-3 border-t border-zinc-800 shrink-0">
                        <p className="text-[11px] text-zinc-500 text-center">
                            Showing {communities.length} communit{communities.length === 1 ? "y" : "ies"} matching &ldquo;{debouncedQuery}&rdquo;
                        </p>
                    </div>
                )}
            </motion.div>

            {/* ── Toast notification ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="toast"
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10001] bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return createPortal(modalContent, document.body);
}
