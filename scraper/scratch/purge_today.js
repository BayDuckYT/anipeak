import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Scraper .env dosyasını oku
if (fs.existsSync(path.resolve('scraper', '.env'))) {
  dotenv.config({ path: path.resolve('scraper', '.env') });
} else {
  dotenv.config();
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function purgeToday() {
    console.log("\x1b[35m%s\x1b[0m", "==========================================================");
    console.log("\x1b[35m%s\x1b[0m", "🧹 ANIPEAK: BUGÜNÜN HATALI VERİLERİNİ TEMİZLEME 🧹");
    console.log("\x1b[35m%s\x1b[0m", "==========================================================");
    
    // Bugünün tarihini al (UTC bazlı)
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Hedef Gün: ${today}`);

    // Bugün eklenen ve JSDelivr kullanan bölümleri bul
    // Not: created_at sütunu genellikle ISO string tutar
    const { data: chapters, error } = await supabase
        .from('chapters')
        .select('id, series_id, number, pages, created_at')
        .gte('created_at', today);

    if (error) {
        console.error("Hata:", error.message);
        return;
    }

    // JSDelivr içerenleri filtrele
    const faultyChapters = chapters.filter(ch => 
        ch.pages && ch.pages.length > 0 && JSON.stringify(ch.pages).includes('cdn.jsdelivr.net')
    );

    console.log(`🔍 Bugün eklenen ${faultyChapters.length} hatalı (JSDelivr) bölüm tespit edildi.`);

    if (faultyChapters.length === 0) {
        console.log("✅ Temizlenecek bir şey bulunamadı.");
        return;
    }

    const idsToDelete = faultyChapters.map(ch => ch.id);
    
    console.log("🗑️ Temizlik başlıyor...");
    
    // Toplu silme
    const { error: delError } = await supabase
        .from('chapters')
        .delete()
        .in('id', idsToDelete);

    if (!delError) {
        console.log(`\x1b[32m[OK]\x1b[0m ${idsToDelete.length} bölüm sistemden imha edildi.`);
        console.log("\n🚀 Usta, saha temizlendi! Şimdi botu sal, tertemiz (kalıcı) yüklemeye başlasın!");
    } else {
        console.error("\x1b[31m[HATA]\x1b[0m Silme işlemi başarısız:", delError.message);
    }
}

purgeToday();
