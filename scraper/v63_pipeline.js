import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import pLimit from 'p-limit';
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(ROOT, '.env') });

const args = process.argv.slice(2);
const APPLY = args.includes('--apply') && !args.includes('--dry-run');
const HELP = args.includes('--help') || args.includes('-h');
const positional = args.filter((arg) => !arg.startsWith('--'));
const BASE_URL = (process.env.SCRAPER_BASE_URL || 'https://mangaokutr.co').replace(/\/$/, '');
const INPUT_FILE = process.env.SCRAPER_URL_FILE || path.join(ROOT, 'url.txt');
const REQUEST_DELAY_MS = boundedNumber(process.env.SCRAPER_DELAY_MS, 900, 250, 10000);
const PAGE_CONCURRENCY = boundedNumber(process.env.SCRAPER_PAGE_CONCURRENCY, 3, 1, 5);
const MIN_PAGES = boundedNumber(process.env.SCRAPER_MIN_PAGES, 3, 1, 100);
const SERIES_LIMIT = boundedNumber(args.find((arg) => arg.startsWith('--limit='))?.split('=')[1], 0, 0, 10000);
const PREVIEW_CHAPTER_LIMIT = boundedNumber(args.find((arg) => arg.startsWith('--preview-chapters='))?.split('=')[1], 5, 1, 100);
const SOURCE_HOST = new URL(BASE_URL).hostname.toLowerCase();

let supabase;
let objectStore;
let publicImagesUrl;
let bucket;

function boundedNumber(raw, fallback, min, max) {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function log(level, message) {
  const stamp = new Date().toISOString();
  console[level === 'error' ? 'error' : 'log'](`[${stamp}] [${level.toUpperCase()}] ${message}`);
}

function usage() {
  console.log(`MahoraPeak Scraper v63\n\nUsage:\n  npm run v63 -- [--dry-run] [--limit=1] [URL ...]\n  npm run v63 -- --apply [--limit=1] [URL ...]\n\nDefault mode only reads source pages and the database. --apply enables database and image-store writes.\nIf no URL is supplied, URLs are read from scraper/url.txt.`);
}

function requireSafeSourceUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Geçersiz seri adresi: ${raw}`);
  }
  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== SOURCE_HOST) {
    throw new Error(`Yalnızca yapılandırılmış HTTPS kaynak alan adı kullanılabilir: ${SOURCE_HOST}`);
  }
  return url.href;
}

async function loadTargets() {
  const lines = positional.length
    ? positional
    : (await fs.readFile(INPUT_FILE, 'utf8')).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
  const targets = [...new Set(lines.map(requireSafeSourceUrl))];
  if (!targets.length) throw new Error(`İşlenecek adres bulunamadı. ${INPUT_FILE} dosyasına seri adresleri ekle.`);
  return SERIES_LIMIT > 0 ? targets.slice(0, SERIES_LIMIT) : targets;
}

function configureServices() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    if (APPLY) throw new Error('Canlı kayıt için scraper/.env içinde SUPABASE_URL ve SUPABASE_SERVICE_KEY gerekli.');
    log('warn', 'Supabase ayarları yok; deneme modu kaynak verilerini tarayıp kayıt önizlemesi yapacak.');
  } else {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }

  if (!APPLY) return;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
  // The legacy bucket has a public development hostname. It is not a secret;
  // deployments can override it with R2_PUBLIC_URL for a custom domain.
  publicImagesUrl = (process.env.R2_PUBLIC_URL || 'https://pub-56389f4fc14f4af4b80a25136a28126e.r2.dev').replace(/\/$/, '');
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');
  const missing = [
    ['R2_ACCOUNT_ID or R2_ENDPOINT', endpoint],
    ['R2_ACCESS_KEY_ID', accessKeyId],
    ['R2_SECRET_ACCESS_KEY', secretAccessKey],
    ['R2_BUCKET or R2_BUCKET_NAME', bucket],
    ['R2_PUBLIC_URL', publicImagesUrl],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) throw new Error(`R2 yapılandırması eksik: ${missing.join(', ')}`);

  objectStore = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function scrapeSeries(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('h1', { timeout: 20000 });
  const data = await page.evaluate(async (sourceHost) => {
    const readImage = (img) => img?.getAttribute('data-src') || img?.getAttribute('data-lazy-src') || img?.getAttribute('data-litespeed-src') || img?.currentSrc || img?.src || '';
    const title = document.querySelector('.post-title h1, h1')?.textContent?.trim() || '';
    const cover = readImage(document.querySelector('.summary_image img, .poster img, .wp-post-image, .ts-post-image'));
    const description = document.querySelector('.description-summary, .summary__content, .entry-content p, .summary')?.textContent?.trim() || '';
    const genres = [...document.querySelectorAll('a[href*="manga-genre"], .genres-content a, .mgen a')]
      .map((node) => node.textContent.trim()).filter(Boolean);
    const body = document.body.innerText.toLocaleLowerCase();
    const status = /ongoing|devam ediyor|güncel/.test(body) ? 'Devam Ediyor' : /completed|tamamlandı|bitti/.test(body) ? 'Tamamlandı' : 'Bilinmiyor';
    const parseChapters = (root) => [...root.querySelectorAll('.wp-manga-chapter a, .listing-chapters_wrap a, #chapterlist a, .cl_list a')]
      .map((link) => {
        const href = link.href;
        const text = link.textContent.trim();
        const match = `${text} ${href}`.match(/(?:bolum|chapter)[\s\-_]*(\d+(?:\.\d+)?)/i) || text.match(/(\d+(?:\.\d+)?)/);
        const number = match ? Number(match[1]) : 0;
        try {
          if (new URL(href).hostname.toLowerCase() !== sourceHost) return null;
        } catch { return null; }
        return number > 0 ? { href, number, title: text } : null;
      }).filter(Boolean);
    let chapters = parseChapters(document);

    // Madara temalı siteler bölüm listesini ilk HTML yerine bu uç noktadan POST ile getirir.
    if (!chapters.length && document.querySelector('#manga-chapters-holder')) {
      const response = await fetch(new URL('ajax/chapters/', location.href), {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (response.ok) {
        const html = await response.text();
        const chapterDocument = new DOMParser().parseFromString(html, 'text/html');
        chapters = parseChapters(chapterDocument);
      }
    }
    const unique = [...new Map(chapters.map((chapter) => [chapter.number, chapter])).values()]
      .sort((a, b) => a.number - b.number);
    return { title, cover, description, genres: [...new Set(genres)], status, chapters: unique };
  }, SOURCE_HOST);

  if (!data.title || data.title.length < 2) throw new Error('Seri başlığı bulunamadı; sayfa yapısı değişmiş olabilir.');
  if (!data.cover || !/^https:\/\//i.test(data.cover)) throw new Error('Kapak görseli bulunamadı; kayıt güvenlik için durduruldu.');
  if (!data.chapters.length) throw new Error('Bölüm listesi bulunamadı; kayıt güvenlik için durduruldu.');
  return data;
}

async function scrapeChapterPages(page, chapterUrl) {
  await page.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await delay(350);
  await page.evaluate(async () => {
    for (let index = 0; index < 8; index += 1) {
      window.scrollBy(0, Math.max(window.innerHeight, 700));
      await new Promise((resolve) => setTimeout(resolve, 180));
    }
    window.scrollTo(0, 0);
  });
  return page.evaluate(() => {
    const selectors = ['#readerarea img', '.reading-content img', '#imgs img', '.page-break img', '#reader-area img', '.wp-manga-chapter-img'];
    let nodes = [];
    for (const selector of selectors) {
      nodes = [...document.querySelectorAll(selector)];
      if (nodes.length) break;
    }
    const urls = nodes.map((img) => (img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-litespeed-src') || img.currentSrc || img.src || '').trim())
      .filter((url) => /^https:\/\//i.test(url) && !/logo|loading|avatar|data:image/i.test(url));
    return [...new Set(urls)];
  });
}

async function fetchImage(url, referer) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: 25 * 1024 * 1024,
        maxBodyLength: 25 * 1024 * 1024,
        headers: {
          Referer: referer,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        },
      });
      const output = await sharp(response.data, { limitInputPixels: 50_000_000 })
        .rotate().webp({ quality: 90, effort: 4 }).toBuffer();
      if (output.length < 1024) throw new Error('Görsel dosyası beklenenden küçük.');
      return output;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await delay(700 * (2 ** attempt));
    }
  }
  throw lastError;
}

function safePathPart(value) {
  const safe = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
  const stem = safe || 'mahorapeak_series';
  const suffix = createHash('sha256').update(value).digest('hex').slice(0, 8);
  return `${stem.slice(0, 70)}_${suffix}`;
}

async function putImage(key, buffer) {
  await objectStore.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return `${publicImagesUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

async function findSeries(title) {
  const { data, error } = await supabase.from('series').select('id,title,slug,cover,description,genre,status')
    .eq('title', title).limit(1);
  if (error) throw new Error(`Seri veritabanında aranamadı: ${error.message}`);
  return data?.[0] || null;
}

async function findChapters(seriesId) {
  const { data, error } = await supabase.from('chapters').select('id,number,pages').eq('series_id', seriesId).order('number');
  if (error) throw new Error(`Bölümler veritabanından okunamadı: ${error.message}`);
  return data || [];
}

async function ensureSeries(series, coverUrl) {
  const existing = await findSeries(series.title);
  if (existing) {
    const patch = {};
    if (!existing.cover && coverUrl) patch.cover = coverUrl;
    if (!existing.description && series.description) patch.description = series.description;
    if ((!existing.genre || existing.genre.length === 0) && series.genres.length) patch.genre = series.genres;
    if ((!existing.status || existing.status === 'Bilinmiyor') && series.status !== 'Bilinmiyor') patch.status = series.status;
    if (Object.keys(patch).length) {
      const { error } = await supabase.from('series').update(patch).eq('id', existing.id);
      if (error) throw new Error(`Seri metaverisi güncellenemedi: ${error.message}`);
    }
    return existing.id;
  }

  const { data, error } = await supabase.from('series').insert({
    title: series.title,
    slug: safePathPart(series.title),
    cover: coverUrl,
    description: series.description || '',
    genre: series.genres.length ? series.genres : [],
    status: series.status,
    reads_num: 0,
    rating: 0,
  }).select('id').single();
  if (error) throw new Error(`Seri eklenemedi: ${error.message}`);
  return data.id;
}

async function updateSeriesCover(seriesId, coverUrl) {
  const { error } = await supabase.from('series').update({ cover: coverUrl }).eq('id', seriesId);
  if (error) throw new Error(`Seri kapağı güncellenemedi: ${error.message}`);
}

async function saveChapter(seriesId, chapter, existing, pageUrls, seriesTitle, chapterPage) {
  const keyTitle = safePathPart(seriesTitle);
  const keyNumber = String(chapter.number).replace('.', '_');
  const limit = pLimit(PAGE_CONCURRENCY);
  const results = await Promise.allSettled(pageUrls.map((url, index) => limit(async () => {
    const buffer = await fetchImage(url, new URL(chapterPage).origin + '/');
    return { index, key: `manga/${keyTitle}/ch_${keyNumber}/${String(index + 1).padStart(3, '0')}.webp`, buffer };
  })));
  const ready = results.filter((result) => result.status === 'fulfilled').map((result) => result.value);
  if (ready.length < MIN_PAGES) {
    throw new Error(`Yalnızca ${ready.length} sayfa başarıyla hazırlanabildi; bölüm kaydedilmedi.`);
  }
  const uploaded = await Promise.allSettled(ready.map(async ({ index, key, buffer }) => ({ index, key, url: await putImage(key, buffer) })));
  const good = uploaded.filter((result) => result.status === 'fulfilled').map((result) => result.value);
  if (good.length < MIN_PAGES) {
    await Promise.allSettled(good.map(({ key }) => objectStore.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))));
    throw new Error(`Yalnızca ${good.length} sayfa depoya kaydedilebildi; bölüm kaydedilmedi.`);
  }
  const pages = good.sort((a, b) => a.index - b.index).map((item) => item.url);

  if (existing) {
    const { error } = await supabase.from('chapters').update({ pages }).eq('id', existing.id);
    if (error) throw new Error(`Bozuk bölüm onarılamadı: ${error.message}`);
    return 'repaired';
  }
  const { error } = await supabase.from('chapters').insert({
    series_id: seriesId,
    number: chapter.number,
    title: chapter.title || `${seriesTitle} - Bölüm ${chapter.number}`,
    pages,
    is_premium: false,
  });
  if (error) throw new Error(`Bölüm eklenemedi: ${error.message}`);
  return 'created';
}

async function processSeries(browser, url, index, total) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  try {
    log('info', `(${index}/${total}) Kaynak taranıyor: ${url}`);
    const series = await scrapeSeries(page, url);
    log('info', `${series.title}: ${series.chapters.length} bölüm bulundu; ${series.genres.length} tür.`);

    let existingSeries = null;
    let knownChapters = [];
    if (supabase) {
      try {
        existingSeries = await findSeries(series.title);
        if (existingSeries) knownChapters = await findChapters(existingSeries.id);
      } catch (error) {
        if (APPLY) throw error;
        log('warn', `Veritabanı denetimi atlandı: ${error.message}`);
      }
    }
    const knownMap = new Map(knownChapters.map((chapter) => [Number(chapter.number), chapter]));
    const candidates = series.chapters.filter((chapter) => {
      const current = knownMap.get(chapter.number);
      return !current || !Array.isArray(current.pages) || current.pages.length < MIN_PAGES;
    });
    log('info', `${existingSeries ? 'Mevcut seri' : 'Yeni seri'}; ${candidates.length} yeni/eksik bölüm adayı.`);

    if (!APPLY) {
      let previewPages = 0;
      const previewChapters = candidates.slice(0, PREVIEW_CHAPTER_LIMIT);
      for (const chapter of previewChapters) {
        await delay(REQUEST_DELAY_MS);
        const urls = await scrapeChapterPages(page, chapter.href);
        previewPages += urls.length;
        log(urls.length >= MIN_PAGES ? 'info' : 'warn', `Önizleme: Bölüm ${chapter.number}, ${urls.length} sayfa${urls.length < MIN_PAGES ? ' — yetersiz, kayda uygun değil' : ''}.`);
      }
      log('info', `Deneme tamamlandı: ${series.title}; ${previewPages} sayfa bulundu, ${Math.max(0, candidates.length - previewChapters.length)} aday bölüm önizleme sınırı nedeniyle taranmadı. Hiçbir görsel veya veritabanı kaydı değiştirilmedi.`);
      return;
    }

    // Insert the database row before uploading. A rejected database write must
    // not leave a new, unreferenced cover image in object storage.
    let coverUrl = existingSeries?.cover || series.cover;
    const seriesId = await ensureSeries(series, coverUrl);
    const hasStoredCover = Boolean(existingSeries?.cover && existingSeries.cover.startsWith(`${publicImagesUrl}/`));
    if (!hasStoredCover) {
      const coverBuffer = await fetchImage(series.cover, new URL(url).origin + '/');
      const coverPath = `manga/${safePathPart(series.title)}/cover.webp`;
      coverUrl = await putImage(coverPath, coverBuffer);
      await updateSeriesCover(seriesId, coverUrl);
    }
    const chapterMap = new Map(knownChapters.map((chapter) => [Number(chapter.number), chapter]));

    for (const chapter of candidates) {
      await delay(REQUEST_DELAY_MS);
      try {
        const pageUrls = await scrapeChapterPages(page, chapter.href);
        if (pageUrls.length < MIN_PAGES) {
          log('warn', `Bölüm ${chapter.number} atlandı: ${pageUrls.length} sayfa bulundu.`);
          continue;
        }
        const result = await saveChapter(seriesId, chapter, chapterMap.get(chapter.number), pageUrls, series.title, chapter.href);
        log('info', `Bölüm ${chapter.number}: ${result === 'repaired' ? 'onarım tamamlandı' : 'eklendi'} (${pageUrls.length} sayfa).`);
      } catch (error) {
        log('error', `${series.title} / Bölüm ${chapter.number}: ${error.message}`);
      }
    }
  } finally {
    await page.close().catch(() => {});
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (HELP) return usage();
  const targets = await loadTargets();
  configureServices();
  if (APPLY && !supabase) throw new Error('Canlı kayıt için Supabase bağlantısı kurulamadı.');

  log('info', `MahoraPeak Scraper v63 başladı — mod: ${APPLY ? 'CANLI YAZMA' : 'DENEME (yalnızca okuma)'}`);
  log('info', `${targets.length} seri kuyruğa alındı; bölüm paralelliği ${PAGE_CONCURRENCY}, istek aralığı ${REQUEST_DELAY_MS} ms.`);
  if (!APPLY) log('warn', 'Veritabanı ve görsel deposuna yazma kapalı. Canlı kayıt yalnızca --apply ile açılır.');

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  let failed = 0;
  try {
    for (const [index, url] of targets.entries()) {
      try {
        await processSeries(browser, url, index + 1, targets.length);
      } catch (error) {
        failed += 1;
        log('error', `${url}: ${error.message}`);
      }
    }
  } finally {
    await browser.close();
    await objectStore?.destroy();
  }
  log(failed ? 'warn' : 'info', `İşlem bitti. ${targets.length - failed}/${targets.length} seri tarandı; ${failed} seri hata aldı.`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  log('error', error.message);
  process.exitCode = 1;
});
