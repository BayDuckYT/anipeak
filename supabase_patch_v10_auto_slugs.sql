-- Migration: Auto-generate slugs for series if missing

-- Create a slugification function
CREATE OR REPLACE FUNCTION generate_slug(title TEXT) RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Convert to lowercase and replace non-alphanumeric with hyphens
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Remove leading and trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  new_slug := base_slug;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.series WHERE slug = new_slug) LOOP
    new_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger function
CREATE OR REPLACE FUNCTION set_slug_on_insert() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create it
DROP TRIGGER IF EXISTS trigger_set_slug ON public.series;
CREATE TRIGGER trigger_set_slug
BEFORE INSERT OR UPDATE ON public.series
FOR EACH ROW
EXECUTE FUNCTION set_slug_on_insert();

-- Run it immediately on existing series with null slugs
DO $$
DECLARE
    s RECORD;
BEGIN
    FOR s IN SELECT id, title FROM public.series WHERE slug IS NULL LOOP
        UPDATE public.series SET slug = generate_slug(s.title) WHERE id = s.id;
    END LOOP;
END;
$$;
