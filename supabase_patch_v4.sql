    -- ==============================================================================
    -- ANIPEAK SUPABASE YAMA V4 (INSTAGRAM & WHATSAPP MANTIĞI)
    -- ==============================================================================

    -- 1. ESKİ TABLOLARI SIFIRLA (DİKKAT: Veriler silinebilir)
    DROP TABLE IF EXISTS public.messages CASCADE;
    DROP TABLE IF EXISTS public.conversation_participants CASCADE;
    DROP TABLE IF EXISTS public.conversations CASCADE;

    -- 2. YENİ CONVERSATIONS TABLOSU (Instagram Mantığı: 1v1 Odaklı)
    CREATE TABLE public.conversations (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        last_message TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(user1_id, user2_id) -- İki kişi arasında sadece bir oda olabilir
    );

    -- 3. MESSAGES TABLOSU
    CREATE TABLE public.messages (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        content TEXT NOT NULL, -- AES Şifreli gelecek
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- 4. GÜVENLİK (RLS) POLİTİKALARI
    ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

    -- Conversations RLS
    CREATE POLICY "Sohbet üyeleri görebilir" ON public.conversations
        FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

    CREATE POLICY "Herkes sohbet başlatabilir" ON public.conversations
        FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

    CREATE POLICY "Üyeler güncelleyebilir" ON public.conversations
        FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

    -- Messages RLS
    CREATE POLICY "Üyeler mesajları görebilir" ON public.messages
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.conversations 
                WHERE id = messages.conversation_id 
                AND (user1_id = auth.uid() OR user2_id = auth.uid())
            )
        );

    CREATE POLICY "Üyeler mesaj gönderebilir" ON public.messages
        FOR INSERT WITH CHECK (
            auth.uid() = sender_id AND
            EXISTS (
                SELECT 1 FROM public.conversations 
                WHERE id = messages.conversation_id 
                AND (user1_id = auth.uid() OR user2_id = auth.uid())
            )
        );

    -- 5. REALTIME AKTİFLEŞTİRME
    -- Not: Eğer hata verirse manual olarak dashboard'dan 'Realtime' sekmesinden tabloları seçebilirsin.
    BEGIN;
    DROP PUBLICATION IF EXISTS supabase_realtime;
    CREATE PUBLICATION supabase_realtime FOR TABLE public.conversations, public.messages;
    COMMIT;

    -- ==============================================================================
    -- SQL V4 TAMAMLANDI. HAYIRLI OLSUN DAA!
    -- ==============================================================================
