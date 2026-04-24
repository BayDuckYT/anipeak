import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

if (fs.existsSync(path.resolve('scraper', '.env'))) {
  dotenv.config({ path: path.resolve('scraper', '.env') });
} else {
  dotenv.config();
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
    const { data: series } = await supabase.from('series').select('id, title').ilike('title', '%jujutsu%').single();
    if (!series) return console.log("Seri bulunamadı");
    
    console.log("Seri:", series.title);
    const { data: chapters } = await supabase.from('chapters').select('number, pages').eq('series_id', series.id).order('number', { ascending: true });
    
    console.log("Toplam bölüm:", chapters.length);
    console.log("İlk 5 bölüm:", chapters.slice(0, 5).map(c => ({ number: c.number, firstPage: c.pages?.[0] })));
}
check();
