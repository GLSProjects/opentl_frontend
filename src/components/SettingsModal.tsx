"use client";

import React, { useState, useEffect } from "react";
import { X, Mic, Volume2, Shield, Monitor, Keyboard, Bell, HelpCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoice } from "@/context/VoiceContext";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { audioInputDevices, selectedAudioInput, setSelectedAudioInput } = useVoice();
    const [activeTab, setActiveTab] = useState("voice");

    if (!isOpen) return null;

    const tabs = [
        { id: "voice", label: "Voice & Video", icon: Mic },
        { id: "overlay", label: "Game Overlay", icon: Monitor },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "hotkeys", label: "Keybinds", icon: Keyboard },
        { id: "privacy", label: "Privacy & Safety", icon: Shield },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-5xl h-[80vh] bg-[#313338] rounded-xl overflow-hidden flex shadow-2xl border border-white/5">
                {/* Sidebar */}
                <div className="w-60 bg-[#2b2d31] p-6 flex flex-col gap-1 shrink-0">
                    <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-2">App Settings</h2>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-[14px] font-medium transition-all group",
                                activeTab === tab.id
                                    ? "bg-[#404249] text-white"
                                    : "text-zinc-400 hover:bg-[#35373c] hover:text-zinc-200"
                            )}
                        >
                            <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")} />
                            {tab.label}
                        </button>
                    ))}

                    <div className="mt-auto pt-4 border-t border-white/5">
                        <button className="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-md transition-colors w-full text-[14px] font-medium">
                            <LogOut className="w-5 h-5" />
                            Log Out
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#313338]">
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <h1 className="text-xl font-bold text-white">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h1>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-all ring-1 ring-white/10"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {activeTab === "voice" && (
                            <div className="max-w-2xl space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                                {/* Input Device */}
                                <section className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-2">Input Device</h3>
                                        <select
                                            value={selectedAudioInput}
                                            onChange={(e) => setSelectedAudioInput(e.target.value)}
                                            className="w-full bg-[#1e1f22] border-none rounded-lg p-3 text-white outline-none focus:ring-2 ring-indigo-500 transition-all appearance-none cursor-pointer"
                                        >
                                            {audioInputDevices.map((device) => (
                                                <option key={device.deviceId} value={device.deviceId}>
                                                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                                                </option>
                                            ))}
                                            {audioInputDevices.length === 0 && (
                                                <option value="default">Default High Definition Audio</option>
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-2">Input Volume</h3>
                                        <div className="flex items-center gap-4">
                                            <Mic className="w-5 h-5 text-indigo-400" />
                                            <input type="range" className="flex-1 accent-indigo-500 h-1.5 bg-[#1e1f22] rounded-full appearance-none cursor-pointer" />
                                        </div>
                                    </div>
                                </section>

                                {/* Mic Test */}
                                <section className="bg-[#2b2d31] rounded-xl p-6 border border-white/5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                                            <Volume2 className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">Mic Test</h4>
                                            <p className="text-xs text-zinc-400">Having trouble? Test your microphone and make sure you sound great.</p>
                                        </div>
                                    </div>
                                    <button className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold transition-all shadow-lg active:scale-[0.98]">
                                        Let's Check
                                    </button>
                                </section>

                                {/* More settings placeholders */}
                                <section className="space-y-6 pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-zinc-200">Echo Cancellation</h4>
                                            <p className="text-xs text-zinc-400">Reduces feedback from your speakers into your microphone.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer shadow-inner">
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-zinc-200">Noise Suppression</h4>
                                            <p className="text-xs text-zinc-400">Filters out background noise when you're speaking.</p>
                                        </div>
                                        <div className="w-12 h-6 bg-[#1e1f22] rounded-full relative cursor-pointer ring-1 ring-white/10">
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-zinc-500 rounded-full transition-all" />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab !== "voice" && (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 animate-in fade-in duration-500">
                                <HelpCircle className="w-16 h-16 opacity-20" />
                                <div className="text-center">
                                    <h3 className="font-bold text-lg text-zinc-300">Under Construction</h3>
                                    <p className="text-sm">This setting tab will be available in the next update!</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
