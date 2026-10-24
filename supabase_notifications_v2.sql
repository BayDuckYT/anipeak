-- ═══════════════════════════════════════════════════════════════════════
-- MahoraPeak Bildirim Sistemi v2
-- Supabase Dashboard > SQL Editor > New Query > Yapıştır & Çalıştır
-- Güvenle tekrar çalıştırılabilir (idempotent).
-- ═══════════════════════════════════════════════════════════════════════

-- 1. DUYURULAR: zengin içerik, hedef kitle, sabitleme, süre sonu
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS title       TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS link        TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url   TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS audience    TEXT        NOT NULL DEFAULT 'all';   -- all | premium | staff
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS pinned      BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority    TEXT        NOT NULL DEFAULT 'normal'; -- normal | high
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at  TIMESTAMPTZ;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by  UUID;

CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned  ON announcements(pinned) WHERE pinned = TRUE;

-- 2. KİŞİSEL BİLDİRİMLER: başlık, bağlantı, bölüm numarası
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title       TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link        TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS image_url   TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS chapter_num NUMERIC;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- 3. PROFİL: tercih ve okundu alanları (zaten varsa dokunmaz)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_settings JSONB    DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS read_notifications    BIGINT[] DEFAULT '{}';

-- 4. RLS: adminler duyuru güncelleyebilir (sabitle / süre uzat)
DROP POLICY IF EXISTS "announcements_update_admin" ON announcements;
CREATE POLICY "announcements_update_admin" ON announcements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('Baş Admin', 'Yönetici', 'Admin Yardımcısı')
    )
  );

-- Kullanıcı kendi kişisel bildirimini silebilir (bildirim kutusundan "kaldır")
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 5. REALTIME: silme/güncelleme olaylarının tam satırla gelmesi + kişisel bildirim yayını
ALTER TABLE announcements REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
