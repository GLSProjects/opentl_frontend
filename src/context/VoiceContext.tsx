"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import Peer from "simple-peer";
import { useAuth } from "./AuthContext";
import api from "@/lib/api";

interface VoiceParticipant {
    socketId: string;
    userId: string;
    username: string;
    avatar?: string;
    stream?: MediaStream;
    isSpeaking?: boolean;
    isMuted?: boolean;
    isVideoEnabled?: boolean;
    isScreenSharing?: boolean;
}

interface VoiceContextType {
    localStream: MediaStream | null;
    participants: VoiceParticipant[];
    globalVoiceState: { [key: string]: any[] };
    isMuted: boolean;
    isDeafened: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
    audioInputDevices: MediaDeviceInfo[];
    selectedAudioInput: string;
    setSelectedAudioInput: (deviceId: string) => void;
    joinVoiceChannel: (roomId: string) => void;
    leaveVoiceChannel: () => void;
    toggleMute: () => void;
    toggleDeafen: () => void;
    toggleVideo: () => void;
    toggleScreenShare: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedAudioInput, setSelectedAudioInput] = useState<string>("default");

    const [globalVoiceState, setGlobalVoiceState] = useState<{ [key: string]: any[] }>({});

    const socketRef = useRef<Socket | null>(null);
    const peersRef = useRef<{ [key: string]: any }>({});
    const currentRoomRef = useRef<string | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        // Enumerate devices
        const getDevices = async () => {
            const devices = await navigator.mediaDevices.enumerateDevices();
            setAudioInputDevices(devices.filter(d => d.kind === "audioinput"));
        };
        getDevices();

        socketRef.current = io(api.base);

        socketRef.current.on("voice-state-update", (state: any) => {
            setGlobalVoiceState(state);
        });

        socketRef.current.on("signal", ({ from, signal }) => {
            const peer = peersRef.current[from];
            if (peer) {
                peer.signal(signal);
            }
        });

        socketRef.current.on("user-joined", (userData: any) => {
            console.log("User joined:", userData.username);
            if (localStream) {
                const peer = createPeer(userData.socketId, socketRef.current!.id!, localStream);
                peersRef.current[userData.socketId] = peer;
                setParticipants(prev => [...prev, { ...userData, isMuted: false, isVideoEnabled: false, isScreenSharing: false }]);
            }
        });

        socketRef.current.on("all-participants", (users: any[]) => {
            console.log("Existing participants:", users.length);
            const newPeers: { [key: string]: any } = {};
            users.forEach(u => {
                const peer = addPeer(u.socketId, socketRef.current!.id!, localStream!);
                newPeers[u.socketId] = peer;
            });
            peersRef.current = { ...peersRef.current, ...newPeers };
            setParticipants(users.map(u => ({ ...u, isMuted: false, isVideoEnabled: false, isScreenSharing: false })));
        });

        socketRef.current.on("user-left", ({ socketId }) => {
            if (peersRef.current[socketId]) {
                peersRef.current[socketId].destroy();
                delete peersRef.current[socketId];
            }
            setParticipants(prev => prev.filter(p => p.socketId !== socketId));
        });

        socketRef.current.on("participant-state-changed", ({ socketId, state }) => {
            setParticipants(prev => prev.map(p =>
                p.socketId === socketId ? { ...p, ...state } : p
            ));
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [localStream]);

    useEffect(() => {
        if (localStream && selectedAudioInput !== "default") {
            const switchTrack = async () => {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: { exact: selectedAudioInput } }
                });
                const newTrack = newStream.getAudioTracks()[0];
                const oldTrack = localStream.getAudioTracks()[0];

                localStream.removeTrack(oldTrack);
                localStream.addTrack(newTrack);
                oldTrack.stop();

                Object.values(peersRef.current).forEach(peer => {
                    peer.replaceTrack(oldTrack, newTrack, localStream);
                });
            };
            switchTrack();
        }
    }, [selectedAudioInput]);

    const broadcastState = (state: any) => {
        socketRef.current?.emit("update-state", { roomId: currentRoomRef.current, state });
    };

    const joinVoiceChannel = async (roomId: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setLocalStream(stream);
            currentRoomRef.current = roomId;
            socketRef.current?.emit("join-voice", { roomId, user });
        } catch (err) {
            console.error("Failed to get local stream", err);
        }
    };

    const leaveVoiceChannel = () => {
        socketRef.current?.emit("leave-voice", { roomId: currentRoomRef.current });
        localStream?.getTracks().forEach(track => track.stop());
        screenStreamRef.current?.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        setParticipants([]);
        Object.values(peersRef.current).forEach(peer => peer.destroy());
        peersRef.current = {};
        currentRoomRef.current = null;
        setIsVideoEnabled(false);
        setIsScreenSharing(false);
    };

    const createPeer = (userToSignal: string, callerId: string, stream: MediaStream) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", (signal: any) => {
            socketRef.current?.emit("signal", { to: userToSignal, from: callerId, signal });
        });

        peer.on("stream", (remoteStream: MediaStream) => {
            setParticipants(prev => prev.map(p =>
                p.socketId === userToSignal ? { ...p, stream: remoteStream } : p
            ));
        });

        return peer;
    };

    const addPeer = (incomingSignal: string, callerId: string, stream: MediaStream) => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        });

        peer.on("signal", (signal: any) => {
            socketRef.current?.emit("signal", { to: incomingSignal, from: callerId, signal });
        });

        peer.on("stream", (remoteStream: MediaStream) => {
            setParticipants(prev => prev.map(p =>
                p.socketId === incomingSignal ? { ...p, stream: remoteStream } : p
            ));
        });

        return peer;
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
            broadcastState({ isMuted: !isMuted });
        }
    };

    const toggleDeafen = () => {
        setIsDeafened(!isDeafened);
        // Logical deafness would involve muting all remote audio elements
    };

    const toggleVideo = async () => {
        if (!localStream) return;

        if (isVideoEnabled) {
            localStream.getVideoTracks().forEach(track => {
                track.stop();
                localStream.removeTrack(track);
            });
            setIsVideoEnabled(false);
            broadcastState({ isVideoEnabled: false });
        } else {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const videoTrack = videoStream.getVideoTracks()[0];
                localStream.addTrack(videoTrack);

                Object.values(peersRef.current).forEach(peer => {
                    peer.addTrack(videoTrack, localStream);
                });

                setIsVideoEnabled(true);
                broadcastState({ isVideoEnabled: true });
            } catch (err) {
                console.error("Failed to enable video", err);
            }
        }
    };

    const toggleScreenShare = async () => {
        if (!localStream) return;

        if (isScreenSharing) {
            screenStreamRef.current?.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
            setIsScreenSharing(false);
            broadcastState({ isScreenSharing: false });
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];

                Object.values(peersRef.current).forEach(peer => {
                    peer.replaceTrack(
                        localStream.getVideoTracks()[0],
                        screenTrack,
                        localStream
                    );
                });

                screenTrack.onended = () => {
                    setIsScreenSharing(false);
                    broadcastState({ isScreenSharing: false });
                };

                setIsScreenSharing(true);
                broadcastState({ isScreenSharing: true });
            } catch (err) {
                console.error("Failed to share screen", err);
            }
        }
    };

    return (
        <VoiceContext.Provider value={{
            localStream,
            participants,
            globalVoiceState,
            isMuted,
            isDeafened,
            isVideoEnabled,
            isScreenSharing,
            audioInputDevices,
            selectedAudioInput,
            setSelectedAudioInput,
            joinVoiceChannel,
            leaveVoiceChannel,
            toggleMute,
            toggleDeafen,
            toggleVideo,
            toggleScreenShare
        }}>
            {children}
        </VoiceContext.Provider>
    );
};

export const useVoice = () => {
    const context = useContext(VoiceContext);
    if (context === undefined) {
        throw new Error("useVoice must be used within a VoiceProvider");
    }
    return context;
};
