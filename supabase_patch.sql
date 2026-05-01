-- ============================================================
-- AniPeak — Supabase Patch (Siber Uyumluluk Modu)
-- ============================================================

-- 1. Temizlik (Eski tabloları ve bağımlılıklarını kökten sil)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_members CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

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

CREATE TABLE conversation_members (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
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
VALUES ('00000000-0000-0000-0000-000000000000', 'TOPLULUK', 'community');

-- İlk Hoş Geldin Mesajı
INSERT INTO messages (conversation_id, sender_id, text)
VALUES ('00000000-0000-0000-0000-000000000000', NULL, 'AniPeak Karargahına Hoş Geldiniz! Siber sinyal aktif, operasyon başladı. 🚀');

-- Bitti!
SELECT 'AniPeak patch başarıyla uygulandı ✅' AS result;
NOTIFY pgrst, 'reload schema';
