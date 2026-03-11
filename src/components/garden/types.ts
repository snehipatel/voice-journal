export type Stage =
  | "seed"
  | "small-sprout"
  | "two-leaf"
  | "small-plant"
  | "bushy-plant"
  | "young-tree"
  | "mature-tree"
  | "flowering-tree"
  | "blossom-tree"
  | "fruit-tree"
  | "heavy-fruit"
  | "golden-tree";

export type Weather = "sunny" | "drizzle" | "heavy-rain" | "snow";

export const STAGES: { key: Stage; minStreak: number; label: string }[] = [
  { key: "seed", minStreak: 0, label: "Seed" },
  { key: "small-sprout", minStreak: 1, label: "Small Sprout" },
  { key: "two-leaf", minStreak: 3, label: "Two-Leaf Sprout" },
  { key: "small-plant", minStreak: 5, label: "Small Plant" },
  { key: "bushy-plant", minStreak: 7, label: "Bushy Plant" },
  { key: "young-tree", minStreak: 14, label: "Young Tree" },
  { key: "mature-tree", minStreak: 21, label: "Mature Green Tree" },
  { key: "flowering-tree", minStreak: 30, label: "Flowering Tree" },
  { key: "blossom-tree", minStreak: 50, label: "Full Blossom Tree" },
  { key: "fruit-tree", minStreak: 70, label: "Fruit Tree" },
  { key: "heavy-fruit", minStreak: 90, label: "Heavy Fruit Tree" },
  { key: "golden-tree", minStreak: 100, label: "Golden Magical Tree" },
];

export const STAGE_VIDEOS: Record<Stage, string> = {
  seed: "/tree-videos/Phase 0.mp4",
  "small-sprout": "/tree-videos/Phase 1.mp4",
  "two-leaf": "/tree-videos/Phase 2.mp4",
  "small-plant": "/tree-videos/Phase 3.mp4",
  "bushy-plant": "/tree-videos/Phase 4.mp4",
  "young-tree": "/tree-videos/Phase 5.mp4",
  "mature-tree": "/tree-videos/Phase 6.mp4",
  "flowering-tree": "/tree-videos/Phase 7.mp4",
  "blossom-tree": "/tree-videos/Phase 8.mp4",
  "fruit-tree": "/tree-videos/Phase 9.mp4",
  "heavy-fruit": "/tree-videos/Phase 10.mp4",
  "golden-tree": "/tree-videos/Phase 11.mp4",
};

export const STAGE_EMOJI: Record<Stage, string> = {
  seed: "🌰",
  "small-sprout": "🌱",
  "two-leaf": "🌱",
  "small-plant": "🌿",
  "bushy-plant": "🌿",
  "young-tree": "🪴",
  "mature-tree": "🌳",
  "flowering-tree": "🌸",
  "blossom-tree": "🌺",
  "fruit-tree": "🍎",
  "heavy-fruit": "🍊",
  "golden-tree": "✨🌳✨",
};

export function getStage(streak: number): Stage {
  let result: Stage = "seed";
  for (const s of STAGES) {
    if (streak >= s.minStreak) result = s.key;
  }
  return result;
}

export function getStageIndex(stage: Stage): number {
  return STAGES.findIndex((s) => s.key === stage);
}

export function getStageLabel(stage: Stage): string {
  return STAGES.find((s) => s.key === stage)?.label ?? "Seed";
}

export function getWeather(): Weather {
  const seed = Math.floor(Date.now() / (1000 * 60 * 30));
  const r = ((seed * 9301 + 49297) % 233280) / 233280;
  if (r < 0.5) return "sunny";
  if (r < 0.72) return "drizzle";
  if (r < 0.88) return "heavy-rain";
  return "snow";
}
