-- ============================================================
-- AniPeak — Supabase Patch (Supabase SQL Editor'de çalıştır)
-- ============================================================

-- 1. error_reports tablosundaki eski default 'Açık' yerine 'Beklemede' olsun
ALTER TABLE error_reports ALTER COLUMN status SET DEFAULT 'Beklemede';

-- 2. Anonim ziyaretçiler de hata bildirebilsin (user_id NULL olabilir)
DROP POLICY IF EXISTS "error_user_insert" ON error_reports;
CREATE POLICY "error_user_insert" ON error_reports FOR INSERT WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);

DROP POLICY IF EXISTS "error_user_view_own" ON error_reports;
CREATE POLICY "error_user_view_own" ON error_reports FOR SELECT USING (
  auth.uid() = user_id OR user_id IS NULL
);

-- 3. Profiles tablosuna XP kolonu yoksa ekle (eski kurulumlar için)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp BIGINT DEFAULT 0;

-- Bitti!
SELECT 'AniPeak patch başarıyla uygulandı ✅' AS result;
