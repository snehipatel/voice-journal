
-- Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update handle_new_user to store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

-- Create mystery_rewards table
CREATE TABLE IF NOT EXISTS public.mystery_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  milestone_type text NOT NULL,
  milestone_value integer NOT NULL,
  reward_title text NOT NULL,
  reward_content text NOT NULL,
  is_unlocked boolean NOT NULL DEFAULT false,
  unlocked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_type, milestone_value)
);

ALTER TABLE public.mystery_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards"
ON public.mystery_rewards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards"
ON public.mystery_rewards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards"
ON public.mystery_rewards FOR UPDATE
USING (auth.uid() = user_id);

-- Friends can view unlocked rewards only
CREATE POLICY "Friends can view unlocked rewards"
ON public.mystery_rewards FOR SELECT
USING (
  is_unlocked = true AND
  EXISTS (
    SELECT 1 FROM friendships
    WHERE friendships.status = 'accepted'
    AND (
      (friendships.requester_id = auth.uid() AND friendships.addressee_id = mystery_rewards.user_id)
      OR (friendships.addressee_id = auth.uid() AND friendships.requester_id = mystery_rewards.user_id)
    )
  )
);

-- Allow friends to view friend's daily_entries (date + productivity only via RLS, content hidden by app logic)
CREATE POLICY "Friends can view friend entry dates"
ON public.daily_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM friendships
    WHERE friendships.status = 'accepted'
    AND (
      (friendships.requester_id = auth.uid() AND friendships.addressee_id = daily_entries.user_id)
      OR (friendships.addressee_id = auth.uid() AND friendships.requester_id = daily_entries.user_id)
    )
  )
);

-- Update profiles RLS: allow searching by email for any authenticated user
CREATE POLICY "Authenticated users can search profiles by email"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- Drop the old restrictive select policies that conflict
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Friends can view friend profiles" ON public.profiles;
