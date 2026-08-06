-- Idempotent migration — safe to run regardless of current DB state.
-- Handles: fresh DB, partially migrated, or tables missing user_id column.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Tables (create if missing, with all columns) ──

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID,
  name TEXT NOT NULL,
  headline TEXT,
  profile_url TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL DEFAULT '',
  user_id UUID,
  date DATE NOT NULL,
  connections_sent INTEGER NOT NULL DEFAULT 0,
  comments_made INTEGER NOT NULL DEFAULT 0,
  posts_created INTEGER NOT NULL DEFAULT 0,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  messages_received INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID,
  fingerprint TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('comment', 'post')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Add user_id to tables that exist but lack the column ──

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('leads', 'messages', 'daily_activity', 'fingerprints')
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = information_schema.tables.table_name
          AND column_name = 'user_id'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN user_id UUID;', r.table_name);
  END LOOP;
END $$;

-- ── Indexes ──

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON public.api_keys (key);

CREATE INDEX IF NOT EXISTS idx_leads_device_id ON public.leads (device_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads (user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);

CREATE INDEX IF NOT EXISTS idx_messages_device_id ON public.messages (device_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages (lead_id);

ALTER TABLE public.daily_activity DROP CONSTRAINT IF EXISTS daily_activity_device_id_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_activity_device_date ON public.daily_activity (device_id, date) WHERE user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_activity_user_date ON public.daily_activity (user_id, date) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON public.daily_activity (date);

CREATE INDEX IF NOT EXISTS idx_fingerprints_user_id ON public.fingerprints (user_id);
CREATE INDEX IF NOT EXISTS idx_fingerprints_device_id ON public.fingerprints (device_id);

-- ── RLS ──

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fingerprints ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies (idempotent) ──

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own api keys') THEN
    CREATE POLICY "Users can manage own api keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own leads') THEN
    CREATE POLICY "Users can view own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own messages') THEN
    CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own activity') THEN
    CREATE POLICY "Users can view own activity" ON public.daily_activity FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own fingerprints') THEN
    CREATE POLICY "Users can view own fingerprints" ON public.fingerprints FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
