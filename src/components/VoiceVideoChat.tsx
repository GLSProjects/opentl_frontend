"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Users, Volume2, VolumeX, Maximize2, Minimize2, Monitor, Share } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { AnimatePresence, motion } from "framer-motion";

interface VoiceUser {
    socketId: string;
    userId: string;
    username: string;
    displayName?: string;
    avatar?: string;
    mediaType: "audio" | "video" | "both";
    isMuted: boolean;
    isDeafened: boolean;
    isVideoOff: boolean;
    joinedAt: Date;
    stream?: MediaStream;
    peerConnection?: RTCPeerConnection;
}

interface VoiceVideoChatProps {
    serverId: string;
    channelId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function VoiceVideoChat({ serverId, channelId, isOpen, onClose }: VoiceVideoChatProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [participants, setParticipants] = useState<VoiceUser[]>([]);
    const [isInCall, setIsInCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [mediaType, setMediaType] = useState<"audio" | "video">("audio");
    const [isMinimized, setIsMinimized] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "failed">("connecting");
    const [useFallback, setUseFallback] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    
    const socketRef = useRef<Socket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // WebRTC configuration
    const rtcConfig: RTCConfiguration = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { 
                urls: "turn:turn.relay.metered.ca:80", 
                username: "test", 
                credential: "test" 
            },
            { 
                urls: "turn:turn.openrelay.metered.ca:443", 
                username: "openrelayproject", 
                credential: "openrelayproject" 
            }
        ],
        iceCandidatePoolSize: 10
    };

    // Initialize media stream
    const initializeMedia = useCallback(async (type: "audio" | "video") => {
        try {
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 2
                },
                video: type === "video" ? {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 },
                    facingMode: "user"
                } : false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.play().catch(e => console.log("Video play error:", e));
            }

            // Set up audio context for volume monitoring
            if (!audioContextRef.current && stream.getAudioTracks().length > 0) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                const source = audioContextRef.current.createMediaStreamSource(stream);
                const analyser = audioContextRef.current.createAnalyser();
                source.connect(analyser);
            }

            return stream;
        } catch (error) {
            console.error("Error accessing media devices:", error);
            
            // Provide more specific error messages
            if (error instanceof DOMException) {
                switch (error.name) {
                    case 'NotAllowedError':
                        throw new Error("Camera/Microphone permission denied. Please allow access in your browser settings.");
                    case 'NotFoundError':
                        throw new Error("No camera or microphone found. Please connect a device.");
                    case 'NotReadableError':
                        throw new Error("Camera/Microphone is already in use by another application.");
                    case 'OverconstrainedError':
                        throw new Error("Camera/Microphone constraints cannot be satisfied.");
                    default:
                        throw new Error(`Error accessing media devices: ${error.message}`);
                }
            }
            throw error;
        }
    }, []);

    // Create peer connection
    const createPeerConnection = useCallback((socketId: string): RTCPeerConnection => {
        const pc = new RTCPeerConnection(rtcConfig);

        // Add local stream if available
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle ICE candidates with better error handling
        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                // Filter out relay candidates for better performance
                if (event.candidate.candidate !== 'relay' || !event.candidate.candidate?.includes('turn')) {
                    socketRef.current.emit("signal", {
                        to: socketId,
                        from: socketRef.current.id,
                        signal: event.candidate,
                        type: "ice-candidate"
                    });
                }
            }
        };

        // Handle ICE gathering state
        pc.onicegatheringstatechange = () => {
            console.log(`ICE gathering state with ${socketId}:`, pc.iceGatheringState);
        };

        // Handle connection state changes with more detailed logging
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${socketId}:`, pc.connectionState);
            if (pc.connectionState === 'connected') {
                setConnectionStatus("connected");
            } else if (pc.connectionState === 'failed') {
                setConnectionStatus("failed");
                console.warn(`Connection failed with ${socketId}, cleaning up...`);
                // Clean up failed connections
                pc.close();
                peerConnectionsRef.current.delete(socketId);
                setParticipants(prev => prev.filter(p => p.socketId !== socketId));
            } else if (pc.connectionState === 'disconnected') {
                console.log(`Connection disconnected with ${socketId}`);
                setParticipants(prev => prev.filter(p => p.socketId !== socketId));
            }
        };

        // Handle signaling state changes
        pc.onsignalingstatechange = () => {
            console.log(`Signaling state with ${socketId}:`, pc.signalingState);
        };

        // Handle remote stream with better error handling
        pc.ontrack = (event) => {
            if (event.streams && event.streams.length > 0) {
                const [remoteStream] = event.streams;
                console.log(`Received remote stream from ${socketId}`);
                setParticipants(prev => prev.map(p => 
                    p.socketId === socketId 
                        ? { ...p, stream: remoteStream }
                        : p
                ));
            }
        };

        // Handle negotiation needed
        pc.onnegotiationneeded = async () => {
            console.log(`Negotiation needed with ${socketId}`);
            try {
                if (pc.signalingState === 'stable') {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    
                    if (socketRef.current) {
                        socketRef.current.emit("signal", {
                            to: socketId,
                            from: socketRef.current.id,
                            signal: offer,
                            type: "offer"
                        });
                    }
                }
            } catch (error) {
                console.error("Error during renegotiation:", error);
            }
        };

        return pc;
    }, []);

    // Join voice channel
    const joinVoiceChannel = useCallback(async () => {
        if (!user || !socketRef.current) return;

        try {
            // Initialize media first
            const stream = await initializeMedia(mediaType);
            localStreamRef.current = stream;
            
            // Update local video if video is enabled
            if (localVideoRef.current && mediaType === "video") {
                localVideoRef.current.srcObject = stream;
            }

            setIsInCall(true);

            // Join the voice channel
            socketRef.current.emit("join-voice", {
                roomId: channelId,
                user,
                mediaType
            });

            // Update media state
            socketRef.current.emit("update-media-state", {
                roomId: channelId,
                state: { 
                    isMuted: isMuted || mediaType === "video", // Mute by default for video calls
                    isDeafened, 
                    isVideoOff: mediaType === "audio" 
                }
            });

        } catch (error) {
            console.error("Failed to join voice channel:", error);
            // Show user-friendly error message
            alert("Failed to access camera/microphone. Please check your permissions.");
        }
    }, [user, channelId, mediaType, isMuted, isDeafened, initializeMedia]);

    // Leave voice channel
    const leaveVoiceChannel = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit("leave-voice", { roomId: channelId });
        }

        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        // Close all peer connections
        peerConnectionsRef.current.forEach(pc => pc.close());
        peerConnectionsRef.current.clear();

        setIsInCall(false);
        setParticipants([]);
    }, [channelId]);

    // Handle disconnect with navigation
    const handleDisconnect = async () => {
        // Leave voice channel
        leaveVoiceChannel();
        
        // Close the modal
        onClose();
        
        // Navigate back to a text channel
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

    // Handle WebRTC signaling
    const handleSignal = useCallback(async ({ from, signal, type }: { from: string; signal: any; type: string }) => {
        let pc = peerConnectionsRef.current.get(from);

        try {
            if (type === "offer") {
                if (!pc) {
                    pc = createPeerConnection(from);
                    peerConnectionsRef.current.set(from, pc);
                }

                // Only set remote description if we're in stable state
                if (pc.signalingState === "stable") {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    
                    if (socketRef.current) {
                        socketRef.current.emit("signal", {
                            to: from,
                            from: socketRef.current.id,
                            signal: answer,
                            type: "answer"
                        });
                    }
                } else {
                    console.warn(`Ignoring offer - wrong state: ${pc.signalingState}`);
                }
            } else if (type === "answer") {
                if (!pc) {
                    console.warn("Received answer but no peer connection exists");
                    return;
                }
                
                // Only set remote description if we have a local offer
                if (pc.signalingState === "have-local-offer") {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                } else {
                    console.warn(`Ignoring answer - wrong state: ${pc.signalingState}`);
                }
            } else if (type === "ice-candidate") {
                if (pc && pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(signal));
                }
            }
        } catch (error) {
            console.error("Error handling signal:", error, "Type:", type, "State:", pc?.signalingState);
            
            // Clean up failed connection
            if (pc) {
                pc.close();
                peerConnectionsRef.current.delete(from);
            }
        }
    }, [createPeerConnection]);

    // Toggle media controls
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                
                if (socketRef.current) {
                    socketRef.current.emit("update-media-state", {
                        roomId: channelId,
                        state: { isMuted: !audioTrack.enabled }
                    });
                }
            }
        }
    }, [channelId]);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
                
                if (socketRef.current) {
                    socketRef.current.emit("update-media-state", {
                        roomId: channelId,
                        state: { isVideoOff: !videoTrack.enabled }
                    });
                }
            }
        }
    }, [channelId]);

    const toggleDeafen = useCallback(() => {
        setIsDeafened(!isDeafened);
        
        if (socketRef.current) {
            socketRef.current.emit("update-media-state", {
                roomId: channelId,
                state: { isDeafened: !isDeafened }
            });
        }
    }, [channelId]);

    // Screen sharing functionality
    const toggleScreenShare = useCallback(async () => {
        try {
            if (isScreenSharing) {
                // Stop screen sharing
                if (screenStream) {
                    screenStream.getTracks().forEach(track => track.stop());
                }
                
                // Replace screen share with camera
                if (mediaType === "video" && localStreamRef.current) {
                    const videoTrack = localStreamRef.current.getVideoTracks()[0];
                    if (videoTrack) {
                        videoTrack.enabled = true;
                    }
                }
                
                setScreenStream(null);
                setIsScreenSharing(false);
            } else {
                // Start screen sharing
                const displayMedia = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true
                    }
                });
                
                setScreenStream(displayMedia);
                setIsScreenSharing(true);
                
                // Add screen share track to all peer connections
                displayMedia.getTracks().forEach(track => {
                    peerConnectionsRef.current.forEach(pc => {
                        const senders = pc.getSenders();
                        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                        if (videoSender) {
                            pc.removeTrack(videoSender);
                            pc.addTrack(track, localStreamRef.current!);
                        }
                    });
                });
            }
        } catch (error) {
            console.error("Error toggling screen share:", error);
            alert("Failed to share screen. Please check your browser permissions.");
        }
    }, [isScreenSharing, screenStream, mediaType, channelId]);

    // Socket setup
    useEffect(() => {
        if (!isOpen || !user) return;

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://opentl-backend-1.onrender.com";
        socketRef.current = io(backendUrl, {
            transports: ["websocket"],
            withCredentials: true,
        });

        socketRef.current.on("all-participants", async (users: VoiceUser[]) => {
            for (const newUser of users) {
                // Only create connection if it doesn't exist
                if (!peerConnectionsRef.current.has(newUser.socketId)) {
                    const pc = createPeerConnection(newUser.socketId);
                    peerConnectionsRef.current.set(newUser.socketId, pc);
                    
                    try {
                        // Create offer for each participant
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        
                        if (socketRef.current) {
                            socketRef.current.emit("signal", {
                                to: newUser.socketId,
                                from: socketRef.current.id,
                                signal: offer,
                                type: "offer"
                            });
                        }
                    } catch (error) {
                        console.error("Error creating offer:", error);
                    }
                }
            }
            
            setParticipants(users);
        });

        socketRef.current.on("user-joined-voice", async (newUser: VoiceUser) => {
            // Only create connection if it doesn't exist
            if (!peerConnectionsRef.current.has(newUser.socketId)) {
                const pc = createPeerConnection(newUser.socketId);
                peerConnectionsRef.current.set(newUser.socketId, pc);
                
                try {
                    // Create offer for new user
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    
                    if (socketRef.current) {
                        socketRef.current.emit("signal", {
                            to: newUser.socketId,
                            from: socketRef.current.id,
                            signal: offer,
                            type: "offer"
                        });
                    }
                } catch (error) {
                    console.error("Error creating offer for new user:", error);
                }
            }
            
            setParticipants(prev => [...prev, newUser]);
        });

        socketRef.current.on("user-left-voice", ({ socketId }: { socketId: string }) => {
            const pc = peerConnectionsRef.current.get(socketId);
            if (pc) {
                pc.close();
                peerConnectionsRef.current.delete(socketId);
            }
            
            setParticipants(prev => prev.filter(p => p.socketId !== socketId));
        });

        socketRef.current.on("signal", handleSignal);

        socketRef.current.on("participant-media-changed", ({ socketId, state }: { socketId: string; state: any }) => {
            setParticipants(prev => prev.map(p => 
                p.socketId === socketId ? { ...p, ...state } : p
            ));
        });

        return () => {
            leaveVoiceChannel();
            socketRef.current?.disconnect();
        };
    }, [isOpen, user, channelId, createPeerConnection, handleSignal, leaveVoiceChannel]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`fixed bottom-4 right-4 bg-[#2b2d31] border border-zinc-700 rounded-lg shadow-2xl z-50 ${
                    isMinimized ? "w-80" : "w-96"
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-700">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-zinc-400" />
                        <span className="text-white font-medium">
                            Voice Chat - {participants.length + (isInCall ? 1 : 0)} users
                        </span>
                        {useFallback && (
                            <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                                Server Mode
                            </span>
                        )}
                        {!useFallback && (
                            <div className={`w-2 h-2 rounded-full ${
                                connectionStatus === "connected" ? "bg-green-500" :
                                connectionStatus === "connecting" ? "bg-yellow-500 animate-pulse" :
                                "bg-red-500"
                            }`} />
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition"
                        >
                            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition"
                        >
                            <PhoneOff className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {/* Local Video (if video is enabled) */}
                        {mediaType === "video" && isInCall && (
                            <div className="p-4 border-b border-zinc-700">
                                <div className="relative">
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full h-32 bg-black rounded-lg object-cover"
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                                        {user?.displayName || user?.username} (You)
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Participants */}
                        <div className="max-h-64 overflow-y-auto p-4 space-y-2">
                            {isInCall && (
                                <div className="flex items-center gap-3 p-2 bg-zinc-800 rounded">
                                    {mediaType === "video" && localStreamRef.current ? (
                                        <div className="relative">
                                            <video
                                                ref={localVideoRef}
                                                autoPlay
                                                muted
                                                playsInline
                                                className="w-16 h-16 bg-black rounded-lg object-cover"
                                            />
                                            <div className="absolute bottom-1 left-1 bg-black/50 px-1 py-0.5 rounded text-xs text-white">
                                                You
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            {(user?.displayName || user?.username)?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="text-white text-sm">{user?.displayName || user?.username} (You)</div>
                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            {isMuted && <MicOff className="w-3 h-3" />}
                                            {isVideoOff && <VideoOff className="w-3 h-3" />}
                                            {isDeafened && <VolumeX className="w-3 h-3" />}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Video Grid for multiple participants */}
                            {participants.length > 0 && mediaType === "video" && (
                                <div className={`grid gap-2 ${
                                    participants.length <= 1 ? 'grid-cols-1' :
                                    participants.length <= 4 ? 'grid-cols-2' :
                                    'grid-cols-3'
                                }`}>
                                    {participants.map(participant => (
                                        <div key={participant.socketId} className="relative bg-zinc-800 rounded-lg overflow-hidden">
                                            {participant.stream ? (
                                                <video
                                                    autoPlay
                                                    playsInline
                                                    className="w-full h-32 object-cover"
                                                    ref={video => {
                                                        if (video && participant.stream) {
                                                            video.srcObject = participant.stream;
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-32 bg-zinc-700 flex items-center justify-center">
                                                    {participant.avatar ? (
                                                        <img src={participant.avatar} alt={participant.username} className="w-12 h-12 rounded-full" />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                            {participant.username?.[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                                <div className="bg-black/50 px-2 py-1 rounded text-xs text-white">
                                                    {participant.displayName || participant.username}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {participant.isMuted && <MicOff className="w-3 h-3 text-white" />}
                                                    {participant.isVideoOff && <VideoOff className="w-3 h-3 text-white" />}
                                                    {participant.isDeafened && <VolumeX className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Audio-only participants list */}
                            {participants.length > 0 && mediaType === "audio" && (
                                <div className="space-y-2">
                                    {participants.map(participant => (
                                        <div key={participant.socketId} className="flex items-center gap-3 p-2 bg-zinc-800 rounded">
                                            {participant.avatar ? (
                                                <img src={participant.avatar} alt={participant.username} className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                    {participant.username?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="text-white text-sm">
                                                    {participant.displayName || participant.username}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                    {participant.isMuted && <MicOff className="w-3 h-3" />}
                                                    {participant.isVideoOff && <VideoOff className="w-3 h-3" />}
                                                    {participant.isDeafened && <VolumeX className="w-3 h-3" />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="p-4 border-t border-zinc-700">
                            {!isInCall ? (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setMediaType("audio")}
                                            className={`flex-1 py-2 px-4 rounded font-medium transition ${
                                                mediaType === "audio"
                                                    ? "bg-red-600 text-white"
                                                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                                            }`}
                                        >
                                            <Mic className="w-4 h-4 inline mr-2" />
                                            Voice Only
                                        </button>
                                        <button
                                            onClick={() => setMediaType("video")}
                                            className={`flex-1 py-2 px-4 rounded font-medium transition ${
                                                mediaType === "video"
                                                    ? "bg-red-600 text-white"
                                                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                                            }`}
                                        >
                                            <Video className="w-4 h-4 inline mr-2" />
                                            Video
                                        </button>
                                    </div>
                                    <button
                                        onClick={joinVoiceChannel}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium transition flex items-center justify-center"
                                    >
                                        <Phone className="w-4 h-4 mr-2" />
                                        Join Call
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={toggleMute}
                                            className={`flex-1 py-2 px-3 rounded font-medium transition flex items-center justify-center ${
                                                isMuted
                                                    ? "bg-red-600 text-white"
                                                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                                            }`}
                                        >
                                            {isMuted ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                                            {isMuted ? "Unmute" : "Mute"}
                                        </button>
                                        {mediaType === "video" && (
                                            <button
                                                onClick={toggleVideo}
                                                className={`flex-1 py-2 px-3 rounded font-medium transition flex items-center justify-center ${
                                                    isVideoOff
                                                        ? "bg-red-600 text-white"
                                                        : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                                                }`}
                                            >
                                                {isVideoOff ? <VideoOff className="w-4 h-4 mr-2" /> : <Video className="w-4 h-4 mr-2" />}
                                                {isVideoOff ? "Start Video" : "Stop Video"}
                                            </button>
                                        )}
                                        <button
                                            onClick={toggleDeafen}
                                            className={`flex-1 py-2 px-3 rounded font-medium transition flex items-center justify-center ${
                                                isDeafened
                                                    ? "bg-red-600 text-white"
                                                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                                            }`}
                                        >
                                            {isDeafened ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                                            {isDeafened ? "Undeafen" : "Deafen"}
                                        </button>
                                    </div>
                                    {mediaType === "video" && (
                                        <button
                                            onClick={toggleScreenShare}
                                            className={`p-3 rounded transition ${
                                                isScreenSharing
                                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                    : "bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                                            }`}
                                            title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
                                        >
                                            {isScreenSharing ? <Monitor className="w-5 h-5" /> : <Share className="w-5 h-5" />}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleDisconnect}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium transition flex items-center justify-center"
                                    >
                                        <PhoneOff className="w-4 h-4 mr-2" />
                                        Leave Call
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
