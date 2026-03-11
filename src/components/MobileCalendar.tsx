import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DailyEntry, getDayOfYear, isMilestoneDay } from "@/lib/journal";
import { toLocalDateStr } from "@/lib/badges";
import { Trophy } from "lucide-react";

interface MobileCalendarProps {
  year: number;
  entries: DailyEntry[];
  onDayClick: (date: Date) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MobileCalendar = ({ year, entries, onDayClick }: MobileCalendarProps) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const entryMap = useMemo(() => {
    const map = new Map<string, DailyEntry>();
    entries.forEach((e) => map.set(e.entry_date, e));
    return map;
  }, [entries]);

  const todayStr = toLocalDateStr(today);

  const daysInMonth = new Date(year, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, currentMonth, 1).getDay();

  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, currentMonth, i + 1);
      const dateStr = toLocalDateStr(date);
      const dayOfYear = getDayOfYear(date);
      return { date, dateStr, dayOfYear, entry: entryMap.get(dateStr) };
    });
  }, [year, currentMonth, entryMap, daysInMonth]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = startXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentMonth < 11) setCurrentMonth((m) => m + 1);
      else if (diff < 0 && currentMonth > 0) setCurrentMonth((m) => m - 1);
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => currentMonth > 0 && setCurrentMonth((m) => m - 1)}
          disabled={currentMonth === 0}
          className="p-2 rounded-lg hover:bg-muted/50 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="font-display text-lg font-semibold">
          {MONTH_NAMES[currentMonth]} {year}
        </h3>
        <button
          onClick={() => currentMonth < 11 && setCurrentMonth((m) => m + 1)}
          disabled={currentMonth === 11}
          className="p-2 rounded-lg hover:bg-muted/50 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        ref={containerRef}
        className="grid grid-cols-7 gap-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`offset-${i}`} className="aspect-square" />
        ))}

        {days.map(({ date, dateStr, dayOfYear, entry }) => {
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;
          const isMilestone = isMilestoneDay(dayOfYear);
          const level = entry?.productivity_level;

          let bgClass = "bg-muted/40";
          if (level === "high") bgClass = "bg-productivity-high";
          else if (level === "medium") bgClass = "bg-productivity-medium";
          else if (level === "low" && entry) bgClass = "bg-destructive/60";
          if (isFuture) bgClass = "bg-muted/20";

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onDayClick(date)}
              disabled={isFuture}
              className={`relative aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${bgClass} ${
                isToday
                  ? "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105 z-10"
                  : ""
              } ${isMilestone && !isFuture ? "ring-1 ring-milestone" : ""} ${
                isFuture ? "opacity-30" : "active:scale-95"
              }`}
            >
              <span className={`${entry ? "text-white" : ""} ${isToday && !entry ? "text-primary font-bold" : ""}`}>
                {date.getDate()}
              </span>
              {isMilestone && !isFuture && (
                <Trophy className="absolute -right-0.5 -top-0.5 h-3 w-3 text-milestone" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 justify-center mt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-productivity-high" /> High
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-productivity-medium" /> Med
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-destructive/60" /> Low
        </span>
      </div>
    </div>
  );
};
