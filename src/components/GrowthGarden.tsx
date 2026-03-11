import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STAGES, getStage, getStageIndex, getStageLabel} from "./garden/types";
import { TreeVideo } from "./garden/TreeVideo";

interface GrowthGardenProps {
  streak: number;
  missedRecently: boolean;
  streakSaverActive?: boolean;
  streakSaversRemaining?: number;
}

export const GrowthGarden = ({ streak, missedRecently, streakSaverActive, streakSaversRemaining }: GrowthGardenProps) => {
  const stage = useMemo(() => getStage(streak), [streak]);
  const stageIndex = getStageIndex(stage);

  const nextStage = STAGES[stageIndex + 1];
  const currentMin = STAGES[stageIndex].minStreak;
  const nextMin = nextStage?.minStreak ?? currentMin;
  const progressToNext = nextStage
    ? Math.round(((streak - currentMin) / (nextMin - currentMin)) * 100)
    : 100;

  const skyGradient = "from-[hsl(200,60%,80%)] to-[hsl(200,40%,92%)]";
  const groundColor = "from-[hsl(30,40%,35%)] to-[hsl(100,30%,45%)]";

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Growth Garden</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">{getStageLabel(stage)}</p>
        </div>
        {streakSaversRemaining !== undefined && (
          <p className="text-[10px] text-muted-foreground mt-0.5">🛡️ {streakSaversRemaining} streak saver{streakSaversRemaining !== 1 ? "s" : ""}</p>
        )}
      </div>

      {/* Garden scene */}  
      <div className="relative w-full h-[260px] overflow-hidden rounded-xl">

        {/* Sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(200,60%,80%)] to-[hsl(200,40%,92%)]" />

        {/* Ground */}
        <div className="absolute bottom-0 w-full h-10 bg-gradient-to-t from-[hsl(30,40%,35%)] to-[hsl(100,30%,45%)]" />

        {/* Tree video only */}
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <TreeVideo stage={stage} missedRecently={missedRecently} stageIndex={stageIndex} />
        </div>

      </div>

      {/* Progress bar */}
      <div className="px-4 pb-4 pt-2 space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{streak} day streak</span>
          {nextStage && <span>Next: {nextStage.label} ({nextStage.minStreak}d)</span>}
          {!nextStage && <span className="text-primary">🌟 Max stage reached!</span>}
        </div>
        <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              stage === "golden-tree"
                ? "bg-gradient-to-r from-[hsl(45,90%,50%)] to-[hsl(35,85%,55%)]"
                : "bg-accent"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progressToNext}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              boxShadow: progressToNext >= 80 ? "0 0 8px hsl(var(--accent) / 0.5)" : undefined,
            }}
          />
        </div>
      </div>
    </div>
  );
};
