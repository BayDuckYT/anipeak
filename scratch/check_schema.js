import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yrcrgkdikkaeccikdzvw.supabase.co'
const supabaseAnonKey = 'sb_publishable_hic5fR71xFLQ4TE7ycVBXQ_xdQHkJGO'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkCommentsSchema() {
    console.log('--- Checking Comments Table Schema ---')
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .limit(1)

    if (error) {
        console.error('❌ Error:', error)
    } else {
        console.log('✅ Success!')
        if (data && data.length > 0) {
            console.log('Available columns:', Object.keys(data[0]))
        } else {
            console.log('Table is empty, trying to fetch one record to see columns...')
        }
    }
}

checkCommentsSchema()
