// =============================================
// ☁️ MAHORAPEAK V24: FINAL-REAPER — PIPELINE STAGE 5: DISTRIBUTOR
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

const UPLOAD_ENDPOINTS = [
  'https://graph.org/upload',
  'https://telegra.ph/upload'
];
const GLOBAL_UPLOAD_LIMIT = pLimit(3); 

/**
 * Görseli Telegra.ph veya Graph.org sunucularına yükler (Bypass Modu)
 * @param {string|Buffer} source - Dosya yolu veya Buffer
 * @param {number} maxAttempts - Maksimum deneme sayısı
 */
export async function uploadToTelegraph(source, maxAttempts = 20) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    let endpoint = UPLOAD_ENDPOINTS[attempts % UPLOAD_ENDPOINTS.length];
    const isCatbox = attempts > 5; 
    if (isCatbox) endpoint = 'https://catbox.moe/user/api.php';
    try {
      const form = new FormData();
      if (isCatbox) {
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', Buffer.isBuffer(source) ? source : fs.createReadStream(source), { filename: 'p.jpg' });
      } else {
        form.append('file', Buffer.isBuffer(source) ? source : fs.createReadStream(source), { filename: 'p.jpg' });
      }
      const res = await axios.post(endpoint, form, { headers: form.getHeaders(), timeout: 25000 });
      if (isCatbox && typeof res.data === 'string' && res.data.startsWith('http')) return res.data;
      if (!isCatbox && Array.isArray(res.data) && res.data[0]?.src) return `${new URL(endpoint).origin}${res.data[0].src}`;
      throw new Error("Upload failed");
    } catch (err) {
      if (attempts >= 3) {
        console.log(`\x1b[33m[SNIPER-WAIT]\x1b[0m >> Pusu ağırlaştı, 10sn geri çekiliyoruz... (Deneme: ${attempts})`);
        await new Promise(r => setTimeout(r, 10000));
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
      attempts++;
    }
  }
  return null;
}

// Geriye dönük uyumluluk için takma ad (Kodun geri kalanı bozulmasın amk)
export const uploadToImgBB = uploadToTelegraph;

/**
 * Kapak görselini ImgBB'ye yükler.
 */
export async function uploadCover(coverBuffer) {
  if (!coverBuffer) return null;
  console.log(`\x1b[36m[UPLOAD]\x1b[0m >> Kapak yükleniyor...`);
  
  // Kapak için BENZERSİZ geçici dosya kullan (Paralel işlem çakışmasını önle)
  const tempName = `temp_cover_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
  const tempPath = path.join(process.cwd(), tempName);
  
  try {
    fs.writeFileSync(tempPath, coverBuffer);
    const url = await uploadToTelegraph(tempPath, 3); // Kapak için sadece 3 deneme amk
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    if (url) {
      console.log(`\x1b[32m[UPLOAD-OK]\x1b[0m >> Kapak: ${url}`);
    } else {
      console.log(`\x1b[33m[V50-UYARI]\x1b[0m >> Kapak yüklenemedi, bölümlere geçiliyor...`);
    }
    return url;
  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    return null;
  }
}

/**
 * İşlenmiş sayfaları Telegra.ph/Graph.org'a yükler ve URL dizisini döndürür.
 * @param {string[]|Buffer[]} sources - İşlenmiş dosya yolları veya Buffer dizisi
 */
export async function uploadChapterPages(sources) {
  const urls = new Array(sources.length); 
  const limit = pLimit(PAGE_UPLOAD_CONCURRENCY);
  
  console.log(`\x1b[36m[UPLOAD]\x1b[0m >> ${sources.length} sayfa paralel yükleniyor (Hız: ${PAGE_UPLOAD_CONCURRENCY})...`);
  
  let success = true;
  const tasks = sources.map((source, i) => GLOBAL_UPLOAD_LIMIT(async () => {
    if (!success) return;

    try {
      const url = await uploadToTelegraph(source, 1000); // Bölümler için ölmek var dönmek yok
      
      if (url) {
        urls[i] = url;
        const completed = urls.filter(u => u).length;
        
        // [V61-SİGARA-MOLASI] 800ms sabit, her 10 resimde bir 4sn nefes al amk
        await new Promise(r => setTimeout(r, 800));
        if (completed % 10 === 0) await new Promise(r => setTimeout(r, 4000));

        if (completed % 5 === 0 || completed === sources.length) {
           // Sessiz progres, studio ana logu basacak amk
        }
      } else {
        success = false;
        return null; // Bir resim bile patlarsa 10 deneme sonunda, bölümü sal amk
      }
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
  } else {
    console.log(`\x1b[90m[DB-SKIP] Bölüm ${chapterNumber} zaten veritabanında var.\x1b[0m`);
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
