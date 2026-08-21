-- 1) Lock down SECURITY DEFINER functions to server-side (service_role) only
REVOKE ALL ON FUNCTION public.claim_extension_device(text, text) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.increment_daily_activity(text, date, uuid, integer, integer, integer, integer, integer) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.claim_extension_device(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_daily_activity(text, date, uuid, integer, integer, integer, integer, integer) TO service_role;

-- 2) daily_activity: owner-scoped write policies
DROP POLICY IF EXISTS "Users can insert own activity" ON public.daily_activity;
CREATE POLICY "Users can insert own activity"
ON public.daily_activity FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own activity" ON public.daily_activity;
CREATE POLICY "Users can update own activity"
ON public.daily_activity FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.daily_activity TO authenticated;
GRANT ALL ON public.daily_activity TO service_role;

-- 3) extension_devices: owners can read their own linked devices
DROP POLICY IF EXISTS "Users can view own devices" ON public.extension_devices;
CREATE POLICY "Users can view own devices"
ON public.extension_devices FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlink own devices" ON public.extension_devices;
CREATE POLICY "Users can unlink own devices"
ON public.extension_devices FOR DELETE TO authenticated
USING (auth.uid() = user_id);

GRANT SELECT, DELETE ON public.extension_devices TO authenticated;
GRANT ALL ON public.extension_devices TO service_role;

-- 4) storage policies for the private linkedinextension bucket
DROP POLICY IF EXISTS "Authenticated users can read extension files" ON storage.objects;
CREATE POLICY "Authenticated users can read extension files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'linkedinextension');
