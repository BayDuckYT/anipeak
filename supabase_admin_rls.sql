-- ═══════════════════════════════════════════════════════════════
-- AniPeak Admin Panel RLS Düzeltmesi
-- Bu SQL, admin kullanıcıların series/chapters tablolarında
-- update/delete yapabilmesini sağlar.
-- Supabase Dashboard > SQL Editor'de çalıştırın.
-- ═══════════════════════════════════════════════════════════════

-- 1. Profillerde admin rollerini kontrol eden fonksiyon
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. SERIES Tablosu RLS Politikaları
-- Herkes okuyabilir
DROP POLICY IF EXISTS "series_select_all" ON series;
CREATE POLICY "series_select_all" ON series
  FOR SELECT USING (true);

-- Adminler ekleme yapabilir
DROP POLICY IF EXISTS "series_insert_admin" ON series;
CREATE POLICY "series_insert_admin" ON series
  FOR INSERT WITH CHECK (is_admin());

-- Adminler güncelleme yapabilir (trend, silme, düzenleme)
DROP POLICY IF EXISTS "series_update_admin" ON series;
CREATE POLICY "series_update_admin" ON series
  FOR UPDATE USING (is_admin());

-- Adminler kalıcı silme yapabilir
DROP POLICY IF EXISTS "series_delete_admin" ON series;
CREATE POLICY "series_delete_admin" ON series
  FOR DELETE USING (is_admin());

-- 3. CHAPTERS Tablosu RLS Politikaları
-- Herkes okuyabilir
DROP POLICY IF EXISTS "chapters_select_all" ON chapters;
CREATE POLICY "chapters_select_all" ON chapters
  FOR SELECT USING (true);

-- Adminler ekleme yapabilir
DROP POLICY IF EXISTS "chapters_insert_admin" ON chapters;
CREATE POLICY "chapters_insert_admin" ON chapters
  FOR INSERT WITH CHECK (is_admin());

-- Adminler güncelleme yapabilir
DROP POLICY IF EXISTS "chapters_update_admin" ON chapters;
CREATE POLICY "chapters_update_admin" ON chapters
  FOR UPDATE USING (is_admin());

-- Adminler silme yapabilir
DROP POLICY IF EXISTS "chapters_delete_admin" ON chapters;
CREATE POLICY "chapters_delete_admin" ON chapters
  FOR DELETE USING (is_admin());

-- 4. ANNOUNCEMENTS Tablosu RLS Politikaları
DROP POLICY IF EXISTS "announcements_select_all" ON announcements;
CREATE POLICY "announcements_select_all" ON announcements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "announcements_insert_admin" ON announcements;
CREATE POLICY "announcements_insert_admin" ON announcements
  FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "announcements_delete_admin" ON announcements;
CREATE POLICY "announcements_delete_admin" ON announcements
  FOR DELETE USING (is_admin());

-- 5. RATINGS Tablosu (Herkes kendi oyunu verebilir)
DROP POLICY IF EXISTS "ratings_select_all" ON ratings;
CREATE POLICY "ratings_select_all" ON ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ratings_upsert_own" ON ratings;
CREATE POLICY "ratings_upsert_own" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ratings_update_own" ON ratings;
CREATE POLICY "ratings_update_own" ON ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. PROFILES Tablosu
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

-- Kullanıcılar kendi profilini güncelleyebilir
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Adminler herkesi güncelleyebilir
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

-- Adminler profil silebilir
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (is_admin());

-- 7. SITE_CONFIG Tablosu (Bakım modu vb.)
DROP POLICY IF EXISTS "site_config_select_all" ON site_config;
CREATE POLICY "site_config_select_all" ON site_config
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_config_upsert_admin" ON site_config;
CREATE POLICY "site_config_upsert_admin" ON site_config
  FOR ALL USING (is_admin());

-- 8. RLS'i aktif et (zaten aktifse sorun olmaz)
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- TAMAMLANDI! Admin panel artık düzgün çalışacak.
-- ═══════════════════════════════════════════════════════════════
