import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read service role key from Haber/.env
const envContent = fs.readFileSync(path.join(process.cwd(), 'discord-bots/Haber/.env'), 'utf8');
const SUPABASE_URL = envContent.match(/SUPABASE_URL=(.+)/)[1].trim();
const SUPABASE_KEY = envContent.match(/SUPABASE_KEY=(.+)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  console.log('Connecting to realtime with Service Role Key...');
  const channel = supabase.channel('anipeak-global');
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'series' }, (payload) => {
    console.log('\n🔥 RECEIVED EVENT:', payload.eventType, 'for series ID:', payload.new?.id || payload.old?.id);
  });

  channel.subscribe(async (status) => {
    console.log('Status:', status);
    if (status === 'SUBSCRIBED') {
      console.log('Waiting 2 seconds before inserting...');
      setTimeout(async () => {
        console.log('Inserting test series...');
        const { data, error } = await supabase.from('series').insert([{
          title: 'Realtime Bot Test',
          cover: 'https://i.ibb.co/3Wk09r7/anipeak-logo.png',
          status: 'Devam Ediyor',
          genre: ['Aksiyon']
        }]).select().single();
        
        if (error) {
          console.error('Insert error:', error.message);
        } else {
          console.log('Insert success! ID:', data.id);
        }
      }, 2000);
    }
  });
}

test();
