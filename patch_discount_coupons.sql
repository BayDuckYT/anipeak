-- promo_codes tablosuna indirim kuponu ve süre limiti desteği ekle
-- Bu SQL'i Supabase Dashboard > SQL Editor'dan çalıştırın

-- 1. 'discount' tipine izin vermek için mevcut type kontrolünü güncelleyelim
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS promo_codes_type_check;
ALTER TABLE promo_codes ADD CONSTRAINT promo_codes_type_check CHECK (type IN ('elite', 'aura', 'discount'));

-- 2. İndirim kuponu için gerekli sütunları ekleyelim
ALTER TABLE promo_codes 
  ADD COLUMN IF NOT EXISTS discount_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS min_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applies_to text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT NULL;

-- 3. discount_type ve applies_to sütunları için kısıtlamalar
ALTER TABLE promo_codes 
  DROP CONSTRAINT IF EXISTS check_discount_type,
  ADD CONSTRAINT check_discount_type 
  CHECK (discount_type IS NULL OR discount_type IN ('fixed', 'percent'));

ALTER TABLE promo_codes 
  DROP CONSTRAINT IF EXISTS check_applies_to,
  ADD CONSTRAINT check_applies_to 
  CHECK (applies_to IS NULL OR applies_to IN ('all', 'elite', 'aura'));
