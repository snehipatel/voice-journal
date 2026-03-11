export interface BadgeDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: "streak" | "productivity" | "consistency" | "comeback" | "milestone" | "special";
  // Progress tracking: returns a value 0-100 given context
  getProgress: (ctx: BadgeContext) => number;
  isUnlocked: (ctx: BadgeContext) => boolean;
}

export interface BadgeContext {
  streak: number;
  highDays: number;
  totalLoggedDays: number;
  entries: Array<{ entry_date: string; productivity_level: string }>;
  unlockedBadgeIds: string[];
  firstEntryDate?: string; // ISO date string of first-ever entry
  loggedTodayAt?: Date; // time the log was saved (for early bird / night owl)
}

function streakBadge(id: string, name: string, emoji: string, days: number): BadgeDefinition {
  return {
    id,
    name,
    emoji,
    description: `${days}-day streak`,
    category: "streak",
    getProgress: (ctx) => Math.min(100, Math.round((ctx.streak / days) * 100)),
    isUnlocked: (ctx) => ctx.streak >= days,
  };
}

function highDayBadge(id: string, name: string, emoji: string, days: number, desc: string): BadgeDefinition {
  return {
    id,
    name,
    emoji,
    description: desc,
    category: "productivity",
    getProgress: (ctx) => Math.min(100, Math.round((ctx.highDays / days) * 100)),
    isUnlocked: (ctx) => ctx.highDays >= days,
  };
}

function totalDaysBadge(id: string, name: string, emoji: string, days: number, desc: string): BadgeDefinition {
  return {
    id,
    name,
    emoji,
    description: desc,
    category: "consistency",
    getProgress: (ctx) => Math.min(100, Math.round((ctx.totalLoggedDays / days) * 100)),
    isUnlocked: (ctx) => ctx.totalLoggedDays >= days,
  };
}

export const ALL_BADGES: BadgeDefinition[] = [
  // ── STREAK BADGES (8) ──────────────────────────────────────────────────────
  streakBadge("streak_3",   "Ignited",      "🔥",  3),
  streakBadge("streak_7",   "Consistent",   "🌟",  7),
  streakBadge("streak_14",  "Committed",    "💫",  14),
  streakBadge("streak_21",  "Three Weeks",  "🌊",  21),
  streakBadge("streak_30",  "Disciplined",  "💪",  30),
  streakBadge("streak_60",  "Relentless",   "⚡",  60),
  streakBadge("streak_100", "Unstoppable",  "🏆",  100),
  streakBadge("streak_180", "Legend",       "👑",  180),
  streakBadge("streak_365", "Immortal",     "✨",  365),

  // ── PRODUCTIVITY BADGES (7) ─────────────────────────────────────────────────
  {
    id: "first_high",
    name: "First Win",
    emoji: "🎯",
    description: "First high-productivity day",
    category: "productivity",
    getProgress: (ctx) => ctx.highDays >= 1 ? 100 : 0,
    isUnlocked: (ctx) => ctx.highDays >= 1,
  },
  highDayBadge("high_5",   "Go-Getter",    "🚀", 5,   "5 high-productivity days"),
  highDayBadge("high_10",  "Achiever",     "🎖️", 10,  "10 high-productivity days"),
  highDayBadge("high_25",  "Performer",    "🌠", 25,  "25 high-productivity days"),
  highDayBadge("high_50",  "Elite",        "💎", 50,  "50 high-productivity days"),
  highDayBadge("high_75",  "Diamond",      "💠", 75,  "75 high-productivity days"),
  highDayBadge("high_100", "Centurion",    "🏅", 100, "100 high-productivity days"),

  // ── CONSISTENCY BADGES (7) ──────────────────────────────────────────────────
  totalDaysBadge("log_1",   "Journaler",    "📝", 1,   "First day logged"),
  totalDaysBadge("log_10",  "Habitual",     "📖", 10,  "10 days logged"),
  totalDaysBadge("log_25",  "Dedicated",    "📚", 25,  "25 days logged"),
  totalDaysBadge("log_50",  "Seasoned",     "🗓️", 50,  "50 days logged"),
  totalDaysBadge("log_100", "Centurion",    "💯", 100, "100 days logged"),
  totalDaysBadge("log_200", "Historian",    "📜", 200, "200 days logged"),
  totalDaysBadge("log_300", "Sage",         "🧙", 300, "300 days logged"),

  // ── MILESTONE BADGES (5) ────────────────────────────────────────────────────
  {
    id: "milestone_30", name: "One Month", emoji: "🌙",
    description: "Reached 30 total days", category: "milestone",
    getProgress: (ctx) => Math.min(100, Math.round((ctx.totalLoggedDays / 30) * 100)),
    isUnlocked: (ctx) => ctx.totalLoggedDays >= 30,
  },
  {
    id: "milestone_100", name: "Triple Digits", emoji: "💯",
    description: "Reached 100 total days", category: "milestone",
    getProgress: (ctx) => Math.min(100, Math.round((ctx.totalLoggedDays / 100) * 100)),
    isUnlocked: (ctx) => ctx.totalLoggedDays >= 100,
  },
  {
    id: "milestone_200", name: "Half-Year", emoji: "🌗",
    description: "Reached 200 total days", category: "milestone",
    getProgress: (ctx) => Math.min(100, Math.round((ctx.totalLoggedDays / 200) * 100)),
    isUnlocked: (ctx) => ctx.totalLoggedDays >= 200,
  },
  {
    id: "milestone_300", name: "Season Pro", emoji: "🍂",
    description: "Reached 300 total days", category: "milestone",
    getProgress: (ctx) => Math.min(100, Math.round((ctx.totalLoggedDays / 300) * 100)),
    isUnlocked: (ctx) => ctx.totalLoggedDays >= 300,
  },
  {
    id: "milestone_365", name: "Full Circle", emoji: "🌕",
    description: "Completed the entire year", category: "milestone",
    getProgress: (ctx) => Math.min(100, Math.round((ctx.totalLoggedDays / 365) * 100)),
    isUnlocked: (ctx) => ctx.totalLoggedDays >= 365,
  },

  // ── COMEBACK BADGES (4) ─────────────────────────────────────────────────────
  {
    id: "comeback_return", name: "Phoenix", emoji: "🦅",
    description: "Returned after a missed day", category: "comeback",
    getProgress: (ctx) => {
      const hasComeBack = ctx.totalLoggedDays > ctx.streak && ctx.streak >= 1;
      return hasComeBack ? 100 : Math.min(99, ctx.totalLoggedDays * 20);
    },
    isUnlocked: (ctx) => ctx.totalLoggedDays > ctx.streak && ctx.streak >= 1,
  },
  {
    id: "comeback_3", name: "Resilient", emoji: "💪",
    description: "3-day comeback streak after a break", category: "comeback",
    getProgress: (ctx) => {
      if (ctx.totalLoggedDays <= ctx.streak) return 0;
      return Math.min(100, Math.round((ctx.streak / 3) * 100));
    },
    isUnlocked: (ctx) => ctx.totalLoggedDays > ctx.streak && ctx.streak >= 3,
  },
  {
    id: "comeback_champion", name: "Recovery Champ", emoji: "🏋️",
    description: "7-day comeback streak after a break", category: "comeback",
    getProgress: (ctx) => {
      if (ctx.totalLoggedDays <= ctx.streak) return 0;
      return Math.min(100, Math.round((ctx.streak / 7) * 100));
    },
    isUnlocked: (ctx) => ctx.totalLoggedDays > ctx.streak && ctx.streak >= 7,
  },
  {
    id: "comeback_warrior", name: "Comeback Warrior", emoji: "⚔️",
    description: "14-day comeback after a break", category: "comeback",
    getProgress: (ctx) => {
      if (ctx.totalLoggedDays <= ctx.streak) return 0;
      return Math.min(100, Math.round((ctx.streak / 14) * 100));
    },
    isUnlocked: (ctx) => ctx.totalLoggedDays > ctx.streak && ctx.streak >= 14,
  },

  // ── SPECIAL / FUN BADGES (11) ───────────────────────────────────────────────
  {
    id: "early_bird", name: "Early Bird", emoji: "🌅",
    description: "Logged before 8 AM", category: "special",
    getProgress: (ctx) => ctx.loggedTodayAt && ctx.loggedTodayAt.getHours() < 8 ? 100 : 0,
    isUnlocked: (ctx) => !!ctx.loggedTodayAt && ctx.loggedTodayAt.getHours() < 8,
  },
  {
    id: "night_warrior", name: "Night Warrior", emoji: "🌙",
    description: "Logged after 10 PM", category: "special",
    getProgress: (ctx) => ctx.loggedTodayAt && ctx.loggedTodayAt.getHours() >= 22 ? 100 : 0,
    isUnlocked: (ctx) => !!ctx.loggedTodayAt && ctx.loggedTodayAt.getHours() >= 22,
  },
  {
    id: "lunch_logger", name: "Lunch Logger", emoji: "🍽️",
    description: "Logged between 12-1 PM", category: "special",
    getProgress: (ctx) => ctx.loggedTodayAt && ctx.loggedTodayAt.getHours() === 12 ? 100 : 0,
    isUnlocked: (ctx) => !!ctx.loggedTodayAt && ctx.loggedTodayAt.getHours() === 12,
  },
  {
    id: "perfect_week", name: "Perfect Week", emoji: "🗓️",
    description: "7 days logged in one week", category: "special",
    getProgress: (ctx) => {
      const today = new Date();
      let count = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (ctx.entries.some((e) => e.entry_date === toLocalDateStr(d))) count++;
      }
      return Math.min(100, Math.round((count / 7) * 100));
    },
    isUnlocked: (ctx) => {
      const today = new Date();
      let count = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (ctx.entries.some((e) => e.entry_date === toLocalDateStr(d))) count++;
      }
      return count === 7;
    },
  },
  {
    id: "perfect_month", name: "Perfect Month", emoji: "🌟",
    description: "All days logged this month", category: "special",
    getProgress: (ctx) => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const currentDay = today.getDate();
      let count = 0;
      for (let d = 1; d <= currentDay; d++) {
        const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (ctx.entries.some((e) => e.entry_date === ds)) count++;
      }
      return Math.min(100, Math.round((count / currentDay) * 100));
    },
    isUnlocked: (ctx) => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const currentDay = today.getDate();
      for (let d = 1; d <= currentDay; d++) {
        const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (!ctx.entries.some((e) => e.entry_date === ds)) return false;
      }
      return currentDay >= 28;
    },
  },
  {
    id: "mood_master", name: "Mood Master", emoji: "😊",
    description: "Logged mood 10 days in a row", category: "special",
    getProgress: (ctx) => {
      const withMood = ctx.entries.filter((e) => (e as any).mood && (e as any).mood !== "neutral");
      return Math.min(100, Math.round((withMood.length / 10) * 100));
    },
    isUnlocked: (ctx) => {
      const withMood = ctx.entries.filter((e) => (e as any).mood && (e as any).mood !== "neutral");
      return withMood.length >= 10;
    },
  },
  {
    id: "reflector", name: "Deep Thinker", emoji: "🧠",
    description: "Wrote reflections 5 times", category: "special",
    getProgress: (ctx) => {
      const withReflection = ctx.entries.filter((e) => (e as any).reflection && (e as any).reflection.trim().length > 10);
      return Math.min(100, Math.round((withReflection.length / 5) * 100));
    },
    isUnlocked: (ctx) => {
      const withReflection = ctx.entries.filter((e) => (e as any).reflection && (e as any).reflection.trim().length > 10);
      return withReflection.length >= 5;
    },
  },
  {
    id: "reflector_20", name: "Philosopher", emoji: "📖",
    description: "Wrote reflections 20 times", category: "special",
    getProgress: (ctx) => {
      const withReflection = ctx.entries.filter((e) => (e as any).reflection && (e as any).reflection.trim().length > 10);
      return Math.min(100, Math.round((withReflection.length / 20) * 100));
    },
    isUnlocked: (ctx) => {
      const withReflection = ctx.entries.filter((e) => (e as any).reflection && (e as any).reflection.trim().length > 10);
      return withReflection.length >= 20;
    },
  },
  {
    id: "weekend_warrior", name: "Weekend Warrior", emoji: "🎉",
    description: "Logged on both Saturday and Sunday", category: "special",
    getProgress: (ctx) => {
      const today = new Date();
      const day = today.getDay();
      // Find most recent Saturday
      const satOffset = (day + 1) % 7;
      const sat = new Date(today);
      sat.setDate(sat.getDate() - satOffset);
      const sun = new Date(sat);
      sun.setDate(sun.getDate() + 1);
      let count = 0;
      if (ctx.entries.some((e) => e.entry_date === toLocalDateStr(sat))) count++;
      if (ctx.entries.some((e) => e.entry_date === toLocalDateStr(sun))) count++;
      return Math.round((count / 2) * 100);
    },
    isUnlocked: (ctx) => {
      const today = new Date();
      const day = today.getDay();
      const satOffset = (day + 1) % 7;
      const sat = new Date(today);
      sat.setDate(sat.getDate() - satOffset);
      const sun = new Date(sat);
      sun.setDate(sun.getDate() + 1);
      return ctx.entries.some((e) => e.entry_date === toLocalDateStr(sat)) &&
             ctx.entries.some((e) => e.entry_date === toLocalDateStr(sun));
    },
  },
  {
    id: "task_machine", name: "Task Machine", emoji: "⚙️",
    description: "Logged 5+ tasks in a single day", category: "special",
    getProgress: (ctx) => {
      const max = Math.max(0, ...ctx.entries.map((e) => Array.isArray((e as any).tasks) ? (e as any).tasks.length : 0));
      return Math.min(100, Math.round((max / 5) * 100));
    },
    isUnlocked: (ctx) => {
      return ctx.entries.some((e) => Array.isArray((e as any).tasks) && (e as any).tasks.length >= 5);
    },
  },
  {
    id: "variety_king", name: "Variety King", emoji: "🎨",
    description: "Used 5 different moods", category: "special",
    getProgress: (ctx) => {
      const moods = new Set(ctx.entries.map((e) => (e as any).mood).filter((m: any) => m && m !== "neutral"));
      return Math.min(100, Math.round((moods.size / 5) * 100));
    },
    isUnlocked: (ctx) => {
      const moods = new Set(ctx.entries.map((e) => (e as any).mood).filter((m: any) => m && m !== "neutral"));
      return moods.size >= 5;
    },
  },
];

/** Compute badge context from entries and current state */
export function buildBadgeContext(
  entries: Array<{ entry_date: string; productivity_level: string; mood?: string | null; reflection?: string | null }>,
  streak: number,
  unlockedBadgeIds: string[],
  loggedTodayAt?: Date
): BadgeContext {
  const highDays = entries.filter((e) => e.productivity_level === "high").length;
  const totalLoggedDays = entries.length;
  return {
    streak,
    highDays,
    totalLoggedDays,
    entries,
    unlockedBadgeIds,
    loggedTodayAt,
  };
}

/** Get which badges should now be unlocked given context (returns NEW ones only) */
export function getNewlyUnlockedBadges(ctx: BadgeContext): BadgeDefinition[] {
  return ALL_BADGES.filter(
    (b) => !ctx.unlockedBadgeIds.includes(b.id) && b.isUnlocked(ctx)
  );
}

/** Local date string helper — uses browser local time, not UTC */
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const BADGE_CATEGORY_LABELS: Record<string, string> = {
  streak: "🔥 Streak",
  productivity: "🚀 Productivity",
  consistency: "📅 Consistency",
  comeback: "💪 Comeback",
  milestone: "🏆 Milestone",
  special: "✨ Special",
};
