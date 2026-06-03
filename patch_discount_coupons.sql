-- promo_codes tablosuna indirim kuponu desteği ekle
-- Bu SQL'i Supabase Dashboard > SQL Editor'dan çalıştırın

ALTER TABLE promo_codes 
  ADD COLUMN IF NOT EXISTS discount_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS min_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applies_to text DEFAULT 'all';

-- discount_type: 'fixed' (Sabit TL) veya 'percent' (Yüzdelik %)
-- discount_value: İndirim miktarı (TL veya yüzde)
-- min_amount: Minimum sipariş tutarı (bu tutarın altında kupon geçerli değildir)
-- applies_to: 'all' (tümü), 'elite' (sadece Elite paketleri), 'aura' (sadece Aura paketleri)

-- Kontrol: discount_type sadece 'fixed' veya 'percent' olabilir
ALTER TABLE promo_codes 
  ADD CONSTRAINT check_discount_type 
  CHECK (discount_type IS NULL OR discount_type IN ('fixed', 'percent'));

-- Kontrol: applies_to sadece 'all', 'elite' veya 'aura' olabilir
ALTER TABLE promo_codes 
  ADD CONSTRAINT check_applies_to 
  CHECK (applies_to IS NULL OR applies_to IN ('all', 'elite', 'aura'));
