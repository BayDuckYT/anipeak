-- ============================================================================
-- MAHORAPEAK PUBLISHING SCHEDULE V2 SCHEMA MIGRATION
-- ============================================================================

-- 1. Tablo yoksa oluştur
CREATE TABLE IF NOT EXISTS publishing_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_name TEXT NOT NULL,
    series_id BIGINT,
    release_date DATE,
    release_day INTEGER NOT NULL DEFAULT 0, -- 0 (Pazar) - 6 (Cumartesi)
    release_time TIME NOT NULL DEFAULT '18:00',
    poster_url TEXT,
    chapter_info TEXT DEFAULT 'Yeni Bölüm',
    category TEXT DEFAULT 'Genel',
    rating DECIMAL(2,1) DEFAULT 9.0,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'published', 'delayed', 'new_series'
    delay_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Mevcut tablolara eksik kolonları ekle (ALTER TABLE IF EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'publishing_schedule' AND column_name = 'series_id') THEN
    ALTER TABLE publishing_schedule ADD COLUMN series_id BIGINT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'publishing_schedule' AND column_name = 'release_date') THEN
    ALTER TABLE publishing_schedule ADD COLUMN release_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'publishing_schedule' AND column_name = 'status') THEN
    ALTER TABLE publishing_schedule ADD COLUMN status TEXT DEFAULT 'scheduled';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'publishing_schedule' AND column_name = 'delay_reason') THEN
    ALTER TABLE publishing_schedule ADD COLUMN delay_reason TEXT;
  END IF;
END $$;

-- 3. RLS Aktifleştirme
ALTER TABLE publishing_schedule ENABLE ROW LEVEL SECURITY;

-- 4. Herkesin okuyabilmesi için RLS
DROP POLICY IF EXISTS "Allow public read access" ON publishing_schedule;
CREATE POLICY "Allow public read access" ON publishing_schedule FOR SELECT USING (true);

-- 5. Giriş yapmış kullanıcıların / adminlerin işlem yapabilmesi
DROP POLICY IF EXISTS "Allow authenticated full access" ON publishing_schedule;
CREATE POLICY "Allow authenticated full access" ON publishing_schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert update" ON publishing_schedule;
CREATE POLICY "Allow anon insert update" ON publishing_schedule FOR ALL TO anon USING (true) WITH CHECK (true);

-- 6. Performans İndeksleri
CREATE INDEX IF NOT EXISTS idx_publishing_schedule_date ON publishing_schedule(release_date);
CREATE INDEX IF NOT EXISTS idx_publishing_schedule_day ON publishing_schedule(release_day);
CREATE INDEX IF NOT EXISTS idx_publishing_schedule_series ON publishing_schedule(series_id);

-- 7. Realtime Yayını
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE publishing_schedule;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
