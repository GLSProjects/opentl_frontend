"use client";

import React, { useState, useEffect } from "react";
import { X, Shield, UserCircle, Smartphone, Lock, Layout, Volume2, Accessibility, Monitor, Globe, LogOut, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = "My Account" | "Profiles" | "Privacy & Safety" | "Appearance" | "Voice & Video";

interface UserData {
    username: string;
    tag: string;
    email: string;
    displayName: string;
    pronouns: string;
    bio: string;
    theme: "dark" | "light";
}

export default function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
    const { user, logout, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>("My Account");
    const [showMobileContent, setShowMobileContent] = useState(false);

    // Form states
    const [displayName, setDisplayName] = useState(user?.displayName || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [pronouns, setPronouns] = useState(user?.pronouns || "");
    const [avatar, setAvatar] = useState(user?.avatar || "");

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || "");
            setBio(user.bio || "");
            setPronouns(user.pronouns || "");
            setAvatar(user.avatar || "");
        }
    }, [user]);

    // Close on Escape key
    useEffect(() => {
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

    const handleTabClick = (tab: Tab) => {
        setActiveTab(tab);
        setShowMobileContent(true);
    };

    const handleSave = async (updates: any) => {
        await updateUser(updates);
    };

    if (!user) return null;

    return (
        <div className="fixed inset-0 z-[300] bg-[#313338] flex overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Sidebar Navigation */}
            <div className={cn(
                "flex md:bg-[#2b2d31] flex justify-end md:shrink-0 transition-all duration-300",
                showMobileContent ? "hidden md:flex" : "flex"
            )}>
                <div className="w-full md:w-[218px] flex flex-col pt-16 pb-6 px-4 md:px-1.5 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest px-2.5 py-1.5">User Settings</h3>
                            <div className="space-y-0.5">
                                <NavItem label="My Account" active={activeTab === "My Account"} onClick={() => handleTabClick("My Account")} />
                                <NavItem label="Profiles" active={activeTab === "Profiles"} onClick={() => handleTabClick("Profiles")} />
                                <NavItem label="Privacy & Safety" active={activeTab === "Privacy & Safety"} onClick={() => handleTabClick("Privacy & Safety")} />
                                <NavItem label="Authorized Apps" />
                                <NavItem label="Devices" />
                                <NavItem label="Connections" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest px-2.5 py-1.5">App Settings</h3>
                            <div className="space-y-0.5">
                                <NavItem label="Appearance" active={activeTab === "Appearance"} onClick={() => handleTabClick("Appearance")} />
                                <NavItem label="Accessibility" />
                                <NavItem label="Voice & Video" active={activeTab === "Voice & Video"} onClick={() => handleTabClick("Voice & Video")} />
                                <NavItem label="Text & Images" />
                                <NavItem label="Notifications" />
                                <NavItem label="Language" />
                            </div>
                        </div>

                        <div className="border-t border-zinc-700 mx-2.5 my-2" />

                        <button
                            onClick={() => {
                                logout();
                                onClose();
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-red-500 hover:bg-zinc-800 transition group"
                        >
                            <span className="text-sm font-medium">Log Out</span>
                            <LogOut className="w-4 h-4" />
                        </button>

                        <div className="px-2.5 py-1.5 space-y-1">
                            <p className="text-[10px] text-zinc-500">B1.0.0 Stable</p>
                            <p className="text-[10px] text-zinc-500">Windows 10 64-Bit</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className={cn(
                "flex-[1.5] bg-[#313338] flex flex-col min-w-0 relative transition-all duration-300",
                !showMobileContent ? "hidden md:flex" : "flex"
            )}>
                {/* Mobile Header */}
                <div className="md:hidden flex items-center h-12 px-4 border-b border-black shrink-0 bg-[#313338] sticky top-0 z-10">
                    <button onClick={() => setShowMobileContent(false)} className="flex items-center gap-2 text-zinc-400 hover:text-white">
                        <ChevronLeft className="w-6 h-6" />
                        <span className="font-bold text-sm uppercase">Settings</span>
                    </button>
                </div>

                <div className="flex-1 flex justify-start w-full overflow-y-auto custom-scrollbar">
                    <div className="w-full max-w-[740px] px-6 sm:px-10 pt-8 sm:pt-16 pb-20">
                        {activeTab === "My Account" && (
                            <MyAccountView
                                user={user}
                                onSave={handleSave}
                                setActiveTab={setActiveTab}
                            />
                        )}
                        {activeTab === "Profiles" && (
                            <ProfilesView
                                user={user}
                                displayName={displayName}
                                setDisplayName={setDisplayName}
                                bio={bio}
                                setBio={setBio}
                                pronouns={pronouns}
                                setPronouns={setPronouns}
                                avatar={avatar}
                                setAvatar={setAvatar}
                                onSave={handleSave}
                            />
                        )}
                        {activeTab === "Appearance" && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-white mb-4">Appearance</h2>
                                <p className="text-zinc-400">Appearance settings coming soon!</p>
                            </div>
                        )}
                        {(activeTab === "Privacy & Safety" || activeTab === "Voice & Video") && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-white mb-4">{activeTab}</h2>
                                <p className="text-zinc-400">Settings for {activeTab} are coming soon!</p>
                            </div>
                        )}
                    </div>

                    {/* Close Button Area */}
                    <div className="hidden md:flex flex-col items-center gap-1.5 shrink-0 pt-16 pr-10">
                        <button
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-zinc-500 text-zinc-400 hover:bg-zinc-700 hover:text-white transition group active:scale-95"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <span className="text-xs font-bold text-zinc-500 tracking-wider">ESC</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavItem({ label, active, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left px-2.5 py-1.5 rounded-[4px] text-sm transition group",
                active
                    ? "bg-[#404249] text-white font-medium shadow-sm"
                    : "text-zinc-400 hover:bg-[#35373c] hover:text-zinc-200"
            )}
        >
            {label}
        </button>
    );
}

interface ViewProps {
    userData: UserData;
    updateUserData: (data: Partial<UserData>) => void;
    setActiveTab?: (tab: Tab) => void;
}

function MyAccountView({ user, onSave, setActiveTab }: { user: any, onSave: (u: any) => void, setActiveTab: (t: any) => void }) {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState("");

    const handleEdit = (field: string, currentVal: string) => {
        setEditingField(field);
        setTempValue(currentVal || "");
    };

    const handleInternalSave = (field: string) => {
        onSave({ [field]: tempValue });
        setEditingField(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-xl font-bold text-white mb-2">My Account</h2>

            <div className="bg-[#1e1f22] rounded-lg overflow-hidden shadow-lg border border-zinc-800 lg:max-w-none max-w-full">
                <div className="h-24 bg-red-600 relative">
                    <div className="absolute -bottom-8 left-4 w-20 h-20 rounded-full border-[6px] border-[#1e1f22] overflow-hidden shadow-xl">
                        <img
                            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                            alt={user.username}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
                <div className="pt-12 pb-6 px-4 sm:px-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                    <div className="text-center sm:text-left">
                        <h3 className="text-xl font-bold text-white">{user.username} <span className="text-zinc-400 font-normal">#{user._id.slice(-4)}</span></h3>
                    </div>
                    <button
                        onClick={() => setActiveTab?.("Profiles")}
                        className="w-full sm:w-auto bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded hover:bg-blue-700 transition active:scale-95"
                    >
                        Edit User Profile
                    </button>
                </div>

                <div className="mx-4 sm:mx-6 mb-6 p-4 bg-[#2b2d31] rounded-lg border border-zinc-800 space-y-4 shadow-inner">
                    <InfoField
                        label="USERNAME"
                        value={user.username}
                        isEditing={editingField === "username"}
                        tempValue={tempValue}
                        setTempValue={setTempValue}
                        onEdit={() => handleEdit("username", user.username)}
                        onSave={() => handleInternalSave("username")}
                        onCancel={() => setEditingField(null)}
                    />
                    <InfoField
                        label="EMAIL"
                        value={user.email}
                        isEditing={editingField === "email"}
                        tempValue={tempValue}
                        setTempValue={setTempValue}
                        onEdit={() => handleEdit("email", user.email)}
                        onSave={() => handleInternalSave("email")}
                        onCancel={() => setEditingField(null)}
                    />
                </div>
            </div>
        </div>
    );
}

function InfoField({ label, value, isEditing, tempValue, setTempValue, onEdit, onSave, onCancel }: { label: string, value: string, isEditing: boolean, tempValue: string, setTempValue: (v: string) => void, onEdit: () => void, onSave: () => void, onCancel: () => void }) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 group min-h-[44px]">
            <div className="min-w-0 flex-1 w-full">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{label}</p>
                {isEditing ? (
                    <input
                        autoFocus
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="bg-[#1e1f22] text-zinc-200 text-sm w-full px-2 py-1 rounded outline-none border border-blue-500 mt-1"
                    />
                ) : (
                    <p className="text-sm text-zinc-200 truncate">{value}</p>
                )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                {isEditing ? (
                    <>
                        <button onClick={onSave} className="flex-1 sm:flex-none bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-blue-700 transition">Save</button>
                        <button onClick={onCancel} className="flex-1 sm:flex-none text-white text-xs font-medium px-3 py-1.5 hover:underline">Cancel</button>
                    </>
                ) : (
                    <button onClick={onEdit} className="w-full sm:w-auto bg-[#4e5058] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#6d6f78] transition opacity-90 hover:opacity-100 text-center">Edit</button>
                )}
            </div>
        </div>
    );
}

function ProfilesView({
    user,
    displayName,
    setDisplayName,
    bio,
    setBio,
    pronouns,
    setPronouns,
    avatar,
    setAvatar,
    onSave
}: {
    user: any,
    displayName: string,
    setDisplayName: (v: string) => void,
    bio: string,
    setBio: (v: string) => void,
    pronouns: string,
    setPronouns: (v: string) => void,
    avatar: string,
    setAvatar: (v: string) => void,
    onSave: (u: any) => void
}) {
    const [saving, setSaving] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInternalSave = async () => {
        setSaving(true);
        await onSave({ displayName, bio, pronouns, avatar });
        setSaving(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-xl font-bold text-white mb-2">Profiles</h2>
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                <div className="flex-1 space-y-6 order-2 lg:order-1">
                    {/* Avatar Section */}
                    <div className="space-y-4">
                        <label className="text-[12px] font-bold text-zinc-400 uppercase">User Avatar</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-800">
                                <img
                                    src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded hover:bg-red-700 transition"
                            >
                                Change Avatar
                            </button>
                            <button
                                onClick={() => setAvatar("")}
                                className="text-zinc-400 text-xs hover:underline"
                            >
                                Remove
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[12px] font-bold text-zinc-400 uppercase">Display Name</label>
                        <input
                            className="w-full bg-[#1e1f22] text-zinc-200 px-3 py-2 rounded outline-none border border-zinc-800 focus:border-blue-500 transition"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[12px] font-bold text-zinc-400 uppercase">Pronouns</label>
                        <input
                            className="w-full bg-[#1e1f22] text-zinc-200 px-3 py-2 rounded outline-none border border-zinc-800 focus:border-blue-500 transition"
                            value={pronouns}
                            onChange={(e) => setPronouns(e.target.value)}
                            placeholder="Enter pronouns"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[12px] font-bold text-zinc-400 uppercase">About Me</label>
                        <textarea
                            className="w-full bg-[#1e1f22] text-zinc-200 px-3 py-2 rounded outline-none border border-zinc-800 focus:border-blue-500 transition min-h-[100px] resize-none text-sm"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                        />
                    </div>
                    <button
                        onClick={handleInternalSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
                <div className="w-full lg:w-[300px] space-y-4 order-1 lg:order-2">
                    <label className="text-[12px] font-bold text-zinc-400 uppercase block">Preview</label>
                    <div className="bg-[#1e1f22] rounded-lg overflow-hidden border border-zinc-800 shadow-2xl">
                        <div className="h-20 bg-red-600" />
                        <div className="p-4 pt-12 relative">
                            <div className="absolute -top-10 left-4 w-16 h-16 rounded-full border-4 border-[#1e1f22] overflow-hidden bg-[#1e1f22]">
                                <img
                                    src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                    alt={user.username}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <h3 className="font-bold text-white text-lg">{displayName || user.username}</h3>
                            <p className="text-zinc-400 text-xs mb-3">{user.username}#{user._id.slice(-4)}</p>
                            {pronouns && <p className="text-zinc-300 text-xs font-medium mb-3">{pronouns}</p>}
                            <div className="h-[1px] bg-zinc-800 my-3" />
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">ABOUT ME</p>
                                <p className="text-xs text-white leading-relaxed">{bio || "I'm new here!"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AppearanceView({ userData, updateUserData }: ViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
            <div>
                <h2 className="text-xl font-bold text-white mb-2">Appearance</h2>
                <p className="text-sm text-zinc-400">Customize how Discord looks for you.</p>
            </div>

            <div className="space-y-4">
                <h3 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider">Theme</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ThemeSelection
                        title="Dark"
                        colorClass="bg-zinc-900"
                        active={userData.theme === "dark"}
                        onClick={() => updateUserData({ theme: "dark" })}
                    />
                    <ThemeSelection
                        title="Light"
                        colorClass="bg-white"
                        active={userData.theme === "light"}
                        onClick={() => updateUserData({ theme: "light" })}
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider">Message Display</h3>
                <div className="space-y-2 bg-[#1e1f22] p-4 rounded-lg border border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold shrink-0">
                            {userData.displayName[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{userData.displayName}</span>
                                <span className="text-[10px] text-zinc-400">Today at 12:00 PM</span>
                            </div>
                            <p className="text-[#dbdee1] text-sm leading-relaxed">This is a preview of how your messages will look. Looks great, right?</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ThemeSelection({ title, colorClass, active, onClick }: { title: string, colorClass: string, active: boolean, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "p-4 bg-zinc-800 rounded-md border-2 cursor-pointer transition-all",
                active ? "border-blue-500 bg-zinc-700" : "border-transparent hover:border-zinc-600 hover:bg-zinc-700/50"
            )}
        >
            <div className={cn("w-full h-12 rounded mb-2 flex items-center justify-center", colorClass)}>
                {active && <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"><Check className="w-4 h-4 text-white" /></div>}
            </div>
            <span className={cn("text-sm font-bold", active ? "text-white" : "text-zinc-400")}>{title}</span>
        </div>
    );
}
