-- ==============================================================================
-- MAHORAPEAK SUPABASE YAMA V5 (İLİŞKİ TAMİRİ & JOIN FIX)
-- ==============================================================================

-- 1. FOREIGN KEY BAĞLANTILARINI PROFİLLER TABLOSUNA YÖNLENDİR
-- Not: PostgREST join işlemleri için sütunların profiles tablosuna bağlı olması gerekir.
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_user1_id_fkey;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_user2_id_fkey;

ALTER TABLE public.conversations 
    ADD CONSTRAINT conversations_user1_id_fkey 
    FOREIGN KEY (user1_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.conversations 
    ADD CONSTRAINT conversations_user2_id_fkey 
    FOREIGN KEY (user2_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. RLS POLİTİKALARINI KONTROL ET (V4 ile aynı ama garantiye alalım)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sohbet üyeleri görebilir" ON public.conversations;
CREATE POLICY "Sohbet üyeleri görebilir" ON public.conversations
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Herkes sohbet başlatabilir" ON public.conversations;
CREATE POLICY "Herkes sohbet başlatabilir" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 3. REALTIME YAYININI TAZELA
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.conversations, public.messages;
COMMIT;

-- ==============================================================================
-- SQL V5 TAMAMLANDI. İLİŞKİLER ONARILDI DAA!
-- ==============================================================================
