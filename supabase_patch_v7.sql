-- ==============================================================================
-- MAHORAPEAK SUPABASE MİZAÇ TAMİRİ V7 (MESAJ GÖRÜNÜRLÜĞÜ FİX)
-- ==============================================================================

-- 1. MESSAGES RLS POLİTİKALARINI EN BASİT VE GÜVENLİ HALE GETİR
-- Not: EXISTS içindeki 'id' çakışması veya performans sorunu mesajların gelmesini engelliyor olabilir.
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Üyeler mesajları görebilir" ON public.messages;
CREATE POLICY "Üyeler mesajları görebilir" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE public.conversations.id = public.messages.conversation_id 
            AND (public.conversations.user1_id = auth.uid() OR public.conversations.user2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Üyeler mesaj gönderebilir" ON public.messages;
CREATE POLICY "Üyeler mesaj gönderebilir" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE public.conversations.id = conversation_id 
            AND (public.conversations.user1_id = auth.uid() OR public.conversations.user2_id = auth.uid())
        )
    );

-- 2. CONVERSATIONS RLS (Garantiye al)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sohbet üyeleri görebilir" ON public.conversations;
CREATE POLICY "Sohbet üyeleri görebilir" ON public.conversations
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 3. REALTIME KONTROLÜ
-- Realtime'ın çalışması için publication'da tabloların olduğundan emin olalım.
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.conversations, public.messages;

-- ==============================================================================
-- SQL V7 TAMAMLANDI. MESAJLAR ARTIK CHAT'E AKACAK DAA!
-- ==============================================================================
