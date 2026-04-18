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
import { BASE_URL, PYTHON_PATH, SERIES_CONCURRENCY, GPU_CONCURRENCY, CHAPTER_CONCURRENCY, USER_AGENTS, VIEWPORT } from './utils/constants.js';
import pLimit from 'p-limit';

import { launchBrowser, delay } from './pipeline/01_navigator.js';
import { extractSeriesData, extractPopularSeriesUrls } from './pipeline/02_extractor.js';
import { downloadChapterPages, downloadCover } from './pipeline/03_downloader.js';
import { translateChapter } from './pipeline/04_translator.js';
import { uploadCover, uploadChapterPages, syncSeries, syncChapter, notifyNewChapter } from './pipeline/05_distributor.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

// V50 HAREKÂT AYARLARI
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
    // İlk açılan sayfayı kapat, her bölüme özel açacağız amk
    if (launched.page) await launched.page.close();

    console.log(`\n\x1b[35m[V50-ULTRA-INSTINCT]\x1b[0m >> ${seriesData.title}: ${seriesData.chapters.length} Bölüm Paralel İşleniyor...\n`);

    const chapterLimit = pLimit(CHAPTER_CONCURRENCY);
    const chapterTasks = seriesData.chapters.map(chapter => chapterLimit(async () => {
      let chPage = null;
      try {
        const { data: existing } = await supabase
          .from('chapters').select('id')
          .eq('series_id', seriesId).eq('number', chapter.number).maybeSingle();

        if (existing) return;

        chPage = await browser.newPage();
        await chPage.setUserAgent(USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]);
        await chPage.setViewport(VIEWPORT);

        // Step 1: Scrape
        const engPaths = await downloadChapterPages(chPage, chapter.href, seriesData.title, chapter.number);
        if (!engPaths) return;

        // Step 2: V49 GPU Radar / AI Edit
        let finalPaths = engPaths;
        if (isAiEdit) {
          finalPaths = await gpuLimit(async () => {
            try {
              const result = await translateChapter(engPaths, seriesData.title, chapter.number, isAiEdit);
              await delay(200); 
              return result;
            } catch (pyErr) {
              if (pyErr.message.includes('Memory') || pyErr.message.includes('CUDA')) {
                console.log('\x1b[31m%s\x1b[0m', `[V50-UYARI] GPU Isınma/OOM!`);
                gpuLimit = pLimit(2);
              }
              throw pyErr;
            }
          });
        }

        // Step 3: Distribution
        const pageUrls = await uploadChapterPages(finalPaths);
        if (!pageUrls || pageUrls.length === 0) return;

        const chapterTitle = `${seriesData.title} - Bölüm ${chapter.number}`;
        await syncChapter(seriesId, chapter.number, chapterTitle, pageUrls);
        await notifyNewChapter(seriesId, seriesData.title, chapter.number);

        console.log(`\x1b[32m[OK] Ch.${chapter.number}\x1b[0m`);
      } catch (chErr) {
        console.log(`\x1b[31m[!] Ch.${chapter.number} Hatası:\x1b[0m ${chErr.message}`);
      } finally {
        if (chPage) await chPage.close().catch(() => {});
      }
    }));

    await Promise.all(chapterTasks);

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
