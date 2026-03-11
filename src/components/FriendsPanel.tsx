import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, UserPlus, Check, X, Sparkles } from "lucide-react";
import {
  Friendship,
  FriendProfile,
  fetchFriendships,
  respondToFriendRequest,
  removeFriendship,
  fetchFriendProfiles,
  sendCheer,
  getFriendId,
} from "@/lib/friends";
import { supabase } from "@/integrations/supabase/client";

const CHEER_EMOJIS = ["👏", "🔥", "💪", "❤️"];

export const FriendsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<FriendProfile[]>([]);
  const [friendEmail, setFriendEmail] = useState("");
  const [sending, setSending] = useState(false);

  const loadFriends = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchFriendships(user.id);
      setFriendships(data);
      const friendIds = data
        .filter((f) => f.status === "accepted")
        .map((f) => getFriendId(f, user.id));
      if (friendIds.length > 0) {
        const profs = await fetchFriendProfiles(friendIds);
        setProfiles(profs);
      }
    } catch {}
  }, [user]);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  const accepted = friendships.filter((f) => f.status === "accepted");
  const pendingReceived = friendships.filter(
    (f) => f.status === "pending" && f.addressee_id === user?.id
  );
  const pendingSent = friendships.filter(
    (f) => f.status === "pending" && f.requester_id === user?.id
  );

  const handleSendRequest = async () => {
    if (!user || !friendEmail.trim()) return;
    setSending(true);
    try {
      // Look up user by email via profiles display_name (simplified — in production use edge function)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("display_name", friendEmail.trim())
        .maybeSingle();

      if (!profileData) {
        toast({ variant: "destructive", title: "User not found", description: "Check the display name and try again." });
        setSending(false);
        return;
      }

      if (profileData.user_id === user.id) {
        toast({ variant: "destructive", title: "That's you! 😄" });
        setSending(false);
        return;
      }

      await supabase
        .from("friendships")
        .insert({ requester_id: user.id, addressee_id: profileData.user_id });

      toast({ title: "Friend request sent! 🤝" });
      setFriendEmail("");
      await loadFriends();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to send request", description: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleRespond = async (id: string, status: "accepted" | "declined") => {
    try {
      await respondToFriendRequest(id, status);
      toast({ title: status === "accepted" ? "Friend added! 🎉" : "Request declined" });
      await loadFriends();
    } catch {
      toast({ variant: "destructive", title: "Failed to respond" });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeFriendship(id);
      toast({ title: "Friend removed" });
      await loadFriends();
    } catch {}
  };

  const handleCheer = async (receiverId: string, emoji: string) => {
    if (!user) return;
    try {
      await sendCheer(user.id, receiverId, emoji);
      toast({ title: `${emoji} Cheer sent!` });
    } catch {}
  };

  const getProfile = (userId: string) => profiles.find((p) => p.user_id === userId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Friends</span>
          {pendingReceived.length > 0 && (
            <Badge className="bg-primary text-primary-foreground h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {pendingReceived.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Users className="h-5 w-5" /> Friends & Accountability
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add friend */}
          <div className="flex gap-2">
            <Input
              placeholder="Friend's display name..."
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
            />
            <Button onClick={handleSendRequest} disabled={sending} size="sm">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>

          {/* Pending received */}
          {pendingReceived.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Pending Requests</p>
              {pendingReceived.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-3">
                  <span className="text-sm">From: {f.requester_id.slice(0, 8)}...</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleRespond(f.id, "accepted")}>
                      <Check className="h-4 w-4 text-accent" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRespond(f.id, "declined")}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Friends list */}
          {accepted.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Your Friends</p>
              {accepted.map((f) => {
                const friendId = getFriendId(f, user?.id ?? "");
                const profile = getProfile(friendId);
                return (
                  <div key={f.id} className="rounded-lg border border-border/50 bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{profile?.display_name || "Friend"}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.total_logged_days ?? 0} days · {profile?.high_productivity_count ?? 0} high
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-destructive"
                        onClick={() => handleRemove(f.id)}
                      >
                        Remove
                      </Button>
                    </div>
                    {/* Cheer reactions */}
                    <div className="flex gap-2">
                      {CHEER_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleCheer(friendId, emoji)}
                          className="text-lg hover:scale-125 active:scale-90 transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No friends yet. Add someone to start cheering each other on!
            </div>
          )}

          {pendingSent.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {pendingSent.length} pending request{pendingSent.length !== 1 ? "s" : ""} sent
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
