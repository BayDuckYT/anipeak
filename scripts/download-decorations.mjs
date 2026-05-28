/**
 * Discord CDN Dekorasyon İndirici — MahoraPeak Ganimet Harekatı
 * effects.json'daki Discord CDN linklerini indirir ve yerel yola günceller.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EFFECTS_PATH = path.join(__dirname, '..', 'src', 'data', 'effects.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'decorations');
const LOCAL_URL_PREFIX = '/assets/decorations/';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Referer': 'https://discord.com/',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'image',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'cross-site'
};

// Dosya adı güvenliği: özel karakterleri temizle
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

// Fetch ile dosya indir (retry mantığı ile)
async function downloadFile(url, destPath, retries = 3) {
  // URL'den size/passthrough parametrelerini kaldır, max kalite al
  const cleanUrl = url.split('?')[0] + '?size=4096&passthrough=true';
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(cleanUrl, {
        method: 'GET',
        headers: HEADERS,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const fileStream = fs.createWriteStream(destPath);
      
      // Node 18+ Web Streams to Node Streams
      if (response.body.pipe) {
         // Node.js stream API (node-fetch style)
         await new Promise((resolve, reject) => {
           response.body.pipe(fileStream);
           response.body.on('error', reject);
           fileStream.on('finish', resolve);
         });
      } else {
         // Web streams API (Native fetch)
         await new Promise((resolve, reject) => {
           Readable.fromWeb(response.body)
             .pipe(fileStream)
             .on('error', reject)
             .on('finish', resolve);
         });
      }
      return; // Başarılı, fonksiyondan çık
    } catch (err) {
      if (attempt < retries) {
        console.log(`  ⚠ Hata: ${err.message}, retry (${retries - attempt} kalan)...`);
        await new Promise(r => setTimeout(r, 3000));
      } else {
        throw err; // Tüm denemeler başarısız
      }
    }
  }
}

async function main() {
  console.log('\n🛰️  MahoraPeak Discord Ganimet Harekatı Başlıyor...\n');

  // Klasörü oluştur
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Klasör oluşturuldu: ${OUTPUT_DIR}\n`);
  }

  // effects.json oku
  const effects = JSON.parse(fs.readFileSync(EFFECTS_PATH, 'utf-8'));
  
  // Discord CDN linklerini filtrele
  const discordEffects = effects.filter(e => 
    e.url && e.url.includes('cdn.discordapp.com')
  );

  console.log(`🎯 ${discordEffects.length} adet Discord dekorasyon bulundu.\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < discordEffects.length; i++) {
    const effect = discordEffects[i];
    const label = effect.label || effect.name || effect.id;
    const filename = sanitizeFilename(label) + '.png';
    const destPath = path.join(OUTPUT_DIR, filename);
    const localUrl = LOCAL_URL_PREFIX + filename;

    process.stdout.write(`[${i + 1}/${discordEffects.length}] ${label}... `);

    // Zaten indirilmiş mi?
    if (fs.existsSync(destPath)) {
      // URL'yi güncelle
      const idx = effects.findIndex(e => e.id === effect.id);
      if (idx !== -1) effects[idx].url = localUrl;
      console.log('✅ (zaten mevcut)');
      success++;
      continue;
    }

    try {
      await downloadFile(effect.url, destPath);
      
      // URL'yi yerel yola güncelle
      const idx = effects.findIndex(e => e.id === effect.id);
      if (idx !== -1) effects[idx].url = localUrl;
      
      const fileSize = fs.statSync(destPath).size;
      console.log(`✅ (${(fileSize / 1024).toFixed(0)} KB)`);
      success++;
    } catch (err) {
      console.log(`❌ HATA: ${err.message}`);
      failed++;
    }

    // Discord rate limit koruması: 200ms bekle
    await new Promise(r => setTimeout(r, 200));
  }

  // Güncellenmiş effects.json'ı yaz
  fs.writeFileSync(EFFECTS_PATH, JSON.stringify(effects, null, 2), 'utf-8');

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Başarılı: ${success}`);
  console.log(`❌ Başarısız: ${failed}`);
  console.log(`📄 effects.json güncellendi.`);
  console.log(`${'═'.repeat(50)}\n`);
}

main().catch(console.error);
