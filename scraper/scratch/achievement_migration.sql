-- ============================================================
-- 🌌 ANIPEAK KOZMİK BAŞARIMLAR SİSTEMİ (v1) — TEMİZ KURULUM
-- ============================================================

-- ÖNCEKİ TABLOLARI TEMİZLE (ÇAKIŞMAYI ÖNLEMEK İÇİN)
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;

-- 1. BAŞARIMLAR TABLOSU
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    category TEXT NOT NULL, -- Okuma, İstikrar, Tür, Sosyal, Rütbe, Efsanevi
    requirement_type TEXT NOT NULL, -- total_chapters, streak, genre_count, social, level, special
    requirement_value INTEGER NOT NULL,
    is_secret BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. KULLANICI BAŞARIMLARI (JUNCTION)
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

-- 3. GÜVENLİK AYARLARI (RLS)
-- Herkes başarımları görebilmeli
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on achievements" ON achievements FOR SELECT USING (true);

-- Kullanıcılar kendi kazandıkları başarıları görebilmeli, sistem ekleyebilmeli
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on user_achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Allow users to insert their own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. PROFİLLERİ GÜNCELLE (İSTATİSTİK TAKİBİ İÇİN)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_chapters_read INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_pages_read INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS genre_stats JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 5. VERİLERİ DOLDUR (100 ADET BAŞARIM)
INSERT INTO achievements (name, description, category, requirement_type, requirement_value) VALUES
-- CATEGORY 1: OKUMA HACMİ VE ARŞİV (1-25)
('İlk Sayfa', 'İlk manga bölümünü başarıyla bitir.', 'Okuma', 'total_chapters', 1),
('Mürekkep Tadı', '10 farklı bölüm oku.', 'Okuma', 'total_chapters', 10),
('Kütüphane Faresi', '50 bölüm bitir amk.', 'Okuma', 'total_chapters', 50),
('Cilt Avcısı', '100 bölüm bitir.', 'Okuma', 'total_chapters', 100),
('Seri Katili', '5 farklı seriyi tamamen bitir.', 'Okuma', 'series_complete', 5),
('Manga Tiryakisi', '500 bölüm oku.', 'Okuma', 'total_chapters', 500),
('Büyük Arşivci', '1.000 bölüm oku.', 'Okuma', 'total_chapters', 1000),
('Sayfa Canavarı', 'Tek seferde 50 sayfa çevir.', 'Okuma', 'pages_in_one_go', 50),
('Haftalık Mesai', 'Bir haftada 100 bölüm bitir.', 'Okuma', 'weekly_chapters', 100),
('Okuma Tanrısı', 'Toplam 10.000 sayfa oku amk!', 'Okuma', 'total_pages', 10000),
('Koleksiyoncu', 'Listene 50 farklı seri ekle.', 'Okuma', 'list_count', 50),
('Aralıksız Okur', '3 saat boyunca kesintisiz oku.', 'Okuma', 'session_time', 180),
('Gece Kuşu', 'Gece 00:00 - 04:00 arası 5 bölüm oku.', 'Okuma', 'night_reading', 5),
('Hızlı Okur', 'Bir bölümü 1 dakikanın altında bitir.', 'Okuma', 'fast_read', 1),
('Gurme', '10 farklı yazardan seri oku.', 'Okuma', 'author_count', 10),
('Kitap Kurdu', 'Günde ortalama 20 bölüm oku (7 gün boyunca).', 'Okuma', 'avg_daily', 20),
('Manga Mühendisi', '500 farklı seriye göz at.', 'Okuma', 'browse_count', 500),
('Eski Dost', 'Aynı seriyi ikinci kez bitir.', 'Okuma', 're_read', 1),
('Yorumcu', '100 farklı bölüme yorum bırak.', 'Okuma', 'comments', 100),
('Eleştirmen', '5 seriye puan ver.', 'Okuma', 'ratings', 5),
('Siber Kütüphane', 'Kendi özel listeni oluştur.', 'Okuma', 'custom_list', 1),
('Paylaşımcı', 'Bir seriyi 5 arkadaşına öner.', 'Okuma', 'shares', 5),
('Mobil Okur', 'Mobil cihazdan 100 bölüm oku.', 'Okuma', 'mobile_read', 100),
('Masaüstü Canavarı', 'PC üzerinden 500 sayfa çevir.', 'Okuma', 'pc_read', 500),
('Mükemmeliyetçi', 'Bir serinin tüm bölümlerini hiç atlamadan oku.', 'Okuma', 'no_skip', 1);

-- CATEGORY 2: İSTİKRAR VE DİSİPLİN (26-45)
INSERT INTO achievements (name, description, category, requirement_type, requirement_value) VALUES
('İlk Adım', 'Üst üste 2 gün siteye gir.', 'İstikrar', 'streak', 2),
('Alışkanlık', '7 günlük giriş serisi yakala.', 'İstikrar', 'streak', 7),
('Sadık Okur', '30 gün boyunca her gün en az 1 bölüm oku.', 'İstikrar', 'streak', 30),
('Sarsılmaz', '100 günlük giriş serisi! Sen bir makinesin amk.', 'İstikrar', 'streak', 100),
('Pazartesi Sendromu Yok', 'Pazartesi sabahı 08:00''de bölüm oku.', 'İstikrar', 'special_time', 1),
('Hafta Sonu Savaşçısı', 'Cumartesi ve Pazar toplam 50 bölüm oku.', 'İstikrar', 'weekend_chapters', 50),
('Tatil Modu', 'Resmi tatillerde 100 sayfa oku.', 'İstikrar', 'holiday_read', 100),
('Ay Dönümü', 'Hesabın 1 aylık oldu!', 'İstikrar', 'account_age', 30),
('Yılın Okuru', 'Hesabın 1 yıllık oldu amk!', 'İstikrar', 'account_age', 365),
('Sabah Şerifleri', 'Üst üste 5 gün sabah 06:00 - 09:00 arası oku.', 'İstikrar', 'morning_streak', 5),
('4:30 Disiplini', 'Tam olarak 04:30''da bir bölüm bitir (Mürsel amcaya selam!).', 'İstikrar', 'precise_time', 430),
('Öğle Arası', 'Öğlen 12:00 - 13:00 arası 10 bölüm oku.', 'İstikrar', 'noon_read', 10),
('İstikrar Abidesi', '6 ay boyunca haftalık en az 10 bölüm oku.', 'İstikrar', 'long_term_streak', 180),
('Yorulmak Bilmez', 'Tek bir günde 200 bölüm bitir.', 'İstikrar', 'daily_max', 200),
('Mühürlü Günler', 'Toplam 365 farklı günde siteyi ziyaret et.', 'İstikrar', 'total_days', 365);

-- CATEGORY 3: TÜR UZMANLIĞI (46-65)
INSERT INTO achievements (name, description, category, requirement_type, requirement_value) VALUES
('Shonen Kralı', '25 tane Shonen serisi oku.', 'Tür', 'genre_count', 25),
('Seinen Ustası', '15 tane Seinen serisi bitir.', 'Tür', 'genre_count', 15),
('Isekai Yolcusu', '10 farklı Isekai dünyasına git.', 'Tür', 'genre_count', 10),
('Romantik Ruh', '10 tane Romance serisi oku (Kimseye söyleme amk!).', 'Tür', 'genre_count', 10),
('Aksiyon Tutkunu', '50 tane aksiyon odaklı bölüm oku.', 'Tür', 'genre_chapters', 50),
('Korku Ustası', '5 tane Horror serisi bitir.', 'Tür', 'genre_count', 5),
('Sporcu', '3 tane spor mangası oku.', 'Tür', 'genre_count', 3),
('Gizem Çözücü', '5 Gizem (Mystery) serisi bitir.', 'Tür', 'genre_count', 5),
('Macera Perest', '15 Macera (Adventure) serisi oku.', 'Tür', 'genre_count', 15),
('Dram Sever', '10 Dram serisi oku.', 'Tür', 'genre_count', 10),
('Komedi Dehası', '10 Komedi serisi oku.', 'Tür', 'genre_count', 10),
('Fantastik Gezgin', '20 Fantastik seri oku.', 'Tür', 'genre_count', 20),
('Bilim Kurgu', '5 Bilim Kurgu (Sci-Fi) serisi bitir.', 'Tür', 'genre_count', 5),
('Doğaüstü', '10 Doğaüstü (Supernatural) seri oku.', 'Tür', 'genre_count', 10),
('Tarihçi', '5 Tarihi (Historical) seri oku.', 'Tür', 'genre_count', 5),
('Dövüş Sanatçısı', '10 Dövüş Sanatları serisi oku.', 'Tür', 'genre_count', 10),
('Okul Yılları', '5 Okul (School) temalı seri oku.', 'Tür', 'genre_count', 5),
('Psikolojik Savaş', '5 Psikolojik seri bitir.', 'Tür', 'genre_count', 5),
('Dilim Hayat', '5 Slice of Life serisi oku.', 'Tür', 'genre_count', 5),
('Tür Koleksiyoneri', '15 farklı türden seri oku.', 'Tür', 'diverse_genres', 15);

-- CATEGORY 4: SOSYAL VE TOPLULUK (66-80)
INSERT INTO achievements (name, description, category, requirement_type, requirement_value) VALUES
('Siber Mühür', 'Discord hesabını başarıyla bağla.', 'Sosyal', 'discord_link', 1),
('İlk Yorum', 'Bir bölüme ilk yorumunu bırak.', 'Sosyal', 'comments', 1),
('Fikir Önderi', '10 farklı bölüme yorum yap.', 'Sosyal', 'comments', 10),
('Beğeni Yağmuru', '50 bölümü beğen daa.', 'Sosyal', 'likes', 50),
('Eleştirmen', 'Bir seriye detaylı inceleme yaz.', 'Sosyal', 'review', 1),
('Profil Mimarı', 'Profil fotoğrafını ve kapak fotoğrafını değiştir.', 'Sosyal', 'profile_edit', 1),
('Grup Lideri', 'Bir mesajlaşma grubunda 7 kişiye ulaş amk.', 'Sosyal', 'social_group', 7),
('Popüler Okur', 'Profiline 100 kişi baksın.', 'Sosyal', 'profile_views', 100),
('Siber Elçi', 'Sitede 5 arkadaş edin.', 'Sosyal', 'friends', 5),
('Geveze', 'Toplam 100 yorum yap.', 'Sosyal', 'comments', 100),
('Yardımsever', 'Birinin sorusuna cevap ver.', 'Sosyal', 'answer', 1),
('Trend Belirleyici', 'Önerdiğin bir seri 50 beğeni alsın.', 'Sosyal', 'influence', 50),
('Topluluk Yıldızı', 'Yorumların toplam 100 beğeni alsın.', 'Sosyal', 'comment_likes', 100),
('Siber Sosyete', '10 farklı grupta aktif ol.', 'Sosyal', 'social_group', 10),
('Mühürlü Ruh', 'Discord rütbeni siteye yansıt.', 'Sosyal', 'discord_sync', 1);

-- CATEGORY 5: RÜTBE VE SEVİYE (81-95)
INSERT INTO achievements (name, description, category, requirement_type, requirement_value) VALUES
('Yükseliş Başladı', 'Seviye 10''a ulaş.', 'Rütbe', 'level', 10),
('Çaylaklıktan Çıkış', 'Seviye 25''a ulaş.', 'Rütbe', 'level', 25),
('Üstün Avcı', 'Seviye 50''ye ulaş amk.', 'Rütbe', 'level', 50),
('Lonca Üyesi', 'Discord''da Lonca rütbesini al.', 'Rütbe', 'discord_rank', 1),
('Manga Hükümdarı', 'Seviye 100''ye ulaş ve tahta otur!', 'Rütbe', 'level', 100),
('Teğmenin Emri', 'İlk rütbe atlamanı gerçekleştir.', 'Rütbe', 'rank_up', 1),
('Apolet Sahibi', '3 farklı Discord rütbesi kazan.', 'Rütbe', 'discord_rank_count', 3),
('Kozmik Güç', 'Seviye 75''e ulaş.', 'Rütbe', 'level', 75),
('Zirve Yolcusu', 'Sıralamada ilk 100''e gir.', 'Rütbe', 'leaderboard', 100),
('Elit Tabaka', 'Elite üyeliğe yüksel.', 'Rütbe', 'is_elite', 1),
('Siber Şövalye', 'Günde 1000 XP kazan.', 'Rütbe', 'daily_xp', 1000),
('XP Madencisi', 'Toplam 50.000 XP biriktir.', 'Rütbe', 'total_xp', 50000),
('Efsanevi Rütbe', 'Ulusal Seviye Avcı rütbesine ulaş.', 'Rütbe', 'rank_name', 1),
('Hükümdar Varisi', 'Seviye 99''a ulaş.', 'Rütbe', 'level', 99),
('Sarsılmaz Otorite', '3 ay boyunca rütbeni koru.', 'Rütbe', 'rank_hold', 90);

-- CATEGORY 6: GİZLİ VE EFSANEVİ (96-100)
INSERT INTO achievements (name, description, category, requirement_type, requirement_value, is_secret) VALUES
('Hata Avcısı', 'Sitede bir bug bul ve adminlere bildir.', 'Efsanevi', 'special', 1, true),
('Güneş Doğarken', 'Kesintisiz 6 saat manga oku daa.', 'Efsanevi', 'session_time', 360, true),
('Solo Leveling Ustası', 'Tüm Solo Leveling bölümlerini tek günde bitir.', 'Efsanevi', 'special', 1, true),
('AniPeak CEO Yardımcısı', 'Tüm başarımların %50''sini aç.', 'Efsanevi', 'completion_rate', 50, true),
('KOZMİK TANRI', '100 başarımı da tamamla ve imzanı mühürle amk!', 'Efsanevi', 'completion_rate', 100, true);
