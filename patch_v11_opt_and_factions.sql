-- ============================================================
-- MAHORAPEAK PATCH V11 - Optimizasyonlar & Fraksiyonlar
-- Supabase SQL Editor > New Query > Paste & Run
-- ============================================================

-- 1. READING HISTORY TABLOSU (Kaldığın Yerden Devam Et)
CREATE TABLE IF NOT EXISTS reading_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  series_id BIGINT REFERENCES series(id) ON DELETE CASCADE,
  last_read_chapter DECIMAL NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, series_id)
);

-- RLS for reading_history
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "history_read_own" ON reading_history;
CREATE POLICY "history_read_own" ON reading_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "history_upsert_own" ON reading_history;
CREATE POLICY "history_upsert_own" ON reading_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. FRAKSİYON SÜTUNU (Oyunlaştırma)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS faction text DEFAULT NULL;

-- 3. VERİTABANI İNDEKSLEME (Performans Optimizasyonu)
-- Series
CREATE INDEX IF NOT EXISTS idx_series_is_deleted ON series(is_deleted);
CREATE INDEX IF NOT EXISTS idx_series_reads_num ON series(reads_num DESC);

-- Chapters
CREATE INDEX IF NOT EXISTS idx_chapters_series_id ON chapters(series_id);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_series_id ON comments(series_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Ratings
CREATE INDEX IF NOT EXISTS idx_ratings_series_id ON ratings(series_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);

-- Chapter Ratings
CREATE INDEX IF NOT EXISTS idx_chapter_ratings_series_chapter ON chapter_ratings(series_id, chapter_num);

-- Reading History
CREATE INDEX IF NOT EXISTS idx_reading_history_user_id ON reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_updated_at ON reading_history(updated_at DESC);

NOTIFY pgrst, 'reload schema';
