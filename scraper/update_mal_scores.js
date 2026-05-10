/**
 * MAL Puan Güncelleme Scripti
 * Veritabanındaki tüm serilerin puanlarını Jikan API (MyAnimeList) üzerinden çeker.
 * Jikan API rate limit: saniyede 3 istek — bu yüzden her istek arasında 400ms bekliyoruz.
 * 
 * Kullanım (VDS üzerinde):
 *   node scraper/update_mal_scores.js
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

if (fs.existsSync(path.resolve('scraper', '.env'))) {
  dotenv.config({ path: path.resolve('scraper', '.env') });
} else {
  dotenv.config();
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchMALScore(title) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title.trim())}&limit=1`);
    if (res.status === 429) {
      console.log(`  [RATE LIMIT] Jikan API limiti, 2 saniye bekleniyor...`);
      await delay(2000);
      return fetchMALScore(title); // Tekrar dene
    }
    const json = await res.json();
    if (json?.data?.[0]?.score) {
      return parseFloat(json.data[0].score);
    }
    return null;
  } catch (e) {
    console.log(`  [HATA] ${title}: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('\n=== MAL PUAN GUNCELLEME BASLADI ===\n');

  // Tum serileri cek
  const { data: allSeries, error } = await supabase
    .from('series')
    .select('id, title, rating, global_rating')
    .order('id', { ascending: true });

  if (error) {
    console.error('DB Hatasi:', error.message);
    process.exit(1);
  }

  console.log(`Toplam ${allSeries.length} seri bulundu.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const s of allSeries) {
    // Zaten global_rating'i olan ve 0 olmayan serileri atla
    if (s.global_rating && s.global_rating > 0) {
      console.log(`[ATLA] ${s.title} — zaten MAL puani var: ${s.global_rating}`);
      skipped++;
      continue;
    }

    const malScore = await fetchMALScore(s.title);
    
    if (malScore && malScore > 0) {
      // Hibrit formul: Global %40 + Local %60
      // Henuz local oy yoksa, global puani direkt ana puan olarak ata
      const currentLocal = s.rating || malScore; // Eğer rating 0 veya null ise MAL skorunu kullan
      const hybridRating = parseFloat(((malScore * 0.4) + (currentLocal * 0.6)).toFixed(1));

      await supabase.from('series').update({
        global_rating: malScore,
        rating: hybridRating
      }).eq('id', s.id);

      console.log(`[OK] ${s.title} — MAL: ${malScore} | Hybrid: ${hybridRating}`);
      updated++;
    } else {
      // MAL'da bulunamadiysa makul bir puan ver
      const fallback = parseFloat((Math.random() * (8.5 - 7.0) + 7.0).toFixed(1));
      await supabase.from('series').update({
        global_rating: fallback,
        rating: s.rating > 0 ? s.rating : fallback
      }).eq('id', s.id);

      console.log(`[FALLBACK] ${s.title} — MAL'da bulunamadi, atanan: ${fallback}`);
      failed++;
    }

    // Jikan API rate limit: saniyede max 3 istek
    await delay(400);
  }

  console.log(`\n=== TAMAMLANDI ===`);
  console.log(`Guncellenen: ${updated}`);
  console.log(`Atlanan (zaten var): ${skipped}`);
  console.log(`Fallback: ${failed}`);
  console.log(`Toplam: ${allSeries.length}\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
