"use client";

import React, { useState, useEffect } from "react";
import { PhoneOff, ArrowLeft } from "lucide-react";

type MeetingEndedProps = {
    endedBy?: string;
    reason?: "HOST_ENDED" | "NOT_FOUND" | "ROOM_ENDED";
    onReturn: () => void;
};

export default function MeetingEnded({
    endedBy,
    reason = "HOST_ENDED",
    onReturn,
}: MeetingEndedProps) {
    const [secondsLeft, setSecondsLeft] = useState(3);

    useEffect(() => {
        if (reason !== "HOST_ENDED") return;
        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onReturn();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [reason, onReturn]);

    const title =
        reason === "HOST_ENDED"
            ? `${endedBy || "The host"} ended the meeting`
            : "Meeting not found or ended";

    const subtitle =
        reason === "HOST_ENDED"
            ? `You will be redirected in ${secondsLeft} seconds...`
            : "This meeting link is invalid or the meeting has already concluded.";

    return (
        <div className="flex-1 flex items-center justify-center bg-[#1e1f22] p-6 text-white">
            <div className="w-full max-w-md bg-[#2b2d31] border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto border border-red-500/30">
                    <PhoneOff className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">{title}</h2>
                    <p className="text-zinc-400 text-sm">{subtitle}</p>
                </div>

                <button
                    onClick={onReturn}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 active:scale-98"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Return to Create Meeting
                </button>
            </div>
        </div>
    );
}

