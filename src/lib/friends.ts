import { supabase } from "@/integrations/supabase/client";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export interface FriendProfile {
  user_id: string;
  display_name: string | null;
  email: string | null;
  total_logged_days: number;
  high_productivity_count: number;
}

export interface CheerReaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  emoji: string;
  created_at: string;
}

export async function fetchFriendships(userId: string): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Friendship[];
}

export async function sendFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: requesterId, addressee_id: addresseeId });
  if (error) throw error;
}

export async function respondToFriendRequest(
  friendshipId: string,
  status: "accepted" | "declined"
): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .update({ status })
    .eq("id", friendshipId);
  if (error) throw error;
}

export async function removeFriendship(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);
  if (error) throw error;
}

export async function fetchFriendProfiles(friendUserIds: string[]): Promise<FriendProfile[]> {
  if (friendUserIds.length === 0) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, total_logged_days, high_productivity_count")
    .in("user_id", friendUserIds);
  if (error) throw error;
  return (data ?? []) as FriendProfile[];
}

export async function searchUserByEmail(email: string): Promise<FriendProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, total_logged_days, high_productivity_count")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data as FriendProfile | null;
}

export async function discoverUsers(
  currentUserId: string,
  friendIds: string[],
  pendingIds: string[],
  limit = 20,
  offset = 0
): Promise<FriendProfile[]> {
  const excludeIds = [currentUserId, ...friendIds, ...pendingIds];
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, total_logged_days, high_productivity_count")
    .not("user_id", "in", `(${excludeIds.join(",")})`)
    .order("total_logged_days", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as FriendProfile[];
}

export async function fetchFriendEntryDates(friendUserId: string): Promise<{ entry_date: string; productivity_level: string }[]> {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("entry_date, productivity_level")
    .eq("user_id", friendUserId)
    .order("entry_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as { entry_date: string; productivity_level: string }[];
}

export async function fetchFriendAchievements(friendUserId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("achievements")
    .select("badge_id")
    .eq("user_id", friendUserId);
  if (error) throw error;
  return (data ?? []).map((a) => a.badge_id);
}

export async function sendCheer(senderId: string, receiverId: string, emoji: string): Promise<void> {
  const { error } = await supabase
    .from("cheer_reactions")
    .insert({ sender_id: senderId, receiver_id: receiverId, emoji });
  if (error) throw error;
}

export async function fetchRecentCheers(userId: string): Promise<CheerReaction[]> {
  const { data, error } = await supabase
    .from("cheer_reactions")
    .select("*")
    .eq("receiver_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as CheerReaction[];
}

export function getFriendId(friendship: Friendship, myId: string): string {
  return friendship.requester_id === myId ? friendship.addressee_id : friendship.requester_id;
}
