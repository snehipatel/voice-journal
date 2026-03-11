import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload, Loader2, Music } from "lucide-react";
import { VoiceClip, fetchVoiceClips, uploadVoiceClip, deleteVoiceClip, getSignedVoiceUrl } from "@/lib/journal";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VoiceClipManagerProps {
  userId: string;
  clips: VoiceClip[];
  onClipsChange: (clips: VoiceClip[]) => void;
}

const LEVEL_LABELS = {
  high: { label: "High Productivity 🟢", color: "bg-productivity-high text-white" },
  medium: { label: "Medium Productivity 🟡", color: "bg-productivity-medium text-white" },
  low: { label: "Low / Rest Day 🔴", color: "bg-destructive/80 text-white" },
};

export const VoiceClipManager = ({ userId, clips, onClipsChange }: VoiceClipManagerProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<"high" | "medium" | "low">("high");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const uploadedClips: VoiceClip[] = [];

      for (const file of files) {
        if (!file.type.startsWith("audio/")) {
          toast({
            variant: "destructive",
            title: `${file.name} is not a valid audio file`,
          });
          continue;
        }

        const clip = await uploadVoiceClip(userId, file, selectedLevel);
        uploadedClips.push(clip);
      }

      if (uploadedClips.length > 0) {
        onClipsChange([...uploadedClips, ...clips]);
        toast({
          title: `${uploadedClips.length} voice clip${uploadedClips.length > 1 ? "s" : ""} uploaded! 🎙️`,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err.message,
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (clip: VoiceClip) => {
    try {
      await deleteVoiceClip(clip);
      onClipsChange(clips.filter((c) => c.id !== clip.id));
      toast({ title: "Clip removed" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete failed", description: err.message });
    }
  };

  const handlePlay = async (clip: VoiceClip) => {
    setPlayingId(clip.id);
    try {
      const url = await getSignedVoiceUrl(clip.storage_path);
      if (!url) throw new Error("No URL");
      const audio = new Audio(url);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => setPlayingId(null);
      await audio.play();
    } catch {
      setPlayingId(null);
      toast({ variant: "destructive", title: "Could not play clip" });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Music className="mr-1 h-4 w-4" /> Manage Voice Clips
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">🎙️ Personal Voice Clips</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload section */}
          <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
            <p className="text-sm font-medium">Upload a new clip</p>
            <div className="flex gap-2">
              <Select value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as any)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEVEL_LABELS).map(([val, { label }]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="shrink-0"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="ml-1">{uploading ? "Uploading..." : "Choose File"}</span>
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Upload MP3 or M4A files. One will be randomly played after saving a daily entry matching that productivity level.
            </p>
          </div>

          {/* Clips list by level */}
          {(["high", "medium", "low"] as const).map((level) => {
            const levelClips = clips.filter((c) => c.productivity_level === level);
            if (levelClips.length === 0) return null;
            return (
              <div key={level} className="space-y-2">
                <Badge className={LEVEL_LABELS[level].color}>{LEVEL_LABELS[level].label}</Badge>
                <div className="space-y-2">
                  {levelClips.map((clip) => (
                    <div
                      key={clip.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Music className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate">{clip.file_name}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePlay(clip)}
                          disabled={playingId === clip.id}
                          className="h-7 px-2 text-xs"
                        >
                          {playingId === clip.id ? "▶ Playing..." : "▶ Play"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(clip)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {clips.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Music className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No clips yet. Upload your first motivational voice message!
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
