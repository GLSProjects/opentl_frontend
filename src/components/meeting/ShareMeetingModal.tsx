"use client";

import React, { useState } from "react";
import { X, Copy, Check, Share2, Mail, MessageCircle, QrCode } from "lucide-react";

type ShareMeetingModalProps = {
    isOpen: boolean;
    onClose: () => void;
    roomId: string;
    roomName?: string;
    isHostFirstJoin?: boolean;
};

export default function ShareMeetingModal({
    isOpen,
    onClose,
    roomId,
    roomName,
    isHostFirstJoin = false,
}: ShareMeetingModalProps) {
    const [copied, setCopied] = useState(false);
    const [showQr, setShowQr] = useState(false);

    if (!isOpen) return null;

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const meetingUrl = `${origin}/meeting/${roomId}`;

    const handleCopy = async () => {
        let success = false;
        if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(meetingUrl);
                success = true;
            } catch (e) {
                success = false;
            }
        }
        if (!success) {
            try {
                const el = document.createElement("textarea");
                el.value = meetingUrl;
                el.setAttribute("readonly", "");
                el.style.position = "absolute";
                el.style.left = "-9999px";
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
                success = true;
            } catch (e) {
                success = false;
            }
        }
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleNativeShare = async () => {
        if (typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share({
                    title: roomName || "OpenTL Video Meeting",
                    text: `Join my video meeting: ${roomName || roomId}`,
                    url: meetingUrl,
                });
            } catch (e) {}
        }
    };

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Join my video meeting: ${meetingUrl}`)}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(roomName || "Meeting Invitation")}&body=${encodeURIComponent(`Join my video meeting: ${meetingUrl}`)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(meetingUrl)}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-[#2b2d31] w-full max-w-md rounded-3xl p-6 border border-zinc-700 shadow-2xl relative space-y-5 text-white"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold">
                            {isHostFirstJoin ? "Your meeting is ready" : "Meeting Details"}
                        </h3>
                        <p className="text-zinc-400 text-xs mt-0.5">
                            {roomName || `Room: ${roomId}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                        Meeting Link
                    </label>
                    <div className="flex items-center gap-2 bg-[#1e1f22] border border-zinc-700 rounded-xl px-3 py-2.5">
                        <input
                            type="text"
                            value={meetingUrl}
                            readOnly
                            className="flex-1 bg-transparent text-sm text-zinc-200 focus:outline-none truncate"
                        />
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition active:scale-95 shrink-0"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-white" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-[11px] text-zinc-400">People need to sign in to join.</p>
                </div>

                <div className="flex items-center justify-around pt-2 border-t border-zinc-700/60">
                    {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                        <button
                            onClick={handleNativeShare}
                            className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition p-2 hover:bg-zinc-750 rounded-xl"
                        >
                            <div className="p-2.5 rounded-full bg-zinc-800 border border-zinc-700">
                                <Share2 className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="text-[11px] font-medium">Share</span>
                        </button>
                    )}

                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition p-2 hover:bg-zinc-750 rounded-xl"
                    >
                        <div className="p-2.5 rounded-full bg-zinc-800 border border-zinc-700">
                            <MessageCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-[11px] font-medium">WhatsApp</span>
                    </a>

                    <a
                        href={mailtoUrl}
                        className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition p-2 hover:bg-zinc-750 rounded-xl"
                    >
                        <div className="p-2.5 rounded-full bg-zinc-800 border border-zinc-700">
                            <Mail className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="text-[11px] font-medium">Email</span>
                    </a>

                    <button
                        onClick={() => setShowQr(!showQr)}
                        className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition p-2 hover:bg-zinc-750 rounded-xl"
                    >
                        <div className="p-2.5 rounded-full bg-zinc-800 border border-zinc-700">
                            <QrCode className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-[11px] font-medium">QR Code</span>
                    </button>
                </div>

                {showQr && (
                    <div className="flex flex-col items-center pt-2">
                        <div className="p-3 bg-white rounded-2xl shadow-lg">
                            <img src={qrUrl} alt="Meeting QR Code" className="w-36 h-36" />
                        </div>
                        <span className="text-zinc-400 text-[11px] mt-2">Scan with camera to join</span>
                    </div>
                )}
            </div>
        </div>
    );
}

