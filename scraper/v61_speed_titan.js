import readline from 'readline';
import axios from 'axios';
import sharp from 'sharp';
import pLimit from 'p-limit';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { supabase, getOrCreateSeries, createChapterIfNotExists } from './src/db.js';
import logger from './utils/logger.js';
import { EventEmitter } from 'events';
import https from 'https';
import dotenv from 'dotenv';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

puppeteer.use(StealthPlugin());
process.setMaxListeners(0);
EventEmitter.defaultMaxListeners = 0;
https.globalAgent.setMaxListeners(0);

// .env fallback
dotenv.config({ path: '/root/anipeak/scraper/.env' });

// ────────────────────────────────────────────────────────────
// ⚙️ KONFİGÜRASYON (HARDCODED FOR STABILITY)
// ────────────────────────────────────────────────────────────
const CONFIG = {
  BASE_URL: 'https://mangaokutr.co',
  CHAPTER_CONCURRENCY: 3,   
  PAGE_UPLOAD_CONCURRENCY: 15, 
};

// Kritik R2 Bilgileri (Dosya okuma hatalarını engellemek için direkt gömüldü)
const R2_CREDENTIALS = {
  accountID: '5ea1dc1a085c04db3ae5f70b4e945b44',
  accessKeyId: 'cf18c4a293cab8223922055c0b79b96b',
  secretAccessKey: 'c33a182e615fedc56f4aacc14b9af0a41ea510fbf524f04b7393b93123186f82',
  bucket: 'anipeakimage',
  publicUrl: 'https://pub-56389f4fc14f4af4b80a25136a28126e.r2.dev'
};

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_CREDENTIALS.accountID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_CREDENTIALS.accessKeyId,
    secretAccessKey: R2_CREDENTIALS.secretAccessKey,
  },
});

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ────────────────────────────────────────────────────────────
// 🖼️ HD GÖRÜNTÜ İŞLEME & R2 YÜKLEME
// ────────────────────────────────────────────────────────────

async function processAndUploadR2(imageUrl, isCover, seriesTitle, chapterNumber, pageIndex, referer) {
  try {
    const res = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
      }
    });

    const finalBuffer = await sharp(res.data)
      .webp({ quality: 90, effort: 6 }) 
      .toBuffer();

    const safeTitle = seriesTitle.replace(/[\\/:*?"<>|]/g, '_');
    const fileName = isCover ? 'cover.webp' : `${String(pageIndex).padStart(3, '0')}.webp`;
    const r2Path = isCover 
      ? `manga/${safeTitle}/${fileName}` 
      : `manga/${safeTitle}/ch_${chapterNumber}/${fileName}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: R2_CREDENTIALS.bucket,
      Key: r2Path,
      Body: finalBuffer,
      ContentType: 'image/webp'
    }));

    return `${R2_CREDENTIALS.publicUrl}/${r2Path}`;
  } catch (e) {
    logger.error(`[HD-Upload] Hata (${imageUrl}): ${e.message}`);
    return null;
  }
}

// 🔍 SERİ + BÖLÜM META VERİSİ ÇEKME

async function extractSeriesInfo(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  }
  return await page.evaluate(() => {
    const title = document.querySelector('.post-title h1, h1')?.innerText.trim();
    const cover = document.querySelector('.summary_image img, .poster img')?.src;
    const description = document.querySelector('.description-summary, .summary__content, .summary')?.innerText.trim() || '';
    const genres = Array.from(document.querySelectorAll('a[href*="/manga-genre/"], .genres-content a')).map(a => a.innerText.trim());
    const status = document.body.innerText.includes('Ongoing') || document.body.innerText.includes('Devam') ? 'Devam Ediyor' : 'Tamamlandı';
    
    let finalTitle = title;
    const altElement = document.querySelector('.alter, .alternative, .other-name');
    if (altElement) {
       const altText = altElement.innerText.replace(/Alternatif İsimler:|Diğer İsimler:|Alternative Titles:/i, '').trim();
       if (altText && /^[a-zA-Z0-9\s:-]+$/.test(altText)) finalTitle = altText;
    }

    const chapters = Array.from(document.querySelectorAll('.wp-manga-chapter a')).map(a => ({
      href: a.href,
      number: parseFloat(a.innerText.match(/(\d+(\.\d+)?)/)?.[0] || '0'),
    })).filter(c => c.number > 0).sort((a, b) => a.number - b.number);
    
    return { title: finalTitle, cover, description, genres, status, chapters };
  });
}

async function extractChapterPageUrls(page, chapterUrl) {
  try {
    await page.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    await page.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  }
  
  await page.evaluate(async () => {
    for (let i = 0; i < 5; i++) {
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

// 🚀 BÖLÜM İŞLEME (NITRO)

async function processChapter(chapter, seriesTitle, seriesId, browser, uploadLimit) {
  const { data: existing } = await supabase.from('chapters').select('id').eq('series_id', seriesId).eq('number', chapter.number).maybeSingle();
  if (existing) return;

  const chPage = await browser.newPage();
  try {
    const pageUrls = await extractChapterPageUrls(chPage, chapter.href);
    if (pageUrls.length < 3) return;

    console.log(`\x1b[36m[NITRO-DL]\x1b[0m >> ${seriesTitle} Ch.${chapter.number}: ${pageUrls.length} sayfa...`);
    const referer = new URL(chapter.href).origin + '/';
    
    const uploadedPages = new Array(pageUrls.length);
    const tasks = pageUrls.map((imgUrl, i) => uploadLimit(async () => {
      const url = await processAndUploadR2(imgUrl, false, seriesTitle, chapter.number, i + 1, referer);
      if (url) {
        uploadedPages[i] = url;
        console.log(`\x1b[32m[HD-OK]\x1b[0m >> Ch.${chapter.number} P.${i+1}`);
      }
    }));

    await Promise.all(tasks);
    const finalPages = uploadedPages.filter(p => p);

    if (finalPages.length > 0) {
      await createChapterIfNotExists(seriesId, chapter.number, `${seriesTitle} - Bölüm ${chapter.number}`, finalPages);
      console.log(`\x1b[35m[COMPLETE]\x1b[0m >> ${seriesTitle} Bölüm ${chapter.number} Bitti.`);
    }
  } catch (err) {
    logger.error(`[Chapter-Error] Bölüm ${chapter.number}: ${err.message}`);
  } finally {
    await chPage.close();
  }
}

// 🚀 ANA SERİ İŞLEME

async function processSeries(seriesUrl, browser) {
  console.log(`\x1b[35m[TITAN-FINAL]\x1b[0m >> Hedef: ${seriesUrl}`);
  
  const mainPage = await browser.newPage();
  try {
    const seriesData = await extractSeriesInfo(mainPage, seriesUrl);
    await mainPage.close();

    if (!seriesData?.title) {
      console.log(`\x1b[33m[SKIP]\x1b[0m >> Veri alınamadı: ${seriesUrl}`);
      return;
    }

    console.log(`\x1b[36m[INFO]\x1b[0m >> ${seriesData.title}: HD İşlem Başlıyor...`);

    let coverUrl = seriesData.cover;
    if (seriesData.cover) {
      coverUrl = await processAndUploadR2(seriesData.cover, true, seriesData.title, 0, 0, CONFIG.BASE_URL + '/');
    }

    const seriesId = await getOrCreateSeries(
      seriesData.title, coverUrl,
      seriesData.description,
      seriesData.genres.length > 0 ? seriesData.genres : ['Manga'],
      seriesData.status
    );

    const uploadLimit = pLimit(CONFIG.PAGE_UPLOAD_CONCURRENCY);
    const chapterLimit = pLimit(CONFIG.CHAPTER_CONCURRENCY);

    const chapterTasks = seriesData.chapters.map(chapter => chapterLimit(() => 
      processChapter(chapter, seriesData.title, seriesId, browser, uploadLimit)
    ));

    await Promise.all(chapterTasks);

  } catch (err) {
    console.log(`\x1b[31m[Kritik-Hata]\x1b[0m >> ${err.message}`);
  }
}

async function main() {
  console.clear();
  console.log('\x1b[35m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
  console.log('\x1b[35m%s\x1b[0m', '║   ⚡ ANIPEAK V61: FINAL TITAN — R2 NITRO ⚡           ║');
  console.log('\x1b[35m%s\x1b[0m', '║   Hardcoded Credentials · Giga-Speed · 90% WebP      ║');
  console.log('\x1b[35m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');

  let urlPath = path.resolve('scraper', 'url.txt');
  if (!fs.existsSync(urlPath)) {
    urlPath = '/root/anipeak/scraper/url.txt'; 
  }

  if (fs.existsSync(urlPath)) {
    console.log(`\x1b[32m[INFO]\x1b[0m >> url.txt bulundu, linkler okunuyor...`);
    const input = fs.readFileSync(urlPath, 'utf-8');
    const targets = input.split('\n').map(t => t.trim()).filter(t => t.length > 5);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    for (const target of targets) {
      const url = target.startsWith('http') ? target : `${CONFIG.BASE_URL}/manga/${target}`;
      await processSeries(url, browser);
    }
    await browser.close();
  } else {
    console.log(`\x1b[31m[HATA]\x1b[0m >> url.txt bulunamadı!`);
  }

  console.log(`\n\x1b[32m[GÖREV TAMAMLANDI]\x1b[0m`);
}

main().catch(err => { console.error(err); process.exit(1); });
