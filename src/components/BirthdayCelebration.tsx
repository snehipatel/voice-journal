import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface BirthdayCelebrationProps {
  show: boolean;
  onClose: () => void;
}

const BALLOON_COLORS = [
  "hsl(350, 80%, 60%)",
  "hsl(210, 80%, 60%)",
  "hsl(45, 90%, 55%)",
  "hsl(140, 60%, 50%)",
  "hsl(280, 70%, 60%)",
  "hsl(20, 85%, 55%)",
];

function Balloon({ delay, x, color }: { delay: number; x: number; color: string }) {
  return (
    <motion.div
      className="absolute bottom-0 pointer-events-none"
      style={{ left: `${x}%` }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: -700, opacity: [0, 1, 1, 0.8, 0] }}
      transition={{ duration: 6 + Math.random() * 3, delay, ease: "easeOut", repeat: Infinity, repeatDelay: 2 }}
    >
      <div
        className="w-8 h-10 rounded-full relative"
        style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}40` }}
      >
        <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-px h-4 bg-muted-foreground/40" />
      </div>
    </motion.div>
  );
}

function Sparkle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute text-lg pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 180, 360] }}
      transition={{ duration: 2, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      ✨
    </motion.div>
  );
}

export function BirthdayCelebration({ show, onClose }: BirthdayCelebrationProps) {
  useEffect(() => {
    if (!show) return;

    // Play birthday sound
    const audio = new Audio("/sounds/happy-birthday.mp3");
    audio.volume = 0.6;
    audio.play().catch(() => {});

    // Fire confetti
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({ particleCount: 150, spread: 120, origin: { y: 0.6 }, colors: ["#f97316", "#ec4899", "#eab308", "#22c55e", "#a855f7", "#3b82f6"] });
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.4, x: 0.3 } });
      }, 800);
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.4, x: 0.7 } });
      }, 1600);
    }).catch(() => {});

    return () => {
      audio.pause();
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

          {/* Balloons */}
          {Array.from({ length: 12 }).map((_, i) => (
            <Balloon
              key={i}
              delay={i * 0.4}
              x={5 + (i * 8)}
              color={BALLOON_COLORS[i % BALLOON_COLORS.length]}
            />
          ))}

          {/* Sparkles */}
          {Array.from({ length: 10 }).map((_, i) => (
            <Sparkle key={`sp-${i}`} delay={i * 0.3} x={10 + i * 8} y={15 + (i % 3) * 25} />
          ))}

          {/* Card */}
          <motion.div
            className="relative z-10 text-center p-8 rounded-2xl border border-primary/30 bg-card shadow-2xl max-w-sm mx-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15, delay: 0.3 }}
          >
            <motion.div
              className="text-6xl mb-4"
              animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              🎂
            </motion.div>

            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              🎉 Happy Birthday! 🎉
            </h2>

            <p className="text-muted-foreground mb-6">
              May your streak grow like this magical tree 🌳💛
            </p>

            <Button onClick={onClose} size="lg" className="w-full">
              Continue 🎈
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
