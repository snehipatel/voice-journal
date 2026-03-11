export interface MysteryReward {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: "badge" | "animation" | "note" | "voice";
  unlocksAt: { streak?: number; totalDays?: number; highDays?: number };
  getProgress: (ctx: { streak: number; totalDays: number; highDays: number }) => number;
}

const ROMANTIC_NOTES = [
  "You're not just productive — you're becoming the person you've always dreamed of being. 💫",
  "Every task you complete is a love letter to your future self. 💌",
  "The world gets a little brighter every time you show up for yourself. ☀️",
  "Your consistency is the most beautiful thing about you. 🌸",
  "Look at you — growing, glowing, going. Never stop. 🌟",
  "You don't need motivation. You ARE the motivation. 🔥",
];

export const MYSTERY_REWARDS: MysteryReward[] = [
  {
    id: "reward_streak_5",
    name: "First Mystery Box",
    emoji: "🎁",
    description: "A special surprise for your dedication",
    type: "note",
    unlocksAt: { streak: 5 },
    getProgress: (ctx) => Math.min(100, Math.round((ctx.streak / 5) * 100)),
  },
  {
    id: "reward_streak_10",
    name: "Silver Box",
    emoji: "🎊",
    description: "You've earned something beautiful",
    type: "animation",
    unlocksAt: { streak: 10 },
    getProgress: (ctx) => Math.min(100, Math.round((ctx.streak / 10) * 100)),
  },
  {
    id: "reward_days_20",
    name: "Dedication Box",
    emoji: "💎",
    description: "A gem for your commitment",
    type: "note",
    unlocksAt: { totalDays: 20 },
    getProgress: (ctx) => Math.min(100, Math.round((ctx.totalDays / 20) * 100)),
  },
  {
    id: "reward_streak_30",
    name: "Gold Box",
    emoji: "👑",
    description: "Reserved for true champions",
    type: "animation",
    unlocksAt: { streak: 30 },
    getProgress: (ctx) => Math.min(100, Math.round((ctx.streak / 30) * 100)),
  },
  {
    id: "reward_high_25",
    name: "Elite Box",
    emoji: "🏆",
    description: "Only the most productive unlock this",
    type: "note",
    unlocksAt: { highDays: 25 },
    getProgress: (ctx) => Math.min(100, Math.round((ctx.highDays / 25) * 100)),
  },
  {
    id: "reward_streak_60",
    name: "Platinum Box",
    emoji: "✨",
    description: "An extraordinary reward for extraordinary effort",
    type: "animation",
    unlocksAt: { streak: 60 },
    getProgress: (ctx) => Math.min(100, Math.round((ctx.streak / 60) * 100)),
  },
  {
    id: "reward_days_100",
    name: "Century Box",
    emoji: "💫",
    description: "100 days of dedication — you're legendary",
    type: "note",
    unlocksAt: { totalDays: 100 },
    getProgress: (ctx) => Math.min(100, Math.round((ctx.totalDays / 100) * 100)),
  },
];

export function getUnlockedRewards(ctx: { streak: number; totalDays: number; highDays: number }): MysteryReward[] {
  return MYSTERY_REWARDS.filter((r) => {
    if (r.unlocksAt.streak && ctx.streak < r.unlocksAt.streak) return false;
    if (r.unlocksAt.totalDays && ctx.totalDays < r.unlocksAt.totalDays) return false;
    if (r.unlocksAt.highDays && ctx.highDays < r.unlocksAt.highDays) return false;
    return true;
  });
}

export function getRandomNote(): string {
  return ROMANTIC_NOTES[Math.floor(Math.random() * ROMANTIC_NOTES.length)];
}
