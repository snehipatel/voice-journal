import { useState } from "react";
import { MYSTERY_REWARDS, getUnlockedRewards, getRandomNote } from "@/lib/rewards";
import { Gift, Lock, ChevronDown, ChevronUp } from "lucide-react";

interface MysteryRewardsProps {
  streak: number;
  totalDays: number;
  highDays: number;
}

export const MysteryRewards = ({ streak, totalDays, highDays }: MysteryRewardsProps) => {
  const [expanded, setExpanded] = useState(false);
  const [revealedId, setRevealedId] = useState<string | null>(null);

  const ctx = { streak, totalDays, highDays };
  const unlocked = getUnlockedRewards(ctx);
  const unlockedIds = new Set(unlocked.map((r) => r.id));

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-milestone" />
          <span className="text-sm font-semibold">Mystery Rewards</span>
          <span className="rounded-full bg-milestone/10 px-2 py-0.5 text-xs font-medium text-milestone">
            {unlocked.length} / {MYSTERY_REWARDS.length}
          </span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border/50 p-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {MYSTERY_REWARDS.map((reward) => {
              const isUnlocked = unlockedIds.has(reward.id);
              const progress = reward.getProgress(ctx);
              const isRevealed = revealedId === reward.id;

              return (
                <button
                  key={reward.id}
                  onClick={() => isUnlocked && setRevealedId(isRevealed ? null : reward.id)}
                  disabled={!isUnlocked}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-500 ${
                    isUnlocked
                      ? "border-milestone/40 bg-gradient-to-b from-milestone/10 to-milestone/5 hover:shadow-lg cursor-pointer"
                      : "border-border/30 bg-muted/10 opacity-60"
                  }`}
                >
                  {!isUnlocked && (
                    <Lock className="absolute top-2 right-2 h-3 w-3 text-muted-foreground opacity-40" />
                  )}
                  <span className={`text-2xl ${!isUnlocked ? "grayscale opacity-50" : ""}`}>
                    {isRevealed ? "💌" : reward.emoji}
                  </span>
                  <p className="text-xs font-semibold text-center leading-tight">
                    {isRevealed ? "Love Note" : reward.name}
                  </p>
                  {isRevealed && (
                    <p className="text-[10px] text-muted-foreground text-center animate-fade-in">
                      {getRandomNote()}
                    </p>
                  )}
                  {!isRevealed && (
                    <div className="w-full space-y-0.5">
                      <div className="h-1 w-full rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isUnlocked
                              ? "bg-milestone"
                              : progress >= 80
                              ? "bg-milestone/70 shadow-[0_0_6px_hsl(var(--milestone)/0.5)]"
                              : "bg-muted-foreground/30"
                          }`}
                          style={{ width: `${isUnlocked ? 100 : progress}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground text-center">
                        {isUnlocked ? "Tap to reveal!" : `${progress}%`}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
