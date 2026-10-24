-- ========================================================
-- MahoraPeak / AniPeak - Admin Şifre Sıfırlama / Güncelleme RPC Fonksiyonları
-- ========================================================
-- Bu kodu Supabase Dashboard -> SQL Editor sayfasına yapıştırıp "RUN" butonuna basınız.

-- 1. pgcrypto eklentisini aç (Şifre hashleme için zorunludur)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Eski tanımları temizle (çakışmaları önlemek için)
DROP FUNCTION IF EXISTS public.change_password_admin_rpc(json);
DROP FUNCTION IF EXISTS public.admin_change_password(uuid, text);
DROP FUNCTION IF EXISTS public.admin_change_password(text, text);

-- 3. ANA FONKSİYON: change_password_admin_rpc(payload json)
CREATE OR REPLACE FUNCTION public.change_password_admin_rpc(payload json)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_role text;
  t_id text;
  n_pass text;
BEGIN
  -- 1. İşlemi yapan kullanıcının yetki kontrolü
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('Baş Admin', 'Yönetici', 'Admin Yardımcısı') THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz yok!';
  END IF;

  -- 2. Parametreleri JSON içinden çek
  t_id := payload->>'target_user_id';
  n_pass := payload->>'new_password';

  IF t_id IS NULL OR n_pass IS NULL OR length(trim(n_pass)) < 6 THEN
    RAISE EXCEPTION 'Geçersiz parametre veya şifre en az 6 karakter olmalıdır!';
  END IF;

  -- 3. Supabase Auth tablosundaki şifreyi bcrypt ile mühürle
  UPDATE auth.users
  SET encrypted_password = crypt(n_pass, gen_salt('bf')),
      updated_at = now()
  WHERE id = t_id::uuid;
END;
$$;

-- 4. YEDEK FONKSİYON: admin_change_password (Doğrudan parametreli çağrılar için)
CREATE OR REPLACE FUNCTION public.admin_change_password(target_user_id text, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('Baş Admin', 'Yönetici', 'Admin Yardımcısı') THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz yok!';
  END IF;

  IF target_user_id IS NULL OR new_password IS NULL OR length(trim(new_password)) < 6 THEN
    RAISE EXCEPTION 'Geçersiz parametre veya şifre en az 6 karakter olmalıdır!';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id::uuid;
END;
$$;

-- 5. UUID tipindeki çağrılar için aşırı yükleme (overload)
CREATE OR REPLACE FUNCTION public.admin_change_password(target_user_id uuid, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  PERFORM public.admin_change_password(target_user_id::text, new_password);
END;
$$;

-- 6. Supabase API izinleri
GRANT EXECUTE ON FUNCTION public.change_password_admin_rpc(json) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_password_admin_rpc(json) TO anon;
GRANT EXECUTE ON FUNCTION public.change_password_admin_rpc(json) TO service_role;

GRANT EXECUTE ON FUNCTION public.admin_change_password(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_password(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_change_password(text, text) TO service_role;

GRANT EXECUTE ON FUNCTION public.admin_change_password(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_password(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_change_password(uuid, text) TO service_role;

-- 7. Supabase PostgREST önbelleğini hemen yenile
NOTIFY pgrst, 'reload schema';
