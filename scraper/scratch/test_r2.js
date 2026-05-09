import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('scraper', '.env') });
if (!process.env.R2_ACCOUNT_ID) {
    dotenv.config({ path: '/root/anipeak/scraper/.env' });
}

async function testR2() {
    console.log("🔍 R2 Bağlantı Testi Başlatılıyor...");
    console.log("------------------------------------");
    console.log("Bucket:", process.env.R2_BUCKET);
    console.log("Account ID:", process.env.R2_ACCOUNT_ID ? "Dolu ✅" : "BOŞ ❌");
    console.log("Access Key:", process.env.R2_ACCESS_KEY_ID ? "Dolu ✅" : "BOŞ ❌");
    console.log("Secret Key:", process.env.R2_SECRET_ACCESS_KEY ? "Dolu ✅" : "BOŞ ❌");
    console.log("------------------------------------");

    const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${(process.env.R2_ACCOUNT_ID || '').trim()}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: (process.env.R2_ACCESS_KEY_ID || '').trim(),
            secretAccessKey: (process.env.R2_SECRET_ACCESS_KEY || '').trim(),
        },
    });

    try {
        const command = new ListObjectsV2Command({
            Bucket: (process.env.R2_BUCKET || 'anipeakimage').trim(),
            MaxKeys: 1
        });
        await s3Client.send(command);
        console.log("✅ R2 BAĞLANTISI BAŞARILI! Kimlik bilgileri doğru.");
    } catch (err) {
        console.error("❌ R2 BAĞLANTI HATASI:");
        console.error("Mesaj:", err.message);
        console.error("Kod:", err.code || err.$metadata?.httpStatusCode);
        if (err.message.includes("credential")) {
            console.log("\n💡 İPUCU: Access Key veya Secret Key hatalı görünüyor. Lütfen Cloudflare panelinden kontrol et.");
        }
    }
}

testR2();
