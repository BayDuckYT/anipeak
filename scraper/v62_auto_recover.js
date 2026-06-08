// ============================================================
// ⚡ MAHORAPEAK V62: AUTO RECOVER — MASS RESTORATION
// Veritabanındaki tüm serileri otomatik tarar ve silinmiş/eksik bölümleri onarır.
// ============================================================

import axios from 'axios';
import sharp from 'sharp';
import pLimit from 'p-limit';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { supabase, getOrCreateSeries, createChapterIfNotExists } from './src/db.js';
import logger from './utils/logger.js';
import { EventEmitter } from 'events';
import https from 'https';

puppeteer.use(StealthPlugin());
process.setMaxListeners(0);
EventEmitter.defaultMaxListeners = 0;
https.globalAgent.setMaxListeners(0);

// ────────────────────────────────────────────────────────────
// ⚙️ KONFİGÜRASYON
// ────────────────────────────────────────────────────────────
const CONFIG = {
  GITHUB_TOKENS: [
    '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',
    'YEDEK_TOKEN_1_BURAYA',
    'YEDEK_TOKEN_2_BURAYA'
  ],
  GITHUB_USER:     'murathanozel48-prog',
  REPO_NAME:       'mahorapeak-manga-assets',
  BRANCH:          'main',
  JSDELIVR_BASE:   'https://cdn.jsdelivr.net/gh/murathanozel48-prog/mahorapeak-manga-assets@main/',
  BASE_URL:        'https://mangaokutr.co',

  CHAPTER_CONCURRENCY: 5,   
  PAGE_DOWNLOAD_LIMIT: 15,  
  BLOB_UPLOAD_LIMIT:   20,  
};

const delay = (ms) => new Promise(r => setTimeout(r, ms));

let currentTokenIndex = 0;

function getGhHeaders() {
  return {
    Authorization: `token ${CONFIG.GITHUB_TOKENS[currentTokenIndex]}`,
    'Content-Type': 'application/json',
    'User-Agent': 'MahoraPeak-AutoRecover/62'
  };
}

function rotateToken() {
  currentTokenIndex = (currentTokenIndex + 1) % CONFIG.GITHUB_TOKENS.length;
  console.log(`\x1b[33m[TOKEN-ROTATE]\x1b[0m >> Limit aşıldı! Yedek Token'e geçiliyor (Index: ${currentTokenIndex})`);
}

function checkRateLimitError(e) {
  if (e.response && (e.response.status === 403 || e.response.status === 429)) {
    rotateToken();
    return true;
  }
  return false;
}

// ────────────────────────────────────────────────────────────
// 🐙 GITHUB TREES API — GIT CLI YOK!
// ────────────────────────────────────────────────────────────

async function getHeadSha() {
  const res = await axios.get(
    `https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.REPO_NAME}/git/refs/heads/${CONFIG.BRANCH}`,
    { headers: getGhHeaders() }
  );
  const commitSha = res.data.object.sha;
  const commitRes = await axios.get(
    `https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.REPO_NAME}/git/commits/${commitSha}`,
    { headers: getGhHeaders() }
  );
  return { commitSha, treeSha: commitRes.data.tree.sha };
}

async function createBlob(buffer) {
  let res;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      res = await axios.post(
        `https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.REPO_NAME}/git/blobs`,
        { content: buffer.toString('base64'), encoding: 'base64' },
        { headers: getGhHeaders(), timeout: 30000 }
      );
      return res.data.sha;
    } catch (e) {
      if (checkRateLimitError(e)) {
        await delay(1000);
        continue;
      }
      throw e;
    }
  }
  throw new Error("Blob oluşturulamadı (Max deneme).");
}

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function batchCommitToGitHub(files, commitMsg) {
  if (files.length === 0) return;

  console.log(`\x1b[34m[GITHUB-LOCAL]\x1b[0m >> Toplam ${files.length} dosya Git CLI ile tek seferde gönderilecek...`);

  const repoPath = path.resolve('./assets_repo');
  const token = CONFIG.GITHUB_TOKENS[0];
  const repoUrl = `https://${token}@github.com/${CONFIG.GITHUB_USER}/${CONFIG.REPO_NAME}.git`;

  if (!fs.existsSync(repoPath)) {
    console.log(`\x1b[34m[GITHUB-LOCAL]\x1b[0m >> Uzak depo klonlanıyor (Sadece ilk çalışmada)...`);
    try {
      execSync(`git clone --depth 1 ${repoUrl} ${repoPath}`, { stdio: 'pipe' });
    } catch (err) {
      console.log(`\x1b[31m[GITHUB-LOCAL-FATAL]\x1b[0m >> Repo klonlanamadı: ${err.message}`);
      throw err;
    }
  }

  console.log(`\x1b[34m[GITHUB-LOCAL]\x1b[0m >> Dosyalar diske yazılıyor...`);
  for (const file of files) {
    const fullPath = path.join(repoPath, file.path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, file.buffer);
  }

  console.log(`\x1b[34m[GITHUB-LOCAL]\x1b[0m >> Git Commit ve Push işlemi başlatılıyor...`);

  try {
    execSync('git add .', { cwd: repoPath, stdio: 'pipe' });
    
    try {
      execSync(`git commit -m "${commitMsg}"`, { cwd: repoPath, stdio: 'pipe' });
    } catch (e) {
      if (!e.message.includes("nothing to commit")) {
        throw e;
      }
    }
    
    execSync('git push origin main', { cwd: repoPath, stdio: 'pipe' });
    console.log(`\x1b[32m[GITHUB-LOCAL]\x1b[0m >> Toplu Push Başarılı!`);
  } catch (err) {
    console.log(`\x1b[31m[GITHUB-LOCAL-ERROR]\x1b[0m >> Push hatası: ${err.message}`);
    throw new Error("Git Push başarısız oldu, veritabanı güncellenmeyecek.");
  }
}

// ────────────────────────────────────────────────────────────
// 🌐 SAYFA İNDİRME (RAM-ONLY, DİSK YOK)
// ────────────────────────────────────────────────────────────

async function downloadAndOptimizePage(url, referer) {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 25000,
      headers: {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return await sharp(res.data)
      .resize(1600, null, { withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
  } catch { return null; }
}

// ────────────────────────────────────────────────────────────
// 🔍 SERİ + BÖLÜM META VERİSİ ÇEKME
// ────────────────────────────────────────────────────────────

async function extractSeriesInfo(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  } catch (e) {
    console.log(`\x1b[33m[RETRY]\x1b[0m >> Seri sayfası zaman aşımı, tekrar deneniyor...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
  }
  return await page.evaluate(() => {
    const title = document.querySelector('.post-title h1, h1')?.innerText.trim();
    const cover = document.querySelector('.summary_image img, .poster img')?.src;
    const description = document.querySelector('.description-summary, .summary__content, .summary')?.innerText.trim() || '';
    const genres = Array.from(document.querySelectorAll('a[href*="/manga-genre/"], .genres-content a')).map(a => a.innerText.trim());
    const status = document.body.innerText.includes('Ongoing') || document.body.innerText.includes('Devam') ? 'Devam Ediyor' : 'Tamamlandı';
    const chapters = Array.from(document.querySelectorAll('.wp-manga-chapter a')).map(a => ({
      href: a.href,
      number: parseFloat(a.innerText.match(/(\d+(\.\d+)?)/)?.[0] || '0'),
    })).filter(c => c.number > 0).sort((a, b) => a.number - b.number);
    return { title, cover, description, genres, status, chapters };
  });
}

async function extractChapterPageUrls(page, chapterUrl) {
  try {
    await page.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  } catch (e) {
    console.log(`\x1b[33m[RETRY]\x1b[0m >> Bölüm sayfası zaman aşımı, tekrar deneniyor: ${chapterUrl}`);
    await page.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 180000 });
  }
  
  await page.evaluate(async () => {
    for (let i = 0; i < 6; i++) {
      window.scrollBy(0, window.innerHeight * 2);
      await new Promise(r => setTimeout(r, 100));
    }
  });
  return await page.evaluate(() => {
    const selectors = ['.reading-content img', '#imgs img', '.page-break img', '#reader-area img', '.wp-manga-chapter-img'];
    for (const sel of selectors) {
      const imgs = Array.from(document.querySelectorAll(sel));
      if (imgs.length > 0) {
        return imgs.map(img => img.src || img.dataset.src || img.getAttribute('data-lazy-src') || img.getAttribute('data-src'))
                   .filter(s => s && s.startsWith('http') && !s.includes('logo') && !s.includes('loading') && !s.includes('data:image'));
      }
    }
    return [];
  });
}

// ────────────────────────────────────────────────────────────
// 🚀 ANA SERİ İŞLEME
// ────────────────────────────────────────────────────────────

async function processSeries(seriesUrl, browser) {
  console.log(`\x1b[35m[TITAN]\x1b[0m >> Hedef: ${seriesUrl}`);
  
  const mainPage = await browser.newPage();
  await mainPage.setViewport({ width: 1440, height: 900 });

  try {
    const seriesData = await extractSeriesInfo(mainPage, seriesUrl);
    await mainPage.close();

    if (!seriesData?.title || seriesData.chapters.length === 0) {
      console.log(`\x1b[33m[SKIP]\x1b[0m >> Veri alınamadı: ${seriesUrl}`);
      return;
    }

    console.log(`\x1b[36m[INFO]\x1b[0m >> ${seriesData.title}: ${seriesData.chapters.length} bölüm bulundu.`);

    let coverUrl = seriesData.cover || null;
    if (seriesData.cover) {
      const coverBuf = await downloadAndOptimizePage(seriesData.cover, CONFIG.BASE_URL + '/');
      if (coverBuf) {
        const coverPath = `covers/${seriesData.title.replace(/[^a-z0-9]/gi, '_')}/cover.jpg`;
        coverUrl = CONFIG.JSDELIVR_BASE + coverPath;
        seriesData._coverBuf = coverBuf;
        seriesData._coverPath = coverPath;
      }
    }

    const seriesId = await getOrCreateSeries(
      seriesData.title, coverUrl,
      seriesData.description,
      seriesData.genres.length > 0 ? seriesData.genres : ['Aksiyon'],
      seriesData.status
    );
    if (!seriesId) return;

    const { data: existingChapters } = await supabase
      .from('chapters').select('number, pages')
      .eq('series_id', seriesId);
      
    const existingNums = new Set();
    const corruptedNums = new Set(); 

    for (const ch of (existingChapters || [])) {
      if (!ch.pages || ch.pages.length < 3) {
        corruptedNums.add(ch.number);
      } else {
        existingNums.add(ch.number);
      }
    }

    const newChapters = seriesData.chapters.filter(c => !existingNums.has(c.number));
    
    if (newChapters.length === 0) {
      console.log(`\x1b[90m[SKIP]\x1b[0m >> ${seriesData.title}: Tüm bölümler tam ve sağlam.`);
      return;
    }

    console.log(`\x1b[32m[TITAN-SWEEP]\x1b[0m >> ${seriesData.title}: ${newChapters.length} bölüm eksik veya hasarlı! Hızla onarılıyor...`);

    const chapterLimit = pLimit(CONFIG.CHAPTER_CONCURRENCY);
    const chapterDataList = [];

    await Promise.all(newChapters.map(chapter => chapterLimit(async () => {
      const chPage = await browser.newPage();
      await chPage.setViewport({ width: 1440, height: 900 });

      try {
        const pageUrls = await extractChapterPageUrls(chPage, chapter.href);
        if (pageUrls.length < 3) {
          console.log(`\x1b[33m[SKIP]\x1b[0m >> Ch.${chapter.number}: Yetersiz sayfa (${pageUrls.length})`);
          return;
        }

        console.log(`\x1b[36m[DL]\x1b[0m >> Ch.${chapter.number}: ${pageUrls.length} sayfa indiriliyor...`);
        const referer = new URL(chapter.href).origin + '/';
        const dlLimit = pLimit(CONFIG.PAGE_DOWNLOAD_LIMIT);

        const buffers = await Promise.all(pageUrls.map((u, idx) =>
          dlLimit(() => downloadAndOptimizePage(u, referer).then(buf => ({ idx, buf })))
        ));

        const validBuffers = buffers.filter(b => b.buf !== null).sort((a, b) => a.idx - b.idx);
        if (validBuffers.length < 3) return;

        chapterDataList.push({ number: chapter.number, buffers: validBuffers });
        console.log(`\x1b[32m[DL-OK]\x1b[0m >> Ch.${chapter.number}: ${validBuffers.length} sayfa RAM'de hazır.`);
      } catch (chErr) {
        logger.error(`[Speed-Titan] Bölüm hatası Ch.${chapter.number}: ${chErr.message}`);
        console.log(`\x1b[31m[SKIP]\x1b[0m >> Ch.${chapter.number} atlandı: ${chErr.message.slice(0, 80)}`);
      } finally {
        await chPage.close().catch(() => {});
      }
    })));

    if (chapterDataList.length === 0) return;

    const allFiles = [];

    if (seriesData._coverBuf) {
      allFiles.push({ path: seriesData._coverPath, buffer: seriesData._coverBuf });
    }

    const slugTitle = seriesData.title.replace(/[^a-z0-9]/gi, '_');
    const chapterUrlMap = {}; 

    for (const ch of chapterDataList) {
      chapterUrlMap[ch.number] = [];
      for (const { idx, buf } of ch.buffers) {
        const filePath = `chapters/${slugTitle}/ch_${ch.number}/${String(idx + 1).padStart(3, '0')}.jpg`;
        allFiles.push({ path: filePath, buffer: buf });
        chapterUrlMap[ch.number].push(CONFIG.JSDELIVR_BASE + filePath);
      }
    }

    console.log(`\x1b[34m[TITAN]\x1b[0m >> ${allFiles.length} dosya GitHub'a gönderiliyor...`);
    
    await batchCommitToGitHub(
      allFiles,
      `MahoraPeak Upload/Repair: ${seriesData.title} — ${chapterDataList.length} bölüm`
    );

    for (const ch of chapterDataList) {
      const urls = chapterUrlMap[ch.number];
      if (!urls || urls.length === 0) continue;
      
      if (corruptedNums.has(ch.number)) {
        await supabase.from('chapters').update({ pages: urls }).eq('series_id', seriesId).eq('number', ch.number);
        console.log(`\x1b[35m[DB-REPAIR]\x1b[0m >> ${seriesData.title} Bölüm ${ch.number} ONARILDI. (${urls.length} sayfa)`);
      } else {
        await createChapterIfNotExists(
          seriesId, ch.number,
          `${seriesData.title} - Bölüm ${ch.number}`,
          urls
        );
        await supabase.from('announcements').insert([{
          type: 'new_chapter',
          text: `🔥 Yeni Bölüm: ${seriesData.title} - Bölüm ${ch.number}`,
          series_id: seriesId,
          chapter_num: ch.number
        }]);
        console.log(`\x1b[32m[DB-OK]\x1b[0m >> ${seriesData.title} Bölüm ${ch.number} kaydedildi. (${urls.length} sayfa)`);
      }
    }

  } catch (err) {
    logger.error(`[Speed-Titan] Seri hatası (${seriesUrl}): ${err.message}`);
    console.log(`\x1b[31m[!]\x1b[0m >> ${err.message}`);
    await mainPage.close().catch(() => {});
  }
}

// ────────────────────────────────────────────────────────────
// 🖥️ ANA PROGRAM (OTOMATİK VERİTABANI TARAMASI)
// ────────────────────────────────────────────────────────────

async function main() {
  console.clear();
  console.log('\x1b[35m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
  console.log('\x1b[35m%s\x1b[0m', '║   ⚡ MAHORAPEAK V62: AUTO RECOVER — MASS RESTORATION ⚡     ║');
  console.log('\x1b[35m%s\x1b[0m', '║   Veritabanındaki Tüm Serileri Tarayıp Eksikleri Çeker   ║');
  console.log('\x1b[35m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
  console.log();

  try {
    await axios.get(
      `https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.REPO_NAME}`,
      { headers: getGhHeaders() }
    );
    console.log(`\x1b[32m[GITHUB]\x1b[0m >> Repo erişimi onaylandı: ${CONFIG.REPO_NAME}`);
  } catch (e) {
    if (e.response?.status === 404) {
      console.log(`\x1b[33m[GITHUB]\x1b[0m >> Repo bulunamadı, oluşturuluyor...`);
      await axios.post('https://api.github.com/user/repos',
        { name: CONFIG.REPO_NAME, private: false, auto_init: true },
        { headers: getGhHeaders() }
      );
      await delay(3000); 
    } else {
      console.log(`\x1b[31m[GITHUB-HATA]\x1b[0m >> ${e.message}`);
      process.exit(1);
    }
  }

  // YENİ ÖZELLİK: Hedefleri konsoldan değil, doğrudan veritabanından al
  console.log(`\x1b[36m[DB]\x1b[0m >> Veritabanından mevcut seriler çekiliyor...`);
  const { data: seriesList, error } = await supabase.from('series').select('title');
  
  if (error || !seriesList || seriesList.length === 0) {
    console.log('\x1b[31m[HATA]\x1b[0m >> Veritabanından seri listesi alınamadı veya liste boş.');
    process.exit(1);
  }

  const targets = seriesList.map(s => s.title).filter(t => t.length > 2);
  console.log(`\x1b[32m[DB-OK]\x1b[0m >> Toplam ${targets.length} seri bulundu. Kurtarma operasyonu başlatılıyor...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 1200000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--no-zygote']
  });

  const startTime = Date.now();

  for (const target of targets) {
    const url = target.startsWith('http') ? target : `${CONFIG.BASE_URL}/manga/${target}`;
    await processSeries(url, browser);
  }

  await browser.close();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\x1b[32m[GÖREV TAMAMLANDI]\x1b[0m >> Tüm eksik bölümler kurtarıldı. Toplam süre: ${elapsed} saniye`);
}

main().catch(err => {
  console.error('\x1b[31m[FATAL]\x1b[0m >>', err.message);
  process.exit(1);
});
