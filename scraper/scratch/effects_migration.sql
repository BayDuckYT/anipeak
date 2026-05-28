-- ============================================================
-- MahoraPeak Elite Efekt Paketi — Veritabanı Migration
-- Supabase SQL Editor > New Query > Paste & Run
-- ============================================================

-- ── 1. PROFILES tablosuna efekt sütunları ekle ────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_effect   TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS comment_effect  TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS nametag_effect  TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS unlocked_effects TEXT[] DEFAULT '{}';

-- ── 2. COMMENTS tablosuna efekt sütunları ekle ───────────────
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS avatar_effect   TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS comment_effect  TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS nametag_effect  TEXT DEFAULT 'none';

-- ── 3. Doğrulama: Sütunların eklendiğini kontrol et ──────────
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('avatar_effect', 'comment_effect', 'nametag_effect', 'unlocked_effects')
ORDER BY column_name;

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'comments'
  AND column_name IN ('avatar_effect', 'comment_effect', 'nametag_effect')
ORDER BY column_name;
