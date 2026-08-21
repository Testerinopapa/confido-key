-- Extension sync is device-scoped. Authenticated users can view rows that
-- were written without a service API key, as well as rows they own.

DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
CREATE POLICY "Users can view synced leads" ON public.leads
  FOR SELECT TO authenticated USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view synced messages" ON public.messages
  FOR SELECT TO authenticated USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own activity" ON public.daily_activity;
CREATE POLICY "Users can view synced activity" ON public.daily_activity
  FOR SELECT TO authenticated USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own fingerprints" ON public.fingerprints;
CREATE POLICY "Users can view synced fingerprints" ON public.fingerprints
  FOR SELECT TO authenticated USING (user_id IS NULL OR auth.uid() = user_id);
