import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';
import { BASE_URL } from '../utils/constants.js';
import { launchBrowser, navigateTo, delay, autoScroll } from './01_navigator.js';

const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive'
};

/**
 * Akıllı Extractor: Domain'e göre en hızlı ve doğru yöntemi seçer.
 */
export async function extractSeriesData(url) {
  const isMadara = url.includes('golgebahcesi.com') || url.includes('mangaokutr.co') || url.includes('mangaokutr.net');
  
  if (isMadara) {
    return await extractMadaraData(url);
  } else {
    return await extractKatanaData(url);
  }
}

/**
 * Madara (Gölge Bahçesi, MangaOkuTR vb.) için Puppeteer tabanlı extractor.
 * AJAX yüklemelerini bekler.
 */
async function extractMadaraData(url) {
  let browser = null;
  try {
    console.log(`\x1b[35m[AI-EXTRACT]\x1b[0m >> Madara saptandı, Puppeteer devreye giriyor: ${url}`);
    const launched = await launchBrowser();
    browser = launched.browser;
    const page = launched.page;

    const navOk = await navigateTo(page, url, 2);
    if (!navOk) throw new Error('Sayfaya gidilemedi.');

    // Madara Chapter List genelde bir buton veya scroll ile tetiklenir veya AJAX ile gelir
    // Biraz bekleyip scroll yapalım
    await delay(2000);
    await autoScroll(page);
    await delay(1000);

    const data = await page.evaluate(() => {
      const title = document.querySelector('.post-title h1')?.innerText.trim();
      const cover = document.querySelector('.summary_image img')?.src;
      const description = document.querySelector('.description-summary p')?.innerText.trim();
      
      const genres = [];
      document.querySelectorAll('.genres-content a').forEach(a => genres.push(a.innerText.trim()));

      const chapters = [];
      const seen = new Set();
      document.querySelectorAll('li.wp-manga-chapter a').forEach(a => {
        const href = a.href;
        if (!href) return;
        const numMatch = href.match(/bolum-(\d+(\.\d+)?)/) || href.match(/chapter-(\d+(\.\d+)?)/);
        const number = numMatch ? parseFloat(numMatch[1]) : null;
        if (number !== null && !seen.has(number)) {
          seen.add(number);
          chapters.push({ href, number, title: a.innerText.trim() });
        }
      });

      return { title, cover, description, genres, chapters };
    });

    if (!data.title || data.chapters.length === 0) {
      // Eğer hala 0 ise "Show More" butonuna basmayı deneyebiliriz ama genelde gerekmez
      console.log(`\x1b[31m[RETRY]\x1b[0m >> Bölüm bulunamadı, AJAX bekleniyor...`);
      await delay(3000);
    }

    await browser.close();
    
    // Temizlik ve Sıralama
    data.chapters.sort((a, b) => a.number - b.number);
    data.status = 'Devam Ediyor';
    
    console.log(`\x1b[32m[✓ MADARA]\x1b[0m >> Seri: ${data.title} | Bölüm: ${data.chapters.length}`);
    return data;

  } catch (err) {
    if (browser) await browser.close();
    logger.error(`[Madara-Extract] Hata: ${err.message}`);
    return null;
  }
}

/**
 * MangaKatana için hızlı Axios tabanlı extractor.
 */
async function extractKatanaData(url) {
  try {
    console.log(`\x1b[36m[FAST-FETCH]\x1b[0m >> ${url}`);
    const { data: html } = await axios.get(url, { headers: HTTP_HEADERS, timeout: 20000 });
    const $ = cheerio.load(html);

    let title = $('.info .heading').first().text().trim() || $('h1').first().text().trim();
    let cover = $('.cover img').first().attr('src') || $('.cover img').first().attr('data-src');
    let description = $('.summary p').first().text().trim();
    const genres = [];
    $('.info .genres a').each((i, el) => genres.push($(el).text().trim()));

    const chapters = [];
    const seen = new Set();
    $('.chapters .chapter a').each((i, el) => {
      const href = $(el).attr('href');
      if (!href || !href.includes('/c')) return;
      const fullHref = href.startsWith('http') ? href : `${BASE_URL}${href}`;
      const numMatch = href.match(/\/c(\d+(\.\d+)?)$/);
      if (numMatch) {
        const number = parseFloat(numMatch[1]);
        if (!seen.has(number)) {
          seen.add(number);
          chapters.push({ href: fullHref, number, title: $(el).text().trim() });
        }
      }
    });

    chapters.sort((a, b) => a.number - b.number);
    console.log(`\x1b[32m[✓ KATANA]\x1b[0m >> Seri: ${title} | Bölüm: ${chapters.length}`);
    return { title, cover, description, genres, status: 'Devam Ediyor', chapters };

  } catch (err) {
    logger.error(`[Katana-Extract] Hata: ${err.message}`);
    return null;
  }
}

export async function extractPopularSeriesUrls() {
  try {
    const { data: html } = await axios.get(BASE_URL, { headers: HTTP_HEADERS, timeout: 20000 });
    const $ = cheerio.load(html);
    const urls = [];
    $('a[href*="/manga/"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.match(/\/manga\/[a-z0-9-]+\.\d+$/i)) {
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        if (!urls.includes(fullUrl)) urls.push(fullUrl);
      }
    });
    return [...new Set(urls)].slice(0, 5);
  } catch (err) { return []; }
}
