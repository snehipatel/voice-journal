
-- Add mood, reflection columns to daily_entries
ALTER TABLE public.daily_entries 
  ADD COLUMN IF NOT EXISTS mood text DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS reflection text;

-- Create voice_clips table for prerecorded personal voice clips
CREATE TABLE IF NOT EXISTS public.voice_clips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  productivity_level text NOT NULL CHECK (productivity_level IN ('high', 'medium', 'low')),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice clips"
  ON public.voice_clips FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice clips"
  ON public.voice_clips FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice clips"
  ON public.voice_clips FOR DELETE USING (auth.uid() = user_id);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  badge_id text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON public.achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage bucket for personal voice clips
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-clips', 'voice-clips', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own voice clips"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'voice-clips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own voice clips storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voice-clips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own voice clips storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'voice-clips' AND auth.uid()::text = (storage.foldername(name))[1]);
