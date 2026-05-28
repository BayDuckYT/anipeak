import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace with your site URL
const SITE_URL = 'https://mahorapeak.com.tr';

const supabaseUrl = 'https://yrcrgkdikkaeccikdzvw.supabase.co';
const supabaseAnonKey = 'sb_publishable_hic5fR71xFLQ4TE7ycVBXQ_xdQHkJGO';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const staticRoutes = [
  '/',
  '/all-series',
  '/takvim',
  '/popular',
  '/oracle',
  '/aethe-sanctuary',
  '/haneler',
  '/achievements',
  '/iletisim',
  '/oneriler',
  '/auth',
  '/market',
  '/cuzdan'
];

async function generateSitemap() {
  console.log('Fetching series and chapters from Supabase...');
  
  // Fetch series
  const { data: seriesList, error: seriesError } = await supabase
    .from('series')
    .select('id, created_at, slug')
    .eq('is_deleted', false);
    
  if (seriesError) {
    console.error('Error fetching series:', seriesError);
    return;
  }

  // Fetch chapters
  const { data: chaptersList, error: chaptersError } = await supabase
    .from('chapters')
    .select('id, series_id, number, created_at');

  if (chaptersError) {
    console.error('Error fetching chapters:', chaptersError);
    return;
  }

  console.log(`Found ${seriesList.length} series and ${chaptersList.length} chapters.`);

  const today = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Add static routes
  staticRoutes.forEach((route) => {
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}${route}</loc>\n`;
    xml += `    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>\n`;
    xml += `    <priority>${route === '/' ? '1.0' : '0.8'}</priority>\n`;
    xml += `  </url>\n`;
  });

  // Add series routes
  seriesList.forEach((series) => {
    const updatedAt = series.created_at || today;
    const seriesIdentifier = series.id;
    xml += `  <url>\n`;
    const seriesSlug = series.slug || `manga-${series.id}`;
    xml += `    <loc>${SITE_URL}/manga/${seriesSlug}</loc>\n`;
    xml += `    <lastmod>${updatedAt.split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;
  });

  // Add chapter routes
  chaptersList.forEach((chapter) => {
    const seriesIdentifier = chapter.series_id; // Usually it's /read/:seriesId/:chapterNumber
    xml += `  <url>\n`;
    const series = seriesList.find(s => s.id === chapter.series_id);
    const seriesSlug = series?.slug || `manga-${chapter.series_id}`;
    xml += `    <loc>${SITE_URL}/manga/${seriesSlug}/bolum-${chapter.number}</loc>\n`;
    xml += `    <lastmod>${(chapter.created_at || today).split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  const outputPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, xml);
  
  console.log(`Sitemap successfully generated at ${outputPath}`);
}

generateSitemap();
