"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Hash, Volume2, ChevronDown, Plus, Settings, UserPlus, Edit3, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import EditServerModal from "./EditServerModal";
import InviteModal from "./InviteModal";

interface Channel {
    _id: string;
    name: string;
    type: "text" | "voice";
}

interface ServerData {
    _id: string;
    name: string;
    icon: string;
    color: string;
    server_type?: "community" | "friends";
    visibility?: "public" | "private";
    members?: any[];
    channels: Channel[];
    owner?: string;
}

export default function ChannelList({ serverId }: { serverId: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();

    const [serverData, setServerData] = useState<ServerData | null>(null);
    const [loading, setLoading] = useState(true);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [leaveError, setLeaveError] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        const fetchServerDetails = async () => {
            if (!user?.token || !serverId) return;
            try {
                const res = await fetch(`${api.base}/api/servers/${serverId}`, {
                    headers: { Authorization: `Bearer ${user.token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setServerData(data);
                }
            } catch (error) {
                console.error("Failed to fetch server details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchServerDetails();
    }, [user?.token, serverId]);

    const isOwner = user?._id === serverData?.owner;
    const userMember = serverData?.members?.find((m: any) => {
        const uId = m?.user?._id || m?.user?.id || m?.user || m;
        return uId === user?._id;
    });
    const userRole = isOwner ? "owner" : (userMember?.role || "member");
    const canManage = userRole === "owner" || userRole === "moderator";

    const handleLeaveServer = async () => {
        if (!user?.token) return;
        setLeaving(true);
        setLeaveError("");
        try {
            const res = await fetch(`${api.base}/api/servers/${serverId}/leave`, {
                method: "POST",
                headers: api.authHeaders(user.token),
            });
            const data = await res.json();
            if (res.ok) {
                router.push("/dashboard");
            } else {
                setLeaveError(data.message || "Failed to leave server.");
            }
        } catch {
            setLeaveError("Network error while leaving server.");
        } finally {
            setLeaving(false);
        }
    };

    const handleServerUpdated = (updated: any) => {
        setServerData(prev => prev ? { ...prev, ...updated } : prev);
        setEditModalOpen(false);
    };

    if (loading) {
        return (
            <div className="hidden md:flex w-60 bg-zinc-900 h-full flex-col border-r border-black items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-600" />
            </div>
        );
    }

    const textChannels = (serverData?.channels || []).filter(c => c.type === "text");
    const voiceChannels = (serverData?.channels || []).filter(c => c.type === "voice");

    return (
        <div className="hidden md:flex w-60 bg-zinc-900 h-full flex-col border-r border-black overflow-hidden min-w-[240px]">
            {/* Server Header Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen(p => !p)}
                    className="w-full h-12 px-4 flex items-center justify-between border-b border-black hover:bg-zinc-800/50 transition"
                >
                    <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-white truncate">
                            {serverData?.name || serverId}
                        </span>
                        {serverData?.server_type === "community" && (
                            <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                                Community
                            </span>
                        )}
                    </div>
                    <ChevronDown className={cn("w-5 h-5 text-zinc-400 transition-transform shrink-0", dropdownOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                    {dropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.12 }}
                            className="absolute top-full left-2 right-2 z-50 bg-[#111214] border border-zinc-800 rounded-lg shadow-2xl p-1 mt-1"
                        >
                            <button
                                onClick={() => { setInviteModalOpen(true); setDropdownOpen(false); }}
                                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-indigo-400 hover:bg-indigo-500 hover:text-white transition group"
                            >
                                <UserPlus className="w-4 h-4 text-indigo-400 group-hover:text-white" />
                                Invite People
                            </button>

                            <div className="h-px bg-zinc-800 my-1" />

                            {canManage && (
                                <button
                                    onClick={() => { setEditModalOpen(true); setDropdownOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition group"
                                >
                                    <Edit3 className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                                    Server Settings
                                </button>
                            )}

                            <div className="h-px bg-zinc-800 my-1" />

                            <button
                                onClick={() => { setLeaveModalOpen(true); setDropdownOpen(false); }}
                                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-red-400 hover:bg-red-600/20 hover:text-red-300 transition"
                            >
                                <LogOut className="w-4 h-4" />
                                Leave Server
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Channel Sections */}
            <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
                {/* Text Channels */}
                {textChannels.length > 0 && (
                    <div>
                        <div className="px-2 flex items-center justify-between text-zinc-500 uppercase text-[12px] font-bold mb-1">
                            <span>Text Channels</span>
                        </div>
                        <div className="space-y-0.5">
                            {textChannels.map((channel) => {
                                const isActive = pathname?.includes(channel._id) || pathname?.includes(channel.name);
                                return (
                                    <button
                                        key={channel._id}
                                        onClick={() => router.push(`/server/${serverId}/channel/${channel.name}`)}
                                        className={cn(
                                            "w-full px-2 py-1.5 rounded-md flex items-center gap-2 cursor-pointer group transition text-left",
                                            isActive ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                                        )}
                                    >
                                        <Hash className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 shrink-0" />
                                        <span className="text-sm font-medium truncate">{channel.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Voice Channels */}
                {voiceChannels.length > 0 && (
                    <div>
                        <div className="px-2 flex items-center justify-between text-zinc-500 uppercase text-[12px] font-bold mb-1">
                            <span>Voice Channels</span>
                        </div>
                        <div className="space-y-0.5">
                            {voiceChannels.map((channel) => {
                                const isActive = pathname?.includes(channel._id) || pathname?.includes(channel.name);
                                return (
                                    <button
                                        key={channel._id}
                                        onClick={() => router.push(`/server/${serverId}/channel/${channel.name}`)}
                                        className={cn(
                                            "w-full px-2 py-1.5 rounded-md flex items-center gap-2 cursor-pointer group transition text-left",
                                            isActive ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                                        )}
                                    >
                                        <Volume2 className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 shrink-0" />
                                        <span className="text-sm font-medium truncate">{channel.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {editModalOpen && serverData && (
                    <EditServerModal
                        server={{
                            id: serverData._id,
                            name: serverData.name,
                            icon: serverData.icon,
                            color: serverData.color,
                            server_type: serverData.server_type,
                            visibility: serverData.visibility,
                            members: serverData.members,
                            channels: serverData.channels.map(c => ({ id: c._id, name: c.name, type: c.type })),
                            owner: serverData.owner,
                        }}
                        isOpen={editModalOpen}
                        onClose={() => setEditModalOpen(false)}
                        onServerUpdated={handleServerUpdated}
                        onServerDeleted={() => router.push("/dashboard")}
                    />
                )}

                {inviteModalOpen && serverData && (
                    <InviteModal
                        serverId={serverData._id}
                        serverName={serverData.name}
                        serverIcon={serverData.icon}
                        serverColor={serverData.color}
                        isOpen={inviteModalOpen}
                        onClose={() => setInviteModalOpen(false)}
                    />
                )}

                {leaveModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4"
                        onClick={() => setLeaveModalOpen(false)}
                    >
                        <div
                            className="bg-[#313338] border border-zinc-800 rounded-xl p-6 w-full max-w-sm shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-white font-bold text-lg mb-2">Leave '{serverData?.name}'?</h3>
                            <p className="text-zinc-400 text-sm mb-4">
                                Are you sure you want to leave this server? You won't be able to rejoin unless re-invited.
                            </p>
                            {leaveError && (
                                <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs font-semibold">
                                    {leaveError}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setLeaveModalOpen(false)}
                                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2.5 rounded-lg text-white font-semibold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLeaveServer}
                                    disabled={leaving}
                                    className="flex-1 bg-red-600 hover:bg-red-700 py-2.5 rounded-lg text-white font-semibold text-sm"
                                >
                                    {leaving ? "Leaving..." : "Leave Server"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}