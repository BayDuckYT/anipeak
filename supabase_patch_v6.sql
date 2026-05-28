-- ==============================================================================
-- MAHORAPEAK SUPABASE ULTIMATE FIX V6 (TAM GAZ SİSTEM)
-- ==============================================================================

-- 1. TABLOLARI VE İLİŞKİLERİ GARANTİYE AL
-- conversations
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_user1_id_fkey') THEN
        ALTER TABLE public.conversations ADD CONSTRAINT conversations_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_user2_id_fkey') THEN
        ALTER TABLE public.conversations ADD CONSTRAINT conversations_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- messages
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversation_id_fkey') THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. RLS POLİTİKALARINI SIFIRDAN VE KUSURSUZ KUR
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations
DROP POLICY IF EXISTS "Sohbet üyeleri görebilir" ON public.conversations;
CREATE POLICY "Sohbet üyeleri görebilir" ON public.conversations
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Herkes sohbet başlatabilir" ON public.conversations;
CREATE POLICY "Herkes sohbet başlatabilir" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Üyeler güncelleyebilir" ON public.conversations;
CREATE POLICY "Üyeler güncelleyebilir" ON public.conversations
    FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages
DROP POLICY IF EXISTS "Üyeler mesajları görebilir" ON public.messages;
CREATE POLICY "Üyeler mesajları görebilir" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = conversation_id 
            AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Üyeler mesaj gönderebilir" ON public.messages;
CREATE POLICY "Üyeler mesaj gönderebilir" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = conversation_id 
            AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
        )
    );

-- 3. REALTIME YAYININI TAZELA
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.conversations, public.messages;
COMMIT;

-- 4. PRESENCE İÇİN GEREKLİ OLABİLECEK YETKİLER (Opsiyonel ama garanti)
-- Not: Supabase Presence genellikle auth.uid() üzerinden otomatik çalışır.

-- ==============================================================================
-- SQL V6 TAMAMLANDI. SİSTEM ŞUAN NÜKLEER GÜCÜNDE DAA!
-- ==============================================================================
