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
    isHost?: boolean;
    stream?: MediaStream;
};

type UseMeetingReturn = {
    participants: Participant[];
    localStream: MediaStream | null;
    isMuted: boolean;
    isVideoOff: boolean;
    isConnected: boolean;
    isHost: boolean;
    error: string | null;
    mediaWarning: string | null;
    meetingEnded: { endedBy: string } | null;
    setMediaWarning: (warning: string | null) => void;
    joinMeeting: (
        roomId: string,
        initialMedia?: { isMuted: boolean; isVideoOff: boolean },
        existingStream?: MediaStream | null,
        token?: string
    ) => Promise<void>;
    leaveMeeting: () => void;
    endMeetingForAll: () => void;
    toggleMute: () => Promise<void>;
    toggleVideo: () => Promise<void>;
    createRoom: (roomName: string, token?: string) => Promise<any>;
    getActiveRooms: () => Promise<any[]>;
    getRoomInfo: (roomId: string) => Promise<any>;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://opentl-backend-hj2y.onrender.com';

const getStoredToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.token || null;
        }
    } catch (e) {}
    return null;
};

const getRtcConfig = (): RTCConfiguration => {
    const iceServers: RTCIceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
    ];

    const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnCred = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

    if (turnUrl && turnUser && turnCred) {
        iceServers.push({
            urls: turnUrl,
            username: turnUser,
            credential: turnCred,
        });
    }

    return {
        iceServers,
        iceCandidatePoolSize: 10,
    };
};

export function useMeeting(): UseMeetingReturn {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mediaWarning, setMediaWarning] = useState<string | null>(null);
    const [meetingEnded, setMeetingEnded] = useState<{ endedBy: string } | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const makingOfferMap = useRef<Map<string, boolean>>(new Map());
    const iceCandidateQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
    const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const roomIdRef = useRef<string | null>(null);
    const isMutedRef = useRef(false);
    const isVideoOffRef = useRef(false);
    const isHostRef = useRef(false);
    const joinLockRef = useRef(false);

    const getOrCreatePeerConnection = useCallback((targetSocketId: string): RTCPeerConnection => {
        const existing = peerConnectionsRef.current.get(targetSocketId);
        if (existing) {
            return existing;
        }

        const pc = new RTCPeerConnection(getRtcConfig());
        peerConnectionsRef.current.set(targetSocketId, pc);

        const currentLocal = localStreamRef.current;
        const audioTrack = currentLocal?.getAudioTracks()[0] || null;
        const videoTrack = currentLocal?.getVideoTracks()[0] || null;

        const audioTransceiver = pc.addTransceiver('audio', {
            direction: 'sendrecv',
            streams: currentLocal ? [currentLocal] : []
        });
        if (audioTrack && audioTransceiver.sender) {
            audioTransceiver.sender.replaceTrack(audioTrack).catch(() => {});
        }

        const videoTransceiver = pc.addTransceiver('video', {
            direction: 'sendrecv',
            streams: currentLocal ? [currentLocal] : []
        });
        if (videoTrack && !isVideoOffRef.current && videoTransceiver.sender) {
            videoTransceiver.sender.replaceTrack(videoTrack).catch(() => {});
        }

        pc.onnegotiationneeded = async () => {
            try {
                makingOfferMap.current.set(targetSocketId, true);
                const offer = await pc.createOffer();
                if (pc.signalingState !== 'stable') return;
                await pc.setLocalDescription(offer);
                if (socketRef.current) {
                    socketRef.current.emit('meeting-offer', {
                        targetSocketId,
                        offer: pc.localDescription,
                    });
                }
            } catch (err) {
                console.error('Negotiation offer error:', err);
            } finally {
                makingOfferMap.current.set(targetSocketId, false);
            }
        };

        pc.ontrack = (event) => {
            const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
            remoteStreamsRef.current.set(targetSocketId, stream);

            setParticipants(prev => {
                const found = prev.find(p => p.socketId === targetSocketId);
                if (found) {
                    return prev.map(p => p.socketId === targetSocketId ? { ...p, stream } : p);
                }
                return prev;
            });
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('meeting-ice-candidate', {
                    targetSocketId,
                    candidate: event.candidate,
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'failed') {
                if (typeof pc.restartIce === 'function') {
                    pc.restartIce();
                }
            }
        };

        return pc;
    }, []);

    const leaveMeeting = useCallback(() => {
        joinLockRef.current = false;
        if (socketRef.current && roomIdRef.current) {
            socketRef.current.emit('meeting-leave', { roomId: roomIdRef.current });
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        peerConnectionsRef.current.forEach(pc => pc.close());
        peerConnectionsRef.current.clear();
        iceCandidateQueue.current.clear();
        remoteStreamsRef.current.clear();
        makingOfferMap.current.clear();

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        setLocalStream(null);
        setParticipants([]);
        setIsConnected(false);
        setIsHost(false);
        isHostRef.current = false;
        roomIdRef.current = null;
    }, []);

    const joinMeeting = useCallback(async (
        roomId: string,
        initialMedia = { isMuted: false, isVideoOff: false },
        existingStream: MediaStream | null = null,
        token?: string
    ) => {
        if (joinLockRef.current && roomIdRef.current === roomId) {
            return;
        }

        const authToken = token || getStoredToken();
        if (!authToken) {
            setError('UNAUTHORIZED');
            return;
        }

        joinLockRef.current = true;
        setError(null);
        setMeetingEnded(null);
        setMediaWarning(null);
        roomIdRef.current = roomId;

        isMutedRef.current = initialMedia.isMuted;
        isVideoOffRef.current = initialMedia.isVideoOff;
        setIsMuted(initialMedia.isMuted);
        setIsVideoOff(initialMedia.isVideoOff);

        let stream: MediaStream | null = existingStream;

        if (!stream) {
            const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator?.mediaDevices?.getUserMedia;
            if (hasMediaDevices) {
                if (!initialMedia.isVideoOff) {
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
                            isVideoOffRef.current = true;
                            setIsVideoOff(true);
                            setMediaWarning('Camera unavailable or permission denied. Joined with microphone only.');
                        } catch (err2) {
                            stream = new MediaStream();
                            isMutedRef.current = true;
                            isVideoOffRef.current = true;
                            setIsMuted(true);
                            setIsVideoOff(true);
                            setMediaWarning('Camera and microphone permission denied. Joined in listen-only mode.');
                        }
                    }
                } else if (!initialMedia.isMuted) {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({
                            audio: { echoCancellation: true, noiseSuppression: true },
                            video: false,
                        });
                    } catch (err) {
                        stream = new MediaStream();
                        isMutedRef.current = true;
                        setIsMuted(true);
                        setMediaWarning('Microphone permission denied. Joined in listen-only mode.');
                    }
                } else {
                    stream = new MediaStream();
                }
            } else {
                stream = new MediaStream();
                isMutedRef.current = true;
                isVideoOffRef.current = true;
                setIsMuted(true);
                setIsVideoOff(true);
                setMediaWarning('Camera & mic require HTTPS or localhost. Joined in listen-only mode.');
            }
        }

        if (stream) {
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length > 0) {
                audioTracks.forEach(t => { t.enabled = !isMutedRef.current; });
            }
            if (isVideoOffRef.current) {
                stream.getVideoTracks().forEach(t => {
                    t.stop();
                    stream?.removeTrack(t);
                });
            }
        }

        localStreamRef.current = stream;
        setLocalStream(stream ? new MediaStream(stream.getTracks()) : null);

        try {
            const socket = io(BACKEND_URL, { 
                auth: { token: authToken },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                setIsConnected(true);
                socket.emit('meeting-join', {
                    roomId,
                    isMuted: isMutedRef.current,
                    isVideoOff: isVideoOffRef.current,
                    token: authToken,
                });
            });

            socket.on('connect_error', (err) => {
                setError('Failed to connect to server');
                console.error('Socket connect error:', err);
            });

            socket.on('meeting-error', ({ code, message }: { code: string; message: string }) => {
                if (code === 'UNAUTHORIZED') {
                    leaveMeeting();
                    setError('UNAUTHORIZED');
                    return;
                }
                if (code === 'REPLACED') {
                    leaveMeeting();
                    setError('REPLACED');
                    return;
                }
                setError(code === 'ROOM_NOT_FOUND' ? 'ROOM_NOT_FOUND' : (code === 'ROOM_ENDED' ? 'ROOM_ENDED' : message));
            });

            socket.on('meeting-ended', ({ endedBy }: { roomId: string; endedBy: string }) => {
                setMeetingEnded({ endedBy: endedBy || 'Host' });
                leaveMeeting();
            });

            socket.on('meeting-host-changed', ({ newHostSocketId }: { newHostSocketId: string; newHostName: string }) => {
                const selfIsHost = !!socket.id && newHostSocketId === socket.id;
                isHostRef.current = selfIsHost;
                setIsHost(selfIsHost);
                setParticipants(prev => prev.map(p => ({
                    ...p,
                    isHost: p.socketId === newHostSocketId,
                })));
            });

            socket.on('meeting-existing-users', async (users: Array<{ socketId: string; userId: string; userName: string; avatar: string; isMuted?: boolean; isVideoOff?: boolean; isHost?: boolean }>) => {
                setParticipants(users.map(u => ({
                    ...u,
                    isMuted: u.isMuted ?? false,
                    isVideoOff: u.isVideoOff ?? false,
                    isHost: u.isHost ?? false,
                    stream: remoteStreamsRef.current.get(u.socketId),
                })));

                for (const user of users) {
                    getOrCreatePeerConnection(user.socketId);
                }
            });

            socket.on('meeting-user-joined', (user: { socketId: string; userId: string; userName: string; avatar: string; isMuted?: boolean; isVideoOff?: boolean; isHost?: boolean }) => {
                setParticipants(prev => {
                    const filtered = prev.filter(p => p.socketId !== user.socketId);
                    return [...filtered, {
                        ...user,
                        isMuted: user.isMuted ?? false,
                        isVideoOff: user.isVideoOff ?? false,
                        isHost: user.isHost ?? false,
                        stream: remoteStreamsRef.current.get(user.socketId),
                    }];
                });
            });

            socket.on('meeting-offer', async ({ offer, fromSocketId, userName: fromName }: { offer: RTCSessionDescriptionInit; fromSocketId: string; userName: string }) => {
                const pc = getOrCreatePeerConnection(fromSocketId);
                const isPolite = (socket.id || '') < fromSocketId;
                const isMakingOffer = makingOfferMap.current.get(fromSocketId) || false;
                const offerCollision = isMakingOffer || pc.signalingState !== 'stable';

                if (!isPolite && offerCollision) {
                    return;
                }

                try {
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
                        answer: pc.localDescription,
                    });
                } catch (err) {
                    console.error('Error handling meeting-offer:', err);
                }
            });

            socket.on('meeting-answer', async ({ answer, fromSocketId }: { answer: RTCSessionDescriptionInit; fromSocketId: string }) => {
                const pc = peerConnectionsRef.current.get(fromSocketId);
                if (pc && pc.signalingState === 'have-local-offer') {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(answer));
                        const queue = iceCandidateQueue.current.get(fromSocketId) || [];
                        for (const candidate of queue) {
                            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
                        }
                        iceCandidateQueue.current.delete(fromSocketId);
                    } catch (err) {
                        console.error('Error handling meeting-answer:', err);
                    }
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
                if (pc) { 
                    pc.close(); 
                    peerConnectionsRef.current.delete(socketId); 
                }
                iceCandidateQueue.current.delete(socketId);
                remoteStreamsRef.current.delete(socketId);
                makingOfferMap.current.delete(socketId);
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
    }, [getOrCreatePeerConnection, leaveMeeting]);

    const endMeetingForAll = useCallback(() => {
        if (socketRef.current && roomIdRef.current) {
            socketRef.current.emit('meeting-end', { roomId: roomIdRef.current });
        }
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

                        for (const pc of peerConnectionsRef.current.values()) {
                            const audioTransceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'audio');
                            if (audioTransceiver && audioTransceiver.sender) {
                                await audioTransceiver.sender.replaceTrack(newAudioTrack);
                            } else {
                                pc.addTrack(newAudioTrack, targetStream);
                            }
                        }

                        isMutedRef.current = false;
                        setIsMuted(false);
                        if (socketRef.current && roomIdRef.current) {
                            socketRef.current.emit('meeting-media-state', {
                                roomId: roomIdRef.current,
                                isMuted: false,
                                isVideoOff: isVideoOffRef.current,
                            });
                        }
                    }
                } catch (e) {
                    setMediaWarning('Microphone access denied.');
                }
            }
            return;
        }

        const currentlyMuted = isMutedRef.current;
        const nextMuted = !currentlyMuted;
        audioTracks.forEach(t => { t.enabled = !nextMuted; });
        isMutedRef.current = nextMuted;
        setIsMuted(nextMuted);

        if (socketRef.current && roomIdRef.current) {
            socketRef.current.emit('meeting-media-state', {
                roomId: roomIdRef.current,
                isMuted: nextMuted,
                isVideoOff: isVideoOffRef.current,
            });
        }
    }, []);

    const toggleVideo = useCallback(async () => {
        const currentVideoOff = isVideoOffRef.current;

        if (!currentVideoOff) {
            const stream = localStreamRef.current;
            const videoTracks = stream?.getVideoTracks() || [];
            videoTracks.forEach(t => {
                t.stop();
                stream?.removeTrack(t);
            });

            for (const pc of peerConnectionsRef.current.values()) {
                const videoTransceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
                if (videoTransceiver && videoTransceiver.sender) {
                    videoTransceiver.sender.replaceTrack(null).catch(() => {});
                }
            }

            isVideoOffRef.current = true;
            setIsVideoOff(true);
            if (localStreamRef.current) {
                setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
            }

            if (socketRef.current && roomIdRef.current) {
                socketRef.current.emit('meeting-media-state', {
                    roomId: roomIdRef.current,
                    isMuted: isMutedRef.current,
                    isVideoOff: true,
                });
            }
            return;
        }

        if (typeof navigator !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
            try {
                const newVideoStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                });
                const newVideoTrack = newVideoStream.getVideoTracks()[0];
                if (newVideoTrack) {
                    const targetStream = localStreamRef.current || new MediaStream();
                    targetStream.addTrack(newVideoTrack);
                    localStreamRef.current = targetStream;

                    for (const pc of peerConnectionsRef.current.values()) {
                        const videoTransceiver = pc.getTransceivers().find(t => t.receiver.track.kind === 'video');
                        if (videoTransceiver && videoTransceiver.sender) {
                            await videoTransceiver.sender.replaceTrack(newVideoTrack);
                        } else {
                            pc.addTrack(newVideoTrack, targetStream);
                        }
                    }

                    isVideoOffRef.current = false;
                    setIsVideoOff(false);
                    setLocalStream(new MediaStream(targetStream.getTracks()));

                    if (socketRef.current && roomIdRef.current) {
                        socketRef.current.emit('meeting-media-state', {
                            roomId: roomIdRef.current,
                            isMuted: isMutedRef.current,
                            isVideoOff: false,
                        });
                    }
                }
            } catch (e) {
                setMediaWarning('Camera access denied.');
            }
        }
    }, []);

    const createRoom = useCallback(async (roomName: string, token?: string) => {
        try {
            const t = token || getStoredToken();
            const response = await fetch(`${BACKEND_URL}/api/meetings/create`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(t ? { 'Authorization': `Bearer ${t}` } : {}),
                },
                body: JSON.stringify({ roomName }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                return data.room;
            }
            if (response.status === 401) {
                setError('UNAUTHORIZED');
            }
            return null;
        } catch (err) {
            console.error('Create room error:', err);
            return null;
        }
    }, []);

    const getActiveRooms = useCallback(async () => {
        try {
            const t = getStoredToken();
            const response = await fetch(`${BACKEND_URL}/api/meetings`, {
                headers: {
                    ...(t ? { 'Authorization': `Bearer ${t}` } : {}),
                },
            });
            const data = await response.json();
            return data.success ? data.rooms : [];
        } catch (err) {
            console.error('Get active rooms error:', err);
            return [];
        }
    }, []);

    const getRoomInfo = useCallback(async (roomId: string) => {
        try {
            const t = getStoredToken();
            const response = await fetch(`${BACKEND_URL}/api/meetings/${roomId}`, {
                headers: {
                    ...(t ? { 'Authorization': `Bearer ${t}` } : {}),
                },
            });
            const data = await response.json();
            return data.success ? data.room : null;
        } catch (err) {
            console.error('Get room info error:', err);
            return null;
        }
    }, []);

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'user' && !e.newValue) {
                leaveMeeting();
                setError('UNAUTHORIZED');
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [leaveMeeting]);

    useEffect(() => {
        return () => {
            leaveMeeting();
        };
    }, [leaveMeeting]);

    return {
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
        createRoom,
        getActiveRooms,
        getRoomInfo,
    };
}
