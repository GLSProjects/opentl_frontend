"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type Participant = {
    socketId: string;
    userId: string;
    userName: string;
    avatar: string;
    isMuted: boolean;
    isVideoOff: boolean;
    stream?: MediaStream;
};

type UseMeetingReturn = {
    participants: Participant[];
    localStream: MediaStream | null;
    isMuted: boolean;
    isVideoOff: boolean;
    isConnected: boolean;
    error: string | null;
    mediaWarning: string | null;
    setMediaWarning: (warning: string | null) => void;
    joinMeeting: (roomId: string, userId: string, userName: string, avatar?: string) => Promise<void>;
    leaveMeeting: () => void;
    toggleMute: () => Promise<void>;
    toggleVideo: () => Promise<void>;
    createRoom: (roomName: string, hostName: string, isPrivate?: boolean) => Promise<any>;
    getActiveRooms: () => Promise<any[]>;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://opentl-backend-hj2y.onrender.com';

const RTC_CONFIG: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { 
            urls: 'turn:turn.relay.metered.ca:80', 
            username: 'test', 
            credential: 'test' 
        },
        { 
            urls: 'turn:turn.openrelay.metered.ca:443', 
            username: 'openrelayproject', 
            credential: 'openrelayproject' 
        }
    ],
    iceCandidatePoolSize: 10,
};

export function useMeeting(): UseMeetingReturn {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mediaWarning, setMediaWarning] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const iceCandidateQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const roomIdRef = useRef<string | null>(null);
    const userInfoRef = useRef<{ userId: string; userName: string; avatar: string } | null>(null);

    const createPeerConnection = useCallback((targetSocketId: string): RTCPeerConnection => {
        const pc = new RTCPeerConnection(RTC_CONFIG);

        if (localStreamRef.current && localStreamRef.current.getTracks().length > 0) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        const transceivers = pc.getTransceivers();
        if (!transceivers.some(t => t.receiver?.track?.kind === 'audio')) {
            try { pc.addTransceiver('audio', { direction: 'recvonly' }); } catch (e) {}
        }
        if (!transceivers.some(t => t.receiver?.track?.kind === 'video')) {
            try { pc.addTransceiver('video', { direction: 'recvonly' }); } catch (e) {}
        }

        pc.ontrack = (event) => {
            setParticipants(prev => prev.map(p => {
                if (p.socketId !== targetSocketId) return p;
                const existingStream = p.stream;
                let newStream: MediaStream;
                if (event.streams && event.streams[0]) {
                    newStream = new MediaStream(event.streams[0].getTracks());
                } else if (existingStream) {
                    const tracks = existingStream.getTracks().filter(t => t.id !== event.track.id);
                    newStream = new MediaStream([...tracks, event.track]);
                } else {
                    newStream = new MediaStream([event.track]);
                }
                const hasVideo = newStream.getVideoTracks().some(t => t.enabled);
                return { ...p, stream: newStream, isVideoOff: !hasVideo };
            }));
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('meeting-ice-candidate', {
                    targetSocketId,
                    candidate: event.candidate,
                    fromSocketId: socketRef.current.id,
                });
            }
        };

        peerConnectionsRef.current.set(targetSocketId, pc);
        return pc;
    }, []);

    const joinMeeting = useCallback(async (roomId: string, userId: string, userName: string, avatar = '') => {
        setError(null);
        setMediaWarning(null);
        roomIdRef.current = roomId;
        userInfoRef.current = { userId, userName, avatar };

        let stream: MediaStream | null = null;
        let initialMuted = false;
        let initialVideoOff = false;

        const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator?.mediaDevices?.getUserMedia;

        if (hasMediaDevices) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true },
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                });
            } catch (err1) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: { echoCancellation: true, noiseSuppression: true },
                        video: false,
                    });
                    initialVideoOff = true;
                    setMediaWarning('Camera unavailable or permission denied. Joined with microphone only.');
                } catch (err2) {
                    stream = new MediaStream();
                    initialMuted = true;
                    initialVideoOff = true;
                    setMediaWarning('Camera and microphone permission denied. Joined in listen-only mode.');
                }
            }
        } else {
            stream = new MediaStream();
            initialMuted = true;
            initialVideoOff = true;
            setMediaWarning('Camera & mic require HTTPS or localhost. Joined in listen-only mode.');
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsMuted(initialMuted);
        setIsVideoOff(initialVideoOff);

        try {
            const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
            socketRef.current = socket;

            socket.on('connect', () => {
                setIsConnected(true);
                socket.emit('meeting-join', {
                    roomId,
                    userId,
                    userName,
                    avatar,
                    isMuted: initialMuted,
                    isVideoOff: initialVideoOff,
                });
            });

            socket.on('connect_error', (err) => {
                setError('Failed to connect to server');
                console.error('Socket connect error:', err);
            });

            socket.on('meeting-existing-users', async (users: Array<{ socketId: string; userId: string; userName: string; avatar: string; isMuted?: boolean; isVideoOff?: boolean }>) => {
                setParticipants(users.map(u => ({
                    ...u,
                    isMuted: u.isMuted ?? false,
                    isVideoOff: u.isVideoOff ?? false,
                })));

                for (const user of users) {
                    const pc = createPeerConnection(user.socketId);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('meeting-offer', {
                        targetSocketId: user.socketId,
                        offer,
                        fromSocketId: socket.id,
                        userName,
                    });
                }
            });

            socket.on('meeting-user-joined', (user: { socketId: string; userId: string; userName: string; avatar: string; isMuted?: boolean; isVideoOff?: boolean }) => {
                setParticipants(prev => {
                    if (prev.find(p => p.socketId === user.socketId)) return prev;
                    return [...prev, {
                        ...user,
                        isMuted: user.isMuted ?? false,
                        isVideoOff: user.isVideoOff ?? false,
                    }];
                });
            });

            socket.on('meeting-offer', async ({ offer, fromSocketId, userName: fromName }: { offer: RTCSessionDescriptionInit; fromSocketId: string; userName: string }) => {
                const pc = createPeerConnection(fromSocketId);
                await pc.setRemoteDescription(new RTCSessionDescription(offer));

                const queue = iceCandidateQueue.current.get(fromSocketId) || [];
                for (const candidate of queue) {
                    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
                }
                iceCandidateQueue.current.delete(fromSocketId);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('meeting-answer', {
                    targetSocketId: fromSocketId,
                    answer,
                    fromSocketId: socket.id,
                });
            });

            socket.on('meeting-answer', async ({ answer, fromSocketId }: { answer: RTCSessionDescriptionInit; fromSocketId: string }) => {
                const pc = peerConnectionsRef.current.get(fromSocketId);
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    const queue = iceCandidateQueue.current.get(fromSocketId) || [];
                    for (const candidate of queue) {
                        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
                    }
                    iceCandidateQueue.current.delete(fromSocketId);
                }
            });

            socket.on('meeting-ice-candidate', async ({ candidate, fromSocketId }: { candidate: RTCIceCandidateInit; fromSocketId: string }) => {
                const pc = peerConnectionsRef.current.get(fromSocketId);
                if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
                } else {
                    if (!iceCandidateQueue.current.has(fromSocketId)) {
                        iceCandidateQueue.current.set(fromSocketId, []);
                    }
                    iceCandidateQueue.current.get(fromSocketId)!.push(candidate);
                }
            });

            socket.on('meeting-user-left', ({ socketId }: { socketId: string }) => {
                const pc = peerConnectionsRef.current.get(socketId);
                if (pc) { pc.close(); peerConnectionsRef.current.delete(socketId); }
                iceCandidateQueue.current.delete(socketId);
                setParticipants(prev => prev.filter(p => p.socketId !== socketId));
            });

            socket.on('meeting-media-state', ({ socketId, isMuted: muted, isVideoOff: videoOff }: { socketId: string; isMuted: boolean; isVideoOff: boolean }) => {
                setParticipants(prev => prev.map(p =>
                    p.socketId === socketId ? { ...p, isMuted: muted, isVideoOff: videoOff } : p
                ));
            });

        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to start meeting';
            setError(msg);
            console.error('Meeting join error:', err);
        }
    }, [createPeerConnection]);

    const leaveMeeting = useCallback(() => {
        if (socketRef.current && roomIdRef.current) {
            socketRef.current.emit('meeting-leave', { roomId: roomIdRef.current });
            socketRef.current.disconnect();
        }
        peerConnectionsRef.current.forEach(pc => pc.close());
        peerConnectionsRef.current.clear();
        iceCandidateQueue.current.clear();
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
        setParticipants([]);
        setIsConnected(false);
        roomIdRef.current = null;
    }, []);

    const toggleMute = useCallback(async () => {
        const stream = localStreamRef.current;
        const audioTracks = stream?.getAudioTracks() || [];

        if (audioTracks.length === 0) {
            if (typeof navigator !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
                try {
                    const newAudioStream = await navigator.mediaDevices.getUserMedia({
                        audio: { echoCancellation: true, noiseSuppression: true },
                    });
                    const newAudioTrack = newAudioStream.getAudioTracks()[0];
                    if (newAudioTrack) {
                        const targetStream = stream || new MediaStream();
                        targetStream.addTrack(newAudioTrack);
                        localStreamRef.current = targetStream;
                        setLocalStream(new MediaStream(targetStream.getTracks()));
                        peerConnectionsRef.current.forEach(pc => {
                            pc.addTrack(newAudioTrack, targetStream);
                        });
                        setIsMuted(false);
                        if (socketRef.current && roomIdRef.current) {
                            socketRef.current.emit('meeting-media-state', {
                                roomId: roomIdRef.current,
                                isMuted: false,
                                isVideoOff,
                            });
                        }
                    }
                } catch (e) {
                    setMediaWarning('Microphone access denied.');
                }
            }
            return;
        }

        const currentlyEnabled = audioTracks[0].enabled;
        audioTracks.forEach(t => { t.enabled = !currentlyEnabled; });
        setIsMuted(currentlyEnabled);

        if (socketRef.current && roomIdRef.current) {
            socketRef.current.emit('meeting-media-state', {
                roomId: roomIdRef.current,
                isMuted: currentlyEnabled,
                isVideoOff,
            });
        }
    }, [isVideoOff]);

    const toggleVideo = useCallback(async () => {
        const stream = localStreamRef.current;
        const videoTracks = stream?.getVideoTracks() || [];

        if (videoTracks.length === 0) {
            if (typeof navigator !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
                try {
                    const newVideoStream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                    });
                    const newVideoTrack = newVideoStream.getVideoTracks()[0];
                    if (newVideoTrack) {
                        const targetStream = stream || new MediaStream();
                        targetStream.addTrack(newVideoTrack);
                        localStreamRef.current = targetStream;
                        setLocalStream(new MediaStream(targetStream.getTracks()));
                        peerConnectionsRef.current.forEach(pc => {
                            pc.addTrack(newVideoTrack, targetStream);
                        });
                        setIsVideoOff(false);
                        if (socketRef.current && roomIdRef.current) {
                            socketRef.current.emit('meeting-media-state', {
                                roomId: roomIdRef.current,
                                isMuted,
                                isVideoOff: false,
                            });
                        }
                    }
                } catch (e) {
                    setMediaWarning('Camera access denied.');
                }
            }
            return;
        }

        const currentlyEnabled = videoTracks[0].enabled;
        videoTracks.forEach(t => { t.enabled = !currentlyEnabled; });
        setIsVideoOff(currentlyEnabled);

        if (socketRef.current && roomIdRef.current) {
            socketRef.current.emit('meeting-media-state', {
                roomId: roomIdRef.current,
                isMuted,
                isVideoOff: currentlyEnabled,
            });
        }
    }, [isMuted]);

    const createRoom = useCallback(async (roomName: string, hostName: string, isPrivate = false) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/meetings/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName, hostName, isPrivate }),
            });
            const data = await response.json();
            if (data.success) {
                return data.room;
            }
            return null;
        } catch (err) {
            console.error('Create room error:', err);
            return null;
        }
    }, []);

    const getActiveRooms = useCallback(async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/meetings`);
            const data = await response.json();
            return data.success ? data.rooms : [];
        } catch (err) {
            console.error('Get active rooms error:', err);
            return [];
        }
    }, []);

    useEffect(() => {
        return () => { leaveMeeting(); };
    }, [leaveMeeting]);

    return {
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
        toggleVideo,
        createRoom,
        getActiveRooms,
    };
}
