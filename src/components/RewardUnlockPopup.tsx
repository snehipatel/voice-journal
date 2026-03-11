import { useState, useEffect } from "react";

interface RewardUnlockPopupProps {
  show: boolean;
  onClose: () => void;
  rewardTitle: string;
  rewardMessage: string;
  rewardEmoji?: string;
}

export const RewardUnlockPopup = ({
  show,
  onClose,
  rewardTitle,
  rewardMessage,
  rewardEmoji = "🎁",
}: RewardUnlockPopupProps) => {
  const [phase, setPhase] = useState<"shake" | "open" | "reveal">("shake");

  useEffect(() => {
    if (show) {
      setPhase("shake");
      const t1 = setTimeout(() => setPhase("open"), 1400);
      const t2 = setTimeout(() => {
        setPhase("reveal");
        // Fire confetti
        import("canvas-confetti").then(({ default: confetti }) => {
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ["#f97316", "#ec4899", "#8b5cf6", "#eab308"] });
        }).catch(() => {});
      }, 2200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {phase === "shake" && (
          <div className="animate-[gift-shake_0.4s_ease-in-out_infinite]">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-primary/40 flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.3)]">
              <span className="text-6xl">{rewardEmoji}</span>
            </div>
          </div>
        )}

        {phase === "open" && (
          <div className="animate-[gift-open_0.6s_ease-out_forwards]">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
              <span className="text-6xl animate-pulse">{rewardEmoji}</span>
            </div>
          </div>
        )}

        {phase === "reveal" && (
          <div className="animate-[message-pop_0.5s_ease-out] text-center space-y-5">
            <div className="relative">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center shadow-[0_0_60px_hsl(var(--primary)/0.4)]">
                <span className="text-5xl">{rewardEmoji}</span>
              </div>
              <div className="absolute -inset-4 rounded-3xl bg-primary/5 animate-pulse -z-10" />
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-primary font-medium">Reward Unlocked</p>
              <h3 className="font-display text-xl font-bold text-foreground">{rewardTitle}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {rewardMessage}
              </p>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
            >
              Open My Gift ✨
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
