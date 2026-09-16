"use client";

import React, { useState } from "react";
import { Radio, Users, Eye, Play, Pause, Settings, Youtube, Facebook, Tv, Twitch, Globe, MessageSquare, ChevronLeft, Layout, Share2, Shield, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreamingAreaProps {
    onEnd: () => void;
}

export default function StreamingArea({ onEnd }: StreamingAreaProps) {
    const [isLive, setIsLive] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<string>("internal");

    return (
        <div className="flex-1 flex flex-col bg-[#1e1f22] relative h-full overflow-hidden">
            {/* Stream Header */}
            <div className="h-14 border-b border-black flex items-center justify-between px-6 bg-[#2b2d31] shrink-0 animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-4">
                    <button onClick={onEnd} className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-400 hover:text-white">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h2 className="font-bold text-white tracking-tight">Streamer Dashboard</h2>
                    {isLive && <div className="px-2 py-0.5 bg-red-600 rounded text-[10px] font-bold text-white uppercase animate-pulse shadow-glow">Streaming</div>}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-6 px-4 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
                        <StatItem icon={<Eye className="w-4 h-4" />} value="1,240" label="Viewers" />
                        <StatItem icon={<Users className="w-4 h-4" />} value="4,852" label="Followers" />
                        <StatItem icon={<Heart className="w-4 h-4" />} value="92.4k" label="Likes" />
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Stream Preview & Dashboard */}
                <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Stream Preview Card */}
                    <div className="bg-black rounded-3xl overflow-hidden aspect-video relative group shadow-2xl border border-zinc-800">
                        {!isLive ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-8 text-center">
                                <Radio className="w-16 h-16 text-zinc-700 mb-6" />
                                <h3 className="text-2xl font-bold text-white mb-2">Ready to Go Live?</h3>
                                <p className="text-zinc-500 text-sm max-w-sm mb-6">Connect your camera and select your platform to start broadcasting.</p>
                                <button
                                    onClick={() => setIsLive(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-black px-12 py-3 rounded-2xl transition-all shadow-glow hover:scale-105 active:scale-95"
                                >
                                    START STREAMING
                                </button>
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                                <div className="text-4xl font-bold animate-pulse text-red-600/50">LIVE PLAYER ACTIVE</div>
                                <div className="mt-4 flex gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse delay-75" />
                                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse delay-150" />
                                </div>
                            </div>
                        )}
                        <div className="absolute top-6 left-6 flex gap-2">
                            <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white border border-white/10 uppercase tracking-widest">{selectedPlatform}</span>
                        </div>
                    </div>

                    {/* Platform Selector */}
                    <div className="space-y-4">
                        <h3 className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest px-2">Broadcasting To</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <PlatformBtn icon={<Globe className="w-5 h-5" />} label="Internally" active={selectedPlatform === "internal"} onClick={() => setSelectedPlatform("internal")} />
                            <PlatformBtn icon={<Youtube className="w-5 h-5" />} label="YouTube" active={selectedPlatform === "youtube"} onClick={() => setSelectedPlatform("youtube")} />
                            <PlatformBtn icon={<Twitch className="w-5 h-5" />} label="Twitch" active={selectedPlatform === "twitch"} onClick={() => setSelectedPlatform("twitch")} />
                            <PlatformBtn icon={<Facebook className="w-5 h-5" />} label="Facebook" active={selectedPlatform === "facebook"} onClick={() => setSelectedPlatform("facebook")} />
                        </div>
                    </div>

                    {/* Stream Info Editor */}
                    <div className="bg-[#2b2d31] p-6 rounded-2xl border border-zinc-800 space-y-6 shadow-lg">
                        <div className="flex items-center gap-3">
                            <Settings className="w-5 h-5 text-red-600" />
                            <h3 className="font-bold text-white">Stream Information</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Stream Title</label>
                                <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-600 transition" defaultValue="Saving New York with my New Suit! 🕸️" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Stream Category</label>
                                <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-600 transition" defaultValue="Gaming & Lifestyle" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Live Chat */}
                <div className="w-[320px] bg-[#2b2d31] border-l border-black flex flex-col hidden lg:flex">
                    <div className="h-14 border-b border-black flex items-center px-6 bg-[#313338] shrink-0">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-zinc-400" />
                            <h3 className="font-bold text-white text-sm">Live Stream Chat</h3>
                        </div>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                        <ChatMessage user="AuntMay" msg="Stay safe Peter! ❤️" color="text-red-400" />
                        <ChatMessage user="NedLeeds" msg="DUDE IS THAT THE NANOSUIT??" color="text-blue-400" />
                        <ChatMessage user="MJ_Watson" msg="Concentrate on the mission Tiger." color="text-purple-400" />
                        <ChatMessage user="HappyHogan" msg="Tony says don't scratch the paint." color="text-green-400" />
                    </div>
                    <div className="p-4 border-t border-black bg-zinc-900">
                        <div className="bg-zinc-800 rounded-xl p-3 flex items-center gap-3 border border-zinc-700">
                            <input className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" placeholder="Chat with viewers..." />
                            <Share2 className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-white transition" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="text-zinc-500">{icon}</div>
            <div className="flex flex-col -space-y-1">
                <span className="text-sm font-bold text-white">{value}</span>
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{label}</span>
            </div>
        </div>
    );
}

function PlatformBtn({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group",
                active
                    ? "bg-red-600 border-red-500 shadow-glow scale-105"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800"
            )}
        >
            <div className={cn("mb-2 transition-transform duration-300 group-hover:scale-110", active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")}>
                {icon}
            </div>
            <span className={cn("text-[10px] font-bold uppercase tracking-widest", active ? "text-white" : "text-zinc-500")}>{label}</span>
        </button>
    );
}

function ChatMessage({ user, msg, color }: { user: string, msg: string, color: string }) {
    return (
        <div className="text-sm border-l-2 border-transparent pl-2 hover:border-zinc-700 transition-all">
            <span className={cn("font-bold mr-2", color)}>{user}:</span>
            <span className="text-zinc-300 leading-relaxed">{msg}</span>
        </div>
    );
}
