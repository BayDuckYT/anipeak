import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testUpdate() {
  console.log('Attempting to update series 107 to is_deleted = true...');
  const { data, error } = await supabase.from('series').update({ is_deleted: true }).eq('id', 107).select();
  console.log('Result:', data);
  console.log('Error:', error);
}

testUpdate();
