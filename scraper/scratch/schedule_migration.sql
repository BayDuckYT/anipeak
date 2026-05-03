CREATE TABLE IF NOT EXISTS publishing_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_name TEXT NOT NULL,
    release_day INTEGER NOT NULL, -- 0 (Pazar) to 6 (Cumartesi)
    release_time TIME NOT NULL,
    poster_url TEXT,
    chapter_info TEXT,
    category TEXT,
    rating DECIMAL(2,1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS (Row Level Security) Aktifleştirme
ALTER TABLE publishing_schedule ENABLE ROW LEVEL SECURITY;

-- Herkesin okuyabilmesi için politika
DROP POLICY IF EXISTS "Allow public read access" ON publishing_schedule;
CREATE POLICY "Allow public read access" ON publishing_schedule FOR SELECT USING (true);

-- Adminlerin her şeyi yapabilmesi için politika (Opsiyonel ama önerilir)
DROP POLICY IF EXISTS "Allow service role full access" ON publishing_schedule;
CREATE POLICY "Allow service role full access" ON publishing_schedule FOR ALL USING (true);
