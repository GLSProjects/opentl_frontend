"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PlusCircle, Gift, Sticker, Smile, Send, Hash, X, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { io, Socket } from "socket.io-client";
import { AnimatePresence, motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Author {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
    email: string;
}

interface Message {
    _id: string;
    content: string;
    author: Author;
    serverId: string;
    channelId: string;
    createdAt: string;
}

interface ChannelUser {
    socketId: string;
    userId: string;
    username: string;
    displayName?: string;
    avatar?: string;
    isTyping: boolean;
}

// ─── Emoji Data ───────────────────────────────────────────────────────────────
const EMOJI_CATEGORIES: Record<string, string[]> = {
    "😊 Smileys": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕"],
    "👋 Gestures": ["👍", "👎", "👌", "🤌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤏", "💪", "🦾", "🙏", "🤲", "👐", "🫶", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"],
    "🐶 Animals": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟"],
    "🍕 Food": ["🍎", "🍊", "🍋", "🍇", "🍓", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🍆", "🥦", "🥕", "🌽", "🌶️", "🥒", "🥗", "🍔", "🍟", "🌮", "🌯", "🥙", "🍕", "🍝", "🍜", "🍛", "🍱", "🍣", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "☕", "🍵", "🧃", "🥤", "🍺", "🍻", "🥂", "🍷", "🍸", "🧋"],
    "✈️ Travel": ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🛵", "🏍️", "🚲", "🛴", "🚁", "✈️", "🚀", "🛸", "🚢", "⛵", "🛥️", "🚤", "🏖️", "🏕️", "🏔️", "🌋", "🗺️", "🗼", "🏰", "🎡", "🎢", "🎠", "🗽", "🌁", "🌃", "🌆", "🌇", "🌉", "🌌", "🎑", "🏞️", "🌅", "🌄", "🌠"],
    "⚽ Objects": ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥊", "🥋", "⛳", "🎿", "🛷", "🎯", "🎲", "🎮", "🕹️", "🧩", "🎸", "🎹", "🎺", "🎻", "🥁", "📱", "💻", "🖥️", "⌨️", "🖨️", "🖱️", "📷", "📸", "📹", "📺", "📻", "🎙️", "🎚️", "🎛️", "📡", "💡", "🔦", "🕯️", "🔋", "💰", "💎", "🔑", "🗝️"],
    "💯 Symbols": ["❤️‍🔥", "💯", "✅", "❌", "⭐", "🌟", "💫", "✨", "🔥", "💥", "💢", "💬", "💭", "💤", "🔔", "🔕", "🎵", "🎶", "🎊", "🎉", "🎈", "🎀", "🎁", "🏆", "🥇", "🏅", "🎖️", "🎗️", "📌", "📍", "🗑️", "📌", "❓", "❗", "‼️", "⁉️", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "🟤", "⚫", "⚪", "🔶", "🔷"],
};

// ─── Sticker Data ─────────────────────────────────────────────────────────────
const STICKERS = [
    { id: 1, label: "Party", emoji: "🎉🥳" },
    { id: 2, label: "Love", emoji: "❤️😍" },
    { id: 3, label: "LOL", emoji: "😂🤣" },
    { id: 4, label: "Wow", emoji: "😮🤯" },
    { id: 5, label: "GG", emoji: "💪🏆" },
    { id: 6, label: "Fire", emoji: "🔥✨" },
    { id: 7, label: "Sad", emoji: "😢💔" },
    { id: 8, label: "Hype", emoji: "🚀💫" },
    { id: 9, label: "Pog", emoji: "😤👊" },
    { id: 10, label: "Sleep", emoji: "😴💤" },
    { id: 11, label: "Think", emoji: "🤔💭" },
    { id: 12, label: "Cool", emoji: "😎🕶️" },
];

// ─── Giphy Config ─────────────────────────────────────────────────────────────
const GIPHY_KEY = "dc6zaTOxFJmzC"; // public beta key
const GIPHY_TRENDING = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=g`;
const GIPHY_SEARCH = (q: string) => `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=24&rating=g`;

interface GifResult { id: string; images: { fixed_height_small: { url: string }; original: { url: string } } }

// ─── Panel animation ─────────────────────────────────────────────────────────
const panelVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 8 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15 } },
    exit: { opacity: 0, scale: 0.92, y: 8, transition: { duration: 0.1 } },
};

// ═════════════════════════════════════════════════════════════════════════════
export default function ChatArea({
    serverId, channelId, channelName,
}: { serverId: string; channelId: string; channelName: string }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState<ChannelUser[]>([]);
    const [channelUsers, setChannelUsers] = useState<ChannelUser[]>([]);
    const [joinNotifications, setJoinNotifications] = useState<string[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Panel state: "emoji" | "gif" | "sticker" | null
    const [openPanel, setOpenPanel] = useState<"emoji" | "gif" | "sticker" | null>(null);
    const [emojiCategory, setEmojiCategory] = useState(Object.keys(EMOJI_CATEGORIES)[0]);
    const [gifs, setGifs] = useState<GifResult[]>([]);
    const [gifSearch, setGifSearch] = useState("");
    const [gifLoading, setGifLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const togglePanel = (panel: "emoji" | "gif" | "sticker") => {
        setOpenPanel(prev => prev === panel ? null : panel);
    };

    // Close panel on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpenPanel(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Load trending GIFs when GIF panel first opens
    useEffect(() => {
        if (openPanel !== "gif") return;
        if (gifs.length > 0 && !gifSearch) return;
        fetchGifs(gifSearch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openPanel]);

    const fetchGifs = async (query: string) => {
        setGifLoading(true);
        try {
            const url = query ? GIPHY_SEARCH(query) : GIPHY_TRENDING;
            const res = await fetch(url);
            const data = await res.json();
            setGifs(data.data ?? []);
        } catch { /* silent */ }
        finally { setGifLoading(false); }
    };

    // Debounced GIF search
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleGifSearch = (q: string) => {
        setGifSearch(q);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => fetchGifs(q), 500);
    };

    // ── Socket + history ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!user?.token || !channelId) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await fetch(`https://opentl-backend-1.onrender.com/api/messages/${channelId}`, {
                    headers: { Authorization: `Bearer ${user.token}` },
                });
                if (res.ok) setMessages(await res.json());
            } catch (err) { console.error("Failed to fetch messages:", err); }
            finally { setLoading(false); }
        };

        fetchHistory();

        // ✅ Use env var — critical for Vercel production build
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://opentl-backend-1.onrender.com";
        socketRef.current = io(backendUrl, {
            transports: ["websocket"], // 🔥 VERY IMPORTANT: force WebSocket to avoid Render polling issues
            withCredentials: true,
        });

        // Debug: confirm socket connection in browser console
        socketRef.current.on("connect", () => {
            console.log("🔥 Socket connected:", socketRef.current?.id);
        });
        socketRef.current.on("connect_error", (err) => {
            console.error("❌ Socket connect_error:", err.message);
        });
        
        // Join channel with user info
        socketRef.current.emit("join-channel", { channelId, user });
        
        // Message events
        socketRef.current.on("new-message", (msg: Message) => {
            setMessages(prev => {
                // Prevent duplicates (especially for the sender who might receive their own message back)
                if (prev.some(m => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        });
        socketRef.current.on("message-deleted", (deletedId: string) =>
            setMessages(prev => prev.filter(m => m._id !== deletedId))
        );

        // User presence events
        socketRef.current.on("channel-users-updated", (users: ChannelUser[]) => {
            setChannelUsers(users);
        });

        socketRef.current.on("typing-users-updated", (users: ChannelUser[]) => {
            setTypingUsers(users.filter(u => u.userId !== user?._id));
        });

        socketRef.current.on("user-joined-channel", ({ user: joinedUser }: { user: Author }) => {
            const notification = `${joinedUser.displayName || joinedUser.username} joined the channel`;
            setJoinNotifications(prev => [...prev, notification]);
            setTimeout(() => {
                setJoinNotifications(prev => prev.filter(n => n !== notification));
            }, 3000);
        });

        socketRef.current.on("user-left-channel", ({ user: leftUser }: { user: Author }) => {
            const notification = `${leftUser.displayName || leftUser.username} left the channel`;
            setJoinNotifications(prev => [...prev, notification]);
            setTimeout(() => {
                setJoinNotifications(prev => prev.filter(n => n !== notification));
            }, 3000);
        });

        return () => { socketRef.current?.disconnect(); };
    }, [channelId, user?.token]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    // ── Send helpers ──────────────────────────────────────────────────────────
    const sendContent = useCallback(async (content: string) => {
        if (!content.trim() || !user?.token || !user?._id) return;

        // ✅ 1. Create optimistic message data
        const tempId = `temp-${Date.now()}`;
        const messageData: Message = {
            _id: tempId,
            content,
            author: {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
                email: user.email || "",
            },
            serverId,
            channelId,
            createdAt: new Date().toISOString(),
        };

        // ✅ 2. Update UI instantly
        setMessages(prev => [...prev, messageData]);

        try {
            // ✅ 3. Save to DB
            const res = await fetch("https://opentl-backend-1.onrender.com/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
                body: JSON.stringify({ content, serverId, channelId }),
            });
            
            if (res.ok) {
                const savedMessage = await res.json();
                
                // ✅ 4. Replace temp message with real one from DB
                setMessages(prev => prev.map(m => m._id === tempId ? savedMessage : m));
                
                // ✅ 5. Emit via socket to others
                socketRef.current?.emit("send-message", savedMessage);
            } else {
                // If save failed, remove the optimistic message
                setMessages(prev => prev.filter(m => m._id !== tempId));
                console.error("Message save failed");
            }
        } catch (err) { 
            console.error("Failed to send message:", err);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m._id !== tempId));
        }
    }, [user, serverId, channelId]);

    // Typing indicators
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        
        if (value.trim() && socketRef.current) {
            // Start typing indicator
            socketRef.current.emit("typing-start", { channelId, userId: user?._id });
            
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Stop typing after 3 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current?.emit("typing-stop", { channelId, userId: user?._id });
            }, 3000);
        } else if (!value.trim() && socketRef.current) {
            // Stop typing if input is cleared
            socketRef.current?.emit("typing-stop", { channelId, userId: user?._id });
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendContent(inputValue);
        setInputValue("");
    };

    const handleEmojiClick = (emoji: string) => {
        setInputValue(prev => prev + emoji);
        setOpenPanel(null);
    };

    const handleStickerClick = (sticker: typeof STICKERS[0]) => {
        setInputValue(prev => prev + sticker.emoji);
        setOpenPanel(null);
    };

    const handleGifClick = async (gif: GifResult) => {
        setOpenPanel(null);
        await sendContent(gif.images.original.url);
    };

    const handleDeleteMessage = async (messageId: string, channelId: string) => {
        setDeleteConfirmId(null);
        try {
            const res = await fetch(`https://opentl-backend-1.onrender.com/api/messages/${messageId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${user!.token}` },
            });
            if (res.ok) {
                // Optimistically remove from local state
                setMessages(prev => prev.filter(m => m._id !== messageId));
                // Broadcast deletion to other clients
                socketRef.current?.emit("delete-message", { messageId, channelId });
            }
        } catch (err) { console.error("Failed to delete message:", err); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            await sendContent(reader.result as string);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    // ── Render helpers ────────────────────────────────────────────────────────
    const getAuthorName = (author: Author) => author.displayName || author.username || "Unknown";

    const getInitials = (name?: string) => {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase();
    };

    const formatTimestamp = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    // Detect if content is a GIF URL or base64 image
    const isImageContent = (content: string) =>
        content.startsWith("data:image") ||
        content.match(/\.(gif|png|jpg|jpeg|webp)(\?.*)?$/i);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full bg-[#313338] relative overflow-hidden">
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
                <div className="mb-8">
                    <div className="w-16 h-16 bg-[#41434a] rounded-full flex items-center justify-center mb-4 text-[#dbdee1]">
                        <Hash className="w-10 h-10" />
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-3xl font-bold text-white">Welcome to #{channelName}!</h1>
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span>{channelUsers.length} online</span>
                        </div>
                    </div>
                    <p className="text-zinc-400">This is the start of the #{channelName} channel.</p>
                </div>

                <div className="border-t border-zinc-700/50 my-6" />

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600" />
                    </div>
                ) : (
                    <>
                        {/* Join/Leave Notifications */}
                        <AnimatePresence>
                            {joinNotifications.map((notification, index) => (
                                <motion.div
                                    key={`${notification}-${index}`}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-center py-2 text-xs text-zinc-400 italic"
                                >
                                    {notification}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Typing Indicators */}
                        <AnimatePresence>
                            {typingUsers.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="flex items-center gap-2 px-4 py-2 text-zinc-400 text-sm"
                                >
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-xs">
                                        {typingUsers.length === 1 
                                            ? `${typingUsers[0].displayName || typingUsers[0].username} is typing...`
                                            : typingUsers.length === 2
                                            ? `${typingUsers[0].displayName || typingUsers[0].username} and ${typingUsers[1].displayName || typingUsers[1].username} are typing...`
                                            : `${typingUsers.length} people are typing...`
                                        }
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Messages */}
                        {messages.map((msg) => {
                            const isOwn = user?._id === msg.author?._id;
                            return (
                                <div key={msg._id} className="flex gap-4 group hover:bg-[#2e3035] -mx-4 px-4 py-1 rounded transition-colors relative">
                                    {/* Avatar */}
                                    <div className="shrink-0 mt-0.5">
                                        {msg.author?.avatar ? (
                                            <img
                                                src={msg.author.avatar}
                                                alt={getAuthorName(msg.author)}
                                                className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-zinc-700"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-600 text-white font-bold text-sm shadow-sm ring-2 ring-zinc-700">
                                                {getInitials(getAuthorName(msg.author))}
                                            </div>
                                        )}
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-bold text-white hover:underline cursor-pointer text-sm">
                                                {getAuthorName(msg.author)}
                                            </span>
                                            {msg.author?.username && msg.author.displayName && (
                                                <span className="text-[11px] text-zinc-500">@{msg.author.username}</span>
                                            )}
                                            <span className="text-[11px] text-zinc-400">
                                                {formatTimestamp(msg.createdAt)}
                                            </span>
                                        </div>
                                        {isImageContent(msg.content) ? (
                                            <img
                                                src={msg.content}
                                                alt="shared content"
                                                className="mt-1 max-w-[320px] max-h-60 rounded-lg object-cover border border-zinc-600"
                                            />
                                        ) : (
                                            <p className="text-[#dbdee1] text-sm leading-relaxed break-words mt-0.5">
                                                {msg.content}
                                            </p>
                                        )}
                                    </div>

                                    {/* Hover Actions — only for own messages */}
                                    {isOwn && (
                                        <div className="absolute right-4 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setDeleteConfirmId(msg._id)}
                                                title="Delete message"
                                                className="p-1.5 rounded bg-[#1e1f22] hover:bg-red-600 text-zinc-400 hover:text-white transition-all shadow"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Delete Confirm Modal */}
                                    {deleteConfirmId === msg._id && (
                                        <div
                                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                                            onClick={() => setDeleteConfirmId(null)}
                                        >
                                            <div
                                                className="bg-[#313338] border border-zinc-700 rounded-xl p-6 w-full max-w-sm shadow-2xl"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <h3 className="text-white font-bold text-lg mb-1">Delete Message</h3>
                                                <p className="text-zinc-400 text-sm mb-1">Are you sure you want to delete this message? This cannot be undone.</p>
                                                <div className="bg-[#2b2d31] rounded-lg p-3 mb-4 text-zinc-300 text-sm break-words">
                                                    {isImageContent(msg.content)
                                                        ? <span className="italic text-zinc-500">[Image / GIF]</span>
                                                        : msg.content
                                                    }
                                                </div>
                                                <div className="flex gap-3 justify-end">
                                                    <button
                                                        onClick={() => setDeleteConfirmId(null)}
                                                        className="px-4 py-1.5 rounded-md text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg._id, msg.channelId)}
                                                        className="px-4 py-1.5 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white font-semibold transition"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* ── Input Box Area ──────────────────────────────────────────── */}
            <div className="px-4 pb-6 mt-auto" ref={panelRef}>

                {/* ── Panels (positioned above input) ─────────────────────── */}
                <AnimatePresence>
                    {openPanel === "emoji" && (
                        <motion.div
                            key="emoji"
                            variants={panelVariants}
                            initial="hidden" animate="visible" exit="exit"
                            className="mb-2 bg-[#1e1f22] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden w-full max-w-md"
                        >
                            {/* Category tabs */}
                            <div className="flex gap-1 p-2 border-b border-zinc-700 overflow-x-auto scrollbar-hide">
                                {Object.keys(EMOJI_CATEGORIES).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setEmojiCategory(cat)}
                                        className={cn(
                                            "shrink-0 px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                                            emojiCategory === cat
                                                ? "bg-red-600 text-white"
                                                : "text-zinc-400 hover:bg-zinc-700 hover:text-white"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            {/* Emoji grid */}
                            <div className="grid grid-cols-10 gap-0 p-2 max-h-52 overflow-y-auto custom-scrollbar">
                                {EMOJI_CATEGORIES[emojiCategory].map((emoji, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleEmojiClick(emoji)}
                                        className="text-xl p-1.5 rounded hover:bg-zinc-700 transition-colors leading-none"
                                        title={emoji}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {openPanel === "gif" && (
                        <motion.div
                            key="gif"
                            variants={panelVariants}
                            initial="hidden" animate="visible" exit="exit"
                            className="mb-2 bg-[#1e1f22] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden w-full"
                        >
                            {/* Search */}
                            <div className="p-2 border-b border-zinc-700">
                                <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1.5">
                                    <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                                    <input
                                        type="text"
                                        value={gifSearch}
                                        onChange={e => handleGifSearch(e.target.value)}
                                        placeholder="Search GIFs..."
                                        className="bg-transparent text-sm text-zinc-200 outline-none flex-1 placeholder:text-zinc-500"
                                        autoFocus
                                    />
                                    {gifSearch && (
                                        <button onClick={() => { setGifSearch(""); fetchGifs(""); }}>
                                            <X className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* GIF grid */}
                            <div className="grid grid-cols-3 gap-1 p-2 max-h-64 overflow-y-auto custom-scrollbar">
                                {gifLoading ? (
                                    <div className="col-span-3 flex justify-center py-6">
                                        <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-red-600" />
                                    </div>
                                ) : gifs.length === 0 ? (
                                    <div className="col-span-3 text-center text-zinc-500 text-sm py-6">No GIFs found</div>
                                ) : (
                                    gifs.map(gif => (
                                        <button
                                            key={gif.id}
                                            onClick={() => handleGifClick(gif)}
                                            className="rounded-lg overflow-hidden hover:ring-2 hover:ring-red-500 transition-all"
                                        >
                                            <img
                                                src={gif.images.fixed_height_small.url}
                                                alt="gif"
                                                className="w-full h-20 object-cover"
                                                loading="lazy"
                                            />
                                        </button>
                                    ))
                                )}
                            </div>
                            <p className="text-[10px] text-zinc-600 text-center pb-1">Powered by GIPHY</p>
                        </motion.div>
                    )}

                    {openPanel === "sticker" && (
                        <motion.div
                            key="sticker"
                            variants={panelVariants}
                            initial="hidden" animate="visible" exit="exit"
                            className="mb-2 bg-[#1e1f22] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden w-72"
                        >
                            <p className="text-xs font-semibold text-zinc-400 px-3 pt-2 pb-1 uppercase tracking-wide">Stickers</p>
                            <div className="grid grid-cols-4 gap-2 p-3">
                                {STICKERS.map(sticker => (
                                    <button
                                        key={sticker.id}
                                        onClick={() => handleStickerClick(sticker)}
                                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-zinc-700 transition-colors"
                                        title={sticker.label}
                                    >
                                        <span className="text-3xl leading-none">{sticker.emoji.split("")[0]}</span>
                                        <span className="text-[10px] text-zinc-400">{sticker.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.gif"
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* Input form */}
                <form
                    onSubmit={handleSendMessage}
                    className="bg-[#383a40] rounded-lg flex items-center px-4 py-2.5 gap-4 shadow-sm"
                >
                    {/* Plus / Attach */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach file"
                        className="text-zinc-400 hover:text-zinc-200 transition"
                    >
                        <PlusCircle className="w-6 h-6" />
                    </button>

                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder={`Message #${channelName}`}
                        className="bg-transparent flex-1 text-zinc-200 outline-none placeholder:text-zinc-500 text-sm md:text-base border-none focus:ring-0 w-full"
                    />

                    <div className="flex items-center gap-3 text-zinc-400">
                        {/* GIF */}
                        <button
                            type="button"
                            onClick={() => togglePanel("gif")}
                            title="Send a GIF"
                            className={cn("transition hidden sm:flex items-center gap-1 font-bold text-xs border rounded px-1.5 py-0.5",
                                openPanel === "gif"
                                    ? "border-red-500 text-red-400"
                                    : "border-zinc-600 hover:border-zinc-400 hover:text-zinc-200"
                            )}
                        >
                            GIF
                        </button>

                        {/* Sticker */}
                        <button
                            type="button"
                            onClick={() => togglePanel("sticker")}
                            title="Send a Sticker"
                            className={cn("hidden sm:block hover:text-zinc-200 transition",
                                openPanel === "sticker" && "text-red-400"
                            )}
                        >
                            <Sticker className="w-6 h-6" />
                        </button>

                        {/* Emoji */}
                        <button
                            type="button"
                            onClick={() => togglePanel("emoji")}
                            title="Pick an emoji"
                            className={cn("hover:text-zinc-200 transition",
                                openPanel === "emoji" && "text-red-400"
                            )}
                        >
                            <Smile className="w-6 h-6" />
                        </button>

                        {/* Send */}
                        <button
                            type="submit"
                            className={cn(
                                "p-1.5 rounded transition-all",
                                inputValue.trim() ? "bg-red-600 text-white" : "text-zinc-500"
                            )}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </form>

                <p className="text-[10px] text-zinc-500 px-1 pt-1 ml-12">Press Enter to send</p>
            </div>
        </div>
    );
}
