"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { X, LogIn } from "lucide-react";

interface LoginPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginPopup({ isOpen, onClose }: LoginPopupProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const handleLogin = () => {
        router.push("/signin");
        onClose();
    };

    const handleSignup = () => {
        router.push("/signup");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Popup Content */}
            <div className="relative bg-[#1a1a1a] border border-red-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
                        <LogIn className="w-8 h-8 text-red-600" />
                    </div>
                </div>

                {/* Message */}
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-3">
                        Login Required
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        You need to be logged in to access the dashboard. 
                        Please sign in or create an account to continue.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleLogin}
                        className="w-full h-12 rounded-lg font-medium text-white
                                 bg-gradient-to-r from-red-600 to-pink-600
                                 hover:opacity-90 transition-all duration-200
                                 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Sign In
                    </button>
                    
                    <button
                        onClick={handleSignup}
                        className="w-full h-12 rounded-lg font-medium text-white
                                 bg-white/10 border border-white/20
                                 hover:bg-white/20 transition-all duration-200
                                 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Create Account
                    </button>
                </div>

                {/* Footer Text */}
                <div className="text-center mt-6">
                    <p className="text-xs text-gray-500">
                        Don't have an account? Click "Create Account" to get started
                    </p>
                </div>
            </div>
        </div>
    );
}
