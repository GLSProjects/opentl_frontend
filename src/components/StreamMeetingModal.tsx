"use client";

import React from "react";
import { X, Video, Users, Monitor, Shield } from "lucide-react";

type StreamMeetingModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (mode: "meeting") => void;
};

export default function StreamMeetingModal({ isOpen, onClose, onSelect }: StreamMeetingModalProps) {
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
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-[#313338] w-full max-w-[560px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-zinc-800">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 text-zinc-400 hover:text-white transition z-10 p-2 hover:bg-zinc-800 rounded-full"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8 md:p-10 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2 uppercase italic tracking-tighter spidey-font animate-glow">
                        Start Video Meeting
                    </h2>
                    <p className="text-zinc-400 text-sm mb-8 max-w-md mx-auto">
                        Professional video conferencing with screen sharing, participant control, and crystal clear audio.
                    </p>

                    <button
                        onClick={() => onSelect("meeting")}
                        className="group w-full flex flex-col items-center p-8 bg-[#2b2d31] rounded-2xl border-2 border-transparent hover:border-blue-600 transition-all hover:bg-blue-600/5 hover:-translate-y-1 active:scale-95 text-left"
                    >
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all">
                            <Video className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Launch Meeting</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-6 text-center">
                            Instant room creation with real-time audio and video.
                        </p>
                        <ul className="space-y-2 w-full text-xs font-medium text-zinc-500">
                            <li className="flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" /> Active participants</li>
                            <li className="flex items-center gap-2"><Monitor className="w-4 h-4 text-cyan-500" /> HD Screen sharing</li>
                            <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-red-500" /> End-to-end encrypted</li>
                        </ul>
                    </button>
                </div>
            </div>
        </div>
    );
}
