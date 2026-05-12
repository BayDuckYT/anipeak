import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  // Get one comment to see column names
  const { data, error } = await supabase.from('comments').select('*').limit(1);
  if (error) {
    console.log('ERROR:', error.message);
  } else if (data && data.length > 0) {
    console.log('COLUMNS:', Object.keys(data[0]));
    console.log('SAMPLE:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('NO DATA - trying insert test columns...');
  }

  // Also test count
  const { count } = await supabase.from('comments').select('*', { count: 'exact', head: true });
  console.log('TOTAL COMMENTS:', count);
}

test();
