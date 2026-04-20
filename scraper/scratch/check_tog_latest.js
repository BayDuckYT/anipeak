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
    const { data: s } = await supabase.from('series').select('id, title').ilike('title', '%Tower of God%').single();
    if (s) {
        const { data: chapters } = await supabase.from('chapters').select('number').eq('series_id', s.id).order('number', { ascending: false }).limit(10);
        console.log(`Latest chapters for ${s.title}:`, chapters.map(c => c.number));
    }
}
check();
