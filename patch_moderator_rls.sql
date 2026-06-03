-- Moderatörlerin "profiles" (kullanıcılar) tablosunu güncelleyebilmesi (susturma işlemi) için gerekli RLS (Satır Bazlı Güvenlik) yetkisi
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;

CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Moderatör'))
);
