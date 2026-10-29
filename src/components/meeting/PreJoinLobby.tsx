"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, Loader2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type PreJoinLobbyProps = {
    roomId: string;
    roomName?: string;
    onJoin: (name: string, stream: MediaStream | null, isMuted: boolean, isVideoOff: boolean) => void;
    isJoining: boolean;
};

export default function PreJoinLobby({
    roomId,
    roomName,
    onJoin,
    isJoining
}: PreJoinLobbyProps) {
    const { user, logout } = useAuth();
    const displayName = user?.displayName || user?.username || "User";
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        let isCancelled = false;

        async function initPreview() {
            if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
                setHasPermission(false);
                setIsMuted(true);
                setIsVideoOff(true);
                return;
            }

            try {
                const s = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true },
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
                });
                if (isCancelled) {
                    s.getTracks().forEach(t => t.stop());
                    return;
                }
                streamRef.current = s;
                setStream(s);
                setHasPermission(true);
            } catch (err1) {
                try {
                    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
                    if (isCancelled) {
                        s.getTracks().forEach(t => t.stop());
                        return;
                    }
                    streamRef.current = s;
                    setStream(s);
                    setIsVideoOff(true);
                    setHasPermission(true);
                } catch (err2) {
                    setHasPermission(false);
                    setIsMuted(true);
                    setIsVideoOff(true);
                }
            }
        }

        initPreview();

        return () => {
            isCancelled = true;
        };
    }, []);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = isVideoOff ? null : stream;
        }
    }, [stream, isVideoOff]);

    const handleToggleMic = () => {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(t => {
                t.enabled = !nextMuted;
            });
        }
    };

    const handleToggleVideo = async () => {
        if (!isVideoOff) {
            setIsVideoOff(true);
            if (streamRef.current) {
                streamRef.current.getVideoTracks().forEach(t => {
                    t.stop();
                    streamRef.current?.removeTrack(t);
                });
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        } else {
            try {
                if (navigator.mediaDevices?.getUserMedia) {
                    const videoOnly = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
                    });
                    const track = videoOnly.getVideoTracks()[0];
                    if (track) {
                        if (!streamRef.current) {
                            streamRef.current = new MediaStream();
                        }
                        streamRef.current.addTrack(track);
                        setStream(new MediaStream(streamRef.current.getTracks()));
                        setIsVideoOff(false);
                    }
                }
            } catch (e) {
                setIsVideoOff(true);
            }
        }
    };

    const handleJoinClick = () => {
        if (isJoining) return;
        onJoin(displayName, streamRef.current, isMuted, isVideoOff);
    };

    const initials = displayName
        ? displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    return (
        <div className="flex-1 flex items-center justify-center bg-[#1e1f22] p-4 sm:p-8">
            <div className="w-full max-w-4xl grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7 flex flex-col items-center">
                    <div className="relative w-full aspect-video bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={cn("w-full h-full object-cover", isVideoOff && "hidden")}
                        />

                        {isVideoOff && (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                                {initials}
                            </div>
                        )}

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            <button
                                type="button"
                                onClick={handleToggleMic}
                                className={cn(
                                    "p-3 rounded-full transition text-white",
                                    isMuted ? "bg-red-600 hover:bg-red-700" : "bg-zinc-700 hover:bg-zinc-600"
                                )}
                            >
                                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <button
                                type="button"
                                onClick={handleToggleVideo}
                                className={cn(
                                    "p-3 rounded-full transition text-white",
                                    isVideoOff ? "bg-red-600 hover:bg-red-700" : "bg-zinc-700 hover:bg-zinc-600"
                                )}
                            >
                                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    {hasPermission === false && (
                        <p className="text-amber-400 text-xs mt-3 text-center">
                            Camera or microphone access is blocked. You can still join as a viewer.
                        </p>
                    )}
                </div>

                <div className="md:col-span-5 bg-[#2b2d31] p-8 rounded-3xl border border-zinc-800 shadow-xl space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Ready to join?</h2>
                        <p className="text-zinc-400 text-sm mt-1">
                            {roomName ? roomName : `Room: ${roomId}`}
                        </p>
                    </div>

                    <div className="bg-[#1e1f22] p-4 rounded-2xl border border-zinc-700/80 flex items-center gap-3.5">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={displayName}
                                className="w-12 h-12 rounded-full object-cover border border-zinc-600"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white shrink-0">
                                {initials}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-zinc-400 font-medium">Joining as</p>
                            <p className="text-base font-bold text-white truncate">{displayName}</p>
                            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleJoinClick}
                        disabled={isJoining}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-98"
                    >
                        {isJoining ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Joining meeting...
                            </>
                        ) : (
                            "Join now"
                        )}
                    </button>

                    <div className="text-center pt-1">
                        <button
                            type="button"
                            onClick={() => logout()}
                            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Not you? Switch account</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
