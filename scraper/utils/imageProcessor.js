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

if (fs.existsSync(path.resolve('scraper', '.env'))) {
  dotenv.config({ path: path.resolve('scraper', '.env') });
} else {
  dotenv.config();
}

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

export async function processAndUploadEliteImage(imageUrl, isCover = false, seriesTitle = 'Unknown', chapterNumber = 0, pageIndex = 1) {
  try {
    const { data: buffer } = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 30000
    });

    // 1. Akıllı Reklam & Logo Tespiti (Placeholder Engeli)
    if (!isCover) {
       const isAd = await checkIsAd(buffer);
       // Boyut kontrolü: Manga sayfaları genelde büyüktür. 
       // Placeholder logoları genelde küçük (örn 300x400) veya çok hafiftir.
       const metadata = await sharp(buffer).metadata();
       const isTooSmall = metadata.width < 400 || metadata.height < 600;
       const isTooLight = buffer.byteLength < 20000; // 20KB altı genelde logodur

       if (isAd || isTooSmall || isTooLight) {
          logger.warn(`[Archive-Security] Logo/Placeholder elendi (${metadata.width}x${metadata.height}, ${Math.round(buffer.byteLength/1024)}KB): ${imageUrl}`);
          return null; 
       }
    }

    let processedBuffer = buffer;

    // 2. GEMINI AI ÇEVİRİ & DİZGİ
    if (!isCover) {
      logger.info(`[Archive-AI] Sayfa tercüme ediliyor: ${seriesTitle} - Bölüm ${chapterNumber} - Sayfa ${pageIndex}`);
      processedBuffer = await translateAndTypesetManga(processedBuffer);
    }

    // 3. Marka Basımı (Branding) & Optimizasyon
    let sharpInstance = sharp(processedBuffer);
    
    if (isCover) {
      sharpInstance = sharpInstance.resize(400, 600, { fit: 'cover' });
    } else {
      // Sayfanın altına jilet gibi marka bas
      const metadata = await sharpInstance.metadata();
      const svgText = `
        <svg width="${metadata.width}" height="40">
          <rect x="0" y="0" width="${metadata.width}" height="40" fill="rgba(0,0,0,0.6)" />
          <text x="50%" y="25" font-family="Arial" font-size="24" fill="white" text-anchor="middle" font-weight="bold">ANIPEAK.COM.TR</text>
        </svg>`;
      
      sharpInstance = sharpInstance.composite([{
        input: Buffer.from(svgText),
        gravity: 'south'
      }]);
    }

    const finalBuffer = await sharpInstance
      .png({ quality: 90 })
      .toBuffer();

    // 4. YEREL ARŞİVLEME (C:\Users\Murathan\Desktop\anipeak manga)
    try {
      const safeTitle = seriesTitle.replace(/[\\/:*?"<>|]/g, '_');
      const seriesDir = path.join(BASE_ARCHIVE_PATH, safeTitle);
      let targetDir = seriesDir;
      let fileName = 'cover.png';

      if (!isCover) {
        targetDir = path.join(seriesDir, `Bolum ${chapterNumber}`);
        fileName = `${pageIndex.toString().padStart(2, '0')}.png`;
      }

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, fileName);
      fs.writeFileSync(filePath, finalBuffer);
      logger.info(`[Archive-Local] Kaydedildi: ${filePath}`);
    } catch (fsErr) {
      logger.error(`[Archive-Local] Kayıt hatası: ${fsErr.message}`);
    }

    // 5. ImgBB BULUT DAĞITIMI (Rotation)
    let uploadUrl = null;
    for (let i = 0; i < IMGBB_KEYS.length; i++) {
       const key = IMGBB_KEYS[currentKeyIndex];
       try {
         const base64Data = finalBuffer.toString('base64');
         const form = new FormData();
         form.append('image', base64Data);

         const res = await axios.post(`https://api.imgbb.com/1/upload?key=${key}`, form, {
           headers: form.getHeaders(),
           maxContentLength: Infinity,
           maxBodyLength: Infinity
         });

         if (res.data && res.data.success) {
            uploadUrl = res.data.data.url;
            logger.info(`[Archive-Cloud] ImgBB Yüklendi (${key.substring(0,4)}...): ${uploadUrl}`);
            break;
         }
       } catch (e) {
         currentKeyIndex = (currentKeyIndex + 1) % IMGBB_KEYS.length;
       }
    }

    if (!uploadUrl) throw new Error("Tüm ImgBB anahtarları başarısız!");
    return uploadUrl;

  } catch (error) {
    if (error.response) {
      logger.error(`[Archive-Processor] API Hatası: ${JSON.stringify(error.response.data)}`);
    }
    logger.error(`[Archive-Processor] Kritik Hata (${imageUrl}): ${error.message}`);
    return isCover ? null : imageUrl; 
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

