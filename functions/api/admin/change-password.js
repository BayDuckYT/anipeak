import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { target_user_id, new_password } = body || {};

    if (!target_user_id || !new_password || new_password.length < 6) {
      return new Response(JSON.stringify({ error: 'target_user_id ve en az 6 karakterli new_password zorunludur.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const SUPABASE_URL = env?.VITE_SUPABASE_URL || env?.SUPABASE_URL || 'https://yrcrgkdikkaeccikdzvw.supabase.co';
    const SUPABASE_SERVICE_KEY = env?.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyY3Jna2Rpa2thZWNjaWtkenZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI2NDMxNywiZXhwIjoyMDkxODQwMzE3fQ.rVXIyF1wG6KG6K_bdtx0J84LZwv0Y0NGT4LJvAENvGw';

    const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await sbAdmin.auth.admin.updateUserById(target_user_id, {
      password: new_password
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, user: data.user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
