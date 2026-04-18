// =============================================
// ☁️ ANIPEAK V24: FINAL-REAPER — PIPELINE STAGE 5: DISTRIBUTOR
// Advanced Key Rotation + 30s Cool-off
// =============================================

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pLimit from 'p-limit';
import logger from '../utils/logger.js';
import { supabase, getOrCreateSeries, createChapterIfNotExists } from '../src/db.js';
import { UPLOAD_DELAY_MS, PAGE_UPLOAD_CONCURRENCY } from '../utils/constants.js';
import { delay } from './01_navigator.js';

// .env yükleme (Daha sağlam yol amk!)
const envPath = fs.existsSync(path.resolve('.env')) ? path.resolve('.env') : path.resolve('scraper', '.env');
dotenv.config({ path: envPath });
console.log(`[SYSTEM] Config yüklendi: ${envPath}`);

// ImgBB Key Pool (Virgülle ayrılmış birden fazla key desteği)
const IMGBB_KEYS = (process.env.IMGBB_API_KEY || '').split(',').map(k => k.trim()).filter(k => k);
let currentKeyIndex = 0;

/**
 * Tek bir görseli ImgBB'ye yükler (Rate-Limit Safe & Key Rotation)
 */
export async function uploadToImgBB(imageBuffer) {
  let attempts = 0;
  const maxAttempts = IMGBB_KEYS.length * 2;

  while (attempts < maxAttempts) {
    const key = IMGBB_KEYS[currentKeyIndex];
    try {
      const base64 = imageBuffer.toString('base64');
      const form = new FormData();
      form.append('image', base64);

      const res = await axios.post(`https://api.imgbb.com/1/upload?key=${key}`, form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 90000
      });

      if (res.data && res.data.success) {
        return res.data.data.url;
      }
      throw new Error("ImgBB success=false");

    } catch (err) {
      const isRateLimit = err.response?.status === 429 || err.response?.status === 400 || (err.response?.data?.error?.message?.toLowerCase().includes('rate limit'));
      
      if (isRateLimit) {
        console.log(`\x1b[31m[RATE-LIMIT]\x1b[0m >> Key ${currentKeyIndex + 1} tıkandı veya limit doldu! 30 saniye mola ve key değişimi...`);
        await new Promise(r => setTimeout(r, 30000));
        currentKeyIndex = (currentKeyIndex + 1) % IMGBB_KEYS.length;
      } else {
        logger.error(`[Distributor] ImgBB Hatası (Key ${currentKeyIndex + 1}): ${err.message}`);
        currentKeyIndex = (currentKeyIndex + 1) % IMGBB_KEYS.length;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        console.log(`\x1b[33m[RETRY]\x1b[0m >> Diğer anahtar namluya sürülüyor (Deneme ${attempts}/${maxAttempts})...`);
      }
    }
  }
  return null;
}

/**
 * Kapak görselini ImgBB'ye yükler.
 */
export async function uploadCover(coverBuffer) {
  if (!coverBuffer) return null;
  console.log(`\x1b[36m[UPLOAD]\x1b[0m >> Kapak yükleniyor...`);
  const url = await uploadToImgBB(coverBuffer);
  if (url) {
    console.log(`\x1b[32m[UPLOAD-OK]\x1b[0m >> Kapak: ${url}`);
  }
  return url;
}

/**
 * İşlenmiş sayfaları ImgBB'ye yükler ve URL dizisini döndürür.
 * @param {string[]} processedPaths - İşlenmiş dosya yolları
 * @returns {string[]} ImgBB URL dizisi
 */
export async function uploadChapterPages(processedPaths) {
  const urls = new Array(processedPaths.length); // Sırayı korumak için amk
  const limit = pLimit(PAGE_UPLOAD_CONCURRENCY);
  
  console.log(`\x1b[36m[UPLOAD]\x1b[0m >> ${processedPaths.length} sayfa paralel yükleniyor (Hız: ${PAGE_UPLOAD_CONCURRENCY})...`);

  let success = true;
  const tasks = processedPaths.map((filePath, i) => limit(async () => {
    if (!success) return;

    try {
      const buffer = fs.readFileSync(filePath);
      const url = await uploadToImgBB(buffer);
      
      if (url) {
        urls[i] = url;
        console.log(`\x1b[90m  [${i + 1}/${processedPaths.length}]\x1b[0m ${url}`);
      } else {
        success = false;
        logger.error(`[Distributor] Sayfa ${i + 1} yüklenemedi: ${filePath}`);
      }

      // Rate limit koruması (Paralelde mola biraz riskli ama olsun amk)
      if (UPLOAD_DELAY_MS > 0) await new Promise(r => setTimeout(r, UPLOAD_DELAY_MS));
    } catch (err) {
      success = false;
      logger.error(`[Distributor] Yükleme hatası (${i + 1}): ${err.message}`);
    }
  }));

  await Promise.all(tasks);

  if (!success || urls.some(u => !u)) return null;
  return urls;
}

/**
 * Seriyi Supabase'e kaydeder veya günceller.
 */
export async function syncSeries(title, coverUrl, description, genres, status) {
  const seriesId = await getOrCreateSeries(title, coverUrl, description || '', genres, status);
  console.log(`\x1b[34m[DB]\x1b[0m >> Seri Kaydı: ID=${seriesId}`);
  return seriesId;
}

/**
 * Bölümü Supabase'e kaydeder.
 */
export async function syncChapter(seriesId, chapterNumber, title, pageUrls) {
  const result = await createChapterIfNotExists(seriesId, chapterNumber, title, pageUrls);
  if (result) {
    console.log(`\x1b[32m[DB-OK]\x1b[0m >> Bölüm ${chapterNumber} veritabanına kaydedildi. (${pageUrls.length} sayfa)`);
  }
  return result;
}
/**
 * Yeni bölüm duyurusunu veritabanına fırlatır (Telsiz Mesajı).
 */
export async function notifyNewChapter(seriesId, seriesTitle, chapterNumber) {
  try {
    const { error } = await supabase
      .from('announcements')
      .insert([{
        type: 'new_chapter',
        text: `🔥 Yeni Bölüm Yayında! ${seriesTitle} - Bölüm ${chapterNumber} sitemize jilet gibi eklendi.`,
        series_id: seriesId,
        chapter_num: chapterNumber
      }]);

    if (error) throw error;
    console.log(`\x1b[35m[TELSİZ]\x1b[0m >> 'Yeni Bölüm Yayında!' mesajı millete gönderildi.`);
  } catch (err) {
    logger.error(`[Distributor] Duyuru hatası: ${err.message}`);
  }
}
