import { createWorker } from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createCanvas, loadImage } from 'canvas';
import dotenv from 'dotenv';
import logger from './logger.js';
import fs from 'fs';
import path from 'path';

if (fs.existsSync(path.resolve('scraper', '.env'))) {
  dotenv.config({ path: path.resolve('scraper', '.env') });
} else {
  dotenv.config();
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI V1: OCR -> Gemini Çeviri -> Temizleme -> Dizgi
 */
export async function translateAndTypesetManga(imageBuffer) {
  try {
    // 1. OCR: Metni ve Konumları Al
    // Tesseract: İngilizce, Japonca, Korece ve Çince (Basitleştirilmiş) dillerini aynı anda okur
    const worker = await createWorker('eng+jpn+kor+chi_sim');
    const { data: { blocks } } = await worker.recognize(imageBuffer);
    await worker.terminate();

    if (!blocks || blocks.length === 0) return imageBuffer;

    // 2. Görseli Canvas'a Yükle
    const img = await loadImage(imageBuffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // 3. Gemini ile Çeviri İşlemi
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    for (const block of blocks) {
      const originalText = block.text.trim().replace(/\n/g, ' ');
      if (originalText.length < 2) continue;

      const prompt = `Bu bir mangadır. Heyecan verici, akıcı ve doğal bir manga Türkçesi kullan. Mekanik olma! Orijinal Metin: "${originalText}"`;
      
      try {
        const result = await model.generateContent(prompt);
        const translatedText = result.response.text().trim();
        
        // 4. Balon Temizleme (Inpainting Simülasyonu)
        // Bounding box alanını arka plan rengiyle (genelde beyaz) doldur
        const { x0, y0, x1, y1 } = block.bbox;
        const width = x1 - x0;
        const height = y1 - y0;
        
        ctx.fillStyle = 'white'; // Çoğu manga balonu beyazdır
        ctx.fillRect(x0 - 5, y0 - 5, width + 10, height + 10);

        // 5. Dizgi (Typesetting)
        ctx.fillStyle = 'black';
        ctx.font = 'bold 18px "Anime Ace", "Comic Sans MS", "Arial"'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        wrapText(ctx, translatedText, x0 + width / 2, y0 + height / 2, width, 22);
        
        logger.info(`[AI-Translate] Çevrildi: ${originalText.substring(0, 20)}... -> ${translatedText}`);

      } catch (err) {
        logger.error(`[AI-Translate] Gemini Hatası: ${err.message}`);
      }
    }

    return canvas.toBuffer('image/jpeg'); // JPG/PNG formatını koru
  } catch (error) {
    logger.error(`[AI-System] Kritik Çeviri Hatası: ${error.message}`);
    return imageBuffer;
  }
}

/**
 * Metni balona sığacak şekilde satırlara böler.
 */
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  // Metni dikey olarak ortala
  const startY = y - (lines.length - 1) * lineHeight / 2;
  for (let i = 0; i < lines.length; i++) {
    context.fillText(lines[i], x, startY + i * lineHeight);
  }
}
