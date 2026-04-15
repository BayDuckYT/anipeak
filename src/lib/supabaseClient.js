import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nkvxavrhsoazpeucscso.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2lX5SRfGHEObJOY8C0w3xw_bxE7qgbj'

// [KOZMİK TEŞHİS]
if (typeof window !== 'undefined') {
  window.__SUPABASE_DEBUG__ = {
    url: supabaseUrl.slice(0, 15) + '...',
    domain: window.location.hostname
  };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
})
