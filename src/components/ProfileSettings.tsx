import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Camera } from "lucide-react";

export const ProfileSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Privacy settings
  const [showDailyLogs, setShowDailyLogs] = useState(false);
  const [showBadges, setShowBadges] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStreak, setShowStreak] = useState(true);
  const [showGarden, setShowGarden] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    if (!user || !open) return;
    // Load profile
    supabase.from("profiles").select("display_name, bio, avatar_url").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || "");
          setBio((data as any).bio || "");
          setAvatarUrl((data as any).avatar_url || null);
        }
      });
    // Load privacy settings
    supabase.from("privacy_settings").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setShowDailyLogs(data.show_daily_logs);
          setShowBadges(data.show_badges);
          setShowCalendar(data.show_calendar);
          setShowStreak(data.show_streak);
          setShowGarden(data.show_garden);
          setEmailNotifications((data as any).email_notifications ?? true);
        }
      });
  }, [user, open]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = urlData.publicUrl + "?t=" + Date.now();
      setAvatarUrl(url);
      await supabase.from("profiles").update({ avatar_url: url } as any).eq("user_id", user.id);
      toast({ title: "Avatar updated! 📸" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      } as any).eq("user_id", user.id);

      await supabase.from("privacy_settings").upsert({
        user_id: user.id,
        show_daily_logs: showDailyLogs,
        show_badges: showBadges,
        show_calendar: showCalendar,
        show_streak: showStreak,
        show_garden: showGarden,
        email_notifications: emailNotifications,
      } as any, { onConflict: "user_id" });

      toast({ title: "Settings saved! ✅" });
      setOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save failed", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors">
          <Settings className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Profile & Privacy</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-20 w-20 overflow-hidden">
                {avatarUrl ? (
                  <AvatarImage
                    src={avatarUrl}
                    alt="Avatar"
                    className="object-cover object-center w-full h-full"
                  />
                ) : null}
                <AvatarFallback className="text-2xl">{displayName?.[0]?.toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            <p className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Click to change avatar"}</p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label>About Me</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 150))}
              placeholder="Write a short bio..."
              maxLength={150}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/150</p>
          </div>

          {/* Privacy */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Privacy Controls</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Show logs to friends</p>
                  <p className="text-xs text-muted-foreground">Friends can view your daily logs</p>
                </div>
                <Switch checked={showDailyLogs} onCheckedChange={setShowDailyLogs} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Show achievements to friends</p>
                  <p className="text-xs text-muted-foreground">Friends can see your achievement wall</p>
                </div>
                <Switch checked={showBadges} onCheckedChange={setShowBadges} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Show calendar</p>
                  <p className="text-xs text-muted-foreground">Friends can see your logging calendar</p>
                </div>
                <Switch checked={showCalendar} onCheckedChange={setShowCalendar} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Show streak</p>
                  <p className="text-xs text-muted-foreground">Friends can see your streak count</p>
                </div>
                <Switch checked={showStreak} onCheckedChange={setShowStreak} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Show garden</p>
                  <p className="text-xs text-muted-foreground">Friends can see your growth garden</p>
                </div>
                <Switch checked={showGarden} onCheckedChange={setShowGarden} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive emails for encouragement, reminders & reactions</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
