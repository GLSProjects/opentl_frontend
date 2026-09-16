"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, MessageCircle, Shield, Zap, Globe, Hash, Volume2,
    Compass, Plus, Settings, UserPlus, Send, ChevronDown,
    CheckCircle, Server, Lock, Mic, Video, Bell, Star,
    ArrowRight, Sparkles, Layers, Search
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";

// ─── Fade-in wrapper ─────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ badge, title, highlight, subtitle }: {
    badge: string; title: string; highlight: string; subtitle: string;
}) {
    return (
        <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 bg-red-900/30 border border-red-600/40 rounded-full text-red-400 text-xs font-semibold uppercase tracking-widest mb-5">
                {badge}
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                {title} <span className="text-red-500">{highlight}</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed font-light">{subtitle}</p>
        </div>
    );
}

// ─── Step card for guides ─────────────────────────────────────────────────────
function StepCard({ step, icon, title, desc }: { step: number; icon: React.ReactNode; title: string; desc: string }) {
    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            className="relative bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-red-500/40 p-6 transition-all duration-300"
        >
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold text-sm shrink-0">
                    {step}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-red-400">{icon}</span>
                        <h4 className="font-semibold text-white">{title}</h4>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
            </div>
        </motion.div>
    );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
function FAQ({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-white/10 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition"
            >
                <span className="font-medium text-white">{q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <p className="px-5 pb-5 text-gray-400 text-sm leading-relaxed">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AboutPage() {

    const coreFeatures = [
        { icon: <MessageCircle className="w-6 h-6" />, title: "Real-Time Chat", desc: "Send messages instantly across text channels. Typing indicators, reactions, and rich embeds make every conversation feel alive." },
        { icon: <Volume2 className="w-6 h-6" />, title: "Voice Channels", desc: "Jump into crystal-clear voice channels with WebRTC-powered audio. No phone dialing — just click and talk." },
        { icon: <Video className="w-6 h-6" />, title: "Video & Meetings", desc: "Start video meetings or live streams directly inside your server or community without leaving the platform." },
        { icon: <Compass className="w-6 h-6" />, title: "Community Discovery", desc: "Discover and join public community servers through the built-in search. Find communities by name instantly." },
        { icon: <Shield className="w-6 h-6" />, title: "Role-Based Permissions", desc: "Assign Owner, Moderator, or Member roles. Control who can create channels, invite members, or manage the server." },
        { icon: <Zap className="w-6 h-6" />, title: "Invite System", desc: "Generate invite links for your server. Share the link with friends — they join instantly after signing in." },
        { icon: <Bell className="w-6 h-6" />, title: "Notifications", desc: "Stay updated with real-time notifications for new messages, joins, and channel activity." },
        { icon: <Globe className="w-6 h-6" />, title: "Public & Private Servers", desc: "Choose between Community servers (publicly discoverable) or Private/Friends servers (invite-only)." },
        { icon: <Lock className="w-6 h-6" />, title: "Secure Authentication", desc: "JWT-based authentication with Google OAuth support. Your sessions stay secure across all devices." },
    ];

    const techStack = [
        { label: "Frontend", items: ["Next.js 16", "TypeScript", "Tailwind CSS", "Framer Motion"] },
        { label: "Backend", items: ["Node.js", "Express.js", "MongoDB + Mongoose", "Socket.io"] },
        { label: "Auth & Real-time", items: ["JWT Tokens", "Google OAuth", "WebRTC", "WebSocket"] },
        { label: "Infra & Tools", items: ["Render (Backend)", "Vercel (Frontend)", "MongoDB Atlas", "REST API"] },
    ];

    const createServerSteps = [
        { icon: <Plus className="w-4 h-4" />, title: "Click the + button", desc: "On the left server sidebar in your dashboard, click the green + (Add Server) button." },
        { icon: <Users className="w-4 h-4" />, title: "Choose server type", desc: "Select 'For a club or community' to create a Community server, or 'For me and my friends' for a Private server." },
        { icon: <Server className="w-4 h-4" />, title: "Name & customize", desc: "Give your server a name, upload an icon image or enter an image URL, and optionally add a topic." },
        { icon: <CheckCircle className="w-4 h-4" />, title: "Create & chat", desc: "Click Create — your server is live! You'll be taken to the default text channel instantly." },
    ];

    const createCommunitySteps = [
        { icon: <Plus className="w-4 h-4" />, title: "Click + and pick Community", desc: "On the dashboard, click + → select 'For a club or community' → enter a name. The server_type is set to 'community' automatically." },
        { icon: <Settings className="w-4 h-4" />, title: "Set visibility to Public", desc: "Open Server Settings → Overview tab → set Server Access to 'Public (Discoverable)' so it appears in community search." },
        { icon: <Hash className="w-4 h-4" />, title: "Create channels", desc: "Add text and voice channels from the channel sidebar. Use the + button beside 'Text Channels' or 'Voice Channels'." },
        { icon: <UserPlus className="w-4 h-4" />, title: "Invite or let users discover", desc: "Share invite links with specific people, or let anyone discover and join through 'Discover Communities' (the compass icon)." },
        { icon: <Compass className="w-4 h-4" />, title: "Discoverable instantly", desc: "Once created as a community server, it appears in the community search results for all users on the platform." },
    ];

    const discoverSteps = [
        { icon: <Compass className="w-4 h-4" />, title: "Click the Compass icon", desc: "In the server sidebar, click the indigo Compass 🧭 button — this opens the 'Discover Communities' modal." },
        { icon: <Search className="w-4 h-4" />, title: "Search by name", desc: "Type any community name — e.g., 'AI', 'Python', 'Gaming'. Results appear after a brief pause (400ms debounce)." },
        { icon: <ArrowRight className="w-4 h-4" />, title: "Click Join", desc: "Each result card shows the community name, member count, and a Join button. Click Join to become a member instantly." },
        { icon: <CheckCircle className="w-4 h-4" />, title: "Server added to sidebar", desc: "The server appears in your left sidebar immediately. The Join button changes to Joined ✓ with a green toast notification." },
    ];

    const faqs = [
        { q: "What is OpenTL?", a: "OpenTL is a modern real-time communication platform inspired by Discord. It provides text messaging, voice channels, video meetings, server management, community discovery, and more — all in one place." },
        { q: "What's the difference between a Community server and a Private server?", a: "A Community server (server_type = 'community') is publicly discoverable through the 'Discover Communities' feature. Any logged-in user can search for it and join directly. A Private/Friends server (server_type = 'friends') is invite-only — it never appears in search results and can only be joined via an invite link generated by the server owner or moderator." },
        { q: "How do I make my community discoverable?", a: "When creating a server, select 'For a club or community'. This sets server_type to 'community'. Then in Server Settings → Overview, ensure visibility is set to 'Public'. Your server will appear in community search results for all users." },
        { q: "Can private servers be found in community search?", a: "No. The backend API strictly filters by server_type = 'community' at the database level. Private/friends servers are never returned in search results, even if the user guesses the exact name." },
        { q: "How do voice channels work?", a: "Voice channels use WebRTC for peer-to-peer audio. Click any voice channel to join. Other users in the same channel appear as participants. You can join multiple server voice channels across different servers." },
        { q: "How do invite links work?", a: "As a server owner or moderator, click the server name → Invite People. A unique invite code is generated. Share this link with anyone. When they open the link, they are prompted to sign in (if not already) and then joined to your server automatically." },
        { q: "What roles are available in a server?", a: "There are three roles: Owner (full control, can delete the server), Moderator (can create channels, manage members), and Member (can chat, join voice). The owner can promote/demote members from Server Settings → Members tab." },
        { q: "How do I delete a server?", a: "Open Server Settings (click server name → Server Settings). In the Overview tab, scroll to the Danger Zone section. Click 'Delete This Server', type the exact server name to confirm, and click Delete. This action is permanent and cannot be undone." },
    ];

    return (
        <div className="relative min-h-screen bg-black text-white overflow-hidden">

            {/* Background effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ff000015_1px,transparent_1px),linear-gradient(to_bottom,#ff000015_1px,transparent_1px)] bg-[size:48px_48px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-red-600/20 blur-[160px] rounded-full pointer-events-none" />
            <div className="absolute bottom-40 right-0 w-[400px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10">

                {/* ── HERO ─────────────────────────────────────────────────── */}
                <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-5 py-2 bg-red-900/30 border border-red-600/40 rounded-full text-red-400 text-xs font-semibold uppercase tracking-widest mb-8">
                            <Sparkles className="w-3.5 h-3.5" />
                            About OpenTL — Complete Guide
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-red-500 via-rose-300 to-indigo-400 bg-clip-text text-transparent leading-tight mb-6">
                            Everything You Need<br />to Know About OpenTL
                        </h1>
                        <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed font-light mb-10">
                            OpenTL is a full-featured, real-time communication platform — think Discord built from scratch with
                            Next.js, Node.js, Socket.io, and MongoDB. Text chat, voice, video, communities,
                            server management, and more.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {["Real-time", "Community", "Voice & Video", "Open Platform", "Secure"].map(t => (
                                <span key={t} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 font-medium">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </FadeIn>
                </section>

                {/* ── WHAT IS OPENTL ───────────────────────────────────────── */}
                <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
                    <FadeIn>
                        <SectionHeading
                            badge="Overview"
                            title="What is"
                            highlight="OpenTL?"
                            subtitle="A complete communication platform — servers, channels, voice, video, and community discovery — all in one place."
                        />
                    </FadeIn>
                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        <FadeIn delay={0.1}>
                            <div className="space-y-5 text-gray-300 leading-relaxed">
                                <p>
                                    <strong className="text-white">OpenTL</strong> (Open Talk Link) is a modern, real-time communication platform built for students, developers, creators, and communities. It combines messaging, voice, video, and community tools into one seamless experience.
                                </p>
                                <p>
                                    You can create your own <strong className="text-red-400">private server</strong> for friends or colleagues — or build a <strong className="text-indigo-400">public community server</strong> that anyone on the platform can discover and join.
                                </p>
                                <p>
                                    Inside each server, you organize communication using <strong className="text-white">text channels</strong> (for chat) and <strong className="text-white">voice channels</strong> (for audio/video). The server owner has full control over roles, permissions, channels, and members.
                                </p>
                                <p>
                                    Everything is <strong className="text-white">real-time</strong> — messages appear instantly using Socket.io, voice runs on WebRTC, and all state updates are reflected immediately across all connected clients without page refresh.
                                </p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { icon: "💬", label: "Text Channels", sub: "Real-time messaging" },
                                    { icon: "🎤", label: "Voice Channels", sub: "WebRTC audio" },
                                    { icon: "🧭", label: "Discover", sub: "Find communities" },
                                    { icon: "🔒", label: "Private Servers", sub: "Invite-only" },
                                    { icon: "👥", label: "Members & Roles", sub: "Owner / Mod / Member" },
                                    { icon: "📹", label: "Video Meetings", sub: "Built-in streaming" },
                                ].map(item => (
                                    <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-red-500/30 transition">
                                        <div className="text-2xl mb-2">{item.icon}</div>
                                        <div className="text-white text-sm font-semibold">{item.label}</div>
                                        <div className="text-zinc-500 text-xs mt-0.5">{item.sub}</div>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* ── CORE FEATURES ────────────────────────────────────────── */}
                <section className="bg-zinc-950 border-y border-zinc-900 py-24">
                    <div className="max-w-6xl mx-auto px-6">
                        <FadeIn>
                            <SectionHeading
                                badge="Features"
                                title="Everything the Platform"
                                highlight="Can Do"
                                subtitle="From instant messaging to community discovery — here's the full feature set."
                            />
                        </FadeIn>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {coreFeatures.map((feature, i) => (
                                <FadeIn key={i} delay={i * 0.05}>
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-red-500/30 p-6 transition-all duration-300 h-full"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
                                            {feature.icon}
                                        </div>
                                        <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                                    </motion.div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── HOW TO CREATE A SERVER ───────────────────────────────── */}
                <section className="max-w-6xl mx-auto px-6 py-24">
                    <FadeIn>
                        <SectionHeading
                            badge="Guide"
                            title="How to Create a"
                            highlight="Server"
                            subtitle="Get your own server running in under a minute — text channels included from step one."
                        />
                    </FadeIn>
                    <div className="grid md:grid-cols-2 gap-10 items-start">
                        <div className="space-y-4">
                            {createServerSteps.map((step, i) => (
                                <FadeIn key={i} delay={i * 0.1}>
                                    <StepCard step={i + 1} {...step} />
                                </FadeIn>
                            ))}
                        </div>
                        <FadeIn delay={0.3}>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-400" /> Pro Tips
                                </h3>
                                <ul className="space-y-3 text-gray-400 text-sm">
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> Use a clear, descriptive server name so members can find it easily.</li>
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> Upload a square PNG icon (at least 128×128 px) for the best look.</li>
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> Create separate text channels for different topics (e.g., #general, #announcements, #off-topic).</li>
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> Add voice channels for real-time audio discussions or study sessions.</li>
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> Promote trusted members to Moderator so they can help manage the server.</li>
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> Generate and share an invite link from the server dropdown → Invite People.</li>
                                </ul>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* ── HOW TO CREATE A COMMUNITY ────────────────────────────── */}
                <section className="bg-zinc-950 border-y border-zinc-900 py-24">
                    <div className="max-w-6xl mx-auto px-6">
                        <FadeIn>
                            <SectionHeading
                                badge="Community"
                                title="How to Build a"
                                highlight="Public Community"
                                subtitle="Community servers are discoverable by everyone on the platform — perfect for clubs, classes, or interest groups."
                            />
                        </FadeIn>
                        <div className="grid md:grid-cols-2 gap-10 items-start">
                            <FadeIn delay={0.1}>
                                <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-8 mb-6">
                                    <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                        <Compass className="w-5 h-5 text-indigo-400" />
                                        Community vs Private
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-indigo-400 font-semibold mb-2">Community Server</div>
                                            <ul className="text-gray-400 space-y-1">
                                                <li>✅ Appears in search</li>
                                                <li>✅ Anyone can join</li>
                                                <li>✅ No invite needed</li>
                                                <li>✅ Grows organically</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <div className="text-red-400 font-semibold mb-2">Private Server</div>
                                            <ul className="text-gray-400 space-y-1">
                                                <li>🔒 Never in search</li>
                                                <li>🔒 Invite-only</li>
                                                <li>🔒 Invite link required</li>
                                                <li>🔒 Closed group</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </FadeIn>
                            <FadeIn delay={0.15}>
                                <div className="space-y-4">
                                    {createCommunitySteps.map((step, i) => (
                                        <StepCard key={i} step={i + 1} {...step} />
                                    ))}
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </section>

                {/* ── DISCOVER COMMUNITIES ─────────────────────────────────── */}
                <section className="max-w-6xl mx-auto px-6 py-24">
                    <FadeIn>
                        <SectionHeading
                            badge="Discovery"
                            title="How to Discover &"
                            highlight="Join Communities"
                            subtitle="Find and join public communities from the sidebar — no invite link needed."
                        />
                    </FadeIn>
                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        <div className="space-y-4">
                            {discoverSteps.map((step, i) => (
                                <FadeIn key={i} delay={i * 0.1}>
                                    <StepCard step={i + 1} {...step} />
                                </FadeIn>
                            ))}
                        </div>
                        <FadeIn delay={0.3}>
                            {/* Mock UI preview */}
                            <div className="bg-[#313338] rounded-2xl border border-zinc-700 overflow-hidden shadow-2xl">
                                <div className="px-5 pt-5 pb-4 border-b border-zinc-700">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                                            <Compass className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <div>
                                            <div className="text-white text-sm font-bold">Discover Communities</div>
                                            <div className="text-zinc-500 text-xs">Find and join public community servers</div>
                                        </div>
                                    </div>
                                    <div className="bg-[#1e1f22] rounded-lg px-3 py-2 flex items-center gap-2 border border-zinc-700">
                                        <Search className="w-3.5 h-3.5 text-zinc-500" />
                                        <span className="text-zinc-500 text-xs">Search communities by name...</span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    {[
                                        { name: "AI & ML Community", members: 128, color: "bg-indigo-600", icon: "🤖" },
                                        { name: "Python Developers", members: 342, color: "bg-yellow-600", icon: "🐍" },
                                        { name: "College Coding Club", members: 89, color: "bg-green-600", icon: "💻" },
                                    ].map((c, i) => (
                                        <div key={i} className="bg-[#2b2d31] rounded-xl border border-zinc-700 p-3 flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full ${c.color} flex items-center justify-center text-sm font-bold`}>{c.icon}</div>
                                            <div className="flex-1">
                                                <div className="text-white text-xs font-bold">{c.name}</div>
                                                <div className="text-zinc-400 text-[10px] flex items-center gap-1 mt-0.5">
                                                    <Users className="w-2.5 h-2.5" /> {c.members} members
                                                    <span className="ml-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1 rounded text-[9px] font-bold uppercase">Community</span>
                                                </div>
                                            </div>
                                            <button className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-md font-bold">Join</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* ── TECH STACK ───────────────────────────────────────────── */}
                <section className="bg-zinc-950 border-y border-zinc-900 py-24">
                    <div className="max-w-6xl mx-auto px-6">
                        <FadeIn>
                            <SectionHeading
                                badge="Technology"
                                title="Built With Modern"
                                highlight="Tech Stack"
                                subtitle="OpenTL is built with production-grade open-source technologies — no proprietary black boxes."
                            />
                        </FadeIn>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {techStack.map((group, i) => (
                                <FadeIn key={i} delay={i * 0.1}>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full hover:border-red-500/30 transition">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Layers className="w-4 h-4 text-red-400" />
                                            <h4 className="text-red-400 font-bold text-xs uppercase tracking-widest">{group.label}</h4>
                                        </div>
                                        <ul className="space-y-2">
                                            {group.items.map(item => (
                                                <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FAQ ─────────────────────────────────────────────────── */}
                <section className="max-w-4xl mx-auto px-6 py-24">
                    <FadeIn>
                        <SectionHeading
                            badge="FAQ"
                            title="Frequently Asked"
                            highlight="Questions"
                            subtitle="Everything you need to know about using OpenTL."
                        />
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <div className="space-y-3">
                            {faqs.map((faq, i) => <FAQ key={i} {...faq} />)}
                        </div>
                    </FadeIn>
                </section>

                {/* ── CTA ─────────────────────────────────────────────────── */}
                <section className="py-24 text-center border-t border-white/5">
                    <FadeIn>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            Ready to Get <span className="text-red-500">Started?</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto font-light">
                            Create your server, join a community, or just start chatting. OpenTL is free and open to everyone.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-lg transition shadow-lg shadow-red-600/30 hover:-translate-y-1"
                            >
                                <Send className="w-5 h-5" /> Open Dashboard
                            </Link>
                            <Link
                                href="/signup"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-semibold text-lg transition hover:-translate-y-1"
                            >
                                <UserPlus className="w-5 h-5" /> Create Account
                            </Link>
                        </div>
                    </FadeIn>
                </section>

                <Footer />
            </div>
        </div>
    );
}
