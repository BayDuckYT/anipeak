// ============================================================
// 🚀 MAHORAPEAK V35: ULTIMATE GHOST-REAPER ARCHITECTURE
// Smart-Scale Seal · Professional Folders · Unified Ops
// ============================================================

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import logger from './utils/logger.js';
import { supabase } from './src/db.js';
import { BASE_URL, PYTHON_PATH } from './utils/constants.js';

import { launchBrowser, delay } from './pipeline/01_navigator.js';
import { extractSeriesData, extractPopularSeriesUrls } from './pipeline/02_extractor.js';
import { downloadChapterPages, downloadCover } from './pipeline/03_downloader.js';
import { translateChapter } from './pipeline/04_translator.js';
import { uploadCover, uploadChapterPages, syncSeries, syncChapter, notifyNewChapter } from './pipeline/05_distributor.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function checkPython() {
  const commands = [PYTHON_PATH, 'python', 'py', 'python3'];
  let found = null;

  for (const cmd of commands) {
    if (!cmd) continue;
    try {
      const result = spawnSync(cmd, ['--version']);
      if (result.status === 0) {
        found = cmd;
        break;
      }
    } catch (e) {}
  }

  if (!found) {
    console.log('\x1b[31m%s\x1b[0m', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\x1b[31m%s\x1b[0m', '⚠️  TEĞMENİM PYTHON YOLU HATALI! LÜTFEN MANUEL YOLU GİRİN ⚠️');
    console.log('\x1b[31m%s\x1b[0m', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const manualPath = await ask('[GİRİŞ] >> Python executable yolu (Örn: C:\\Python\\python.exe): ');
    return manualPath.trim() || 'python';
  }
  return found;
}

async function main() {
  console.clear();
  console.log('\x1b[35m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
  console.log('\x1b[35m%s\x1b[0m', '║   🛡️  MAHORAPEAK V35: ULTIMATE GHOST-REAPER 🛡️         ║');
  console.log('\x1b[35m%s\x1b[0m', '║   Smart-Scale Seal · Hybrid AI-Sharp · Siber Mühür   ║');
  console.log('\x1b[35m%s\x1b[0m', '║   [PROFESSIONAL GRADE] Unified Operation Protocol    ║');
  console.log('\x1b[35m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
  console.log();

  // Python Kontrolü
  const activePython = await checkPython();
  process.env.ACTIVE_PYTHON = activePython; 
  console.log(`\x1b[32m[SYSTEM]\x1b[0m >> Siber Motor Hazır: ${activePython}\n`);

  console.log('\x1b[36m[OPERASYON PROTOKOLÜ]\x1b[0m');
  console.log('\x1b[32m[1] HIZLI RE-BRAND (Speed & Stamp):\x1b[0m İndir, mühürle, \\EDIT\\ klasörüne fırlat!');
  console.log('\x1b[35m[2] ELITE AI EDIT (Full Translate):\x1b[0m AI Çeviri + Mühürleme, \\EDIT\\ pırlanta!');
  console.log();

  const modeInput = await ask('\x1b[33m[SEÇİM]\x1b[0m >> Operasyon modunu seçin (1/2): ');
  const isAiEdit = modeInput === '2';
  const modeLabel = isAiEdit ? 'ELITE_AI_EDIT' : 'SPEED_REBRAND';

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

      // Metadata
      const seriesData = await extractSeriesData(seriesUrl);
      if (!seriesData || seriesData.chapters.length === 0) {
        console.log('\x1b[31m[SKIP]\x1b[0m >> Seri verisi bulunamadı.');
        continue;
      }

      // Kapak
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

      if (!seriesId) continue;

      // Browser
      if (!browser) {
        console.log('\x1b[33m[BROWSER]\x1b[0m >> Ultimate Siber Motor Başlatılıyor...');
        const launched = await launchBrowser();
        browser = launched.browser;
        page = launched.page;
      }

      // Pipeline
      console.log(`\n\x1b[35m[V35-ULTIMATE]\x1b[0m >> ${seriesData.chapters.length} bölüm namluya sürüldü...\n`);

      for (const chapter of seriesData.chapters) {
        const { data: existing } = await supabase
          .from('chapters').select('id')
          .eq('series_id', seriesId)
          .eq('number', chapter.number)
          .maybeSingle();

        if (existing) {
          console.log(`\x1b[33m[SKIP]\x1b[0m Bölüm ${chapter.number} mevcut.`);
          continue;
        }

        console.log(`\n\x1b[35m[BÖLÜM ${chapter.number}]\x1b[0m >> Operasyon: ${modeLabel}`);

        // Step 1: Scrape
        const engPaths = await downloadChapterPages(page, chapter.href, seriesData.title, chapter.number);
        if (!engPaths) continue;

        // Step 2: Process (Smart Seal)
        console.log(`\x1b[35m[PROCESS]\x1b[0m >> Sayfalar işleniyor...`);
        const finalPaths = await translateChapter(engPaths, seriesData.title, chapter.number, isAiEdit);

        // Step 3: Distribution
        const pageUrls = await uploadChapterPages(finalPaths);

        if (!pageUrls || pageUrls.length === 0) {
          console.log(`\x1b[31m[UPLOAD-FAIL]\x1b[0m >> Bölüm ${chapter.number} sevkiyatı aksadı!`);
          continue;
        }

        const chapterTitle = `${seriesData.title} - Bölüm ${chapter.number}`;
        await syncChapter(seriesId, chapter.number, chapterTitle, pageUrls);
        
        // Telsiz Mesajı
        await notifyNewChapter(seriesId, seriesData.title, chapter.number);

        console.log(`\x1b[32m[OK]\x1b[0m TEĞMENİM BÖLÜM ${chapter.number} AMBARDA!`);
        await delay(1000);
      }

    } catch (err) {
      logger.error(`[V35-Ultimate] Kritik Hata: ${err.message}`);
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
