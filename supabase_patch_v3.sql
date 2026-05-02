-- ==============================================================================
-- ANIPEAK SUPABASE YAMA V3 (DM & BEĞENİ DÜZELTME)
-- ==============================================================================

-- 1. EKSİK TABLOLARI OLUŞTURMA (LİSTE BEĞENİLERİ)
CREATE TABLE IF NOT EXISTS public.custom_list_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    list_id BIGINT NOT NULL REFERENCES public.custom_lists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(list_id, user_id)
);

-- RLS (Row Level Security) Aktifleştir
ALTER TABLE public.custom_list_likes ENABLE ROW LEVEL SECURITY;

-- Okuma Yetkisi: Herkes (Anonim & Oturum açan)
CREATE POLICY "Herkes list_likes görebilir" ON public.custom_list_likes
    FOR SELECT USING (true);

-- Ekleme/Silme Yetkisi: Sadece kendi beğendiği işlemleri yapabilir
CREATE POLICY "Kullanıcılar beğeni ekleyebilir" ON public.custom_list_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar beğeni silebilir" ON public.custom_list_likes
    FOR DELETE USING (auth.uid() = user_id);


-- 2. DM & SOHBET TABLOLARI (Eğer Eksikse veya RLS Hatalıysa)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT,
    type TEXT NOT NULL CHECK (type IN ('dm', 'group', 'community')),
    last_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. DM TABLOLARI İÇİN GÜVENLİK (RLS) POLİTİKALARI
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS: Herkes oluşturabilir. Sadece üyeler görebilir. Topluluk kanalları herkese açıktır.
DROP POLICY IF EXISTS "Herkes sohbet oluşturabilir" ON public.conversations;
CREATE POLICY "Herkes sohbet oluşturabilir" ON public.conversations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Kullanıcılar kendi sohbetlerini görebilir" ON public.conversations;
CREATE POLICY "Kullanıcılar kendi sohbetlerini görebilir" ON public.conversations
    FOR SELECT USING (
        type = 'community' OR 
        id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Sohbet üyeleri update edebilir" ON public.conversations;
CREATE POLICY "Sohbet üyeleri update edebilir" ON public.conversations
    FOR UPDATE USING (
        type = 'community' OR 
        id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
    );

-- Participants RLS: Ekleyen kendi ekleyebilir veya başkasını gruba ekleyebilir (şimdilik esnek)
DROP POLICY IF EXISTS "Herkes katılımcı ekleyebilir" ON public.conversation_participants;
CREATE POLICY "Herkes katılımcı ekleyebilir" ON public.conversation_participants
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Katılımcılar görülebilir" ON public.conversation_participants;
CREATE POLICY "Katılımcılar görülebilir" ON public.conversation_participants
    FOR SELECT USING (true);

-- Messages RLS: Üye olduğu kanala mesaj atabilir.
DROP POLICY IF EXISTS "Kullanıcılar sadece yetkili oldukları sohbetlere mesaj atabilir" ON public.messages;
CREATE POLICY "Kullanıcılar sadece yetkili oldukları sohbetlere mesaj atabilir" ON public.messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE type = 'community'
        ) OR 
        conversation_id IN (
            SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Sohbet mesajlarını görebilir" ON public.messages;
CREATE POLICY "Sohbet mesajlarını görebilir" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.conversations WHERE type = 'community'
        ) OR 
        conversation_id IN (
            SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()
        )
    );

-- Gerçek Zamanlı Mesajlaşma İçin (Supabase Realtime) Yayın Hakları
-- NOT: Eğer tablolar zaten realtime'a eklendiyse hata vermemesi için kapatıldı.
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- ==============================================================================
-- SQL YAMASI TAMAMLANDI UŞAĞIM!
-- ==============================================================================
