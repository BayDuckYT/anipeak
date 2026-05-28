// ============================================================
// 🌪️ MAHORAPEAK V61: SNIPER-STEALTH (GHOST REAPER)
// 3-Upload Limit · 10s FailSafe · Elite Accuracy
// ============================================================

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { spawnSync } from 'child_process';

// [V71-SİBER-EMİR]
process.setMaxListeners(0);
EventEmitter.defaultMaxListeners = 0;

import logger from './utils/logger.js';
import { supabase } from './src/db.js';
import { BASE_URL, PYTHON_PATH, USER_AGENTS, VIEWPORT } from './utils/constants.js';
import pLimit from 'p-limit';

import { launchBrowser, delay } from './pipeline/01_navigator.js';
import { extractSeriesData } from './pipeline/02_extractor.js';
import { downloadChapterPages, downloadCover } from './pipeline/03_downloader.js';
import { uploadCover, uploadChapterPages, syncSeries, syncChapter, notifyNewChapter } from './pipeline/05_distributor.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function processSeries(target) {
  console.log(`\x1b[35m[V71-CHRONO]\x1b[0m >> Harekât Başladı: ${target}`);
  let browser = null;

  try {
    let seriesUrl = target;
    if (!seriesUrl.startsWith('http')) seriesUrl = `${BASE_URL}/manga/${seriesUrl}`;

    const seriesData = await extractSeriesData(seriesUrl);
    if (!seriesData || seriesData.chapters.length === 0) return;

    let seriesId = null;
    let existingCover = null;
    
    const { data: existingSeries } = await supabase
      .from('series').select('id, cover')
      .ilike('title', seriesData.title.trim()).maybeSingle();

    if (existingSeries) {
      seriesId = existingSeries.id;
      existingCover = existingSeries.cover;
    }

    let coverUrl = existingCover;
    if (!coverUrl && seriesData.cover) {
      const coverBuffer = await downloadCover(seriesData.cover);
      if (coverBuffer) coverUrl = await uploadCover(coverBuffer);
    }

    if (!seriesId) {
      seriesId = await syncSeries(seriesData.title, coverUrl, seriesData.description, seriesData.genres, seriesData.status);
    }
    if (!seriesId) return;

    console.log(`\x1b[34m[DEBUG]\x1b[0m >> Browser motoru ateşleniyor...`);
    const launched = await launchBrowser();
    browser = launched.browser;
    if (launched.page) await launched.page.close();
    console.log(`\x1b[34m[DEBUG]\x1b[0m >> Browser hazır.`);

    console.log(`\n\x1b[35m[V61-READY]\x1b[0m >> ${seriesData.title} için kronometre başlatıldı...\n`);

    const chapterBatchLimit = pLimit(3);
    const tasks = seriesData.chapters.map((chapter) => chapterBatchLimit(async () => {
      let chPage = null;
      try {
        // [DB-TRACE]
        const { data: existing, error: dbErr } = await supabase
          .from('chapters').select('id')
          .eq('series_id', seriesId).eq('number', chapter.number).maybeSingle();

        if (dbErr) throw new Error(`DB Hatası: ${dbErr.message}`);
        if (existing) return;

        chPage = await browser.newPage();
        await chPage.setUserAgent(USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]);

        // 1. Download & Optimize
        const pageBuffers = await downloadChapterPages(chPage, chapter.href, seriesData.title, chapter.number);
        if (!pageBuffers) throw new Error("Kaynak pusuya düştü");

        // 2. Upload (V61 Multi-Fallback)
        const pageUrls = await uploadChapterPages(pageBuffers);
        if (!pageUrls) throw new Error("Yükleme tüm hatlarda başarısız (Atlanıyor)");

        // 3. Sync
        const chapterTitle = `${seriesData.title} - Bölüm ${chapter.number}`;
        await syncChapter(seriesId, chapter.number, chapterTitle, pageUrls);
        await notifyNewChapter(seriesId, seriesData.title, chapter.number);

        console.log(`\x1b[32m[✓]\x1b[0m Bölüm ${chapter.number} - Başarıyla Karargaha (MahoraPeak) Taşındı.`);
        await delay(3000); 

      } catch (err) {
        console.log(`\x1b[31m[!]\x1b[0m Bölüm ${chapter.number} Atlandı: ${err.message}`);
      } finally {
        if (chPage) await chPage.close().catch(() => {});
      }
    }));

    await Promise.all(tasks);

  } catch (err) {
    logger.error(`[V71] Kritik: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }
}

async function main() {
  console.clear();
  console.log('\x1b[35m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
  console.log('\x1b[35m%s\x1b[0m', '║   🌪️  MAHORAPEAK V61: OPTIMIZED REAPER (FINAL) 🌪️          ║');
  console.log('\x1b[35m%s\x1b[0m', '║   1600px OPT · No-Disk · Stealth Flow · 3-Batch      ║');
  console.log('\x1b[35m%s\x1b[0m', '║   [FINAL] Peak Performance & Elite Image Quality     ║');
  console.log('\x1b[35m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
  console.log();

  const input = await ask('\x1b[33m[HEDEF LİSTESİ]\x1b[0m >> Teğmenim, mühimmat hedeflerini girin: ');
  const targets = input.split(',').map(t => t.trim()).filter(t => t.length > 5);

  for (const target of targets) {
    await processSeries(target);
  }

  console.log('\n\x1b[35m[CHRONO]\x1b[0m >> Harekat tamamlandı. Tüm bölümler mühürlendi! 🫡');
  rl.close();
}

main().catch(err => {
  console.error('\x1b[31m[FATAL]\x1b[0m >>', err);
  process.exit(1);
});
