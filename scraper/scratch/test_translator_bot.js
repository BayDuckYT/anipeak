import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { translateAndTypesetManga } from '../utils/aiTranslator.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env dosyasını yükle
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
if (!process.env.R2_ACCOUNT_ID) {
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

async function readLocalImage(imagePath) {
    console.log(`📥 Lokal resim okunuyor: ${imagePath}...`);
    try {
        const absolutePath = path.resolve(imagePath);
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Dosya bulunamadı! Lütfen şu yola bir resim koyun: ${absolutePath}`);
        }
        const buffer = fs.readFileSync(absolutePath);
        console.log("✅ Lokal resim başarıyla belleğe (RAM) alındı.");
        return buffer;
    } catch (error) {
        console.error("❌ Resim okunurken hata oluştu:", error.message);
        throw error;
    }
}

async function uploadToR2(buffer, seriesName, chapter, fileName) {
    console.log("☁️ R2'ye yükleniyor...");
    const r2Key = `ceviri/${seriesName}/Bolum_${chapter}/${fileName}`;
    const bucket = (process.env.R2_BUCKET_NAME || 'mahorapeakimage').trim();

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
        
        // Eğer public bir custom domain varsa onu da yazdırabiliriz:
        const publicDomain = 'cdn.mahorapeak.com.tr'; // İsteğe bağlı
        console.log(`🔗 URL: https://${publicDomain}/${r2Key}`);
        
    } catch (error) {
        console.error("❌ R2 Yükleme Hatası:", error);
    }
}

async function startTest() {
    console.log("🤖 Otonom Çeviri Test Botu Başlatılıyor...\n");
    try {
        // 1. Resmi al (İster lokalden, ister URL'den)
        const imagePath = process.argv[2] || 'test.jpg'; // Terminalden argüman olarak verilirse onu, verilmezse 'test.jpg'yi okur
        const imageBuffer = await readLocalImage(imagePath);

        // 2. Yapay Zeka Çeviri ve Temizleme işlemi (RAM üzerinde)
        console.log("🧠 Tesseract OCR ve Gemini AI devreye giriyor...");
        console.log("⏳ Lütfen bekleyin, bu işlem resmin karmaşıklığına göre 10-30 saniye sürebilir...");
        const translatedBuffer = await translateAndTypesetManga(imageBuffer);

        // -- YENİ: Test için PC'ye de kaydet --
        const localOutputPath = path.join(process.cwd(), 'cevirilmis_test_ciktisi.jpg');
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
