"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Footer from "@/components/Footer";
import { useActiveUsers } from "@/hooks/useActiveUsers";
import {
    MessageCircle, Volume2, Video, Shield, Zap, Users, Compass,
    Hash, Mic, Lock, Globe, Star, ArrowRight, ChevronRight, Sparkles,
    Server, UserPlus, CheckCircle
} from "lucide-react";

/* ─── Animated counter ───────────────────────────────────────────────────── */
function Counter({ to, label, suffix = "" }: { to: number; label: string; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const duration = 2000;
                const steps = 60;
                const inc = to / steps;
                let current = 0;
                const timer = setInterval(() => {
                    current += inc;
                    if (current >= to) { setCount(to); clearInterval(timer); }
                    else setCount(Math.floor(current));
                }, duration / steps);
            }
        }, { threshold: 0.5 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [to]);

    return (
        <div ref={ref} className="text-center">
            <div className="text-4xl md:text-5xl font-black text-white mb-2">
                {count.toLocaleString()}{suffix}
            </div>
            <div className="text-zinc-400 text-sm font-medium uppercase tracking-widest">{label}</div>
        </div>
    );
}

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    y: ((i * 53 + 27) % 100),
    size: ((i * 7) % 3) + 1.5,
    duration: ((i * 11) % 6) + 4,
    delay: ((i * 13) % 4),
}));

function Particles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {PARTICLES.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-red-500/40"
                    style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
                    animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
                    transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
                />
            ))}
        </div>
    );
}

/* ─── Chat preview mock ──────────────────────────────────────────────────── */
function ChatPreview() {
    const messages = [
        { user: "Alex", avatar: "A", color: "bg-red-600", text: "Anyone tried the new voice channels? 🎤", time: "9:41 AM", side: "left" },
        { user: "Maya", avatar: "M", color: "bg-indigo-600", text: "Yes! Crystal clear quality 🔥", time: "9:41 AM", side: "right" },
        { user: "Dev", avatar: "D", color: "bg-green-600", text: "OpenTL is insane, joining the AI Community now", time: "9:42 AM", side: "left" },
        { user: "Maya", avatar: "M", color: "bg-indigo-600", text: "Welcome! Start by clicking Discover Communities 👋", time: "9:42 AM", side: "right" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative w-full max-w-lg mx-auto"
        >
            {/* Glow behind */}
            <div className="absolute -inset-4 bg-gradient-to-br from-red-600/20 via-transparent to-indigo-600/20 blur-3xl rounded-3xl" />

            {/* App window */}
            <div className="relative bg-[#1e1f22] rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#111214] border-b border-zinc-800">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                        <Hash className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-zinc-400 text-xs font-medium">general</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-zinc-500 text-[10px]">Live</span>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="p-5 space-y-4 min-h-[240px]">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: msg.side === "left" ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + i * 0.25 }}
                            className={`flex items-start gap-3 ${msg.side === "right" ? "flex-row-reverse" : ""}`}
                        >
                            <div className={`w-8 h-8 rounded-full ${msg.color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                                {msg.avatar}
                            </div>
                            <div className={`max-w-[75%] ${msg.side === "right" ? "items-end" : "items-start"} flex flex-col`}>
                                <div className={`flex items-center gap-2 mb-1 ${msg.side === "right" ? "flex-row-reverse" : ""}`}>
                                    <span className="text-xs font-semibold text-white">{msg.user}</span>
                                    <span className="text-[10px] text-zinc-600">{msg.time}</span>
                                </div>
                                <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${msg.side === "right"
                                    ? "bg-red-600/20 text-white rounded-tr-sm border border-red-500/20"
                                    : "bg-zinc-800 text-gray-200 rounded-tl-sm border border-zinc-700"
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Input bar */}
                <div className="px-4 pb-4">
                    <div className="bg-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 border border-zinc-700">
                        <MessageCircle className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-600 text-sm flex-1">Message #general</span>
                        <div className="flex gap-2">
                            <Mic className="w-4 h-4 text-zinc-500" />
                            <Video className="w-4 h-4 text-zinc-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating badges */}
            <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-black/90 border border-red-500/50 rounded-xl px-3 py-2 text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-2"
            >
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live Chat
            </motion.div>

            <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-4 -left-4 bg-black/90 border border-indigo-500/50 rounded-xl px-3 py-2 text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-2"
            >
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-indigo-300">Discover Communities</span>
            </motion.div>
        </motion.div>
    );
}

/* ─── Feature card ───────────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, accent, delay }: {
    icon: React.ReactNode; title: string; desc: string; accent: string; delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="group relative bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-7 hover:border-white/20 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
        >
            {/* Hover glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${accent} blur-3xl`} />

            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${accent.replace("bg-", "from-").replace("/5", "/30")} border border-white/10`}>
                    {icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-red-300 transition-colors">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
            </div>
        </motion.div>
    );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function Home() {
    const { activeUsers } = useActiveUsers();
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
    const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    const features = [
        { icon: <MessageCircle className="w-6 h-6 text-red-400" />, title: "Real-Time Chat", desc: "Instant messages with typing indicators, reactions, and rich embeds — powered by Socket.io.", accent: "bg-red-600/5", delay: 0 },
        { icon: <Volume2 className="w-6 h-6 text-indigo-400" />, title: "Crystal Voice", desc: "WebRTC-powered voice channels. Click and talk — no dial-in, no downloads required.", accent: "bg-indigo-600/5", delay: 0.08 },
        { icon: <Video className="w-6 h-6 text-blue-400" />, title: "Video Meetings", desc: "Start live video streams and meetings directly inside your server without leaving.", accent: "bg-blue-600/5", delay: 0.16 },
        { icon: <Compass className="w-6 h-6 text-purple-400" />, title: "Community Discovery", desc: "Search and join public community servers by name. Grow your audience organically.", accent: "bg-purple-600/5", delay: 0.24 },
        { icon: <Shield className="w-6 h-6 text-green-400" />, title: "Roles & Permissions", desc: "Owner, Moderator, and Member roles. Full control over who can do what in your server.", accent: "bg-green-600/5", delay: 0.32 },
        { icon: <Lock className="w-6 h-6 text-orange-400" />, title: "Private Servers", desc: "Create invite-only servers for friends. Never appears in public discovery search.", accent: "bg-orange-600/5", delay: 0.4 },
    ];

    const howItWorks = [
        { step: "01", icon: <UserPlus className="w-6 h-6" />, title: "Create an Account", desc: "Sign up with email or Google OAuth in seconds. No credit card needed.", color: "text-red-400 border-red-500/30 bg-red-500/10" },
        { step: "02", icon: <Server className="w-6 h-6" />, title: "Create or Join a Server", desc: "Build your own community server or use the Discover tab to find and join existing ones.", color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10" },
        { step: "03", icon: <Hash className="w-6 h-6" />, title: "Set Up Channels", desc: "Organize your server with text channels for chat and voice channels for audio.", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
        { step: "04", icon: <MessageCircle className="w-6 h-6" />, title: "Start Communicating", desc: "Chat, call, or stream — everything is real-time and works instantly across all devices.", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
    ];

    const testimonials = [
        { name: "Priya Sharma", role: "CS Student", avatar: "P", color: "bg-red-600", text: "OpenTL replaced our WhatsApp group. The voice channels during our project deadlines are a lifesaver!", stars: 5 },
        { name: "Rahul Mehta", role: "Community Manager", avatar: "R", color: "bg-indigo-600", text: "The Community Discovery feature helped us grow our coding club from 10 to 200 members in a week.", stars: 5 },
        { name: "Ananya Singh", role: "Developer", avatar: "A", color: "bg-green-600", text: "Built with Next.js and Socket.io — you can feel how fast everything is. Love the tech stack!", stars: 5 },
    ];

    return (
        <div className="relative w-full overflow-hidden bg-[#0a0a0a] text-white">

            {/* ── HERO ──────────────────────────────────────────────────── */}
            <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

                {/* Multi-layer background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(220,38,38,0.25),transparent)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_80%_80%,rgba(99,102,241,0.12),transparent)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
                <Particles />

                <motion.div
                    style={{ y: heroY, opacity: heroOpacity }}
                    className="relative z-10 w-full max-w-7xl mx-auto px-6 py-32"
                >
                    <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                        {/* Left */}
                        <div className="flex-1 text-center lg:text-left space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-950/60 border border-red-700/50 rounded-full text-red-300 text-xs font-semibold uppercase tracking-widest mb-6 backdrop-blur-sm">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Next-Gen Communication Platform
                                </div>

                                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] tracking-tighter">
                                    <span className="block text-white">Connect.</span>
                                    <span className="block bg-gradient-to-r from-red-500 via-rose-400 to-orange-400 text-transparent bg-clip-text">
                                        Collaborate.
                                    </span>
                                    <span className="block text-white">Create.</span>
                                </h1>
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-xl text-zinc-400 max-w-lg mx-auto lg:mx-0 leading-relaxed font-light"
                            >
                                OpenTL is a Discord-inspired platform built for modern communities —
                                real-time chat, crystal voice, video meetings, and community discovery all in one place.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.35 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                            >
                                <Link
                                    href="/dashboard"
                                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:-translate-y-1 active:scale-95"
                                >
                                    Get Started Free
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/about"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl font-semibold text-lg transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm"
                                >
                                    Learn More
                                    <ChevronRight className="w-5 h-5" />
                                </Link>
                            </motion.div>

                            {/* Social proof */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="flex items-center gap-5 justify-center lg:justify-start pt-2"
                            >
                                <div className="flex -space-x-3">
                                    {[51, 52, 53, 54, 55].map(seed => (
                                        <img
                                            key={seed}
                                            src={`https://picsum.photos/seed/${seed}/80/80`}
                                            className="w-9 h-9 rounded-full border-2 border-[#0a0a0a] object-cover hover:scale-110 transition-transform"
                                            alt="User"
                                        />
                                    ))}
                                </div>
                                <div>
                                    <div className="flex mb-0.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-zinc-400 text-sm">
                                        <span className="text-white font-semibold">{activeUsers.toLocaleString()}</span> users online now
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right — Chat preview */}
                        <div className="flex-1 w-full flex justify-center lg:justify-end">
                            <ChatPreview />
                        </div>
                    </div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-600"
                >
                    <div className="w-5 h-8 rounded-full border border-zinc-700 flex items-center justify-center">
                        <div className="w-1 h-2 rounded-full bg-zinc-500 animate-bounce" />
                    </div>
                </motion.div>
            </section>

            {/* ── STATS BAR ─────────────────────────────────────────────── */}
            <section className="border-y border-zinc-900 bg-zinc-950/80 backdrop-blur-sm py-14">
                <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 divide-x divide-zinc-800">
                    <Counter to={activeUsers || 840} label="Active Users" />
                    <Counter to={99} suffix="%" label="Uptime" />
                    <Counter to={50} suffix="ms" label="Avg Latency" />
                    <Counter to={3} label="Server Types" />
                </div>
            </section>

            {/* ── FEATURES ──────────────────────────────────────────────── */}
            <section className="relative py-32 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(99,102,241,0.07),transparent)]" />

                <div className="relative max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-950/60 border border-red-700/40 rounded-full text-red-400 text-xs font-semibold uppercase tracking-widest mb-5">
                            <Zap className="w-3.5 h-3.5" /> Features
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-5">
                            Everything You Need to<br />
                            <span className="text-red-500">Build</span> Your Community
                        </h2>
                        <p className="text-zinc-400 text-lg max-w-2xl mx-auto font-light">
                            From private friend groups to massive public communities — OpenTL has the tools for every use case.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f, i) => <FeatureCard key={i} {...f} />)}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
            <section className="bg-zinc-950 border-y border-zinc-900 py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-950/60 border border-indigo-700/40 rounded-full text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-5">
                            <Globe className="w-3.5 h-3.5" /> How It Works
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-5">
                            Up and Running in <span className="text-red-500">4 Steps</span>
                        </h2>
                        <p className="text-zinc-400 text-lg max-w-xl mx-auto font-light">
                            No complicated setup. No downloads. Just sign up and start talking.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                        {/* Connecting line */}
                        <div className="hidden lg:block absolute top-16 left-[12.5%] w-3/4 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

                        {howItWorks.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-30px" }}
                                transition={{ delay: i * 0.12 }}
                                className="relative flex flex-col items-center text-center"
                            >
                                <div className={`w-14 h-14 rounded-2xl border ${item.color} flex items-center justify-center mb-5 z-10 transition-transform hover:scale-110`}>
                                    {item.icon}
                                </div>
                                <div className="text-zinc-700 text-xs font-black uppercase tracking-widest mb-2">{item.step}</div>
                                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── COMMUNITY TYPES ───────────────────────────────────────── */}
            <section className="py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-5">
                            Two Types of <span className="text-red-500">Servers</span>
                        </h2>
                        <p className="text-zinc-400 text-lg max-w-xl mx-auto font-light">
                            Choose the right type for your needs — private or public, every use case is covered.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Community */}
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="group relative rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-purple-950/20 p-10 overflow-hidden hover:border-indigo-500/40 transition-all duration-500"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-3xl rounded-full" />
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-6">
                                    <Compass className="w-7 h-7 text-indigo-400" />
                                </div>
                                <div className="inline-block px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wide mb-4">
                                    Community Server
                                </div>
                                <h3 className="text-2xl font-black text-white mb-3">For Clubs & Communities</h3>
                                <p className="text-zinc-400 leading-relaxed mb-6">
                                    Build a public community for your club, class, or interest group. Anyone on OpenTL can discover and join you through the community search.
                                </p>
                                <ul className="space-y-3">
                                    {["Appears in Discover Communities search", "Anyone can join without an invite", "Grows organically as users find you", "Perfect for clubs, classes, dev groups"].map(item => (
                                        <li key={item} className="flex items-start gap-2 text-sm text-zinc-300">
                                            <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>

                        {/* Private */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="group relative rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/40 to-zinc-950 p-10 overflow-hidden hover:border-red-500/40 transition-all duration-500"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-3xl rounded-full" />
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mb-6">
                                    <Lock className="w-7 h-7 text-red-400" />
                                </div>
                                <div className="inline-block px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-xs font-bold uppercase tracking-wide mb-4">
                                    Private Server
                                </div>
                                <h3 className="text-2xl font-black text-white mb-3">For Friends & Teams</h3>
                                <p className="text-zinc-400 leading-relaxed mb-6">
                                    Create a closed space for your friend group, study team, or private project. Only people you invite can find and join the server.
                                </p>
                                <ul className="space-y-3">
                                    {["Never appears in public search results", "Join only via invite link you control", "Full privacy for your conversations", "Perfect for friend groups & small teams"].map(item => (
                                        <li key={item} className="flex items-start gap-2 text-sm text-zinc-300">
                                            <CheckCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
            <section className="bg-zinc-950 border-y border-zinc-900 py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                            Loved by <span className="text-red-500">Communities</span>
                        </h2>
                        <p className="text-zinc-400 text-lg font-light">What our users are saying</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-30px" }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -4 }}
                                className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300"
                            >
                                <div className="flex mb-4">
                                    {Array.from({ length: t.stars }).map((_, j) => (
                                        <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-zinc-300 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <div className="text-white font-semibold text-sm">{t.name}</div>
                                        <div className="text-zinc-500 text-xs">{t.role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────────────────── */}
            <section className="py-40 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(220,38,38,0.15),transparent)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />

                <div className="relative max-w-4xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-950/60 border border-red-700/40 rounded-full text-red-400 text-xs font-semibold uppercase tracking-widest mb-8">
                            <Sparkles className="w-3.5 h-3.5" /> Free & Open Platform
                        </div>

                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
                            Your Community<br />Starts <span className="text-red-500">Here.</span>
                        </h2>

                        <p className="text-zinc-400 text-xl leading-relaxed mb-12 max-w-2xl mx-auto font-light">
                            Join thousands of students, developers, and creators already building amazing communities on OpenTL. It's free. It's fast. It's yours.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/signup"
                                className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-2xl font-bold text-xl transition-all duration-300 shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 hover:-translate-y-1"
                            >
                                Start for Free
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/about"
                                className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl font-semibold text-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                Read the Guide
                            </Link>
                        </div>

                        {/* Trust badges */}
                        <div className="flex flex-wrap justify-center gap-8 mt-14 text-zinc-500 text-sm">
                            {["✅ No credit card required", "✅ 100% free", "✅ Real-time messaging", "✅ Voice & Video included"].map(b => (
                                <span key={b}>{b}</span>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}