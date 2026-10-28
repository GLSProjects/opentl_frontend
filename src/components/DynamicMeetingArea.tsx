"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Copy, Loader2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMeeting } from "@/hooks/useMeeting";

type MeetingAreaProps = {
    roomId?: string;
    userName?: string;
    onEnd: () => void;
};

export default function DynamicMeetingArea({ roomId, userName: propUserName, onEnd }: MeetingAreaProps) {
    const { 
        participants, 
        localStream, 
        isMuted, 
        isVideoOff, 
        isConnected, 
        error, 
        mediaWarning, 
        setMediaWarning, 
        joinMeeting, 
        leaveMeeting, 
        toggleMute, 
        toggleVideo 
    } = useMeeting();

    const [userName, setUserName] = useState(propUserName || '');
    const [hasJoined, setHasJoined] = useState(false);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        if (roomId && propUserName && !hasJoined) {
            handleJoin(propUserName);
        }
    }, [roomId, propUserName]);

    const handleJoin = async (name: string) => {
        if (!roomId || !name.trim()) return;
        setJoining(true);
        await joinMeeting(roomId, `user-${Date.now()}`, name.trim());
        setHasJoined(true);
        setJoining(false);
    };

    const handleLeave = () => {
        leaveMeeting();
        onEnd();
    };

    const copyLink = () => {
        if (roomId) navigator.clipboard.writeText(`${window.location.origin}/meeting/${roomId}`);
    };

    if (!hasJoined) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#1e1f22] p-8">
                <div className="bg-[#2b2d31] rounded-2xl p-8 w-full max-w-md border border-zinc-700 space-y-6">
                    <div className="text-center">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Video className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Join Meeting</h2>
                        <p className="text-zinc-400 text-sm mt-1">Room: <span className="text-blue-400 font-mono">{roomId}</span></p>
                    </div>
                    <div className="space-y-3">
                        <label className="text-sm text-zinc-400 font-medium">Your Name</label>
                        <input
                            type="text"
                            value={userName}
                            onChange={e => setUserName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleJoin(userName)}
                            placeholder="Enter your name..."
                            className="w-full bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>
                    <button
                        onClick={() => handleJoin(userName)}
                        disabled={!userName.trim() || joining}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                    >
                        {joining ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</> : 'Join Meeting'}
                    </button>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                </div>
            </div>
        );
    }

    if (error && !isConnected) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#1e1f22] p-8">
                <div className="text-center space-y-4">
                    <p className="text-red-400 text-lg font-semibold">{error}</p>
                    <button onClick={() => { setHasJoined(false); setJoining(false); }} className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const allTiles = [
        { socketId: 'local', userName: userName || 'You', isLocal: true, isMuted, isVideoOff, stream: localStream },
        ...participants.map(p => ({ ...p, isLocal: false })),
    ];

    const gridCols =
        allTiles.length === 1 ? 'grid-cols-1 max-w-4xl' :
        allTiles.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-5xl' :
        allTiles.length <= 4 ? 'grid-cols-2 max-w-6xl' :
        'grid-cols-2 lg:grid-cols-3 max-w-7xl';

    return (
        <div className="flex-1 flex flex-col bg-[#1e1f22] h-full overflow-hidden">
            <div className="h-14 flex items-center justify-between px-6 bg-[#2b2d31] border-b border-black shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400 text-xs font-bold">LIVE</span>
                    </div>
                    <span className="text-white font-semibold text-sm">Meeting Room</span>
                    <span className="text-zinc-500 text-xs flex items-center gap-1"><Users className="w-3 h-3" /> {allTiles.length}</span>
                </div>
                <button onClick={copyLink} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs transition px-3 py-1.5 hover:bg-zinc-700 rounded-lg">
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                </button>
            </div>

            {mediaWarning && (
                <div className="bg-amber-950/60 border-b border-amber-500/30 px-4 py-2 text-amber-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>{mediaWarning}</span>
                    </div>
                    <button onClick={() => setMediaWarning(null)} className="text-zinc-400 hover:text-white p-1">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
                <div className={cn("w-full grid gap-4", gridCols)}>
                    {allTiles.map(tile => (
                        <VideoTile
                            key={tile.socketId}
                            socketId={tile.socketId}
                            userName={tile.userName}
                            isLocal={tile.isLocal}
                            isMuted={tile.isMuted}
                            isVideoOff={tile.isVideoOff}
                            stream={tile.stream}
                        />
                    ))}
                </div>
            </div>

            <div className="h-20 flex items-center justify-center gap-4 bg-[#2b2d31] border-t border-black shrink-0">
                <ControlBtn
                    onClick={toggleMute}
                    active={isMuted}
                    activeColor="bg-red-600"
                    icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    label={isMuted ? 'Unmute' : 'Mute'}
                />
                <ControlBtn
                    onClick={toggleVideo}
                    active={isVideoOff}
                    activeColor="bg-red-600"
                    icon={isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    label={isVideoOff ? 'Start Video' : 'Stop Video'}
                />
                <button
                    onClick={handleLeave}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition active:scale-95"
                >
                    <PhoneOff className="w-5 h-5" />
                    Leave
                </button>
            </div>
        </div>
    );
}

type VideoTileProps = {
    socketId: string;
    userName: string;
    isLocal: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
    stream?: MediaStream | null;
};

function VideoTile({ socketId, userName, isLocal, isMuted, isVideoOff, stream }: VideoTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    const hasVideoTracks = !!(stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks().some(t => t.enabled && t.readyState === 'live'));
    const showVideo = hasVideoTracks && !isVideoOff;

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (stream && showVideo) {
            video.srcObject = stream;
            video.muted = isLocal;
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {});
            }
        } else {
            video.srcObject = null;
        }
    }, [stream, isLocal, showVideo]);

    const initials = userName ? userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

    return (
        <div className="relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center group aspect-video">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className={cn("w-full h-full object-cover", !showVideo && "hidden")}
            />

            {!showVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg",
                        isLocal ? "bg-gradient-to-br from-blue-600 to-purple-600" : "bg-gradient-to-br from-zinc-700 to-zinc-800"
                    )}>
                        {initials}
                    </div>
                </div>
            )}

            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                <span className="text-white text-xs font-semibold">{isLocal ? `${userName} (You)` : userName}</span>
                {isMuted && <MicOff className="w-3 h-3 text-red-400" />}
            </div>

            {isLocal && (
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">YOU</div>
            )}
        </div>
    );
}

type ControlBtnProps = {
    onClick: () => void;
    active: boolean;
    activeColor: string;
    icon: React.ReactNode;
    label: string;
};

function ControlBtn({ onClick, active, activeColor, icon, label }: ControlBtnProps) {
    return (
        <div className="flex flex-col items-center gap-1">
            <button
                onClick={onClick}
                className={cn(
                    "p-3 rounded-xl transition-all hover:scale-105 active:scale-95",
                    active ? `${activeColor} text-white` : "bg-zinc-700 hover:bg-zinc-600 text-white"
                )}
            >
                {icon}
            </button>
            <span className="text-zinc-500 text-[10px] font-medium uppercase tracking-wide">{label}</span>
        </div>
    );
}
