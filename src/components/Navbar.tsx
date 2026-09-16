"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UserSettingsModal from "./UserSettingsModal";

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isHome = pathname === "/";

    return (
        <>
            <nav
                className={cn(
                    "w-full z-[100] transition-all duration-300 px-6 py-4",
                    isHome
                        ? "fixed top-0 left-0"
                        : "sticky top-0 bg-black border-b border-white/10",
                    isHome &&
                    (isScrolled
                        ? "bg-black/80 backdrop-blur-md border-b border-white/10"
                        : "bg-transparent")
                )}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">

                    {/* Logo - LEFT */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center transition-transform group-hover:rotate-12 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                            <svg
                                viewBox="0 0 24 24"
                                className="w-6 h-6 fill-white"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M12,2C15.84,2 19,5.16 19,9C19,10.61 18.45,12.09 17.5,13.27C19.06,14.84 20,17 20,19.4V20.4C20,21.28 19.28,22 18.4,22H5.6C4.72,22 4,21.28 4,20.4V19.4C4,17 4.94,14.84 6.5,13.27C5.55,12.09 5,10.61 5,9C5,5.16 8.16,2 12,2Z" />
                            </svg>
                        </div>
                        <span className="spidey-font text-2xl text-white tracking-widest uppercase ml-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                            OPENTL
                        </span>
                    </Link>

                    {/* Desktop Nav - CENTER */}
                    <div className="hidden md:flex items-center gap-10 absolute left-1/2 transform -translate-x-1/2">
                        <NavLink href="/">Home</NavLink>
                        <NavLink href="/dashboard">Dashboard</NavLink>
                        <NavLink href="/about">About</NavLink>
                        <NavLink href="/chatbot">Chatbot</NavLink>
                        <NavLink href="/streaming-meetings">Streaming/Meetings</NavLink>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        {/* Auth Section - Desktop */}
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="w-10 h-10 rounded-full border-2 border-red-600 p-0.5 overflow-hidden transition-all hover:scale-110 hover:shadow-[0_0_15px_rgba(220,38,38,0.6)]"
                                >
                                    <img
                                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                        alt={user.username}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-red-600/30 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="px-4 py-3 border-b border-white/10">
                                            <p className="text-xs text-gray-400 capitalize">Signed in as</p>
                                            <p className="text-sm font-bold text-white truncate">{user.displayName || user.username}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSettingsOpen(true);
                                                setShowUserMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-white/10 flex items-center gap-2 transition-colors"
                                        >
                                            <Settings size={16} />
                                            Settings
                                        </button>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setShowUserMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-600/10 flex items-center gap-2 transition-colors"
                                        >
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/signin"
                                className="hidden md:block px-6 py-2 bg-red-600 text-white font-bold rounded-full hover:bg-neutral-200 transition-colors text-sm shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                            >
                                Login
                            </Link>
                        )}

                        {/* Mobile Toggle */}
                        <button
                            className="md:hidden text-white"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div
                className={cn(
                    "fixed inset-0 bg-zinc-950 z-[90] flex flex-col items-center justify-center gap-8 text-xl font-bold transition-all duration-300 md:hidden pt-4",
                    mobileMenuOpen
                        ? "opacity-100 visible"
                        : "opacity-0 invisible"
                )}
            >
                <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)}>
                    Home
                </MobileNavLink>
                <MobileNavLink href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                </MobileNavLink>
                <MobileNavLink href="/community" onClick={() => setMobileMenuOpen(false)}>
                    Community
                </MobileNavLink>
                <MobileNavLink href="/webhub" onClick={() => setMobileMenuOpen(false)}>
                    Web Hub
                </MobileNavLink>
                <MobileNavLink href="/streaming-meetings" onClick={() => setMobileMenuOpen(false)}>
                    Streaming & Meetings
                </MobileNavLink>

                {user ? (
                    <div className="flex flex-col gap-4 mt-6">
                        <button
                            onClick={() => {
                                setSettingsOpen(true);
                                setMobileMenuOpen(false);
                            }}
                            className="px-8 py-3 bg-zinc-800 text-white rounded-full flex items-center gap-2"
                        >
                            <Settings size={20} />
                            Settings
                        </button>
                        <button
                            onClick={() => {
                                logout();
                                setMobileMenuOpen(false);
                            }}
                            className="px-8 py-3 bg-red-600 text-white rounded-full flex items-center gap-2"
                        >
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                ) : (
                    <Link
                        href="/signin" // Fixed from /signin for mobile consistency if desired, though original had /signin
                        onClick={() => setMobileMenuOpen(false)}
                        className="mt-6 px-8 py-3 bg-white text-black rounded-full"
                    >
                        Login
                    </Link>
                )}
            </div>

            <UserSettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
        </>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={cn(
                "font-bold text-sm transition-colors relative group",
                isActive ? "text-red-600" : "text-white hover:text-red-500"
            )}
        >
            {children}
            <span
                className={cn(
                    "absolute -bottom-1 left-0 h-0.5 bg-red-600 transition-all",
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                )}
            />
        </Link>
    );
}


function MobileNavLink({
    href,
    onClick,
    children
}: {
    href: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "spidey-font text-sm transition-colors",
                isActive ? "text-red-600" : "text-white hover:text-red-600"
            )}
        >
            {children}
        </Link>
    );
}
