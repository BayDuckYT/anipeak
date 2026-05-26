import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrder2() {
    console.log("Testing order by created_at...");
    const { data, error } = await supabase
        .from('custom_list_items')
        .select('*')
        .eq('list_id', 7)
        .order('created_at', { ascending: false });
    
    console.log("Error:", error);
}

testOrder2();
