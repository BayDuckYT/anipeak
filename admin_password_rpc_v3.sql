create extension if not exists pgcrypto;

drop function if exists public.admin_change_password(uuid, text);
drop function if exists public.admin_change_password(text, text);

create or replace function public.admin_change_password(
  target_user_id text, 
  new_password text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  caller_role text;
begin
  -- Yetki kontrolü
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role is null or caller_role not in ('Baş Admin', 'Yönetici') then
    raise exception 'Bu işlem için yetkiniz yok!';
  end if;

  -- Şifre güncelleme (target_user_id metin olarak gelirse uuid'ye çeviriyoruz)
  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  where id = target_user_id::uuid;
end;
$$;

-- Açıkça tüm izinleri ver
GRANT EXECUTE ON FUNCTION public.admin_change_password(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_password(text, text) TO anon;

-- Şema önbelleğini yeniden yükle
NOTIFY pgrst, 'reload schema';
