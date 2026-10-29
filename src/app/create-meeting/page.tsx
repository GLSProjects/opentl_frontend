"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Video, Users, Plus, Lock, Copy, Check } from "lucide-react";
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

    const [formData, setFormData] = useState({
        roomName: "",
        isPrivate: false,
        maxParticipants: 10
    });

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

        if (!formData.roomName.trim()) {
            return;
        }

        setIsCreating(true);
        const room = await createRoom(formData.roomName, formData.isPrivate, user?.token);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const hostName = user?.displayName || user?.username || "Host";

    return (
        <div className="min-h-screen bg-[#1e1f22] flex flex-col">
            <main className="flex-1 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-black text-white mb-4">Create Meeting</h1>
                        <p className="text-zinc-400 text-xl">Start a professional video meeting with your team</p>
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
                                            name="roomName"
                                            value={formData.roomName}
                                            onChange={handleInputChange}
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

                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            Max Participants
                                        </label>
                                        <select
                                            name="maxParticipants"
                                            value={formData.maxParticipants}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value={5}>5 participants</option>
                                            <option value={10}>10 participants</option>
                                            <option value={25}>25 participants</option>
                                            <option value={50}>50 participants</option>
                                            <option value={100}>100 participants</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="isPrivate"
                                                checked={formData.isPrivate}
                                                onChange={handleInputChange}
                                                className="w-5 h-5 bg-[#1e1f22] border-zinc-700 rounded text-blue-500 focus:ring-blue-500"
                                            />
                                            <span className="text-zinc-300 flex items-center gap-2">
                                                <Lock className="w-4 h-4" />
                                                Private Meeting
                                            </span>
                                        </label>
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
                                                className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded transition"
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
                                                {room.isPrivate && (
                                                    <Lock className="w-4 h-4 text-zinc-500" />
                                                )}
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
