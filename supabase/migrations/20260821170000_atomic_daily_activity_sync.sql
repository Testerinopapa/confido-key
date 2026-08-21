-- Keep extension activity increments atomic so concurrent sync requests cannot
-- overwrite one another's counters.

CREATE OR REPLACE FUNCTION public.increment_daily_activity(
  p_device_id TEXT,
  p_date DATE,
  p_connections_sent INTEGER DEFAULT 0,
  p_comments_made INTEGER DEFAULT 0,
  p_posts_created INTEGER DEFAULT 0,
  p_messages_sent INTEGER DEFAULT 0,
  p_messages_received INTEGER DEFAULT 0
)
RETURNS public.daily_activity
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.daily_activity (
    device_id,
    user_id,
    date,
    connections_sent,
    comments_made,
    posts_created,
    messages_sent,
    messages_received
  )
  VALUES (
    p_device_id,
    NULL,
    p_date,
    COALESCE(p_connections_sent, 0),
    COALESCE(p_comments_made, 0),
    COALESCE(p_posts_created, 0),
    COALESCE(p_messages_sent, 0),
    COALESCE(p_messages_received, 0)
  )
  ON CONFLICT (device_id, date) WHERE user_id IS NULL
  DO UPDATE SET
    connections_sent = daily_activity.connections_sent + EXCLUDED.connections_sent,
    comments_made = daily_activity.comments_made + EXCLUDED.comments_made,
    posts_created = daily_activity.posts_created + EXCLUDED.posts_created,
    messages_sent = daily_activity.messages_sent + EXCLUDED.messages_sent,
    messages_received = daily_activity.messages_received + EXCLUDED.messages_received
  RETURNING *;
$$;

REVOKE ALL ON FUNCTION public.increment_daily_activity(TEXT, DATE, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_daily_activity(TEXT, DATE, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO service_role;
