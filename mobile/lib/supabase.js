import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yisvclswvthasvovrxta.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpc3ZjbHN3dnRoYXN2b3ZyeHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMyNDY0NTcsImV4cCI6MjAyODgyMjQ1N30.8i6Vp9_e0W-1x8g0U0s3M3x5W-1x8g0U0s3M3x5W-1x8g0U0s3M3x5';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
