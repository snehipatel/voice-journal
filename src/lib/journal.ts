import { supabase } from "@/integrations/supabase/client";
import { toLocalDateStr } from "@/lib/badges";

export interface DailyEntry {
  id: string;
  user_id: string;
  entry_date: string;
  tasks: { description: string }[];
  productivity_level: "low" | "medium" | "high";
  ai_message: string | null;
  voice_url: string | null;
  mood: string | null;
  reflection: string | null;
  created_at: string;
  updated_at: string;
}

export interface VoiceClip {
  id: string;
  user_id: string;
  productivity_level: "high" | "medium" | "low";
  file_name: string;
  storage_path: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: string;
}

// Re-export BADGE_DEFINITIONS for backward compat (maps to ALL_BADGES minimal shape)
export { ALL_BADGES as BADGE_DEFINITIONS } from "@/lib/badges";

export const MILESTONE_DAYS = [30, 60, 100, 150, 200, 250, 300, 365];

export function getProductivityLevel(taskCount: number): "low" | "medium" | "high" {
  if (taskCount >= 3) return "high";
  if (taskCount >= 2) return "medium";
  return "low";
}

export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function isMilestoneDay(dayNumber: number): boolean {
  return MILESTONE_DAYS.includes(dayNumber);
}

export async function fetchEntries(userId: string, year: number): Promise<DailyEntry[]> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("entry_date", startDate)
    .lte("entry_date", endDate);

  if (error) throw error;
  return ((data ?? []) as unknown[]) as DailyEntry[];
}

export async function upsertEntry(
  userId: string,
  entryDate: string,
  tasks: { description: string }[],
  productivityLevel: "low" | "medium" | "high",
  mood?: string,
  reflection?: string
): Promise<DailyEntry> {
  const { data, error } = await supabase
    .from("daily_entries")
    .upsert(
      {
        user_id: userId,
        entry_date: entryDate,
        tasks: tasks as any,
        productivity_level: productivityLevel,
        mood: mood ?? "neutral",
        reflection: reflection ?? null,
      },
      { onConflict: "user_id,entry_date" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as unknown as DailyEntry;
}

export async function updateEntryAI(entryId: string, aiMessage: string, voiceUrl: string | null) {
  const { error } = await supabase
    .from("daily_entries")
    .update({ ai_message: aiMessage, voice_url: voiceUrl })
    .eq("id", entryId);

  if (error) throw error;
}

export function calculateStreak(entries: DailyEntry[]) {
  if (!entries || entries.length === 0) return 0;

  const dates = entries
    .map((e) => new Date(e.entry_date))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;

  for (let i = 0; i < dates.length; i++) {
    const current = new Date(dates[i]);
    current.setHours(0, 0, 0, 0);

    const diff =
      (today.getTime() - current.getTime()) /
      (1000 * 60 * 60 * 24);

    if (i === 0) {
      if (diff <= 1) streak = 1;
      else break;
    } else {
      const prev = new Date(dates[i - 1]);
      prev.setHours(0, 0, 0, 0);

      const gap =
        (prev.getTime() - current.getTime()) /
        (1000 * 60 * 60 * 24);

      if (gap === 1) streak++;
      else break;
    }
  }

  return streak;
}

export function getProductivitySummary(entries: DailyEntry[]) {
  const high = entries.filter((e) => e.productivity_level === "high").length;
  const medium = entries.filter((e) => e.productivity_level === "medium").length;
  const total = entries.filter((e) => e.productivity_level !== "low").length;
  return { high, medium, total, completedDays: entries.length };
}

export function getWeeklySummary(entries: DailyEntry[]) {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);
  const weekEntries = entries.filter((e) => {
    const d = new Date(e.entry_date);
    return d >= weekAgo && d <= today;
  });
  return {
    total: weekEntries.length,
    high: weekEntries.filter((e) => e.productivity_level === "high").length,
    medium: weekEntries.filter((e) => e.productivity_level === "medium").length,
    low: weekEntries.filter((e) => e.productivity_level === "low").length,
  };
}

// ── Voice clips ─────────────────────────────────────────────────────────────

export async function fetchVoiceClips(userId: string): Promise<VoiceClip[]> {
  const { data, error } = await supabase
    .from("voice_clips")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VoiceClip[];
}

export async function uploadVoiceClip(
  userId: string,
  file: File,
  productivityLevel: "high" | "medium" | "low"
): Promise<VoiceClip> {
  const ext = file.name.split(".").pop();
  const storagePath = `${userId}/${productivityLevel}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("voice-clips")
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("voice_clips")
    .insert({ user_id: userId, productivity_level: productivityLevel, file_name: file.name, storage_path: storagePath })
    .select()
    .single();
  if (error) throw error;
  return data as VoiceClip;
}

export async function deleteVoiceClip(clip: VoiceClip): Promise<void> {
  await supabase.storage.from("voice-clips").remove([clip.storage_path]);
  const { error } = await supabase.from("voice_clips").delete().eq("id", clip.id);
  if (error) throw error;
}

export async function getSignedVoiceUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage.from("voice-clips").createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? null;
}

/**
 * Pick a random voice clip for the given level, excluding the last played clip ID
 * to prevent consecutive repeats.
 */
export async function pickRandomVoiceClip(
  clips: VoiceClip[],
  level: "high" | "medium" | "low",
  lastPlayedId?: string | null
): Promise<{ url: string; clipId: string } | null> {
  const matching = clips.filter((c) => c.productivity_level === level);
  if (matching.length === 0) return null;

  // If more than one clip, exclude the last played one
  const candidates = matching.length > 1
    ? matching.filter((c) => c.id !== lastPlayedId)
    : matching;

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const url = await getSignedVoiceUrl(chosen.storage_path);
  if (!url) return null;
  return { url, clipId: chosen.id };
}

// ── Achievements ─────────────────────────────────────────────────────────────

export async function fetchAchievements(userId: string): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as Achievement[];
}

export async function unlockAchievement(userId: string, badgeId: string): Promise<void> {
  await supabase
    .from("achievements")
    .upsert({ user_id: userId, badge_id: badgeId }, { onConflict: "user_id,badge_id" });
}
