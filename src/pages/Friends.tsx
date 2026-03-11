import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, UserPlus, Check, X, ArrowLeft, Flame, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Friendship,
  FriendProfile,
  fetchFriendships,
  fetchFriendProfiles,
  searchUserByEmail,
  discoverUsers,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriendship,
  sendCheer,
  getFriendId,
} from "@/lib/friends";

const CHEER_EMOJIS = ["👏", "🔥", "💪", "❤️"];

const Friends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<FriendProfile[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<FriendProfile | null>(null);
  const [searchDone, setSearchDone] = useState(false);
  const [searching, setSearching] = useState(false);
  const [discoverList, setDiscoverList] = useState<FriendProfile[]>([]);
  const [sending, setSending] = useState<string | null>(null);

  const [avatarMap, setAvatarMap] = useState<Record<string, string | null>>({});

  const loadFriends = useCallback(async () => {
    if (!user) return;
    const data = await fetchFriendships(user.id);
    setFriendships(data);
    const friendIds = data
      .filter((f) => f.status === "accepted")
      .map((f) => getFriendId(f, user.id));
    if (friendIds.length > 0) {
      const profs = await fetchFriendProfiles(friendIds);
      setProfiles(profs);
      // Load avatars
      const { data: avatarData } = await supabase
        .from("profiles")
        .select("user_id, avatar_url")
        .in("user_id", friendIds);
      const map: Record<string, string | null> = {};
      (avatarData ?? []).forEach((p: any) => { map[p.user_id] = p.avatar_url; });
      setAvatarMap(map);
    } else {
      setProfiles([]);
    }
  }, [user]);

  const loadDiscover = useCallback(async () => {
    if (!user) return;
    const allFriendIds = friendships.map((f) => getFriendId(f, user.id));
    const pendingIds = friendships
      .filter((f) => f.status === "pending")
      .map((f) => getFriendId(f, user.id));
    const users = await discoverUsers(user.id, allFriendIds, pendingIds);
    setDiscoverList(users);
  }, [user, friendships]);

  useEffect(() => { loadFriends(); }, [loadFriends]);
  useEffect(() => { loadDiscover(); }, [loadDiscover]);

  const accepted = friendships.filter((f) => f.status === "accepted");
  const pendingReceived = friendships.filter(
    (f) => f.status === "pending" && f.addressee_id === user?.id
  );
  const pendingSent = friendships.filter(
    (f) => f.status === "pending" && f.requester_id === user?.id
  );
  const pendingAllIds = new Set(friendships.filter(f => f.status === "pending").map(f => getFriendId(f, user?.id ?? "")));
  const acceptedIds = new Set(accepted.map(f => getFriendId(f, user?.id ?? "")));

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchDone(false);
    setSearchResult(null);
    try {
      const result = await searchUserByEmail(searchEmail.trim());
      setSearchResult(result);
      setSearchDone(true);
    } catch {
      toast({ variant: "destructive", title: "Search failed" });
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (addresseeId: string) => {
    if (!user) return;
    if (addresseeId === user.id) {
      toast({ variant: "destructive", title: "That's you! 😄" });
      return;
    }
    setSending(addresseeId);
    try {
      await sendFriendRequest(user.id, addresseeId);
      toast({ title: "Friend request sent! 🤝" });
      await loadFriends();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err.message });
    } finally {
      setSending(null);
    }
  };

  const handleRespond = async (id: string, status: "accepted" | "declined") => {
    await respondToFriendRequest(id, status);
    toast({ title: status === "accepted" ? "Friend added! 🎉" : "Request declined" });
    await loadFriends();
  };

  const handleRemove = async (id: string) => {
    await removeFriendship(id);
    toast({ title: "Friend removed" });
    await loadFriends();
  };

  const handleCheer = async (receiverId: string, emoji: string) => {
    if (!user) return;
    await sendCheer(user.id, receiverId, emoji);
    toast({ title: `${emoji} Cheer sent!` });
  };

  const getProfile = (userId: string) => profiles.find((p) => p.user_id === userId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center gap-3 py-3 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="font-display text-lg font-bold">Friends & Accountability</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-6 px-4 space-y-6 animate-fade-in">
        {/* Pending requests banner */}
        {pendingReceived.length > 0 && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">{pendingReceived.length}</Badge>
              Pending friend requests
            </p>
            {pendingReceived.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg bg-card p-3 border border-border/50">
                <span className="text-sm text-muted-foreground">From: {f.requester_id.slice(0, 8)}...</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="default" onClick={() => handleRespond(f.id, "accepted")}>
                    <Check className="h-4 w-4" /> Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleRespond(f.id, "declined")}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">My Friends</TabsTrigger>
            <TabsTrigger value="search">Find Friend</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>

          {/* My Friends */}
          <TabsContent value="friends" className="space-y-3 mt-4">
            {accepted.length > 0 ? accepted.map((f) => {
              const friendId = getFriendId(f, user?.id ?? "");
              const profile = getProfile(friendId);
              return (
                <div key={f.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {avatarMap[friendId] ? <AvatarImage src={avatarMap[friendId]!} /> : null}
                        <AvatarFallback>{profile?.display_name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{profile?.display_name || "Friend"}</p>
                        <p className="text-xs text-muted-foreground">{profile?.email}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-primary" />
                            {profile?.total_logged_days ?? 0} days
                          </span>
                          <span>{profile?.high_productivity_count ?? 0} high</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/friends/${friendId}`)}>
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive text-xs" onClick={() => handleRemove(f.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
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
            }) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No friends yet. Search by email or discover users!</p>
              </div>
            )}
            {pendingSent.length > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {pendingSent.length} pending request{pendingSent.length !== 1 ? "s" : ""} sent
              </p>
            )}
          </TabsContent>

          {/* Search by Email */}
          <TabsContent value="search" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter friend's email address..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                type="email"
              />
              <Button onClick={handleSearch} disabled={searching}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {searchDone && !searchResult && (
              <p className="text-sm text-muted-foreground text-center py-4">No user found with that email.</p>
            )}
            {searchResult && (
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{searchResult.display_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{searchResult.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchResult.total_logged_days} days logged
                    </p>
                  </div>
                  {searchResult.user_id === user?.id ? (
                    <Badge variant="secondary">That's you!</Badge>
                  ) : acceptedIds.has(searchResult.user_id) ? (
                    <Badge variant="secondary">Already friends</Badge>
                  ) : pendingAllIds.has(searchResult.user_id) ? (
                    <Badge variant="secondary">Request pending</Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSendRequest(searchResult.user_id)}
                      disabled={sending === searchResult.user_id}
                    >
                      <UserPlus className="h-4 w-4 mr-1" /> Add Friend
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Discover */}
          <TabsContent value="discover" className="space-y-3 mt-4">
            {discoverList.length > 0 ? discoverList.map((u) => (
              <div key={u.user_id} className="rounded-xl border border-border/50 bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{u.display_name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{u.total_logged_days} days logged</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSendRequest(u.user_id)}
                  disabled={sending === u.user_id}
                >
                  <UserPlus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-8">No new users to discover right now.</p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Friends;
