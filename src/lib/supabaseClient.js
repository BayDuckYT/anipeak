import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yrcrgkdikkaeccikdzvw.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hic5fR71xFLQ4TE7ycVBXQ_xdQHkJGO'

// [KOZMİK TEŞHİS]
if (typeof window !== 'undefined') {
  window.__SUPABASE_DEBUG__ = {
    url: supabaseUrl.slice(0, 15) + '...',
    domain: window.location.hostname
  };
}

// Güvenli istemci oluşturma (Değişkenler eksik olsa bile uygulamayı çökertmemesi için)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder', 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    }
  }
)
