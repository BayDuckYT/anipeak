import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [readingHistory, setReadingHistory] = useState([]);
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount,   setUnreadCount]     = useState(0);
  const [readIds,       setReadIds]         = useState(() => {
    try { return JSON.parse(localStorage.getItem('anipeak_read_notifs') || '[]'); }
    catch { return []; }
  });
  const profileChannelRef = useRef(null);

  // â”€â”€ Stable profile fetcher â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser) { setUser(null); return; }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Auth] Profil çekme hatası:', error.message);
    }

    // [KOZMİK YETKİ] Hardcoded Admin bypass for the owner
    const isCosmicOwner = authUser.email === 'murathanozel134@gmail.com';

    const merged = {
      ...authUser,
      username:  data?.username  || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Ruh',
      role:      isCosmicOwner ? 'Baş Admin' : (data?.role || 'Kullanıcı'),
      avatar:    data?.avatar_url || authUser.user_metadata?.avatar_url || null,
      premium:   data?.premium   || false,
      status:    data?.status    || 'Aktif',
    };

    setUser(merged);
    return merged;
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
    const loadAnn = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) syncNotifs(data, readIds);
    };

    loadAnn();

    const channel = supabase
      .channel('announcements-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (payload) => {
        setNotifications(prev => {
          const fresh = mapToNotif(payload.new, false);
          const next = [fresh, ...prev].slice(0, 20);
          updateUnread(next);
          return next;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [readIds]);

  const mapToNotif = (ann, isRead) => ({
    id:    ann.id,
    text:  ann.text,
    type:  ann.type || 'info',
    time:  new Date(ann.created_at).toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }),
    read:  isRead
  });

  const syncNotifs = (data, ids) => {
    const mapped = data.map(ann => mapToNotif(ann, ids.includes(ann.id)));
    setNotifications(mapped);
    updateUnread(mapped);
  };

  const updateUnread = (list) => {
    setUnreadCount(list.filter(n => !n.read).length);
  };

  useEffect(() => {
    localStorage.setItem('anipeak_read_notifs', JSON.stringify(readIds));
  }, [readIds]);

  // ── Authentication Boot & Listeners ──────────────────────────────────
  useEffect(() => {
    let mounted = true;

    // [KOZMİK GÜVENLİK] Safety Timeout: Force loading to false if Supabase hangs
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("[Auth] Başlatma zaman aşımına uğradı, UI zorla açılıyor...");
        setLoading(false);
      }
    }, 6000);

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted && session?.user) {
          await fetchProfile(session.user);
          subscribeToProfile(session.user.id);
        }
      } catch (err) {
        console.error("[Auth] Başlatma Hatası:", err);
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
          if (session?.user) {
            await fetchProfile(session.user);
            subscribeToProfile(session.user.id);
          } else {
            setUser(null);
            if (profileChannelRef.current) {
              supabase.removeChannel(profileChannelRef.current);
              profileChannelRef.current = null;
            }
          }
        } catch (err) {
          console.error("[Auth] State Değişim Hatası:", err);
        } finally {
          setLoading(false);
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
  const withTimeout = (promise, timeoutMs = 10000) => {
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
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setReadingHistory([]);
      // Force reload to clear all persistent states and context data
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      window.location.reload();
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

  const markAllRead = useCallback(() => {
    setReadIds(prev => {
      const currentIds = notifications.map(n => n.id);
      const next = Array.from(new Set([...prev, ...currentIds]));
      return next;
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [notifications]);

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
    hasRole,
    isOwner,
    isAdmin,
    isMod,
    isEditor,
    readingHistory,
    addToHistory,
    notifications,
    unreadCount,
    sendNotification,
    markAllRead,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

