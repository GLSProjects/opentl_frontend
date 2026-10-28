"use client";

import React, { useEffect, useRef } from "react";
import { useVoice } from "@/context/VoiceContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic, Headphones, Settings, PhoneOff, Video, ScreenShare, UserPlus, MicOff, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import SettingsModal from "./SettingsModal";

export default function VoiceArea({ channelName, roomId }: { channelName: string, roomId: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    const serverId = searchParams.get("s");

    const {
        participants,
        localStream,
        isMuted,
        isDeafened,
        isVideoEnabled,
        isScreenSharing,
        joinVoiceChannel,
        leaveVoiceChannel,
        toggleMute,
        toggleDeafen,
        toggleVideo,
        toggleScreenShare
    } = useVoice();

    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        joinVoiceChannel(roomId);
        return () => leaveVoiceChannel();
    }, [roomId]);

    const handleCopyInvite = () => {
        if (!serverId) return;
        const inviteUrl = `${window.location.origin}/invite?s=${serverId}`;
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDisconnect = async () => {
        // Leave voice channel
        leaveVoiceChannel();
        
        // Navigate back to a text channel
        const serverId = searchParams.get("s");
        if (serverId && user?.token) {
            try {
                // Fetch server data to find a text channel
                const res = await fetch(`https://opentl-backend-1.onrender.com/api/servers/${serverId}`, {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });
                
                if (res.ok) {
                    const serverData = await res.json();
                    const textChannel = serverData.channels.find((c: any) => c.type === "text");
                    
                    if (textChannel) {
                        // Navigate to the first text channel
                        router.push(`/dashboard?s=${serverId}&c=${textChannel._id}`);
                    } else {
                        // No text channel found, go to server root
                        router.push(`/dashboard?s=${serverId}`);
                    }
                } else {
                    // Fallback to server root
                    router.push(`/dashboard?s=${serverId}`);
                }
            } catch (error) {
                console.error("Failed to fetch server data:", error);
                // Fallback to server root
                router.push(`/dashboard?s=${serverId}`);
            }
        } else {
            // Fallback to dashboard
            router.push("/dashboard");
        }
    };

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, isVideoEnabled, isScreenSharing]);

    return (
        <div className="flex flex-col h-full bg-[#1e1f22]">
            {/* Settings Modal */}
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* Call Header */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-black shadow-sm bg-[#313338] z-10 shrink-0">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Megaphone className="w-5 h-5" />
                    <span className="font-bold text-white">{channelName}</span>
                </div>
                <div className="flex items-center gap-4 text-zinc-400">
                    <button
                        onClick={handleCopyInvite}
                        className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded transition-all text-xs font-bold",
                            copied ? "text-green-500 bg-green-500/10" : "hover:text-zinc-200"
                        )}
                    >
                        {copied ? <Check className="w-4 h-4" /> : <UserPlus className="w-5 h-5" />}
                        {copied ? "Copied!" : ""}
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="hover:text-zinc-200 transition"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Participants Grid */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-fit">
                    {/* Local User */}
                    <div className={cn(
                        "aspect-video bg-black rounded-lg flex flex-col items-center justify-center relative group transition-all duration-300 ring-1 ring-zinc-700 overflow-hidden",
                        !isMuted && "ring-2 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                    )}>
                        {(isVideoEnabled || isScreenSharing) ? (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            user?.avatar ? (
                                <img src={user.avatar} className="w-20 h-20 rounded-full border-2 border-zinc-600" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                                    {user?.username?.[0].toUpperCase()}
                                </div>
                            )
                        )}
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs font-bold text-white backdrop-blur-sm z-10">
                            {user?.username} (You)
                        </span>
                        {isMuted && (
                            <div className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full z-10">
                                <MicOff className="w-3.5 h-3.5 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Remote Participants */}
                    {participants.map((p) => (
                        <div
                            key={p.socketId}
                            className={cn(
                                "aspect-video bg-black rounded-lg flex flex-col items-center justify-center relative group transition-all duration-300 ring-1 ring-zinc-700 overflow-hidden",
                                p.isSpeaking && "ring-2 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                            )}
                        >
                            {(p.isVideoEnabled || p.isScreenSharing) && p.stream ? (
                                <video
                                    autoPlay
                                    ref={(el) => { if (el) el.srcObject = p.stream!; }}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                p.avatar ? (
                                    <img src={p.avatar} className="w-20 h-20 rounded-full border-2 border-zinc-600" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-zinc-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                                        {p.username[0].toUpperCase()}
                                    </div>
                                )
                            )}
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs font-bold text-white backdrop-blur-sm z-10">
                                {p.username}
                            </span>

                            {/* Audio Element (No Video) */}
                            {p.stream && !isDeafened && (
                                <RemoteAudio stream={p.stream} />
                            )}

                            {p.isMuted && (
                                <div className="absolute top-2 right-2 p-1 bg-red-500 rounded-full z-10">
                                    <MicOff className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Empty Slots */}
                    {participants.length === 0 && (
                        <div className="aspect-video bg-[#2b2d31]/40 border-2 border-dashed border-zinc-700/50 rounded-lg flex items-center justify-center text-zinc-600 italic text-sm">
                            Waiting for others to join...
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="p-4 bg-[#1e1f22] border-t border-black flex items-center justify-center gap-4 shrink-0 shadow-lg">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                    <ControlBtn
                        icon={<Video className="w-5 h-5" />}
                        label="Video"
                        onClick={toggleVideo}
                        active={isVideoEnabled}
                    />
                    <ControlBtn
                        icon={<ScreenShare className="w-5 h-5" />}
                        label="Screen"
                        onClick={toggleScreenShare}
                        active={isScreenSharing}
                    />

                    <button
                        onClick={toggleMute}
                        className="flex flex-col items-center gap-1 group min-w-[60px]"
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95",
                            isMuted ? "bg-red-500 text-white hover:bg-red-600" : "bg-[#313338] text-zinc-300 hover:bg-[#383a40] hover:text-white"
                        )}>
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">
                            {isMuted ? "Unmute" : "Mute"}
                        </span>
                    </button>

                    <button
                        onClick={toggleDeafen}
                        className="flex flex-col items-center gap-1 group min-w-[60px]"
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95",
                            isDeafened ? "bg-red-500 text-white hover:bg-red-600" : "bg-[#313338] text-zinc-300 hover:bg-[#383a40] hover:text-white"
                        )}>
                            <Headphones className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">
                            {isDeafened ? "Undeafen" : "Deafen"}
                        </span>
                    </button>

                    <button
                        onClick={handleDisconnect}
                        className="flex flex-col items-center gap-1 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 active:scale-95">
                            <PhoneOff className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 group-hover:text-red-400 transition-colors">Disconnect</span>
                    </button>

                    <ControlBtn icon={<Settings className="w-5 h-5" />} label="Settings" onClick={() => setIsSettingsOpen(true)} />
                </div>
            </div>
        </div>
    );
}

function RemoteAudio({ stream }: { stream: MediaStream }) {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current && stream) {
            audioRef.current.srcObject = stream;
        }
    }, [stream]);

    return <audio ref={audioRef} autoPlay />;
}

function Megaphone({ className }: { className?: string }) {
    return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
    );
}

function ControlBtn({ icon, label, onClick, active }: { icon: React.ReactNode, label: string, onClick?: () => void, active?: boolean }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1 group min-w-[60px]"
        >
            <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95",
                active ? "bg-green-500 text-white hover:bg-green-600" : "bg-[#313338] text-zinc-300 hover:bg-[#383a40] hover:text-white"
            )}>
                {icon}
            </div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
        </button>
    );
}
