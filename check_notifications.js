import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: ins, error: errIns } = await supabase.from('notifications').insert([{ type: 'test' }]).select();
  if (errIns) {
    console.error("Insert error:", errIns);
  } else {
    console.log("Cols:", Object.keys(ins[0]));
    await supabase.from('notifications').delete().eq('id', ins[0].id);
  }
}
run();
