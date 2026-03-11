CREATE POLICY "Friends can view friend privacy settings"
ON public.privacy_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM friendships
    WHERE friendships.status = 'accepted'
    AND (
      (friendships.requester_id = auth.uid() AND friendships.addressee_id = privacy_settings.user_id)
      OR
      (friendships.addressee_id = auth.uid() AND friendships.requester_id = privacy_settings.user_id)
    )
  )
);