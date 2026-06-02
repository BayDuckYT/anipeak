-- Moderação ve Susturma sistemi için gerekli olan veritabanı güncellemeleri
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS muted_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mute_reason TEXT;
