create extension if not exists pgcrypto;

create or replace function public.change_password_admin_rpc(payload json)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  caller_role text;
  t_id text;
  n_pass text;
begin
  -- 1. Yetki Kontrolü
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role is null or caller_role not in ('Baş Admin', 'Yönetici') then
    raise exception 'Bu işlem için yetkiniz yok!';
  end if;

  -- 2. JSON içinden verileri çıkar
  t_id := payload->>'target_user_id';
  n_pass := payload->>'new_password';

  if t_id is null or n_pass is null then
    raise exception 'Eksik parametre!';
  end if;

  -- 3. Şifreyi Güncelle
  update auth.users
  set encrypted_password = crypt(n_pass, gen_salt('bf')),
      updated_at = now()
  where id = t_id::uuid;
end;
$$;

GRANT EXECUTE ON FUNCTION public.change_password_admin_rpc(json) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_password_admin_rpc(json) TO anon;

NOTIFY pgrst, 'reload schema';
