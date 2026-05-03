import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const channel = supabase.channel('public:series');

  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'chapters' },
    (payload) => console.log('Chapter:', payload)
  );

  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'series' },
    (payload) => console.log('Series:', payload)
  );

  channel.subscribe((status) => {
    console.log('Status:', status);
    if (status === 'SUBSCRIBED') {
      console.log('Bindings:', channel.bindings.postgres_changes.length);
    }
  });
}

test();
