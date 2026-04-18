import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { getOrCreateSeries, createChapterIfNotExists, supabase } from './src/db.js';
import { processAndUploadEliteImage } from './utils/imageProcessor.js';
import logger from './utils/logger.js';
import readline from 'readline';

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// ==========================================
// 🛡️ ANIPEAK OPERASYON MERKEZİ
// ==========================================
const BASE_URL = 'https://mangafire.to';
const DISCLAIMER = "\n\n*Bu seri MangaFire kaynaklı olup, Gemini AI tarafından Türkçeleştirilmiştir. Çeviri ve edit AniPeak AI sistemine aittir.*";
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      let distance = 400;
      let timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 150);
    });
  });
}

async function runAIEliteScraper() {
  console.clear();
  console.log("\x1b[35m%s\x1b[0m", "==========================================================");
  console.log("\x1b[35m%s\x1b[0m", "🌐 ANIPEAK: AI ELITE SCRAPER V10 (INTERACTIVE MODE) 🌐");
  console.log("\x1b[35m%s\x1b[0m", "==========================================================");

  const input = await askQuestion("\n\x1b[33m[TEĞMEN-SORUSU]\x1b[0m >> Seri isimleri veya URL girin (Boş bırakırsanız popülerleri çeker): ");
  let targetTitles = input.split(',').map(t => t.trim()).filter(t => t.length > 0);

  if (targetTitles.length === 0) {
    console.log("\x1b[34m[OTOMATİK]\x1b[0m >> Giriş yapılmadı, popüler seriler hedefe alınıyor...");
    targetTitles = ['POPULAR_FALLBACK']; // Bu özel string fallback mantığını tetikleyecek
  }


  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: "new", 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1200 });
    
    // Anti-Ad & Stealth
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (let title of targetTitles) {
      console.log(`\n\x1b[36m[OPERASYON]\x1b[0m >> İşleniyor: ${title}`);
      
      let targetUrl = null;

      if (title.startsWith('http')) {
        targetUrl = title;
        console.log(`\x1b[32m[DIREKT-HAT]\x1b[0m >> URL üzerinden devam ediliyor.`);
      } else if (title !== 'POPULAR_FALLBACK') {
        // 1. Arama Mantığı
        await page.goto(`${BASE_URL}/filter?keyword=${encodeURIComponent(title)}`, { waitUntil: 'networkidle2' });
        await delay(3000);
        
        targetUrl = await page.evaluate((t) => {
          const found = Array.from(document.querySelectorAll('.original.card-title a, .manga-box a, .item a'))
            .find(a => a.innerText.toLowerCase().includes(t.toLowerCase()));
          return found ? found.href : null;
        }, title);
      }


      if (!targetUrl) {
        logger.warn(`[V10] Seri bulunamadı: ${title}. Popüler serilere bakılıyor...`);
        
        // POPÜLER FALLBACK
        await page.goto(`${BASE_URL}/trending`, { waitUntil: 'networkidle2' });
        await delay(3000);
        targetUrl = await page.evaluate(() => {
          const firstPopular = document.querySelector('.manga-box a, .item a, .original.card-title a');
          return firstPopular ? firstPopular.href : null;
        });

        if (!targetUrl) {
          logger.error(`[V10] Popüler seri de bulunamadı.`);
          continue;
        }
        console.log(`\x1b[34m[FALLBACK]\x1b[0m >> Popüler seriye geçildi.`);
      }

      console.log(`\x1b[32m[TESPİT]\x1b[0m >> Seri URL: ${targetUrl}`);
      await page.goto(targetUrl, { waitUntil: 'load', timeout: 60000 });
      await delay(3000);
      
      // Sayfanın gerçekten yüklendiğinden emin ol (Başlık elementini bekle)
      try {
        await page.waitForSelector('h1, .manga-name, .info h1', { timeout: 10000 });
      } catch (e) {
        logger.warn(`[V10] Başlık elementi bulunamadı, yine de devam ediliyor...`);
      }

      // 2. Metadata Çekimi (Hata Toleranslı)
      let sData = null;
      try {
        sData = await page.evaluate(() => {
          let title = document.querySelector('.info h1')?.innerText.trim() || 
                      document.querySelector('.manga-name')?.innerText.trim() ||
                      document.querySelector('h1')?.innerText.trim();
          
          if (title?.toLowerCase().includes('read manga online')) {
             title = document.querySelector('.manga-box h3, .item h3')?.innerText.trim() || title;
          }

          const cover = document.querySelector('.poster img')?.src || document.querySelector('.manga-poster img')?.src || document.querySelector('img')?.src;
          const description = document.querySelector('.description')?.innerText.trim() || document.querySelector('.summary')?.innerText.trim();
          const genres = Array.from(document.querySelectorAll('a[href*="/genre/"]')).map(a => a.innerText.trim());
          const status = document.body.innerText.includes('Ongoing') ? 'Devam Ediyor' : 'Tamamlandı';
          
          const chapterElements = Array.from(document.querySelectorAll('.list-body li a, .chapter-list a, a[href*="/read/"]'));
          const chapters = chapterElements
            .filter(a => a.href.includes('/chapter-') || a.href.includes('/bolum-'))
            .map(a => {
              const numMatch = a.innerText.match(/(\d+(\.\d+)?)/);
              return {
                href: a.href,
                number: numMatch ? parseFloat(numMatch[0]) : 0,
                title: a.innerText.trim()
              };
            })
            .filter(c => c.number > 0);

          const uniqueChapters = [];
          const seenNumbers = new Set();
          for (const c of chapters) {
            if (!seenNumbers.has(c.number)) {
              uniqueChapters.push(c);
              seenNumbers.add(c.number);
            }
          }

          return { title, cover, description, status, genres, chapters: uniqueChapters };
        });
      } catch (evalErr) {
        logger.error(`[V10] Metadata çekme hatası: ${evalErr.message}`);
        continue;
      }

      if (!sData || !sData.title || !sData.cover) {
        logger.warn(`[V10] Veri eksik veya çekilemedi: ${targetUrl}`);
        continue;
      }

      if (sData.chapters.length === 0) {
        console.log(`\x1b[31m[UYARI]\x1b[0m >> Bölüm listesi boş! Dinamik yükleme bekleniyor...`);
        await autoScroll(page);
        await delay(3000);
        // Sayfayı tekrar tara
        const retryChapters = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.list-body li a, .chapter-list a, a[href*="/read/"]'))
              .filter(a => a.href.includes('/chapter-'))
              .map(a => ({
                href: a.href,
                number: parseFloat(a.innerText.match(/(\d+(\.\d+)?)/)?.[0] || '0'),
                title: a.innerText.trim()
              })).filter(c => c.number > 0);
        });
        if (retryChapters.length > 0) sData.chapters = retryChapters;
      }



      const seriesId = await getOrCreateSeries(sData.title, await processAndUploadEliteImage(sData.cover, true, sData.title), sData.description + DISCLAIMER, sData.genres, sData.status);
      console.log(`\x1b[34m[AMBAR]\x1b[0m >> Seri Veritabanı ID: ${seriesId}`);

      // 3. Bölümleri Sıralı İşle
      const sortedChapters = sData.chapters.sort((a, b) => a.number - b.number);
      for (const chapter of sortedChapters) {
        const { data: existing } = await supabase.from('chapters').select('id').eq('series_id', seriesId).eq('number', chapter.number).maybeSingle();
        if (existing) {
          console.log(`\x1b[90m[ATLANIYOR]\x1b[0m >> Bölüm ${chapter.number} zaten mevcut.`);
          continue;
        }

        console.log(`\x1b[33m[AI-OPERASYON]\x1b[0m >> ${sData.title} - Bölüm ${chapter.number} İşleniyor...`);
        
        let pageUrls = [];
        let retryCount = 0;
        const MAX_RETRIES = 3;

        while (pageUrls.length < 15 && retryCount < MAX_RETRIES) {
          if (retryCount > 0) {
            console.log(`\x1b[31m[RETRY]\x1b[0m >> Sayfa sayısı yetersiz (${pageUrls.length}). Yeniden taranıyor... (${retryCount}/${MAX_RETRIES})`);
            await page.reload({ waitUntil: 'networkidle2' });
          } else {
            await page.goto(chapter.href, { waitUntil: 'networkidle2' });
          }

          await autoScroll(page);
          await delay(6000); // Daha fazla bekle (MangaFire yavaş yüklenir)

          pageUrls = await page.evaluate(() => {
             // MangaFire Reader Selectors
             const images = Array.from(document.querySelectorAll('#reader-area img, .reader-content img, .page-img img, #reader img'));
             return images
               .filter(img => {
                 const src = img.src || img.dataset.src;
                 // Yüklenmemiş veya placeholder olanları ele
                 return src && 
                        !src.includes('logo') && 
                        !src.includes('loading') &&
                        img.naturalWidth > 100; // Placeholderlar genelde küçük naturalWidth'e sahiptir
               })
               .map(img => img.src || img.dataset.src);
          });
          
          retryCount++;
        }

        if (pageUrls.length < 15) {
          logger.error(`[V10] Bölüm ${chapter.number} sayfa sayısı çok düşük (${pageUrls.length}), atlanıyor!`);
          continue;
        }

        const processedPages = [];
        let pageCounter = 1;
        for (const pUrl of pageUrls) {
          const result = await processAndUploadEliteImage(pUrl, false, sData.title, chapter.number, pageCounter);
          if (result) {
            processedPages.push(result);
            pageCounter++;
          } else {
            logger.error(`[V10] Sayfa ${pageCounter} işlenemedi! Bölüm durduruluyor.`);
            break; // Bir sayfa bile fail olursa bölümü yarım bırakma (Sıfır Veri Kaybı Garantisi)
          }
        }

        if (processedPages.length === pageUrls.length) {
          await createChapterIfNotExists(seriesId, chapter.number, `${sData.title} - Bölüm ${chapter.number}`, processedPages);
          console.log(`\x1b[32m[AI-SUCCESS]\x1b[0m >> Bölüm ${chapter.number} tamamlandı. (${processedPages.length} sayfa)`);
        } else {
          logger.warn(`[V10] Bölüm ${chapter.number} eksik sayfa nedeniyle veritabanına işlenmedi!`);
        }
      }
    }
  } catch (err) {
    logger.error(`[V9-Kritik] ${err.message}`);
  } finally {
    if (browser) await browser.close();
    rl.close();
  }
}

runAIEliteScraper();
