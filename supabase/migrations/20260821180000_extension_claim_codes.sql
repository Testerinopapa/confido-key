-- One-time extension claim codes connect a browser device to an account.

CREATE TABLE IF NOT EXISTS public.extension_claim_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.extension_devices (
  device_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.extension_claim_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extension_devices ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.extension_claim_codes TO service_role;
GRANT ALL ON public.extension_devices TO service_role;

DROP POLICY IF EXISTS "Users can view synced leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
CREATE POLICY "Users can view claimed leads" ON public.leads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view synced messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view claimed messages" ON public.messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view synced activity" ON public.daily_activity;
DROP POLICY IF EXISTS "Users can view own activity" ON public.daily_activity;
CREATE POLICY "Users can view claimed activity" ON public.daily_activity
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view synced fingerprints" ON public.fingerprints;
DROP POLICY IF EXISTS "Users can view own fingerprints" ON public.fingerprints;
CREATE POLICY "Users can view claimed fingerprints" ON public.fingerprints
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP FUNCTION IF EXISTS public.increment_daily_activity(TEXT, DATE, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.increment_daily_activity(
  p_device_id TEXT,
  p_date DATE,
  p_user_id UUID DEFAULT NULL,
  p_connections_sent INTEGER DEFAULT 0,
  p_comments_made INTEGER DEFAULT 0,
  p_posts_created INTEGER DEFAULT 0,
  p_messages_sent INTEGER DEFAULT 0,
  p_messages_received INTEGER DEFAULT 0
)
RETURNS public.daily_activity
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.daily_activity;
BEGIN
  IF p_user_id IS NULL THEN
    INSERT INTO public.daily_activity (
      device_id, user_id, date, connections_sent, comments_made,
      posts_created, messages_sent, messages_received
    )
    VALUES (
      p_device_id, NULL, p_date, COALESCE(p_connections_sent, 0), COALESCE(p_comments_made, 0),
      COALESCE(p_posts_created, 0), COALESCE(p_messages_sent, 0), COALESCE(p_messages_received, 0)
    )
    ON CONFLICT (device_id, date) WHERE user_id IS NULL
    DO UPDATE SET
      connections_sent = public.daily_activity.connections_sent + EXCLUDED.connections_sent,
      comments_made = public.daily_activity.comments_made + EXCLUDED.comments_made,
      posts_created = public.daily_activity.posts_created + EXCLUDED.posts_created,
      messages_sent = public.daily_activity.messages_sent + EXCLUDED.messages_sent,
      messages_received = public.daily_activity.messages_received + EXCLUDED.messages_received
    RETURNING * INTO v_row;
  ELSE
    INSERT INTO public.daily_activity (
      device_id, user_id, date, connections_sent, comments_made,
      posts_created, messages_sent, messages_received
    )
    VALUES (
      p_device_id, p_user_id, p_date, COALESCE(p_connections_sent, 0), COALESCE(p_comments_made, 0),
      COALESCE(p_posts_created, 0), COALESCE(p_messages_sent, 0), COALESCE(p_messages_received, 0)
    )
    ON CONFLICT (user_id, date) WHERE user_id IS NOT NULL
    DO UPDATE SET
      connections_sent = public.daily_activity.connections_sent + EXCLUDED.connections_sent,
      comments_made = public.daily_activity.comments_made + EXCLUDED.comments_made,
      posts_created = public.daily_activity.posts_created + EXCLUDED.posts_created,
      messages_sent = public.daily_activity.messages_sent + EXCLUDED.messages_sent,
      messages_received = public.daily_activity.messages_received + EXCLUDED.messages_received
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_extension_device(
  p_code_hash TEXT,
  p_device_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_existing_user_id UUID;
  v_activity RECORD;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.extension_claim_codes
  WHERE code_hash = p_code_hash
    AND redeemed_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired extension code';
  END IF;

  SELECT user_id INTO v_existing_user_id
  FROM public.extension_devices
  WHERE device_id = p_device_id;

  IF v_existing_user_id IS NOT NULL AND v_existing_user_id <> v_user_id THEN
    RAISE EXCEPTION 'Extension device is already linked to another user';
  END IF;

  INSERT INTO public.extension_devices (device_id, user_id)
  VALUES (p_device_id, v_user_id)
  ON CONFLICT (device_id) DO UPDATE SET user_id = EXCLUDED.user_id, claimed_at = now();

  UPDATE public.extension_claim_codes
  SET redeemed_at = now(), redeemed_device_id = p_device_id
  WHERE code_hash = p_code_hash;

  UPDATE public.leads SET user_id = v_user_id
  WHERE device_id = p_device_id AND user_id IS NULL;

  UPDATE public.messages SET user_id = v_user_id
  WHERE device_id = p_device_id AND user_id IS NULL;

  UPDATE public.fingerprints SET user_id = v_user_id
  WHERE device_id = p_device_id AND user_id IS NULL;

  FOR v_activity IN
    SELECT date AS activity_date, connections_sent, comments_made, posts_created,
           messages_sent, messages_received
    FROM public.daily_activity
    WHERE device_id = p_device_id AND user_id IS NULL
  LOOP
    INSERT INTO public.daily_activity (
      device_id, user_id, date, connections_sent, comments_made,
      posts_created, messages_sent, messages_received
    )
    VALUES (
      p_device_id, v_user_id, v_activity.activity_date, v_activity.connections_sent,
      v_activity.comments_made, v_activity.posts_created, v_activity.messages_sent,
      v_activity.messages_received
    )
    ON CONFLICT (user_id, date) WHERE user_id IS NOT NULL
    DO UPDATE SET
      connections_sent = public.daily_activity.connections_sent + EXCLUDED.connections_sent,
      comments_made = public.daily_activity.comments_made + EXCLUDED.comments_made,
      posts_created = public.daily_activity.posts_created + EXCLUDED.posts_created,
      messages_sent = public.daily_activity.messages_sent + EXCLUDED.messages_sent,
      messages_received = public.daily_activity.messages_received + EXCLUDED.messages_received;
  END LOOP;

  DELETE FROM public.daily_activity
  WHERE device_id = p_device_id AND user_id IS NULL;

  RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_daily_activity(TEXT, DATE, UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_daily_activity(TEXT, DATE, UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO service_role;
REVOKE ALL ON FUNCTION public.claim_extension_device(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_extension_device(TEXT, TEXT) TO service_role;
