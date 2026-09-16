"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Video, Users, Shield, Plus, Lock, Globe, Clock, Copy, Check } from "lucide-react";
import { useMeeting } from "@/hooks/useMeeting";

export default function CreateMeetingPage() {
    const router = useRouter();
    const { createRoom, getActiveRooms } = useMeeting();
    
    const [formData, setFormData] = useState({
        roomName: "",
        hostName: "",
        isPrivate: false,
        maxParticipants: 10
    });
    
    const [isCreating, setIsCreating] = useState(false);
    const [createdRoom, setCreatedRoom] = useState<any>(null);
    const [activeRooms, setActiveRooms] = useState<any[]>([]);
    const [copied, setCopied] = useState(false);

    // Load active rooms
    useEffect(() => {
        loadActiveRooms();
        const interval = setInterval(loadActiveRooms, 10000); // Update every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const loadActiveRooms = async () => {
        const rooms = await getActiveRooms();
        setActiveRooms(rooms);
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.roomName.trim() || !formData.hostName.trim()) {
            return;
        }

        setIsCreating(true);
        const room = await createRoom(formData.roomName, formData.hostName, formData.isPrivate);
        
        if (room) {
            setCreatedRoom(room);
        }
        
        setIsCreating(false);
    };

    const handleJoinRoom = (roomId: string) => {
        // Navigate to meeting with room ID
        router.push(`/meeting/${roomId}?user=${encodeURIComponent(formData.hostName || 'Guest')}`);
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

    return (
        <div className="min-h-screen bg-[#1e1f22] flex flex-col">
            {/* <Navbar /> */}
            
            <main className="flex-1 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-black text-white mb-4">Create Meeting</h1>
                        <p className="text-zinc-400 text-xl">Start a professional video meeting with your team</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Create Meeting Form */}
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
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            name="hostName"
                                            value={formData.hostName}
                                            onChange={handleInputChange}
                                            placeholder="Enter your name"
                                            className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                                            required
                                        />
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

                        {/* Active Meetings */}
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
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-sm text-zinc-400">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        {room.participantCount}/{room.maxParticipants}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(room.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                
                                                <button
                                                    onClick={() => handleJoinRoom(room.id)}
                                                    disabled={room.participantCount >= room.maxParticipants}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
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

                    {/* Features */}
                    <div className="mt-12 grid md:grid-cols-3 gap-6">
                        <div className="bg-[#2b2d31] p-6 rounded-2xl border border-zinc-800">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-white font-bold mb-2">Secure & Private</h3>
                            <p className="text-zinc-400 text-sm">End-to-end encryption and optional password protection for your meetings.</p>
                        </div>
                        
                        <div className="bg-[#2b2d31] p-6 rounded-2xl border border-zinc-800">
                            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-white font-bold mb-2">Up to 100 Participants</h3>
                            <p className="text-zinc-400 text-sm">Support for large team meetings with high-quality video and audio.</p>
                        </div>
                        
                        <div className="bg-[#2b2d31] p-6 rounded-2xl border border-zinc-800">
                            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-white font-bold mb-2">Global Access</h3>
                            <p className="text-zinc-400 text-sm">Join from anywhere in the world with reliable connection quality.</p>
                        </div>
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
}
