// =============================================
// 🏗️ ANIPEAK V35 ULTIMATE GHOST-REAPER — CONSTANTS
// Smart-Scale Branding & Advanced Scraper
// =============================================

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Kaynak Site ----
export const BASE_URL = 'https://mangaokutr.co';

// ---- Yerel Arşiv Yolları ----
export const ARCHIVE_BASE = 'C:\\Users\\Murathan\\Desktop\\anipeak manga';
export const PYTHON_PATH = 'python';

// ---- Hız ve Paralelizm (GIGA-SCALE: 15 Series x 5 Chapters) ----
export const SERIES_CONCURRENCY = 15;
export const CHAPTER_CONCURRENCY = 1; 
export const PAGE_DOWNLOAD_CONCURRENCY = 10;
export const PAGE_UPLOAD_CONCURRENCY = 10;
export const GPU_CONCURRENCY = 4;

// ---- PDL (Placeholder Defeat Logic) ----
export const MIN_IMAGE_WIDTH = 300;
export const MIN_IMAGE_HEIGHT = 400;
export const MIN_IMAGE_BYTES = 20000; // 20KB
export const MIN_PAGES_PER_CHAPTER = 3;

// ---- Zamanlama ----
export const SCROLL_STEP_PX = 600;
export const SCROLL_INTERVAL_MS = 80;
export const PAGE_LOAD_WAIT_MS = 3000;
export const READER_LOAD_WAIT_MS = 4000;
export const UPLOAD_DELAY_MS = 20; // Siber Seri Çekim
export const RETRY_DELAY_MS = 2000;
export const MAX_RETRIES = 10;
export const NAVIGATION_TIMEOUT_MS = 120000;

// ---- Puppeteer ----
export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
];
export const VIEWPORT = { width: 1440, height: 900 };

// ---- MangaKatana Selectors ----
export const CHAPTER_IMAGES_SELECTOR = '#imgs img';

// ---- AI & Çeviri ----
export const GEMINI_MODEL = 'gemini-1.5-flash';
export const GPT_MODEL = 'gpt-4o';
export const TRANSLATION_PROMPT_PREFIX = `Sen dünyanın en iyi manga yerelleştirme uzmanısın.
Görev: Gönderilen manga sayfasındaki İngilizce metinleri bul ve profesyonel bir çeviri grubu (mangatranslate vb.) kalitesinde Türkçe'ye yerelleştir.
Kurallar:
1. Bağlamsal Zeka: Kelimesi kelimesine çeviri yapma. Karakterin rütbesini, sahnenin heyecanını ve o anki ruh halini yansıt. "Oha lan!", "Hadi ordan!" gibi doğal ve gaza getiren bir dil kullan.
2. Doğal Akış: "Don't let them damage..." gibi kalıpları "Malzemelere zarar vermelerine izin verme!" gibi akıcı bir Türkçe ile çevir.
3. Teknik: Kesinlikle sadece aşağıdaki yapıda bir JSON array döndür. Asla markdown veya açıklama ekleme.
4. Koordinatlar: [ymin, xmin, ymax, xmax] formatında (0-1000 normalize) ver.
Örnek Format:
[
  { "box": [100, 200, 150, 400], "turkish_text": "Kapa çeneni ve sadece izle!" }
]`;

export const FONT_CHAIN = ['Anime Ace', 'Wild Words', 'Comic Sans MS', 'Arial'];
export const FONT_SIZE = 16;
export const LINE_HEIGHT = 20;

// ---- Placeholder Görseli Metni ----
export const PLACEHOLDER_TEXT = 'ANIPEAK: Bu sayfa muhimmat kaybi sebebiyle tadilattadir.';
