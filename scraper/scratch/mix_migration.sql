-- ============================================================
-- MahoraPeak Elite Mix & Karıştır Paketi — Veritabanı Migration
-- Supabase SQL Editor > New Query > Paste & Run
-- ============================================================

-- 1. PROFILES tablosuna active_mix JSONB sütununu ekle
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS active_mix JSONB DEFAULT '{"avatar": "none", "comment": "none", "nametag": "none", "aura": "none"}'::jsonb;

-- 2. Eski sütunları JSONB'ye aktarma (isteğe bağlı ama önerilir)
-- Eğer kullanıcının mevcut bir avatar_effect'i varsa, active_mix içine yaz.
UPDATE profiles 
SET active_mix = jsonb_build_object(
  'avatar', COALESCE(avatar_effect, 'none'),
  'comment', COALESCE(comment_effect, 'none'),
  'nametag', COALESCE(nametag_effect, 'none'),
  'aura', 'none'
)
WHERE active_mix IS NULL OR active_mix = '{"avatar": "none", "comment": "none", "nametag": "none", "aura": "none"}'::jsonb;
