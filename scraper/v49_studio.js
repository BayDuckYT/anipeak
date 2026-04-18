// ============================================================
// 🚀 ANIPEAK V49: PARALEL TİTAN-MODU ARCHITECTURE
// Multi-Threading Scrape · GPU Task Queueing · Unified Command
// ============================================================

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import logger from './utils/logger.js';
import { supabase } from './src/db.js';
import { BASE_URL, PYTHON_PATH } from './utils/constants.js';
import pLimit from 'p-limit';

import { launchBrowser, delay } from './pipeline/01_navigator.js';
import { extractSeriesData, extractPopularSeriesUrls } from './pipeline/02_extractor.js';
import { downloadChapterPages, downloadCover } from './pipeline/03_downloader.js';
import { translateChapter } from './pipeline/04_translator.js';
import { uploadCover, uploadChapterPages, syncSeries, syncChapter, notifyNewChapter } from './pipeline/05_distributor.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

// GPU ve Paralel İşlem Limitleri (QUAD-STORM V2)
let SERIES_CONCURRENCY = 4; // Aynı anda 4 seri indir
let GPU_CONCURRENCY = 3;    // Aynı anda 3 GPU işlemi (Titan Gücü!)
let seriesLimit = pLimit(SERIES_CONCURRENCY);
let gpuLimit = pLimit(GPU_CONCURRENCY);

async function checkPython() {
  const commands = [PYTHON_PATH, 'python', 'py', 'python3'];
  let found = null;

  for (const cmd of commands) {
    if (!cmd) continue;
    try {
      const result = spawnSync(`"${cmd}" --version`, [], { shell: true });
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

async function processSeries(target, isAiEdit, modeLabel) {
  console.log(`\x1b[35m[QUAD-STORM]\x1b[0m >> Harekât Başladı: ${target}`);

  let browser = null;
  let page = null;

  try {
    let seriesUrl = target;
    if (!seriesUrl.startsWith('http')) {
      seriesUrl = `${BASE_URL}/manga/${seriesUrl}`;
    }

    // Metadata
    const seriesData = await extractSeriesData(seriesUrl);
    if (!seriesData || seriesData.chapters.length === 0) {
      console.log(`\x1b[31m[SKIP]\x1b[0m >> ${target} veri vermedi.`);
      return;
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

    if (!seriesId) return;

    // Browser (Her paralel işlem kendi sekmesini açar)
    const launched = await launchBrowser();
    browser = launched.browser;
    page = launched.page;

    console.log(`\n\x1b[35m[TITAN-MODU]\x1b[0m >> ${seriesData.title}: ${seriesData.chapters.length} bölüm namluda!\n`);

    for (const chapter of seriesData.chapters) {
      try {
        const { data: existing } = await supabase
          .from('chapters').select('id')
          .eq('series_id', seriesId)
          .eq('number', chapter.number)
          .maybeSingle();

        if (existing) {
          console.log(`\x1b[33m[SKIP]\x1b[0m ${seriesData.title} Bölüm ${chapter.number} zaten var.`);
          continue;
        }

        // Step 1: Scrape (Ghost-Reaper Filtresi Önden Akar)
        const engPaths = await downloadChapterPages(page, chapter.href, seriesData.title, chapter.number);
        if (!engPaths) continue;

        // Step 2: V49 GPU Radar (KUYRUĞA GİRER!)
        console.log(`\x1b[34m[QUEUE]\x1b[0m >> ${seriesData.title} Ch.${chapter.number} GPU kuyruğuna girdi...`);
        
        const finalPaths = await gpuLimit(async () => {
          try {
            return await translateChapter(engPaths, seriesData.title, chapter.number, isAiEdit);
          } catch (pyErr) {
            // Acil Durum Freni: OOM veya Kritik Hata
            if (pyErr.message.includes('Out of Memory') || pyErr.message.includes('OOM') || pyErr.message.includes('CUDA')) {
              console.log('\x1b[31m%s\x1b[0m', `[UYARI] Siber Isınma (OOM)! Vites Küçültüldü!`);
              SERIES_CONCURRENCY = 2;
              GPU_CONCURRENCY = 1;
              seriesLimit = pLimit(SERIES_CONCURRENCY);
              gpuLimit = pLimit(GPU_CONCURRENCY);
            }
            throw pyErr;
          }
        });

        // Step 3: Distribution
        const pageUrls = await uploadChapterPages(finalPaths);
        if (!pageUrls || pageUrls.length === 0) continue;

        const chapterTitle = `${seriesData.title} - Bölüm ${chapter.number}`;
        await syncChapter(seriesId, chapter.number, chapterTitle, pageUrls);
        await notifyNewChapter(seriesId, seriesData.title, chapter.number);

        console.log(`\x1b[32m[SUCCESS] Teğmenim, ${seriesData.title} Bölüm ${chapter.number} AMBARDA! Sancak Dikildi!\x1b[0m`);
      } catch (chErr) {
        console.log(`\x1b[31m[!] Bölüm Hatası (${seriesData.title} Ch.${chapter.number}):\x1b[0m ${chErr.message}`);
      }
    }

  } catch (err) {
    logger.error(`[QUAD-STORM] Hata (${target}): ${err.message}`);
    console.log(`\x1b[31m[!] Harekât Aksadı (${target}):\x1b[0m ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }
}

async function main() {
  console.clear();
  console.log('\x1b[35m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
  console.log('\x1b[35m%s\x1b[0m', '║   🌪️  ANIPEAK V49: QUAD-STORM V2 ARCHITECTURE 🌪️      ║');
  console.log('\x1b[35m%s\x1b[0m', '║   4-Way Parallel Scrape · Dynamic GPU Guardrails     ║');
  console.log('\x1b[35m%s\x1b[0m', '║   [ELITE STAGE] Smart VRAM & OOM Protection Active    ║');
  console.log('\x1b[35m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
  console.log();

  const activePython = await checkPython();
  process.env.ACTIVE_PYTHON = activePython; 
  console.log(`\x1b[32m[SYSTEM]\x1b[0m >> Quad-Storm Motoru Hazır: ${activePython}\n`);

  console.log('\x1b[36m[STRATEJİK QUAD-STORM PLANI]\x1b[0m');
  console.log('\x1b[32m[1] QUAD TEMİZLEME:\x1b[0m 4 koldan sömür, 3 koldan GPU ile işle!');
  console.log('\x1b[35m[2] QUAD AI EDIT:\x1b[0m Full AI Çeviri + Quad-Storm Paralel!');
  console.log();

  const modeInput = await ask('\x1b[33m[SEÇİM]\x1b[0m >> Harekât modunu seçin (1/2): ');
  const isAiEdit = modeInput === '2';
  const modeLabel = isAiEdit ? 'QUAD_AI_EDIT' : 'QUAD_RADAR_BYPASS';

  const input = await ask('\x1b[33m[HEDEF LİSTESİ]\x1b[0m >> Teğmenim, tüm hedefleri girin: ');
  
  let targets = input.split(',').map(t => {
    const urlMatch = t.match(/https?:\/\/[^\s"'`,]+/);
    return urlMatch ? urlMatch[0] : t.trim();
  }).filter(t => t.startsWith('http') || t.length > 3);

  if (targets.length === 0) {
    console.log('\x1b[34m[AUTO]\x1b[0m >> Popüler hedeflere sızılıyor...');
    targets = await extractPopularSeriesUrls();
  }

  console.log(`\x1b[31m[!] QUAD-STORM:\x1b[0m ${targets.length} hedef için topyekün saldırı başlatılıyor...\n`);

  const tasks = targets.map(target => seriesLimit(() => processSeries(target, isAiEdit, modeLabel)));
  
  await Promise.all(tasks);

  console.log('\n\x1b[35m[STUDIO]\x1b[0m >> QUAD-STORM harekâtı tamamlandı. Tüm hedefler yokedildi!');
  rl.close();
}

main().catch(err => {
  console.error('\x1b[31m[FATAL]\x1b[0m >>', err);
  process.exit(1);
});
