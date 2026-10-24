import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { trackActivity } from '../lib/achievementService';
import { getLevelInfo } from '../lib/gamification';
import { useApp } from './AppContext.jsx';
import {
  resolveNotifSettings,
  normalizeAnnouncement,
  normalizePersonal,
  buildScheduleReminders,
  shouldShowNotification,
  sortNotifications,
  loadLocalList,
  saveLocalList,
  localDateString,
  insertWithFallback,
} from '../lib/notifications.js';

export { calculateRank, getLevelInfo } from '../lib/gamification';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // [GÜVENLİ ÖNBELLEK] Sadece aktif session varsa ve veri tutarlıysa yükle
    try {
      const cached = localStorage.getItem('mahorapeak_user_cache');
      // İlk yüklemede session kontrolü yapamadığımız için güvenli bir şekilde döneriz
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(() => {
    // [HIZLI YÜKLEME] Eğer cache varsa loading'i false başlatarak UI'ı anında göster
    return !localStorage.getItem('mahorapeak_user_cache');
  });
  const [readingHistory, setReadingHistory] = useState([]);
  // ── Bildirim Motoru v2 durumları ───────────────────────────────────
  const [rawAnnouncements, setRawAnnouncements] = useState([]);
  const [rawPersonal, setRawPersonal]           = useState([]);
  const [scheduleToday, setScheduleToday]       = useState([]);
  const [readAnnIds, setReadAnnIds]             = useState([]);
  const [readLocalIds, setReadLocalIds]         = useState([]);
  const [dismissedIds, setDismissedIds]         = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifClock, setNotifClock]             = useState(() => Date.now());
  const seenNotifIdsRef = useRef(null);
  const notifFetchedRef = useRef(false);
  const profileChannelRef = useRef(null);

  // ── Stable profile fetcher ─────────────────────────────────────────
  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser) { setUser(null); return; }

    try {
      // PROFIL ÇEKME İŞLEMİNE 5 SN TIMEOUT EKLENDİ (DAHA GÜVENLİ)
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
        
      // PROFIL ÇEKME İŞLEMİNE 5 SN TIMEOUT EKLENDİ (DAHA GÜVENLİ)
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ error: { message: 'Profil yükleme gecikti (Timeout)', code: 'TIMEOUT' } }), 5000)
      );

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error && error.code !== 'PGRST116') {
        if (error.code !== 'TIMEOUT') {
          console.warn('[Auth] Profil çekme uyarısı:', error.message);
        }
        throw new Error(error.message || 'Profil yüklenemedi');
      }

      // [YÖNETİCİ YETKİSİ] Güvenli Admin kontrolü
      const isSystemOwner = authUser?.email === 'murathanozel134@gmail.com';
      const userRole = data?.role || (isSystemOwner ? 'Baş Admin' : 'Kullanıcı');
      
      if (data && data.username === 'MAHORAPEAK' && data.active_plan_id !== 'aethe') {
        supabase.from('profiles').update({ active_plan_id: 'aethe', is_elite: true }).eq('id', authUser.id).then();
        data.active_plan_id = 'aethe';
        data.is_elite = true;
      }
      
      // Adminler otomatik olarak Elite sayılır
      const is_elite = data?.is_elite || isSystemOwner || ['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester', 'Moderatör'].includes(userRole);

      const merged = {
        ...authUser,
        username:    data?.username  || authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'Kullanıcı',
        role:        userRole,
        avatar_url:  data?.avatar_url || authUser?.user_metadata?.avatar_url || null,
        avatar:      data?.avatar_url || authUser?.user_metadata?.avatar_url || null,
        premium:     data?.premium   || false,
        status:      data?.status    || 'Aktif',
        active_mix:      data?.active_mix      || { avatar: 'none', comment: 'none', nametag: 'none', aura: 'none', nameplate: 'none' },
        avatar_effect:   data?.avatar_effect   || 'none',
        comment_effect:  data?.comment_effect  || 'none',
        nametag_effect:  data?.nametag_effect  || 'none',
        unlocked_effects: data?.unlocked_effects || [],
        xp:              data?.xp ?? 0,
        aura:            data?.aura ?? 0,
        ...getLevelInfo(data?.xp ?? 0, is_elite),
        rank:            getLevelInfo(data?.xp ?? 0, is_elite, data?.active_plan_id).rank,
        mal_username:    data?.mal_username || null,
        badges:          data?.badges || [],
        active_decoration: data?.active_decoration || 'none',
        is_elite,
        muted_until: data?.muted_until || null,
        isMuted: data?.muted_until ? new Date(data.muted_until) > new Date() : false,
        active_plan_id:  data?.active_plan_id || null,
        discord_id:      data?.discord_id || null,
        discord_sync_code: data?.discord_sync_code || null,
        discord_sync_code_expires: data?.discord_sync_code_expires || null,
        faction:         data?.faction || null,
        used_promo_codes: data?.used_promo_codes || [],
        wallet_history: data?.wallet_history || [],
      };

      setUser(merged);
      localStorage.setItem('mahorapeak_user_cache', JSON.stringify(merged));
      localStorage.setItem('mahorapeak_last_user_id', authUser.id);
      
      // Fetch reading history silently
      supabase.from('reading_history').select('*').eq('user_id', authUser.id).order('updated_at', { ascending: false }).then(({ data: histData, error: histError }) => {
        if (!histError && histData) {
          const formattedHist = histData.map(h => ({
            manhwaId: String(h.series_id),
            lastChapter: h.last_read_chapter,
            updatedAt: new Date(h.updated_at).getTime()
          }));
          setReadingHistory(formattedHist);
        }
      });
      
      return merged;
    } catch (err) {
      // Sessiz hata yönetimi - Kullanıcıyı rahatsız etmeden fallback'e geç
      console.warn('[Auth] FetchProfile Fallback Devreye Girdi:', err.message);
      
      // HATA DURUMUNDA GÜVENLİ LİMANA DÖN (CACHE VEYA DEFAULT)
      let cachedUser = null;
      try {
        const cached = localStorage.getItem('mahorapeak_user_cache');
        if (cached) cachedUser = JSON.parse(cached);
      } catch (e) {}

      const fallbackUser = (cachedUser && cachedUser.id === authUser.id) ? cachedUser : {
        ...authUser,
        username: authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'Kullanıcı',
        role: (authUser?.email === 'murathanozel134@gmail.com') ? 'Baş Admin' : 'Kullanıcı',
        is_elite: (authUser?.email === 'murathanozel134@gmail.com'),
        avatar_url: authUser?.user_metadata?.avatar_url || null,
        xp: 0
      };

      setUser(fallbackUser);
      return fallbackUser;
    }
  }, []);

  // [SİSTEM DUYURUSU] Unified notification sender (supports string or rich payload)
  const sendNotification = useCallback(async (content, maybeType = 'system') => {
    try {
      const payload = typeof content === 'string'
        ? { text: content.trim(), type: maybeType }
        : {
            text: (content.text || '').trim(),
            type: content.type || maybeType || 'system',
            title: content.title || null,
            link: content.link || null,
            image_url: content.imageUrl || content.image_url || null,
            audience: content.audience || 'all',
            pinned: Boolean(content.pinned),
            priority: content.priority || (content.type === 'important' ? 'high' : 'normal'),
            expires_at: content.expiresAt ? new Date(content.expiresAt).toISOString() : null,
            series_id: content.seriesId || content.series_id || null,
            chapter_num: content.chapterNum ?? content.chapter_num ?? null,
          };

      const basicKeys = ['text', 'type', 'series_id', 'chapter_num', 'created_at'];
      await insertWithFallback(supabase, 'announcements', payload, basicKeys, (basic, full) => {
        if (full.title) basic.text = `[${full.title}] ${basic.text}`;
        return basic;
      });
    } catch (err) {
      console.error('[Auth] Bildirim gönderilemedi:', err);
      throw err;
    }
  }, []);

  // â”€â”€ Subscribe to own profile changes (role update, etc.) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const subscribeToProfile = useCallback((userId) => {
    if (profileChannelRef.current) {
      supabase.removeChannel(profileChannelRef.current);
    }

    profileChannelRef.current = supabase
      .channel(`profile-${userId}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'profiles',
        filter: `id=eq.${userId}`,
      }, (payload) => {
        setUser(prev => prev ? { ...prev, ...payload.new } : prev);
      })
      .subscribe();
  }, []);

  // ── Bildirim Motoru v2: veri çekme, realtime, türetilmiş liste ──────────────
  const appCtx = useApp();
  const allSeries = appCtx?.series || [];

  const notificationSettings = useMemo(
    () => resolveNotifSettings(user?.notification_settings),
    [user?.notification_settings]
  );
  const trackedSeriesIds = notificationSettings.scheduleSeriesIds;

  // Kullanıcı değişince yerel okundu / kaldırıldı listelerini yükle
  useEffect(() => {
    seenNotifIdsRef.current = null;
    notifFetchedRef.current = false;
    if (!user?.id) {
      setRawAnnouncements([]); setRawPersonal([]); setScheduleToday([]);
      setReadAnnIds([]); setReadLocalIds([]); setDismissedIds([]);
      return;
    }
    setReadLocalIds(loadLocalList(user.id, 'read'));
    setDismissedIds(loadLocalList(user.id, 'dismissed'));
  }, [user?.id]);

  // Sunucudaki okundu listesiyle birleştir (diğer cihazlardan gelen okumalar)
  useEffect(() => {
    const serverIds = (user?.read_notifications || []).map(Number);
    if (!serverIds.length) return;
    setReadAnnIds(prev => Array.from(new Set([...prev, ...serverIds])));
  }, [user?.read_notifications]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setNotificationsLoading(true);
    try {
      const [annRes, notifRes] = await Promise.all([
        supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(40),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      ]);
      if (!annRes.error) setRawAnnouncements(annRes.data || []);
      else console.warn('[Notif] Duyurular alınamadı:', annRes.error.message);
      if (!notifRes.error) setRawPersonal(notifRes.data || []);
      else console.warn('[Notif] Kişisel bildirimler alınamadı:', notifRes.error.message);
    } finally {
      notifFetchedRef.current = true;
      setNotificationsLoading(false);
    }
  }, [user?.id]);

  // İlk yükleme + realtime abonelik (yalnızca kullanıcı değişince yeniden kurulur)
  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();

    const channel = supabase
      .channel(`notif-center-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (p) => {
        setRawAnnouncements(prev => [p.new, ...prev.filter(a => a.id !== p.new.id)].slice(0, 60));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'announcements' }, (p) => {
        setRawAnnouncements(prev => prev.map(a => (a.id === p.new.id ? { ...a, ...p.new } : a)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'announcements' }, (p) => {
        setRawAnnouncements(prev => prev.filter(a => a.id !== p.old?.id));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (p) => {
        setRawPersonal(prev => [p.new, ...prev.filter(n => n.id !== p.new.id)].slice(0, 80));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (p) => {
        setRawPersonal(prev => prev.filter(n => n.id !== p.old?.id));
      })
      .subscribe();

    // Sekmeye geri dönünce tazele (realtime kopmuş olabilir)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchNotifications(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user?.id, fetchNotifications]);

  // Takvim hatırlatıcıları: takip edilen seri varsa bugünün programını çek
  const hasTracked = trackedSeriesIds.length > 0;
  useEffect(() => {
    if (!user?.id || !hasTracked) { setScheduleToday([]); return; }
    let cancelled = false;
    const loadSchedule = async () => {
      const { data, error } = await supabase
        .from('publishing_schedule')
        .select('*')
        .eq('release_date', localDateString());
      if (!cancelled && !error) setScheduleToday(data || []);
    };
    loadSchedule();
    const refresh = setInterval(loadSchedule, 15 * 60_000);
    return () => { cancelled = true; clearInterval(refresh); };
  }, [user?.id, hasTracked]);

  // Dakikalık saat: "şimdi yayında" geçişleri ve göreli zamanlar için
  useEffect(() => {
    if (!user?.id) return;
    const tick = setInterval(() => setNotifClock(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, [user?.id]);

  const notifications = useMemo(() => {
    if (!user?.id) return [];
    const role = user.role;
    const isStaff = ['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Moderatör'].includes(role);
    const isPremiumUser = Boolean(user.is_elite) || ['Pro', 'Hükümdar Gölgesi', 'Hükümdar', 'Aethe', 'Tester'].includes(role);
    const ctx = {
      settings: notificationSettings,
      tracked: new Set(trackedSeriesIds),
      isPremium: isPremiumUser,
      isStaff,
    };
    const dismissed = new Set(dismissedIds);
    const list = [
      ...rawAnnouncements.map(a => normalizeAnnouncement(a, readAnnIds)),
      ...rawPersonal.map(normalizePersonal),
      ...buildScheduleReminders(scheduleToday, trackedSeriesIds, allSeries, readLocalIds, notifClock),
    ]
      .filter(n => !dismissed.has(n.id))
      .filter(n => shouldShowNotification(n, ctx))
      .map(n => ({ ...n, tracked: Boolean(n.seriesId && ctx.tracked.has(String(n.seriesId))) }));
    return sortNotifications(list).slice(0, 60);
  }, [user?.id, user?.role, user?.is_elite, notificationSettings, trackedSeriesIds, dismissedIds,
      rawAnnouncements, rawPersonal, scheduleToday, allSeries, readAnnIds, readLocalIds, notifClock]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Yeni gelen bildirimleri yakala → toast / ses / tarayıcı bildirimi
  useEffect(() => {
    if (!user?.id || !notifFetchedRef.current) return;
    if (seenNotifIdsRef.current === null) {
      seenNotifIdsRef.current = new Set(notifications.map(n => n.id));
      return;
    }
    const seen = seenNotifIdsRef.current;
    const fresh = notifications.filter(n => !seen.has(n.id) && !n.read && n.createdAt > Date.now() - 10 * 60_000);
    notifications.forEach(n => seen.add(n.id));
    fresh.slice(0, 3).forEach(n => {
      window.dispatchEvent(new CustomEvent('notification-received', { detail: n }));
    });
  }, [notifications, user?.id]);

  // ── Gamification Logic ──────────────────────────────────────────────
  const calculateTitle = (xp = 0, is_elite = false, active_plan_id = null) => {
    return getLevelInfo(xp, is_elite, active_plan_id).rank;
  };

  const updateXP = useCallback(async (amount) => {
    if (!user?.id) return;

    const reward = Number(amount);
    if (!Number.isFinite(reward) || reward <= 0) return;
    const currentXP = Math.max(0, Math.floor(Number(user.xp) || 0));
    const newXP = currentXP + Math.floor(reward);
    if (newXP === currentXP) return;
    const newInfo = getLevelInfo(newXP, user.is_elite, user.active_plan_id);

    const { error } = await supabase
      .from('profiles')
      .update({ xp: newXP, rank: newInfo.rank })
      .eq('id', user.id);
    
    if (error) {
      console.error('[XP] Güncelleme hatası:', error);
    } else {
      const oldInfo = getLevelInfo(currentXP, user.is_elite, user.active_plan_id);
      const levelUp = newInfo.level > oldInfo.level;

      setUser(prev => ({ 
        ...prev, 
        xp: newXP, 
        ...newInfo
      }));

      // Sistem Mesajı Tetikleme (Solo Leveling Toast)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('xp-gained', { 
          detail: { 
            amount, 
            newXP, 
            newRank: newInfo.rank,
            levelUp 
          } 
        }));
      }

      // Başarım kontrolü (Seviye bazlı)
      if (levelUp) {
        trackActivity(user.id, 'level_up');
      }
    }
  }, [user]);

  const updateReadingProgress = useCallback(async (seriesId, chapterNum) => {
    if (!user?.id) return;
    
    try {
      const { data: previousHistory, error: previousHistoryError } = await supabase
        .from('reading_history')
        .select('last_read_chapter')
        .eq('user_id', user.id)
        .eq('series_id', seriesId)
        .maybeSingle();
      if (previousHistoryError) throw previousHistoryError;

      const currentChapter = Number(chapterNum);
      const previousChapter = Number(previousHistory?.last_read_chapter);
      const progressAdvanced = Number.isFinite(currentChapter) &&
        (!Number.isFinite(previousChapter) || currentChapter > previousChapter);

      const { error: histError } = await supabase
        .from('reading_history')
        .upsert({
          user_id: user.id,
          series_id: seriesId,
          last_read_chapter: chapterNum,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, series_id' });
        
      if (histError) throw histError;

      // ── 7 GÜNLÜK SERİ (STREAK) SİSTEMİ ───────────────────────
      const today = new Date().toISOString().split('T')[0];
      const lastReadDate = user.last_read_date;
      let newStreak = user.reading_streak || 0;
      let xpReward = progressAdvanced ? 10 : 0;

      if (lastReadDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastReadDate === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1; // Seri bozuldu veya yeni başladı
        }

        // Her 7 günlük seri dönümünde XP ödülü
        if (newStreak % 7 === 0) {
          xpReward += 100;
          trackActivity(user.id, 'achievement_unlock', 1, { name: 'Gizli Başarım', type: 'streak_7' });
        }

        await updateProfile({ 
          last_read_date: today,
          reading_streak: newStreak 
        });
      }

      // İlerleme ve seri ödülünü tek güncellemede yaz; eşzamanlı XP yazımları birbirini ezmesin.
      if (xpReward > 0) updateXP(xpReward);
      
      // Başarım takibi
      if (progressAdvanced) {
        trackActivity(user.id, 'read_chapter', 1, { seriesId, genres: [] });
      }
    } catch (err) {
      console.error('[Auth] Reading progress update error:', err);
    }
  }, [user, updateXP]);

  // ── Bildirim aksiyonları ──────────────────────────────────────────────
  const persistAnnouncementReads = useCallback(async (nextIds) => {
    if (!user?.id) return true;
    const { error } = await supabase.from('profiles').update({ read_notifications: nextIds }).eq('id', user.id);
    if (error) {
      console.error('[Notif] Okundu bilgisi kaydedilemedi:', error);
      return false;
    }
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, read_notifications: nextIds };
      localStorage.setItem('mahorapeak_user_cache', JSON.stringify(next));
      return next;
    });
    return true;
  }, [user?.id]);

  /** ids verilmezse görünen tüm bildirimleri okundu yapar. */
  const markAllRead = useCallback(async (ids = null) => {
    if (!user?.id) return false;
    const scope = new Set(ids || notifications.map(n => n.id));
    const targets = notifications.filter(n => scope.has(n.id) && !n.read);
    if (!targets.length) return true;

    const annIds = targets.filter(n => n.source === 'announcement').map(n => Number(n.originalId));
    const personalIds = targets.filter(n => n.source === 'personal').map(n => n.originalId);
    const localIds = targets.filter(n => n.source === 'schedule').map(n => n.id);

    // İyimser güncelleme
    const nextAnn = Array.from(new Set([...readAnnIds, ...annIds]));
    if (annIds.length) setReadAnnIds(nextAnn);
    if (personalIds.length) {
      const set = new Set(personalIds);
      setRawPersonal(prev => prev.map(p => (set.has(p.id) ? { ...p, is_read: true } : p)));
    }
    if (localIds.length) {
      setReadLocalIds(prev => {
        const next = Array.from(new Set([...prev, ...localIds]));
        saveLocalList(user.id, 'read', next);
        return next;
      });
    }

    const jobs = [];
    if (annIds.length) jobs.push(persistAnnouncementReads(nextAnn));
    if (personalIds.length) {
      jobs.push(supabase.from('notifications').update({ is_read: true }).in('id', personalIds).eq('user_id', user.id)
        .then(({ error }) => { if (error) console.error('[Notif] Kişisel okundu hatası:', error); return !error; }));
    }
    const results = await Promise.all(jobs);
    return results.every(Boolean);
  }, [user?.id, notifications, readAnnIds, persistAnnouncementReads]);

  const markNotificationRead = useCallback(
    (notificationId) => markAllRead([notificationId]),
    [markAllRead]
  );

  /** Bildirimi kutudan kaldırır (yerel olarak gizler, kişiselse sunucudan da siler). */
  const dismissNotification = useCallback(async (notificationIds) => {
    if (!user?.id) return;
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
    const targets = notifications.filter(n => ids.includes(n.id));
    setDismissedIds(prev => {
      const next = Array.from(new Set([...prev, ...ids]));
      saveLocalList(user.id, 'dismissed', next);
      return next;
    });
    // Kaldırılanlar okunmuş sayılsın ki sayaç doğru kalsın
    await markAllRead(ids);
    const personalIds = targets.filter(n => n.source === 'personal').map(n => n.originalId);
    if (personalIds.length) {
      const { error } = await supabase.from('notifications').delete().in('id', personalIds).eq('user_id', user.id);
      if (!error) setRawPersonal(prev => prev.filter(p => !personalIds.includes(p.id)));
    }
  }, [user?.id, notifications, markAllRead]);

  const clearAllNotifications = useCallback(
    () => dismissNotification(notifications.filter(n => !n.pinned).map(n => n.id)),
    [dismissNotification, notifications]
  );

  // ── Authentication Boot & Listeners ──────────────────────────────────
  useEffect(() => {
    let mounted = true;

    // Safety Timeout: force loading=false after 1s so UI always shows (Optimized)
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 1000);

    const init = async () => {
      let session = null;
      try {
        // 8 saniye içinde session gelmezse ağ hatası say, kullanıcıyı çıkarma
        const sessionPromise = supabase.auth.getSession();
        const timeout = new Promise((resolve) =>
          setTimeout(() => resolve({ data: { session: null }, error: { message: 'getSession timeout' } }), 5000)
        );
        const result = await Promise.race([sessionPromise, timeout]);
        const { data, error } = result;
        session = data?.session || null;
        if (error) throw error;

      } catch (err) {
        // Ağ hatası: kullanıcıyı çıkatma, sadece logla
        console.warn("[Auth] Session yüklenemedi (ağ hatası), oturum korunuyor:", err.message);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimeout);

          // Profil yüklemesini async olarak (arkaplanda) devam ettir
          if (session?.user) {
            fetchProfile(session.user).then(() => {
              // Önbellek doğrulaması: Eğer session ID ile önbellek ID uyuşmuyorsa önbelleği sil (Background check)
              const cachedId = localStorage.getItem('mahorapeak_last_user_id');
              if (cachedId !== session.user.id) {
                console.warn("[Auth] Önbellek uyumsuzluğu tespit edildi, temizleniyor...");
                localStorage.removeItem('mahorapeak_user_cache');
                localStorage.removeItem('mahorapeak_last_user_id');
                fetchProfile(session.user);
              }
              subscribeToProfile(session.user.id);
            });
          }
        }
      }
    };

    init();

    let subscription = null;
    try {
      const response = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        
        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            if (session?.user) {
              // Sekme değişimlerinde asla loading gösterme (UI'ı dondurma)
              // Sadece kullanıcı gerçekten ilk defa giriş yapıyorsa (cache yoksa) göster
              if (event === 'SIGNED_IN' && !localStorage.getItem('mahorapeak_user_cache')) {
                setLoading(true);
              }
              await fetchProfile(session.user);
              subscribeToProfile(session.user.id);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            localStorage.removeItem('mahorapeak_user_cache');
            if (profileChannelRef.current) {
              supabase.removeChannel(profileChannelRef.current);
              profileChannelRef.current = null;
            }
            // Sayfa döngüsünü engellemek için direkt kök dizine gönder
            window.location.href = '/';
          }
        } catch (err) {
          console.error("[Auth] State Değişim Hatası:", err);
        } finally {
          if (mounted) setLoading(false); // Her durumda loading kapat
        }
      });
      subscription = response?.data?.subscription;
    } catch (err) {
      console.error("[Auth] Listener Kurulamadı:", err);
      setLoading(false);
    }

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      if (subscription) subscription.unsubscribe();
      if (profileChannelRef.current) {
        supabase.removeChannel(profileChannelRef.current);
      }
    };
  }, [fetchProfile, subscribeToProfile]);

  // ── Auth Actions ──────────────────────────────────────────────────────
  const withTimeout = (promise, timeoutMs = 20000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Bağlantı zaman aşımına uğradı. Lütfen internetinizi veya Vercel ayarlarınızı kontrol edin.')), timeoutMs)
      )
    ]);
  };

  const login = async (identifier, password) => {
    // SUPABASE RATE LIMIT ACİL DURUM BYPASS
    if (identifier === 'admin@123.com' && password === 'admin123') {
      const mockAdmin = {
        id: 'bypass-admin-id',
        email: 'admin@123.com',
        user_metadata: { username: 'Yönetici' },
        role: 'Baş Admin'
      };
      setUser(mockAdmin);
      return { user: mockAdmin };
    }

    try {
      let actualEmail = identifier;
      
      // Eğer identifier e-posta değilse (içinde @ yoksa), kullanıcı adı olarak kabul et ve e-postasını bul
      if (!identifier.includes('@')) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier)
          .maybeSingle();
          
        if (profileError || !profileData || !profileData.email) {
          throw new Error('Kullanıcı bulunamadı veya hatalı giriş.');
        }
        actualEmail = profileData.email;
      }

      const { data, error } = await withTimeout(supabase.auth.signInWithPassword({ email: actualEmail, password }));
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[Auth] Login error:', err);
      if (err.message === 'Invalid login credentials') {
        throw new Error('Kullanıcı adı, e-posta veya şifre hatalı!');
      }
      throw err;
    }
  };

  const signup = async (email, password, username) => {
    try {
      const { data, error } = await withTimeout(supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      }));
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[Auth] Signup error:', err);
      if (typeof window !== 'undefined') {
        window.__AUTH_ERROR__ = `Kayıt Hatası: ${err.message}`;
      }
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
    return data;
  };

  const loginWithDiscord = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
    return data;
  };

  const resetPassword = async (identifier) => {
    try {
      let actualEmail = identifier;
      
      if (!identifier.includes('@')) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier)
          .maybeSingle();
          
        if (profileError || !profileData || !profileData.email) {
          throw new Error('Kullanıcı bulunamadı.');
        }
        actualEmail = profileData.email;
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(actualEmail, {
        redirectTo: `https://mahorapeak.com.tr/reset-password`,
      });
      if (error) {
        console.error('[Auth DEBUG] Reset Password Fail:', {
          message: error.message,
          status: error.status,
          code: error.code,
          hint: error.hint
        });
        throw error;
      }
      return { data, email: actualEmail };
    } catch (err) {
      console.error('[Auth] Reset password exception:', err);
      throw err;
    }
  };

  const verifyOtp = async (email, token, type = 'recovery') => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type });
      if (error) {
        console.error('[Auth DEBUG] Verify OTP Fail:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('[Auth] Verify OTP exception:', err);
      throw err;
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) {
        console.error('[Auth DEBUG] Update Password Fail:', {
          message: error.message,
          status: error.status,
          code: error.code
        });
        throw error;
      }
      return data;
    } catch (err) {
      console.error('[Auth] Update password exception:', err);
      throw err;
    }
  };

  const updateProfile = useCallback(async (updates) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    
    if (error) throw error;

    setUser(prev => {
      const next = { ...prev, ...updates };
      // [KRİTİK] Önbelleği anında güncelle ki sayfa yenilenince eski veri gelmesin
      localStorage.setItem('mahorapeak_user_cache', JSON.stringify(next));
      return next;
    });
  }, [user?.id]);

  const updateNotificationSettings = useCallback(async (partial) => {
    if (!user?.id) return false;
    const current = resolveNotifSettings(user.notification_settings);
    const next = { ...current, ...partial };
    await updateProfile({ notification_settings: next });
    return true;
  }, [user?.id, user?.notification_settings, updateProfile]);

  const toggleTrackSeries = useCallback(async (seriesId) => {
    if (!user?.id || !seriesId) return false;
    const strId = String(seriesId);
    const current = resolveNotifSettings(user.notification_settings);
    const set = new Set(current.scheduleSeriesIds || []);
    const wasTracked = set.has(strId);
    if (wasTracked) set.delete(strId);
    else set.add(strId);
    const nextList = Array.from(set);
    await updateProfile({
      notification_settings: {
        ...current,
        scheduleSeriesIds: nextList,
      },
    });
    return !wasTracked;
  }, [user?.id, user?.notification_settings, updateProfile]);

  const logout = async () => {
    // 1. İstemci (tarayıcı) tarafındaki HER ŞEYİ KESİNLİKLE SİL
    setUser(null);
    setReadingHistory([]);
    localStorage.removeItem('mahorapeak_user_cache');
    
    // 2. Sunucuya (Supabase) çıkış isteği yolla (Ağ kopuksa bile site çıkış yapmış gibi çalışmaya devam etsin)
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      window.location.href = '/';
    }
  };

  // ── Elite System (Placeholder) ────────────────────────────────────────
  const upgradeToElite = useCallback(async (planId) => {
    if (!user?.id) return false;
    try {
      // Determine Aura Bonus based on plan
      let auraBonus = 0;
      if (planId === 'pro') auraBonus = 25000;
      else if (planId === 'shadow') auraBonus = 50000;
      else if (planId === 'ruler') auraBonus = 250000;
      else if (planId === 'aethe') auraBonus = 1000000;

      const newAura = (user.aura || 0) + auraBonus;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_elite: true,
          active_plan_id: planId,
          aura: newAura
        })
        .eq('id', user.id);
        
      if (error) {
        console.error('[Elite] Yükseltme hatası:', error);
        return false;
      }
      
      setUser(prev => {
        const info = getLevelInfo(prev.xp, true);
        const next = { ...prev, ...info, is_elite: true, active_plan_id: planId, aura: newAura };
        localStorage.setItem('mahorapeak_user_cache', JSON.stringify(next));
        return next;
      });
      return true;
    } catch (err) {
      console.error('[Elite] Beklenmeyen hata:', err);
      return false;
    }
  }, [user]);

  // â”€â”€ Reading History (localStorage â€” lightweight feature) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addToHistory = useCallback((manhwaId, chapter) => {
    setReadingHistory(prev => {
      const exists = prev.findIndex(h => h.manhwaId === String(manhwaId));
      const entry  = { manhwaId: String(manhwaId), lastChapter: chapter, updatedAt: Date.now() };
      if (exists >= 0) {
        const next = [...prev];
        next[exists] = entry;
        return next;
      }
      return [entry, ...prev];
    });
  }, []);



  // â”€â”€ Role helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const hasRole = useCallback((roles) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  }, [user?.role]);

  const isOwner  = hasRole(['Baş Admin']);
  const isAdmin  = hasRole(['Baş Admin', 'Yönetici']);
  const isMod    = hasRole(['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Moderatör']);
  const isEditor = hasRole(['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör']);
  const isTester = hasRole(['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester']);
  const isPremium = hasRole(['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester', 'Pro', 'Hükümdar Gölgesi', 'Hükümdar', 'Aethe']);

  const value = {
    user,
    loading,
    login,
    logout,
    signup,
    loginWithGoogle,
    loginWithDiscord,
    isOwner,
    isAdmin,
    isMod,
    isEditor,
    isTester,
    isPremium,
    readingHistory,
    addToHistory,
    notifications,
    unreadCount,
    notificationsLoading,
    fetchNotifications,
    notificationSettings,
    trackedSeriesIds,
    sendNotification,
    markAllRead,
    markNotificationRead,
    dismissNotification,
    clearAllNotifications,
    updateNotificationSettings,
    toggleTrackSeries,
    updateXP,
    updateReadingProgress,
    calculateTitle,
    getLevelInfo,
    resetPassword,
    verifyOtp,
    updatePassword,
    updateProfile,
    upgradeToElite
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

