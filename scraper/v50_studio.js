// ============================================================
// 🌪️ ANIPEAK V50: SMART-QUAD-STORM ARCHITECTURE
// 4-Way Parallel Scrape · V49 GPU Radar · Thermal Shield
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

// V50 HAREKÂT AYARLARI
let SERIES_CONCURRENCY = 4; // 4 Koldan Sömür
let GPU_CONCURRENCY = 4;    // 4 Koldan İşle (GPU THERMAL SHIELD Aktif)
let seriesLimit = pLimit(SERIES_CONCURRENCY);
let gpuLimit = pLimit(GPU_CONCURRENCY);

async function checkPython() {
  const commands = [PYTHON_PATH, 'python', 'py', 'python3'];
  let found = null;
  for (const cmd of commands) {
    if (!cmd) continue;
    try {
      const result = spawnSync(`"${cmd}" --version`, [], { shell: true });
      if (result.status === 0) { found = cmd; break; }
    } catch (e) {}
  }
  if (!found) {
    console.log('\x1b[31m%s\x1b[0m', '⚠️ TEĞMENİM PYTHON YOLU HATALI! MANUEL GİRİŞ BEKLENİYOR...');
    const manualPath = await ask('[GİRİŞ] >> Python yolu: ');
    return manualPath.trim() || 'python';
  }
  return found;
}

async function processSeries(target, isAiEdit, modeLabel) {
  console.log(`\x1b[35m[V50-STORM]\x1b[0m >> Harekât Başladı: ${target}`);
  let browser = null;
  let page = null;

  try {
    let seriesUrl = target;
    if (!seriesUrl.startsWith('http')) seriesUrl = `${BASE_URL}/manga/${seriesUrl}`;

    const seriesData = await extractSeriesData(seriesUrl);
    if (!seriesData || seriesData.chapters.length === 0) return;

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

    const launched = await launchBrowser();
    browser = launched.browser;
    page = launched.page;

    console.log(`\n\x1b[35m[V50-QUAD-STORM]\x1b[0m >> ${seriesData.title} Namluda!\n`);

    for (const chapter of seriesData.chapters) {
      try {
        const { data: existing } = await supabase
          .from('chapters').select('id')
          .eq('series_id', seriesId).eq('number', chapter.number).maybeSingle();

        if (existing) continue;

        // Step 1: Scrape (Ghost-Reaper Elite Filtresi)
        const engPaths = await downloadChapterPages(page, chapter.href, seriesData.title, chapter.number);
        if (!engPaths) continue;

        // Step 2: V49 GPU Radar (GPU Kuyruğu + Thermal Shield)
        const finalPaths = await gpuLimit(async () => {
          try {
            const result = await translateChapter(engPaths, seriesData.title, chapter.number, isAiEdit);
            // Thermal Shield: İşlem sonrası VRAM'in soğuması için milisaniyelik mola
            await delay(200); 
            return result;
          } catch (pyErr) {
            if (pyErr.message.includes('Memory') || pyErr.message.includes('CUDA')) {
              console.log('\x1b[31m%s\x1b[0m', `[V50-UYARI] GPU Isınma/OOM Saptandı! Vites Küçültülüyor...`);
              GPU_CONCURRENCY = 2;
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

        console.log(`\x1b[32m[V50-STORM] ${seriesData.title} Bölüm ${chapter.number} Jilet Gibi Hazır!\x1b[0m`);
      } catch (chErr) {
        console.log(`\x1b[31m[!] Bölüm Aksadı (${seriesData.title} Ch.${chapter.number}):\x1b[0m ${chErr.message}`);
      }
    }
  } catch (err) {
    logger.error(`[V50-STORM] Kritik Hata (${target}): ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }
}

async function main() {
  console.clear();
  console.log('\x1b[35m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
  console.log('\x1b[35m%s\x1b[0m', '║   🌪️  ANIPEAK V50: SMART-QUAD-STORM ARCHITECTURE 🌪️     ║');
  console.log('\x1b[35m%s\x1b[0m', '║   4-Way Parallel Scrape · VRAM Thermal Shield Active ║');
  console.log('\x1b[35m%s\x1b[0m', '║   [ULTIMATE STAGE] Cyber War in Full Concurrency     ║');
  console.log('\x1b[35m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
  console.log();

  const activePython = await checkPython();
  process.env.ACTIVE_PYTHON = activePython; 
  console.log(`\x1b[32m[SYSTEM]\x1b[0m >> V50 Motoru Ateşlendi: ${activePython}\n`);

  console.log('\x1b[36m[V50 HAREKÂT PLANI]\x1b[0m');
  console.log('\x1b[32m[1] V50 SMART-QUAD:\x1b[0m 4 koldan sömür, GPU Radar ile sancağı dik!');
  console.log('\x1b[35m[2] V50 AI EDIT:\x1b[0m 4 koldan AI Çeviri ve Profesyonel Dizgi!');
  console.log();

  const modeInput = await ask('\x1b[33m[SEÇİM]\x1b[0m >> Harekât modunu seçin (1/2): ');
  const isAiEdit = modeInput === '2';
  const modeLabel = isAiEdit ? 'V50_AI_EDIT' : 'V50_SMART_RADAR';

  const input = await ask('\x1b[33m[HEDEF LİSTESİ]\x1b[0m >> Teğmenim, tüm hedefleri girin: ');
  let targets = input.split(',').map(t => {
    const urlMatch = t.match(/https?:\/\/[^\s"'`,]+/);
    return urlMatch ? urlMatch[0] : t.trim();
  }).filter(t => t.startsWith('http') || t.length > 3);

  if (targets.length === 0) targets = await extractPopularSeriesUrls();

  console.log(`\x1b[31m[V50-WAR]\x1b[0m ${targets.length} hedef için topyekün saldırı başlatılıyor...\n`);

  const tasks = targets.map(target => seriesLimit(() => processSeries(target, isAiEdit, modeLabel)));
  await Promise.all(tasks);

  console.log('\n\x1b[35m[STUDIO]\x1b[0m >> V50: SMART-QUAD-STORM harekâtı başarıyla tamamlandı!');
  rl.close();
}

main().catch(err => {
  console.error('\x1b[31m[FATAL]\x1b[0m >>', err);
  process.exit(1);
});
