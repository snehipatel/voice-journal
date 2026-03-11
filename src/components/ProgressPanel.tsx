import { useState, useEffect, useCallback, useRef } from "react";
import { Flame, Target, TrendingUp, CalendarCheck, Award, ChevronDown, ChevronUp, Lock, Unlock } from "lucide-react";
import { ALL_BADGES, BADGE_CATEGORY_LABELS, BadgeContext, BadgeDefinition } from "@/lib/badges";

interface ProgressPanelProps {
  streak: number;
  totalDays: number;
  highDays: number;
  mediumDays: number;
  achievements: string[];
  weeklySummary: { total: number; high: number; medium: number; low: number };
  badgeCtx: BadgeContext;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressRing({ progress, size = 80 }: { progress: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="hsl(var(--primary))" strokeWidth={8}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const end = value;
    const duration = 800;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    prev.current = end;
  }, [value]);
  return <>{display}</>;
}

interface BadgeProgressBarProps {
  badge: BadgeDefinition;
  progress: number;
  unlocked: boolean;
  justUnlocked: boolean;
}

function BadgeCard({ badge, progress, unlocked, justUnlocked }: BadgeProgressBarProps) {
  const isNearComplete = progress >= 80 && !unlocked;
  return (
    <div
      className={`relative flex flex-col gap-2 rounded-xl border p-3 transition-all duration-500 ${
        justUnlocked
          ? "border-yellow-400 bg-gradient-to-b from-yellow-400/20 to-yellow-400/5 animate-scale-bounce"
          : unlocked
          ? "border-primary/30 bg-gradient-to-b from-primary/10 to-primary/5"
          : "border-border/40 bg-muted/20 opacity-70"
      }`}
    >
      {/* Lock / unlock icon */}
      <div className="absolute top-2 right-2 opacity-40">
        {unlocked ? (
          <Unlock className="h-3 w-3 text-primary" />
        ) : (
          <Lock className="h-3 w-3 text-muted-foreground" />
        )}
      </div>

      {/* Badge emoji */}
      <div className={`text-2xl text-center ${!unlocked ? "grayscale opacity-50" : ""}`}>
        {badge.emoji}
      </div>

      {/* Name & description */}
      <div className="text-center">
        <p className={`text-xs font-semibold leading-tight ${unlocked ? "" : "text-muted-foreground"}`}>
          {badge.name}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{badge.description}</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-0.5">
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>{unlocked ? "Unlocked!" : `${progress}%`}</span>
        </div>
        <div className="h-1 w-full rounded-full bg-muted/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              unlocked
                ? "bg-primary"
                : isNearComplete
                ? "bg-yellow-500 shadow-[0_0_6px_hsl(var(--primary)/0.6)]"
                : "bg-muted-foreground/40"
            }`}
            style={{ width: `${unlocked ? 100 : progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export const ProgressPanel = ({
  streak,
  totalDays,
  highDays,
  weeklySummary,
  achievements,
  badgeCtx,
}: ProgressPanelProps) => {
  const yearProgress = Math.round((totalDays / 365) * 100);
  const [showBadges, setShowBadges] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [justUnlockedIds, setJustUnlockedIds] = useState<string[]>([]);
  const prevAchievements = useRef<string[]>([]);

  // Detect newly unlocked badges to animate them
  useEffect(() => {
    const newOnes = achievements.filter((id) => !prevAchievements.current.includes(id));
    if (newOnes.length > 0) {
      setJustUnlockedIds(newOnes);
      const timer = setTimeout(() => setJustUnlockedIds([]), 3000);
      return () => clearTimeout(timer);
    }
    prevAchievements.current = achievements;
  }, [achievements]);

  const categories = ["all", ...Object.keys(BADGE_CATEGORY_LABELS)];

  const filteredBadges = ALL_BADGES.filter(
    (b) => activeCategory === "all" || b.category === activeCategory
  );

  const unlockedCount = ALL_BADGES.filter((b) => achievements.includes(b.id)).length;

  return (
    <div className="space-y-3">
      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Streak */}
        <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Flame className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold leading-none">
              <AnimatedNumber value={streak} />
              <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
            </p>
          </div>
        </div>

        {/* Year Progress */}
        <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
          <div className="relative shrink-0">
            <ProgressRing progress={yearProgress} size={60} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold">{yearProgress}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Year Progress</p>
            <p className="text-2xl font-bold leading-none">
              <AnimatedNumber value={totalDays} />
              <span className="text-sm font-normal text-muted-foreground ml-1">/ 365</span>
            </p>
          </div>
        </div>

        {/* High Days */}
        <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-productivity-high/10 shrink-0">
            <TrendingUp className="h-5 w-5 text-productivity-high" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">High Days</p>
            <p className="text-2xl font-bold leading-none">
              <AnimatedNumber value={highDays} />
            </p>
          </div>
        </div>

        {/* Weekly */}
        <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 shrink-0">
            <CalendarCheck className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">This Week</p>
            <p className="text-2xl font-bold leading-none">
              <AnimatedNumber value={weeklySummary.total} />
              <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {weeklySummary.high}🟢 {weeklySummary.medium}🟡 {weeklySummary.low}🔴
            </p>
          </div>
        </div>
      </div>

      {/* ── Badge Dashboard ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setShowBadges((v) => !v)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-milestone" />
            <span className="text-sm font-semibold">Badge Collection</span>
          </div>
          {showBadges ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {/* Overall progress bar */}
        <div className="px-4 pb-2">
          <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
            <div
              className={`h-full rounded-full bg-primary transition-all duration-1000 ${
                unlockedCount / ALL_BADGES.length >= 0.8 ? "shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : ""
              }`}
              style={{ width: `${Math.round((unlockedCount / ALL_BADGES.length) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {Math.round((unlockedCount / ALL_BADGES.length) * 100)}% of badges unlocked
          </p>
        </div>

        {showBadges && (
          <div className="border-t border-border/50 p-4 space-y-4 animate-fade-in">
            {/* Category filters */}
            <div className="flex gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat === "all" ? "✨ All" : BADGE_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Badge grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {filteredBadges.map((badge) => {
                const unlocked = achievements.includes(badge.id);
                const progress = badge.getProgress(badgeCtx);
                const justUnlocked = justUnlockedIds.includes(badge.id);
                return (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    progress={progress}
                    unlocked={unlocked}
                    justUnlocked={justUnlocked}
                  />
                );
              })}
            </div>

            {filteredBadges.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">No badges in this category yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
