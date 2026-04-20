import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// SİBER LİMİT: Komuta merkezi için dinleyici sınırını kaldır!
process.setMaxListeners(0);

const app = express();
const PORT = 3001;
const LOGS_DIR = path.join(process.cwd(), 'admin', 'logs');
const SUGGESTIONS_FILE = path.join(LOGS_DIR, 'suggestions.txt');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}
if (!fs.existsSync(SUGGESTIONS_FILE)) {
    fs.writeFileSync(SUGGESTIONS_FILE, '');
}

app.use(cors());
app.use(express.json());

// [COMMAND CENTER] - Staging Area (Git Status)
app.get('/api/admin/staging', (req, res) => {
    try {
        const status = execSync('git status -s').toString();
        res.json({ success: true, status: status || 'Siber Nizam: Her şey güncel.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// [COMMAND] - Propose Update Title (AI calls this)
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

// [COMMAND] - Get Current Proposal
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

// [COMMAND] - Deploy (Git Push)
app.post('/api/admin/deploy', (req, res) => {
    try {
        const proposalFile = path.join(LOGS_DIR, 'proposed_changes.json');
        let commitMsg = `Admin Update [${new Date().toLocaleString('tr-TR')}]`;
        
        if (fs.existsSync(proposalFile)) {
            const proposal = JSON.parse(fs.readFileSync(proposalFile, 'utf8'));
            commitMsg = proposal.title;
        }

        console.log('🚀 Taarruz Başladı: Lokal Build Alınıyor...');
        execSync('npm run build', { stdio: 'inherit' });

        console.log('📦 Git İşlemleri Başladı...');
        execSync('git add .');
        execSync(`git commit -m "${commitMsg}"`);
        execSync('git push origin main');

        // Cloudflare Webhook (Optional)
        if (process.env.CLOUDFLARE_WEBHOOK_URL) {
            execSync(`curl -X POST ${process.env.CLOUDFLARE_WEBHOOK_URL}`);
        }

        // Log Deployment
        const deployLog = path.join(LOGS_DIR, 'deployments.txt');
        fs.appendFileSync(deployLog, `[${new Date().toLocaleString('tr-TR')}] YAYINLANDI: ${commitMsg}\n`);

        // Clean proposal
        if (fs.existsSync(proposalFile)) fs.unlinkSync(proposalFile);

        res.json({ success: true, message: 'Taarruz Başarılı! Sistem güncellendi.' });
    } catch (err) {
        console.error('❌ Taarruz Başarısız:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// [COMMAND CENTER] - Rollback (Geri Alma)
app.post('/api/admin/rollback', (req, res) => {
    try {
        console.log('[ROLLBACK] Geri çekilme emri verildi!');
        execSync('git revert HEAD --no-edit');
        execSync('git push origin main');
        res.json({ success: true, message: 'Geri Çekilme Başarılı! Sistem eski nizamına döndü.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// [LOGISTICS] - Save Suggestion
app.post('/api/admin/suggest', (req, res) => {
    const { user, email, message } = req.body;
    if (!user || !message) return res.status(400).json({ error: 'Eksik mühimmat: İsim ve mesaj gerekli.' });

    const date = new Date().toLocaleString('tr-TR');
    const entry = `[${date}][${user}][${email || 'E-posta Yok'}]: ${message}\n`;

    try {
        fs.appendFileSync(SUGGESTIONS_FILE, entry);
        res.json({ success: true, message: 'Önerin karargâha ulaştı!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// [LOGISTICS] - Read Suggestions (Real-time)
app.get('/api/admin/suggestions', (req, res) => {
    try {
        const content = fs.readFileSync(SUGGESTIONS_FILE, 'utf-8');
        res.json({ success: true, content });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n\x1b[35m%s\x1b[0m`, `⚓ ANIPEAK SİBER KOMUTA MERKEZİ AKTİF ⚓`);
    console.log(`\x1b[36m%s\x1b[0m`, `Port: ${PORT}`);
    console.log(`\x1b[90m%s\x1b[0m`, `-----------------------------------------`);
});
