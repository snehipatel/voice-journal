import { motion } from "framer-motion";
import type { Weather } from "./types";

export function WeatherEffects({ weather }: { weather: Weather }) {
  if (weather === "sunny") {
    return (
      <>
        {[0, 1].map((i) => (
          <motion.div key={`bf-${i}`} className="absolute text-sm pointer-events-none"
            style={{ top: `${20 + i * 15}%`, left: "-5%" }}
            animate={{ x: ["0%", "110%"], y: [0, -15, 5, -10, 0] }}
            transition={{ repeat: Infinity, duration: 12 + i * 4, delay: i * 3, ease: "linear" }}>
            🦋
          </motion.div>
        ))}
      </>
    );
  }

  if (weather === "drizzle") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div key={`dr-${i}`}
            className="absolute w-0.5 h-2 bg-[hsl(200,50%,70%/0.4)] rounded-full"
            style={{ left: `${5 + i * 6.5}%` }}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: [0, 200], opacity: [0, 0.6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.12, ease: "linear" }} />
        ))}
      </div>
    );
  }

  if (weather === "heavy-rain") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div key={`hr-${i}`}
            className="absolute w-0.5 h-3 bg-[hsl(200,55%,65%/0.5)] rounded-full"
            style={{ left: `${2 + i * 4}%` }}
            initial={{ y: -15, opacity: 0 }}
            animate={{ y: [0, 220], opacity: [0, 0.7, 0] }}
            transition={{ repeat: Infinity, duration: 1.0, delay: i * 0.04, ease: "linear" }} />
        ))}
      </div>
    );
  }

  if (weather === "snow") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div key={`sn-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-white/70"
            style={{ left: `${3 + i * 5.5}%` }}
            initial={{ y: -5 }}
            animate={{ y: [0, 200], x: [0, Math.sin(i) * 15, 0] }}
            transition={{ repeat: Infinity, duration: 4 + i * 0.3, delay: i * 0.2, ease: "linear" }} />
        ))}
      </div>
    );
  }

  return null;
}

export function Clouds({ weather }: { weather: Weather }) {
  const opacity = weather === "heavy-rain" ? 0.7 : weather === "drizzle" ? 0.5 : weather === "snow" ? 0.45 : 0.3;
  const color = weather === "heavy-rain" ? "hsl(220,10%,55%)" : "white";
  return (
    <>
      <motion.div className="absolute top-3 left-0 pointer-events-none"
        animate={{ x: [-80, 300] }}
        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}>
        <svg width="70" height="28" viewBox="0 0 70 28" style={{ opacity }}>
          <ellipse cx="22" cy="18" rx="20" ry="9" fill={color} />
          <ellipse cx="40" cy="13" rx="16" ry="11" fill={color} />
          <ellipse cx="55" cy="18" rx="14" ry="8" fill={color} />
        </svg>
      </motion.div>
      <motion.div className="absolute top-8 left-1/3 pointer-events-none"
        animate={{ x: [-60, 250] }}
        transition={{ repeat: Infinity, duration: 30, ease: "linear", delay: 5 }}>
        <svg width="50" height="22" viewBox="0 0 50 22" style={{ opacity: opacity * 0.7 }}>
          <ellipse cx="16" cy="14" rx="15" ry="7" fill={color} />
          <ellipse cx="32" cy="11" rx="13" ry="9" fill={color} />
        </svg>
      </motion.div>
    </>
  );
}

export function Fireflies({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={`ff-${i}`}
          className="absolute w-1 h-1 rounded-full bg-[hsl(55,90%,65%)] shadow-[0_0_6px_2px_hsl(55,90%,65%/0.6)] pointer-events-none"
          style={{ left: `${15 + i * 18}%`, top: `${25 + (i % 3) * 20}%` }}
          animate={{
            x: [0, 10 + i * 3, -8, 5, 0],
            y: [0, -8, 5, -12, 0],
            opacity: [0.3, 0.9, 0.4, 1, 0.3],
          }}
          transition={{ repeat: Infinity, duration: 4 + i * 0.7, ease: "easeInOut" }} />
      ))}
    </>
  );
}

export function StreakSaverShield() {
  return (
    <motion.div
      className="absolute inset-0 rounded-xl pointer-events-none"
      style={{
        background: "radial-gradient(ellipse at center bottom, hsl(200, 80%, 60%, 0.15) 0%, transparent 70%)",
        border: "2px solid hsl(200, 70%, 60%, 0.2)",
        borderRadius: "0.75rem",
      }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
    >
      <motion.div className="absolute top-2 right-2 text-lg"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
        🛡️
      </motion.div>
    </motion.div>
  );
}
