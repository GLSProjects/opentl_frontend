"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Video, Users, Plus, Copy, Check, Keyboard } from "lucide-react";
import { useMeeting } from "@/hooks/useMeeting";
import { useAuth } from "@/context/AuthContext";
import AuthGate from "@/components/meeting/AuthGate";

export default function CreateMeetingPage() {
    return (
        <AuthGate title="Sign in to create a meeting" description="You must be signed in with an OpenTL account to start a new meeting.">
            <CreateMeetingContent />
        </AuthGate>
    );
}

function CreateMeetingContent() {
    const router = useRouter();
    const { user } = useAuth();
    const { createRoom, getActiveRooms } = useMeeting();

    const [roomName, setRoomName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [createdRoom, setCreatedRoom] = useState<any>(null);
    const [activeRooms, setActiveRooms] = useState<any[]>([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadActiveRooms();
        const interval = setInterval(loadActiveRooms, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadActiveRooms = async () => {
        const rooms = await getActiveRooms();
        setActiveRooms(rooms);
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!roomName.trim()) {
            return;
        }

        setIsCreating(true);
        const room = await createRoom(roomName, user?.token);

        if (room) {
            setCreatedRoom(room);
            if (typeof window !== 'undefined' && room.hostToken) {
                sessionStorage.setItem(`meeting-host-${room.id}`, room.hostToken);
            }
            router.push(`/meeting/${room.id}`);
            return;
        }

        setIsCreating(false);
    };

    const handleJoinWithCode = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const raw = joinCode.trim();
        if (!raw) return;

        let code = raw;
        if (code.includes("/meeting/")) {
            code = code.split("/meeting/")[1];
        }
        code = code.split("?")[0].replace(/\/+$/, "").trim();

        if (code) {
            router.push(`/meeting/${code}`);
        }
    };

    const handleJoinRoom = (roomId: string) => {
        router.push(`/meeting/${roomId}`);
    };

    const copyMeetingLink = () => {
        if (createdRoom) {
            const joinUrl = `${window.location.origin}/meeting/${createdRoom.id}`;
            navigator.clipboard.writeText(joinUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const hostName = user?.displayName || user?.username || "Host";

    return (
        <div className="min-h-screen bg-[#1e1f22] flex flex-col">
            <main className="flex-1 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-6">
                        <h1 className="text-5xl font-black text-white mb-4">Create Meeting</h1>
                        <p className="text-zinc-400 text-xl">Start a professional video meeting with your team</p>
                    </div>

                    <div className="flex justify-center mb-10">
                        <form
                            onSubmit={handleJoinWithCode}
                            className="flex items-center bg-[#2b2d31] border border-zinc-700 hover:border-zinc-500 rounded-full px-4 py-1.5 shadow-xl transition-all w-full max-w-md"
                        >
                            <Keyboard className="w-5 h-5 text-zinc-400 shrink-0 mr-2" />
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                placeholder="Enter a code or link"
                                className="bg-transparent text-white placeholder-zinc-500 text-sm py-2 focus:outline-none flex-1"
                            />
                            <button
                                type="submit"
                                disabled={!joinCode.trim()}
                                className="text-sm font-semibold px-4 py-2 rounded-full transition text-blue-400 hover:text-blue-300 disabled:text-zinc-500 disabled:cursor-not-allowed"
                            >
                                Join
                            </button>
                        </form>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="bg-[#2b2d31] rounded-3xl p-8 border border-zinc-800">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Plus className="w-6 h-6 text-blue-500" />
                                New Meeting
                            </h2>

                            {!createdRoom ? (
                                <form onSubmit={handleCreateRoom} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            Meeting Name
                                        </label>
                                        <input
                                            type="text"
                                            value={roomName}
                                            onChange={e => setRoomName(e.target.value)}
                                            placeholder="e.g., Team Standup, Project Review"
                                            className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            Host
                                        </label>
                                        <div className="flex items-center gap-3 px-4 py-3 bg-[#1e1f22] border border-zinc-700 rounded-lg text-white">
                                            {user?.avatar ? (
                                                <img src={user.avatar} alt="Host Avatar" className="w-7 h-7 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                                                    {hostName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-sm font-semibold truncate">{hostName}</span>
                                            <span className="text-xs text-zinc-500 truncate">({user?.email})</span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Video className="w-5 h-5" />
                                                Create Meeting
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center space-y-6">
                                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                                        <Check className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">Meeting Created!</h3>
                                        <p className="text-zinc-400">{createdRoom.name}</p>
                                    </div>

                                    <div className="bg-[#1e1f22] p-4 rounded-lg border border-zinc-700">
                                        <p className="text-sm text-zinc-500 mb-2">Meeting Link:</p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={`${window.location.origin}/meeting/${createdRoom.id}`}
                                                readOnly
                                                className="flex-1 bg-transparent text-white text-sm"
                                            />
                                            <button
                                                onClick={copyMeetingLink}
                                                className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-transition"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleJoinRoom(createdRoom.id)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition"
                                        >
                                            Join Now
                                        </button>
                                        <button
                                            onClick={() => setCreatedRoom(null)}
                                            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 rounded-lg transition"
                                        >
                                            Create Another
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-[#2b2d31] rounded-3xl p-8 border border-zinc-800">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Users className="w-6 h-6 text-green-500" />
                                Active Meetings ({activeRooms.length})
                            </h2>

                            {activeRooms.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Video className="w-8 h-8 text-zinc-600" />
                                    </div>
                                    <p className="text-zinc-500">No active meetings right now</p>
                                    <p className="text-zinc-600 text-sm mt-2">Create a new meeting to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {activeRooms.map((room) => (
                                        <div
                                            key={room.id}
                                            className="bg-[#1e1f22] p-4 rounded-xl border border-zinc-700 hover:border-zinc-600 transition"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <h3 className="text-white font-medium">{room.name}</h3>
                                                    <p className="text-zinc-500 text-sm">Host: {room.host}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-4">
                                                <span className="text-xs text-zinc-500">
                                                    {room.participantCount} participant{room.participantCount !== 1 ? 's' : ''}
                                                </span>
                                                <button
                                                    onClick={() => handleJoinRoom(room.id)}
                                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                                                >
                                                    Join
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
