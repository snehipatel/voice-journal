import { useMemo, useState } from "react";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";

interface TimelineEvent {
  date: string;
  title: string;
  emoji: string;
  description: string;
}

interface MemoryTimelineProps {
  entries: Array<{ entry_date: string; productivity_level: string; tasks: any }>;
  achievements: string[];
  streak: number;
}

export const MemoryTimeline = ({ entries, achievements, streak }: MemoryTimelineProps) => {
  const [expanded, setExpanded] = useState(false);

  const events = useMemo(() => {
    const timeline: TimelineEvent[] = [];

    // First entry
    if (entries.length > 0) {
      const sorted = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
      timeline.push({
        date: sorted[0].entry_date,
        title: "Journey Began",
        emoji: "🌱",
        description: "You logged your very first entry!",
      });

      // Day milestones
      const milestones = [10, 25, 50, 100, 200, 365];
      for (const m of milestones) {
        if (entries.length >= m) {
          const entryAtM = sorted[m - 1];
          timeline.push({
            date: entryAtM?.entry_date ?? sorted[sorted.length - 1].entry_date,
            title: `${m} Days Logged`,
            emoji: m >= 100 ? "🏆" : m >= 50 ? "🌟" : "📅",
            description: `You've logged ${m} days total!`,
          });
        }
      }

      // First high productivity day
      const firstHigh = sorted.find((e) => e.productivity_level === "high");
      if (firstHigh) {
        timeline.push({
          date: firstHigh.entry_date,
          title: "First High Day",
          emoji: "🎯",
          description: "Your first high-productivity day!",
        });
      }
    }

    // Badge milestones
    if (achievements.includes("streak_7")) {
      timeline.push({ date: "", title: "7-Day Streak!", emoji: "🔥", description: "Consistency badge unlocked" });
    }
    if (achievements.includes("streak_30")) {
      timeline.push({ date: "", title: "30-Day Streak!", emoji: "💪", description: "Disciplined badge unlocked" });
    }

    return timeline.sort((a, b) => (a.date || "z").localeCompare(b.date || "z"));
  }, [entries, achievements]);

  if (events.length === 0) return null;

  const displayEvents = expanded ? events : events.slice(0, 3);

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Memory Timeline</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {events.length} moments
          </span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      <div className="px-4 pb-4 space-y-0">
        {displayEvents.map((event, i) => (
          <div key={i} className="flex gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm shrink-0">
                {event.emoji}
              </div>
              {i < displayEvents.length - 1 && (
                <div className="w-px flex-1 bg-border/50 min-h-[20px]" />
              )}
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold">{event.title}</p>
              <p className="text-xs text-muted-foreground">{event.description}</p>
              {event.date && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{event.date}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
