-- Migration: Add `slug` to `series` table
ALTER TABLE public.series ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create an index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_series_slug ON public.series(slug);
