// ============================================================
// 🚀 ANIPEAK V13 — AI MANGA PRODUCTION STUDIO (MANGAKATANA)
// Ana Orkestratör — Tam Otomatik Scanlation Stüdyosu
// ============================================================
// MİMARİ:
//   1. İSTİHBARAT  → HTTP (axios+cheerio) — ultra hızlı
//   2. İNDİRME     → Puppeteer (#imgs container) — JS render
//   3. TEMİZLİK    → OCR + Inpainting (Canvas/Pillow)
//   4. ÇEVİRİ      → Gemini AI — profesyonel yerelleştirme
//   5. DİZGİ       → Auto-scaling font + dynamic text wrap
//   6. DAĞITIM     → ImgBB + Supabase senkronizasyonu
// ============================================================

import readline from 'readline';
import logger from './utils/logger.js';
import { supabase } from './src/db.js';
import { BASE_URL } from './utils/constants.js';

// Pipeline Modülleri
import { launchBrowser, delay } from './pipeline/01_navigator.js';
import { extractSeriesData, extractPopularSeriesUrls } from './pipeline/02_extractor.js';
import { downloadChapterPages, downloadCover } from './pipeline/03_downloader.js';
import { translateChapter } from './pipeline/04_translator.js';
import { uploadCover, uploadChapterPages, syncSeries, syncChapter } from './pipeline/05_distributor.js';

// ---- CLI ----
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

// ============================================================
// 🏭 ANA PIPELINE
// ============================================================
async function main() {
  console.clear();
  console.log('\x1b[35m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
  console.log('\x1b[35m%s\x1b[0m', '║   🚀 ANIPEAK V13 — MANGAKATANA ELITE AI STUDIO 🚀      ║');
  console.log('\x1b[35m%s\x1b[0m', '║   Tam Otomatik 4-Kişilik Scanlation Stüdyosu           ║');
  console.log('\x1b[35m%s\x1b[0m', '║   [Temizlikçi · Redrawer · Çevirmen · Dizgici]          ║');
  console.log('\x1b[35m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
  console.log();

  // ---- KULLANICI GİRİŞİ ----
  const input = await ask('\x1b[33m[STUDIO]\x1b[0m >> MangaKatana URL\'leri girin (virgülle ayırın, boş = popüler): ');
  
  let targets = input
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  // Boş giriş → popüler mangaları çek
  if (targets.length === 0) {
    console.log('\x1b[34m[AUTO]\x1b[0m >> Popüler mangalar çekiliyor...');
    targets = await extractPopularSeriesUrls();
    if (targets.length === 0) {
      console.log('\x1b[31m[FATAL]\x1b[0m >> Hiç manga bulunamadı!');
      rl.close();
      return;
    }
  }

  // ---- TARAYICI BAŞLAT ----
  let browser = null;
  let page = null;

  // ---- HER HEDEFİ İŞLE ----
  for (const target of targets) {
    console.log();
    console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
    console.log(`\x1b[36m[HEDEF]\x1b[0m >> ${target}`);
    console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');

    try {
      // ================================================
      // ADIM 1: URL Doğrula
      // ================================================
      let seriesUrl = target;
      if (!seriesUrl.startsWith('http')) {
        seriesUrl = `${BASE_URL}/manga/${seriesUrl}`;
      }

      // ================================================
      // ADIM 2: Metadata Çek (HTTP — anti-bot YOK)
      // ================================================
      const seriesData = await extractSeriesData(seriesUrl);
      if (!seriesData) {
        console.log('\x1b[31m[SKIP]\x1b[0m >> Seri verisi çıkarılamadı.');
        continue;
      }

      if (seriesData.chapters.length === 0) {
        console.log('\x1b[31m[SKIP]\x1b[0m >> Bölüm bulunamadı!');
        continue;
      }

      // ================================================
      // ADIM 3: Kapak İndir + Yükle + DB Kayıt
      // ================================================
      let coverUrl = null;
      if (seriesData.cover) {
        const coverBuffer = await downloadCover(seriesData.cover, seriesData.title);
        if (coverBuffer) {
          coverUrl = await uploadCover(coverBuffer);
        }
      }

      const seriesId = await syncSeries(
        seriesData.title,
        coverUrl,
        seriesData.description,
        seriesData.genres.length > 0 ? seriesData.genres : ['Aksiyon'],
        seriesData.status
      );

      if (!seriesId) {
        console.log('\x1b[31m[DB-FAIL]\x1b[0m >> Seri DB kaydı başarısız!');
        continue;
      }

      // ================================================
      // ADIM 4: Tarayıcıyı Başlat (lazy start)
      // ================================================
      if (!browser) {
        console.log('\x1b[33m[BROWSER]\x1b[0m >> Tarayıcı başlatılıyor (headless)...');
        const launched = await launchBrowser();
        browser = launched.browser;
        page = launched.page;
      }

      // ================================================
      // ADIM 5: Bölüm Bölüm İşle
      // ================================================
      console.log(`\n\x1b[35m[PIPELINE]\x1b[0m >> ${seriesData.chapters.length} bölüm sırayla işlenecek...\n`);

      let completedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (const chapter of seriesData.chapters) {
        // ---- DB'de zaten var mı kontrol et ----
        const { data: existing } = await supabase
          .from('chapters')
          .select('id')
          .eq('series_id', seriesId)
          .eq('number', chapter.number)
          .maybeSingle();

        if (existing) {
          console.log(`\x1b[90m[SKIP]\x1b[0m >> Bölüm ${chapter.number} zaten mevcut.`);
          skippedCount++;
          continue;
        }

        console.log(`\n\x1b[33m[BÖLÜM ${chapter.number}]\x1b[0m >> İşlem başlıyor...`);

        // ---- Stage 3: Download ----
        const rawPaths = await downloadChapterPages(page, chapter.href, seriesData.title, chapter.number);
        if (!rawPaths) {
          failedCount++;
          continue;
        }

        // ---- Stage 4: Translate (AI Scanlation) ----
        console.log(`\x1b[35m[AI]\x1b[0m >> Scanlation hattı çalışıyor (${rawPaths.length} sayfa)...`);
        const processedPaths = await translateChapter(rawPaths, seriesData.title, chapter.number);

        // ---- Stage 5: Distribute (ImgBB + DB) ----
        console.log(`\x1b[36m[UPLOAD]\x1b[0m >> ImgBB'ye yükleniyor...`);
        const pageUrls = await uploadChapterPages(processedPaths);

        // ---- SIFIR HATA PROTOKOLÜ ----
        if (!pageUrls || pageUrls.length === 0) {
          console.log(`\x1b[31m[UPLOAD-FAIL]\x1b[0m >> Bölüm ${chapter.number} yüklenemedi!`);
          failedCount++;
          continue;
        }

        if (pageUrls.length !== processedPaths.length) {
          console.log(`\x1b[31m[SIFIR HATA]\x1b[0m >> Sayfa sayısı uyuşmazlığı! İndirilen: ${processedPaths.length}, Yüklenen: ${pageUrls.length} — DURDURULDU!`);
          logger.error(`[Studio] Sıfır Hata: B${chapter.number} — ${processedPaths.length} vs ${pageUrls.length}`);
          failedCount++;
          continue;
        }

        // ---- DB Sync ----
        const chapterTitle = `${seriesData.title} - Bölüm ${chapter.number}`;
        await syncChapter(seriesId, chapter.number, chapterTitle, pageUrls);
        completedCount++;

        console.log(`\x1b[32m[✓ TAMAM]\x1b[0m >> Bölüm ${chapter.number} — ${pageUrls.length} sayfa başarıyla yayına alındı!`);

        // Kısa bekleme (rate limit koruması)
        await delay(1000);
      }

      // ---- Seri Özet ----
      console.log();
      console.log('\x1b[35m┌──────────────────────────────────────────┐\x1b[0m');
      console.log(`\x1b[35m│\x1b[0m  📊 ${seriesData.title} — RAPOR`);
      console.log(`\x1b[35m│\x1b[0m  ✅ Tamamlanan: ${completedCount} bölüm`);
      console.log(`\x1b[35m│\x1b[0m  ⏭️  Atlanan:    ${skippedCount} bölüm`);
      console.log(`\x1b[35m│\x1b[0m  ❌ Başarısız:   ${failedCount} bölüm`);
      console.log(`\x1b[35m│\x1b[0m  📁 Toplam:      ${seriesData.chapters.length} bölüm`);
      console.log('\x1b[35m└──────────────────────────────────────────┘\x1b[0m');

    } catch (seriesErr) {
      logger.error(`[Studio] Seri işleme hatası (${target}): ${seriesErr.message}`);
      console.log(`\x1b[31m[HATA]\x1b[0m >> ${seriesErr.message}`);
    }
  }

  // ---- CLEANUP ----
  console.log('\n\x1b[35m[STUDIO]\x1b[0m >> Tüm hedefler işlendi. Sistem kapatılıyor...');
  if (browser) await browser.close();
  rl.close();
}

// ---- BAŞLAT ----
main().catch(err => {
  console.error('\x1b[31m[FATAL]\x1b[0m >>', err);
  process.exit(1);
});
