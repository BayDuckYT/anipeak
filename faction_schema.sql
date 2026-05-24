-- Aethe Hane (Faction) Sistemi İçin Gerekli Tablolar ve Güncellemeler

-- 1. Profillere hane sütununu ekle (Eğer yoksa)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS house_id VARCHAR(50);

-- 2. Haneler Tablosu (house_id, isim, puanlar vb.)
CREATE TABLE IF NOT EXISTS public.houses (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Varsayılan 4 Haneyi Oluştur
INSERT INTO public.houses (id, name, color, description)
VALUES 
    ('dragon', 'Kızıl Ejder', 'red', 'Güç, cesaret ve savaşçı ruh. (Saldırgan ve lider ruhlular)'),
    ('fox', 'Gümüş Kitsune', 'purple', 'Kurnazlık, zeka ve gizem. (Stratejik ve zeki olanlar)'),
    ('wolf', 'Buz Kurt', 'blue', 'Sadakat, takım çalışması ve onur. (Birlikte hareket eden dayanışmacılar)'),
    ('phoenix', 'Altın Anka', 'orange', 'Bilgelik, azim ve küllerinden doğuş. (Asla pes etmeyen azimliler)')
ON CONFLICT (id) DO NOTHING;

-- 3. Hane Özel Chat Tablosu
CREATE TABLE IF NOT EXISTS public.house_chats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    house_id VARCHAR(50) REFERENCES public.houses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS (Row Level Security) Ayarları
-- Chatleri sadece yetkili haneler okuyabilir
ALTER TABLE public.house_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Haneler kendi mesajlarını görebilir" ON public.house_chats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.house_id = house_chats.house_id
        )
    );

CREATE POLICY "Haneler kendi mesajlarını atabilir" ON public.house_chats
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.house_id = house_chats.house_id
        )
    );

-- Houses tablosunu herkes okuyabilir
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes haneleri görebilir" ON public.houses FOR SELECT USING (true);
