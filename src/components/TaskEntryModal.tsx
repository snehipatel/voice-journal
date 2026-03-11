import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2 } from "lucide-react";
import { DailyEntry, getProductivityLevel, isMilestoneDay, getDayOfYear } from "@/lib/journal";

const MOODS = [
  { value: "amazing", emoji: "🤩", label: "Amazing" },
  { value: "good", emoji: "😊", label: "Good" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "stressed", emoji: "😤", label: "Stressed" },
];

interface TaskEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  existingEntry: DailyEntry | null;
  onSave: (tasks: { description: string }[], mood: string, reflection: string) => Promise<void>;
  voiceLoading: boolean;
}

export const TaskEntryModal = ({
  open,
  onOpenChange,
  date,
  existingEntry,
  onSave,
  voiceLoading,
}: TaskEntryModalProps) => {
  const [tasks, setTasks] = useState<{ description: string }[]>([{ description: "" }]);
  const [mood, setMood] = useState("neutral");
  const [reflection, setReflection] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingEntry) {
      const entryTasks = existingEntry.tasks as { description: string }[];
      setTasks(entryTasks.length > 0 ? entryTasks : [{ description: "" }]);
      setMood(existingEntry.mood ?? "neutral");
      setReflection(existingEntry.reflection ?? "");
    } else {
      setTasks([{ description: "" }]);
      setMood("neutral");
      setReflection("");
    }
  }, [existingEntry, open]);

  if (!date) return null;

  const dayOfYear = getDayOfYear(date);
  const isMilestone = isMilestoneDay(dayOfYear);
  const validTasks = tasks.filter((t) => t.description.trim());
  const level = getProductivityLevel(validTasks.length);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(validTasks, mood, reflection);
    } finally {
      setSaving(false);
    }
  };

  const levelColors = {
    high: "bg-productivity-high text-white",
    medium: "bg-productivity-medium text-white",
    low: "bg-muted text-muted-foreground",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {isMilestone && (
              <Badge className="bg-milestone text-white animate-pulse">🏆 Day {dayOfYear}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>Log what you accomplished today</DialogDescription>
        </DialogHeader>

        {/* Mood Selector */}
        <div className="space-y-2">
          <p className="text-sm font-medium">How are you feeling?</p>
          <div className="flex gap-2 flex-wrap">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  mood === m.value
                    ? "bg-primary text-primary-foreground scale-110 shadow-md"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                <span className="text-lg">{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Today's tasks</p>
          {tasks.map((task, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder={`Task ${i + 1}...`}
                value={task.description}
                onChange={(e) => {
                  const updated = [...tasks];
                  updated[i] = { description: e.target.value };
                  setTasks(updated);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setTasks([...tasks, { description: "" }]);
                  }
                }}
              />
              {tasks.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTasks(tasks.filter((_, j) => j !== i))}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setTasks([...tasks, { description: "" }])}>
            <Plus className="mr-1 h-3 w-3" /> Add task
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Productivity:</span>
          <Badge className={levelColors[level]}>
            {level} · {validTasks.length} task{validTasks.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Reflection */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Reflection <span className="text-muted-foreground font-normal">(optional)</span></p>
          <Textarea
            placeholder="What went well? What could be better? Any thoughts..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {voiceLoading && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            Playing your motivational voice clip...
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || validTasks.length === 0}>
            {saving ? "Saving..." : "Save Entry ✨"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
