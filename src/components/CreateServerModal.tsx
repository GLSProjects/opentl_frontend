"use client";

import React, { useState, useRef } from "react";
import { X, Camera, ChevronRight, Users, User, Link as LinkIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateServerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, topic: string, audience: string, logo: string) => void;
}

export default function CreateServerModal({ isOpen, onClose, onCreate }: CreateServerModalProps) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [topic, setTopic] = useState("");
    const [audience, setAudience] = useState("");
    const [logo, setLogo] = useState("");
    const [imageType, setImageType] = useState<"text" | "upload" | "url">("text");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Close on Escape key
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name, topic, audience || "friends", logo || name[0].toUpperCase());
            resetAndClose();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
                setImageType("upload");
            };
            reader.readAsDataURL(file);
        }
    };

    const resetAndClose = () => {
        setStep(1);
        setName("");
        setTopic("");
        setAudience("");
        setLogo("");
        setImageType("text");
        onClose();
    };

    const isImage = logo.startsWith("data:") || logo.startsWith("http");

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={resetAndClose}
            />

            {/* Modal Content */}
            <div className="relative bg-[#313338] w-full max-w-[460px] rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-4 text-center relative">
                    <button
                        onClick={resetAndClose}
                        className="absolute right-4 top-4 text-zinc-400 hover:text-white transition"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {step === 1 ? (
                        <>
                            <h2 className="text-2xl font-bold text-white mb-2">Create Your Server</h2>
                            <p className="text-zinc-400 text-sm">Your server is where you and your friends hang out. Make yours and start talking.</p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-white mb-2">Customize Your Server</h2>
                            <p className="text-zinc-400 text-sm">Give your new server a personality with a name and an icon. You can always change it later.</p>
                        </>
                    )}
                </div>

                <div className="p-4">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Tell us more about your server</h3>

                            <AudienceOption
                                icon={<Users className="w-6 h-6" />}
                                title="For a club or community"
                                description="Build a community for a club, team, class, or larger group."
                                onClick={() => { setAudience("community"); setStep(2); }}
                            />
                            <AudienceOption
                                icon={<User className="w-6 h-6" />}
                                title="For me and my friends"
                                description="Create a private space for you and your friends."
                                onClick={() => { setAudience("friends"); setStep(2); }}
                            />

                            <div className="text-center pt-2">
                                <p className="text-sm text-zinc-400">Not sure? You can <button onClick={() => { setAudience("friends"); setStep(2); }} className="text-blue-400 hover:underline">skip this question</button> for now.</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleCreate} className="space-y-6">
                            {/* Logo Selection Section */}
                            <div className="flex flex-col items-center gap-4">
                                <div
                                    className="relative group cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="w-20 h-20 rounded-full bg-zinc-700 flex flex-col items-center justify-center border-2 border-dashed border-zinc-500 group-hover:border-white transition-colors overflow-hidden">
                                        {isImage ? (
                                            <img src={logo} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <Camera className="w-6 h-6 text-zinc-400 group-hover:text-white mb-1" />
                                                <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white uppercase">Upload</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="absolute -top-1 -right-1 bg-red-600 rounded-full p-1.5 shadow-lg">
                                        <Upload className="w-4 h-4 text-white" />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                <div className="w-full space-y-4">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                            <LinkIcon className="w-4 h-4 text-zinc-500" />
                                        </div>
                                        <input
                                            type="text"
                                            value={imageType === "url" ? logo : ""}
                                            onChange={(e) => {
                                                setLogo(e.target.value);
                                                setImageType("url");
                                            }}
                                            placeholder="Or enter image URL"
                                            className="w-full bg-[#1e1f22] text-zinc-200 pl-10 pr-3 py-2 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all border-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block tracking-wider">Server Name</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (imageType === "text" || !logo) {
                                                setLogo(e.target.value[0]?.toUpperCase() || "");
                                                setImageType("text");
                                            }
                                        }}
                                        className="w-full bg-[#1e1f22] text-zinc-200 p-3 rounded outline-none focus:ring-2 focus:ring-blue-500 transition-all border-none"
                                        placeholder="Enter server name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block tracking-wider">Server Topic</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="w-full bg-[#1e1f22] text-zinc-200 p-3 rounded outline-none focus:ring-2 focus:ring-blue-500 transition-all border-none"
                                        placeholder="What's this server about?"
                                    />
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex justify-between items-center bg-[#2b2d31] -mx-4 -mb-4 p-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-white text-sm font-medium hover:underline"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={!name.trim()}
                                    className="bg-red-600 text-white px-8 py-2.5 rounded font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20 active:scale-95"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

function AudienceOption({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-3.5 rounded-lg border border-zinc-700/50 hover:bg-zinc-700/50 transition-all group text-left"
        >
            <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 group-hover:bg-red-600 group-hover:text-white transition-colors shadow-sm shrink-0">
                    {icon}
                </div>
                <div>
                    <div className="font-bold text-zinc-200 group-hover:text-white transition-colors text-sm">{title}</div>
                    <div className="text-xs text-zinc-400 mt-0.5 leading-snug">{description}</div>
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors shrink-0 ml-2" />
        </button>
    );
}
