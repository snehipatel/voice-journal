import { useMemo } from "react";
import { DailyEntry, isMilestoneDay, getDayOfYear } from "@/lib/journal";
import { toLocalDateStr } from "@/lib/badges";
import { Trophy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CalendarGridProps {
  year: number;
  entries: DailyEntry[];
  onDayClick: (date: Date) => void;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const CalendarGrid = ({ year, entries, onDayClick }: CalendarGridProps) => {
  const entryMap = useMemo(() => {
    const map = new Map<string, DailyEntry>();
    entries.forEach((e) => map.set(e.entry_date, e));
    return map;
  }, [entries]);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, month) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days = Array.from({ length: daysInMonth }, (_, day) => {
        const date = new Date(year, month, day + 1);
        // Use local date string (not UTC) to match entry_date stored in DB
        const dateStr = toLocalDateStr(date);
        const dayOfYear = getDayOfYear(date);
        return { date, dateStr, dayOfYear, entry: entryMap.get(dateStr) };
      });
      return { month, name: MONTH_NAMES[month], days };
    });
  }, [year, entryMap]);

  const today = toLocalDateStr(new Date());

  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
      {months.map(({ month, name, days }) => (
        <div key={month} className="space-y-1.5">
          <h3 className="text-xs font-semibold text-muted-foreground">{name}</h3>
          <div className="grid grid-cols-7 gap-[3px]">
            {Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => (
              <div key={`offset-${i}`} className="h-3.5 w-3.5" />
            ))}
            {days.map(({ date, dateStr, dayOfYear, entry }) => {
              const isToday = dateStr === today;
              // Compare by date string to avoid timezone issues
              const isFuture = dateStr > today;
              const isMilestone = isMilestoneDay(dayOfYear);
              const level = entry?.productivity_level;

              // Color coding: green=high, yellow=medium, red=low/logged, grey=empty future
              let bgClass = "bg-muted/40";
              if (level === "high") bgClass = "bg-productivity-high";
              else if (level === "medium") bgClass = "bg-productivity-medium";
              else if (level === "low" && entry) bgClass = "bg-destructive/60";
              if (isFuture) bgClass = "bg-muted/20";

              return (
                <Tooltip key={dateStr}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => !isFuture && onDayClick(date)}
                      disabled={isFuture}
                      className={`relative h-3.5 w-3.5 rounded-sm transition-all hover:scale-150 hover:z-10 ${bgClass} ${
                        isToday
                          ? "ring-2 ring-primary ring-offset-1 ring-offset-background scale-125 z-10"
                          : ""
                      } ${isMilestone && !isFuture ? "ring-1 ring-milestone" : ""} ${
                        isFuture ? "cursor-default opacity-30" : "cursor-pointer"
                      }`}
                    >
                      {isMilestone && !isFuture && (
                        <Trophy className="absolute -right-1 -top-1 h-2.5 w-2.5 text-milestone" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <p className="font-medium">
                      {isToday ? "📌 Today — " : ""}
                      {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {isMilestone ? ` 🏆 Day ${dayOfYear}` : ""}
                    </p>
                    {entry ? (
                      <p className="text-muted-foreground">
                        {(entry.tasks as any[]).length} task{(entry.tasks as any[]).length !== 1 ? "s" : ""} · {entry.productivity_level}
                        {entry.mood ? ` · ${entry.mood}` : ""}
                      </p>
                    ) : (
                      !isFuture && <p className="text-muted-foreground">No entry — click to log</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
