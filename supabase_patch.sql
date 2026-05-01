-- ============================================================
-- AniPeak — Supabase Patch (Siber Uyumluluk Modu)
-- ============================================================

-- 1. Temizlik (Eski tabloları ve bağımlılıklarını kökten sil)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_members CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- 1. Veri Tipi Uyumluluğu (BIGINT vs UUID Fix)
-- Tabloları sıfırdan ve UUID uyumlu oluşturuyoruz.

-- 2. error_reports tablosundaki eski default 'Açık' yerine 'Beklemede' olsun
ALTER TABLE error_reports ALTER COLUMN status SET DEFAULT 'Beklemede';

-- 3. Anonim ziyaretçiler de hata bildirebilsin (Tip güvenli karşılaştırma)
DROP POLICY IF EXISTS "error_user_insert" ON error_reports;
CREATE POLICY "error_user_insert" ON error_reports FOR INSERT WITH CHECK (
  auth.uid()::text = user_id::text OR user_id IS NULL
);

DROP POLICY IF EXISTS "error_user_view_own" ON error_reports;
CREATE POLICY "error_user_view_own" ON error_reports FOR SELECT USING (
  auth.uid()::text = user_id::text OR user_id IS NULL
);

-- 4. Profiles tablosuna eksik kolonları ekle (Dekorasyon ve Linkler)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_decoration TEXT DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_mix JSONB DEFAULT '{"avatar": "none", "comment": "none", "nametag": "none", "aura": "none", "nameplate": "none"}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp BIGINT DEFAULT 0;

-- 5. Rol hiyerarşisini güncelle
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
UPDATE profiles SET role = 'Kullanıcı' WHERE role NOT IN ('Kullanıcı', 'Üye', 'Admin', 'Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester', 'Premium') OR role IS NULL;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('Kullanıcı', 'Üye', 'Admin', 'Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester', 'Premium'));

-- 6. Mesajlaşma Altyapısı (Saf UUID)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT, 
  type TEXT NOT NULL DEFAULT 'dm', 
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversation_members (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- RLS Politikaları (Tip Bağımsız Karşılaştırma)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_own_conversations" ON conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id::text = conversations.id::text AND user_id::text = auth.uid()::text)
  OR type = 'community'
);

CREATE POLICY "community_view_all" ON conversations FOR SELECT USING (type = 'community');

CREATE POLICY "insert_conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "update_conversations" ON conversations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id::text = id::text AND user_id::text = auth.uid()::text)
);

CREATE POLICY "view_messages" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id::text = messages.conversation_id::text AND user_id::text = auth.uid()::text)
  OR EXISTS (SELECT 1 FROM conversations WHERE id::text = messages.conversation_id::text AND type = 'community')
);

CREATE POLICY "insert_messages" ON messages FOR INSERT WITH CHECK (
  auth.uid()::text = sender_id::text AND (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id::text = messages.conversation_id::text AND user_id::text = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM conversations WHERE id::text = messages.conversation_id::text AND type = 'community')
  )
);

CREATE POLICY "insert_members" ON conversation_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "view_members" ON conversation_members FOR SELECT USING (true);
CREATE POLICY "members_manage_own" ON conversation_members FOR DELETE USING (user_id::text = auth.uid()::text);

-- Global Topluluk Sohbetini oluştur
INSERT INTO conversations (id, name, type)
VALUES ('00000000-0000-0000-0000-000000000000', 'TOPLULUK', 'community')
ON CONFLICT (id) DO NOTHING;

-- İlk Hoş Geldin Mesajı
INSERT INTO messages (conversation_id, sender_id, text)
VALUES ('00000000-0000-0000-0000-000000000000', NULL, 'AniPeak Dünyasına Hoş Geldiniz! Sohbet kanalları aktif, iyi eğlenceler uşağım! 🚀')
ON CONFLICT DO NOTHING;

-- ==========================================
-- FOLLOWS (TAKİP) SİSTEMİ
-- ==========================================
CREATE TABLE IF NOT EXISTS follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(follower_id, following_id)
);

-- RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes takipleri görebilir" 
ON follows FOR SELECT USING (true);

CREATE POLICY "Kullanıcılar kendileri takip edebilir" 
ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Kullanıcılar takipten çıkabilir" 
ON follows FOR DELETE USING (auth.uid() = follower_id);

-- REALTIME AKTİFLEŞTİRME (Supabase Dashboard'da da yapılabilir)
-- Not: Eğer hata alırsanız Supabase Dashboard > Database > Replication kısmından aktif edin.
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE follows;

-- Bitti!
SELECT 'AniPeak Manga & Eğlence Yaması başarıyla uygulandı ✅' AS result;
NOTIFY pgrst, 'reload schema';
