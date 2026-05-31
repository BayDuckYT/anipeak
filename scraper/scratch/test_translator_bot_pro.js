import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env dosyasını yükle
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
if (!process.env.R2_ACCOUNT_ID && !process.env.R2_ENDPOINT) {
    dotenv.config({ path: '/root/mahorapeak/scraper/.env' });
}

// R2 İstemcisi Kurulumu
const s3Client = new S3Client({
    region: 'auto',
    endpoint: (process.env.R2_ENDPOINT || '').trim(),
    credentials: {
        accessKeyId: (process.env.R2_ACCESS_KEY_ID || '').trim(),
        secretAccessKey: (process.env.R2_SECRET_ACCESS_KEY || '').trim(),
    },
});

process.env.CUSTOM_OPENAI_API_KEY = process.env.GEMINI_API_KEY;

async function uploadToR2(buffer, seriesName, chapter, fileName) {
    console.log("☁️ R2'ye yükleniyor...");
    const r2Key = `ceviri/${seriesName}/Bolum_${chapter}/${fileName}`;
    const bucket = (process.env.R2_BUCKET_NAME || 'anipeakimage').trim();

    try {
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: r2Key,
            Body: buffer,
            ContentType: 'image/jpeg',
            CacheControl: 'public, max-age=31536000'
        });

        await s3Client.send(command);
        console.log(`✅ R2 Yüklemesi Başarılı!`);
        console.log(`📂 Yol: ${r2Key}`);
        
        const publicDomain = 'cdn.mahorapeak.com.tr';
        console.log(`🔗 URL: https://${publicDomain}/${r2Key}`);
        
    } catch (error) {
        console.error("❌ R2 Yükleme Hatası:", error);
    }
}

async function runMangaTranslator(inputPath, outputDir) {
    return new Promise((resolve, reject) => {
        const pythonExe = path.join(__dirname, '..', 'translator_env', 'Scripts', 'python.exe');
        const translatorDir = path.join(__dirname, '..', 'manga-image-translator');
        
        console.log(`🤖 Manga-Image-Translator başlatılıyor (RTX 4060 devrede)...`);
        
        // JSON konfigürasyonu (Dil ve çevirici ayarları için)
        const configPath = path.join(outputDir, 'test_config.json');
        const configData = {
            translator: {
                translator: "custom_openai",
                target_lang: "TRK"
            }
        };
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

        // Komut: python -m manga_translator --use-gpu local -i input -o dest
        const args = [
            '-m', 'manga_translator',
            '--use-gpu',
            'local',
            '--config-file', configPath,
            '-i', inputPath,
            '-o', outputDir
        ];

        const process = spawn(pythonExe, args, { cwd: translatorDir });

        process.stdout.on('data', (data) => {
            console.log(`[AI] ${data.toString().trim()}`);
        });

        process.stderr.on('data', (data) => {
            console.error(`[AI ERROR/LOG] ${data.toString().trim()}`);
        });

        process.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Yapay Zeka Çevirisi Başarıyla Tamamlandı!');
                resolve();
            } else {
                reject(new Error(`Çeviri işlemi ${code} koduyla başarısız oldu.`));
            }
        });
    });
}

async function startTest() {
    console.log("🚀 PROFESYONEL Otonom Çeviri Botu Başlatılıyor...\n");
    try {
        const imagePath = process.argv[2] || path.join(__dirname, '..', 'test.jpg'); 
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Resim bulunamadı: ${imagePath}`);
        }
        
        const outputDir = path.join(__dirname, '..', 'temp_output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        // 1. Python Manga-Translator'ı Çalıştır
        console.log("⏳ Lütfen bekleyin, bu işlem resmin karmaşıklığına göre biraz sürebilir. İlk çalışmada modeller (3GB) otomatik inecektir.");
        await runMangaTranslator(imagePath, outputDir);

        // 2. Çıktı Dosyasını Bul
        // manga-image-translator genelde tekil resimleri kendi içindeki 'result/final.png' veya outputDir içerisine koyar.
        // Loglara göre 'result/final.png' olarak kaydetmiş.
        const translatorDir = path.join(__dirname, '..', 'manga-image-translator');
        let translatedImagePath = path.join(translatorDir, 'result', 'final.png');
        
        if (!fs.existsSync(translatedImagePath)) {
            // Eğer orada yoksa temp_output içine bak
            translatedImagePath = path.join(outputDir, path.basename(imagePath));
            if (!fs.existsSync(translatedImagePath)) {
                throw new Error("Çıktı resmi bulunamadı. Yapay zeka resmi oluşturamamış olabilir.");
            }
        }

        const translatedBuffer = fs.readFileSync(translatedImagePath);

        // -- YENİ: Test için PC'ye de kopyala --
        const localOutputPath = path.join(process.cwd(), 'cevirilmis_PRO_ciktisi.jpg');
        fs.writeFileSync(localOutputPath, translatedBuffer);
        console.log(`\n💾 Çevrilen resim bilgisayarına kaydedildi (Göz atabilirsin):\n👉 ${localOutputPath}`);

        // 3. R2'ye Yükleme
        console.log("\n🚀 Depolama (R2) aşamasına geçiliyor...");
        await uploadToR2(translatedBuffer, "Test_Serisi", "1", "01_cevirilmis.jpg");

        console.log("\n🎉 TEST TAMAMLANDI!");
    } catch (err) {
        console.error("🚨 TEST BAŞARISIZ:", err);
    }
}

startTest();
