import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yrcrgkdikkaeccikdzvw.supabase.co'
const supabaseAnonKey = 'sb_publishable_hic5fR71xFLQ4TE7ycVBXQ_xdQHkJGO'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
    console.log('--- Supabase Connection Test ---')
    
    // Test series table
    const { data, error } = await supabase
        .from('series')
        .select('*')
        .limit(1)

    if (error) {
        console.error('❌ Error fetching from "series":', error)
    } else {
        console.log('✅ Success fetching from "series"!')
        console.log('Data sample:', data)
    }

    // Test chapters table
    const { data: cData, error: cError } = await supabase
        .from('chapters')
        .select('*')
        .limit(1)

    if (cError) {
        console.error('❌ Error fetching from "chapters":', cError)
    } else {
        console.log('✅ Success fetching from "chapters"!')
    }
}

testConnection()
