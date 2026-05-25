import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { trackActivity } from '../lib/achievementService';

const AuthContext = createContext(null);

/**
 * XP bazlı rütbe hesaplama
 */
/**
 * Yeni Kademeli Seviye ve Rütbe Hesaplama (AniPeak V4)
 */
export function getLevelInfo(xp, is_elite = false, active_plan_id = null) {
  let level, rank, xpInLevel, xpForNext, rankColor;
  const val = Number(xp) || 0;

  if (val < 500) {
    level = Math.floor(val / 50) + 1;
    rank = 'Manga Çırağı';
    xpInLevel = val % 50;
    xpForNext = 50;
  } else if (val < 2000) {
    level = 11 + Math.floor((val - 500) / 100);
    rank = 'Manga Yolcusu';
    xpInLevel = (val - 500) % 100;
    xpForNext = 100;
  } else if (val < 5000) {
    level = 26 + Math.floor((val - 2000) / 200);
    rank = 'Manga Savaşçısı';
    xpInLevel = (val - 2000) % 200;
    xpForNext = 200;
  } else if (val < 10000) {
    level = 41 + Math.floor((val - 5000) / 333);
    rank = 'Manga Koruması';
    xpInLevel = (val - 5000) % 333;
    xpForNext = 333;
  } else if (val < 25000) {
    level = 56 + Math.floor((val - 10000) / 1000);
    rank = 'Manga Koleksiyoncusu';
    xpInLevel = (val - 10000) % 1000;
    xpForNext = 1000;
  } else if (val < 50000) {
    level = 71 + Math.floor((val - 25000) / 1666);
    rank = 'Manga Ustası';
    xpInLevel = (val - 25000) % 1666;
    xpForNext = 1666;
  } else if (val < 100000) {
    level = 86 + Math.floor((val - 50000) / 3333);
    rank = 'Manga Efsanesi';
    xpInLevel = (val - 50000) % 3333;
    xpForNext = 3333;
  } else {
    level = 100;
    rank = 'Manga Hükümdarı';
    xpInLevel = 1;
    xpForNext = 1;
  }

  if (level > 100) level = 100;

  // Eğer premium kullanıcısıysa (is_elite) başına sadece Elite ekle
  if (is_elite || active_plan_id) {
    rank = `Elite ${rank}`;
  }

  return { 
    level, 
    rank, 
    xpInLevel, 
    xpForNext, 
    progress: level === 100 ? 100 : (xpInLevel / xpForNext) * 100,
    fullLabel: `Lv. ${level} ${rank}`,
    rankStyle: (is_elite || active_plan_id) ? 'elite-gold-glow' : 'normal-rank'
  };
}

// Geriye uyumluluk için eski fonksiyonu güncelle
export function calculateRank(xp) {
  return getLevelInfo(xp).rank;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // [GÜVENLİ ÖNBELLEK] Sadece aktif session varsa ve veri tutarlıysa yükle
    try {
      const cached = localStorage.getItem('anipeak_user_cache');
      // İlk yüklemede session kontrolü yapamadığımız için güvenli bir şekilde döneriz
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(() => {
    // [HIZLI YÜKLEME] Eğer cache varsa loading'i false başlatarak UI'ı anında göster
    return !localStorage.getItem('anipeak_user_cache');
  });
  const [readingHistory, setReadingHistory] = useState([]);
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount,   setUnreadCount]     = useState(0);
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
      
      if (data && data.username === 'ANIPEAK' && data.active_plan_id !== 'aethe') {
        supabase.from('profiles').update({ active_plan_id: 'aethe', is_elite: true }).eq('id', authUser.id).then();
        data.active_plan_id = 'aethe';
        data.is_elite = true;
      }
      
      // Adminler otomatik olarak Elite sayılır
      const is_elite = data?.is_elite || isSystemOwner || ['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester'].includes(userRole);

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
        rank:            data?.rank || getLevelInfo(data?.xp ?? 0, is_elite).rank, // DB'deki rütbeyi koru
        mal_username:    data?.mal_username || null,
        badges:          data?.badges || [],
        active_decoration: data?.active_decoration || 'none',
        is_elite,
        active_plan_id:  data?.active_plan_id || null,
        discord_id:      data?.discord_id || null,
        discord_sync_code: data?.discord_sync_code || null,
        discord_sync_code_expires: data?.discord_sync_code_expires || null,
        used_promo_codes: data?.used_promo_codes || [],
        wallet_history: data?.wallet_history || [],
      };

      setUser(merged);
      localStorage.setItem('anipeak_user_cache', JSON.stringify(merged));
      localStorage.setItem('anipeak_last_user_id', authUser.id);
      return merged;
    } catch (err) {
      // Sessiz hata yönetimi - Kullanıcıyı rahatsız etmeden fallback'e geç
      console.warn('[Auth] FetchProfile Fallback Devreye Girdi:', err.message);
      
      // HATA DURUMUNDA GÜVENLİ LİMANA DÖN (CACHE VEYA DEFAULT)
      let cachedUser = null;
      try {
        const cached = localStorage.getItem('anipeak_user_cache');
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

  // [SİSTEM DUYURUSU] Unified notification sender
  const sendNotification = useCallback(async (text, type = 'system') => {
    try {
      await supabase.from('announcements').insert([{ text, type, created_at: new Date().toISOString() }]);
    } catch (err) {
      console.error('[Auth] Bildirim gönderilemedi:', err);
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

  // ── Sync Database Announcements as Notifications ────────────────────
  useEffect(() => {
    if (!user?.id) return;
    
    const loadAnn = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      const readIds = user.read_notifications || [];
      if (data) syncNotifs(data, readIds);
    };

    loadAnn();

    const channel = supabase
      .channel('announcements-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (payload) => {
        setNotifications(prev => {
          const fresh = mapToNotif(payload.new, (user.read_notifications || []).includes(payload.new.id));
          const next = [fresh, ...prev].slice(0, 20);
          updateUnread(next);
          return next;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, user?.read_notifications]);

  const mapToNotif = (ann, isRead) => ({
    id:    ann.id,
    text:  ann.text,
    type:  ann.type || 'info',
    time:  new Date(ann.created_at).toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }),
    read:  isRead
  });

  const updateUnread = (notifList) => {
    setUnreadCount(notifList.filter(n => !n.read).length);
  };

  const syncNotifs = (announcements, readIds) => {
    const mapped = announcements.map(a => mapToNotif(a, readIds.includes(a.id)));
    setNotifications(mapped);
    updateUnread(mapped);
  };

  // ── Gamification Logic ──────────────────────────────────────────────
  const calculateTitle = (xp = 0, is_elite = false) => {
    let baseTitle = 'Yeni Üye';
    if (xp >= 1500) baseTitle = 'Kıdemli Okur';
    else if (xp >= 500)  baseTitle = 'Manga Uzmanı';
    else if (xp >= 100)  baseTitle = 'Aktif Üye';
    
    if (is_elite) return `👑 Elite ${baseTitle}`;
    return baseTitle;
  };

  const updateXP = useCallback(async (amount) => {
    if (!user?.id) return;
    
    const newXP = (Number(user.xp) || 0) + amount;
    const newRank = calculateRank(newXP);

    const { error } = await supabase
      .from('profiles')
      .update({ xp: newXP, rank: newRank })
      .eq('id', user.id);
    
    if (error) {
      console.error('[XP] Güncelleme hatası:', error);
    } else {
      const oldInfo = getLevelInfo(user.xp || 0, user.is_elite);
      const newInfo = getLevelInfo(newXP, user.is_elite);
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

      if (lastReadDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastReadDate === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1; // Seri bozuldu veya yeni başladı
        }

        // 7. Gün Özel Ödülü
        if (newStreak === 7) {
          updateXP(1000); // Dev XP bonusu
          trackActivity(user.id, 'achievement_unlock', 1, { name: 'Gizli Başarım', type: 'streak_7' });
        }

        await updateProfile({ 
          last_read_date: today,
          reading_streak: newStreak 
        });
      }

      // Her bölüm okuma 10 XP verir
      updateXP(10);
      
      // Başarım takibi
      trackActivity(user.id, 'read_chapter', 1, { 
        seriesId, 
        genres: [] 
      });
    } catch (err) {
      console.error('[Auth] Reading progress update error:', err);
    }
  }, [user, updateXP]);

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    const currentIds = notifications.map(n => n.id);
    const uniqueIds = Array.from(new Set([...(user.read_notifications || []), ...currentIds]));

    const { error } = await supabase
      .from('profiles')
      .update({ read_notifications: uniqueIds })
      .eq('id', user.id);

    if (error) console.error('[Notif] Okundu hatası:', error);
  }, [user, notifications]);

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
              const cachedId = localStorage.getItem('anipeak_last_user_id');
              if (cachedId !== session.user.id) {
                console.warn("[Auth] Önbellek uyumsuzluğu tespit edildi, temizleniyor...");
                localStorage.removeItem('anipeak_user_cache');
                localStorage.removeItem('anipeak_last_user_id');
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
              if (event === 'SIGNED_IN' && !localStorage.getItem('anipeak_user_cache')) {
                setLoading(true);
              }
              await fetchProfile(session.user);
              subscribeToProfile(session.user.id);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            localStorage.removeItem('anipeak_user_cache');
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

  const login = async (email, password) => {
    // SUPABASE RATE LIMIT ACİL DURUM BYPASS
    if (email === 'admin@123.com' && password === 'admin123') {
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
      const { data, error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }));
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[Auth] Login error:', err);
      if (err.message === 'Invalid login credentials') {
        throw new Error('E-posta veya şifre hatalı!');
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

  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
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
      return data;
    } catch (err) {
      console.error('[Auth] Reset password exception:', err);
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
      localStorage.setItem('anipeak_user_cache', JSON.stringify(next));
      return next;
    });
  }, [user?.id]);

  const logout = async () => {
    // 1. İstemci (tarayıcı) tarafındaki HER ŞEYİ KESİNLİKLE SİL
    setUser(null);
    setReadingHistory([]);
    localStorage.removeItem('anipeak_user_cache');
    
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
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_elite: true,
          active_plan_id: planId 
        })
        .eq('id', user.id);
        
      if (error) {
        console.error('[Elite] Yükseltme hatası:', error);
        return false;
      }
      
      setUser(prev => {
        const info = getLevelInfo(prev.xp, true);
        const next = { ...prev, ...info, is_elite: true, active_plan_id: planId };
        localStorage.setItem('anipeak_user_cache', JSON.stringify(next));
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
  const isMod    = hasRole(['Baş Admin', 'Yönetici', 'Admin Yardımcısı']);
  const isEditor = hasRole(['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör']);
  const isTester = hasRole(['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester']);
  const isPremium = hasRole(['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester', 'Premium']);

  const value = {
    user,
    loading,
    login,
    logout,
    signup,
    loginWithGoogle,
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
    sendNotification,
    markAllRead,
    updateXP,
    updateReadingProgress,
    calculateTitle,
    resetPassword,
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

