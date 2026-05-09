import sharp from 'sharp';
import axios from 'axios';
import logger from './logger.js';
import dotenv from 'dotenv';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config({ path: '/root/anipeak/scraper/.env' });

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const R2_BUCKET = process.env.R2_BUCKET || 'anipeakimage';

export async function processAndUploadImage(imageUrl, isCover, seriesTitle, chapterNumber, pageIndex) {
    try {
        const { data: buffer } = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://mangaokutr.co/'
            },
            timeout: 30000
        });

        // HD Kalite: 90% WebP (Orijinal keskinliği korur, boyutu optimize eder)
        const finalBuffer = await sharp(buffer)
            .webp({ quality: 90, effort: 6 }) 
            .toBuffer();

        const safeTitle = seriesTitle.replace(/[\\/:*?"<>|]/g, '_');
        const fileName = isCover ? 'cover.webp' : `${pageIndex.toString().padStart(3, '0')}.webp`;
        const r2Path = isCover 
            ? `manga/${safeTitle}/${fileName}` 
            : `manga/${safeTitle}/ch_${chapterNumber}/${fileName}`;

        await s3Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: r2Path,
            Body: finalBuffer,
            ContentType: 'image/webp'
        }));

        const uploadUrl = `${process.env.R2_PUBLIC_URL}/${r2Path}`;
        logger.info(`[HD-Upload] R2 Başarılı: ${uploadUrl}`);
        return uploadUrl;
    } catch (e) {
        logger.error(`[HD-Upload] Hata: ${e.message}`);
        return imageUrl;
    }
}
