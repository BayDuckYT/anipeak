import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const channel = supabase.channel('public:announcements');
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'announcements' },
    (payload) => console.log('Announcement:', payload)
  );

  channel.subscribe((status) => {
    console.log('Status:', status);
    if (status === 'SUBSCRIBED') {
      console.log('Bindings:', channel.bindings.postgres_changes.length);
      setTimeout(async () => {
        console.log('Inserting announcement...');
        const { error } = await supabase.from('announcements').insert([{
          type: 'system',
          text: 'Test realtime'
        }]);
        console.log('Insert error:', error?.message);
      }, 1000);
    }
  });
}

test();
