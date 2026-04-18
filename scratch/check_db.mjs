import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nkvxavrhsoazpeucscso.supabase.co'
const supabaseAnonKey = 'sb_publishable_2lX5SRfGHEObJOY8C0w3xw_bxE7qgbj'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data: mangalar, error: e1 } = await supabase.from('mangalar').select('*').limit(1)
  const { data: bolumler, error: e2 } = await supabase.from('bolumler').select('*').limit(1)
  const { data: sayfalar, error: e3 } = await supabase.from('sayfalar').select('*').limit(1)
  const { data: series, error: es } = await supabase.from('series').select('*').limit(1)
  const { data: chapters, error: ec } = await supabase.from('chapters').select('*').limit(1)
  const { data: pages, error: ep } = await supabase.from('pages').select('*').limit(1)
  
  console.log('mangalar', mangalar, e1)
  console.log('bolumler', bolumler, e2)
  console.log('sayfalar', sayfalar, e3)
  console.log('series', series, es)
  console.log('chapters', chapters, ec)
  console.log('pages', pages, ep)
}

test()
