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
    const SUPABASE_SERVICE_KEY = env?.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_SERVICE_KEY) {
      return new Response(JSON.stringify({ error: 'Yönetim servisi yapılandırılmadı.' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }

    const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const accessToken = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!accessToken) return new Response(JSON.stringify({ error: 'Oturum açman gerekiyor.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    const { data: authData, error: authError } = await sbAdmin.auth.getUser(accessToken);
    if (authError || !authData?.user) return new Response(JSON.stringify({ error: 'Oturum doğrulanamadı.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    const { data: callerProfile } = await sbAdmin.from('profiles').select('role').eq('id', authData.user.id).maybeSingle();
    const isOwner = authData.user.email?.toLowerCase() === 'murathanozel134@gmail.com';
    if (!isOwner && !['Baş Admin', 'Yönetici'].includes(callerProfile?.role)) {
      return new Response(JSON.stringify({ error: 'Bu işlem için yönetici yetkisi gerekiyor.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

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
