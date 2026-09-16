"use client";

import React, { useState, useEffect } from "react";
import { Mic, Video, Monitor, PhoneOff, Settings, Users, MessageSquare, ChevronLeft, Plus, Copy, Shield, Lock, Grid, User, Volume2, Wifi, WifiOff, Maximize2, Minimize2, MoreVertical, Sparkles, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMeeting } from "@/hooks/useMeeting";

interface MeetingAreaProps {
    roomId?: string;
    userName?: string;
    onEnd: () => void;
}

export default function DynamicMeetingArea({ roomId, userName, onEnd }: MeetingAreaProps) {
    const {
        room,
        participants,
        currentParticipant,
        isLoading,
        error,
        joinRoom,
        leaveRoom,
        updateParticipantStatus
    } = useMeeting();

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [layoutMode, setLayoutMode] = useState<'grid' | 'speaker'>('grid');
    const [showControls, setShowControls] = useState(true);

    // Join room if roomId is provided
    useEffect(() => {
        if (roomId && userName && !currentParticipant) {
            joinRoom(roomId, userName);
        }
    }, [roomId, userName, joinRoom, currentParticipant]);

    // Update participant status when controls change
    useEffect(() => {
        if (room && currentParticipant) {
            updateParticipantStatus(room.id, currentParticipant.id, {
                isMuted,
                isVideoOff,
                hasScreenShare: isScreenSharing
            });
        }
    }, [isMuted, isVideoOff, isScreenSharing, room, currentParticipant, updateParticipantStatus]);

    // Toggle controls manually (only through button)
    const toggleControls = () => {
        setShowControls(!showControls);
    };

    // Handle leave meeting
    const handleLeaveMeeting = async () => {
        if (room && currentParticipant) {
            await leaveRoom(room.id, currentParticipant.id);
        }
        onEnd();
    };

    // Copy meeting link
    const copyMeetingLink = () => {
        if (room) {
            const link = `${window.location.origin}/meeting/${room.id}`;
            navigator.clipboard.writeText(link);
        }
    };

    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#1e1f22] via-[#2a2d31] to-[#1e1f22] flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto animation-delay-150"></div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Joining Meeting</h2>
                        <p className="text-zinc-400">Connecting you to the meeting room...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#1e1f22] via-[#2a2d31] to-[#1e1f22] flex items-center justify-center p-8">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Connection Error</h2>
                        <p className="text-zinc-400">{error}</p>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all hover:scale-105"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={onEnd}
                            className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-xl transition-all hover:scale-105"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1e1f22] via-[#2a2d31] to-[#1e1f22] flex flex-col relative">
            {/* Elegant Header */}
            <header className="bg-black/40 backdrop-blur-xl border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLeaveMeeting}
                            className="p-2.5 hover:bg-white/10 rounded-xl transition-all group"
                        >
                            <ChevronLeft className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                        </button>
                        <div className="space-y-1">
                            <h1 className="text-xl font-bold text-white tracking-tight">
                                {room?.name || "Meeting Room"}
                            </h1>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 text-red-400 rounded-full">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="font-medium">LIVE</span>
                                </div>
                                {room?.isPrivate && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">
                                        <Lock className="w-3 h-3" />
                                        <span className="font-medium">PRIVATE</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 text-zinc-400">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>{participants.length}/{room?.maxParticipants || 10}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={copyMeetingLink}
                            className="p-2.5 hover:bg-white/10 rounded-xl transition-all group"
                            title="Copy meeting link"
                        >
                            <Copy className="w-4.5 h-4.5 text-zinc-400 group-hover:text-white transition-colors" />
                        </button>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2.5 hover:bg-white/10 rounded-xl transition-all group"
                        >
                            <Settings className="w-4.5 h-4.5 text-zinc-400 group-hover:text-white transition-colors" />
                        </button>
                        <button
                            onClick={toggleControls}
                            className={cn(
                                "p-2.5 rounded-xl transition-all group",
                                showControls ? "bg-white/10 hover:bg-white/20" : "hover:bg-white/10"
                            )}
                            title={showControls ? "Hide controls" : "Show controls"}
                        >
                            {showControls ? (
                                <EyeOff className="w-4.5 h-4.5 text-zinc-400 group-hover:text-white transition-colors" />
                            ) : (
                                <Eye className="w-4.5 h-4.5 text-zinc-400 group-hover:text-white transition-colors" />
                            )}
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="p-2.5 hover:bg-white/10 rounded-xl transition-all group"
                        >
                            {isFullscreen ? (
                                <Minimize2 className="w-4.5 h-4.5 text-zinc-400 group-hover:text-white transition-colors" />
                            ) : (
                                <Maximize2 className="w-4.5 h-4.5 text-zinc-400 group-hover:text-white transition-colors" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Meeting Area */}
            <main className="flex-1 flex overflow-hidden relative">
                {/* Video Grid */}
                <div className="flex-1 relative">
                    {participants.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                            <div className="text-center space-y-6 max-w-md">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center mx-auto">
                                    <Users className="w-12 h-12 text-zinc-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white">Waiting for participants</h3>
                                    <p className="text-zinc-400">Share the meeting link to invite others</p>
                                </div>
                                <button
                                    onClick={copyMeetingLink}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all hover:scale-105 flex items-center gap-2 mx-auto"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy Meeting Link
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={cn(
                            "h-full p-4 grid gap-4 transition-all duration-300",
                            layoutMode === 'grid' && (
                                participants.length === 1 ? "grid-cols-1" :
                                participants.length === 2 ? "grid-cols-2" :
                                participants.length === 3 ? "grid-cols-3" :
                                participants.length === 4 ? "grid-cols-2" :
                                "grid-cols-3 lg:grid-cols-4"
                            ),
                            layoutMode === 'speaker' && "grid-cols-1"
                        )}>
                            {participants.map((participant, index) => (
                                <div
                                    key={participant.id}
                                    className={cn(
                                        "relative group rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20",
                                        layoutMode === 'speaker' && index === 0 ? "col-span-1 row-span-1" : "",
                                        layoutMode === 'speaker' && index > 0 ? "hidden" : ""
                                    )}
                                >
                                    {/* Video Background */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black">
                                        {participant.isVideoOff && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-full flex items-center justify-center">
                                                    <User className="w-8 h-8 text-zinc-600" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Participant Avatar */}
                                    <div className={cn(
                                        "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                                        participant.isVideoOff ? "opacity-100" : "opacity-0"
                                    )}>
                                        <div className={cn(
                                            "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-2xl transition-all duration-300 group-hover:scale-110",
                                            participant.role === 'host' ? "bg-gradient-to-br from-purple-600 to-blue-600" : "bg-gradient-to-br from-blue-600 to-cyan-600"
                                        )}>
                                            {participant.avatar}
                                        </div>
                                    </div>

                                    {/* Name Badge */}
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                                                <span className="text-sm font-bold text-white">{participant.name}</span>
                                                {participant.id === currentParticipant?.id && (
                                                    <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full text-white font-bold">YOU</span>
                                                )}
                                                {participant.role === 'host' && participant.id !== currentParticipant?.id && (
                                                    <span className="text-xs bg-purple-600 px-2 py-0.5 rounded-full text-white font-bold">HOST</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Indicators */}
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        {participant.isMuted && (
                                            <div className="w-8 h-8 bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                                <Mic className="w-4 h-4 text-red-500" />
                                            </div>
                                        )}
                                        {participant.hasScreenShare && (
                                            <div className="w-8 h-8 bg-green-500/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                                <Monitor className="w-4 h-4 text-green-500" />
                                            </div>
                                        )}
                                        {!participant.isMuted && (
                                            <div className="w-8 h-8 bg-green-500/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                                <div className="flex gap-0.5 items-end h-3">
                                                    <div className="w-0.5 h-full bg-green-500 rounded-full animate-pulse" />
                                                    <div className="w-0.5 h-[70%] bg-green-500 rounded-full animate-pulse delay-75" />
                                                    <div className="w-0.5 h-[90%] bg-green-500 rounded-full animate-pulse delay-150" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <div className="flex gap-2">
                                            <button className="p-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-colors">
                                                <Volume2 className="w-4 h-4 text-white" />
                                            </button>
                                            <button className="p-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-colors">
                                                <MoreVertical className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Layout Toggle */}
                    {participants.length > 1 && (
                        <div className="absolute top-4 right-4">
                            <div className="bg-black/40 backdrop-blur-md rounded-xl p-1 flex gap-1">
                                <button
                                    onClick={() => setLayoutMode('grid')}
                                    className={cn(
                                        "p-2 rounded-lg transition-all",
                                        layoutMode === 'grid' ? "bg-white/20 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10"
                                    )}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setLayoutMode('speaker')}
                                    className={cn(
                                        "p-2 rounded-lg transition-all",
                                        layoutMode === 'speaker' ? "bg-white/20 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10"
                                    )}
                                >
                                    <User className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebars */}
                {showParticipants && (
                    <aside className="w-80 bg-black/40 backdrop-blur-xl border-l border-white/10 flex flex-col">
                        <div className="p-4 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">Participants</h3>
                                <button
                                    onClick={() => setShowParticipants(false)}
                                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-zinc-400" />
                                </button>
                            </div>
                            <p className="text-sm text-zinc-400 mt-1">{participants.length} in meeting</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {participants.map((participant) => (
                                <div key={participant.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white",
                                        participant.role === 'host' ? "bg-gradient-to-br from-purple-600 to-blue-600" : "bg-gradient-to-br from-blue-600 to-cyan-600"
                                    )}>
                                        {participant.avatar}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white text-sm font-medium flex items-center gap-2">
                                            {participant.name}
                                            {participant.id === currentParticipant?.id && (
                                                <span className="text-xs bg-blue-600 px-1.5 py-0.5 rounded-full">You</span>
                                            )}
                                        </div>
                                        <div className="text-zinc-500 text-xs">
                                            {participant.role === 'host' ? 'Host' : 'Participant'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {participant.isMuted && <Mic className="w-3 h-3 text-red-500" />}
                                        {participant.isVideoOff && <Video className="w-3 h-3 text-red-500" />}
                                        {participant.hasScreenShare && <Monitor className="w-3 h-3 text-green-500" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}

                {showChat && (
                    <aside className="w-80 bg-black/40 backdrop-blur-xl border-l border-white/10 flex flex-col">
                        <div className="p-4 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">Meeting Chat</h3>
                                <button
                                    onClick={() => setShowChat(false)}
                                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-zinc-400" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-4">
                            <div className="text-center py-8">
                                <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                                <p className="text-zinc-500 text-sm">Chat feature coming soon...</p>
                                <p className="text-zinc-600 text-xs mt-1">Stay tuned for updates!</p>
                            </div>
                        </div>
                    </aside>
                )}
            </main>

            {/* Elegant Control Bar */}
            <div className={cn(
                "absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-500 ease-in-out",
                showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            )}>
                <div className="bg-black/60 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
                    <div className="flex items-center gap-3">
                        {/* Main Controls */}
                        <ControlBtn
                            icon={<Mic className="w-5 h-5" />}
                            label={isMuted ? "Unmute" : "Mute"}
                            active={isMuted}
                            color="bg-red-600"
                            onClick={() => setIsMuted(!isMuted)}
                        />
                        <ControlBtn
                            icon={<Video className="w-5 h-5" />}
                            label={isVideoOff ? "Start Video" : "Stop Video"}
                            active={isVideoOff}
                            color="bg-red-600"
                            onClick={() => setIsVideoOff(!isVideoOff)}
                        />
                        <ControlBtn
                            icon={<Monitor className="w-5 h-5" />}
                            label="Share Screen"
                            active={isScreenSharing}
                            color="bg-green-600"
                            onClick={() => setIsScreenSharing(!isScreenSharing)}
                        />
                        
                        <div className="w-px h-8 bg-white/20 mx-2" />
                        
                        {/* Secondary Controls */}
                        <ControlBtn
                            icon={<MessageSquare className="w-5 h-5" />}
                            label="Chat"
                            active={showChat}
                            color="bg-blue-600"
                            onClick={() => setShowChat(!showChat)}
                        />
                        <ControlBtn
                            icon={<Users className="w-5 h-5" />}
                            label="Participants"
                            active={showParticipants}
                            color="bg-purple-600"
                            onClick={() => setShowParticipants(!showParticipants)}
                        />
                        
                        <div className="w-px h-8 bg-white/20 mx-2" />
                        
                        {/* Leave Button */}
                        <button
                            onClick={handleLeaveMeeting}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/30"
                        >
                            <PhoneOff className="w-5 h-5" />
                            <span className="hidden sm:inline">Leave</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls Hint (when controls are hidden) */}
            {!showControls && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-500 ease-in-out opacity-100">
                    <div className="bg-black/40 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
                        <p className="text-xs text-zinc-400 text-center">Click Eye button to show controls</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function ControlBtn({
    icon,
    label,
    active,
    color,
    onClick
}: {
    icon: React.ReactNode,
    label: string,
    active?: boolean,
    color?: string,
    onClick?: () => void
}) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <button
                onClick={onClick}
                className={cn(
                    "p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg",
                    active
                        ? `${color} text-white shadow-lg shadow-current/30`
                        : "bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-white border border-white/20"
                )}
            >
                {icon}
            </button>
            <span className={cn(
                "text-xs font-medium uppercase tracking-wider transition-colors",
                active ? "text-white" : "text-zinc-500"
            )}>
                {label}
            </span>
        </div>
    );
}
