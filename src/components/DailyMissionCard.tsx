import { DailyMission, MissionContext } from "@/lib/missions";
import { Target } from "lucide-react";

interface DailyMissionCardProps {
  mission: DailyMission;
  missionCtx: MissionContext;
}

export const DailyMissionCard = ({ mission, missionCtx }: DailyMissionCardProps) => {
  const progress = mission.getProgress(missionCtx);
  const completed = mission.requirement(missionCtx);

  return (
    <div className={`rounded-xl border p-4 transition-all duration-500 ${
      completed
        ? "border-accent bg-gradient-to-r from-accent/10 to-accent/5"
        : "border-border/50 bg-card"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 text-lg ${
          completed ? "bg-accent/20" : "bg-muted/40"
        }`}>
          {completed ? "✅" : mission.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Today's Mission</p>
          </div>
          <p className="font-semibold text-sm">{mission.title}</p>
          <p className="text-xs text-muted-foreground">{mission.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-xs font-bold ${completed ? "text-accent" : "text-muted-foreground"}`}>
            {progress}%
          </p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-muted/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            completed
              ? "bg-accent"
              : progress >= 80
              ? "bg-accent/80 shadow-[0_0_6px_hsl(var(--accent)/0.5)]"
              : "bg-muted-foreground/30"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
