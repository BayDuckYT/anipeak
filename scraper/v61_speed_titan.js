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

puppeteer.use(StealthPlugin());
process.setMaxListeners(0);
EventEmitter.defaultMaxListeners = 0;
https.globalAgent.setMaxListeners(0);

dotenv.config({ path: '/root/anipeak/scraper/.env' });

// ────────────────────────────────────────────────────────────
// ⚙️ KONFİGÜRASYON (R2 & HD EDITION)
// ────────────────────────────────────────────────────────────
const CONFIG = {
  BASE_URL: 'https://mangaokutr.co',
  CHAPTER_CONCURRENCY: 10,   // ULTRA HIZ: Aynı anda 10 bölüm
  PAGE_DOWNLOAD_LIMIT: 40,   // NITRO: Bölüm başına 40 paralel sayfa
};

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://5ea1dc1a085c04db3ae5f70b4e945b44.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: 'cf18c4a293cab8223922055c0b79b96b',
    secretAccessKey: 'e1f013e37f508f08345149a362119145ea0f532bde793d3df30c727daa4b6960',
  },
});

const R2_BUCKET = (process.env.R2_BUCKET || 'anipeakimage').trim();
const R2_PUBLIC_URL = 'https://pub-56389f4fc14f4af4b80a25136a28126e.r2.dev';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ────────────────────────────────────────────────────────────
// 🖼️ HD GÖRÜNTÜ İŞLEME & R2 YÜKLEME
// ────────────────────────────────────────────────────────────

async function processAndUploadR2(imageUrl, isCover, seriesTitle, chapterNumber, pageIndex, referer) {
  try {
    const res = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 25000,
      headers: {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // HD Kalite: 90% WebP (Orijinal keskinliği korur)
    let finalBuffer;
    let format = 'webp';
    let contentType = 'image/webp';
    
    try {
      finalBuffer = await sharp(res.data)
        .webp({ quality: 90, effort: 6 }) 
        .toBuffer();
    } catch (sharpErr) {
      // "too large for the WebP format" hatası (uzun webtoon şeritlerinde) olursa JPEG'e dön
      if (sharpErr.message.includes('too large for the WebP format')) {
        logger.warn(`[Titan-HD] WebP limiti aşıldı, JPEG olarak işleniyor... (${imageUrl})`);
        format = 'jpg';
        contentType = 'image/jpeg';
        finalBuffer = await sharp(res.data, { limitInputPixels: false })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
      } else {
        throw sharpErr;
      }
    }

    const safeTitle = seriesTitle.replace(/[\\/:*?"<>|]/g, '_');
    const fileName = isCover ? `cover.${format}` : `${String(pageIndex).padStart(3, '0')}.${format}`;
    const r2Path = isCover 
      ? `manga/${safeTitle}/${fileName}` 
      : `manga/${safeTitle}/ch_${chapterNumber}/${fileName}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Path,
      Body: finalBuffer,
      ContentType: contentType
    }));

    return `${R2_PUBLIC_URL}/${r2Path}`;
  } catch (e) {
    logger.error(`[Titan-HD] Hata (${imageUrl}): ${e.message}`);
    return null;
  }
}

// 🔍 SERİ + BÖLÜM META VERİSİ ÇEKME

async function extractSeriesInfo(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  } catch (e) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
  }
  return await page.evaluate(() => {
    const title = document.querySelector('.post-title h1, h1')?.innerText.trim();
    const cover = document.querySelector('.summary_image img, .poster img')?.src;
    const description = document.querySelector('.description-summary, .summary__content, .summary')?.innerText.trim() || '';
    const genres = Array.from(document.querySelectorAll('a[href*="/manga-genre/"], .genres-content a')).map(a => a.innerText.trim());
    const status = document.body.innerText.includes('Ongoing') || document.body.innerText.includes('Devam') ? 'Devam Ediyor' : 'Tamamlandı';
    
    // Orijinal isim tespiti
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
    await page.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  } catch (e) {
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

// 🚀 ANA SERİ İŞLEME

async function processSeries(seriesUrl, browser) {
  console.log(`\x1b[35m[TITAN-HD]\x1b[0m >> Hedef: ${seriesUrl}`);
  
  const mainPage = await browser.newPage();
  await mainPage.setViewport({ width: 1440, height: 900 });

  try {
    const seriesData = await extractSeriesInfo(mainPage, seriesUrl);
    await mainPage.close();

    if (!seriesData?.title) {
      console.log(`\x1b[33m[SKIP]\x1b[0m >> Veri alınamadı: ${seriesUrl}`);
      return;
    }

    console.log(`\x1b[36m[INFO]\x1b[0m >> ${seriesData.title}: HD İşlem Başlıyor...`);

    // Kapak HD Yükle
    let coverUrl = seriesData.cover;
    if (seriesData.cover) {
      coverUrl = await processAndUploadR2(seriesData.cover, true, seriesData.title, 0, 0, CONFIG.BASE_URL + '/');
    }

    const seriesId = await getOrCreateSeries(
      seriesData.title, coverUrl,
      seriesData.description,
      seriesData.genres.length > 0 ? seriesData.genres : ['Aksiyon'],
      seriesData.status
    );

    const chapterLimit = pLimit(CONFIG.CHAPTER_CONCURRENCY);

    for (const chapter of seriesData.chapters) {
      // KENDİ KENDİNİ ONARMA: Eğer bölüm varsa ama linkler bozuksa (..r2 içeriyorsa) tekrar indir
      const { data: existing } = await supabase.from('chapters')
        .select('id, images')
        .eq('series_id', seriesId)
        .eq('number', chapter.number)
        .single();
      
      const isBroken = existing?.images?.some(img => img.includes('..r2')) || (existing && (!existing.images || existing.images.length < 3));
      if (existing && !isBroken) continue;
      
      if (isBroken) {
        console.log(`\x1b[33m[REPAIR]\x1b[0m >> Bozuk link tespit edildi, yeniden işleniyor: Ch.${chapter.number}`);
      }

      await chapterLimit(async () => {
        const chPage = await browser.newPage();
        try {
          const pageUrls = await extractChapterPageUrls(chPage, chapter.href);
          if (pageUrls.length < 3) return;

          console.log(`\x1b[36m[HD-DL]\x1b[0m >> ${seriesData.title} Ch.${chapter.number}: ${pageUrls.length} sayfa...`);
          const referer = new URL(chapter.href).origin + '/';
          
          // ULTRA HIZ: Sayfaları seri (Promise.all) şekilde yükle
          const uploadPromises = pageUrls.map((url, i) => 
            processAndUploadR2(url, false, seriesData.title, chapter.number, i + 1, referer)
          );
          const results = await Promise.all(uploadPromises);
          const uploadedPages = results.filter(url => url !== null);

          if (uploadedPages.length > 0) {
            // Eğer varsa eski bozuk veriyi sil (onarma modu)
            if (existing?.id) {
              await supabase.from('chapters').delete().eq('id', existing.id);
            }
            await createChapterIfNotExists(seriesId, chapter.number, `${seriesData.title} - Bölüm ${chapter.number}`, uploadedPages);
            console.log(`\x1b[32m[HD-OK]\x1b[0m >> Ch.${chapter.number} başarıyla mühürlendi.`);
          }
        } finally {
          await chPage.close();
        }
      });
    }
  } catch (err) {
    console.log(`\x1b[31m[!]\x1b[0m >> ${err.message}`);
  }
}

async function main() {
  console.clear();
  console.log('\x1b[35m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
  console.log('\x1b[35m%s\x1b[0m', '║   ⚡ ANIPEAK V61: SPEED TITAN — HD R2 EDITION ⚡        ║');
  console.log('\x1b[35m%s\x1b[0m', '║   90% WebP HD · No GitHub · Direct R2 · Ultra Fast    ║');
  console.log('\x1b[35m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');

  let urlPath = path.resolve('scraper', 'url.txt');
  if (!fs.existsSync(urlPath)) {
    urlPath = '/root/anipeak/scraper/url.txt'; // VDS Fallback
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

  if (fs.existsSync(urlPath)) {
    // Tüm linkler işlendiği için PM2 sonsuz döngüsünü kırmak adına dosyayı temizle
    fs.writeFileSync(urlPath, '');
    console.log(`\x1b[32m[INFO]\x1b[0m >> url.txt temizlendi (PM2 sonsuz döngüsü engellendi).`);
  }

  console.log(`\n\x1b[32m[GÖREV TAMAMLANDI]\x1b[0m`);
}

import fs from 'fs';
main().catch(err => { console.error(err); process.exit(1); });
