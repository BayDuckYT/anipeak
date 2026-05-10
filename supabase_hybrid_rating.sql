-- Akıllı Hibrit Puanlama Sistemi (5 Yıldız Üzerinden)

-- 1. Sütunları ekleyelim (Eğer yoksa)
ALTER TABLE series 
ADD COLUMN IF NOT EXISTS global_rating NUMERIC DEFAULT 8.0,
ADD COLUMN IF NOT EXISTS local_rating NUMERIC DEFAULT 0.0;

-- 2. Mevcut rating verilerini global_rating'e aktaralım (Eğer global_rating boşsa veya default ise)
UPDATE series 
SET global_rating = rating 
WHERE global_rating = 8.0 AND rating > 0;

-- 3. Tüm mevcut yerel oyları (local_rating) hesapla
WITH avg_ratings AS (
  SELECT series_id, AVG(value) as local_avg 
  FROM ratings 
  GROUP BY series_id
)
UPDATE series s
SET local_rating = COALESCE(ar.local_avg, 0)
FROM avg_ratings ar
WHERE s.id = ar.series_id;

-- 4. Nihai puanı (rating) hibrit formüle göre güncelle
UPDATE series 
SET rating = ROUND(((global_rating * 0.4) + (local_rating * 0.6)), 1)
WHERE local_rating > 0;

-- local_rating 0 ise (hiç oy yoksa), sadece global_rating'in kendisi olsun veya varsayılan 0.0 olsun.
-- Animain mantığında, oy yoksa global rating gösterilebilir.
UPDATE series 
SET rating = global_rating 
WHERE local_rating = 0 OR local_rating IS NULL;
