-- ============================================================================
-- MAHORAPEAK CANLI DESTEK & VIP ÖNCELİKLİ YARDIM MASASI V2
-- ============================================================================

-- 1. Destek Biletleri Tablosu
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_name TEXT NOT NULL DEFAULT 'Misafir',
    user_avatar TEXT,
    user_email TEXT,
    plan_id TEXT DEFAULT 'free', -- 'aethe', 'shadow', 'ruler', 'pro', 'free'
    priority INTEGER DEFAULT 50,  -- Aethe: 1000, Shadow: 500, Pro: 250, Free: 50, Guest: 10
    status TEXT DEFAULT 'waiting_admin', -- 'bot', 'waiting_admin', 'in_progress', 'resolved'
    subject TEXT DEFAULT 'Genel Yardım',
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    unread_user BOOLEAN DEFAULT false,
    unread_admin BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Destek Mesajları Tablosu
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender TEXT NOT NULL, -- 'user', 'bot', 'admin'
    sender_name TEXT NOT NULL,
    sender_avatar TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS Aktifleştirme
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- 4. Herkesin okuyup yazabilmesi için esnek politikalar (Anonim ve Giriş Yapmış)
DROP POLICY IF EXISTS "Public support tickets access" ON support_tickets;
CREATE POLICY "Public support tickets access" ON support_tickets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public support messages access" ON support_messages;
CREATE POLICY "Public support messages access" ON support_messages FOR ALL USING (true) WITH CHECK (true);

-- 5. VIP Öncelik ve Zaman İndeksleri
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority_created ON support_tickets(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id, created_at ASC);

-- 6. Realtime Yayınları
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
