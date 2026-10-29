"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
    Mic, MicOff, Video, VideoOff, PhoneOff, Users, Share2, 
    AlertCircle, X, Crown, ChevronDown, Check, LogOut, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMeeting, Participant } from "@/hooks/useMeeting";
import { useAuth } from "@/context/AuthContext";
import PreJoinLobby from "@/components/meeting/PreJoinLobby";
import ShareMeetingModal from "@/components/meeting/ShareMeetingModal";
import ParticipantsPanel from "@/components/meeting/ParticipantsPanel";
import MeetingEnded from "@/components/meeting/MeetingEnded";

type MeetingAreaProps = {
    roomId?: string;
    userName?: string;
    onEnd: () => void;
};

type Toast = {
    id: string;
    message: string;
};

export default function DynamicMeetingArea({ roomId = "", userName: propUserName = "", onEnd }: MeetingAreaProps) {
    const { user, logout } = useAuth();
    const {
        participants,
        localStream,
        isMuted,
        isVideoOff,
        isConnected,
        isHost,
        error,
        mediaWarning,
        meetingEnded,
        setMediaWarning,
        joinMeeting,
        leaveMeeting,
        endMeetingForAll,
        toggleMute,
        toggleVideo,
        getRoomInfo,
    } = useMeeting();

    const [hasJoined, setHasJoined] = useState(false);
    const [joining, setJoining] = useState(false);
    const [roomName, setRoomName] = useState<string>("");
    const [meetingDuration, setMeetingDuration] = useState(0);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isHostFirstJoin, setIsHostFirstJoin] = useState(false);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [showLeaveMenu, setShowLeaveMenu] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [currentUserName, setCurrentUserName] = useState(propUserName);

    const prevParticipantsRef = useRef<Participant[]>([]);
    const leaveMenuRef = useRef<HTMLDivElement>(null);

    const addToast = useCallback((message: string) => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { id, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    useEffect(() => {
        if (!roomId) return;
        getRoomInfo(roomId).then(info => {
            if (info && info.name) {
                setRoomName(info.name);
            }
        });
    }, [roomId, getRoomInfo]);

    useEffect(() => {
        if (!hasJoined) return;
        const interval = setInterval(() => {
            setMeetingDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [hasJoined]);

    useEffect(() => {
        if (!hasJoined) return;
        const current = participants;
        const prev = prevParticipantsRef.current;

        current.forEach(p => {
            if (!prev.find(x => x.socketId === p.socketId)) {
                addToast(`${p.userName} joined the meeting`);
            }
        });

        prev.forEach(p => {
            if (!current.find(x => x.socketId === p.socketId)) {
                addToast(`${p.userName} left the meeting`);
            }
        });

        prevParticipantsRef.current = current;
    }, [participants, hasJoined, addToast]);

    useEffect(() => {
        if (!hasJoined) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
                e.preventDefault();
                toggleMute();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
                e.preventDefault();
                toggleVideo();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [hasJoined, toggleMute, toggleVideo]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (leaveMenuRef.current && !leaveMenuRef.current.contains(e.target as Node)) {
                setShowLeaveMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLobbyJoin = async (
        name: string,
        stream: MediaStream | null,
        initialMuted: boolean,
        initialVideoOff: boolean
    ) => {
        if (!roomId || joining) return;
        setJoining(true);
        const resolvedName = user?.displayName || user?.username || name;
        setCurrentUserName(resolvedName);

        await joinMeeting(
            roomId,
            { isMuted: initialMuted, isVideoOff: initialVideoOff },
            stream,
            user?.token
        );

        setHasJoined(true);
        setJoining(false);

        if (typeof window !== "undefined") {
            const isHostUser = !!sessionStorage.getItem(`meeting-host-${roomId}`);
            if (isHostUser) {
                setIsHostFirstJoin(true);
                setIsShareModalOpen(true);
            }
        }
    };

    const handleLeaveMeeting = () => {
        leaveMeeting();
        onEnd();
    };

    const handleConfirmEndForAll = () => {
        setShowEndConfirm(false);
        endMeetingForAll();
        leaveMeeting();
        onEnd();
    };

    const formatTimer = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    if (error === "UNAUTHORIZED") {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#1e1f22] p-4">
                <div className="w-full max-w-md bg-[#2b2d31] border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Login required</h2>
                        <p className="text-zinc-400 text-sm">Your session has expired or you are not signed in. Please log in to continue.</p>
                    </div>
                    <button
                        onClick={() => {
                            logout();
                            const path = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
                            window.location.href = `/signin?callback=${encodeURIComponent(path)}`;
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
                    >
                        Sign in again
                    </button>
                </div>
            </div>
        );
    }

    if (error === "REPLACED") {
        return <MeetingEnded reason="REPLACED" onReturn={onEnd} />;
    }

    if (meetingEnded) {
        return (
            <MeetingEnded
                endedBy={meetingEnded.endedBy}
                reason="HOST_ENDED"
                onReturn={onEnd}
            />
        );
    }

    if (error === "ROOM_NOT_FOUND") {
        return <MeetingEnded reason="NOT_FOUND" onReturn={onEnd} />;
    }

    if (error === "ROOM_ENDED") {
        return <MeetingEnded reason="ROOM_ENDED" onReturn={onEnd} />;
    }

    if (!hasJoined) {
        return (
            <PreJoinLobby
                roomId={roomId}
                roomName={roomName}
                onJoin={handleLobbyJoin}
                isJoining={joining}
            />
        );
    }

    const allTiles = [
        {
            socketId: "local",
            userName: user?.displayName || user?.username || currentUserName || "You",
            isLocal: true,
            isMuted,
            isVideoOff,
            isHost,
            stream: localStream,
        },
        ...participants.map(p => ({
            ...p,
            isLocal: false,
        })),
    ];

    const gridCols =
        allTiles.length === 1
            ? "grid-cols-1 max-w-4xl"
            : allTiles.length === 2
            ? "grid-cols-1 md:grid-cols-2 max-w-5xl"
            : allTiles.length <= 4
            ? "grid-cols-2 max-w-6xl"
            : "grid-cols-2 lg:grid-cols-3 max-w-7xl";

    return (
        <div className="flex-1 flex flex-col bg-[#1e1f22] h-full overflow-hidden relative">
            <div className="h-14 flex items-center justify-between px-4 sm:px-6 bg-[#2b2d31] border-b border-zinc-800 shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400 text-xs font-bold">LIVE</span>
                    </div>
                    <span className="text-white font-semibold text-sm truncate max-w-[200px] sm:max-w-xs">
                        {roomName || "Meeting Room"}
                    </span>
                    <span className="text-zinc-400 text-xs font-mono bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
                        {formatTimer(meetingDuration)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setIsHostFirstJoin(false);
                            setIsShareModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 text-zinc-300 hover:text-white text-xs transition px-3 py-1.5 bg-zinc-700/60 hover:bg-zinc-700 rounded-lg border border-zinc-600/50"
                    >
                        <Share2 className="w-3.5 h-3.5 text-blue-400" />
                        <span className="hidden sm:inline">Share</span>
                    </button>
                    <button
                        onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                        className={cn(
                            "flex items-center gap-1.5 text-xs transition px-3 py-1.5 rounded-lg border",
                            isParticipantsOpen
                                ? "bg-blue-600 border-blue-500 text-white"
                                : "text-zinc-300 hover:text-white bg-zinc-700/60 hover:bg-zinc-700 border-zinc-600/50"
                        )}
                    >
                        <Users className="w-3.5 h-3.5" />
                        <span>{allTiles.length}</span>
                    </button>
                </div>
            </div>

            {mediaWarning && (
                <div className="bg-amber-950/60 border-b border-amber-500/30 px-4 py-2 text-amber-300 text-xs flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>{mediaWarning}</span>
                    </div>
                    <button onClick={() => setMediaWarning(null)} className="text-zinc-400 hover:text-white p-1">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 pb-28 flex items-center justify-center">
                    <div className={cn("w-full grid gap-4 transition-all", gridCols)}>
                        {allTiles.map(tile => (
                            <VideoTile
                                key={tile.socketId}
                                socketId={tile.socketId}
                                userName={tile.userName}
                                isLocal={tile.isLocal}
                                isMuted={tile.isMuted}
                                isVideoOff={tile.isVideoOff}
                                isHost={tile.isHost}
                                stream={tile.stream}
                            />
                        ))}
                    </div>
                </div>

                <ParticipantsPanel
                    isOpen={isParticipantsOpen}
                    onClose={() => setIsParticipantsOpen(false)}
                    localUserName={user?.displayName || user?.username || currentUserName || "You"}
                    isLocalMuted={isMuted}
                    isLocalVideoOff={isVideoOff}
                    isLocalHost={isHost}
                    participants={participants}
                />
            </div>

            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
                <div className="flex items-center gap-3 bg-[#2b2d31]/95 backdrop-blur-md px-5 py-3 rounded-2xl border border-zinc-700/80 shadow-2xl">
                    <button
                        onClick={toggleMute}
                        title={`Toggle Microphone (${navigator?.platform?.includes("Mac") ? "Cmd" : "Ctrl"}+D)`}
                        className={cn(
                            "p-3.5 rounded-xl transition active:scale-95 text-white flex items-center justify-center shadow-md",
                            isMuted ? "bg-red-600 hover:bg-red-700" : "bg-zinc-700 hover:bg-zinc-600"
                        )}
                    >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={toggleVideo}
                        title={`Toggle Camera (${navigator?.platform?.includes("Mac") ? "Cmd" : "Ctrl"}+E)`}
                        className={cn(
                            "p-3.5 rounded-xl transition active:scale-95 text-white flex items-center justify-center shadow-md",
                            isVideoOff ? "bg-red-600 hover:bg-red-700" : "bg-zinc-700 hover:bg-zinc-600"
                        )}
                    >
                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => {
                            setIsHostFirstJoin(false);
                            setIsShareModalOpen(true);
                        }}
                        title="Share Meeting Link"
                        className="p-3.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white transition active:scale-95 flex items-center justify-center shadow-md"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                        title="Participants"
                        className={cn(
                            "p-3.5 rounded-xl transition active:scale-95 flex items-center justify-center shadow-md text-white relative",
                            isParticipantsOpen ? "bg-blue-600" : "bg-zinc-700 hover:bg-zinc-600"
                        )}
                    >
                        <Users className="w-5 h-5" />
                        {participants.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-[#2b2d31]">
                                {allTiles.length}
                            </span>
                        )}
                    </button>

                    <div className="relative" ref={leaveMenuRef}>
                        {isHost ? (
                            <div className="flex items-center">
                                <button
                                    onClick={() => setShowLeaveMenu(!showLeaveMenu)}
                                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3.5 rounded-xl transition active:scale-95 shadow-md shadow-red-600/30"
                                >
                                    <PhoneOff className="w-5 h-5" />
                                    <span className="text-sm">Leave</span>
                                    <ChevronDown className="w-4 h-4 ml-0.5" />
                                </button>

                                {showLeaveMenu && (
                                    <div className="absolute bottom-full mb-3 right-0 w-56 bg-[#2b2d31] border border-zinc-700 rounded-2xl p-1.5 shadow-2xl space-y-1 animate-in zoom-in-95 duration-150">
                                        <button
                                            onClick={() => {
                                                setShowLeaveMenu(false);
                                                handleLeaveMeeting();
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-zinc-200 hover:text-white hover:bg-zinc-700/60 text-xs font-semibold transition"
                                        >
                                            <LogOut className="w-4 h-4 text-zinc-400" />
                                            <span>Leave meeting</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowLeaveMenu(false);
                                                setShowEndConfirm(true);
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400 hover:text-white hover:bg-red-600/80 text-xs font-semibold transition"
                                        >
                                            <ShieldAlert className="w-4 h-4" />
                                            <span>End meeting for all</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={handleLeaveMeeting}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3.5 rounded-xl transition active:scale-95 shadow-md shadow-red-600/30"
                            >
                                <PhoneOff className="w-5 h-5" />
                                <span className="text-sm">Leave</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <ShareMeetingModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                roomId={roomId}
                roomName={roomName}
                isHostFirstJoin={isHostFirstJoin}
            />

            {showEndConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#2b2d31] w-full max-w-sm rounded-3xl p-6 border border-zinc-700 shadow-2xl space-y-5 text-white">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto border border-red-500/30">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-bold">End meeting for all?</h3>
                            <p className="text-zinc-400 text-xs">
                                Everyone in this meeting will be disconnected immediately.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowEndConfirm(false)}
                                className="flex-1 py-2.5 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-xs font-bold transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmEndForAll}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold transition text-white"
                            >
                                End for all
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-20 left-6 z-40 space-y-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className="bg-black/80 backdrop-blur-md text-white text-xs px-3.5 py-2 rounded-xl border border-white/10 shadow-xl animate-in slide-in-from-bottom-2 duration-200"
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
}

function useAudioSpeaking(stream: MediaStream | null | undefined, isMuted: boolean): boolean {
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        if (!stream || isMuted) {
            setIsSpeaking(false);
            return;
        }

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0 || !audioTracks[0].enabled) {
            setIsSpeaking(false);
            return;
        }

        let audioCtx: AudioContext | null = null;
        let analyser: AnalyserNode | null = null;
        let source: MediaStreamAudioSourceNode | null = null;
        let animId: number;

        try {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            audioCtx = new AudioContextClass();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const checkAudio = () => {
                if (!analyser) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                setIsSpeaking(average > 14);
                animId = requestAnimationFrame(checkAudio);
            };

            animId = requestAnimationFrame(checkAudio);
        } catch (e) {
            setIsSpeaking(false);
        }

        return () => {
            if (animId) cancelAnimationFrame(animId);
            if (source) source.disconnect();
            if (audioCtx && audioCtx.state !== "closed") audioCtx.close();
        };
    }, [stream, isMuted]);

    return isSpeaking;
}

type VideoTileProps = {
    socketId: string;
    userName: string;
    isLocal: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
    isHost?: boolean;
    stream?: MediaStream | null;
};

function VideoTile({
    socketId,
    userName,
    isLocal,
    isMuted,
    isVideoOff,
    isHost,
    stream,
}: VideoTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const isSpeaking = useAudioSpeaking(stream, isMuted);

    useEffect(() => {
        if (!isLocal && audioRef.current && stream) {
            audioRef.current.srcObject = stream;
            audioRef.current.play().catch(() => {});
        }
    }, [stream, isLocal]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (stream && !isVideoOff) {
            video.srcObject = stream;
            video.play().catch(() => {});
        } else {
            video.srcObject = null;
        }
    }, [stream, isVideoOff]);

    const initials = userName
        ? userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    return (
        <div
            className={cn(
                "relative bg-zinc-900 rounded-2xl overflow-hidden border transition-all duration-200 flex items-center justify-center group aspect-video shadow-lg",
                isSpeaking ? "border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500/40" : "border-zinc-800"
            )}
        >
            {!isLocal && (
                <audio
                    ref={audioRef}
                    autoPlay
                    playsInline
                    className="hidden"
                />
            )}

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn("w-full h-full object-cover", isVideoOff && "hidden")}
            />

            {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <div
                        className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-xl transition-transform",
                            isSpeaking && "scale-105 ring-4 ring-emerald-500/40",
                            isLocal
                                ? "bg-gradient-to-br from-blue-600 to-indigo-700"
                                : "bg-gradient-to-br from-zinc-700 to-zinc-800"
                        )}
                    >
                        {initials}
                    </div>
                </div>
            )}

            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 max-w-[85%]">
                <span className="text-white text-xs font-semibold truncate">
                    {isLocal ? `${userName} (You)` : userName}
                </span>
                {isHost && (
                    <span className="flex items-center gap-1 text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded-md border border-amber-500/30 shrink-0">
                        <Crown className="w-2.5 h-2.5" /> Host
                    </span>
                )}
                {isMuted && <MicOff className="w-3.5 h-3.5 text-red-400 shrink-0" />}
            </div>

            {isLocal && (
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                    YOU
                </div>
            )}
        </div>
    );
}
