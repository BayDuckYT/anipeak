/**
 * AppContext — AniPeak Global Data Store
 * Manages: series chapters, announcements, registered users, trending state
 * Persistence: Supabase (Shared Database)
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState({});
  const [series, setSeries] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);

  // ── Initial Data Load
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch Series
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('*')
        .order('is_trending', { ascending: false });
      
      if (!seriesError) setSeries(seriesData || []);

      // 2. Fetch Users
      const { data: usersData, error: usersError } = await supabase
        .from('registered_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!usersError) setRegisteredUsers(usersData || []);

      // 3. Fetch Announcements
      const { data: annData, error: annError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!annError) setAnnouncements(annData || []);

      // 4. Fetch All Chapters (simplified for now, ideally fetch per series)
      const { data: chData, error: chError } = await supabase
        .from('chapters')
        .select('*')
        .order('number', { ascending: false });

      if (!chError && chData) {
        const grouped = chData.reduce((acc, ch) => {
          if (!acc[ch.series_id]) acc[ch.series_id] = [];
          acc[ch.series_id].push(ch);
          return acc;
        }, {});
        setChapters(grouped);
      }

    } catch (err) {
      console.error('Veri çekme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // ── Realtime Subscriptions (Sync changes across all users)
    const seriesSub = supabase
      .channel('public:series')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'series' }, () => fetchData())
      .subscribe();

    const chapterSub = supabase
      .channel('public:chapters')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chapters' }, () => fetchData())
      .subscribe();

    const userSub = supabase
      .channel('public:registered_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registered_users' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(seriesSub);
      supabase.removeChannel(chapterSub);
      supabase.removeChannel(userSub);
    };
  }, [fetchData]);

  // ─────────────────────────────────────────────
  //  Chapter CRUD
  // ─────────────────────────────────────────────

  const getChapters = useCallback(
    (seriesId) => chapters[seriesId] || [],
    [chapters]
  );

  const addChapter = useCallback(
    async (seriesId, { number, title, pages, isPremium = false }) => {
      const { data, error } = await supabase
        .from('chapters')
        .insert([{
          series_id: seriesId,
          number,
          title: title || null,
          pages: pages || [],
          is_premium: isPremium,
        }])
        .select()
        .single();

      if (error) {
        console.error('Bölüm ekleme hatası:', error);
        return null;
      }

      // Auto-announcement logic
      const targetSeries = series.find((s) => s.id === parseInt(seriesId));
      await supabase.from('announcements').insert([{
        type: 'chapter',
        text: `🔥 ${targetSeries?.title || 'Seri'}'nin ${number}. Bölümü Yayında!`,
        series_id: seriesId,
        chapter_num: number,
        ts: Date.now()
      }]);

      return data;
    },
    [series]
  );

  const updateChapter = useCallback(async (seriesId, chapterId, updates) => {
    const { error } = await supabase
      .from('chapters')
      .update(updates)
      .eq('id', chapterId);
    
    if (error) console.error('Bölüm güncelleme hatası:', error);
  }, []);

  const deleteChapter = useCallback(async (seriesId, chapterId) => {
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId);
    
    if (error) console.error('Bölüm silme hatası:', error);
  }, []);

  // ─────────────────────────────────────────────
  //  Series CRUD
  // ─────────────────────────────────────────────

  const addSeries = useCallback(async (seriesData) => {
    const { data, error } = await supabase
      .from('series')
      .insert([{
        ...seriesData,
        genre: Array.isArray(seriesData.genre) ? seriesData.genre : seriesData.genre ? [seriesData.genre] : [],
        reads_num: 0,
        rating: 0.0,
      }])
      .select()
      .single();

    if (error) {
      console.error('Seri ekleme hatası:', error);
      return null;
    }

    // Auto-announcement
    await supabase.from('announcements').insert([{
      type: 'series',
      text: `✨ Yeni Seri: "${seriesData.title}" Evrene Düştü!`,
      series_id: data.id,
      ts: Date.now()
    }]);

    return data;
  }, []);

  const deleteSeries = useCallback(async (seriesId) => {
    const { error } = await supabase
      .from('series')
      .delete()
      .eq('id', seriesId);
    
    if (error) console.error('Seri silme hatası:', error);
  }, []);

  const updateSeries = useCallback(async (seriesId, updates) => {
    const { error } = await supabase
      .from('series')
      .update(updates)
      .eq('id', seriesId);
    
    if (error) console.error('Seri güncelleme hatası:', error);
  }, []);

  const toggleTrend = useCallback(async (seriesId) => {
    const target = series.find(s => s.id === seriesId);
    if (!target) return;
    await updateSeries(seriesId, { is_trending: !target.is_trending });
  }, [series, updateSeries]);

  const toggleStatus = useCallback(async (seriesId) => {
    const target = series.find(s => s.id === seriesId);
    if (!target) return;
    await updateSeries(seriesId, { 
      status: target.status === 'Devam Ediyor' ? 'Tamamlandı' : 'Devam Ediyor' 
    });
  }, [series, updateSeries]);

  const updateSeriesReads = useCallback(async (seriesId, readsNum) => {
    await updateSeries(seriesId, { reads_num: readsNum });
  }, [updateSeries]);

  const sortedSeries = [...series].sort((a, b) => {
    if (a.is_trending !== b.is_trending) return a.is_trending ? -1 : 1;
    if (a.has_new_chapter !== b.has_new_chapter) return a.has_new_chapter ? -1 : 1;
    return (b.reads_num || 0) - (a.reads_num || 0);
  });

  // ─────────────────────────────────────────────
  //  User Management (Admin)
  // ─────────────────────────────────────────────

  const registerUser = useCallback(
    async ({ username, email, provider = 'email' }) => {
      // Don't duplicate in local state check first
      if (registeredUsers.some((u) => u.email === email)) return;

      const { data, error } = await supabase
        .from('registered_users')
        .insert([{
          username,
          email,
          role: 'Kullanıcı',
          status: 'Aktif',
          premium: false,
          total_read: 0, // Her zaman 0 ile başlar
          provider,
        }])
        .select()
        .single();

      if (error) console.error('Kullanıcı kayıt hatası:', error);
      return data;
    },
    [registeredUsers]
  );

  const updateRegisteredUser = useCallback(async (userId, updates) => {
    const { error } = await supabase
      .from('registered_users')
      .update(updates)
      .eq('id', userId);
    
    if (error) console.error('Kullanıcı güncelleme hatası:', error);
  }, []);

  const deleteRegisteredUser = useCallback(async (userId) => {
    const { error } = await supabase
      .from('registered_users')
      .delete()
      .eq('id', userId);
    
    if (error) console.error('Kullanıcı silme hatası:', error);
  }, []);

  // ─────────────────────────────────────────────
  //  Announcements
  // ─────────────────────────────────────────────

  const addAnnouncement = useCallback(
    async (text, type = 'system') => {
      const { error } = await supabase
        .from('announcements')
        .insert([{
          type,
          text,
          ts: Date.now()
        }]);
      
      if (error) console.error('Duyuru ekleme hatası:', error);
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        loading,
        // Chapters
        chapters,
        getChapters,
        addChapter,
        updateChapter,
        deleteChapter,
        // Series
        series,
        sortedSeries,
        setSeries,
        addSeries,
        updateSeries,
        deleteSeries,
        toggleTrend,
        toggleStatus,
        updateSeriesReads,
        // Users
        registeredUsers,
        registerUser,
        updateRegisteredUser,
        deleteRegisteredUser,
        // Announcements
        announcements,
        addAnnouncement,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx)
    throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
