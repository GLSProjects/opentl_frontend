"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ChannelList from "./ChannelList";
import { useAuth } from "@/context/AuthContext";

interface Server {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [servers, setServers] = useState<Server[]>([]);
    const [showCreateServer, setShowCreateServer] = useState(false);

    useEffect(() => {
        const fetchServers = async () => {
            if (!user?.token) return;
            try {
                const res = await fetch("http://127.0.0.1:5000/api/servers", {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    setServers(data.map((s: any) => ({
                        ...s,
                        id: s._id,
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch servers for sidebar:", error);
            }
        };
        fetchServers();
    }, [user?.token]);

    // Get serverId from pathname: /server/[serverId]/channel/[channelName]
    const serverId = pathname?.split("/")[2];

    return (
        <>
            {/* Mobile Button */}
            <div className="md:hidden fixed top-4 left-4 z-[60]">
                <button
                    onClick={() => setOpen(!open)}
                    className="p-2 bg-zinc-900 rounded-md border border-zinc-800 shadow-lg"
                >
                    {open ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
                </button>
            </div>

            {/* Overlay */}
            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                />
            )}

            {/* Sidebar Container */}
            <div
                className={cn(
                    "fixed top-[65px] bottom-0 left-0 flex transition-all duration-300 z-50 overflow-hidden",
                    open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Servers Rail */}
                <div className="w-[72px] bg-zinc-950 flex flex-col items-center py-3 gap-2 border-r border-zinc-900 h-full overflow-y-auto custom-scrollbar shadow-[inset_-10px_0_20px_rgba(0,0,0,0.1)]">
                    {servers.map((server) => {
                        const isActive = serverId === server.id;

                        return (
                            <button
                                key={server.id}
                                onClick={() => {
                                    router.push(`/server/${server.id}`);
                                }}
                                className={cn(
                                    "w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all flex items-center justify-center text-white font-bold relative group shrink-0 overflow-hidden",
                                    isActive ? "bg-red-600 rounded-[16px]" : "bg-zinc-800",
                                    server.color
                                )}
                            >
                                {isActive && (
                                    <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />
                                )}
                                {server.icon.startsWith("http") || server.icon.startsWith("data:") ? (
                                    <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
                                ) : (
                                    server.icon
                                )}

                                {/* Tooltip */}
                                <div className="absolute left-16 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-zinc-800">
                                    {server.name}
                                </div>
                            </button>
                        );
                    })}
<div
                        onClick={() => setShowCreateServer(true)}
                        className="w-12 h-12 bg-zinc-800 rounded-[24px] hover:rounded-[16px] flex items-center justify-center cursor-pointer hover:bg-green-500 hover:text-white transition-all group shrink-0"
                    >
                        <Plus className="w-5 h-5 text-green-500 group-hover:text-white" />
                    </div>
                </div>

                {/* Channels (Mobile Only in Sidebar) */}
                {serverId && (
                    <div className={cn(
                        "w-64 h-full bg-zinc-900 md:hidden border-r border-black overflow-hidden transition-all duration-300",
                        open ? "opacity-100" : "opacity-0 invisible w-0"
                    )}>
                        <ChannelList serverId={serverId} />
                    </div>
                )}
            </div>
        </>
    );
}