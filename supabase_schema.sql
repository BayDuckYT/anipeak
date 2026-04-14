-- AniPeak Supabase Database Schema
-- Run this in the Supabase SQL Editor (SQL Editor > New Query)

-- 1. Series Table
CREATE TABLE IF NOT EXISTS series (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  cover TEXT,
  description TEXT,
  author TEXT,
  year TEXT,
  status TEXT DEFAULT 'Devam Ediyor',
  rating DECIMAL DEFAULT 0,
  reads_num BIGINT DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  genre TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  series_id BIGINT REFERENCES series(id) ON DELETE CASCADE,
  number DECIMAL NOT NULL,
  title TEXT,
  pages TEXT[] DEFAULT '{}',
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Registered Users Table
CREATE TABLE IF NOT EXISTS registered_users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'Kullanıcı',
  status TEXT DEFAULT 'Aktif',
  premium BOOLEAN DEFAULT false,
  total_read BIGINT DEFAULT 0,
  provider TEXT DEFAULT 'email',
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type TEXT DEFAULT 'system',
  text TEXT NOT NULL,
  series_id BIGINT REFERENCES series(id) ON DELETE SET NULL,
  chapter_num DECIMAL,
  ts BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);