"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    X,
    Camera,
    Trash2,
    Hash,
    Volume2,
    Check,
    AlertTriangle,
    Shield,
    UserX,
    Plus,
    Copy,
    Users,
    SlidersHorizontal,
    Link as LinkIcon,
    Search,
    RefreshCw,
    Globe,
    Lock,
    Sparkles,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";

interface Channel {
    id: string;
    name: string;
    type: "text" | "voice";
}

interface MemberUser {
    _id?: string;
    id?: string;
    username: string;
    displayName?: string;
    avatar?: string;
    email?: string;
}

interface ServerMember {
    user: MemberUser;
    role: "owner" | "moderator" | "member";
    joinedAt?: string;
}

interface Server {
    id: string;
    name: string;
    icon: string;
    color: string;
    server_type?: "community" | "friends";
    visibility?: "public" | "private";
    members?: ServerMember[];
    channels: Channel[];
    owner?: string;
}

interface InviteItem {
    _id: string;
    code: string;
    link: string;
    createdBy?: MemberUser;
    maxUses: number;
    uses: number;
    expiresAt?: string;
    createdAt: string;
}

interface EditServerModalProps {
    server: Server;
    isOpen: boolean;
    onClose: () => void;
    onServerUpdated: (updatedServer: Server) => void;
    onServerDeleted?: (serverId: string) => void;
}

const COLOR_OPTIONS = [
    { label: "Red", value: "bg-red-600", hex: "#dc2626" },
    { label: "Blue", value: "bg-blue-600", hex: "#2563eb" },
    { label: "Green", value: "bg-green-600", hex: "#16a34a" },
    { label: "Purple", value: "bg-purple-600", hex: "#9333ea" },
    { label: "Orange", value: "bg-orange-500", hex: "#f97316" },
    { label: "Pink", value: "bg-pink-600", hex: "#db2777" },
    { label: "Yellow", value: "bg-yellow-500", hex: "#eab308" },
    { label: "Teal", value: "bg-teal-600", hex: "#0d9488" },
    { label: "Indigo", value: "bg-indigo-600", hex: "#4f46e5" },
    { label: "Zinc", value: "bg-zinc-600", hex: "#52525b" },
];

export default function EditServerModal({
    server,
    isOpen,
    onClose,
    onServerUpdated,
    onServerDeleted,
}: EditServerModalProps) {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<"overview" | "channels" | "members" | "invites">("overview");

    const [name, setName] = useState(server.name);
    const [icon, setIcon] = useState(server.icon);
    const [color, setColor] = useState(server.color);
    const [visibility, setVisibility] = useState<"public" | "private">(server.visibility || (server.server_type === "community" ? "public" : "private"));
    const [channels, setChannels] = useState<Channel[]>(server.channels);
    const [members, setMembers] = useState<ServerMember[]>(server.members || []);

    const [memberSearch, setMemberSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "owner" | "moderator" | "member">("all");

    const [invites, setInvites] = useState<InviteItem[]>([]);
    const [loadingInvites, setLoadingInvites] = useState(false);
    const [maxUsesInput, setMaxUsesInput] = useState<number>(0);
    const [expiresHoursInput, setExpiresHoursInput] = useState<number>(0);
    const [creatingInvite, setCreatingInvite] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState("");
    const [deletingChannelId, setDeletingChannelId] = useState<string | null>(null);
    const [kickingUserId, setKickingUserId] = useState<string | null>(null);
    const [showDeleteServerModal, setShowDeleteServerModal] = useState(false);
    const [deleteServerConfirmText, setDeleteServerConfirmText] = useState("");
    const [deletingServer, setDeletingServer] = useState(false);
    const [deleteServerError, setDeleteServerError] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const isOwner = user?._id === server.owner;

    /* Sync state on server prop or visibility changes */
    useEffect(() => {
        setName(server.name);
        setIcon(server.icon);
        setColor(server.color);
        setVisibility(server.visibility || (server.server_type === "community" ? "public" : "private"));
        setChannels(server.channels);
        setMembers(server.members || []);
        setError("");
        setSaveSuccess(false);
    }, [server, isOpen]);

    /* Fetch active invites when invites tab is clicked */
    useEffect(() => {
        if (isOpen && activeTab === "invites" && user?.token) {
            fetchInvites();
        }
    }, [isOpen, activeTab, user?.token]);

    const fetchInvites = async () => {
        setLoadingInvites(true);
        try {
            const res = await fetch(`${api.base}/api/invite/server/${server.id}`, {
                headers: api.authHeaders(user!.token),
            });
            if (res.ok) {
                const data = await res.json();
                setInvites(data);
            }
        } catch (err) {
            console.error("Failed to fetch server invites", err);
        } finally {
            setLoadingInvites(false);
        }
    };

    if (!isOpen) return null;

    const hasChanges =
        name !== server.name ||
        icon !== server.icon ||
        color !== server.color ||
        visibility !== server.visibility;

    const handleResetOverview = () => {
        setName(server.name);
        setIcon(server.icon);
        setColor(server.color);
        setVisibility(server.visibility || (server.server_type === "community" ? "public" : "private"));
        setError("");
    };

    const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => setIcon(reader.result as string);
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const handleDeleteServer = async () => {
        if (deleteServerConfirmText !== server.name) return;
        setDeletingServer(true);
        setDeleteServerError("");
        try {
            const res = await fetch(`${api.base}/api/servers/${server.id}`, {
                method: "DELETE",
                headers: api.authHeaders(user!.token),
            });
            if (res.ok) {
                setShowDeleteServerModal(false);
                onClose();
                onServerDeleted?.(server.id);
            } else {
                const data = await res.json();
                setDeleteServerError(data.message || "Failed to delete server.");
            }
        } catch {
            setDeleteServerError("Network error. Please try again.");
        } finally {
            setDeletingServer(false);
        }
    };

    const handleSaveOverview = async () => {
        if (!name.trim()) return setError("Server name cannot be empty.");

        setSaving(true);
        setError("");

        try {
            const res = await fetch(`${api.base}/api/servers/${server.id}`, {
                method: "PUT",
                headers: api.authHeaders(user!.token),
                body: JSON.stringify({ name: name.trim(), icon, color, visibility }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Failed to save changes.");
                return;
            }

            onServerUpdated({
                ...server,
                name: data.name,
                icon: data.icon,
                color: data.color,
                visibility: data.visibility,
                server_type: data.server_type,
                members: data.members || members,
                channels,
            });

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteChannel = async (channelId: string) => {
        setDeletingChannelId(null);

        try {
            const res = await fetch(`${api.base}/api/servers/${server.id}/channels/${channelId}`, {
                method: "DELETE",
                headers: api.authHeaders(user!.token),
            });

            if (res.ok) {
                const updated = channels.filter((c) => c.id !== channelId);
                setChannels(updated);
                onServerUpdated({ ...server, name, icon, color, channels: updated });
            }
        } catch {
            console.error("Failed to delete channel");
        }
    };

    const handleUpdateRole = async (userId: string, newRole: "moderator" | "member") => {
        try {
            const res = await fetch(`${api.base}/api/servers/${server.id}/members/${userId}/role`, {
                method: "PUT",
                headers: api.authHeaders(user!.token),
                body: JSON.stringify({ role: newRole }),
            });

            const data = await res.json();
            if (res.ok) {
                setMembers(data.members || []);
                onServerUpdated(data);
            } else {
                alert(data.message || "Failed to update member role");
            }
        } catch (err) {
            console.error("Failed to update role", err);
        }
    };

    const handleKickMember = async (userId: string) => {
        setKickingUserId(null);
        try {
            const res = await fetch(`${api.base}/api/servers/${server.id}/members/${userId}`, {
                method: "DELETE",
                headers: api.authHeaders(user!.token),
            });

            const data = await res.json();
            if (res.ok) {
                const updatedMembers = data.server?.members || members.filter(m => (m.user?._id || m.user?.id) !== userId);
                setMembers(updatedMembers);
                if (data.server) onServerUpdated(data.server);
            } else {
                alert(data.message || "Failed to kick member");
            }
        } catch (err) {
            console.error("Failed to kick member", err);
        }
    };

    const handleCreateCustomInvite = async () => {
        setCreatingInvite(true);
        try {
            const res = await fetch(`${api.base}/api/invite/${server.id}`, {
                method: "POST",
                headers: api.authHeaders(user!.token),
                body: JSON.stringify({
                    maxUses: maxUsesInput,
                    expiresAtHours: expiresHoursInput,
                }),
            });

            if (res.ok) {
                await fetchInvites();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to create invite");
            }
        } catch (err) {
            console.error("Failed to create invite", err);
        } finally {
            setCreatingInvite(false);
        }
    };

    const handleRevokeInvite = async (code: string) => {
        try {
            const res = await fetch(`${api.base}/api/invite/${server.id}/${code}`, {
                method: "DELETE",
                headers: api.authHeaders(user!.token),
            });
            if (res.ok) {
                setInvites(prev => prev.filter(inv => inv.code !== code));
            }
        } catch (err) {
            console.error("Failed to revoke invite", err);
        }
    };

    const copyInviteLink = (link: string, code: string) => {
        navigator.clipboard.writeText(link);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Filtered members list
    const filteredMembers = members.filter((m) => {
        const uName = (m.user?.displayName || m.user?.username || "").toLowerCase();
        const matchesSearch = uName.includes(memberSearch.toLowerCase());
        const matchesRole = roleFilter === "all" ? true : m.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    interface TabItem {
        id: "overview" | "channels" | "members" | "invites";
        label: string;
        icon: React.ComponentType<{ className?: string }>;
        badge?: number;
    }

    const TAB_CONFIG: TabItem[] = [
        { id: "overview", label: "Overview", icon: SlidersHorizontal },
        { id: "channels", label: "Channels", icon: Hash },
        { id: "members", label: "Members", icon: Users, badge: members.length },
        { id: "invites", label: "Invites", icon: LinkIcon, badge: invites.length },
    ];

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="bg-[#313338] w-full max-w-4xl h-[90vh] sm:h-[80vh] rounded-2xl shadow-2xl flex flex-col sm:flex-row overflow-hidden relative border border-zinc-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile Navigation Header */}
                <div className="sm:hidden bg-[#2b2d31] p-4 border-b border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-bold text-white truncate">{server.name} Settings</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                        {TAB_CONFIG.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "px-2 py-2 rounded-lg text-xs transition flex flex-col items-center gap-1 text-center truncate",
                                        activeTab === tab.id
                                            ? "bg-zinc-700 text-white font-bold"
                                            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                                    )}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar Navigation (Desktop) */}
                <div className="hidden sm:flex w-64 bg-[#2b2d31] p-4 flex-col gap-1 shrink-0 border-r border-black/30 justify-between">
                    <div className="space-y-1">
                        <div className="px-3 py-2 flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Server Settings
                            </span>
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider",
                                server.server_type === "community"
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            )}>
                                {server.server_type || "Friends"}
                            </span>
                        </div>

                        {TAB_CONFIG.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full text-left px-3 py-2.5 rounded-lg text-sm transition font-medium flex items-center justify-between group",
                                        isActive
                                            ? "bg-zinc-700 text-white shadow-sm"
                                            : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-red-500" : "text-zinc-500 group-hover:text-zinc-300")} />
                                        <span>{tab.label}</span>
                                    </div>
                                    {tab.badge !== undefined && tab.badge > 0 && (
                                        <span className="text-[11px] bg-zinc-800 group-hover:bg-zinc-900 px-2 py-0.5 rounded-full text-zinc-400 font-mono font-bold">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Desktop Close Button at bottom of sidebar */}
                    <div className="pt-4 border-t border-zinc-800/60">
                        <button
                            onClick={onClose}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                        >
                            <span>ESC to close</span>
                            <div className="border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] text-zinc-400">
                                ESC
                            </div>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto relative p-6 flex flex-col justify-between">
                    <div>
                        {/* OVERVIEW TAB */}
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Server Overview</h2>
                                        <p className="text-xs text-zinc-400 mt-1">Manage your server's identity, avatar, and discoverability settings.</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="hidden sm:flex p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start bg-[#2b2d31] p-5 rounded-xl border border-zinc-800">
                                    {/* Avatar */}
                                    <div className="relative group">
                                        <div
                                            className={cn(
                                                "w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl overflow-hidden cursor-pointer active:scale-95 transition shadow-xl border-2 border-zinc-700",
                                                icon.startsWith("http") || icon.startsWith("data:")
                                                    ? ""
                                                    : color
                                            )}
                                            onClick={() => isOwner && fileInputRef.current?.click()}
                                        >
                                            {icon.startsWith("http") || icon.startsWith("data:") ? (
                                                <img
                                                    src={icon}
                                                    alt="server"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span>{icon}</span>
                                            )}
                                        </div>

                                        {isOwner && (
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold transition cursor-pointer"
                                            >
                                                <Camera className="w-5 h-5 mb-1" />
                                                <span>CHANGE</span>
                                            </div>
                                        )}

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleIconUpload}
                                        />
                                    </div>

                                    {/* Inputs */}
                                    <div className="flex-1 w-full space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 uppercase mb-1.5 block">
                                                Server Name
                                            </label>
                                            <input
                                                ref={nameInputRef}
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                maxLength={100}
                                                disabled={!isOwner}
                                                className="w-full bg-[#1e1f22] text-white rounded-lg px-3.5 py-2.5 text-sm outline-none border border-zinc-700 focus:border-red-500 transition disabled:opacity-50 font-medium"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 uppercase mb-1.5 block">
                                                Server Access & Visibility
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={visibility}
                                                    onChange={(e) => setVisibility(e.target.value as "public" | "private")}
                                                    disabled={!isOwner}
                                                    className="w-full bg-[#1e1f22] text-white rounded-lg px-3.5 py-2.5 text-sm outline-none border border-zinc-700 focus:border-red-500 transition disabled:opacity-50 font-medium appearance-none cursor-pointer"
                                                >
                                                    <option value="private">🔒 Private (Only users with invite link can join)</option>
                                                    <option value="public">🌐 Public (Discoverable and open to all users)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Color Picker */}
                                {isOwner && (
                                    <div className="bg-[#2b2d31] p-5 rounded-xl border border-zinc-800 space-y-3">
                                        <label className="text-xs font-bold text-zinc-400 uppercase block">
                                            Server Icon Accent Color
                                        </label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {COLOR_OPTIONS.map((c) => (
                                                <button
                                                    key={c.value}
                                                    onClick={() => setColor(c.value)}
                                                    style={{ background: c.hex }}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full transition relative flex items-center justify-center",
                                                        color === c.value
                                                            ? "ring-2 ring-white scale-110 shadow-lg"
                                                            : "hover:scale-105 opacity-80 hover:opacity-100"
                                                    )}
                                                >
                                                    {color === c.value && <Check className="w-4 h-4 text-white drop-shadow" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Danger Zone - Delete Server (owner only) */}
                                {isOwner && (
                                    <div className="bg-red-950/20 border border-red-800/40 rounded-xl p-5 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                                            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Danger Zone</span>
                                        </div>
                                        <p className="text-xs text-zinc-400 leading-relaxed">
                                            Permanently delete <strong className="text-white">{server.name}</strong>. This action <strong className="text-red-400">cannot be undone</strong>. All channels, messages, and member data will be lost forever.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setDeleteServerConfirmText("");
                                                setDeleteServerError("");
                                                setShowDeleteServerModal(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600 border border-red-600/50 hover:border-red-600 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-all duration-200"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete This Server
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CHANNELS TAB */}
                        {activeTab === "channels" && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Manage Server Channels</h2>
                                        <p className="text-xs text-zinc-400 mt-1">Organize text and voice communication channels.</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="hidden sm:flex p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {channels.map((channel) => (
                                        <div
                                            key={channel.id}
                                            className="flex items-center justify-between bg-[#2b2d31] rounded-xl px-4 py-3 border border-zinc-800/80 hover:border-zinc-700 transition"
                                        >
                                            <div className="flex items-center gap-3 text-zinc-300">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                                                    {channel.type === "text" ? (
                                                        <Hash className="w-4 h-4 text-zinc-400" />
                                                    ) : (
                                                        <Volume2 className="w-4 h-4 text-indigo-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-sm text-white">{channel.name}</span>
                                                    <span className="text-[11px] text-zinc-400 block capitalize">{channel.type} Channel</span>
                                                </div>
                                            </div>

                                            {isOwner && (
                                                <button
                                                    onClick={() => setDeletingChannelId(channel.id)}
                                                    className="p-2 hover:bg-red-600/20 rounded-lg text-zinc-400 hover:text-red-400 transition"
                                                    title="Delete Channel"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <AnimatePresence>
                                    {deletingChannelId && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                                            onClick={() => setDeletingChannelId(null)}
                                        >
                                            <div
                                                className="bg-[#313338] rounded-2xl p-6 w-full max-w-sm border border-zinc-700 shadow-2xl space-y-4"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <h3 className="text-white font-bold text-lg">Delete Channel?</h3>
                                                <p className="text-sm text-zinc-400">
                                                    Are you sure you want to delete this channel? All messages in this channel will be permanently removed.
                                                </p>
                                                <div className="flex gap-3 pt-2">
                                                    <button
                                                        onClick={() => setDeletingChannelId(null)}
                                                        className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2.5 rounded-xl text-white font-semibold text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteChannel(deletingChannelId)}
                                                        className="flex-1 bg-red-600 hover:bg-red-700 py-2.5 rounded-xl text-white font-semibold text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* MEMBERS TAB */}
                        {activeTab === "members" && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Server Members</h2>
                                        <p className="text-xs text-zinc-400 mt-1">Manage user roles and server access permissions.</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="hidden sm:flex p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Filters */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                                        <input
                                            type="text"
                                            placeholder="Search members..."
                                            value={memberSearch}
                                            onChange={(e) => setMemberSearch(e.target.value)}
                                            className="w-full bg-[#1e1f22] text-white text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none border border-zinc-800 focus:border-red-500 transition"
                                        />
                                    </div>

                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value as any)}
                                        className="bg-[#1e1f22] text-white text-xs font-semibold rounded-xl px-3 py-2.5 outline-none border border-zinc-800 focus:border-red-500 cursor-pointer"
                                    >
                                        <option value="all">All Roles ({members.length})</option>
                                        <option value="owner">Owners</option>
                                        <option value="moderator">Moderators</option>
                                        <option value="member">Members</option>
                                    </select>
                                </div>

                                {/* Members List */}
                                <div className="space-y-2">
                                    {filteredMembers.length === 0 ? (
                                        <div className="text-center py-8 text-zinc-500 text-sm bg-[#2b2d31] rounded-xl border border-zinc-800">
                                            No members found matching filter criteria.
                                        </div>
                                    ) : (
                                        filteredMembers.map((member, idx) => {
                                            const memberUser = member.user || {};
                                            const memberId = memberUser._id || memberUser.id || `m-${idx}`;
                                            const isSelf = memberId === user?._id;

                                            return (
                                                <div
                                                    key={memberId}
                                                    className="flex items-center justify-between bg-[#2b2d31] rounded-xl p-3.5 border border-zinc-800/80"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {memberUser.avatar ? (
                                                            <img src={memberUser.avatar} className="w-9 h-9 rounded-full object-cover border border-zinc-700" />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                                                                {memberUser.username?.[0]?.toUpperCase() || "M"}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-white text-sm">
                                                                    {memberUser.displayName || memberUser.username || "User"}
                                                                </span>
                                                                {isSelf && (
                                                                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-zinc-400 block">{memberUser.email || `@${memberUser.username}`}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {/* Role Switcher */}
                                                        {isOwner && member.role !== "owner" ? (
                                                            <select
                                                                value={member.role}
                                                                onChange={(e) => handleUpdateRole(memberId, e.target.value as "moderator" | "member")}
                                                                className="bg-[#1e1f22] text-xs font-semibold text-zinc-200 border border-zinc-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500 cursor-pointer"
                                                            >
                                                                <option value="member">Member</option>
                                                                <option value="moderator">Moderator</option>
                                                            </select>
                                                        ) : (
                                                            <span className={cn(
                                                                "text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider border",
                                                                member.role === "owner"
                                                                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                                                    : member.role === "moderator"
                                                                        ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                                                                        : "bg-zinc-800 text-zinc-400 border-zinc-700/50"
                                                            )}>
                                                                {member.role}
                                                            </span>
                                                        )}

                                                        {/* Kick Button */}
                                                        {isOwner && member.role !== "owner" && !isSelf && (
                                                            <button
                                                                onClick={() => setKickingUserId(memberId)}
                                                                className="p-1.5 hover:bg-red-600/20 rounded-lg text-zinc-400 hover:text-red-400 transition"
                                                                title="Kick Member"
                                                            >
                                                                <UserX className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <AnimatePresence>
                                    {kickingUserId && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                                            onClick={() => setKickingUserId(null)}
                                        >
                                            <div
                                                className="bg-[#313338] rounded-2xl p-6 w-full max-w-sm border border-zinc-700 shadow-2xl space-y-4"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <h3 className="text-white font-bold text-lg">Kick Member?</h3>
                                                <p className="text-sm text-zinc-400">
                                                    Are you sure you want to remove this member from the server? They will lose access to all channels.
                                                </p>
                                                <div className="flex gap-3 pt-2">
                                                    <button
                                                        onClick={() => setKickingUserId(null)}
                                                        className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2.5 rounded-xl text-white font-semibold text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleKickMember(kickingUserId)}
                                                        className="flex-1 bg-red-600 hover:bg-red-700 py-2.5 rounded-xl text-white font-semibold text-sm"
                                                    >
                                                        Kick
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* INVITES TAB */}
                        {activeTab === "invites" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Invite Management</h2>
                                        <p className="text-xs text-zinc-400 mt-1">Generate and revoke server invitation links.</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="hidden sm:flex p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Custom Invite Box */}
                                <div className="bg-[#2b2d31] border border-zinc-800 rounded-xl p-5 space-y-4">
                                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Create Custom Invite Link</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-zinc-400 font-bold block mb-1.5">Max Uses</label>
                                            <select
                                                value={maxUsesInput}
                                                onChange={(e) => setMaxUsesInput(Number(e.target.value))}
                                                className="w-full bg-[#1e1f22] text-white border border-zinc-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-500 font-medium"
                                            >
                                                <option value={0}>No limit</option>
                                                <option value={1}>1 use</option>
                                                <option value={5}>5 uses</option>
                                                <option value={10}>10 uses</option>
                                                <option value={25}>25 uses</option>
                                                <option value={50}>50 uses</option>
                                                <option value={100}>100 uses</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs text-zinc-400 font-bold block mb-1.5">Expire After</label>
                                            <select
                                                value={expiresHoursInput}
                                                onChange={(e) => setExpiresHoursInput(Number(e.target.value))}
                                                className="w-full bg-[#1e1f22] text-white border border-zinc-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-500 font-medium"
                                            >
                                                <option value={0}>Never expire</option>
                                                <option value={1}>1 Hour</option>
                                                <option value={6}>6 Hours</option>
                                                <option value={12}>12 Hours</option>
                                                <option value={24}>24 Hours (1 Day)</option>
                                                <option value={168}>7 Days</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCreateCustomInvite}
                                        disabled={creatingInvite}
                                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {creatingInvite ? "Creating..." : "Generate Invite Link"}
                                    </button>
                                </div>

                                {/* Active Invites List */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Invites</h3>

                                    {loadingInvites ? (
                                        <div className="text-center py-6 text-zinc-500 text-xs">Loading invites...</div>
                                    ) : invites.length === 0 ? (
                                        <div className="text-center py-6 text-zinc-500 text-xs bg-[#2b2d31] rounded-xl border border-zinc-800">
                                            No active invites for this server.
                                        </div>
                                    ) : (
                                        invites.map((inv) => (
                                            <div
                                                key={inv._id}
                                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#2b2d31] border border-zinc-800/80 rounded-xl p-3.5 gap-3"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-indigo-400 text-sm">{inv.code}</span>
                                                        <button
                                                            onClick={() => copyInviteLink(inv.link, inv.code)}
                                                            className="text-zinc-400 hover:text-white p-1 rounded transition"
                                                            title="Copy Link"
                                                        >
                                                            {copiedCode === inv.code ? (
                                                                <Check className="w-3.5 h-3.5 text-green-400" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                                                        <span>Uses: <strong className="text-zinc-200">{inv.uses}</strong> / {inv.maxUses > 0 ? inv.maxUses : "∞"}</span>
                                                        <span>•</span>
                                                        <span>Expires: <strong className="text-zinc-200">{inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : "Never"}</strong></span>
                                                        {inv.createdBy?.username && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Creator: <strong className="text-zinc-200">@{inv.createdBy.username}</strong></span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleRevokeInvite(inv.code)}
                                                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs font-bold transition self-end sm:self-center"
                                                >
                                                    Revoke
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Discord-Style Floating Unsaved Changes Bar */}
                    <AnimatePresence>
                        {hasChanges && activeTab === "overview" && (
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="sticky bottom-0 left-0 right-0 bg-[#111214] border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between shadow-2xl mt-6 z-20"
                            >
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span className="text-xs font-bold text-white">Careful — you have unsaved changes!</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleResetOverview}
                                        className="px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:underline transition"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={handleSaveOverview}
                                        disabled={saving}
                                        className="bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition shadow"
                                    >
                                        {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );

    if (typeof document === "undefined") return null;
    return createPortal(
        <>
            {modalContent}

            {/* Delete Server Confirmation Modal */}
            <AnimatePresence>
                {showDeleteServerModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4"
                        onClick={() => setShowDeleteServerModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="bg-[#313338] rounded-2xl p-6 w-full max-w-md border border-red-800/50 shadow-2xl space-y-5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center shrink-0">
                                    <Trash2 className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">Delete ''{server.name}''</h3>
                                    <p className="text-xs text-zinc-400 mt-1">This action is permanent and cannot be reversed.</p>
                                </div>
                            </div>

                            {/* Warning Box */}
                            <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 space-y-2">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                    <ul className="text-xs text-red-300 space-y-1">
                                        <li>All channels and their messages will be deleted</li>
                                        <li>All members will be removed from the server</li>
                                        <li>All invite links will be revoked</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Confirmation Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">
                                    Type <strong className="text-white font-mono">{server.name}</strong> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={deleteServerConfirmText}
                                    onChange={(e) => setDeleteServerConfirmText(e.target.value)}
                                    placeholder={server.name}
                                    className="w-full bg-[#1e1f22] text-white rounded-xl px-4 py-2.5 text-sm outline-none border border-zinc-700 focus:border-red-500 transition placeholder-zinc-600 font-mono"
                                    autoFocus
                                />
                            </div>

                            {/* Error */}
                            {deleteServerError && (
                                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{deleteServerError}</span>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => setShowDeleteServerModal(false)}
                                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2.5 rounded-xl text-white font-semibold text-sm transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteServer}
                                    disabled={deleteServerConfirmText !== server.name || deletingServer}
                                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded-xl text-white font-bold text-sm transition flex items-center justify-center gap-2"
                                >
                                    {deletingServer ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</>
                                    ) : (
                                        <><Trash2 className="w-4 h-4" />Delete Server</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>,
        document.body
    );
}