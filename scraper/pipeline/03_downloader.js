import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';
import { ARCHIVE_BASE, CHAPTER_IMAGES_SELECTOR } from '../utils/constants.js';
import { autoScroll, delay, navigateTo, startImageInterception, stopImageInterception } from './01_navigator.js';

export async function downloadChapterPages(page, chapterUrl, seriesTitle, chapterNumber) {
  const safeTitle = seriesTitle.replace(/[\\/:*?"<>|]/g, '_');
  const engDir = path.join(ARCHIVE_BASE, safeTitle, 'ENG', `Bölüm_${chapterNumber}`);
  if (!fs.existsSync(engDir)) fs.mkdirSync(engDir, { recursive: true });

  // 1. Sayfaya Git (Agresif)
  const isMadara = chapterUrl.includes('golgebahcesi') || chapterUrl.includes('mangaokutr') || chapterUrl.includes('weebcentral');
  
  let interceptedImages = [];
  if (isMadara) {
    interceptedImages = await startImageInterception(page);
  }

  let navOk = await navigateTo(page, chapterUrl, 5);
  if (!navOk) {
    if (isMadara) await stopImageInterception(page);
    return null;
  }

  // 2. Yönlendirme Kontrolü (Symbaloo vb. kaçışı engelle)
  const currentUrl = page.url();
  if (!currentUrl.includes('mangaokutr') && !currentUrl.includes('golgebahcesi') && !currentUrl.includes('mangakatana')) {
    console.log(`\x1b[31m[!] Yönlendirme saptandı, geri dönülüyor...\x1b[0m`);
    await page.goto(chapterUrl, { waitUntil: 'domcontentloaded' });
    await delay(3000);
  }

  // 3. Agresif Kaydır ve Bekle (Madara-Defeat V22)
  console.log(`\x1b[33m[SCRAPE]\x1b[0m >> Sayfa aşağı kaydırılıyor (Lazy-load tetikleniyor)...`);
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
    await delay(1000);
  }
  await autoScroll(page); // Final tam kaydırma
  await delay(2000);

  // 4. Görsel Avcı Taktiği (Ghost-Reaper V23 Anti-Spam)
  const imageUrls = await page.evaluate(() => {
    const spamKeywords = ['banner', 'reklam', 'next-chapter', 'credit', 'discord', 'ads', 'button', 'donat', 'social'];
    
    return Array.from(document.querySelectorAll('img')).map(img => {
      const src = img.getAttribute('src') || '';
      const dataSrc = img.getAttribute('data-src') || '';
      const lazySrc = img.getAttribute('data-lazy-src') || '';
      
      const candidates = [dataSrc, lazySrc, src].filter(s => s && s.trim());
      for (let s of candidates) {
        s = s.trim();
        const low = s.toLowerCase();
        
        // Spam Filtresi (Keyword)
        if (spamKeywords.some(key => low.includes(key))) continue;

        if ((low.startsWith('http') || low.startsWith('//')) && 
            (low.includes('.jpg') || low.includes('.jpeg') || low.includes('.png') || low.includes('.webp')) &&
            !low.includes('logo') && !low.includes('avatar')) {
          return s.startsWith('//') ? `https:${s}` : s;
        }
      }
      return null;
    }).filter(s => s !== null);
  });

  if (imageUrls.length === 0) {
    console.log(`\x1b[31m[HATA]\x1b[0m >> Görsel bulunamadı! Madara Bypass deneniyor...`);
    
    let finalUrls = interceptedImages.filter(src => {
      const low = src.toLowerCase();
      return !low.includes('logo') && !low.includes('ads') && !low.includes('avatar');
    });

    if (finalUrls.length === 0) {
      finalUrls = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('img, a')).map(el => el.src || el.href || el.getAttribute('data-src'))
            .filter(s => s && s.startsWith('http') && (s.includes('manga') || s.includes('chapter')) && (s.includes('.jpg') || s.includes('.png')));
      });
    }

    if (isMadara) await stopImageInterception(page);

    if (finalUrls.length > 0) return await downloadList(finalUrls, engDir, isMadara, chapterUrl);
    return null;
  }

  if (isMadara) await stopImageInterception(page);

  return await downloadList(imageUrls, engDir, isMadara, chapterUrl);
}

async function downloadList(urls, dir, isMadara, chapterUrl) {
  const paths = [];
  const referer = isMadara ? (chapterUrl.includes('golge') ? 'https://golgebahcesi.com/' : 'https://mangaokutr.co/') : 'https://mangakatana.com/';
  
  console.log(`\x1b[32m[DOWNLOAD]\x1b[0m >> ${urls.length} sayfa indiriliyor...`);

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const outputPath = path.join(dir, `${(i + 1).toString().padStart(2, '0')}.png`);
    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': referer },
        timeout: 30000
      });
      
      // V23 Anti-Spam: Boyut ve Çözünürlük Kontrolü
      const metadata = await sharp(res.data).metadata();
      const isTooSmall = (metadata.width < 500 && metadata.height < 500) || res.data.byteLength < 30000;
      const isHorizontal = metadata.width > metadata.height && metadata.width > 800; // Bannerlar genelde yataydır

      if (isTooSmall || isHorizontal) {
        logger.warn(`[GHOST-REAPER] Spam elendi (${metadata.width}x${metadata.height}): ${url}`);
        continue;
      }

      const buffer = await sharp(res.data).png().toBuffer();
      fs.writeFileSync(outputPath, buffer);
      paths.push(outputPath);
    } catch (e) {
      // Sessiz hata
    }
  }
  return paths.length > 0 ? paths : null;
}

export async function downloadCover(imageUrl, seriesTitle) {
  try {
    const res = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = await sharp(res.data).resize(400, 600).png().toBuffer();
    const safeTitle = seriesTitle.replace(/[\\/:*?"<>|]/g, '_');
    const coverPath = path.join(ARCHIVE_BASE, safeTitle, 'cover.png');
    if (!fs.existsSync(path.dirname(coverPath))) fs.mkdirSync(path.dirname(coverPath), { recursive: true });
    fs.writeFileSync(coverPath, buffer);
    return buffer;
  } catch (e) { return null; }
}

export function isChapterDownloaded() { return false; }
