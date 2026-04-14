import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Profesyonel hata kontrolü: Eğer anahtarlar yoksa uygulama çökmesin diye uyarı verir.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'AniPeak Uyarı: Supabase URL veya Anon Key eksik. Lütfen .env dosyasını kontrol edin. ' +
    'Şu anda veriler sadece yerel olarak çalışacaktır.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)
