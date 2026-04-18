import { pipeline } from '@xenova/transformers';
import Tesseract from 'tesseract.js';
import logger from './logger.js';

let translator = null;

/**
 * NLLB-200 Modelini Yükle
 */
async function getTranslator() {
  if (!translator) {
    logger.info('[Local-AI] NLLB-200 Modeli yükleniyor (RTX/CPU)...');
    translator = await pipeline('translation', 'Xenova/nllb-200-distilled-600M');
    logger.info('[Local-AI] Model hazır!');
  }
  return translator;
}

import sharp from 'sharp';

/**
 * Yerel OCR + Çeviri Motoru
 */
export async function processPageLocally(imageBuffer, width, height) {
  try {
    // 0. Agresif Ön İşleme (Tesseract'ın okumasını kolaylaştır)
    let processedBuffer = imageBuffer;
    if (width > 5 && height > 5) {
      processedBuffer = await sharp(imageBuffer)
        .resize({ width: width * 2 }) // Metinleri 2 kat büyüt
        .grayscale()
        .sharpen()
        .toBuffer();
    }

    const result = await Tesseract.recognize(processedBuffer, 'eng', {
      tessedit_pageseg_mode: 11
    });
    const blocks = result.data?.blocks || [];
    const translate = await getTranslator();
    const results = [];

    for (const block of blocks) {
      if (block.text && block.text.trim().length > 1) {
        const engText = block.text.replace(/\n/g, ' ').trim();
        
        const output = await translate(engText, {
          src_lang: 'eng_Latn',
          tgt_lang: 'tur_Latn',
        });

        const turkishText = output[0].translation_text;

        const { x0, y0, x1, y1 } = block.bbox;
        
        // 0-1000 Scale Normalization (2 kat büyütülmüş boyuta göre)
        const ymin = (y0 / (height * 2)) * 1000;
        const xmin = (x0 / (width * 2)) * 1000;
        const ymax = (y1 / (height * 2)) * 1000;
        const xmax = (x1 / (width * 2)) * 1000;
        
        results.push({
          box: [ymin, xmin, ymax, xmax],
          turkish_text: turkishText,
          original: engText
        });
      }
    }

    return results;
  } catch (error) {
    logger.error(`[Local-AI] Kritik hata: ${error.message}`);
    return [];
  }
}
