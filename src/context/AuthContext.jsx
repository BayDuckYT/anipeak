import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // [KOZMİK ÖNBELLEK] Optimistik başlangıç: Supabase'den önce hafızadaki kullanıcıyı yükle
    try {
      const cached = localStorage.getItem('anipeak_user_cache');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [readingHistory, setReadingHistory] = useState([]);
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount,   setUnreadCount]     = useState(0);
  const profileChannelRef = useRef(null);

  // ── Stable profile fetcher ─────────────────────────────────────────
  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser) { setUser(null); return; }

    try {
      // PROFIL ÇEKME İŞLEMİNE TIMEOUT EKLENDİ
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profil yükleme zaman aşımı')), 2500)
      );

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error && error.code !== 'PGRST116') {
        console.error('[Auth] Profil çekme hatası:', error.message);
      }

      // [KOZMİK YETKİ] Hardcoded Admin bypass for the owner
      const isCosmicOwner = authUser.email === 'murathanozel134@gmail.com';

      const merged = {
        ...authUser,
        username:  data?.username  || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Kullanıcı',
        role:      isCosmicOwner ? 'Baş Admin' : (data?.role || 'Kullanıcı'),
        avatar:    data?.avatar_url || authUser.user_metadata?.avatar_url || null,
        premium:   data?.premium   || false,
        status:    data?.status    || 'Aktif',
      };

      setUser(merged);
      // [KOZMİK SÜREKLİLİK] Başarılı profili hafızaya yedekle
      localStorage.setItem('anipeak_user_cache', JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.error('[Auth] FetchProfile Kritik Hata:', err);
      // Hata veya timeout durumunda döngüyü kırmak için yedek profil ver
      let cachedUser = null;
      try {
        const cached = localStorage.getItem('anipeak_user_cache');
        if (cached) cachedUser = JSON.parse(cached);
      } catch (e) {}

      // Cache varsa onu kullan, yoksa boş bir kullanıcı oluştur
      const fallbackUser = (cachedUser && cachedUser.id === authUser.id) ? cachedUser : {
        ...authUser,
        username: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Kullanıcı',
        role: 'Kullanıcı'
      };

      // Garantili Kurucu (Owner) Koruması (Ağ çökse bile yetki düşmesin)
      if (authUser.email === 'murathanozel134@gmail.com') {
         fallbackUser.role = 'Baş Admin';
      }

      setUser(fallbackUser);
      return fallbackUser;
    }
  }, []);

  // [KOZMİK BİLDİRİM] Unified notification sender
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
  const calculateTitle = (xp = 0) => {
    if (xp >= 1500) return 'Kozmik Varlık';
    if (xp >= 500)  return 'Manga Fedaisi';
    if (xp >= 100)  return 'Kıdemli Okur';
    return 'Çömez Okur';
  };

  const updateXP = useCallback(async (amount) => {
    if (!user?.id) return;
    
    const newXP = (Number(user.xp) || 0) + amount;
    const { error } = await supabase
      .from('profiles')
      .update({ xp: newXP })
      .eq('id', user.id);
    
    if (error) console.error('[XP] Güncelleme hatası:', error);
  }, [user]);

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

    // Safety Timeout: force loading=false after 2.5s so UI always shows
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("[Auth] Zaman aşımı — UI zorla açılıyor");
        setLoading(false);
      }
    }, 2500);

    const init = async () => {
      try {
        // 8 saniye içinde session gelmezse ağ hatası say, kullanıcıyı çıkarma
        const sessionPromise = supabase.auth.getSession();
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('getSession timeout')), 8000)
        );
        const { data: { session }, error } = await Promise.race([sessionPromise, timeout]);

        if (error) throw error;
        if (mounted && session?.user) {
          await fetchProfile(session.user);
          subscribeToProfile(session.user.id);
        }
      } catch (err) {
        // Ağ hatası: kullanıcıyı çıkatma, sadece logla
        console.warn("[Auth] Session yüklenemedi (ağ hatası), oturum korunuyor:", err.message);
        window.__AUTH_ERROR__ = err.message;
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimeout);
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
              // Sadece İLK girişte loading göster, arka plan yenilemelerinde (sekme değişimi vb) UI'ı dondurma
              if (event === 'SIGNED_IN') setLoading(true); 
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
          window.__AUTH_ERROR__ = "Giriş işlemi tamamlanamadı. Sayfayı yenileyin.";
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
        user_metadata: { username: 'Başkan' },
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
      const message = err.message === 'Invalid login credentials' 
        ? 'E-posta veya şifre hatalı!' 
        : (err.message || 'Giriş yapılamadı.');
        
      if (typeof window !== 'undefined') {
        window.__AUTH_ERROR__ = message;
      }
      throw new Error(message);
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

      // Ensure profile row exists immediately after signup
      if (data.user) {
        await supabase.from('profiles').upsert({
          id:         data.user.id,
          username,
          role:       'Kullanıcı',
          email,
          created_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }
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
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[Auth] Reset password error:', err);
      throw err;
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[Auth] Update password error:', err);
      throw err;
    }
  };

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

  const value = {
    user,
    loading,
    login,
    logout,
    signup,
    loginWithGoogle,
    isMod,
    isEditor,
    readingHistory,
    addToHistory,
    notifications,
    unreadCount,
    sendNotification,
    markAllRead,
    updateXP,
    calculateTitle,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

