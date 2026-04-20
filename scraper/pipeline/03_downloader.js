import axios from 'axios';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import pLimit from 'p-limit';
import logger from '../utils/logger.js';

/**
 * Bölümdeki tüm görselleri yakalar, optimize eder ve belleğe (Buffer) çeker.
 */
export async function downloadChapterPages(page, url, seriesTitle, chapterNumber) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    await page.evaluate(async () => {
      for (let i = 0; i < 6; i++) {
        window.scrollBy(0, window.innerHeight * 2);
        await new Promise(r => setTimeout(r, 150));
      }
    });

    const imgUrls = await page.evaluate((sel) => {
      return Array.from(document.querySelectorAll(sel))
        .map(img => img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src'))
        .filter(src => src && src.startsWith('http') && !src.includes('logo') && !src.includes('avatar'));
    }, '#imgs img, .wp-manga-chapter-img, img.wp-manga-chapter-img');

    if (imgUrls.length === 0) return null;

    console.log(`\x1b[36m[OPT-LOAD]\x1b[0m >> Ch.${chapterNumber}: ${imgUrls.length} sayfa optimize ediliyor...`);
    
    const pageLimit = pLimit(10);
    const referer = url.includes('mangaokutr') ? 'https://mangaokutr.co/' : new URL(url).origin + '/';

    const buffers = await Promise.all(imgUrls.map((u) => pageLimit(async () => {
      try {
        const res = await axios.get(u, { 
          responseType: 'arraybuffer', 
          timeout: 30000,
          headers: {
            'Referer': referer,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        // [SİBER-OPTİMİZASYON] 1600px Genişlik + JPEG (Quality 85)
        // Diske yazmadan direkt RAM üzerinde mermiyi inceltiyoruz amk
        const optimized = await sharp(res.data)
          .resize(1600, null, { withoutEnlargement: true })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();

        return optimized;
      } catch (e) { 
        return null; 
      }
    })));

    const finalBuffers = buffers.filter(b => b !== null);
    if (finalBuffers.length === 0) throw new Error("Optimizasyon/İndirme hatası");
    
    return finalBuffers;
  } catch (err) {
    logger.error(`[Downloader] Bölüm ${chapterNumber} çekilemedi: ${err.message}`);
    return null;
  }
}

/**
 * Kapak görselini belleğe çeker.
 */
export async function downloadCover(imageUrl) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 20000
    });
    return response.data;
  } catch (e) { 
    return null; 
  }
}
