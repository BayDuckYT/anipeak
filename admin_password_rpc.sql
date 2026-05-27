-- Pgcrypto eklentisini aktif et (şifreleme için gereklidir)
create extension if not exists pgcrypto;

-- Şifre değiştirme fonksiyonu
create or replace function admin_change_password(target_user_id uuid, new_password text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  caller_role text;
begin
  -- 1. İşlemi çağıran kişinin (admin'in) yetkisini kontrol et
  select role into caller_role from public.profiles where id = auth.uid();
  
  -- Sadece Baş Admin ve Yöneticilerin yetkisi var
  if caller_role is null or caller_role not in ('Baş Admin', 'Yönetici') then
    raise exception 'Bu işlem için yetkiniz yok!';
  end if;

  -- 2. Şifreyi auth.users tablosunda güvenli şekilde (crypt ve salt ile) güncelle
  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  where id = target_user_id;

end;
$$;
