import { supabase } from './src/lib/supabaseClient.js';
console.log('Testing Supabase Client Setup:');
console.log('URL:', supabase.supabaseUrl);
console.log('Key starts with:', supabase.supabaseKey.substring(0, 10));
