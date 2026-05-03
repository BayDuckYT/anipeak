import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  console.log('Inserting series...');
  const { data: s, error: se } = await supabase.from('series').insert([
    { title: 'Test Series ' + Date.now(), cover: 'https://i.ibb.co/3Wk09r7/anipeak-logo.png', genre: ['Aksiyon'], reads_num: 0, rating: 0, status: 'Devam Ediyor' }
  ]).select().single();
  
  if (se) return console.error('Series Error:', se);
  console.log('Series inserted:', s.id);
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Inserting chapter...');
  const { data: c, error: ce } = await supabase.from('chapters').insert([
    { series_id: s.id, number: 1, title: 'Bölüm 1', pages: [] }
  ]);
  
  if (ce) return console.error('Chapter Error:', ce);
  console.log('Chapter inserted');
}

test();
