-- Run this in the Supabase SQL Editor to create tables for the LinkedIn extension.
-- The confido-key API routes use supabaseAdmin to write to these tables.

-- UUID generation helper
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User-scoped API keys generated from the settings page
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON public.api_keys (key);

-- Enable RLS on api_keys so users can only see their own keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own api keys" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Leads pipeline (synced from extension store.ts)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  headline TEXT,
  profile_url TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_device_id ON public.leads (device_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads (user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);

-- Messages for each lead
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_device_id ON public.messages (device_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages (lead_id);

-- Daily activity counters (upserted by date + device_id or date + user_id)
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL DEFAULT '',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  connections_sent INTEGER NOT NULL DEFAULT 0,
  comments_made INTEGER NOT NULL DEFAULT 0,
  posts_created INTEGER NOT NULL DEFAULT 0,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  messages_received INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_activity_device_date ON public.daily_activity (device_id, date) WHERE user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_activity_user_date ON public.daily_activity (user_id, date) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON public.daily_activity (date);

-- Dedup fingerprints (content hashes to prevent duplicate comments/posts)
CREATE TABLE IF NOT EXISTS public.fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fingerprint TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('comment', 'post')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fingerprints_user_id ON public.fingerprints (user_id);
CREATE INDEX IF NOT EXISTS idx_fingerprints_device_id ON public.fingerprints (device_id);

-- RLS policies for sync tables — authenticated users see their own data
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activity" ON public.daily_activity FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.fingerprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own fingerprints" ON public.fingerprints FOR SELECT USING (auth.uid() = user_id);

-- Helper function to generate a random API key
CREATE OR REPLACE FUNCTION generate_api_key() RETURNS TEXT AS $$
  SELECT 'sk-' || encode(gen_random_bytes(24), 'hex');
$$ LANGUAGE SQL;
