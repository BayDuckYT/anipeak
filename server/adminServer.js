import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import sharp from 'sharp';
import { setupSecurityEngine, strictAuthLimiter } from './securityEngine.js';

dotenv.config();

// SİSTEM AYARI: Dinleyici sınırını kaldır
process.setMaxListeners(0);

const app = express();
const PORT = 3001;
const LOGS_DIR = path.join(process.cwd(), 'admin', 'logs');
const SUGGESTIONS_FILE = path.join(LOGS_DIR, 'suggestions.txt');
const AVATARS_DIR = path.join(process.cwd(), 'public', 'assets', 'avatars');

// Log dizinlerini kontrol et
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}
if (!fs.existsSync(SUGGESTIONS_FILE)) {
    fs.writeFileSync(SUGGESTIONS_FILE, '');
}

// INFINITY-GUARD - Siber Güvenlik Motorunu Başlat
setupSecurityEngine(app);
app.use(express.json());
app.use(express.static('public')); // Statik dosyaları servis et

const upload = multer({ storage: multer.memoryStorage() });

// [PROFİL] - Avatar Yükleme
app.post('/api/admin/upload-avatar', upload.single('avatar'), async (req, res) => {
    console.log("📥 [AVATAR] Yeni yükleme isteği alındı.");
    try {
        if (!req.file) {
            console.warn("⚠️ [AVATAR] İstekte dosya bulunamadı.");
            return res.status(400).json({ error: 'Dosya seçilmedi.' });
        }
        
        console.log(`🖼️ [AVATAR] Dosya alındı: ${req.file.originalname} (${req.file.size} bytes)`);

        // Klasör kontrolü
        if (!fs.existsSync(AVATARS_DIR)) {
            console.log("📁 [AVATAR] Upload dizini oluşturuluyor...");
            fs.mkdirSync(AVATARS_DIR, { recursive: true });
        }

        const fileName = `avatar_${Date.now()}.webp`;
        const filePath = path.join(AVATARS_DIR, fileName);

        console.log("⚙️ [AVATAR] Görsel işleniyor (Sharp)...");
        await sharp(req.file.buffer)
            .resize(512, 512, { fit: 'cover' })
            .webp({ quality: 80 })
            .toFile(filePath);

        const relativeUrl = `/assets/avatars/${fileName}`;
        console.log(`✅ [AVATAR] Başarıyla kaydedildi: ${fileName}`);
        res.json({ success: true, url: relativeUrl });
    } catch (err) {
        console.error('❌ [AVATAR-HATASI]:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// [SİSTEM] - Taslak Durumu (Git Status)
app.get('/api/admin/staging', (req, res) => {
    try {
        const status = execSync('git status -s').toString();
        res.json({ success: true, status: status || 'Sistem Durumu: Her şey güncel.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// [SİSTEM] - Değişiklik Önerisi
app.post('/api/admin/propose', (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Başlık eksik.' });
    
    try {
        const proposalFile = path.join(LOGS_DIR, 'proposed_changes.json');
        fs.writeFileSync(proposalFile, JSON.stringify({ title, date: new Date().toLocaleString('tr-TR') }));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [SİSTEM] - Öneriyi Getir
app.get('/api/admin/get-proposal', (req, res) => {
    try {
        const proposalFile = path.join(LOGS_DIR, 'proposed_changes.json');
        if (fs.existsSync(proposalFile)) {
            const data = JSON.parse(fs.readFileSync(proposalFile, 'utf8'));
            res.json(data);
        } else {
            res.json({ title: 'Yeni Değişiklik Tespit Edilmedi' });
        }
    } catch (err) {
        res.json({ title: 'Analiz Hatası' });
    }
});

// [SİSTEM] - Yayınlama (Git Push)
app.post('/api/admin/deploy', (req, res) => {
    try {
        const proposalFile = path.join(LOGS_DIR, 'proposed_changes.json');
        let commitMsg = `Sistem Güncellemesi [${new Date().toLocaleString('tr-TR')}]`;
        
        if (fs.existsSync(proposalFile)) {
            const proposal = JSON.parse(fs.readFileSync(proposalFile, 'utf8'));
            commitMsg = proposal.title;
        }

        console.log('🚀 Güncelleme Başladı: Yerel derleme yapılıyor...');
        execSync('npm run build', { stdio: 'inherit' });

        console.log('📦 Veri senkronizasyonu başlatıldı...');
        execSync('git add .');
        
        // KABUK ENJEKSİYONU KORUMASI: Mesajı sadece güvenli karakterlere sınırla
        const safeCommitMsg = commitMsg.replace(/[^a-zA-Z0-9\s._\-]/g, '');
        execSync(`git commit -m "${safeCommitMsg}"`);
        execSync('git push origin main');

        // Cloudflare Webhook (Opsiyonel)
        if (process.env.CLOUDFLARE_WEBHOOK_URL) {
            execSync(`curl -X POST ${process.env.CLOUDFLARE_WEBHOOK_URL}`);
        }

        // Günlüğü Kaydet
        const deployLog = path.join(LOGS_DIR, 'deployments.txt');
        fs.appendFileSync(deployLog, `[${new Date().toLocaleString('tr-TR')}] GÜNCELLEDİ: ${commitMsg}\n`);

        // Öneriyi temizle
        if (fs.existsSync(proposalFile)) fs.unlinkSync(proposalFile);

        res.json({ success: true, message: 'Güncelleme Başarılı! Sistem yenilendi.' });
    } catch (err) {
        console.error('❌ Güncelleme Hatası:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// [SİSTEM] - Geri Yükleme (Rollback)
app.post('/api/admin/rollback', (req, res) => {
    try {
        console.log('[ROLLBACK] Önceki sürüme dönülüyor...');
        execSync('git revert HEAD --no-edit');
        execSync('git push origin main');
        res.json({ success: true, message: 'Geri Yükleme Başarılı! Sistem önceki kararlı haline döndü.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// [ÖNERİ] - Öneriyi Kaydet
app.post('/api/admin/suggest', (req, res) => {
    const { user, email, message } = req.body;
    if (!user || !message) return res.status(400).json({ error: 'Eksik veri: İsim ve mesaj gerekli.' });

    const date = new Date().toLocaleString('tr-TR');
    const entry = `[${date}][${user}][${email || 'E-posta Yok'}]: ${message}\n`;

    try {
        fs.appendFileSync(SUGGESTIONS_FILE, entry);
        res.json({ success: true, message: 'Öneriniz yönetime ulaştı!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// [ÖNERİ] - Önerileri Oku
app.get('/api/admin/suggestions', (req, res) => {
    try {
        const content = fs.readFileSync(SUGGESTIONS_FILE, 'utf-8');
        res.json({ success: true, content });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// [PROXY] - Discord CDN Tüneli (VPN'siz erişim için)
app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL eksik.');

    try {
        console.log(`🔗 [PROXY] İstek: ${targetUrl.substring(0, 50)}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 saniye timeout

        const response = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Referer': 'https://discord.com/'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Discord Hatası: ${response.status} ${response.statusText}`);

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType);
        
        // 24 Saatlik Önbellek Mühürlemesi
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200');

        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (err) {
        console.error('❌ [PROXY-HATASI]:', err.message);
        res.status(500).send('Proxy üzerinden veri çekilemedi.');
    }
});

app.listen(PORT, () => {
    console.log(`\n\x1b[35m%s\x1b[0m`, `⚓ MAHORAPEAK YÖNETİM MERKEZİ AKTİF ⚓`);
    console.log(`\x1b[36m%s\x1b[0m`, `Port: ${PORT}`);
    console.log(`\x1b[90m%s\x1b[0m`, `-----------------------------------------`);
});
