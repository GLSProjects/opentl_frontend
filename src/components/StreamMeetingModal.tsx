"use client";

import React from "react";
import { X, Video, Radio, Users, Monitor, Shield, Zap, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreamMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (mode: "streaming" | "meeting") => void;
}

export default function StreamMeetingModal({ isOpen, onClose, onSelect }: StreamMeetingModalProps) {
    // Close on Escape key
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-[#313338] w-full max-w-[800px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-zinc-800">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 text-zinc-400 hover:text-white transition z-10 p-2 hover:bg-zinc-800 rounded-full"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8 md:p-12 text-center">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-2 uppercase italic tracking-tighter spidey-font animate-glow">
                        Streaming & Meetings
                    </h2>
                    <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
                        Connect with your team or broadcast your adventures to the world with high-performance tools.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 mt-4">
                        {/* Streaming Option */}
                        <button
                            onClick={() => onSelect("streaming")}
                            className="group relative flex flex-col items-center p-8 bg-[#2b2d31] rounded-2xl border-2 border-transparent hover:border-red-600 transition-all hover:bg-red-600/5 hover:-translate-y-2 active:scale-95 text-left"
                        >
                            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(220,38,38,0.4)] group-hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all">
                                <Radio className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Go Live</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                Broadcast your gameplay or talk show live to YouTube, Facebook, Twitch, and your own server.
                            </p>
                            <ul className="space-y-2 w-full text-xs font-medium text-zinc-500">
                                <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> Ultra-low latency streaming</li>
                                <li className="flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> Multi-platform support</li>
                                <li className="flex items-center gap-2"><Monitor className="w-4 h-4 text-green-500" /> Professional dashboard</li>
                            </ul>
                        </button>

                        {/* Meeting Option */}
                        <button
                            onClick={() => onSelect("meeting")}
                            className="group relative flex flex-col items-center p-8 bg-[#2b2d31] rounded-2xl border-2 border-transparent hover:border-blue-600 transition-all hover:bg-blue-600/5 hover:-translate-y-2 active:scale-95 text-left"
                        >
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all">
                                <Video className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Start Meeting</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                Professional video conferencing with screen sharing, participant control, and crystal clear audio.
                            </p>
                            <ul className="space-y-2 w-full text-xs font-medium text-zinc-500">
                                <li className="flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" /> 100+ active participants</li>
                                <li className="flex items-center gap-2"><Monitor className="w-4 h-4 text-cyan-500" /> HD Screen sharing</li>
                                <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-red-500" /> End-to-end encryption</li>
                            </ul>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
