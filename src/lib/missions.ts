import { toLocalDateStr } from "@/lib/badges";

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  emoji: string;
  requirement: (ctx: MissionContext) => boolean;
  getProgress: (ctx: MissionContext) => number;
}

export interface DayTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface MissionContext {
  todayTaskCount: number;
  todayMood: string | null;
  todayReflection: string | null;
  streak: number;
  recentHighDays: number; // last 7 days
}

const MISSION_POOL: DailyMission[] = [
  {
    id: "log_3_tasks",
    title: "Triple Threat",
    description: "Log at least 3 tasks today",
    emoji: "🎯",
    requirement: (ctx) => ctx.todayTaskCount >= 3,
    getProgress: (ctx) => Math.min(100, Math.round((ctx.todayTaskCount / 3) * 100)),
  },
  {
    id: "log_5_tasks",
    title: "Power Five",
    description: "Log 5 tasks today",
    emoji: "⚡",
    requirement: (ctx) => ctx.todayTaskCount >= 5,
    getProgress: (ctx) => Math.min(100, Math.round((ctx.todayTaskCount / 5) * 100)),
  },
  {
    id: "log_with_mood",
    title: "Mood Check",
    description: "Log your mood today",
    emoji: "😊",
    requirement: (ctx) => ctx.todayMood !== null && ctx.todayMood !== "neutral",
    getProgress: (ctx) => ctx.todayMood && ctx.todayMood !== "neutral" ? 100 : 0,
  },
  {
    id: "write_reflection",
    title: "Deep Thoughts",
    description: "Write a reflection today",
    emoji: "🧠",
    requirement: (ctx) => (ctx.todayReflection?.trim().length ?? 0) > 10,
    getProgress: (ctx) => {
      const len = ctx.todayReflection?.trim().length ?? 0;
      return Math.min(100, Math.round((len / 10) * 100));
    },
  },
  {
    id: "log_1_task",
    title: "Just Start",
    description: "Log at least 1 task today",
    emoji: "✅",
    requirement: (ctx) => ctx.todayTaskCount >= 1,
    getProgress: (ctx) => ctx.todayTaskCount >= 1 ? 100 : 0,
  },
  {
    id: "full_entry",
    title: "Complete Package",
    description: "Log tasks, mood, and reflection",
    emoji: "📦",
    requirement: (ctx) =>
      ctx.todayTaskCount >= 1 &&
      ctx.todayMood !== null &&
      ctx.todayMood !== "neutral" &&
      (ctx.todayReflection?.trim().length ?? 0) > 10,
    getProgress: (ctx) => {
      let score = 0;
      if (ctx.todayTaskCount >= 1) score += 33;
      if (ctx.todayMood && ctx.todayMood !== "neutral") score += 33;
      if ((ctx.todayReflection?.trim().length ?? 0) > 10) score += 34;
      return score;
    },
  },
];

/** Pick today's mission deterministically using date as seed */
export function getTodayMission(streak: number, recentHighDays: number): DailyMission {
  const dateStr = toLocalDateStr(new Date());
  // Simple hash from date string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }

  // If streak is low, pick easier missions
  let pool = MISSION_POOL;
  if (streak < 3) {
    pool = MISSION_POOL.filter((m) => ["log_1_task", "log_with_mood", "write_reflection"].includes(m.id));
  } else if (recentHighDays >= 5) {
    // High performer → harder missions
    pool = MISSION_POOL.filter((m) => ["log_5_tasks", "full_entry"].includes(m.id));
  }

  const idx = Math.abs(hash) % pool.length;
  return pool[idx];
}
