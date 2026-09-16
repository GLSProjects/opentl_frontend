"use client";

import React, { useState } from "react";
import { X, Hash, Volume2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, type: "text" | "voice", isPrivate: boolean) => void;
}

export default function CreateChannelModal({ isOpen, onClose, onCreate }: CreateChannelModalProps) {
    const [name, setName] = useState("");
    const [type, setType] = useState<"text" | "voice">("text");
    const [isPrivate, setIsPrivate] = useState(false);

    // Close on Escape key
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.toLowerCase().replace(/\s+/g, '-'), type, isPrivate);
            resetAndClose();
        }
    };

    const resetAndClose = () => {
        setName("");
        setType("text");
        setIsPrivate(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={resetAndClose}
            />

            {/* Modal Content */}
            <div className="relative bg-[#313338] w-full max-w-[460px] rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between pb-2">
                        <h2 className="text-xl font-bold text-white">Create Channel</h2>
                        <button
                            type="button"
                            onClick={resetAndClose}
                            className="text-zinc-400 hover:text-white transition"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-4 space-y-6">
                        {/* Channel Type Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Channel Type</label>
                            <div className="space-y-2">
                                <TypeOption
                                    icon={<Hash className="w-6 h-6" />}
                                    title="Text"
                                    description="Send messages, images, GIFs, emoji, and opinions"
                                    isActive={type === "text"}
                                    onClick={() => setType("text")}
                                />
                                <TypeOption
                                    icon={<Volume2 className="w-6 h-6" />}
                                    title="Voice"
                                    description="Hang out together with voice, video, and screen share"
                                    isActive={type === "voice"}
                                    onClick={() => setType("voice")}
                                />
                            </div>
                        </div>

                        {/* Channel Name Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Channel Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    {type === "text" ? <Hash className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-zinc-500" />}
                                </div>
                                <input
                                    type="text"
                                    autoFocus
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="new-channel"
                                    className="w-full bg-[#1e1f22] text-zinc-200 pl-10 pr-3 py-2.5 rounded outline-none focus:ring-1 focus:ring-blue-500 transition-all border-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Private Channel Toggle */}
                        <div className="flex items-center justify-between hover:bg-zinc-800/10 p-2 rounded-lg transition group">
                            <div className="flex items-center gap-3">
                                <Lock className="w-5 h-5 text-zinc-400" />
                                <div>
                                    <p className="text-white font-medium text-sm">Private Channel</p>
                                    <p className="text-xs text-zinc-400">Only selected members and roles will be able to view this channel.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPrivate(!isPrivate)}
                                className={cn(
                                    "w-10 h-6 rounded-full relative transition-colors duration-200 outline-none",
                                    isPrivate ? "bg-green-600" : "bg-zinc-600"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200",
                                    isPrivate ? "translate-x-4" : "translate-x-0"
                                )} />
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-[#2b2d31] flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={resetAndClose}
                            className="text-white text-sm font-medium hover:underline px-4 py-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="bg-blue-600 text-white px-7 py-2 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
                        >
                            Create Channel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function TypeOption({ icon, title, description, isActive, onClick }: { icon: React.ReactNode, title: string, description: string, isActive: boolean, onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between p-3 rounded-md transition-colors group",
                isActive ? "bg-zinc-700/50" : "hover:bg-zinc-800/50"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-10 h-10 flex items-center justify-center transition-colors",
                    isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                )}>
                    {icon}
                </div>
                <div className="text-left">
                    <p className={cn(
                        "font-bold text-sm",
                        isActive ? "text-white" : "text-zinc-300 group-hover:text-zinc-100"
                    )}>{title}</p>
                    <p className="text-xs text-zinc-400">{description}</p>
                </div>
            </div>
            <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                isActive ? "border-blue-500 bg-blue-500" : "border-zinc-500"
            )}>
                {isActive && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
        </button>
    );
}
