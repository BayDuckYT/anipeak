// ============================================================
// 🏗️ ANIPEAK ASSET MIGRATOR (SİBER-TAHLİYE)
// Local -> GitHub (murathanozel48-prog) · Push & Destroy
// ============================================================

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SOURCE_DIR = 'C:\\Users\\Murathan\\Desktop\\anipeak-manga-assest';
const GITHUB_REPO_URL = 'https://murathanozel48-prog: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@github.com/murathanozel48-prog/manga-assets.git';

async function migrate() {
    console.log(`\x1b[35m[MIGRATOR]\x1b[0m >> Siber tahliye harekatı başlıyor...`);

    if (!fs.existsSync(SOURCE_DIR)) {
        console.log(`\x1b[31m[HATA]\x1b[0m >> Kaynak dizin bulunamadı: ${SOURCE_DIR}`);
        return;
    }

    const seriesFolders = fs.readdirSync(SOURCE_DIR).filter(f => {
        const fullPath = path.join(SOURCE_DIR, f);
        return fs.statSync(fullPath).isDirectory() && !f.startsWith('.');
    });

    console.log(`\x1b[34m[INFO]\x1b[0m >> Toplam ${seriesFolders.length} seri tahliye edilecek.`);

    for (const series of seriesFolders) {
        const seriesPath = path.join(SOURCE_DIR, series);
        console.log(`\n\x1b[33m[PROCESS]\x1b[0m >> Seri: ${series}`);

        try {
            // 1. Git Ayarları (Seri bazlı)
            process.chdir(seriesPath);
            
            try {
                execSync('git init', { stdio: 'ignore' });
                execSync(`git remote add origin ${GITHUB_REPO_URL}`, { stdio: 'ignore' });
            } catch (e) {
                // Remote zaten varsa veya initliyse devam et amk
            }

            execSync('git config user.email "murathanozel48@gmail.com"', { stdio: 'ignore' });
            execSync('git config user.name "Murathan Özel"', { stdio: 'ignore' });

            // 2. Mühimmatı hazırla
            console.log(`  [GIT] >> Dosyalar ekleniyor...`);
            execSync('git add .', { stdio: 'inherit' });
            
            console.log(`  [GIT] >> Mühürleniyor (Commit)...`);
            execSync(`git commit -m "Migrate assets: ${series}"`, { stdio: 'inherit' });

            // 3. GitHub'a ateşle
            console.log(`  [GIT] >> GitHub'a fırlatılıyor (Push)...`);
            execSync('git push -f origin master', { stdio: 'inherit' });

            console.log(`\x1b[32m[OK]\x1b[0m >> ${series} GitHub'a başarıyla nakledildi.`);

            // 4. İmhâ Et (Yükle ve Sil)
            console.log(`\x1b[31m[DESTROY]\x1b[0m >> Yerel dosyalar imha ediliyor...`);
            process.chdir('..'); // Bir üst dizine çık ki klasörü silebilelim amk
            fs.rmSync(seriesPath, { recursive: true, force: true });

        } catch (err) {
            console.log(`\x1b[31m[!] HATA:\x1b[0m ${series} nakledilemedi. (Remote hung up veya Network hatası)`);
            console.log(`  Hata Detayı: ${err.message}`);
            // Silme amk, kalsın sonra tekrar deneriz.
        }
    }

    console.log(`\n\x1b[35m[MIGRATOR]\x1b[0m >> Harekat tamamlandı. Disk rahatladı! 🫡`);
}

migrate().catch(console.error);
