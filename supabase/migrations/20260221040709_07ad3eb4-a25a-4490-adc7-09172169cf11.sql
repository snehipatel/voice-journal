
-- Create friendships table for friend requests and connections
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  addressee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);

-- Privacy settings per user
CREATE TABLE public.privacy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  show_streak BOOLEAN NOT NULL DEFAULT true,
  show_garden BOOLEAN NOT NULL DEFAULT true,
  show_badges BOOLEAN NOT NULL DEFAULT true,
  show_calendar BOOLEAN NOT NULL DEFAULT false,
  show_daily_logs BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cheer reactions between friends
CREATE TABLE public.cheer_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheer_reactions ENABLE ROW LEVEL SECURITY;

-- Friendships policies
CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they're part of"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

CREATE POLICY "Users can delete their own friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Privacy settings policies
CREATE POLICY "Users can view own privacy settings"
  ON public.privacy_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings"
  ON public.privacy_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings"
  ON public.privacy_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Cheer reactions policies
CREATE POLICY "Users can view cheers they sent or received"
  ON public.cheer_reactions FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send cheers"
  ON public.cheer_reactions FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Friends can view each other's profiles (read-only shared view)
CREATE POLICY "Friends can view friend profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.friendships
      WHERE status = 'accepted'
      AND (
        (requester_id = auth.uid() AND addressee_id = user_id)
        OR (addressee_id = auth.uid() AND requester_id = user_id)
      )
    )
  );

-- Friends can view each other's achievements
CREATE POLICY "Friends can view friend achievements"
  ON public.achievements FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.friendships
      WHERE status = 'accepted'
      AND (
        (requester_id = auth.uid() AND addressee_id = user_id)
        OR (addressee_id = auth.uid() AND requester_id = user_id)
      )
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON public.privacy_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
