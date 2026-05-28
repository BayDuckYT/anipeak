const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAchievements() {
  const updates = [
    { old: "Siber Kütüphane", new: "Özel Kütüphane" },
    { old: "Siber Mühür", new: "Topluluk Mührü" },
    { old: "Siber Elçi", new: "Topluluk Elçisi" },
    { old: "Siber Sosyete", new: "Sosyal Okuyucu" },
    { old: "Siber Şövalye", new: "Günün Şövalyesi" }
  ];

  for (const item of updates) {
    const { error } = await supabase
      .from('achievements')
      .update({ name: item.new })
      .eq('name', item.old);
    if (error) console.error(`Error updating ${item.old}:`, error);
    else console.log(`Updated ${item.old} -> ${item.new}`);
  }
}

updateAchievements();
