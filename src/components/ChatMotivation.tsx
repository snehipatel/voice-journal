import { useMemo } from "react";

const MOTIVATIONAL_MESSAGES = [
  { text: "You showed up today — that's already a win! 🌟", mood: "encouraging" },
  { text: "Every task completed is a step toward your best self 💪", mood: "powerful" },
  { text: "Your future self is so proud of you right now 🥹", mood: "emotional" },
  { text: "Consistency beats intensity. You're proving that daily. 🔥", mood: "wise" },
  { text: "Small steps, big dreams. Keep going! 🚶‍♂️✨", mood: "gentle" },
  { text: "You're building something beautiful — one day at a time 🏗️", mood: "inspiring" },
  { text: "Hey champion! Ready to make today count? 🏆", mood: "energetic" },
  { text: "Remember: progress isn't always visible, but it's always happening 🌱", mood: "reflective" },
  { text: "You've got this! Let's make it a great day 🌈", mood: "cheerful" },
  { text: "The hardest part is showing up. You already did that! 👏", mood: "proud" },
];

const STREAK_MESSAGES: Record<string, string[]> = {
  low: [
    "Start fresh today! Every journey begins with one step 🌅",
    "Today is a new chance to build something amazing 🌟",
  ],
  rising: [
    "Your streak is growing! Keep the momentum going 📈",
    "Look at you building that consistency! 🔥",
  ],
  high: [
    "You're on fire! This streak is unstoppable 🔥🔥",
    "Legendary dedication! You're inspiring 👑",
  ],
};

function getStreakCategory(streak: number): "low" | "rising" | "high" {
  if (streak >= 14) return "high";
  if (streak >= 3) return "rising";
  return "low";
}

interface ChatMotivationProps {
  streak: number;
  todayLogged: boolean;
}

export const ChatMotivation = ({ streak, todayLogged }: ChatMotivationProps) => {
  const messages = useMemo(() => {
    const result: { text: string; isStreak: boolean }[] = [];

    // Streak-specific message
    const cat = getStreakCategory(streak);
    const streakMsgs = STREAK_MESSAGES[cat];
    const dateHash = new Date().getDate();
    result.push({ text: streakMsgs[dateHash % streakMsgs.length], isStreak: true });

    // General motivation
    const msgIdx = (dateHash * 7 + streak) % MOTIVATIONAL_MESSAGES.length;
    result.push({ text: MOTIVATIONAL_MESSAGES[msgIdx].text, isStreak: false });

    if (todayLogged) {
      result.push({ text: "✅ Today's entry is logged! You're amazing! 🎉", isStreak: false });
    }

    return result;
  }, [streak, todayLogged]);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">💬 Daily Motivation</p>
      <div className="space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className="animate-fade-in"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <div className={`inline-block max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.isStreak
                ? "bg-primary/10 text-foreground rounded-bl-md"
                : "bg-muted/40 text-foreground rounded-bl-md ml-4"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
