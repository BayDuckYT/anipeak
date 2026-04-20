import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { getOrCreateSeries, createChapterIfNotExists, supabase } from '../src/db.js';
import { processAndSaveLocally } from '../utils/imageProcessor.js';
import logger from '../utils/logger.js';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import axios from 'axios';

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// SİBER LİMİT: Event listener uyarısını sustur ve sınırı kaldır amk!
process.setMaxListeners(0);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// ==========================================
// 🛡️ ANIPEAK SİBER NİZAM OPERASYON MERKEZİ
// ==========================================
const BASE_URL = 'https://mangaokutr.co';
const GITHUB_TOKEN = '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';
const GITHUB_USER = 'murathanozel48-prog';
const REPO_NAME = 'anipeak-manga-assets';
const STAGING_DIR = 'C:\\Users\\Murathan\\Desktop\\anipeak-manga-assets';
const JSDELIVR_BASE = `https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${REPO_NAME}@main/`;
const BATCH_SIZE = 40; // SİBER IŞIK HIZI

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
let gitMutex = Promise.resolve(); 

async function ensureGitHubRepo() {
    try {
        await axios.get(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}`, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });
    } catch (err) {
        if (err.response && err.response.status === 404) {
            await axios.post(`https://api.github.com/user/repos`, { name: REPO_NAME, private: false, auto_init: true }, {
                headers: { Authorization: `token ${GITHUB_TOKEN}` }
            });
        }
    }
}

async function gitPushAndDestroyBatch(batch, seriesTitle) {
    return gitMutex = gitMutex.then(async () => {
        try {
            const chapterNumbers = batch.map(c => c.number).join(', ');
            console.log(`\x1b[90m[${new Date().toLocaleTimeString()}]\x1b[0m \x1b[34m[GIT-BATCH]\x1b[0m >> ${seriesTitle} - Bölümler [${chapterNumbers}] fırlatılıyor...`);
            
            const originalDir = process.cwd();
            process.chdir(STAGING_DIR);

            if (!fs.existsSync(path.join(STAGING_DIR, '.git'))) {
                execSync('git init', { stdio: 'ignore' });
                execSync(`git remote add origin https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git`, { stdio: 'ignore' });
                execSync('git config user.email "murathanozel48@gmail.com"', { stdio: 'ignore' });
                execSync('git config user.name "Murathan Ozel"', { stdio: 'ignore' });
            } else {
                execSync(`git remote set-url origin https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git`, { stdio: 'ignore' });
            }

            try { execSync('git pull origin main', { stdio: 'ignore' }); } catch (e) {}
            try { execSync('Get-ChildItem -Filter ".git" -Recurse -Force | Where-Object { $_.FullName -notmatch "\\\\.git$" } | Remove-Item -Recurse -Force', { shell: 'powershell', stdio: 'ignore' }); } catch (e) {}

            execSync('git add --ignore-removal .', { stdio: 'inherit' });
            try { execSync(`git commit -m "Bulk Upload: ${seriesTitle} - Chapters ${chapterNumbers}"`, { stdio: 'ignore' }); } catch (e) {}
            execSync('git push -u origin main', { stdio: 'inherit' });
            
            for (const ch of batch) {
                if (ch.localPath && fs.existsSync(ch.localPath)) fs.rmSync(ch.localPath, { recursive: true, force: true });
            }
            process.chdir(originalDir);
            return true;
        } catch (err) {
            logger.error(`[GIT-BATCH-ERROR] Push başarısız: ${err.message}`);
            return false;
        }
    });
}

async function autoScroll(page) {
    await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
}

async function processSingleSeries(title, browser) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1400 });
    
    try {
        console.log(`\n\x1b[36m[OPERASYON]\x1b[0m >> Hedef: ${title}`);
        let targetUrl = title.startsWith('http') ? title : null;
        
        if (!targetUrl) {
            await page.goto(`${BASE_URL}/?s=${encodeURIComponent(title)}&post_type=wp-manga`, { waitUntil: 'domcontentloaded' });
            await delay(1000);
            targetUrl = await page.evaluate((t) => {
                const found = Array.from(document.querySelectorAll('.post-title h3 a, .manga-box a, .item a'))
                    .find(a => a.innerText.toLowerCase().includes(t.toLowerCase()));
                return found ? found.href : null;
            }, title);
        }

        if (!targetUrl) return;

        await page.goto(targetUrl, { waitUntil: 'load', timeout: 60000 });
        const sData = await page.evaluate(() => {
            const title = document.querySelector('.post-title h1')?.innerText.trim() || document.querySelector('h1')?.innerText.trim();
            const cover = document.querySelector('.summary_image img')?.src || document.querySelector('.poster img')?.src || document.querySelector('img')?.src;
            const description = document.querySelector('.description-summary')?.innerText.trim() || document.querySelector('.summary__content')?.innerText.trim() || document.querySelector('.summary')?.innerText.trim();
            const genres = Array.from(document.querySelectorAll('a[href*="/manga-genre/"], .genres-content a')).map(a => a.innerText.trim());
            const status = document.body.innerText.includes('Ongoing') || document.body.innerText.includes('Devam') ? 'Devam Ediyor' : 'Tamamlandı';
            const chapters = Array.from(document.querySelectorAll('.wp-manga-chapter a')).map(a => ({
                href: a.href,
                number: parseFloat(a.innerText.match(/(\d+(\.\d+)?)/)?.[0] || '0'),
                title: a.innerText.trim()
            })).filter(c => c.number > 0);
            return { title, cover, description, status, genres, chapters };
        });

        if (!sData || !sData.title) return;

        const coverRelPath = await processAndSaveLocally(sData.cover, true, sData.title);
        const coverUrl = coverRelPath ? JSDELIVR_BASE + coverRelPath : sData.cover;
        const seriesId = await getOrCreateSeries(sData.title, coverUrl, sData.description, sData.genres, sData.status);
        
        const sortedChapters = sData.chapters.sort((a, b) => a.number - b.number);
        let batch = [];

        for (let i = 0; i < sortedChapters.length; i++) {
            const chapter = sortedChapters[i];
            const { data: existing } = await supabase.from('chapters').select('id').eq('series_id', seriesId).eq('number', chapter.number).maybeSingle();
            if (existing) continue;

            await page.goto(chapter.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await autoScroll(page);
            await delay(300);

            const pageUrls = await page.evaluate(() => {
                const selectors = ['.reading-content img', '.page-break img', '#reader-area img', '.reader-content img', '.page-img img', '.wp-manga-chapter-img img'];
                let images = [];
                for (const sel of selectors) {
                    const found = Array.from(document.querySelectorAll(sel));
                    if (found.length > 0) { images = found; break; }
                }
                return images.map(img => img.src || img.dataset.src || img.getAttribute('data-lazy-src') || img.getAttribute('data-src'))
                            .filter(src => src && !src.includes('logo') && !src.includes('loading') && !src.includes('data:image'));
            });

            if (pageUrls.length < 5) continue;

            const jsDelivrUrls = [];
            let localDir = '';
            const CONCURRENCY = 30; 
            for (let j = 0; j < pageUrls.length; j += CONCURRENCY) {
                const chunk = pageUrls.slice(j, j + CONCURRENCY);
                const chunkResults = await Promise.all(chunk.map(async (pUrl, idx) => {
                    return await processAndSaveLocally(pUrl, false, sData.title, chapter.number, j + idx + 1);
                }));
                for (const relPath of chunkResults) {
                    if (relPath) {
                        jsDelivrUrls.push(JSDELIVR_BASE + relPath);
                        if (!localDir) localDir = path.join(STAGING_DIR, path.dirname(relPath));
                    }
                }
            }

            if (jsDelivrUrls.length > 0) {
                batch.push({ number: chapter.number, urls: jsDelivrUrls, localPath: localDir });
            }

            if (batch.length >= BATCH_SIZE || (i === sortedChapters.length - 1 && batch.length > 0)) {
                const pushSuccess = await gitPushAndDestroyBatch(batch, sData.title);
                if (pushSuccess) {
                    for (const bChapter of batch) {
                        await createChapterIfNotExists(seriesId, bChapter.number, `${sData.title} - Bölüm ${bChapter.number}`, bChapter.urls);
                    }
                }
                batch = [];
            }
        }
    } catch (err) {
        logger.error(`[Series-Error] ${title}: ${err.message}`);
    } finally {
        await page.close();
    }
}

async function runSiberNizam() {
  console.clear();
  console.log("\x1b[35m%s\x1b[0m", "==========================================================");
  console.log("\x1b[35m%s\x1b[0m", "⚓ ANIPEAK: SİBER NİZAM (MANGAOKUTR ÖZEL) V67 ⚓");
  console.log("\x1b[35m%s\x1b[0m", "==========================================================");

    try {
    await ensureGitHubRepo();
    
    const input = await askQuestion("\n\x1b[33m[TEĞMEN-SORUSU]\x1b[0m >> Seri isimleri veya URL girin: ");
    let targetTitles = input.split(',').map(t => t.trim()).filter(t => t.length > 0);

    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote'] });

    // SİBER AYAR: 5 çok yüklendi, 3'e çekip stabiliteyi koruyoruz usta!
    const SERIES_CONCURRENCY = 3; 
    
    // 1. ÖNCELİKLİ TAARRUZ (Kullanıcı Listesi)
    console.log(`\n\x1b[35m[AŞAMA-1]\x1b[0m >> Kullanıcı listesi sırayla işleniyor (MangaOkuTR)...`);
    for (const title of targetTitles) {
        await processSingleSeries(title, browser);
    }

    // 2. OTONOM DEVRİYE (Popüler Aksiyon Mangaları)
    console.log(`\n\x1b[35m[AŞAMA-2]\x1b[0m >> Otonom Devriye Başlıyor: MangaOkuTR Popüler Aksiyon...`);
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/manga-genre/aksiyon/?m_orderby=views`, { waitUntil: 'domcontentloaded' });
    await delay(2000);
    
    const popularTitles = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.post-title h3 a, .manga-box a'))
            .map(a => a.innerText.trim())
            .filter((v, i, a) => a.indexOf(v) === i) 
            .slice(0, 20); 
    });
    await page.close();

    console.log(`\x1b[32m[DEVRİYE]\x1b[0m >> ${popularTitles.length} popüler aksiyon serisi tespit edildi. Taarruz başlıyor...`);
    for (const title of popularTitles) {
        await processSingleSeries(title, browser);
    }

    await browser.close();
    console.log(`\n\x1b[32m[GÖREV-TAMAMLANDI]\x1b[0m >> Tüm operasyon başarıyla sonuçlandı!`);

  } catch (err) {
    logger.error(`[Siber-Nizam-Kritik] ${err.message}`);
  } finally {
    rl.close();
  }
}

runSiberNizam();
