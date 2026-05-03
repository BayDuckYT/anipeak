import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

// Scraper .env dosyasını oku
const envPath = path.resolve('scraper', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function autoFix() {
    console.log("🔍 [AUTO-FIX] Siber tarama başlatıldı...");
    
    const { data: chapters, error } = await supabase
        .from('chapters')
        .select('id, series_id, number, pages');

    if (error) {
        console.error("Hata:", error.message);
        return;
    }

    console.log(`📡 Toplam ${chapters.length} bölüm veritabanında analiz ediliyor...`);
    
    const brokenChapters = [];
    
    for (const ch of chapters) {
        if (!ch.pages || ch.pages.length < 3) {
            brokenChapters.push({ ...ch, reason: 'Veritabanı (Eksik Sayfa)' });
            continue;
        }

        // İlk sayfayı kontrol et (GitHub'da var mı?)
        try {
            const firstPage = ch.pages[0];
            if (firstPage.includes('cdn.jsdelivr.net')) {
                await axios.head(firstPage, { timeout: 3000 });
            }
        } catch (err) {
            brokenChapters.push({ ...ch, reason: 'GitHub (404/Erişim Hatası)' });
        }
    }

    if (brokenChapters.length === 0) {
        console.log("✅ Tebrikler! Tüm bölümler sağlam görünüyor.");
        return;
    }

    console.log(`\n❌ Toplam ${brokenChapters.length} sorunlu bölüm tespit edildi.`);
    
    const seriesToFix = [...new Set(brokenChapters.map(ch => ch.series_id))];
    const { data: seriesList } = await supabase.from('series').select('id, title').in('id', seriesToFix);
    const seriesMap = (seriesList || []).reduce((acc, s) => ({ ...acc, [s.id]: s.title }), {});

    console.log("🛠️ Sorunlu Seriler:");
    seriesList.forEach(s => {
        const list = brokenChapters.filter(ch => ch.series_id === s.id);
        console.log(`- ${s.title}: ${list.length} sorunlu bölüm (${list[0].reason})`);
    });

    console.log("\n🚀 Siber Tavsiye: 'v61_speed_titan.js' botunu şu seriler için çalıştırın:");
    const titles = seriesList.map(s => s.title).join(', ');
    console.log(`node v61_speed_titan.js (Hedef: ${titles})`);
}

autoFix();
