"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Hash,
    Volume2,
    ChevronDown,
    Settings,
    Edit3,
    LogOut,
    UserPlus,
    Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useVoice } from "@/context/VoiceContext";
import { api } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";

import EditServerModal from "./EditServerModal";
import InviteModal from "./InviteModal";

/* =========================================================
   TYPES
========================================================= */

interface Channel {
    id: string;
    name: string;
    type: "text" | "voice";
}

interface ServerMember {
    user:
        | string
        | {
              _id?: string;
              id?: string;
          };
    role?: "owner" | "moderator" | "member";
}

interface Server {
    id: string;
    name: string;
    icon: string;
    color: string;
    channels: Channel[];
    owner?: string | { _id?: string; id?: string };
    server_type?: "private" | "community";
    members?: ServerMember[];
}

interface ChannelSidebarProps {
    server: Server;
    activeChannelId: string;
    onChannelSelect: (id: string) => void;
    onCreateChannel: () => void;
    onUserSettings: () => void;
    onServerUpdated: (updatedServer: Server) => void;
    onServerDeleted?: (serverId: string) => void;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ChannelSidebar({
    server,
    activeChannelId,
    onChannelSelect,
    onCreateChannel,
    onUserSettings,
    onServerUpdated,
    onServerDeleted,
}: ChannelSidebarProps) {
    const { user } = useAuth();
    const { globalVoiceState } = useVoice();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [leaveError, setLeaveError] = useState("");

    const dropdownRef = useRef<HTMLDivElement>(null);

    /* =========================================================
       CHANNEL FILTERING
    ========================================================= */

    const textChannels = server.channels.filter(
        (channel) => channel.type === "text"
    );

    const voiceChannels = server.channels.filter(
        (channel) => channel.type === "voice"
    );

    /* =========================================================
       CURRENT USER / ROLE
    ========================================================= */

    const getId = (
        value:
            | string
            | {
                  _id?: string;
                  id?: string;
              }
            | undefined
    ): string | undefined => {
        if (!value) return undefined;

        if (typeof value === "string") {
            return value;
        }

        return value._id || value.id;
    };

    const currentUserId = user?._id;

    const ownerId = getId(server.owner);

    const userMember = server.members?.find((member) => {
        const memberUserId = getId(member.user);

        return memberUserId === currentUserId;
    });

    const isOwner = currentUserId === ownerId;

    const userRole: "owner" | "moderator" | "member" = isOwner
        ? "owner"
        : userMember?.role || "member";

    const canManageChannels =
        userRole === "owner" || userRole === "moderator";

    /* =========================================================
       CLOSE DROPDOWN WHEN CLICKING OUTSIDE
    ========================================================= */

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    /* =========================================================
       LEAVE SERVER
    ========================================================= */

    const handleLeaveServer = async () => {
        if (!user?.token) {
            setLeaveError("You are not authenticated.");
            return;
        }

        setLeaving(true);
        setLeaveError("");

        try {
            const response = await fetch(
                `${api.base}/api/servers/${server.id}/leave`,
                {
                    method: "POST",
                    headers: api.authHeaders(user.token),
                }
            );

            let data: any = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (response.ok) {
                window.location.href = "/dashboard";
                return;
            }

            setLeaveError(
                data?.message || "Failed to leave server."
            );
        } catch (error) {
            console.error("Leave server error:", error);

            setLeaveError(
                "Network error while leaving server."
            );
        } finally {
            setLeaving(false);
        }
    };

    /* =========================================================
       OPEN CREATE CHANNEL
    ========================================================= */

    const handleCreateChannel = () => {
        if (!canManageChannels) {
            return;
        }

        onCreateChannel();
        setDropdownOpen(false);
    };

    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <>
            {/* =================================================
                SIDEBAR
            ================================================= */}

            <div className="w-60 bg-zinc-900 flex flex-col h-full border-r border-black shrink-0">

                {/* =================================================
                    SERVER HEADER
                ================================================= */}

                <div
                    className="relative"
                    ref={dropdownRef}
                >
                    <button
                        type="button"
                        onClick={() =>
                            setDropdownOpen((previous) => !previous)
                        }
                        className="w-full h-12 px-4 flex items-center justify-between border-b border-black hover:bg-zinc-800/50 transition"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-white truncate">
                                {server.name}
                            </span>

                            {server.server_type === "community" && (
                                <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                                    Community
                                </span>
                            )}
                        </div>

                        <ChevronDown
                            className={cn(
                                "w-5 h-5 text-zinc-400 transition-transform shrink-0",
                                dropdownOpen && "rotate-180"
                            )}
                        />
                    </button>

                    {/* =================================================
                        SERVER DROPDOWN
                    ================================================= */}

                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: -6,
                                    scale: 0.97,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: 1,
                                }}
                                exit={{
                                    opacity: 0,
                                    y: -6,
                                    scale: 0.97,
                                }}
                                transition={{
                                    duration: 0.12,
                                }}
                                className="absolute top-full left-2 right-2 z-50 bg-[#111214] border border-zinc-800 rounded-lg shadow-2xl p-1 mt-1"
                            >
                                {/* INVITE */}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setInviteModalOpen(true);
                                        setDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-indigo-400 hover:bg-indigo-500 hover:text-white transition group"
                                >
                                    <UserPlus className="w-4 h-4 text-indigo-400 group-hover:text-white" />

                                    Invite People
                                </button>

                                <div className="h-px bg-zinc-800 my-1" />

                                {/* SERVER SETTINGS */}

                                {canManageChannels && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditModalOpen(true);
                                            setDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-zinc-300 hover:bg-red-600 hover:text-white transition group"
                                    >
                                        <Edit3 className="w-4 h-4 text-zinc-400 group-hover:text-white" />

                                        Server Settings
                                    </button>
                                )}

                                {/* CREATE CHANNEL */}

                                {canManageChannels && (
                                    <button
                                        type="button"
                                        onClick={handleCreateChannel}
                                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                                    >
                                        <Plus className="w-4 h-4 text-zinc-400" />

                                        Create Channel
                                    </button>
                                )}

                                <div className="h-px bg-zinc-800 my-1" />

                                {/* LEAVE SERVER */}

                                <button
                                    type="button"
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-red-400 hover:bg-red-600/20 hover:text-red-300 transition"
                                    onClick={() => {
                                        setLeaveModalOpen(true);
                                        setLeaveError("");
                                        setDropdownOpen(false);
                                    }}
                                >
                                    <LogOut className="w-4 h-4" />

                                    Leave Server
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* =================================================
                    CHANNEL LIST
                ================================================= */}

                <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 shadow-[inset_0_10px_20px_rgba(0,0,0,0.1)] custom-scrollbar">

                    {/* =================================================
                        TEXT CHANNELS
                    ================================================= */}

                    <div>
                        <div className="px-2 flex items-center justify-between group cursor-pointer text-zinc-500 hover:text-zinc-200 uppercase text-[12px] font-bold mb-1">

                            <div className="flex items-center gap-1">
                                <ChevronDown className="w-3 h-3" />

                                <span>
                                    Text Channels
                                </span>
                            </div>

                            {canManageChannels && (
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onCreateChannel();
                                    }}
                                    className="transition text-zinc-400 hover:text-zinc-200"
                                >
                                    <Plus className="w-4 h-4 hover:cursor-pointer" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-0.5">
                            {textChannels.map((channel) => (
                                <ChannelItem
                                    key={channel.id}
                                    channel={channel}
                                    isActive={
                                        activeChannelId === channel.id
                                    }
                                    onClick={() =>
                                        onChannelSelect(channel.id)
                                    }
                                />
                            ))}

                            {textChannels.length === 0 && (
                                <p className="px-2 py-2 text-xs text-zinc-600">
                                    No text channels
                                </p>
                            )}
                        </div>
                    </div>

                    {/* =================================================
                        VOICE CHANNELS
                    ================================================= */}

                    <div>
                        <div className="px-2 flex items-center justify-between group cursor-pointer text-zinc-500 hover:text-zinc-200 uppercase text-[12px] font-bold mb-1">

                            <div className="flex items-center gap-1">
                                <ChevronDown className="w-3 h-3" />

                                <span>
                                    Voice Channels
                                </span>
                            </div>

                            {canManageChannels && (
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onCreateChannel();
                                    }}
                                    className="transition text-zinc-400 hover:text-zinc-200"
                                >
                                    <Plus className="w-4 h-4 hover:cursor-pointer" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-0.5">
                            {voiceChannels.map((channel) => (
                                <div key={channel.id}>

                                    <ChannelItem
                                        channel={channel}
                                        isActive={
                                            activeChannelId === channel.id
                                        }
                                        onClick={() =>
                                            onChannelSelect(channel.id)
                                        }
                                    />

                                    {/* VOICE PARTICIPANTS */}

                                    {globalVoiceState?.[channel.id]
                                        ?.length > 0 && (
                                        <div className="ml-8 mt-1 space-y-1">
                                            {globalVoiceState[
                                                channel.id
                                            ].map(
                                                (
                                                    participant: any
                                                ) => (
                                                    <div
                                                        key={
                                                            participant.socketId
                                                        }
                                                        className="flex items-center gap-2 group cursor-pointer"
                                                    >
                                                        {participant.avatar ? (
                                                            <img
                                                                src={
                                                                    participant.avatar
                                                                }
                                                                alt={
                                                                    participant.username ||
                                                                    "User"
                                                                }
                                                                className="w-5 h-5 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full bg-zinc-600 flex items-center justify-center text-[8px] font-bold text-white">
                                                                {participant
                                                                    .username?.[0]
                                                                    ?.toUpperCase() ||
                                                                    "U"}
                                                            </div>
                                                        )}

                                                        <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition truncate">
                                                            {participant.username ||
                                                                "Unknown User"}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {voiceChannels.length === 0 && (
                                <p className="px-2 py-2 text-xs text-zinc-600">
                                    No voice channels
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* =================================================
                    USER PROFILE
                ================================================= */}

                <div className="bg-[#232428] px-2 py-1.5 flex items-center gap-2">

                    {/* AVATAR */}

                    <button
                        type="button"
                        className="relative group cursor-pointer"
                        onClick={onUserSettings}
                    >
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.username || "User"}
                                className="w-8 h-8 rounded-full object-cover border border-zinc-700 hover:border-zinc-500 transition"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs font-bold text-white">
                                {user?.username?.[0]?.toUpperCase() ||
                                    "U"}
                            </div>
                        )}

                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#232428] rounded-full" />
                    </button>

                    {/* USER INFO */}

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate leading-tight">
                            {user?.displayName ||
                                user?.username ||
                                "Guest"}
                        </p>

                        <p className="text-[10px] text-zinc-400 truncate leading-tight">
                            Online
                        </p>
                    </div>

                    {/* SETTINGS */}

                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={onUserSettings}
                            className="p-1.5 hover:bg-zinc-700 rounded transition text-zinc-400 hover:text-zinc-200"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* =====================================================
                EDIT SERVER MODAL
            ===================================================== */}

            {editModalOpen && (
                <EditServerModal
                    server={server as any}
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    onServerUpdated={(updated) => {
                        onServerUpdated(updated);
                        setEditModalOpen(false);
                    }}
                    onServerDeleted={(serverId) => {
                        setEditModalOpen(false);
                        onServerDeleted?.(serverId);
                    }}
                />
            )}

            {/* =====================================================
                INVITE MODAL
            ===================================================== */}

            {inviteModalOpen && (
                <InviteModal
                    serverId={server.id}
                    serverName={server.name}
                    serverIcon={server.icon}
                    serverColor={server.color}
                    isOpen={inviteModalOpen}
                    onClose={() => setInviteModalOpen(false)}
                />
            )}

            {/* =====================================================
                LEAVE SERVER MODAL
            ===================================================== */}

            <AnimatePresence>
                {leaveModalOpen &&
                    typeof document !== "undefined" &&
                    createPortal(
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
                            onClick={() =>
                                !leaving &&
                                setLeaveModalOpen(false)
                            }
                        >
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    scale: 0.95,
                                    y: 10,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.95,
                                    y: 10,
                                }}
                                transition={{
                                    duration: 0.15,
                                }}
                                className="bg-[#313338] border border-zinc-800 rounded-xl p-6 w-full max-w-sm shadow-2xl"
                                onClick={(event) =>
                                    event.stopPropagation()
                                }
                            >
                                <h3 className="text-white font-bold text-lg mb-2">
                                    Leave '{server.name}'?
                                </h3>

                                <p className="text-zinc-400 text-sm mb-4">
                                    Are you sure you want to leave this
                                    server? You won't be able to rejoin
                                    unless you are re-invited.
                                </p>

                                {/* ERROR */}

                                {leaveError && (
                                    <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs font-semibold">
                                        {leaveError}
                                    </div>
                                )}

                                {/* BUTTONS */}

                                <div className="flex gap-3">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setLeaveModalOpen(false)
                                        }
                                        disabled={leaving}
                                        className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-lg text-white font-semibold text-sm"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleLeaveServer}
                                        disabled={leaving}
                                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-lg text-white font-semibold text-sm"
                                    >
                                        {leaving
                                            ? "Leaving..."
                                            : "Leave Server"}
                                    </button>

                                </div>
                            </motion.div>
                        </motion.div>,
                        document.body
                    )}
            </AnimatePresence>
        </>
    );
}

/* =========================================================
   CHANNEL ITEM
========================================================= */

function ChannelItem({
    channel,
    isActive,
    onClick,
}: {
    channel: Channel;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full px-2 py-1.5 rounded-md flex items-center gap-2 cursor-pointer group transition",
                isActive
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            )}
        >
            {channel.type === "text" ? (
                <Hash className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200" />
            ) : (
                <Volume2 className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200" />
            )}

            <span className="text-sm font-medium truncate">
                {channel.name}
            </span>
        </button>
    );
}