import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace with your site URL
const SITE_URL = 'https://mahorapeak.com.tr';

// Use Anon key for reading, but we need Service Key for updating if RLS blocks it.
// We'll use the ones from scraper/.env if available, or just the public anon key if we can't find service key.
// But wait, we can just use the ANON key if the user is authenticated, but this is a node script.
// Let's use the service role key. I'll read it from scraper/.env
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../scraper/.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://yrcrgkdikkaeccikdzvw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'sb_publishable_hic5fR71xFLQ4TE7ycVBXQ_xdQHkJGO'; // Fallback to anon key

const supabase = createClient(supabaseUrl, supabaseKey);

function generateSlug(text) {
  if (!text) return '';
  const trMap = {
    'çÇ': 'c', 'ğĞ': 'g', 'şŞ': 's', 'üÜ': 'u', 'ıİ': 'i', 'öÖ': 'o'
  };
  for (let key in trMap) {
    text = text.replace(new RegExp('[' + key + ']', 'g'), trMap[key]);
  }
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word [a-z0-9_], non-whitespace, non-hyphen characters
    .replace(/[\s_-]+/g, '-') // Swap any length of whitespace, underscore, hyphen characters with a single -
    .replace(/^-+|-+$/g, ''); // Remove leading, trailing -
}

async function run() {
  console.log('Fetching all series to generate slugs...');
  
  const { data: seriesList, error } = await supabase
    .from('series')
    .select('id, title, slug');
    
  if (error) {
    console.error('Error fetching series:', error);
    return;
  }

  const slugsSet = new Set();
  const redirects = [];
  
  redirects.push('# 301 Redirects from AniPeak ID-based URLs to MahoraPeak Slug-based URLs');
  redirects.push('');

  let updatedCount = 0;

  for (const series of seriesList) {
    let baseSlug = generateSlug(series.title);
    if (!baseSlug) baseSlug = `manga-${series.id}`;
    
    let finalSlug = baseSlug;
    let counter = 1;
    while (slugsSet.has(finalSlug)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    slugsSet.add(finalSlug);

    // Update the DB
    if (series.slug !== finalSlug) {
      const { error: updateError } = await supabase
        .from('series')
        .update({ slug: finalSlug })
        .eq('id', series.id);
        
      if (updateError) {
        console.error(`Failed to update slug for series ${series.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }

    // Add to redirects map
    redirects.push(`/manhwa/${series.id}  /manga/${finalSlug}  301`);
    
    // Also redirect read URLs using splat/wildcards for Cloudflare Pages
    // Cloudflare Pages uses splats: /read/131/:chapter -> /manga/slug/bolum-:chapter
    // Cloudflare _redirects syntax: /old-path/:splat /new-path/:splat 301
    // Wait, Cloudflare Pages syntax for specific segments:
    redirects.push(`/read/${series.id}/*  /manga/${finalSlug}/bolum-:splat  301`);
  }

  console.log(`Updated ${updatedCount} series with new slugs.`);

  // Write _redirects file
  const redirectsPath = path.resolve(__dirname, '../public/_redirects');
  
  // Also we must preserve existing static rules or keep it simple.
  // The user might have an existing _redirects file, let's append or overwrite?
  // We'll prepend them to the file if it exists, or just create it.
  
  let existingContent = '';
  if (fs.existsSync(redirectsPath)) {
      const existing = fs.readFileSync(redirectsPath, 'utf8');
      // filter out old rules if we are re-running
      const lines = existing.split('\n').filter(l => !l.includes('/manhwa/') && !l.includes('/read/'));
      existingContent = lines.join('\n');
  }

  const newContent = redirects.join('\n') + '\n\n' + existingContent;
  fs.writeFileSync(redirectsPath, newContent.trim() + '\n');
  
  console.log('Created public/_redirects successfully.');
}

run();
