import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testJoin() {
  console.log("Testing comments join with profiles...");
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(*)')
    .limit(1);
  
  if (error) {
    console.error("Join Failed:", error);
    console.log("Testing flat comments...");
    const { data: flatData, error: flatError } = await supabase.from('comments').select('*').limit(1);
    console.log("Flat Result:", flatData ? Object.keys(flatData[0]) : flatError);
  } else {
    console.log("Join Success!", data);
  }
}

testJoin();
