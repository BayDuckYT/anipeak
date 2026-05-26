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

async function checkData() {
  console.log("Checking custom_lists...");
  const { data: lists, error: listsErr } = await supabase.from('custom_lists').select('*');
  console.log("Lists:", lists, listsErr);

  console.log("Checking custom_list_items...");
  const { data: items, error: itemsErr } = await supabase.from('custom_list_items').select('*');
  console.log("Items:", items, itemsErr);
}

checkData();
