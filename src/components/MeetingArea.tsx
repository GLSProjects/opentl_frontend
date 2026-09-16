"use client";

import React from "react";
import { Mic, Video, Monitor, PhoneOff, Settings, Users, MessageSquare, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingAreaProps {
    onEnd: () => void;
}

export default function MeetingArea({ onEnd }: MeetingAreaProps) {
    return (
        <div className="flex-1 flex flex-col bg-[#1e1f22] relative overflow-hidden h-full">
            {/* Meeting Header */}
            <div className="h-14 border-b border-black flex items-center justify-between px-6 bg-[#2b2d31] animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-4">
                    <button onClick={onEnd} className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-400 hover:text-white">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h2 className="font-bold text-white tracking-tight">Avengers Briefing Meeting</h2>
                    <div className="px-2 py-0.5 bg-red-600 rounded text-[10px] font-bold text-white uppercase animate-pulse shadow-glow">Live</div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 bg-[#4e5058] hover:bg-[#6d6f78] text-white text-xs font-medium px-3 py-1.5 rounded transition">
                        <Users className="w-4 h-4" />
                        <span>4 Participants</span>
                    </button>
                    <button className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-400 hover:text-white">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Video Grid Area */}
            <div className="flex-1 p-6 flex items-center justify-center overflow-hidden custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 w-full h-full max-w-6xl max-h-[80%]">
                    <ParticipantCard name="Tony Stark" avatar="T" color="bg-red-600" isLocal />
                    <ParticipantCard name="Steve Rogers" avatar="S" color="bg-blue-600" />
                    <ParticipantCard name="Natasha Romanoff" avatar="N" color="bg-zinc-800" />
                    <ParticipantCard name="Peter Parker" avatar="P" color="bg-red-500" />
                </div>
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 bg-[#111214]/90 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom duration-500">
                <ControlBtn icon={<Mic className="w-6 h-6" />} label="Mute" />
                <ControlBtn icon={<Video className="w-6 h-6" />} label="Stop Video" />
                <ControlBtn icon={<Monitor className="w-6 h-6" />} label="Share Screen" active color="bg-green-600" />
                <ControlBtn icon={<MessageSquare className="w-6 h-6" />} label="Chat" />
                <div className="w-[1px] h-8 bg-zinc-800 mx-2" />
                <button
                    onClick={onEnd}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-95"
                >
                    <PhoneOff className="w-5 h-5" />
                    <span className="hidden sm:inline">Leave Room</span>
                </button>
            </div>
        </div>
    );
}

function ParticipantCard({ name, avatar, color, isLocal }: { name: string, avatar: string, color: string, isLocal?: boolean }) {
    return (
        <div className="relative group bg-zinc-900 rounded-2xl overflow-hidden aspect-video shadow-lg border border-zinc-800 flex items-center justify-center hover:border-red-600/50 transition-all duration-500 translate-z-0">
            <div className={cn("w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-2xl transition-transform duration-500 group-hover:scale-110", color)}>
                {avatar}
            </div>
            {/* Name Tag */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-sm font-bold text-white">{name}</span>
                {isLocal && <span className="text-[10px] bg-red-600 px-1 rounded text-white font-black uppercase">You</span>}
            </div>
            {/* Audio Indicator Overlay */}
            <div className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center bg-black/40 rounded-full">
                <div className="flex gap-0.5 items-end h-3">
                    <div className="w-0.5 h-full bg-green-500 rounded-full animate-pulse" />
                    <div className="w-0.5 h-[70%] bg-green-500 rounded-full animate-pulse delay-75" />
                    <div className="w-0.5 h-[90%] bg-green-500 rounded-full animate-pulse delay-150" />
                </div>
            </div>
        </div>
    );
}

function ControlBtn({ icon, label, active, color }: { icon: React.ReactNode, label: string, active?: boolean, color?: string }) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <button className={cn(
                "p-3 rounded-xl transition-all duration-300 group hover:scale-110 active:scale-95 shadow-lg",
                active
                    ? (color || "bg-blue-600 text-white")
                    : "bg-[#2b2d31] text-zinc-400 hover:bg-[#35373c] hover:text-white border border-zinc-800"
            )}>
                {icon}
            </button>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter group-hover:text-zinc-300">{label}</span>
        </div>
    );
}
