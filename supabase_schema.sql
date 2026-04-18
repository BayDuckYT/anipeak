-- ============================================================
-- AniPeak — Production Database Schema
-- Supabase SQL Editor > New Query > Paste & Run
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. SERIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS series (
  id          BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title       TEXT        NOT NULL,
  cover       TEXT,
  description TEXT,
  author      TEXT,
  year        TEXT,
  status      TEXT        NOT NULL DEFAULT 'Devam Ediyor',
  rating      DECIMAL(3,1)         DEFAULT 0.0,
  reads_num   BIGINT               DEFAULT 0,
  is_trending BOOLEAN              DEFAULT false,
  is_deleted  BOOLEAN              DEFAULT false,
  genre       TEXT[]               DEFAULT '{}',
  created_at  TIMESTAMPTZ          DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 2. CHAPTERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chapters (
  id          BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  series_id   BIGINT      REFERENCES series(id) ON DELETE CASCADE,
  number      DECIMAL     NOT NULL,
  title       TEXT,
  pages       TEXT[]               DEFAULT '{}',
  is_premium  BOOLEAN              DEFAULT false,
  created_at  TIMESTAMPTZ          DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 3. PROFILES  (extends Supabase Auth users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pages (
  id          BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  slug        TEXT        UNIQUE NOT NULL,
  title       TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  updated_at  TIMESTAMPTZ          DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id          BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  subject     TEXT,
  message     TEXT        NOT NULL,
  status      TEXT                 DEFAULT 'Okunmadı',
  created_at  TIMESTAMPTZ          DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username    TEXT,
  avatar_url  TEXT,
  email       TEXT,
  role        TEXT        NOT NULL DEFAULT 'Kullanıcı',
  -- Roles: Baş Admin | Yönetici | Admin Yardımcısı | Editör | Kullanıcı
  status      TEXT        NOT NULL DEFAULT 'Aktif',
  premium     BOOLEAN              DEFAULT false,
  provider    TEXT                 DEFAULT 'email',
  total_read  BIGINT               DEFAULT 0,
  xp          BIGINT               DEFAULT 0,
  read_notifications BIGINT[]      DEFAULT '{}',
  created_at  TIMESTAMPTZ          DEFAULT NOW(),

  CONSTRAINT profiles_role_check CHECK (
    role IN ('Baş Admin','Yönetici','Admin Yardımcısı','Editör','Kullanıcı')
  )
);

-- ─────────────────────────────────────────────────────────────
-- 4. ANNOUNCEMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id          BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type        TEXT        NOT NULL DEFAULT 'system',
  text        TEXT        NOT NULL,
  series_id   BIGINT      REFERENCES series(id) ON DELETE SET NULL,
  chapter_num DECIMAL,
  created_at  TIMESTAMPTZ          DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 5. COMMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  series_id   BIGINT      REFERENCES series(id) ON DELETE CASCADE,
  chapter_num DECIMAL,
  user_id     UUID        REFERENCES auth.users ON DELETE SET NULL,
  username    TEXT        NOT NULL DEFAULT 'Kullanıcı',
  avatar_url  TEXT,
  text        TEXT        NOT NULL,
  is_spoiler  BOOLEAN              DEFAULT false,
  created_at  TIMESTAMPTZ          DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 6. RATINGS (Overall Series)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id          BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  series_id   BIGINT      REFERENCES series(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES auth.users ON DELETE CASCADE,
  value       INTEGER     NOT NULL CHECK (value >= 1 AND value <= 5),
  created_at  TIMESTAMPTZ          DEFAULT NOW(),
  UNIQUE (series_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- 7. CHAPTER RATINGS (Per Chapter)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chapter_ratings (
  id          BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  series_id   BIGINT      REFERENCES series(id) ON DELETE CASCADE,
  chapter_num DECIMAL     NOT NULL,
  user_id     UUID        REFERENCES auth.users ON DELETE CASCADE,
  value       INTEGER     NOT NULL CHECK (value >= 1 AND value <= 5),
  created_at  TIMESTAMPTZ          DEFAULT NOW(),
  UNIQUE (series_id, chapter_num, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- 8. ERROR REPORTS (Tickets)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS error_reports (
  id          BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id     UUID        REFERENCES auth.users ON DELETE SET NULL,
  series_id   BIGINT      REFERENCES series(id) ON DELETE CASCADE,
  chapter_num DECIMAL,
  type        TEXT        NOT NULL,
  description TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'Beklemede', -- Beklemede, İnceleniyor, Çözüldü
  created_at  TIMESTAMPTZ          DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 9. SITE CONFIG
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_config (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial value: maintenance OFF
INSERT INTO site_config (key, value)
VALUES ('maintenance', '{"enabled": false}')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: Auto-create profile on signup
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role, provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'Kullanıcı',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE series         ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config     ENABLE ROW LEVEL SECURITY;

-- ── Series ─────────────────
DROP POLICY IF EXISTS "series_read_all" ON series;
CREATE POLICY "series_read_all"    ON series FOR SELECT USING (true);
DROP POLICY IF EXISTS "series_admin_write" ON series;
CREATE POLICY "series_admin_write" ON series FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Baş Admin','Yönetici','Admin Yardımcısı','Editör'))
);

-- ── Chapters ──────────────────
DROP POLICY IF EXISTS "chapters_read_all" ON chapters;
CREATE POLICY "chapters_read_all"    ON chapters FOR SELECT USING (true);
DROP POLICY IF EXISTS "chapters_editor_write" ON chapters;
CREATE POLICY "chapters_editor_write" ON chapters FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Baş Admin','Yönetici','Admin Yardımcısı','Editör'))
);

-- ── Profiles ──
DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
CREATE POLICY "profiles_read_all"  ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Baş Admin','Yönetici'))
);
DROP POLICY IF EXISTS "profiles_admin_delete" ON profiles;
CREATE POLICY "profiles_admin_delete" ON profiles FOR DELETE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'Baş Admin')
);

-- ── Announcements ───────────────
DROP POLICY IF EXISTS "ann_read_all" ON announcements;
CREATE POLICY "ann_read_all"    ON announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "ann_admin_write" ON announcements;
CREATE POLICY "ann_admin_write" ON announcements FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Baş Admin','Yönetici','Admin Yardımcısı'))
);

-- ── Comments ─────────
DROP POLICY IF EXISTS "comments_read_all" ON comments;
CREATE POLICY "comments_read_all"  ON comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "comments_user_insert" ON comments;
CREATE POLICY "comments_user_insert" ON comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "comments_self_delete" ON comments;
CREATE POLICY "comments_self_delete" ON comments FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "comments_admin_delete" ON comments;
CREATE POLICY "comments_admin_delete" ON comments FOR DELETE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Baş Admin','Yönetici','Admin Yardımcısı'))
);

-- ── Ratings ────────
DROP POLICY IF EXISTS "ratings_read_all" ON ratings;
CREATE POLICY "ratings_read_all"   ON ratings FOR SELECT USING (true);
DROP POLICY IF EXISTS "ratings_user_write" ON ratings;
CREATE POLICY "ratings_user_write" ON ratings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Chapter Ratings ────────
DROP POLICY IF EXISTS "chap_ratings_read_all" ON chapter_ratings;
CREATE POLICY "chap_ratings_read_all" ON chapter_ratings FOR SELECT USING (true);
DROP POLICY IF EXISTS "chap_ratings_user_write" ON chapter_ratings;
CREATE POLICY "chap_ratings_user_write" ON chapter_ratings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Error Reports (Tickets) ────────
-- Herkes bildirim gönderebilir (kullanıcı veya anonim ziyaretçi)
DROP POLICY IF EXISTS "error_user_insert" ON error_reports;
CREATE POLICY "error_user_insert" ON error_reports FOR INSERT WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);
-- Kullanıcılar sadece kendi bildirip görür
DROP POLICY IF EXISTS "error_user_view_own" ON error_reports;
CREATE POLICY "error_user_view_own" ON error_reports FOR SELECT USING (
  auth.uid() = user_id OR user_id IS NULL
);
DROP POLICY IF EXISTS "error_admin_all" ON error_reports;
CREATE POLICY "error_admin_all" ON error_reports FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Baş Admin','Yönetici'))
);

-- ── Pages ────────
DROP POLICY IF EXISTS "pages_read_all" ON pages;
CREATE POLICY "pages_read_all"    ON pages FOR SELECT USING (true);
DROP POLICY IF EXISTS "pages_admin_all" ON pages;
CREATE POLICY "pages_admin_all"   ON pages FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Baş Admin','Yönetici'))
);

-- ── Contact Messages ────────
DROP POLICY IF EXISTS "contact_insert_all" ON contact_messages;
CREATE POLICY "contact_insert_all" ON contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "contact_admin_all" ON contact_messages;
CREATE POLICY "contact_admin_all"  ON contact_messages FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Baş Admin','Yönetici'))
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: Increment Reads
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_reads(row_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE series
  SET reads_num = reads_num + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- REALTIME: Enable replication on all tables
-- ─────────────────────────────────────────────────────────────
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
  ALTER PUBLICATION supabase_realtime ADD TABLE series;
  ALTER PUBLICATION supabase_realtime ADD TABLE chapters;
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
  ALTER PUBLICATION supabase_realtime ADD TABLE comments;
  ALTER PUBLICATION supabase_realtime ADD TABLE ratings;
  ALTER PUBLICATION supabase_realtime ADD TABLE chapter_ratings;
  ALTER PUBLICATION supabase_realtime ADD TABLE error_reports;
  ALTER PUBLICATION supabase_realtime ADD TABLE site_config;
COMMIT;