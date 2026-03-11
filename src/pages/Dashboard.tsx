import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { CalendarGrid } from "@/components/CalendarGrid";
import { MobileCalendar } from "@/components/MobileCalendar";
import { TaskEntryModal } from "@/components/TaskEntryModal";
import { ProgressPanel } from "@/components/ProgressPanel";
import { VoiceClipManager } from "@/components/VoiceClipManager";
import { GrowthGarden } from "@/components/GrowthGarden";
import { DailyMissionCard } from "@/components/DailyMissionCard";
import { MysteryRewards } from "@/components/MysteryRewards";
import { SakhiCompanion } from "@/components/SakhiCompanion";
import { MemoryTimeline } from "@/components/MemoryTimeline";
import { ThemeParticles } from "@/components/ThemeParticles";
import { RewardUnlockPopup } from "@/components/RewardUnlockPopup";
import { BirthdayCelebration } from "@/components/BirthdayCelebration";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DailyEntry,
  VoiceClip,
  Achievement,
  fetchEntries,
  upsertEntry,
  fetchVoiceClips,
  fetchAchievements,
  unlockAchievement,
  pickRandomVoiceClip,
  calculateStreak,
  getProductivitySummary,
  getWeeklySummary,
  getProductivityLevel,
  getDayOfYear,
  isMilestoneDay,
} from "@/lib/journal";
import { ALL_BADGES, buildBadgeContext, getNewlyUnlockedBadges, toLocalDateStr } from "@/lib/badges";
import { getTodayMission, MissionContext } from "@/lib/missions";
import { MYSTERY_REWARDS, getUnlockedRewards, getRandomNote } from "@/lib/rewards";
import { useTheme, ThemeMode } from "@/hooks/useTheme";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileSettings } from "@/components/ProfileSettings";
import { Button } from "@/components/ui/button";
import { LogOut, Sun, Moon, Heart, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

async function fireConfetti() {
  try {
    const confetti = (await import("canvas-confetti")).default;
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#f97316", "#22c55e", "#eab308", "#a855f7"] });
  } catch {}
}

const THEME_ICONS: Record<ThemeMode, typeof Sun> = {
  morning: Sun,
  night: Moon,
  romantic: Heart,
};

const THEME_LABELS: Record<ThemeMode, string> = {
  morning: "Morning",
  night: "Night",
  romantic: "Romantic",
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [voiceClips, setVoiceClips] = useState<VoiceClip[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [lastVoicePlayed, setLastVoicePlayed] = useState<string | null>(null);
  const lastPlayedClipIdRef = useRef<string | null>(null);

  // Birthday popup state
  const [showBirthday, setShowBirthday] = useState(false);

  // Reward popup state
  const [rewardPopup, setRewardPopup] = useState<{ show: boolean; title: string; message: string; emoji: string }>({
    show: false, title: "", message: "", emoji: "🎁",
  });

  const year = new Date().getFullYear();
  const today = new Date();
  const todayStr = toLocalDateStr(today);

  const loadAll = useCallback(async () => {
    if (!user) return;
    try {
      const [entriesData, clipsData, achievementsData] = await Promise.all([
        fetchEntries(user.id, year),
        fetchVoiceClips(user.id),
        fetchAchievements(user.id),
      ]);
      setEntries(entriesData);
      setVoiceClips(clipsData);
      setAchievements(achievementsData);
    } catch {
      toast({ variant: "destructive", title: "Failed to load data" });
    }
  }, [user, year, toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Birthday celebration - first time only for specific users
  useEffect(() => {
    const BIRTHDAY_USERS = ["nandish4647@gmail.com", "snehipatel2612@gmail.com"];
    const email = user?.email;
    const hasSeen = localStorage.getItem("birthday-celebrated");
    if (email && BIRTHDAY_USERS.includes(email) && !hasSeen) {
      setShowBirthday(true);
      localStorage.setItem("birthday-celebrated", "true");
    }
  }, [user?.email]);

  useEffect(() => {
    if (user) {
      setSelectedDate(today);
      setModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  const selectedEntry = selectedDate
    ? entries.find((e) => e.entry_date === toLocalDateStr(selectedDate)) ?? null
    : null;

  // Check for newly unlocked mystery rewards
  const checkRewardUnlocks = (streak: number, totalDays: number, highDays: number, prevUnlocked: Set<string>) => {
    const ctx = { streak, totalDays, highDays };
    const nowUnlocked = getUnlockedRewards(ctx);
    const newReward = nowUnlocked.find((r) => !prevUnlocked.has(r.id));
    if (newReward) {
      setTimeout(() => {
        setRewardPopup({
          show: true,
          title: newReward.name,
          message: newReward.type === "note" ? getRandomNote() : newReward.description,
          emoji: newReward.emoji,
        });
      }, 2000);
    }
  };

  const handleSave = async (tasks: { description: string }[], mood: string, reflection: string) => {
    if (!user || !selectedDate) return;
    const dateStr = toLocalDateStr(selectedDate);
    const level = getProductivityLevel(tasks.length);
    const savedAt = new Date();

    // Track previous reward state
    const prevStreak = calculateStreak(entries);
    const prevSummary = getProductivitySummary(entries);
    const prevUnlocked = new Set(getUnlockedRewards({ streak: prevStreak, totalDays: prevSummary.completedDays, highDays: prevSummary.high }).map((r) => r.id));

    try {
      await upsertEntry(user.id, dateStr, tasks, level, mood, reflection);
      await loadAll();

      // 🎊 Always fire confetti on save
      fireConfetti();

      const freshEntries = await fetchEntries(user.id, year);
      const freshAchievements = await fetchAchievements(user.id);
      const streak = calculateStreak(freshEntries);
      const unlockedIds = freshAchievements.map((a) => a.badge_id);

      const ctx = buildBadgeContext(freshEntries, streak, unlockedIds, savedAt);
      const newBadges = getNewlyUnlockedBadges(ctx);

      for (const badge of newBadges) {
        await unlockAchievement(user.id, badge.id);
        toast({
          title: `🏆 Badge Unlocked: ${badge.name}!`,
          description: badge.description,
        });
      }

      if (newBadges.length > 0) {
        fireConfetti();
        await loadAll();
      }

      // Check mystery reward unlocks
      const freshSummary = getProductivitySummary(freshEntries);
      checkRewardUnlocks(streak, freshSummary.completedDays, freshSummary.high, prevUnlocked);

      // Voice clip
      if (voiceClips.length > 0) {
        setVoiceLoading(true);
        try {
          const result = await pickRandomVoiceClip(voiceClips, level, lastPlayedClipIdRef.current);
          if (result) {
            lastPlayedClipIdRef.current = result.clipId;
            setLastVoicePlayed(level);
            const audio = new Audio(result.url);
            audio.play().catch(() => {});
            audio.onended = () => setVoiceLoading(false);
            audio.onerror = () => setVoiceLoading(false);
          } else {
            setVoiceLoading(false);
          }
        } catch {
          setVoiceLoading(false);
        }
      }

      const dayOfYear = getDayOfYear(selectedDate);
      const milestone = isMilestoneDay(dayOfYear);
      if (milestone) {
        fireConfetti();
        toast({ title: `🏆 Milestone! Day ${dayOfYear}`, description: "You're incredible. Keep going!" });
      } else if (newBadges.length === 0) {
        toast({ title: "Entry saved! ✨" });
      }

      setModalOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Failed to save entry" });
    }
  };

  const streak = calculateStreak(entries);
  const summary = getProductivitySummary(entries);
  const weeklySummary = getWeeklySummary(entries);
  const achievementIds = achievements.map((a) => a.badge_id);
  const todayEntry = entries.find((e) => e.entry_date === todayStr);

  const badgeCtx = buildBadgeContext(entries, streak, achievementIds);

  const recentHighDays = weeklySummary.high;
  const todayMission = getTodayMission(streak, recentHighDays);
  const missionCtx: MissionContext = {
    todayTaskCount: todayEntry ? (todayEntry.tasks as any[]).length : 0,
    todayMood: todayEntry?.mood ?? null,
    todayReflection: todayEntry?.reflection ?? null,
    streak,
    recentHighDays,
  };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const missedRecently = !entries.some((e) => e.entry_date === toLocalDateStr(yesterday)) && streak > 0;

  const ThemeIcon = THEME_ICONS[theme];
  const nextTheme: Record<ThemeMode, ThemeMode> = { morning: "night", night: "romantic", romantic: "morning" };

  return (
    <div className="min-h-screen bg-background transition-colors duration-700 relative">
      <ThemeParticles theme={theme} />

      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between py-3 px-4 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary/10">
              <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h1 className="font-display text-base sm:text-xl font-bold">Daily Voice Journal</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setTheme(nextTheme[theme])}
              title={`Theme: ${THEME_LABELS[theme]}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <ThemeIcon className="h-4 w-4" />
            </button>
            <NotificationBell />
            <ProfileSettings />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/friends")}>
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Friends</span>
            </Button>
            {!isMobile && (
              <VoiceClipManager userId={user?.id ?? ""} clips={voiceClips} onClipsChange={setVoiceClips} />
            )}
            <Button variant="ghost" size="sm" onClick={signOut} className="px-2 sm:px-3">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container space-y-4 sm:space-y-6 py-4 sm:py-6 px-4 animate-fade-in relative z-10">
        {/* Today's snapshot */}
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Today</p>
              <p className="font-display text-base sm:text-lg font-bold">
                {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              {todayEntry ? (
                <p className="text-sm text-muted-foreground mt-0.5">
                  ✅ {(todayEntry.tasks as any[]).length} task{(todayEntry.tasks as any[]).length !== 1 ? "s" : ""} logged
                  {todayEntry.mood && ` · feeling ${todayEntry.mood}`}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-0.5">📝 No entry yet — log your day!</p>
              )}
              {lastVoicePlayed && (
                <p className="text-xs text-primary mt-1">
                  🎙️ Last voice: {lastVoicePlayed} productivity clip played
                </p>
              )}
            </div>
            <Button
              onClick={() => { setSelectedDate(today); setModalOpen(true); }}
              className="shrink-0"
            >
              {todayEntry ? "Update Today ✏️" : "Log Today 📝"}
            </Button>
          </div>
        </div>

        {/* Today's Mission - horizontal card */}
        <DailyMissionCard mission={todayMission} missionCtx={missionCtx} />

        {/* Sakhi + Growth Garden side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <SakhiCompanion streak={streak} todayLogged={!!todayEntry} missedRecently={missedRecently} />
          <GrowthGarden streak={streak} missedRecently={missedRecently} />
        </div>

        <ProgressPanel
          streak={streak}
          totalDays={summary.completedDays}
          highDays={summary.high}
          mediumDays={summary.medium}
          achievements={achievementIds}
          weeklySummary={weeklySummary}
          badgeCtx={badgeCtx}
        />

        <MysteryRewards streak={streak} totalDays={summary.completedDays} highDays={summary.high} />

        <MemoryTimeline entries={entries} achievements={achievementIds} streak={streak} />

        {isMobile ? (
          <MobileCalendar year={year} entries={entries} onDayClick={handleDayClick} />
        ) : (
          <div className="rounded-xl border border-border/50 bg-card p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">{year} Progress</h2>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-sm bg-productivity-high" /> High
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-sm bg-productivity-medium" /> Medium
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-sm bg-destructive/60" /> Low
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-sm bg-muted/40 border border-border" /> Empty
                </span>
              </div>
            </div>
            <CalendarGrid year={year} entries={entries} onDayClick={handleDayClick} />
          </div>
        )}

        {isMobile && (
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <VoiceClipManager userId={user?.id ?? ""} clips={voiceClips} onClipsChange={setVoiceClips} />
          </div>
        )}
      </main>

      <TaskEntryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        date={selectedDate}
        existingEntry={selectedEntry}
        onSave={handleSave}
        voiceLoading={voiceLoading}
      />

      <RewardUnlockPopup
        show={rewardPopup.show}
        onClose={() => setRewardPopup((p) => ({ ...p, show: false }))}
        rewardTitle={rewardPopup.title}
        rewardMessage={rewardPopup.message}
        rewardEmoji={rewardPopup.emoji}
      />

      <BirthdayCelebration
        show={showBirthday}
        onClose={() => setShowBirthday(false)}
      />
    </div>
  );
};

export default Dashboard;
