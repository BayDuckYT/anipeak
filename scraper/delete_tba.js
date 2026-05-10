import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// .env dosyasını bul
if (fs.existsSync(path.resolve('.env'))) {
  dotenv.config({ path: path.resolve('.env') });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("HATA: SUPABASE_URL veya SUPABASE_SERVICE_KEY bulunamadı!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteSeries() {
  console.log("🚨 'The Beginning After The End' serisi veritabanından siliniyor...");

  // Önce seriyi bul
  const { data: series, error: searchError } = await supabase
    .from('series')
    .select('id')
    .ilike('title', 'The Beginning After The End')
    .single();

  if (searchError) {
    console.log("Seri bulunamadı veya daha önce silinmiş. Hata:", searchError.message);
    return;
  }

  // Bölümleri sil
  const { error: deleteChaptersError } = await supabase
    .from('chapters')
    .delete()
    .eq('series_id', series.id);
  
  if (deleteChaptersError) {
    console.log("Bölümler silinirken hata:", deleteChaptersError.message);
  } else {
    console.log("✅ Seriye ait tüm bölümler veritabanından silindi.");
  }

  // Seriyi sil
  const { error: deleteSeriesError } = await supabase
    .from('series')
    .delete()
    .eq('id', series.id);

  if (deleteSeriesError) {
    console.log("Seri silinirken hata:", deleteSeriesError.message);
  } else {
    console.log("✅ 'The Beginning After The End' serisi başarıyla yokedildi!");
  }
}

deleteSeries();
