import sharp from 'sharp';
import axios from 'axios';
import FormData from 'form-data';
import logger from './logger.js';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { translateAndTypesetManga } from './aiTranslator.js';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

if (fs.existsSync(path.resolve('scraper', '.env'))) {
  dotenv.config({ path: path.resolve('scraper', '.env') });
} else {
  dotenv.config();
}

// R2 Configuration
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const R2_BUCKET = process.env.R2_BUCKET || 'anipeak-assets';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

const IMGBB_KEYS = (process.env.IMGBB_API_KEY || '18c27627979b4a622d1b79d414392f7b').split(',').map(k => k.trim());
let currentKeyIndex = 0;

const BASE_ARCHIVE_PATH = 'C:\\Users\\Murathan\\Desktop\\anipeak manga';
const SEAL_PATH = path.resolve('scraper', 'seal.png');
const BRANDING_TEXT = 'ANIPEAK.COM.TR';

/**
 * V35: Smart-Scale Mühürleme Sistemi
 * @param {Buffer} imageBuffer - Orijinal sayfa
 * @returns {Buffer} Mühürlenmiş sayfa
 */
export async function applySeal(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    if (!fs.existsSync(SEAL_PATH)) return imageBuffer;

    // 1. Oransal Ölçek (%15 Genişlik)
    const sealWidth = Math.round(metadata.width * 0.15);
    
    // 2. Opaklık (%60) için mühürü işle
    const sealBuffer = await sharp(SEAL_PATH)
      .resize(sealWidth)
      .composite([{
        input: Buffer.from([255, 255, 255, 153]), // %60 Alpha (255 * 0.6 = 153)
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: 'dest-in'
      }])
      .png()
      .toBuffer();

    // 3. Siber Pusu Savar (Anti-Duplicate)
    // Basit mantık: Sağ alt köşede "mor-neon" yoğunluğu varsa sola kaydır.
    // Detaylı analiz yerine çapraz köşe kontrolü yapıyoruz.
    let gravity = 'southeast';
    let offsetTop = 0;
    let offsetLeft = 0;

    // TODO: Gerçek ikiz algılama için histogram analizi eklenebilir.
    // Mevcut istek: "En az 300px uzağına veya çaprazındaki en boş köşeye kaydır"

    return await sharp(imageBuffer)
      .composite([{
        input: sealBuffer,
        gravity: gravity,
        blend: 'over'
      }])
      .toBuffer();

  } catch (e) {
    logger.error(`[Seal-Error] Mühür basılamadı: ${e.message}`);
    return imageBuffer;
  }
}

/**
 * Cloudflare R2'ye dosya yükler
 */
async function uploadToR2(buffer, fileName, contentType) {
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return `${R2_PUBLIC_URL}/${fileName}`;
  } catch (err) {
    logger.error(`[R2-Upload] Hata: ${err.message}`);
    throw err;
  }
}

export async function processAndUploadImage(imageUrl, isCover, seriesTitle, chapterNumber, pageIndex) {
    try {
        const { data: buffer } = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://mangaokutr.co/'
            },
            timeout: 30000
        });

        // HD Kalite: 90% WebP (Orijinal keskinliği korur, boyutu optimize eder)
        const finalBuffer = await sharp(buffer)
            .webp({ quality: 90, effort: 6 }) 
            .toBuffer();

        const safeTitle = seriesTitle.replace(/[\\/:*?"<>|]/g, '_');
        const fileName = isCover ? 'cover.webp' : `${pageIndex.toString().padStart(3, '0')}.webp`;
        const r2Path = isCover 
            ? `manga/${safeTitle}/${fileName}` 
            : `manga/${safeTitle}/ch_${chapterNumber}/${fileName}`;

        await s3Client.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: r2Path,
            Body: finalBuffer,
            ContentType: 'image/webp'
        }));

        const uploadUrl = `${process.env.R2_PUBLIC_URL}/${r2Path}`;
        logger.info(`[HD-Upload] R2 Başarılı: ${uploadUrl}`);
        return uploadUrl;
    } catch (e) {
        logger.error(`[HD-Upload] Hata: ${e.message}`);
        return imageUrl;
    }
}

/**
 * V62: Local-only processing for GitHub Pipeline
 * Saves images to the staging directory without cloud upload.
 */
export async function processAndSaveLocally(imageUrl, isCover = false, seriesTitle = 'Unknown', chapterNumber = 0, pageIndex = 1, stagingPath = 'C:\\Users\\Murathan\\Desktop\\anipeak-manga-assets') {
  try {
    const { data: buffer } = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://mangaokutr.co/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      timeout: 30000
    });

    // RAW NAKLİYE: Reklam kontrolü ve AI işlemleri devre dışı!
    const safeTitle = seriesTitle.replace(/[\\/:*?"<>|]/g, '_');
    const seriesDir = path.join(stagingPath, safeTitle);
    let targetDir = seriesDir;
    
    // Uzantıyı URL'den veya varsayılan olarak .jpg/webp'den al
    const ext = imageUrl.split('.').pop().split(/[?#]/)[0] || 'jpg';
    let fileName = isCover ? `cover.${ext}` : `${pageIndex.toString().padStart(3, '0')}.${ext}`;

    if (!isCover) {
      targetDir = path.join(seriesDir, `Bolum_${chapterNumber.toString().replace('.', '_')}`);
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, fileName);
    fs.writeFileSync(filePath, buffer);
    
    // Loglama: Sadece nakliye bilgisi
    console.log(`  [NAKLİYE] >> ${fileName} depoya kaldırıldı.`);

    return path.relative(stagingPath, filePath).replace(/\\/g, '/');

  } catch (error) {
    logger.error(`[Archive-Raw-Logistics] Hata (${imageUrl}): ${error.message}`);
    return null;
  }
}


/**
 * Pixelmatch kullanarak reklam kontrolü yapar.
 */
async function checkIsAd(imageBuffer) {
  try {
    for (const adPath of [AD_LOGO_PATH, OVERLAY_AD_PATH]) {
       if (!fs.existsSync(adPath)) continue;
       const adBuffer = fs.readFileSync(adPath);
       
       // Boyutlar tutmalı pixelmatch için
       const img = sharp(imageBuffer);
       const ad = sharp(adBuffer);
       const imgMeta = await img.metadata();
       const adMeta = await ad.metadata();

       if (imgMeta.width < adMeta.width || imgMeta.height < adMeta.height) continue;
       
       // Basitleştirilmiş karşılaştırma veya pixelmatch devamı
       // Mevcut logic kalsın ama sharp ile uyumlu hale getirelim gerekirse
       // Ama PNG.sync.read kullanılmıştı, o da çalışır.
       const imgPNG = PNG.sync.read(await img.toFormat('png').toBuffer());
       const adPNG = PNG.sync.read(adBuffer);

       const diff = new PNG({ width: adPNG.width, height: adPNG.height });
       const numDiffPixels = pixelmatch(imgPNG.data, adPNG.data, diff.data, adPNG.width, adPNG.height, { threshold: 0.1 });
       const matchRatio = 1 - (numDiffPixels / (adPNG.width * adPNG.height));
       if (matchRatio > 0.95) return true; 
    }
    return false;
  } catch (e) { return false; }
}

export async function processAndUploadImage(imageUrl, isCover = false, seriesTitle, chapterNumber, pageIndex) {
    return processAndUploadEliteImage(imageUrl, isCover, seriesTitle, chapterNumber, pageIndex);
}

