// ============================================================
// 🚀 ANIPEAK V21: PYTHON-HYBRID CORE — ELITE AI MANGA PRODUCTION STUDIO
// Akıllı Arşivleme + Çakışma Önleme + Eksik Sayfa Tamiri
// ============================================================

import readline from 'readline';
import logger from './utils/logger.js';
import { supabase } from './src/db.js';
import { BASE_URL } from './utils/constants.js';

import { launchBrowser, delay } from './pipeline/01_navigator.js';
import { extractSeriesData, extractPopularSeriesUrls } from './pipeline/02_extractor.js';
import { downloadChapterPages, downloadCover, isChapterDownloaded } from './pipeline/03_downloader.js';
import { translateChapter } from './pipeline/04_translator.js';
import { uploadCover, uploadChapterPages, syncSeries, syncChapter } from './pipeline/05_distributor.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.clear();
  console.log('\x1b[35m%s\x1b[0m', '╔══════════════════════════════════════════════════════════╗');
  console.log('\x1b[35m%s\x1b[0m', '║   ⚡ ANIPEAK V21: PYTHON-HYBRID CORE (ELİTE) ⚡      ║');
  console.log('\x1b[35m%s\x1b[0m', '║   Elite OCR · Inpainting · Profesyonel Dizgi           ║');
  console.log('\x1b[35m%s\x1b[0m', '║   [TR Hazır → Sevkiyat] VEYA [ENG → PYTHON → TR]       ║');
  console.log('\x1b[35m%s\x1b[0m', '╚══════════════════════════════════════════════════════════╝');
  console.log();

  console.log('\x1b[36m[OPERASYON MODU]\x1b[0m');
  console.log('[1] HIZLI SEVKİYAT (Ready TR): Mevcut Türkçe sayfaları direkt ambarla.');
  console.log('[2] PROFESYONEL AI EDİT (Advanced Translate): İngilizceyi AI ile editle.');
  console.log();

  const mode = await ask('\x1b[33m[SEÇİM]\x1b[0m >> Operasyon türünü seçin (1/2): ');
  const isAiEdit = mode === '2';

  const input = await ask('\x1b[33m[KOORDİNAT]\x1b[0m >> Teğmenim, koordinatları (URL) girin: ');
  
  // URL Temizleme: Eğer kullanıcı yanlışlıkla log yapıştırdıysa sadece URL'yi al
  let targets = input.split(',').map(t => {
    const urlMatch = t.match(/https?:\/\/[^\s"'`,]+/);
    return urlMatch ? urlMatch[0] : t.trim();
  }).filter(t => t.startsWith('http'));

  if (targets.length === 0) {
    console.log('\x1b[34m[AUTO]\x1b[0m >> Popüler mangalar çekiliyor...');
    targets = await extractPopularSeriesUrls();
  }

  let browser = null;
  let page = null;

  for (const target of targets) {
    console.log('\n\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
    console.log(`\x1b[36m[HEDEF]\x1b[0m >> ${target}`);
    console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');

    try {
      let seriesUrl = target;
      if (!seriesUrl.startsWith('http')) {
        seriesUrl = `${BASE_URL}/manga/${seriesUrl}`;
      }

      // ---- ADIM 1: Metadata (HTTP) ----
      const seriesData = await extractSeriesData(seriesUrl);
      if (!seriesData || seriesData.chapters.length === 0) {
        console.log('\x1b[31m[SKIP]\x1b[0m >> Seri verisi veya bölüm bulunamadı.');
        continue;
      }

      // ---- ADIM 2: Kapak + DB Kayıt ----
      let coverUrl = null;
      if (seriesData.cover) {
        const coverBuffer = await downloadCover(seriesData.cover, seriesData.title);
        if (coverBuffer) coverUrl = await uploadCover(coverBuffer);
      }

      const seriesId = await syncSeries(
        seriesData.title, coverUrl, seriesData.description,
        seriesData.genres.length > 0 ? seriesData.genres : ['Aksiyon'],
        seriesData.status
      );

      if (!seriesId) {
        console.log('\x1b[31m[DB-FAIL]\x1b[0m >> Seri kaydı başarısız!');
        continue;
      }

      // ---- ADIM 3: Tarayıcı ----
      if (!browser) {
        console.log('\x1b[33m[BROWSER]\x1b[0m >> Headless tarayıcı başlatılıyor...');
        const launched = await launchBrowser();
        browser = launched.browser;
        page = launched.page;
      }

      // ---- ADIM 4: Bölüm Bölüm İşle ----
      console.log(`\n\x1b[35m[PIPELINE]\x1b[0m >> ${seriesData.chapters.length} bölüm kontrol ediliyor...\n`);

      let completedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (const chapter of seriesData.chapters) {
        // DUP-CHECK
        const { data: existing } = await supabase
          .from('chapters').select('id')
          .eq('series_id', seriesId)
          .eq('number', chapter.number)
          .maybeSingle();

        if (existing) {
          console.log(`\x1b[33m[UYARI]\x1b[0m ${seriesData.title} Bölüm ${chapter.number} zaten ambarımızda mevcut!`);
          skippedCount++;
          continue;
        }

        console.log(`\n\x1b[33m[BÖLÜM ${chapter.number}]\x1b[0m >> Harekât başlıyor...`);

        // ---- Stage 3: Download ----
        const engPaths = await downloadChapterPages(page, chapter.href, seriesData.title, chapter.number);
        if (!engPaths) {
          failedCount++;
          continue;
        }

        let finalPaths = engPaths;

        // ---- Stage 4: AI Edit (Opsiyonel) ----
        if (isAiEdit) {
          console.log(`\x1b[35m[AI]\x1b[0m >> Editöryal ekip çalışıyor (${engPaths.length} sayfa)...`);
          finalPaths = await translateChapter(engPaths, seriesData.title, chapter.number);
        } else {
          console.log(`\x1b[36m[SEVKIYAT]\x1b[0m >> Mevcut sayfalar direkt yükleniyor...`);
        }

        // ---- Stage 5: Upload & Sync ----
        const pageUrls = await uploadChapterPages(finalPaths);

        if (!pageUrls || pageUrls.length === 0) {
          console.log(`\x1b[31m[UPLOAD-FAIL]\x1b[0m >> Bölüm ${chapter.number} yüklenemedi!`);
          failedCount++;
          continue;
        }

        const chapterTitle = `${seriesData.title} - Bölüm ${chapter.number}`;
        await syncChapter(seriesId, chapter.number, chapterTitle, pageUrls);
        completedCount++;

        console.log(`\x1b[32m[BAŞARI]\x1b[0m Bölüm ${chapter.number} sitemize jilet gibi çakıldı!`);
        await delay(800);
      }

      // ---- Seri Rapor ----
      console.log();
      console.log('\x1b[35m┌──────────────────────────────────────────┐\x1b[0m');
      console.log(`\x1b[35m│\x1b[0m  📊 ${seriesData.title} — V21 RAPOR`);
      console.log(`\x1b[35m│\x1b[0m  ✅ Tamamlanan: ${completedCount} bölüm`);
      console.log(`\x1b[35m│\x1b[0m  ⏭️  Atlanan:    ${skippedCount} bölüm`);
      console.log(`\x1b[35m│\x1b[0m  ❌ Başarısız:   ${failedCount} bölüm`);
      console.log(`\x1b[35m│\x1b[0m  📁 Toplam:      ${seriesData.chapters.length} bölüm`);
      console.log('\x1b[35m└──────────────────────────────────────────┘\x1b[0m');

    } catch (err) {
      logger.error(`[Studio] Hata: ${err.message}`);
      console.log(`\x1b[31m[HATA]\x1b[0m >> ${err.message}`);
    }
  }

  console.log('\n\x1b[35m[STUDIO]\x1b[0m >> Tüm hedefler işlendi. Sistem kapatılıyor...');
  if (browser) await browser.close();
  rl.close();
}

main().catch(err => {
  console.error('\x1b[31m[FATAL]\x1b[0m >>', err);
  process.exit(1);
});
