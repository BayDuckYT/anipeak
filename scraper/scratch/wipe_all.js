import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('scraper', '.env') });
if (!process.env.SUPABASE_URL) {
  dotenv.config({ path: '/root/mahorapeak/scraper/.env' }); // VDS fallback
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key is needed to bypass RLS for deletion
);

async function wipeDatabase() {
  console.log("🚀 Veritabanı temizleme operasyonu başladı...");

  try {
    // Sıralama önemli (Foreign Key kısıtlamaları için)
    const tables = [
      'chapters',
      'comments',
      'ratings',
      'chapter_ratings',
      'announcements',
      'error_reports',
      'series'
    ];

    for (const table of tables) {
      console.log(`🧹 ${table} tablosu temizleniyor...`);
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', -1); // Tüm satırları seçmek için hile

      if (error) {
        console.error(`❌ ${table} temizlenirken hata:`, error.message);
      } else {
        console.log(`✅ ${table} temizlendi.`);
      }
    }

    console.log("\n✨ TEMİZLİK TAMAMLANDI! MahoraPeak artık bomboş ve hazır.");
  } catch (err) {
    console.error("💥 Kritik Hata:", err.message);
  }
}

wipeDatabase();
