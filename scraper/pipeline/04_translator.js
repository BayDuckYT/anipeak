// =============================================
// 🤖 ANIPEAK V49: AKILLI RADAR (SMART BYPASS) — STAGE 4
// OCR-Based Ad Removal & Original Font Branding
// =============================================

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import { ARCHIVE_BASE, PYTHON_PATH } from '../utils/constants.js';
import { translateAndTypesetManga } from '../utils/aiTranslator.js';
import { applySeal } from '../utils/imageProcessor.js';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

if (fs.existsSync(path.resolve('scraper', '.env'))) {
  dotenv.config({ path: path.resolve('scraper', '.env') });
} else {
  dotenv.config();
}

/**
 * V22 OMNI-REAPER: Sayfaları işler (AI Çeviri veya Rebrand)
 */
export async function translateChapter(engPaths, seriesTitle, chapterNumber, isAiEdit = false) {
  const safeTitle = seriesTitle.replace(/[\\/:*?"<>|]/g, '_');
  let trDir = path.join(ARCHIVE_BASE, safeTitle, 'TR', `Bölüm_${chapterNumber}`);
  
  if (isAiEdit) {
    trDir = path.join(trDir, 'EDIT');
  }

  const mode = isAiEdit ? 'translate' : 'edit';

  if (!fs.existsSync(trDir)) {
    fs.mkdirSync(trDir, { recursive: true });
  }

  const processedPaths = [];
  let pageNum = 1;

  for (const engPath of engPaths) {
    try {
      const fileName = `${pageNum.toString().padStart(2, '0')}.png`;
      const outputPath = path.join(trDir, fileName);

      logger.info(`[V49-AKILLI-RADAR] Sayfa ${pageNum} taranıyor...`);
      
      try {
        await runPythonTranslatorWithAutoPath(engPath, outputPath);
        
        // Python başarılı olsa bile V35 standardı mühürü bas
        const processedBuffer = fs.readFileSync(outputPath);
        const sealedBuffer = await applySeal(processedBuffer);
        fs.writeFileSync(outputPath, sealedBuffer);

      } catch (pyErr) {
        // Python tıkandıysa Sharp/Node.js yedek gücünü ateşle
        logger.warn(`[V35-FALLBACK] Python tıkandı, Sharp siber gücüyle mühürleme yapılıyor...`);
        const imgBuffer = fs.readFileSync(engPath);
        let finalBuffer = imgBuffer;

        if (isAiEdit) {
           try {
              finalBuffer = await translateAndTypesetManga(imgBuffer);
           } catch (nodeErr) {
              logger.error(`[AI-FAIL] AI Çeviri de tıkandı, sadece mühür basılıyor.`);
           }
        }
        
        // Mühürleme (Mandatory V35)
        finalBuffer = await applySeal(finalBuffer);
        fs.writeFileSync(outputPath, finalBuffer);
      }

      if (fs.existsSync(outputPath)) {
        processedPaths.push(outputPath);
      } else {
        fs.copyFileSync(engPath, outputPath);
        processedPaths.push(outputPath);
      }
      
      pageNum++;

    } catch (err) {
      logger.error(`[V21-FAIL] Sayfa ${pageNum} hatası: ${err.message}`);
      const fileName = `${pageNum.toString().padStart(2, '0')}.png`;
      const outputPath = path.join(trDir, fileName);
      fs.copyFileSync(engPath, outputPath);
      processedPaths.push(outputPath);
      pageNum++;
    }
  }

  console.log(`\x1b[35m[✓ TR]\x1b[0m >> Bölüm ${chapterNumber}: ${processedPaths.length} sayfa → ${trDir}`);
  return processedPaths;
}

/**
 * Python Scriptini Otomatik Yol Deneyerek Çalıştırır
 */
async function runPythonTranslatorWithAutoPath(inputPath, outputPath) {
  const commands = [process.env.ACTIVE_PYTHON, PYTHON_PATH, 'python', 'py', 'python3'];
  let lastError = null;

  for (const cmd of commands) {
    if (!cmd) continue;
    try {
      await runPythonTranslator(cmd, inputPath, outputPath);
      return; // Başarılıysa çık
    } catch (err) {
      lastError = err;
      if (err.code === 'ENOENT') continue; // Komut bulunamadıysa diğerine geç
      break; // Başka bir hataysa dur
    }
  }
  throw lastError || new Error("Hiçbir Python komutu çalışmadı.");
}

async function runPythonTranslator(pythonCmd, inputPath, outputPath) {
  const scraperRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const scriptPath = path.join(scraperRoot, 'manga_translator.py');

  return new Promise((resolve, reject) => {
    // Windows'ta shell: true kullanırken argümanları dizi olarak geçmek uyarı verebilir.
    // Tek bir komut satırı oluşturuyoruz amk!
    const fullCommand = `"${pythonCmd}" "${scriptPath}" --input "${inputPath}" --output "${outputPath}"`;

    const pyProcess = spawn(fullCommand, [], {
      cwd: scraperRoot,
      shell: true
    });

    let errorData = '';
    pyProcess.stderr.on('data', (data) => { errorData += data.toString(); });

    pyProcess.on('error', (err) => { reject(err); });

    pyProcess.on('close', (code) => {
      if (code === 0) resolve();
      else {
        logger.error(`[PYTHON-FAIL] Kod: ${code}. Hata: ${errorData}`);
        resolve(); // Devam et
      }
    });
  });
}
