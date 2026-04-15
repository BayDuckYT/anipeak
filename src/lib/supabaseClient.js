import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nkvxavrhsoazpeucscso.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2lX5SRfGHEObJOY8C0w3xw_bxE7qgbj'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
