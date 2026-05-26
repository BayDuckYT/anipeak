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
const serviceKey = envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey || supabaseKey);

async function checkData() {
  console.log("Checking custom_list_items with Service Role Key...");
  const { data: items, error: itemsErr } = await supabase.from('custom_list_items').select('*');
  console.log("Items:", items, itemsErr);

  console.log("Checking RLS or table schema if possible...");
  // Not directly possible via REST but let's see items at least.
}

checkData();
