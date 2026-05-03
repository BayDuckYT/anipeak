import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/series?select=*&order=is_trending.desc,title.asc`;
  console.log('Fetching', url);
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
    }
  });
  console.log('Status:', res.status);
  console.log('Cache-Control:', res.headers.get('cache-control'));
  console.log('CF-Cache-Status:', res.headers.get('cf-cache-status'));
  
  const data = await res.json();
  console.log('Total series:', data.length);
  const deneme = data.find(s => s.title === 'deneme');
  console.log('Found deneme?', !!deneme);
}

test();
