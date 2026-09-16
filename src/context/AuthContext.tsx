"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
    _id: string;
    username: string;
    email: string;
    displayName: string;
    bio?: string;
    pronouns?: string;
    avatar?: string;
    token: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => Promise<boolean>;
    googleAuth: (email: string, username: string, avatar: string) => Promise<boolean>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Failed to parse stored user", error);
                localStorage.removeItem("user");
            }
        }
        setLoading(false);
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    const updateUser = async (updates: Partial<User>) => {
        if (!user) return false;

        try {
            const res = await fetch("http://127.0.0.1:5000/api/auth/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify(updates),
            });

            const data = await res.json();

            if (res.ok) {
                const updatedUser = { ...user, ...data };
                setUser(updatedUser);
                localStorage.setItem("user", JSON.stringify(updatedUser));
                return true;
            } else {
                // Handle database connection errors
                if (data.message?.includes("Database connection not available")) {
                    console.error("Profile update failed: Database connection issue");
                    throw new Error("Server is experiencing database connectivity issues. Please try again in a few minutes.");
                } else {
                    console.error("Profile update failed:", data.message);
                    throw new Error(data.message || "Profile update failed");
                }
            }
        } catch (error) {
            console.error("Profile update error:", error);
            throw error;
        }
    };

    const googleAuth = async (email: string, username: string, avatar: string) => {
        try {
            const res = await fetch("http://127.0.0.1:5000/api/auth/google", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, username, avatar }),
            });

            const data = await res.json();

            if (res.ok) {
                // Check if we're in fallback mode
                if (data.fallback) {
                    console.warn("Using fallback mode - database connection not available");
                    // Show a warning to the user
                    if (typeof window !== 'undefined') {
                        console.log("⚠️ Running in offline mode - Some features may not work properly");
                    }
                }
                login(data);
                return true;
            } else {
                // Provide more specific error messages for common issues
                if (data.message?.includes("Database connection not available") || 
                    data.message?.includes("Database connection timeout") ||
                    data.message?.includes("Database server error")) {
                    console.error("Google login failed: Database connection issue");
                    throw new Error("Server is experiencing database connectivity issues. Please try again in a few minutes.");
                } else {
                    console.error("Google login failed:", data.message);
                    throw new Error(data.message || "Google login failed");
                }
            }
        } catch (error) {
            console.error("Google login error:", error);
            throw error; // Re-throw to let the calling component handle the error
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, googleAuth, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
