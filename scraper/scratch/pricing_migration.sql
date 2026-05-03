-- AniPeak Pricing Plans Migration
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  price INTEGER NOT NULL,
  features TEXT[] NOT NULL,
  is_popular BOOLEAN DEFAULT FALSE,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Data
INSERT INTO pricing_plans (name, duration, price, features, is_popular, icon, color) VALUES 
('ANIPEAK PRO', '30 GÜN', 75, ARRAY['Reklamsız Deneyim', 'PRO Rozeti', 'Özel Discord Rolü', 'Sohbette Parlama'], false, 'Zap', 'cyan'),
('HÜKÜMDAR', 'ÖMÜR BOYU', 999, ARRAY['Tüm Efektler ÜCRETSİZ', 'HÜKÜMDAR Mührü', 'Öncelikli Destek', 'Kozmik İsim Plakası', 'Tüm Gelecek Güncellemeler'], true, 'Crown', 'amber'),
('HÜKÜMDAR GÖLGESİ', '1 YIL', 699, ARRAY['Özel Profil Çerçeveleri', 'GÖLGE Rozeti', 'Erken Erişim Hakları', 'Özel Aura Efektleri'], false, 'Ghost', 'purple');

-- RLS Policies
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read pricing_plans" ON pricing_plans
FOR SELECT USING (true);

CREATE POLICY "Allow admin manage pricing_plans" ON pricing_plans
FOR ALL USING (
  auth.jwt() ->> 'email' = 'murathanozel134@gmail.com'
);
