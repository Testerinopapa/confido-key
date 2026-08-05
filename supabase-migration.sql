-- Run this in the Supabase SQL Editor to create tables for the LinkedIn extension.
-- The confido-key API routes use supabaseAdmin to write to these tables.

-- UUID generation helper
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Leads pipeline (synced from extension store.ts)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  headline TEXT,
  profile_url TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_device_id ON public.leads (device_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);

-- Messages for each lead
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_device_id ON public.messages (device_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages (lead_id);

-- Daily activity counters (upserted by date + device_id)
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  date DATE NOT NULL,
  connections_sent INTEGER NOT NULL DEFAULT 0,
  comments_made INTEGER NOT NULL DEFAULT 0,
  posts_created INTEGER NOT NULL DEFAULT 0,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  messages_received INTEGER NOT NULL DEFAULT 0,
  UNIQUE (device_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_activity_device_id ON public.daily_activity (device_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON public.daily_activity (date);
