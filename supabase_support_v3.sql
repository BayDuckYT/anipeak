-- MahoraPeak support schema repair (V3)
-- Safe to run on an existing installation: adds missing columns and preserves tickets/messages.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_name TEXT NOT NULL DEFAULT 'Misafir',
  user_avatar TEXT,
  user_email TEXT,
  plan_id TEXT DEFAULT 'free',
  priority INTEGER DEFAULT 50,
  status TEXT DEFAULT 'waiting_admin',
  subject TEXT DEFAULT 'Genel Yardım',
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  unread_user BOOLEAN DEFAULT false,
  unread_admin BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID,
  sender TEXT DEFAULT 'user',
  sender_name TEXT NOT NULL DEFAULT 'Kullanıcı',
  sender_avatar TEXT,
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CREATE TABLE IF NOT EXISTS does not repair tables created by older app versions.
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT 'Misafir',
  ADD COLUMN IF NOT EXISTS user_avatar TEXT,
  ADD COLUMN IF NOT EXISTS user_email TEXT,
  ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'waiting_admin',
  ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'Genel Yardım',
  ADD COLUMN IF NOT EXISTS last_message TEXT,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS unread_user BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS unread_admin BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS ticket_id UUID,
  ADD COLUMN IF NOT EXISTS sender TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS sender_name TEXT DEFAULT 'Kullanıcı',
  ADD COLUMN IF NOT EXISTS sender_avatar TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Copy data from names used by older support schema versions when those columns exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='support_tickets' AND column_name='user_plan') THEN
    EXECUTE $q$UPDATE public.support_tickets SET plan_id = COALESCE(NULLIF(user_plan, ''), plan_id, 'free') WHERE plan_id IS NULL OR plan_id = 'free'$q$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='support_messages' AND column_name='sender_type') THEN
    EXECUTE $q$UPDATE public.support_messages SET sender = COALESCE(NULLIF(sender_type, ''), sender, 'user') WHERE sender IS NULL OR sender = 'user'$q$;
  END IF;
END $$;

UPDATE public.support_tickets SET
  id = COALESCE(id, gen_random_uuid()),
  user_name = COALESCE(NULLIF(user_name, ''), 'Misafir'),
  plan_id = COALESCE(NULLIF(plan_id, ''), 'free'),
  priority = COALESCE(priority, 50),
  status = COALESCE(NULLIF(status, ''), 'waiting_admin'),
  subject = COALESCE(NULLIF(subject, ''), 'Genel Yardım'),
  last_message_at = COALESCE(last_message_at, created_at, now()),
  unread_user = COALESCE(unread_user, false),
  unread_admin = COALESCE(unread_admin, true),
  created_at = COALESCE(created_at, now());

UPDATE public.support_messages SET
  id = COALESCE(id, gen_random_uuid()),
  sender = COALESCE(NULLIF(sender, ''), 'user'),
  sender_name = COALESCE(NULLIF(sender_name, ''), 'Kullanıcı'),
  message = COALESCE(message, ''),
  created_at = COALESCE(created_at, now());

CREATE UNIQUE INDEX IF NOT EXISTS idx_support_tickets_id_v3 ON public.support_tickets(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_support_messages_id_v3 ON public.support_messages(id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority_created ON public.support_tickets(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id, created_at ASC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Keep the current app's anonymous and authenticated ticket workflow working.
DROP POLICY IF EXISTS "Public support tickets access" ON public.support_tickets;
CREATE POLICY "Public support tickets access" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public support messages access" ON public.support_messages;
CREATE POLICY "Public support messages access" ON public.support_messages FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO anon, authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
