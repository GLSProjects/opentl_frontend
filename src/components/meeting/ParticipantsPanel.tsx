"use client";

import React from "react";
import { X, Mic, MicOff, Video, VideoOff, Crown } from "lucide-react";
import { Participant } from "@/hooks/useMeeting";

type ParticipantsPanelProps = {
    isOpen: boolean;
    onClose: () => void;
    localUserName: string;
    isLocalMuted: boolean;
    isLocalVideoOff: boolean;
    isLocalHost: boolean;
    participants: Participant[];
};

export default function ParticipantsPanel({
    isOpen,
    onClose,
    localUserName,
    isLocalMuted,
    isLocalVideoOff,
    isLocalHost,
    participants,
}: ParticipantsPanelProps) {
    if (!isOpen) return null;

    const totalCount = participants.length + 1;

    return (
        <div className="w-80 bg-[#2b2d31] border-l border-zinc-800 flex flex-col h-full shrink-0 shadow-2xl z-40 animate-in slide-in-from-right duration-200">
            <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-700/60">
                <h3 className="font-bold text-white text-base">
                    Participants ({totalCount})
                </h3>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 transition">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                            {localUserName.slice(0, 1).toUpperCase() || "Y"}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-white truncate">
                                    {localUserName} (You)
                                </span>
                                {isLocalHost && (
                                    <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded-md border border-amber-500/30">
                                        <Crown className="w-2.5 h-2.5" /> Host
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                        {isLocalMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-zinc-300" />}
                        {isLocalVideoOff ? <VideoOff className="w-4 h-4 text-red-400" /> : <Video className="w-4 h-4 text-zinc-300" />}
                    </div>
                </div>

                {participants.map(p => (
                    <div key={p.socketId} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800 transition">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                                {p.userName.slice(0, 1).toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-semibold text-white truncate">
                                        {p.userName}
                                    </span>
                                    {p.isHost && (
                                        <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded-md border border-amber-500/30">
                                            <Crown className="w-2.5 h-2.5" /> Host
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                            {p.isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-zinc-300" />}
                            {p.isVideoOff ? <VideoOff className="w-4 h-4 text-red-400" /> : <Video className="w-4 h-4 text-zinc-300" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

