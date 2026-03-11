import { useEffect, useState } from "react";
import { ThemeMode } from "@/hooks/useTheme";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 8 + Math.random() * 16,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 8,
  }));
}

export const ThemeParticles = ({ theme }: { theme: ThemeMode }) => {
  const [particles] = useState(() => generateParticles(12));

  if (theme === "morning") {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Sun */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-yellow-300 shadow-[0_0_60px_rgba(253,224,71,0.6)] animate-[pulse-glow_4s_ease-in-out_infinite]" />
        {/* Sun glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-radial from-yellow-200 to-transparent animate-pulse" />
            {/* Sun rays */}
            <div className="absolute -top-20 -right-20 w-60 h-60 pointer-events-none z-0">
            {[...Array(12)].map((_, i) => (
                <div
                key={i}
                className="absolute left-1/2 bottom-1/2 w-20 h-80 bg-yellow-300/80 origin-bottom rounded-full blur-2xl"
                style={{
                    transform: `rotate(${i * 30}deg) translateY(-200px)`,
                    filter: "blur(40px)"
                }}
                />
            ))}
            </div>
        {/* Clouds */}
        {particles.slice(0, 3).map((p) => (
        <div
            key={p.id}
            className="absolute text-4xl opacity-30 animate-[bird-fly_12s_linear_infinite]"
            style={{ top: `${5 + p.y * 0.2}%`, animationDelay: `${p.delay}s` }}
        >
            ☁️
        </div>
        ))}
      </div>
    );
  }

  if (theme === "night") {
    return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Crescent moon */}
    <div className="absolute top-12 left-3/4 w-40 h-40 rounded-full bg-slate-200 shadow-[0_0_40px_rgba(226,232,240,0.6)] animate-[pulse-glow_6s_ease-in-out_infinite] overflow-hidden">
      <div className="absolute top-0 left-10 w-40 h-40 rounded-full bg-slate-900" />
    </div>
      {/* Stars */}
      {particles.map((p) => (
        <div
        key={p.id}
        className="absolute rounded-full bg-white animate-[twinkle_3s_ease-in-out_infinite]"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${1 + Math.random() * 3}px`,
          height: `${1 + Math.random() * 3}px`,
          animationDelay: `${p.delay}s`,
        }}
        />
      ))}
    </div>
    );
  }

  // Romantic
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {/* Warm glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-[pulse-glow_5s_ease-in-out_infinite]">
            <div className="relative 
                w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 
                rotate-45 bg-pink-300 
                shadow-[0_0_60px_rgba(236,72,153,0.7)]
                animate-heart-float
            ">
                <div className="absolute -top-1/2 left-0 w-full h-full rounded-full bg-pink-300" />
                <div className="absolute top-0 -left-1/2 w-full h-full rounded-full bg-pink-300" />
            </div>
        </div>
        {/* Floating hearts */}
        {particles.map((p) => (
        <div
          key={p.id}
          className="absolute text-sm opacity-20 animate-[heart-float_8s_ease-in-out_infinite]"
          style={{
            left: `${p.x}%`,
            bottom: `-20px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.id % 2 === 0 ? "💕" : "💗"}
        </div>
      ))}
    </div>
  );
};
