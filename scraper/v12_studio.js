// ============================================================
// 🚀 ANIPEAK V12 — AI MANGA PRODUCTION STUDIO (TAPAS EDITION)
// Ana Orkestratör — Tapas Sızma & AI Üretim Hattı
// ============================================================

import readline from 'readline';
import logger from './utils/logger.js';
import { supabase } from './src/db.js';
import { delay, launchBrowser, navigateTo } from './pipeline/01_navigator.js';
import { extractSeriesData, extractPopularSeriesUrls } from './pipeline/02_extractor.js';
import { downloadChapterPages, downloadCover } from './pipeline/03_downloader.js';
import { translateChapter } from './pipeline/04_translator.js';
import { uploadCover, uploadChapterPages, syncSeries, syncChapter } from './pipeline/05_distributor.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.clear();
  console.log('\x1b[35m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
  console.log('\x1b[35m%s\x1b[0m', '║   🚀 ANIPEAK V12 — TAPAS ELITE AI STUDIO 🚀            ║');
  console.log('\x1b[35m%s\x1b[0m', '║   Canvas Extraction & AI Stealth Cleaner             ║');
  console.log('\x1b[35m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
  console.log();

  let { browser, page } = await launchBrowser();

  // ---- TAPAS ÖN HAZIRLIK ----
  console.log('\x1b[36m[STEALTH]\x1b[0m >> Tapas.io oturum açılıyor ve çerezler toplanıyor...');
  await navigateTo(page, 'https://tapas.io/');
  await delay(3000);

  const input = await ask('\x1b[33m[STUDIO]\x1b[0m >> Tapas URL\'si girin (boş = popüler): ');
  
  let targets = input.split(',').map(t => t.trim()).filter(t => t.length > 0);

  if (targets.length === 0) {
    console.log('\x1b[34m[AUTO]\x1b[0m >> Popüler Tapas serileri çekiliyor...');
    targets = await extractPopularSeriesUrls(page);
  }

  for (const target of targets) {
    console.log('\n\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
    console.log(`\x1b[36m[HEDEF]\x1b[0m >> ${target}`);
    
    try {
      // 1. Metadata Çek (Puppeteer V12)
      const seriesData = await extractSeriesData(page, target);
      if (!seriesData) continue;

      // 2. Seri DB Sync
      let coverUrl = null;
      if (seriesData.cover) {
        const coverBuffer = await downloadCover(seriesData.cover, seriesData.title);
        if (coverBuffer) coverUrl = await uploadCover(coverBuffer);
      }

      const seriesId = await syncSeries(
        seriesData.title,
        coverUrl,
        seriesData.description,
        seriesData.genres,
        seriesData.status
      );

      if (!seriesId) {
        console.log('\x1b[31m[DB-FAIL]\x1b[0m >> Seri kaydı başarısız!');
        continue;
      }

      // 3. Bölüm İşleme
      console.log(`\n\x1b[35m[PIPELINE]\x1b[0m >> ${seriesData.chapters.length} bölüm işlenecek...\n`);

      for (const chapter of seriesData.chapters) {
        // DB Kontrol
        const { data: existing } = await supabase.from('chapters').select('id').eq('series_id', seriesId).eq('number', chapter.number).maybeSingle();
        if (existing) {
          console.log(`\x1b[90m[SKIP]\x1b[0m >> Bölüm ${chapter.number} zaten mevcut.`);
          continue;
        }

        console.log(`\n\x1b[33m[BÖLÜM ${chapter.number}]\x1b[0m >> Başlıyor...`);

        // ---- DOWNLOAD (Canvas/Blob) ----
        const rawPaths = await downloadChapterPages(page, chapter.href, seriesData.title, chapter.number);
        if (!rawPaths) {
          console.log('\x1b[41m[DURDURULDU]\x1b[0m >> Liman tıkalı! Operasyon iptal.');
          break; // Kritik hata durumunda seriyi durdur
        }

        // ---- TRANSLATE (AI Cleaner + Gemini) ----
        console.log(`\x1b[35m[AI]\x1b[0m >> Temizlik ve Çeviri yapılıyor...`);
        const processedPaths = await translateChapter(rawPaths, seriesData.title, chapter.number);

        // ---- DISTRIBUTE ----
        console.log(`\x1b[36m[UPLOAD]\x1b[0m >> Dağıtım başlıyor...`);
        const pageUrls = await uploadChapterPages(processedPaths);
        
        if (pageUrls.length === rawPaths.length) {
          await syncChapter(seriesId, chapter.number, `${seriesData.title} - Bölüm ${chapter.number}`, pageUrls);
          console.log(`\x1b[32m[✓ TAMAM]\x1b[0m >> Bölüm ${chapter.number} başarıyla yayına alındı.`);
        } else {
          console.log('\x1b[31m[HATA]\x1b[0m >> Sayfa sayısı uyuşmazlığı! Mühimmat eksik.');
        }
      }

    } catch (err) {
      logger.error(`[Studio] Hata: ${err.message}`);
    }
  }

  console.log('\n\x1b[35m[STUDIO]\x1b[0m >> Operasyon tamamlandı.');
  await browser.close();
  rl.close();
}

main().catch(err => {
  console.error('\x1b[31m[FATAL]\x1b[0m >>', err);
  process.exit(1);
});
