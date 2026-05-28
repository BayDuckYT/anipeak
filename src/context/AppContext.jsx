/**
 * AppContext — MahoraPeak Production Data Store
 * All data lives in Supabase. Zero localStorage.
 * Real-time channels keep UI in sync globally.
 */
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading,         setLoading]         = useState(true);
  const [series,          setSeries]          = useState(() => {
    try { 
      const cached = localStorage.getItem('mahorapeak_series_cache'); 
      const parsed = cached ? JSON.parse(cached) : null;
      if (Array.isArray(parsed) && parsed.length > 0 && !parsed[0].slug) {
         // Cache is from old version without slugs, invalidate it
         localStorage.removeItem('mahorapeak_series_cache');
         return [];
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [chapters,        setChapters]        = useState(() => {
    try { 
      const cached = localStorage.getItem('mahorapeak_chapters_cache'); 
      const parsed = cached ? JSON.parse(cached) : null;
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch { return {}; }
  });
  const [announcements,   setAnnouncements]   = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    try { return localStorage.getItem('mahorapeak_maintenance_mode') === 'true'; } catch { return false; }
  });
  const [plans,           setPlans]           = useState([]);

  const loadSeries = useCallback(async () => {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .order('is_trending', { ascending: false })
      .order('reads_num',   { ascending: false });
    if (error) throw error;
    if (data) {
      // Deduplicate series by title (case-insensitive) to prevent scraper dupes
      const uniqueData = Array.from(new Map(data.map(item => [item.title?.toLowerCase().trim(), item])).values());
      setSeries(uniqueData);
      localStorage.setItem('mahorapeak_series_cache', JSON.stringify(uniqueData));
    }
  }, []);

  const loadChapters = useCallback(async () => {
    try {
      let allData = [];
      let from = 0;
      const step = 1000;
      let keepFetching = true;

      while (keepFetching) {
        const { data, error } = await supabase
          .from('chapters')
          .select('id, series_id, number, title, is_premium, created_at') // Optimize by selecting only needed fields for the list
          .order('number', { ascending: false })
          .range(from, from + step - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < step) keepFetching = false;
          else from += step;
        } else {
          keepFetching = false;
        }
      }

      if (allData.length > 0) {
        const grouped = allData.reduce((acc, ch) => {
          const key = String(ch.series_id);
          if (!acc[key]) acc[key] = [];
          acc[key].push(ch);
          return acc;
        }, {});
        setChapters(grouped);
        localStorage.setItem('mahorapeak_chapters_cache', JSON.stringify(grouped));
      }
    } catch (err) {
      console.warn('[AppCtx] Bölüm yükleme başarısız, önbelleğe dönülüyor:', err.message);
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
    if (data?.value) {
      const isEnabled = !!data.value.enabled;
      setMaintenanceMode(isEnabled);
      localStorage.setItem('mahorapeak_maintenance_mode', String(isEnabled));
    }
  }, []);

  const loadPlans = useCallback(async () => {
    const { data } = await supabase
      .from('pricing_plans')
      .select('*')
      .order('price', { ascending: true });
    if (data) setPlans(data);
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
          } else {
             console.warn("[AppCtx] Fetch limit aşıldı, önbellek devrede:", err.message);
             // Return peacefully so boot continues and cache is used
          }
        }
      }
    };

    const boot = async () => {
      try {
        setLoading(true);
        // Sadece çekirdek verileri (Seriler, Duyurular, Bakım Modu) blocking olarak çekiyoruz.
        // Bölümler (Chapters) arka planda yüklenecek, bu sayede uygulama anında açılacak.
        await Promise.all([
          fetchWithRetry(loadSeries),
          fetchWithRetry(loadAnnouncements),
          fetchWithRetry(loadMaintenance),
          fetchWithRetry(loadPlans),
        ]);
        
        // Arka plan yüklemeleri (Non-blocking)
        loadChapters().catch(err => console.warn('[AppCtx] Bölümler arka planda yüklenirken hata:', err.message));
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
      .channel('mahorapeak-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'series' },
        () => loadSeries())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chapters' },
        () => loadChapters())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' },
        () => loadAnnouncements())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' },
        () => loadProfiles())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pricing_plans' },
        () => loadPlans())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_config' },
        (payload) => {
          if (payload.new?.key === 'maintenance') {
            const isEnabled = !!payload.new.value?.enabled;
            setMaintenanceMode(isEnabled);
            localStorage.setItem('mahorapeak_maintenance_mode', String(isEnabled));
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
    else {
      setMaintenanceMode(enabled);
      localStorage.setItem('mahorapeak_maintenance_mode', String(enabled));
    }
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
      const target = series?.find(s => String(s.id) === String(seriesId));
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

    // Generate a basic slug
    let baseSlug = payload.title ? payload.title.toLowerCase().replace(/['ğĞ'üÜ'şŞ'ıİ'öÖ'çÇ]/g, m => ({'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ş':'s','Ş':'s','ü':'u','Ü':'u','ı':'i','İ':'i','ö':'o','Ö':'o'}[m])).replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') : 'manga';

    const { data, error } = await supabase
      .from('series')
      .insert([{ ...payload, slug: baseSlug + '-' + Math.floor(Math.random() * 10000), genre: genreArray, reads_num: 0, rating: 0.0 }])
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
    const { error } = await supabase.from('series').update(updates).eq('id', id);
    if (error) {
      console.error('[AppContext] Seri Güncellenemedi:', error);
      throw error;
    }
  }, []);

  const deleteSeries = useCallback(async (id) => {
    const { error } = await supabase.from('series').delete().eq('id', id);
    if (error) {
      console.error('[AppContext] Seri Silinemedi:', error);
      throw error;
    }
  }, []);

  const deleteAllTrash = useCallback(async () => {
    const { error } = await supabase.from('series').delete().eq('is_deleted', true);
    if (error) {
      console.error('[AppContext] Çöp Kutusu Temizlenemedi:', error);
      throw error;
    }
  }, []);

  const restoreAllTrash = useCallback(async () => {
    const { error } = await supabase.from('series').update({ is_deleted: false }).eq('is_deleted', true);
    if (error) {
      console.error('[AppContext] Çöp Kutusu Geri Yüklenemedi:', error);
      throw error;
    }
  }, []);

  const toggleTrend = useCallback(async (id) => {
    const target = series?.find(s => s.id === id);
    if (target) await supabase.from('series').update({ is_trending: !target.is_trending }).eq('id', id);
  }, [series]);

  const toggleStatus = useCallback(async (id) => {
    const target = series?.find(s => s.id === id);
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

    // 1. Yerel (Local) ortalamayı hesapla
    const { data: allRatings } = await supabase
      .from('ratings').select('value').eq('series_id', seriesId);

    if (allRatings?.length) {
      const localAvg = allRatings.reduce((a, r) => a + r.value, 0) / allRatings.length;
      
      // 2. Mevcut series verisini çek (global_rating için)
      const { data: seriesData } = await supabase
        .from('series').select('global_rating').eq('id', seriesId).single();
        
      const globalRating = seriesData?.global_rating || 8.0; // Varsayılan değer

      // 3. Hibrit formülü uygula: (Global * %40) + (Local * %60)
      const finalRating = (globalRating * 0.4) + (localAvg * 0.6);

      // 4. Veritabanını güncelle
      await supabase.from('series').update({ 
        local_rating: parseFloat(localAvg.toFixed(1)),
        rating: parseFloat(finalRating.toFixed(1)) 
      }).eq('id', seriesId);
    }
  }, []);

  // ── Comments ─────────────────────────────────────────────────────────
  const addComment = useCallback(async (seriesId, { userId, username, avatar_url, text, chapterNum, isSpoiler }) => {
    const sId = parseInt(seriesId);
    const cNum = (chapterNum !== undefined && chapterNum !== null) ? parseFloat(chapterNum) : null;
    
    const { error } = await supabase.from('comments').insert([{
      series_id:   sId,
      user_id:     userId,
      username,
      avatar_url,
      text,
      chapter_num: cNum,
      is_spoiler:  isSpoiler || false
    }]);
    return { error };
  }, []);

  const deleteComment = useCallback(async (id) => {
    await supabase.from('comments').delete().eq('id', id);
  }, []);

  // ── User Management (Admin) ──────────────────────────────────────────
  const updateProfile = useCallback(async (userId, updates) => {
    try {
      // 1. Optimistik Güncelleme: Arayüzü anında değiştir
      setRegisteredUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));

      // 2. Veritabanını Güncelle
      const { data, error, status } = await supabase.from('profiles').update(updates).eq('id', userId).select();
      
      console.log(`[AppCtx] DB Update Status: ${status}`, updates);

      if (error) {
        console.error('[AppCtx] Profil güncellenirken hata:', error.message);
        loadProfiles(); // Eski haline dön
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('[AppCtx] Uyarı: Hiçbir satır güncellenmedi! RLS politikalarını kontrol edin.');
        loadProfiles();
        throw new Error('Veritabanı bu değişikliğe izin vermedi (RLS Engeli olabilir).');
      }
    } catch (err) {
      console.error('[AppCtx] UpdateProfile Kritik Hata:', err);
      throw err;
    }
  }, [loadProfiles]);

  const deleteProfile = useCallback(async (userId) => {
    await supabase.from('profiles').delete().eq('id', userId);
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────
  const sortedSeries = useMemo(() =>
    series.filter(s => !s.is_deleted),
  [series]);

  const value = {
    loading,
    supabase,
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
    // Plans
    plans,
    loadPlans
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
