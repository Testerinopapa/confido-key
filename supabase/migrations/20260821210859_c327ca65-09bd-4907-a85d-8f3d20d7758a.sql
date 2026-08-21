UPDATE public.leads SET user_id = 'c3c1b880-7494-4d48-8047-1561645b12b0' WHERE user_id IS NULL;
UPDATE public.messages SET user_id = 'c3c1b880-7494-4d48-8047-1561645b12b0' WHERE user_id IS NULL;

CREATE TEMP TABLE agg AS
  SELECT date,
         SUM(connections_sent)::int cs, SUM(comments_made)::int cm, SUM(posts_created)::int pc,
         SUM(messages_sent)::int ms, SUM(messages_received)::int mr
  FROM public.daily_activity WHERE user_id IS NULL GROUP BY date;

DELETE FROM public.daily_activity WHERE user_id IS NULL;

UPDATE public.daily_activity d SET
  connections_sent = d.connections_sent + a.cs,
  comments_made = d.comments_made + a.cm,
  posts_created = d.posts_created + a.pc,
  messages_sent = d.messages_sent + a.ms,
  messages_received = d.messages_received + a.mr
FROM agg a
WHERE d.user_id = 'c3c1b880-7494-4d48-8047-1561645b12b0' AND d.date = a.date;

INSERT INTO public.daily_activity (device_id, user_id, date, connections_sent, comments_made, posts_created, messages_sent, messages_received)
SELECT 'merged-extension', 'c3c1b880-7494-4d48-8047-1561645b12b0', a.date, a.cs, a.cm, a.pc, a.ms, a.mr
FROM agg a
WHERE NOT EXISTS (
  SELECT 1 FROM public.daily_activity d
  WHERE d.user_id = 'c3c1b880-7494-4d48-8047-1561645b12b0' AND d.date = a.date
);