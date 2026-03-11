import { useState, useEffect } from "react";

interface SurpriseRewardProps {
  show: boolean;
  onClose: () => void;
  message?: string;
}

const SURPRISE_MESSAGES = [
  "You completed everything today! You're absolutely incredible! 🌟",
  "All tasks done! You're a productivity superstar! ⭐",
  "100% completion! Your dedication inspires! 💎",
  "Perfect day! Keep shining bright! ✨",
  "You crushed it today! So proud of you! 🏆",
  "Every task complete! You're building something amazing! 💪",
];

export const SurpriseReward = ({ show, onClose, message }: SurpriseRewardProps) => {
  const [phase, setPhase] = useState<"box" | "open" | "message">("box");

  useEffect(() => {
    if (show) {
      setPhase("box");
      const t1 = setTimeout(() => setPhase("open"), 1200);
      const t2 = setTimeout(() => setPhase("message"), 2000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [show]);

  if (!show) return null;

  const displayMsg = message || SURPRISE_MESSAGES[Math.floor(Math.random() * SURPRISE_MESSAGES.length)];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center gap-4 p-8 max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gift Box */}
        <div className={`text-7xl transition-all duration-700 ${
          phase === "box" ? "animate-[gift-shake_0.5s_ease-in-out_infinite]" :
          phase === "open" ? "animate-[gift-open_0.5s_ease-out_forwards]" : "hidden"
        }`}>
          🎁
        </div>

        {/* Opened content */}
        {phase === "message" && (
          <div className="animate-[message-pop_0.5s_ease-out] text-center space-y-4">
            <div className="text-6xl animate-[scale-bounce_0.5s_ease-out]">
              🎉
            </div>
            <div className="flex gap-2 justify-center text-3xl">
              {["✨", "💫", "⭐", "🌟", "💖"].map((e, i) => (
                <span
                  key={i}
                  className="animate-[sparkle-pop_0.4s_ease-out_forwards]"
                  style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
                >
                  {e}
                </span>
              ))}
            </div>
            <p className="text-lg font-display font-bold text-foreground">
              🎊 Surprise Reward! 🎊
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {displayMsg}
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Yay! 🎉
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
