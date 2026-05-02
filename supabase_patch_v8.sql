-- ==============================================================================
-- ANIPEAK SUPABASE OTOMASYON V8 (TRIGGER & AUTO-UPDATE)
-- ==============================================================================

-- 1. CONVERSATIONS TABLOSUNA SON GÖNDEREN EKLE
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_sender_id UUID REFERENCES auth.users(id);

-- 2. MESAJ GELDİĞİNDE SOHBETİ GÜNCELLEYEN FONKSİYON
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET 
        last_message = NEW.content,
        last_sender_id = NEW.sender_id,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRİGGER'I OLUŞTUR
DROP TRIGGER IF EXISTS on_message_inserted ON public.messages;
CREATE TRIGGER on_message_inserted
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message();

-- 4. REALTIME YAYININI TAZELA
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.conversations, public.messages;
COMMIT;

-- ==============================================================================
-- SQL V8 TAMAMLANDI. SİSTEM ARTIK OTOMATİK PİLOTTA DAA!
-- ==============================================================================
