/**
 * AppContext — AniPeak Production Data Store
 * All data lives in Supabase. Zero localStorage.
 * Real-time channels keep UI in sync globally.
 */
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading,         setLoading]         = useState(true);
  const [series,          setSeries]          = useState([]);
  const [chapters,        setChapters]        = useState({});   // { [series_id]: chapter[] }
  const [announcements,   setAnnouncements]   = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const loadSeries = useCallback(async () => {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .order('is_trending', { ascending: false })
      .order('reads_num',   { ascending: false });
    if (error) throw error;
    if (data) setSeries(data);
  }, []);

  const loadChapters = useCallback(async () => {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .order('number', { ascending: false });
    if (error) throw error;
    if (data) {
      const grouped = data.reduce((acc, ch) => {
        const key = String(ch.series_id);
        if (!acc[key]) acc[key] = [];
        acc[key].push(ch);
        return acc;
      }, {});
      setChapters(grouped);
    }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    if (data) setAnnouncements(data);
  }, []);

  const loadProfiles = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRegisteredUsers(data);
  }, []);

  const loadMaintenance = useCallback(async () => {
    const { data } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'maintenance')
      .single();
    if (data?.value) setMaintenanceMode(!!data.value.enabled);
  }, []);

  // ── Bootstrap all data (sequential to avoid exhausting Supabase free tier connection pool) ────
  useEffect(() => {
    const fetchWithRetry = async (fn, retries = 2, delayMs = 800) => {
      for (let i = 0; i <= retries; i++) {
        try {
          await fn();
          return;
        } catch (err) {
          if (i < retries) {
            await new Promise(r => setTimeout(r, delayMs * (i + 1)));
          }
        }
      }
    };

    const boot = async () => {
      try {
        setLoading(true);
        // Sequential to avoid hitting Supabase free tier connection pool limit
        await fetchWithRetry(loadSeries);
        await fetchWithRetry(loadChapters);
        await fetchWithRetry(loadAnnouncements);
        await fetchWithRetry(loadMaintenance);
        // Profiles are admin-only, load last and non-blocking
        loadProfiles().catch(err => console.warn('[AppCtx] Profiller yüklenemedi:', err.message));
      } catch (err) {
        console.error("[AppContext] Bootstrap Hatası:", err);
      } finally {
        setLoading(false);
      }
    };

    boot();

    // ── Real-time channels ─────────────────────────────────────────────
    const channel = supabase
      .channel('anipeak-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'series' },
        () => loadSeries())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chapters' },
        () => loadChapters())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' },
        () => loadAnnouncements())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' },
        () => loadProfiles())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_config' },
        (payload) => {
          if (payload.new?.key === 'maintenance') {
            setMaintenanceMode(!!payload.new.value?.enabled);
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadSeries, loadChapters, loadAnnouncements, loadProfiles, loadMaintenance]);

  // ── Maintenance ──────────────────────────────────────────────────────
  const toggleMaintenance = useCallback(async (enabled) => {
    const { error } = await supabase
      .from('site_config')
      .upsert({ key: 'maintenance', value: { enabled }, updated_at: new Date().toISOString() },
               { onConflict: 'key' });
    if (error) console.error('[AppCtx] Bakım modu güncellenemedi:', error.message);
    else setMaintenanceMode(enabled);
  }, []);

  // ── Chapters ─────────────────────────────────────────────────────────
  const getChapters = useCallback((seriesId) =>
    chapters[String(seriesId)] || [],
  [chapters]);

  const addChapter = useCallback(async (seriesId, { number, title, pages = [], isPremium = false }) => {
    const { data, error } = await supabase
      .from('chapters')
      .insert([{ series_id: seriesId, number, title, pages, is_premium: isPremium }])
      .select()
      .single();

    if (error) {
      console.error('[AppContext] Bölüm Eklenemedi:', error);
      throw error;
    }

    if (data) {
      const target = series.find(s => String(s.id) === String(seriesId));
      await supabase.from('announcements').insert([{
        type: 'chapter',
        text: `🔥 ${target?.title || 'Seri'}'nin ${number}. Bölümü Yayında!`,
        series_id: seriesId,
      }]);
    }
    return data;
  }, [series]);

  const updateChapter = useCallback(async (id, updates) => {
    await supabase.from('chapters').update(updates).eq('id', id);
  }, []);

  const deleteChapter = useCallback(async (id) => {
    await supabase.from('chapters').delete().eq('id', id);
  }, []);

  // ── Series ────────────────────────────────────────────────────────────
  const addSeries = useCallback(async (payload) => {
    // Schema defines genre as TEXT[]. Ensure we send an array.
    const genreArray = Array.isArray(payload.genre)
      ? payload.genre
      : (payload.genre ? [payload.genre] : []);

    const { data, error } = await supabase
      .from('series')
      .insert([{ ...payload, genre: genreArray, reads_num: 0, rating: 0.0 }])
      .select()
      .single();

    if (error) {
      console.error('[AppContext] Seri Eklenemedi:', error);
      throw error;
    }

    if (data) {
      await supabase.from('announcements').insert([{
        type: 'series',
        text: `✨ Yeni Seri: "${payload.title}" Yayına Girdi!`,
        series_id: data.id,
      }]);
    }
    return data;
  }, []);

  const updateSeries = useCallback(async (id, updates) => {
    await supabase.from('series').update(updates).eq('id', id);
  }, []);

  const deleteSeries = useCallback(async (id) => {
    await supabase.from('series').delete().eq('id', id);
  }, []);

  const toggleTrend = useCallback(async (id) => {
    const target = series.find(s => s.id === id);
    if (target) await supabase.from('series').update({ is_trending: !target.is_trending }).eq('id', id);
  }, [series]);

  const toggleStatus = useCallback(async (id) => {
    const target = series.find(s => s.id === id);
    if (target) {
      const next = target.status === 'Devam Ediyor' ? 'Tamamlandı' : 'Devam Ediyor';
      await supabase.from('series').update({ status: next }).eq('id', id);
    }
  }, [series]);

  // ── Announcements ────────────────────────────────────────────────────
  const addAnnouncement = useCallback(async (text, type = 'system') => {
    await supabase.from('announcements').insert([{ text, type }]);
  }, []);

  const deleteAnnouncement = useCallback(async (id) => {
    await supabase.from('announcements').delete().eq('id', id);
  }, []);

  // ── Ratings ──────────────────────────────────────────────────────────
  const updateRating = useCallback(async (seriesId, userId, value) => {
    await supabase
      .from('ratings')
      .upsert({ series_id: seriesId, user_id: userId, value },
               { onConflict: 'series_id,user_id' });

    // Recalculate global average
    const { data: allRatings } = await supabase
      .from('ratings').select('value').eq('series_id', seriesId);

    if (allRatings?.length) {
      const avg = allRatings.reduce((a, r) => a + r.value, 0) / allRatings.length;
      await supabase.from('series').update({ rating: parseFloat(avg.toFixed(1)) }).eq('id', seriesId);
    }
  }, []);

  // ── Comments ─────────────────────────────────────────────────────────
  const addComment = useCallback(async (seriesId, { userId, username, text, chapterNum }) => {
    await supabase.from('comments').insert([{
      series_id:   seriesId,
      user_id:     userId,
      username,
      text,
      chapter_num: chapterNum || null,
    }]);
  }, []);

  const deleteComment = useCallback(async (id) => {
    await supabase.from('comments').delete().eq('id', id);
  }, []);

  // ── User Management (Admin) ──────────────────────────────────────────
  const updateProfile = useCallback(async (userId, updates) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) console.error('[AppCtx] Profil güncellenemedi:', error.message);
  }, []);

  const deleteProfile = useCallback(async (userId) => {
    await supabase.from('profiles').delete().eq('id', userId);
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────
  const sortedSeries = useMemo(() =>
    [...series]
      .filter(s => !s.is_deleted)
      .sort((a, b) => {
        if (a.is_trending !== b.is_trending) return a.is_trending ? -1 : 1;
        return (b.reads_num || 0) - (a.reads_num || 0);
      }),
  [series]);

  const value = {
    loading,
    maintenanceMode,
    toggleMaintenance,
    // Series
    series,
    sortedSeries,
    addSeries,
    updateSeries,
    deleteSeries,
    toggleTrend,
    toggleStatus,
    // Chapters
    chapters,
    getChapters,
    addChapter,
    updateChapter,
    deleteChapter,
    // Announcements
    announcements,
    addAnnouncement,
    deleteAnnouncement,
    // Ratings & Comments
    updateRating,
    addComment,
    deleteComment,
    // Users
    registeredUsers,
    updateProfile,
    deleteProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
