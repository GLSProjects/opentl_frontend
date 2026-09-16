"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import DynamicMeetingArea from "@/components/DynamicMeetingArea";
import StreamingArea from "@/components/StreamingArea";
import { Radio, Video, Zap, Globe, Monitor, Users, Shield, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Footer from "@/components/Footer";

type ViewMode = "selection" | "streaming" | "meeting" | "create-meeting";

export default function StreamingMeetingsPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<ViewMode>("selection");

    const handleCreateMeeting = () => {
        router.push('/create-meeting');
    };

    const handleJoinMeeting = () => {
        router.push('/create-meeting');
    };

    return (
        <div className="min-h-screen bg-[#1e1f22] flex flex-col">

            <main className="flex-1 flex flex-col overflow-hidden">
                {viewMode === "selection" ? (
                    <div className="flex-1 flex items-center justify-center p-6 bg-radial-gradient">
                        <div className="max-w-5xl w-full">
                            <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                                <h1 className="text-5xl md:text-7xl font-black text-white mb-4 uppercase italic tracking-tighter spidey-font animate-glow">
                                    Broadcast & Connect
                                </h1>
                                <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
                                    Experience the next generation of live streaming and professional video collaboration.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                                {/* Streaming Card */}
                                <div
                                    onClick={() => setViewMode("streaming")}
                                    className="group relative bg-[#2b2d31] rounded-3xl p-10 border-2 border-transparent hover:border-red-600 transition-all cursor-pointer hover:-translate-y-2 shadow-2xl overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/20 transition-all" />

                                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-8 shadow-glow-red">
                                        <Radio className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-4">Go Live</h2>
                                    <p className="text-zinc-400 mb-8 leading-relaxed">
                                        Start a professional broadcast to YouTube, Facebook, or your own private channel. Features multi-stream support and live chat.
                                    </p>
                                    <div className="space-y-3">
                                        <FeatureItem icon={<Zap className="w-4 h-4 text-yellow-500" />} text="Ultra-low latency streaming" />
                                        <FeatureItem icon={<Globe className="w-4 h-4 text-blue-500" />} text="Simultaneous multi-platform" />
                                        <FeatureItem icon={<Monitor className="w-4 h-4 text-green-500" />} text="Built-in streaming dashboard" />
                                    </div>
                                    <div className="mt-10 flex items-center text-red-500 font-bold group-hover:translate-x-2 transition-transform">
                                        Enter Dashboard <ChevronLeft className="w-5 h-5 rotate-180 ml-2" />
                                    </div>
                                </div>

                                {/* Meeting Card */}
                                <div
                                    onClick={() => setViewMode("create-meeting")}
                                    className="group relative bg-[#2b2d31] rounded-3xl p-10 border-2 border-transparent hover:border-blue-600 transition-all cursor-pointer hover:-translate-y-2 shadow-2xl overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all" />

                                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-glow-blue">
                                        <Video className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-4">Dynamic Meetings</h2>
                                    <p className="text-zinc-400 mb-8 leading-relaxed">
                                        Create and join real video meetings with live participants. Screen sharing, real-time collaboration, and encrypted connections.
                                    </p>
                                    <div className="space-y-3">
                                        <FeatureItem icon={<Users className="w-4 h-4 text-purple-500" />} text="Real-time participant management" />
                                        <FeatureItem icon={<Monitor className="w-4 h-4 text-cyan-500" />} text="Dynamic screen sharing" />
                                        <FeatureItem icon={<Shield className="w-4 h-4 text-red-500" />} text="Live meeting rooms" />
                                    </div>
                                    <div className="mt-10 flex items-center text-blue-500 font-bold group-hover:translate-x-2 transition-transform">
                                        Create Meeting <ChevronLeft className="w-5 h-5 rotate-180 ml-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="mt-12 flex justify-center gap-4">
                                <button
                                    onClick={handleCreateMeeting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-all flex items-center gap-2"
                                >
                                    <Video className="w-5 h-5" />
                                    Create Meeting
                                </button>
                                <button
                                    onClick={handleJoinMeeting}
                                    className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold px-8 py-3 rounded-xl transition-all flex items-center gap-2"
                                >
                                    <Users className="w-5 h-5" />
                                    Join Meeting
                                </button>
                            </div>
                        </div>
                    </div>
                ) : viewMode === "streaming" ? (
                    <StreamingArea onEnd={() => setViewMode("selection")} />
                ) : viewMode === "create-meeting" ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-4">Redirecting to Meeting Creation...</h2>
                            <p className="text-zinc-400">You'll be redirected to the meeting creation page</p>
                        </div>
                    </div>
                ) : (
                    <DynamicMeetingArea onEnd={() => setViewMode("selection")} />
                )}
            </main>
            <Footer/>
        </div>
    );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <div className="flex items-center gap-3 text-zinc-500 text-sm font-medium">
            <div className="shrink-0">{icon}</div>
            <span>{text}</span>
        </div>
    );
}
