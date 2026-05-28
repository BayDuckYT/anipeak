create extension if not exists pgcrypto;

drop function if exists public.admin_change_password(uuid, text);

create or replace function public.admin_change_password(
  target_user_id uuid, 
  new_password text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  caller_role text;
begin
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role is null or caller_role not in ('Baş Admin', 'Yönetici') then
    raise exception 'Bu işlem için yetkiniz yok!';
  end if;

  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  where id = target_user_id;
end;
$$;

-- Supabase API'sinin bunu kesinlikle görebilmesi için yetkileri açıkça veriyoruz
GRANT EXECUTE ON FUNCTION public.admin_change_password(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_password(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_change_password(uuid, text) TO service_role;

-- API önbelleğini sıfırla
NOTIFY pgrst, 'reload schema';
