-- ========================================================
-- MahoraPeak / AniPeak - Kesin Çözümlü Admin Şifre Sıfırlama SQL
-- ========================================================
-- Bu kodu Supabase Dashboard -> SQL Editor içerisine yapıştırıp "RUN" butonuna basınız.

-- 1. Pgcrypto eklentisini garanti altına al
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Çakışan eski fonksiyonları tamamen temizle
DROP FUNCTION IF EXISTS public.change_password_admin_rpc(text, text);
DROP FUNCTION IF EXISTS public.change_password_admin_rpc(json);
DROP FUNCTION IF EXISTS public.admin_change_password(uuid, text);
DROP FUNCTION IF EXISTS public.admin_change_password(text, text);

-- 3. BİRİNCİ ÇAĞRI ŞEKLİ: Parametre isimleriyle (target_user_id text, new_password text)
CREATE OR REPLACE FUNCTION public.change_password_admin_rpc(
  target_user_id text,
  new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role text;
BEGIN
  -- İşlemi çağıran adminin rol kontrolü
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('Baş Admin', 'Yönetici', 'Admin Yardımcısı') THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz yok!';
  END IF;

  -- Parametre geçerlilik kontrolü
  IF target_user_id IS NULL OR new_password IS NULL OR length(trim(new_password)) < 6 THEN
    RAISE EXCEPTION 'Geçersiz parametre veya şifre en az 6 karakter olmalıdır!';
  END IF;

  -- auth.users tablosundaki şifreyi bcrypt ile güncelle
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id::uuid;
END;
$$;

-- 4. İKİNCİ ÇAĞRI ŞEKLİ: JSON Payload ile (payload json)
-- (PostgREST payload objesi gönderildiğinde de 404 almamak için)
CREATE OR REPLACE FUNCTION public.change_password_admin_rpc(payload json)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  PERFORM public.change_password_admin_rpc(
    (payload->>'target_user_id')::text,
    (payload->>'new_password')::text
  );
END;
$$;

-- 5. YEDEK FONKSİYON: admin_change_password (Doğrudan parametreli, çakışmasız)
CREATE OR REPLACE FUNCTION public.admin_change_password(
  target_user_id text,
  new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  PERFORM public.change_password_admin_rpc(target_user_id, new_password);
END;
$$;

-- 6. API Yetkilerini Aç (Anon, Authenticated ve Service Role)
GRANT EXECUTE ON FUNCTION public.change_password_admin_rpc(text, text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.change_password_admin_rpc(json) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_change_password(text, text) TO authenticated, anon, service_role;

-- 7. Supabase API Şema Önbelleğini Yeniden Yükle
NOTIFY pgrst, 'reload schema';
