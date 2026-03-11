import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, Award, Flame, Lock, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  FriendProfile as FriendProfileType,
  fetchFriendProfiles,
  fetchFriendEntryDates,
  fetchFriendAchievements,
  sendCheer,
} from "@/lib/friends";
import { createNotification, hasEncourgedToday } from "@/lib/notifications";
import { ALL_BADGES } from "@/lib/badges";
import { GrowthGarden } from "@/components/GrowthGarden";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ENCOURAGE_BUTTONS = [
  { emoji: "👏", label: "Cheer", message: "cheered your streak" },
  { emoji: "🔥", label: "Keep Going", message: 'said "Keep Going!"' },
  { emoji: "💛", label: "Proud of You", message: "is proud of you" },
];

const FriendProfile = () => {
  const { friendId } = useParams<{ friendId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FriendProfileType | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [entryDates, setEntryDates] = useState<{ entry_date: string; productivity_level: string }[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [privacySettings, setPrivacySettings] = useState<any>(null);
  const [selectedDayLogs, setSelectedDayLogs] = useState<any[] | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  useEffect(() => {
    if (!friendId) return;
    Promise.all([
      fetchFriendProfiles([friendId]),
      fetchFriendEntryDates(friendId),
      fetchFriendAchievements(friendId),
      supabase.from("profiles").select("avatar_url, bio").eq("user_id", friendId).maybeSingle(),
      supabase.from("privacy_settings").select("*").eq("user_id", friendId).maybeSingle(),
    ]).then(([profs, dates, badges, profileExtra, privacy]) => {
      setProfile(profs[0] ?? null);
      setEntryDates(dates);
      setAchievements(badges);
      setAvatarUrl((profileExtra.data as any)?.avatar_url ?? null);
      setBio((profileExtra.data as any)?.bio ?? null);
      setPrivacySettings(privacy.data);
    });
  }, [friendId]);

  const handleEncourage = async (emoji: string, label: string, message: string) => {
    if (!user || !friendId || !profile) return;
    const alreadySent = await hasEncourgedToday(user.id, friendId);
    if (alreadySent) {
      toast({ title: "You've already encouraged this friend today! 💛" });
      return;
    }
    await sendCheer(user.id, friendId, emoji);
    const senderName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Someone";
    await createNotification(
      friendId,
      user.id,
      "encouragement",
      `${emoji} ${senderName} ${message}`,
      `${senderName} ${message} ${emoji}`
    );
    try {
      await supabase.functions.invoke("send-encouragement-email", {
        body: { receiverId: friendId, senderName, emoji, message },
      });
    } catch {}
    toast({ title: `${emoji} ${label} sent!` });
  };

  const handleDayClick = async (dateStr: string) => {
    if (!friendId) return;
    if (!privacySettings?.show_daily_logs) {
      toast({ title: "This user has made their logs private 🔒" });
      return;
    }
    const { data } = await supabase
      .from("daily_entries")
      .select("entry_date, tasks, mood, productivity_level, reflection")
      .eq("user_id", friendId)
      .eq("entry_date", dateStr);
    setSelectedDayLogs(data ?? []);
    setLogDialogOpen(true);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const showCalendar = privacySettings?.show_calendar !== false;
  const showBadges = privacySettings?.show_badges !== false;
  const showLogs = privacySettings?.show_daily_logs === true;
  const showStreak = privacySettings?.show_streak !== false;
  const showGarden = privacySettings?.show_garden !== false;

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const entryDateSet = new Set(entryDates.map((e) => e.entry_date));
  const entryMap = Object.fromEntries(entryDates.map((e) => [e.entry_date, e.productivity_level]));

  // Calculate stats from actual entry data
  const totalLoggedDays = entryDates.length;
  const highProductivityCount = entryDates.filter((e) => e.productivity_level === "high").length;

  const sortedDates = [...entryDates].map((e) => e.entry_date).sort().reverse();
  let streak = 0;
  if (sortedDates.length > 0) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const diff = (new Date(todayStr).getTime() - new Date(sortedDates[0]).getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 1) {
      streak = 1;
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const d = (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i + 1]).getTime()) / (1000 * 60 * 60 * 24);
        if (d === 1) streak++;
        else break;
      }
    }
  }

  // Determine if the friend missed recently (no entry yesterday or today)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  const missedRecently = totalLoggedDays > 0 && !entryDateSet.has(todayStr) && !entryDateSet.has(yesterdayStr);

  const unlockedBadges = ALL_BADGES.filter((b) => achievements.includes(b.id));

  const prevMonth = () => {
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear((y) => y - 1); }
    else setCalendarMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear((y) => y + 1); }
    else setCalendarMonth((m) => m + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center gap-3 py-3 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/friends")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Friends
          </Button>
        </div>
      </header>

      <main className="container max-w-2xl py-6 px-4 space-y-6 animate-fade-in">
        {/* Profile header */}
        <div className="rounded-xl border border-border/50 bg-card p-6 text-center space-y-2">
          <Avatar className="mx-auto h-20 w-20">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : null}
            <AvatarFallback className="text-2xl">{profile.display_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
          </Avatar>
          <h2 className="font-display text-xl font-bold">{profile.display_name || "Friend"}</h2>
          {bio && <p className="text-sm text-muted-foreground">{bio}</p>}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-2">
            {showStreak && (
              <span className="flex items-center gap-1">
                <Flame className="h-4 w-4 text-primary" /> {streak} day streak
              </span>
            )}
            <span>{totalLoggedDays} total days</span>
            <span>{highProductivityCount} high days</span>
          </div>

          {/* Encouragement buttons */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {ENCOURAGE_BUTTONS.map((btn) => (
              <Button
                key={btn.emoji}
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleEncourage(btn.emoji, btn.label, btn.message)}
              >
                <span className="text-lg">{btn.emoji}</span> {btn.label}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="calendar">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar" className="gap-1.5">
              <Calendar className="h-4 w-4" /> Logging Calendar
            </TabsTrigger>

            <TabsTrigger value="achievements" className="gap-1.5">
              <Award className="h-4 w-4" /> Achievement Wall
            </TabsTrigger>

            <TabsTrigger value="garden" className="gap-1.5">
              <Sprout className="h-4 w-4" /> Growth Garden
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4">
            {showCalendar ? (
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={prevMonth}>←</Button>
                  <p className="font-semibold text-sm">{MONTHS[calendarMonth]} {calendarYear}</p>
                  <Button variant="ghost" size="sm" onClick={nextMonth}>→</Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-[10px] text-muted-foreground font-medium py-1">{d}</div>
                  ))}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const hasEntry = entryDateSet.has(dateStr);
                    const level = entryMap[dateStr];
                    return (
                      <div
                        key={day}
                        onClick={() => hasEntry && handleDayClick(dateStr)}
                        className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          hasEntry ? "cursor-pointer hover:ring-2 ring-primary/30" : ""
                        } ${
                          hasEntry
                            ? level === "high"
                              ? "bg-productivity-high/20 text-productivity-high border border-productivity-high/30"
                              : level === "medium"
                              ? "bg-productivity-medium/20 text-productivity-medium border border-productivity-medium/30"
                              : "bg-destructive/10 text-destructive border border-destructive/20"
                            : "bg-muted/20 text-muted-foreground"
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {totalLoggedDays} total entries
                  {showLogs ? " · Click a logged day to view" : " · Journal content is private"}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
                <Lock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Calendar is hidden by this user's privacy settings.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="mt-4 space-y-4">
            {showBadges ? (
              unlockedBadges.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unlocked Achievements</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {unlockedBadges.map((badge) => (
                      <div key={badge.id} className="flex flex-col items-center gap-1.5 rounded-xl border border-primary/20 bg-gradient-to-b from-primary/10 to-primary/5 p-3 transition-all hover:shadow-md">
                        <span className="text-2xl">{badge.emoji}</span>
                        <p className="text-[11px] font-semibold text-center leading-tight">{badge.name}</p>
                        <p className="text-[9px] text-muted-foreground text-center">{badge.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No achievements unlocked yet.</p>
                </div>
              )
            ) : (
              <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
                <Lock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Achievements are hidden by this user's privacy settings.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="garden" className="mt-4">
            {showGarden ? (
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <GrowthGarden streak={streak} missedRecently={missedRecently} />
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
                <Lock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  Growth Garden is hidden by this user's privacy settings.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Day log dialog */}
        <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Day Logs</DialogTitle>
            </DialogHeader>
            {selectedDayLogs && selectedDayLogs.length > 0 ? (
              <div className="space-y-4">
                {selectedDayLogs.map((entry: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{entry.entry_date}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        entry.productivity_level === "high"
                          ? "bg-productivity-high/20 text-productivity-high"
                          : entry.productivity_level === "medium"
                          ? "bg-productivity-medium/20 text-productivity-medium"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {entry.productivity_level}
                      </span>
                    </div>
                    {entry.mood && (
                      <p className="text-sm text-muted-foreground">Mood: {entry.mood}</p>
                    )}
                    {Array.isArray(entry.tasks) && entry.tasks.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tasks</p>
                        {entry.tasks.map((t: any, ti: number) => (
                          <p key={ti} className="text-sm">• {t.description || t}</p>
                        ))}
                      </div>
                    )}
                    {entry.reflection && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reflection</p>
                        <p className="text-sm italic text-muted-foreground">{entry.reflection}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No logs found for this day.</p>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default FriendProfile;
