-- Profile Visits (Elite Footprints) Table
CREATE TABLE IF NOT EXISTS public.profile_visits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    visitor_plan VARCHAR(50), -- 'aethe', 'ruler', vb. İzleri çizerken kolaylık olsun diye.
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(profile_id, visitor_id, visited_at) -- Aynı saniyede spamı önler
);

-- RLS (Row Level Security) Policies
ALTER TABLE public.profile_visits ENABLE ROW LEVEL SECURITY;

-- Herkes ziyaretleri okuyabilir
CREATE POLICY "Anyone can view profile visits"
    ON public.profile_visits FOR SELECT
    USING (true);

-- Oturum açmış kullanıcılar ziyaret kaydı ekleyebilir
CREATE POLICY "Authenticated users can insert visits"
    ON public.profile_visits FOR INSERT
    WITH CHECK (auth.uid() = visitor_id);

-- İsteğe bağlı: Kullanıcılar günde sadece 1 kez aynı profile iz bırakabilsin
-- Bunu uygulama tarafında mantıksal olarak çözeceğiz (spam engelleme).

-- XP Transactions Table (XP geçmişini ve bildirimleri takip etmek için, eğer yoksa)
-- Gelişmiş XP mantığı için her XP kazanımını bir sebeple kaydetmek iyi olabilir.
CREATE TABLE IF NOT EXISTS public.xp_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL, -- 'read_chapter', 'comment', 'daily_login'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp logs"
    ON public.xp_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert xp logs"
    ON public.xp_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);
