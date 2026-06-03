-- Veritabanındaki rol kısıtlamasını güncelliyoruz (Moderatör ve Tester yetkilerini veritabanının kabul etmesi için)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (
    role IN ('Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Moderatör', 'Tester', 'Kullanıcı')
);
