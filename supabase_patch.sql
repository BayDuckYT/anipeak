-- ============================================================
-- MahoraPeak — Supabase Patch (Siber Uyumluluk Modu)
-- ============================================================

-- 1. Temizlik (Eski tabloları ve bağımlılıklarını kökten sil)
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversation_members CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- 2. Takip Sistemi Tablosu
CREATE TABLE follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(follower_id, following_id)
);

-- 3. DM Sohbet Başlıkları (Inbox)
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT, -- Grupta isim için
  type TEXT DEFAULT 'dm', -- dm, group, community
  last_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Sohbet Katılımcıları (Hangi DM kiminle?)
CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- 5. Gerçek Mesajlar
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Politikaları
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Follows
CREATE POLICY "Herkes takipleri görebilir" ON follows FOR SELECT USING (true);
CREATE POLICY "Kullanıcılar kendileri takip edebilir" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Kullanıcılar takipten çıkabilir" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Conversations
CREATE POLICY "Görüntüleme" ON conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = id AND user_id = auth.uid())
  OR type = 'community'
);
CREATE POLICY "Oluşturma" ON conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Güncelleme" ON conversations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = id AND user_id = auth.uid())
);

-- Participants
CREATE POLICY "Katılımcı Görüntüleme" ON conversation_participants FOR SELECT USING (true);
CREATE POLICY "Katılımcı Ekleme" ON conversation_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Messages
CREATE POLICY "Mesaj Görüntüleme" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND type = 'community')
);
CREATE POLICY "Mesaj Gönderme" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE follows;

-- Global Topluluk Sohbeti
INSERT INTO conversations (id, name, type, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'TOPLULUK', 'community', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (conversation_id, sender_id, content)
VALUES ('00000000-0000-0000-0000-000000000000', NULL, 'MahoraPeak Dünyasına Hoş Geldiniz! 🚀')
ON CONFLICT DO NOTHING;

-- 6. Site Yapılandırması (Bakım Modu vb.) Kalkanları
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_config_read_all" ON site_config;
CREATE POLICY "site_config_read_all" ON site_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_config_admin_all" ON site_config;
CREATE POLICY "site_config_admin_all" ON site_config FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Baş Admin', 'Yönetici'))
);

-- 7. Özel Liste İlişkileri (Deep Fetch Desteği)
-- series_id sütununu BIGINT yap ve series tablosuna bağla
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_list_items' AND column_name = 'series_id' AND data_type = 'text') THEN
        ALTER TABLE custom_list_items ALTER COLUMN series_id TYPE BIGINT USING series_id::bigint;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_series') THEN
        ALTER TABLE custom_list_items ADD CONSTRAINT fk_series FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE;
    END IF;
END $$;
