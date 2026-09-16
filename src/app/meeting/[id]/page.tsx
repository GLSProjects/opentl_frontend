"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DynamicMeetingArea from "@/components/DynamicMeetingArea";
import { Video, Users, Clock, Shield, Lock, ArrowLeft } from "lucide-react";
import { useMeeting } from "@/hooks/useMeeting";

export default function MeetingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const { joinRoom } = useMeeting();
    
    // Get room ID from URL params
    const roomId = params.id as string;
    // Get user name from search params
    const userName = searchParams.get('user') || 'Guest';
    
    const [isJoining, setIsJoining] = useState(false);
    const [joined, setJoined] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roomInfo, setRoomInfo] = useState<any>(null);

    useEffect(() => {
        if (roomId && !joined && !isJoining) {
            joinMeetingRoom();
        }
    }, [roomId]);

    const joinMeetingRoom = async () => {
        if (!roomId) return;

        setIsJoining(true);
        setError(null);

        try {
            // First get room info
            const response = await fetch(`http://127.0.0.1:5000/api/meetings/${roomId}`);
            const data = await response.json();

            if (data.success) {
                setRoomInfo(data.room);
                
                // Check if room is full
                if (data.room.participantCount >= data.room.maxParticipants) {
                    setError('This meeting room is full');
                    setIsJoining(false);
                    return;
                }

                // Join the room
                const joinResult = await joinRoom(roomId, userName);
                if (joinResult) {
                    setJoined(true);
                }
            } else {
                setError('Meeting room not found');
            }
        } catch (error) {
            setError('Failed to join meeting room');
        }

        setIsJoining(false);
    };

    const handleLeaveMeeting = () => {
        setJoined(false);
        setRoomInfo(null);
        router.push('/create-meeting');
    };

    const handleBackToCreate = () => {
        router.push('/create-meeting');
    };

    if (!roomId) {
        return (
            <div className="min-h-screen bg-[#1e1f22] flex flex-col">
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-4">Invalid Meeting Link</h1>
                        <p className="text-zinc-400 mb-6">No meeting ID provided</p>
                        <button
                            onClick={handleBackToCreate}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Create Meeting
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (isJoining) {
        return (
            <div className="min-h-screen bg-[#1e1f22] flex flex-col">
                {/* <Navbar /> */}
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h2 className="text-2xl font-bold text-white mb-2">Joining Meeting...</h2>
                        <p className="text-zinc-400">Please wait while we connect you to the meeting room</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#1e1f22] flex flex-col">
                {/* <Navbar /> */}
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Cannot Join Meeting</h2>
                        <p className="text-zinc-400 mb-6">{error}</p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={joinMeetingRoom}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={handleBackToCreate}
                                className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Create Meeting
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!joined) {
        return (
            <div className="min-h-screen bg-[#1e1f22] flex flex-col">
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Ready to Join?</h2>
                        <p className="text-zinc-400 mb-6">Click below to join the meeting room</p>
                        <button
                            onClick={joinMeetingRoom}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium"
                        >
                            Join Meeting
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1e1f22] flex flex-col">
            <main className="flex-1 overflow-hidden">
                <DynamicMeetingArea
                    roomId={roomId}
                    userName={userName}
                    onEnd={handleLeaveMeeting}
                />
            </main>
        </div>
    );
}
