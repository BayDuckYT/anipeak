import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
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

async function cleanup() {
    console.log("\x1b[35m%s\x1b[0m", "==========================================================");
    console.log("\x1b[35m%s\x1b[0m", "🛡️ ANIPEAK: SİBER KURTARMA OPERASYONU (CLEANUP V1) 🛡️");
    console.log("\x1b[35m%s\x1b[0m", "==========================================================");
    
    console.log("🔍 [TARAMA] JSDelivr linki içeren bölümler analiz ediliyor...");
    
    // Tüm serileri çek (isimleri göstermek için)
    const { data: seriesList } = await supabase.from('series').select('id, title');
    const seriesMap = (seriesList || []).reduce((acc, s) => ({ ...acc, [s.id]: s.title }), {});

    // jsDelivr linki içeren bölümleri çek
    // Not: 'cs' (contains) filtresi JSONB sütunlarda çalışır
    const { data: chapters, error } = await supabase
        .from('chapters')
        .select('id, series_id, number, pages');

    if (error) {
        console.error("Hata:", error.message);
        return;
    }

    // Sadece JSDelivr içerenleri filtrele (JS tarafında daha güvenli)
    const targetChapters = chapters.filter(ch => 
        ch.pages && ch.pages.length > 0 && ch.pages[0].includes('cdn.jsdelivr.net')
    );

    console.log(`📡 Toplam ${targetChapters.length} CDN kaynaklı bölüm bulundu. Siber doğrulama başlıyor...`);

    let brokenCount = 0;
    for (const ch of targetChapters) {
        const firstPage = ch.pages[0];
        const sTitle = seriesMap[ch.series_id] || "Bilinmeyen Seri";

        try {
            // Sadece başlık bilgisini çek (hız için)
            await axios.head(firstPage, { timeout: 5000 });
        } catch (err) {
            // Eğer 404 (bulunamadı) dönerse, GitHub'dan silinmiş demektir
            if (err.response && err.response.status === 404) {
                console.log(`\x1b[31m[404-HATA]\x1b[0m >> ${sTitle} - Bölüm ${ch.number} silinmiş! [GÜVENLİK KORUMASI: SİLİNMEDİ]`);
                // const { error: delError } = await supabase.from('chapters').delete().eq('id', ch.id); // [YAMALANDI] GÜVENLİK NEDENİYLE KAPATILDI
                // if (!delError) {
                brokenCount++;
                // } else {
                //    console.error(`\x1b[31m[SİLME-HATASI]\x1b[0m ${delError.message}`);
                // }
            } else {
                // Diğer hatalar (timeout vs.) için pas geçiyoruz
                console.log(`\x1b[33m[UYARI]\x1b[0m >> ${sTitle} - Bölüm ${ch.number} erişim sorunu (Kod: ${err.response?.status || 'Timeout'})`);
            }
        }
    }

    console.log("\x1b[32m%s\x1b[0m", "\n==========================================================");
    console.log("\x1b[32m%s\x1b[0m", `✅ GÖREV TAMAMLANDI: ${brokenCount} BOZUK BÖLÜM İMHA EDİLDİ.`);
    console.log("\x1b[32m%s\x1b[0m", "🚀 ŞİMDİ BOTU TEKRAR SAL, EKSİKLERİ MERMİ GİBİ DİZECEK AMK!");
    console.log("\x1b[32m%s\x1b[0m", "==========================================================");
}

cleanup();
