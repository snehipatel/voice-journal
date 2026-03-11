import { supabase } from "@/integrations/supabase/client";

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

const REMINDER_MESSAGES = [
  "Hey! 👋 Don't forget to log your day. Your future self will thank you! 🌟",
  "✨ Daily check-in time! What did you crush today?",
  "🔥 Streak alert! Log your tasks to keep the fire burning.",
  "Your journal misses you! 📖 Take 2 minutes to reflect.",
  "🎯 Every day logged is a step toward your best year ever!",
  "Psst... your productivity companion is waiting! 💪",
  "One small log, one giant leap for your goals! 🚀",
  "🌙 Day's almost done — capture it before it fades!",
  "Don't break the chain! ⛓️ Log today's wins now.",
  "You showed up today. Now let's make it official! ✅",
];

function getMsUntil10PM(): number {
  const now = new Date();
  const target = new Date();
  target.setHours(22, 0, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

let notifTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleDailyReminder(hasTodayEntry: () => boolean) {
  if (notifTimer) clearTimeout(notifTimer);

  const scheduleNext = () => {
    const ms = getMsUntil10PM();
    notifTimer = setTimeout(async () => {
      if (!hasTodayEntry() && Notification.permission === 'granted') {
        const msg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
        const reg = await navigator.serviceWorker?.ready;
        if (reg) {
          reg.showNotification('Sakhi 📓', {
            body: msg,
            icon: '/favicon.ico',
            tag: 'daily-reminder',
          });
        } else {
          new Notification('Sakhi 📓', { body: msg, icon: '/favicon.ico' });
        }
      }
      scheduleNext();
    }, ms);
  };

  scheduleNext();
}

export function clearDailyReminder() {
  if (notifTimer) {
    clearTimeout(notifTimer);
    notifTimer = null;
  }
}

// In-app notification helpers
export async function createNotification(
  userId: string,
  fromUserId: string,
  type: string,
  title: string,
  body: string
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    from_user_id: fromUserId,
    type,
    title,
    body,
  } as any);
}

// Check if user already cheered this friend today (anti-spam)
export async function hasEncourgedToday(senderId: string, receiverId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("cheer_reactions")
    .select("id")
    .eq("sender_id", senderId)
    .eq("receiver_id", receiverId)
    .gte("created_at", today + "T00:00:00Z")
    .limit(1);
  return (data ?? []).length > 0;
}
