/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   🕷️  ANIPEAK SİBER ÖRÜMCEK v1.1 — R2 AVATAR FRAME BOT   ║
 * ║   Hedef: ragnarscans.com/effect/                      ║
 * ║   Görev: Tüm isim efektlerini Cloudflare R2'ye yükle    ║
 * ║   v1.1: Cloudflare SSL bypass — Puppeteer fetch engine      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import 'dotenv/config';
import puppeteer from 'puppeteer';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import https from 'https';
import fs from 'fs';

import { NodeHttpHandler } from '@smithy/node-http-handler';

// ─── R2 YAPILANDIRMASI ─────────────────────────────────────────
// Cloudflare R2 sunucuları, AWS SDK'nın varsayılan Node HTTP istemcisi ile
// TLS Handshake (EPROTO) hatası verebilir. Bunu aşmak için özel bir agent kullanıyoruz.
const agent = new https.Agent({
  rejectUnauthorized: false, // Antivirüs / proxy engellerini aşar
  keepAlive: true,           // R2 sunucusuyla bağlantıyı açık tutarak hızlandırır
  maxSockets: 50,
});

const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,       // https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  forcePathStyle: true,                    // KRİTİK: Cloudflare R2 wildcard SSL hatasını (EPROTO) engeller!
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  requestHandler: new NodeHttpHandler({
    httpsAgent: agent,
  }),
});
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'anipeak';
const R2_PREFIX = 'name-effects/';

// ─── HEDEF SAYFALARI ────────────────────────────────────────────
const BASE_URL = 'https://ragnarscans.com/effect/';
const PAGES = [
  BASE_URL,
  `${BASE_URL}page/2/`,
  `${BASE_URL}page/3/`,
];

// ─── YARDIMCI: Puppeteer Üzerinden Buffer İndir ─────────────────
// Cloudflare, Node.js native TLS'i reddediyor + page.goto() da yeni bağlantı açıyor.
// Çözüm: ragnarscans.com'da kalıp same-origin fetch() kullanmak.
// Chrome'un mevcut TLS oturumu + same-origin = Cloudflare bypass.
let _dlPage = null;
async function ensureDownloadPage(browser) {
  if (!_dlPage || _dlPage.isClosed()) {
    _dlPage = await browser.newPage();
    await _dlPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
    // Hedef domain'e git — same-origin fetch için ZORUNLU
    await _dlPage.goto('https://ragnarscans.com/effect/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 20000 
    });
    console.log('[DL-PAGE] >> ragnarscans.com oturumu kuruldu.');
  }
  return _dlPage;
}

async function downloadBuffer(browser, url) {
  const page = await ensureDownloadPage(browser);
  
  // Sayfada kalarak same-origin fetch yap (XHR fallback ile)
  const base64 = await page.evaluate(async (imgUrl) => {
    // Yöntem 1: fetch API
    try {
      const res = await fetch(imgUrl, { 
        mode: 'cors',
        credentials: 'same-origin',
        cache: 'no-store'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      // Chunk'lara böl — büyük dosyalarda stack overflow'u önle
      const chunkSize = 8192;
      let binary = '';
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
      }
      return btoa(binary);
    } catch (fetchErr) {
      // Yöntem 2: XHR fallback
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', imgUrl, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
          if (xhr.status === 200) {
            const bytes = new Uint8Array(xhr.response);
            const chunkSize = 8192;
            let binary = '';
            for (let i = 0; i < bytes.length; i += chunkSize) {
              binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
            }
            resolve(btoa(binary));
          } else {
            reject(new Error(`XHR HTTP ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('XHR + Fetch ikisi de başarısız'));
        xhr.send();
      });
    }
  }, url);
  
  return Buffer.from(base64, 'base64');
}

// ─── YARDIMCI: Content-Type Belirle ─────────────────────────────
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.png':  'image/png',
    '.webp': 'image/webp',
    '.gif':  'image/gif',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg':  'image/svg+xml',
  };
  return map[ext] || 'application/octet-stream';
}

// ─── YARDIMCI: R2'de Zaten Var mı? ─────────────────────────────
async function existsInR2(key) {
  try {
    await R2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

// ─── R2'YE YÜKLE ───────────────────────────────────────────────
async function uploadToR2(buffer, filename) {
  const key = `${R2_PREFIX}${filename}`;
  
  // Dublikasyon kontrolü
  if (await existsInR2(key)) {
    console.log(`   [ATLANDI] >> ${filename} zaten R2'de mevcut.`);
    return { skipped: true, key };
  }

  const cmd = new PutObjectCommand({
    Bucket:      R2_BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: getMimeType(filename),
    // Şeffaflık korunur, buffer doğrudan binary olarak gider
  });

  await R2.send(cmd);
  console.log(`   [R2 ✓] >> ${key} (${(buffer.length / 1024).toFixed(1)} KB)`);
  return { skipped: false, key };
}

// ─── PUPPETEER: SAYFADAN ÇERÇEVE LİNKLERİNİ ÇEK ───────────────
async function extractFramesFromPage(browser, pageUrl) {
  const page = await browser.newPage();
  
  // Reklam/tracker engelle
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const type = req.resourceType();
    const url = req.url();
    if (['font', 'stylesheet', 'media'].includes(type)) {
      req.abort();
    } else if (url.includes('googletagmanager') || url.includes('cloudflareinsights') || 
               url.includes('media-analytic') || url.includes('kktc-vip')) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');

  console.log(`\n[NAV] >> ${pageUrl}`);
  await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Lazy-load'u tetikle: sayfayı aşağıya kaydır
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const timer = setInterval(() => {
        window.scrollBy(0, 400);
        totalHeight += 400;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  await new Promise(r => setTimeout(r, 2000)); // Görsellerin yüklenmesini bekle

  // effect-card içindeki tüm name effect background image'larını çek
  const frames = await page.evaluate(() => {
    const cards = document.querySelectorAll('.effect-card');
    const results = [];
    
    cards.forEach(card => {
      // İsmi al (h2 > a)
      const titleEl = card.querySelector('h2 a');
      const name = titleEl ? titleEl.textContent.trim() : 'unknown';
      
      // Görseli al (uk-text-background class'ına sahip elemanın style attribute'undan)
      const spanEl = card.querySelector('.uk-text-background');
      if (!spanEl) return;
      
      const style = spanEl.getAttribute('style') || '';
      const match = style.match(/background-image:\s*url\(([^)]+)\)/);
      if (!match) return;
      
      const src = match[1].replace(/['"]/g, '');
      if (!src.includes('wp-content/uploads')) return;
      
      results.push({ name, src });
    });
    
    return results;
  });

  console.log(`[BULUNDU] >> ${frames.length} çerçeve tespit edildi.`);
  await page.close();
  return frames;
}

// ─── DETAY SAYFASINDAN YÜKSEK ÇÖZÜNÜRLÜK GÖRSELİ ÇEK ──────────
async function getHighResFromDetailPage(browser, frameCard) {
  // Detay sayfasına git ve daha yüksek çözünürlüklü görseli bul
  const slug = frameCard.src.split('/').pop().replace(/\.[^.]+$/, '');
  
  // Çoğu zaman doğrudan src yeterince yüksek çözünürlüklü oluyor
  // WordPress genellikle -80x80, -150x150 gibi suffix'ler ekler
  // Eğer suffix varsa kaldır
  let highResSrc = frameCard.src;
  highResSrc = highResSrc.replace(/-\d+x\d+\./, '.');
  
  return highResSrc;
}

// ─── DOSYA ADI TEMİZLEYİCİ ─────────────────────────────────────
function sanitizeFilename(name, srcUrl) {
  // Orijinal dosya adını URL'den çek (örn: Gojo.png, a_8f1c8cc...png)
  const urlPath = new URL(srcUrl).pathname;
  let originalName = path.basename(urlPath);
  
  if (!originalName) {
    originalName = `${Date.now()}.png`;
  }
  
  return originalName;
}

// ═══════════════════════════════════════════════════════════════
//   ANA OPERASYON
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║   🕷️  ANIPEAK SİBER ÖRÜMCEK v1.1 (CF SSL BYPASS)           ║
║   Hedef: ragnarscans.com/effect/                      ║
║   Görev: Tüm isim efektlerini R2'ye yükle                        ║
╚══════════════════════════════════════════════════════════════╝
`);

  // ── ENV KONTROLÜ ──
  const requiredEnvs = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'];
  const missing = requiredEnvs.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`[HATA] >> .env'de eksik değişkenler: ${missing.join(', ')}`);
    console.error(`\n[BİLGİ] >> .env dosyana şu satırları ekle:`);
    console.error(`  R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`);
    console.error(`  R2_ACCESS_KEY_ID=<API_TOKEN_ACCESS_KEY>`);
    console.error(`  R2_SECRET_ACCESS_KEY=<API_TOKEN_SECRET_KEY>`);
    console.error(`  R2_BUCKET_NAME=anipeak`);
    process.exit(1);
  }

  // ── PUPPETEER BAŞLAT ──
  console.log('[MOTOR] >> Puppeteer başlatılıyor...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  });

  let allFrames = [];

  try {
    // ── TÜM SAYFALARI TARA ──
    for (const pageUrl of PAGES) {
      const frames = await extractFramesFromPage(browser, pageUrl);
      allFrames.push(...frames);
    }

    // ── DUPLİKASYON TEMİZLİĞİ ──
    const uniqueMap = new Map();
    allFrames.forEach(f => uniqueMap.set(f.src, f));
    allFrames = [...uniqueMap.values()];
    
    console.log(`\n${'━'.repeat(60)}`);
    console.log(`[TOPLAM] >> ${allFrames.length} benzersiz isim efekti bulundu.`);
    console.log(`${'━'.repeat(60)}\n`);

    if (allFrames.length === 0) {
      console.log('[UYARI] >> Hiçbir çerçeve bulunamadı! Site yapısı değişmiş olabilir.');
      await browser.close();
      return;
    }

    // ── İNDİR VE R2'YE YÜKLE ──
    let uploaded = 0, skipped = 0, failed = 0;

    for (let i = 0; i < allFrames.length; i++) {
      const frame = allFrames[i];
      const progress = `[${i + 1}/${allFrames.length}]`;
      
      // Yüksek çözünürlüklü URL'yi hesapla (WordPress resize suffix'ini kaldır)
      const highResUrl = frame.src.replace(/-\d+x\d+\./, '.');
      const filename = sanitizeFilename(frame.name, highResUrl);
      
      console.log(`${progress} "${frame.name}"`);
      console.log(`   [HEDEF] >> ${highResUrl}`);
      
      let success = false;
      let lastErr = null;

      // 3 Kez Tekrar Dene (Ağ / SSL Hatalarına Karşı)
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Adım 1: İndirme
          console.log(`   [DENEME ${attempt}/3] >> Puppeteer ile indiriliyor...`);
          const buffer = await downloadBuffer(browser, highResUrl);
          
          if (buffer.length < 500) {
            console.log(`   [UYARI] >> Çok küçük dosya (${buffer.length}B), atlanıyor...`);
            success = false;
            break; // Dosya bozuksa tekrar deneme
          }
          
          // Adım 2: R2'ye Yükleme
          console.log(`   [DENEME ${attempt}/3] >> AWS SDK ile R2'ye yükleniyor...`);
          const result = await uploadToR2(buffer, filename);
          
          if (result.skipped) {
            skipped++;
          } else {
            uploaded++;
          }
          
          success = true;
          break; // Başarılı, döngüden çık
          
        } catch (err) {
          lastErr = err;
          console.log(`   [HATA - Deneme ${attempt}/3] >> ${err.message.split('\\n')[0]}`);
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 2000 * attempt)); // Giderek artan bekleme süresi
          }
        }
      }

      if (!success && lastErr) {
        console.log(`   [BAŞARISIZ] >> ${frame.name} indirilemedi/yüklenemedi!`);
        failed++;
      }
      
      // Rate-limit koruması
      await new Promise(r => setTimeout(r, 300));
    }
    
    // ── JSON ENJEKSİYONU (SİTEYE EKLEME) ──
    try {
      const effectsPath = path.resolve('../src/data/effects.json');
      console.log(`\n   [JSON] >> ${effectsPath} dosyasına yazılıyor...`);
      
      let effectsData = [];
      if (fs.existsSync(effectsPath)) {
        const raw = fs.readFileSync(effectsPath, 'utf8');
        effectsData = JSON.parse(raw);
      }

      const R2_PUBLIC_URL = 'https://pub-56389f4fc14f4af4b80a25136a28126e.r2.dev/name-effects';
      let addedToSite = 0;

      for (const frame of allFrames) {
        // Dosya adı hesaplama (birebir aynı metot)
        const highResUrl = frame.src.replace(/-\d+x\d+\./, '.');
        const filename = sanitizeFilename(frame.name, highResUrl);
        const fullUrl = `${R2_PUBLIC_URL}/${filename}`;

        // Zaten ekli mi kontrol et
        const alreadyExists = effectsData.some(e => e.url === fullUrl);
        
        if (!alreadyExists) {
          effectsData.push({
            id: `name_effect_${filename.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
            url: fullUrl,
            label: frame.name,
            category: "name_effects",
            emoji: ""
          });
          addedToSite++;
        }
      }

      if (addedToSite > 0) {
        fs.writeFileSync(effectsPath, JSON.stringify(effectsData, null, 2), 'utf8');
        console.log(`   [JSON ✓] >> ${addedToSite} adet yeni isim efekti web sitesine (effects.json) eklendi!`);
      } else {
        console.log(`   [JSON] >> Eklenecek yeni efekt bulunamadı (Zaten hepsi sitede var).`);
      }

    } catch (err) {
      console.log(`   [JSON HATA] >> effects.json güncellenirken hata: ${err.message}`);
    }

    // ── RAPOR ──
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`   🕷️  SİBER ÖRÜMCEK HAREKÂTI TAMAMLANDI`);
    console.log(`${'═'.repeat(60)}`);
    console.log(`   ✅ Yüklenen  : ${uploaded}`);
    console.log(`   ⏭️  Atlanan   : ${skipped} (zaten R2'de)`);
    console.log(`   ❌ Başarısız  : ${failed}`);
    console.log(`   📦 Toplam    : ${allFrames.length}`);
    console.log(`   📂 R2 Yolu   : ${R2_BUCKET}/${R2_PREFIX}`);
    console.log(`${'═'.repeat(60)}\n`);

  } catch (err) {
    console.error('[KRİTİK HATA] >>', err);
  } finally {
    await browser.close();
    console.log('[MOTOR] >> Puppeteer kapatıldı. Operasyon sona erdi.');
  }
}

main().catch(console.error);
