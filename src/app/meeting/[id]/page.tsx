"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import Footer from "@/components/Footer";
import DynamicMeetingArea from "@/components/DynamicMeetingArea";
import AuthGate from "@/components/meeting/AuthGate";
import { ArrowLeft } from "lucide-react";

export default function MeetingPage() {
    const router = useRouter();
    const params = useParams();

    const roomId = params.id as string;

    const handleEnd = () => {
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
                            onClick={handleEnd}
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

    return (
        <AuthGate title="Sign in to join this meeting" description="You must be signed in with an OpenTL account to enter this meeting.">
            <div className="min-h-screen bg-[#1e1f22] flex flex-col">
                <main className="flex-1 overflow-hidden flex">
                    <DynamicMeetingArea
                        roomId={roomId}
                        onEnd={handleEnd}
                    />
                </main>
            </div>
        </AuthGate>
    );
}
