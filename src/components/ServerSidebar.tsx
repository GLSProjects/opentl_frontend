"use client";

import React from "react";
import { Plus, Video, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

interface Server {
    id: string;
    name: string;
    icon: string;
    color: string;
}

interface ServerSidebarProps {
    servers: Server[];
    activeServerId: string;
    onServerSelect: (id: string) => void;
    onAddServer: () => void;
    onMeet: () => void;
    /** Opens the community discovery / search modal */
    onDiscover: () => void;
}

export default function ServerSidebar({
    servers,
    activeServerId,
    onServerSelect,
    onAddServer,
    onMeet,
    onDiscover,
}: ServerSidebarProps) {
    return (
        <div className="w-[72px] bg-zinc-950 flex flex-col items-center py-3 gap-2 border-r border-zinc-900 h-full overflow-y-auto custom-scrollbar shrink-0">
            {servers.map((server) => {
                const isActive = activeServerId === server.id;

                return (
                    <button
                        key={server.id}
                        onClick={() => onServerSelect(server.id)}
                        className="group relative flex items-center justify-center w-full"
                        title={server.name}
                    >
                        {/* Active Indicator */}
                        <div
                            className={cn(
                                "absolute left-0 bg-white rounded-r-full transition-all duration-300",
                                isActive ? "h-8 w-1" : "h-2 w-0 group-hover:w-1 group-hover:h-5"
                            )}
                        />

                        {/* Server Icon */}
                        <div
                            className={cn(
                                "w-12 h-12 flex items-center justify-center text-white font-bold transition-all duration-300 overflow-hidden",
                                server.color,
                                isActive ? "rounded-[16px]" : "rounded-[24px] group-hover:rounded-[16px]"
                            )}
                        >
                            {server.icon.startsWith("http") || server.icon.startsWith("data:") ? (
                                <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
                            ) : (
                                server.icon
                            )}
                        </div>
                    </button>
                );
            })}

            <div className="w-8 h-[2px] bg-zinc-800 my-2 shrink-0" />

            {/* Add Server */}
            <button
                onClick={onAddServer}
                title="Add a Server"
                className="w-12 h-12 bg-zinc-800 rounded-[24px] hover:rounded-[16px] flex items-center justify-center cursor-pointer hover:bg-green-500 hover:text-white transition-all duration-300 group shrink-0"
            >
                <Plus className="w-6 h-6 text-green-500 group-hover:text-white" />
            </button>

            {/* Discover Communities */}
            <button
                onClick={onDiscover}
                title="Discover Communities"
                className="w-12 h-12 bg-zinc-800 rounded-[24px] hover:rounded-[16px] flex items-center justify-center cursor-pointer hover:bg-indigo-600 hover:text-white transition-all duration-300 group shrink-0"
            >
                <Compass className="w-6 h-6 text-indigo-400 group-hover:text-white" />
            </button>

            {/* Meet */}
            <button
                onClick={onMeet}
                title="Start a Meeting"
                className="w-12 h-12 bg-zinc-800 rounded-[24px] hover:rounded-[16px] flex items-center justify-center cursor-pointer hover:bg-blue-600 hover:text-white transition-all duration-300 group shrink-0"
            >
                <Video className="w-6 h-6 text-blue-500 group-hover:text-white" />
            </button>
        </div>
    );
}
