// ============================================================
// 🚀 MAHORAPEAK V23: GHOST-REAPER ARCHITECTURE — ELITE AI MANGA PRODUCTION STUDIO
// Ghost-Scraper · Anti-Spam Filter · Silent Python Fallback
// ============================================================

import readline from 'readline';
import logger from './utils/logger.js';
import { supabase } from './src/db.js';
import { BASE_URL } from './utils/constants.js';

import { launchBrowser, delay } from './pipeline/01_navigator.js';
import { extractSeriesData, extractPopularSeriesUrls } from './pipeline/02_extractor.js';
import { downloadChapterPages, downloadCover } from './pipeline/03_downloader.js';
import { translateChapter } from './pipeline/04_translator.js';
import { uploadCover, uploadChapterPages, syncSeries, syncChapter, notifyNewChapter } from './pipeline/05_distributor.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.clear();
  console.log('\x1b[35m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
  console.log('\x1b[35m%s\x1b[0m', '║   👻 MAHORAPEAK V23: GHOST-REAPER ARCHITECTURE 👻      ║');
  console.log('\x1b[35m%s\x1b[0m', '║   Ghost-Scraper · Anti-Spam Filter · Silent Fallback   ║');
  console.log('\x1b[35m%s\x1b[0m', '║   [DIRECT TR] VEYA [GHOST AI EDIT]                     ║');
  console.log('\x1b[35m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
  console.log();

  console.log('\x1b[36m[OPERASYON PROTOKOLÜ]\x1b[0m');
  console.log('\x1b[32m[1] RE-BRAND & SPEED:\x1b[0m Sayfaları indir, reklamları kazı, \\TR\\ klasörüne fırlat!');
  console.log('\x1b[35m[2] GHOST AI EDIT:\x1b[0m AI ile balonları işle, \\EDIT\\ klasörüne pırlanta gibi istifle!');
  console.log();

  const modeInput = await ask('\x1b[33m[SEÇİM]\x1b[0m >> Operasyon modunu seçin (1/2): ');
  const isAiEdit = modeInput === '2';
  const modeLabel = isAiEdit ? 'GHOST_AI_EDIT' : 'REBRAND_SPEED';

  const input = await ask('\x1b[33m[KOORDİNAT]\x1b[0m >> Teğmenim, koordinatları (URL) girin: ');
  
  let targets = input.split(',').map(t => {
    const urlMatch = t.match(/https?:\/\/[^\s"'`,]+/);
    return urlMatch ? urlMatch[0] : t.trim();
  }).filter(t => t.startsWith('http'));

  if (targets.length === 0) {
    console.log('\x1b[34m[AUTO]\x1b[0m >> Popüler mangalar çekiliyor...');
    targets = await extractPopularSeriesUrls();
  }

  let browser = null;
  let page = null;

  for (const target of targets) {
    console.log('\n\x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
    console.log(`\x1b[35m[HEDEF]\x1b[0m >> ${target}`);
    console.log('\x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');

    try {
      let seriesUrl = target;
      if (!seriesUrl.startsWith('http')) {
        seriesUrl = `${BASE_URL}/manga/${seriesUrl}`;
      }

      // ---- Metadata ----
      const seriesData = await extractSeriesData(seriesUrl);
      if (!seriesData || seriesData.chapters.length === 0) {
        console.log('\x1b[31m[SKIP]\x1b[0m >> Seri verisi bulunamadı.');
        continue;
      }

      // ---- Kapak ----
      let coverUrl = null;
      if (seriesData.cover) {
        const coverBuffer = await downloadCover(seriesData.cover, seriesData.title);
        if (coverBuffer) coverUrl = await uploadCover(coverBuffer);
      }

      const seriesId = await syncSeries(
        seriesData.title, coverUrl, seriesData.description,
        seriesData.genres.length > 0 ? seriesData.genres : ['Aksiyon'],
        seriesData.status
      );

      if (!seriesId) {
        console.log('\x1b[31m[DB-FAIL]\x1b[0m >> Seri kaydı başarısız!');
        continue;
      }

      // ---- Browser ----
      if (!browser) {
        console.log('\x1b[33m[BROWSER]\x1b[0m >> Ghost-Reaper Siber Motor Başlatılıyor...');
        const launched = await launchBrowser();
        browser = launched.browser;
        page = launched.page;
      }

      // ---- Pipeline ----
      console.log(`\n\x1b[35m[GHOST-REAPER]\x1b[0m >> ${seriesData.chapters.length} bölüm namluya sürüldü...\n`);

      let completedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (const chapter of seriesData.chapters) {
        const { data: existing } = await supabase
          .from('chapters').select('id')
          .eq('series_id', seriesId)
          .eq('number', chapter.number)
          .maybeSingle();

        if (existing) {
          console.log(`\x1b[33m[SKIP]\x1b[0m Bölüm ${chapter.number} ambarımızda mevcut.`);
          skippedCount++;
          continue;
        }

        console.log(`\n\x1b[35m[BÖLÜM ${chapter.number}]\x1b[0m >> Operasyon: ${modeLabel}`);

        // ---- Step 1: Ghost-Scraper (Anti-Spam) ----
        const engPaths = await downloadChapterPages(page, chapter.href, seriesData.title, chapter.number);
        if (!engPaths) {
          failedCount++;
          continue;
        }

        // ---- Step 2: Ghost-Processor (Silent Fallback) ----
        console.log(`\x1b[35m[PROCESS]\x1b[0m >> Sayfalar işleniyor...`);
        const finalPaths = await translateChapter(engPaths, seriesData.title, chapter.number, isAiEdit);

        // ---- Step 3: Distribution ----
        const pageUrls = await uploadChapterPages(finalPaths);

        if (!pageUrls || pageUrls.length === 0) {
          console.log(`\x1b[31m[UPLOAD-FAIL]\x1b[0m >> Bölüm ${chapter.number} sevkiyatı aksadı!`);
          failedCount++;
          continue;
        }

        const chapterTitle = `${seriesData.title} - Bölüm ${chapter.number}`;
        await syncChapter(seriesId, chapter.number, chapterTitle, pageUrls);
        await notifyNewChapter(seriesId, seriesData.title, chapter.number);

        completedCount++;
        console.log(`\x1b[32m[OK]\x1b[0m Bölüm ${chapter.number} pırlanta gibi tamamlandı!`);
        await delay(1000);
      }

      console.log(`\n\x1b[35m[RAPOR]\x1b[0m ${seriesData.title} | ✅ ${completedCount} | ⏭️ ${skippedCount} | ❌ ${failedCount}`);

    } catch (err) {
      logger.error(`[Ghost-Reaper] Kritik Hata: ${err.message}`);
      console.log(`\x1b[31m[KRİTİK HATA]\x1b[0m >> ${err.message}`);
    }
  }

  console.log('\n\x1b[35m[STUDIO]\x1b[0m >> Operasyon tamamlandı. Sistem kapatılıyor...');
  if (browser) await browser.close();
  rl.close();
}

main().catch(err => {
  console.error('\x1b[31m[FATAL]\x1b[0m >>', err);
  process.exit(1);
});
