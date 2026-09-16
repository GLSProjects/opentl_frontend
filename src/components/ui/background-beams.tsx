"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
    return (
        <div
            className={cn(
                "absolute top-0 left-0 w-full h-full bg-gradient-to-b from-neutral-950 to-neutral-800 -z-10 overflow-hidden",
                className
            )}
        >
            <div className="absolute inset-0 bg-neutral-950 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />

            {/* Spider-Man Themed Beams */}
            <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-red-500/0 via-red-500/50 to-red-500/0 animate-beam-1" />
            <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-blue-500/0 via-blue-500/50 to-blue-500/0 animate-beam-2 delay-1000" />
            <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-red-500/0 via-red-500/50 to-red-500/0 animate-beam-3 delay-2000" />

            {/* Web Pattern Overlay */}
            <div className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)",
                    backgroundSize: "40px 40px"
                }}
            />

            <style jsx>{`
        @keyframes beam {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .animate-beam-1 { animation: beam 7s infinite linear; }
        .animate-beam-2 { animation: beam 5s infinite linear; }
        .animate-beam-3 { animation: beam 6s infinite linear; }
      `}</style>
        </div>
    );
};
