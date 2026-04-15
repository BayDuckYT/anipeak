import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [readingHistory, setReadingHistory] = useState([]);
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount,   setUnreadCount]     = useState(0);
  const profileChannelRef = useRef(null);

  // ── Stable profile fetcher ──────────────────────────────────────────
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

    const merged = {
      ...authUser,
      username:  data?.username  || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Ruh',
      role:      data?.role      || 'Kullanıcı',
      avatar:    data?.avatar_url || authUser.user_metadata?.avatar_url || null,
      premium:   data?.premium   || false,
      status:    data?.status    || 'Aktif',
    };

    setUser(merged);
    return merged;
  }, []);

  // ── Subscribe to own profile changes (role update, etc.) ───────────
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

  // ── Boot: get session + listen for auth events ─────────────────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && session?.user) {
        await fetchProfile(session.user);
        subscribeToProfile(session.user.id);
      }
      if (mounted) setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
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
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (profileChannelRef.current) {
        supabase.removeChannel(profileChannelRef.current);
      }
    };
  }, [fetchProfile, subscribeToProfile]);

  // ── Auth Actions ───────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
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
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setReadingHistory([]);
  };

  // ── Reading History (localStorage — lightweight feature) ───────────
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

  // ── Notifications (in-memory) ──────────────────────────────────────
  const sendNotification = useCallback((title, text, type = 'info') => {
    const notif = { id: Date.now(), title, text, type, time: 'Az önce', read: false };
    setNotifications(prev => [notif, ...prev.slice(0, 19)]);
    setUnreadCount(n => n + 1);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // ── Role helpers ───────────────────────────────────────────────────
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
