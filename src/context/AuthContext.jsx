import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const INITIAL_NOTIFICATIONS = [
  { id: 1, text: 'Ölümsüzlerin Oyunu - Bölüm 90 yayınlandı!', time: '5 dk önce', read: false, type: 'chapter', manhwaId: 5 },
  { id: 2, text: 'Gece Yarısı Efsanesi - Bölüm 188 yayınlandı!', time: '2 sa önce', read: false, type: 'chapter', manhwaId: 1 },
  { id: 3, text: 'Premium üyeliğiniz yenilendi.', time: '1 gün önce', read: true, type: 'system', manhwaId: null },
  { id: 4, text: 'Yorumunuza 12 beğeni geldi.', time: '2 gün önce', read: true, type: 'social', manhwaId: null },
  { id: 5, text: 'Phoenix: Son Kor - Bölüm 446 yayınlandı!', time: '3 gün önce', read: true, type: 'chapter', manhwaId: 10 },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('anipeak_user');
      if (!s) return null;
      const parsed = JSON.parse(s);
      // Admin e-postası ise rolü her zaman Yönetici yap (Güvenlik & Yetki Senkronizasyonu)
      if (parsed.email === 'murathanozel134@gmail.com') {
        parsed.role = 'Yönetici';
        parsed.isPremium = true;
      }
      return parsed;
    } catch { return null; }
  });

  const [readingHistory, setReadingHistory] = useState(() => {
    try {
      const s = localStorage.getItem('anipeak_history');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const sendNotification = (title, message, type = 'info') => {
    const notifyData = {
      id: Date.now(),
      text: `[${type.toUpperCase()}] ${title}: ${message}`,
      time: 'Az önce',
      read: false
    };
    setNotifications(prev => [notifyData, ...prev]);
  };

  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    return localStorage.getItem('anipeak_maintenance') === 'true';
  });

  const toggleMaintenance = (status) => {
    setMaintenanceMode(status);
    localStorage.setItem('anipeak_maintenance', status);
  };

  const login = ({ username, email, password }) => {
    let role = 'Kullanıcı';
    let finalUsername = username || email.split('@')[0];

    // Özel Yönetici Hesabı (E-posta kontrolü yeterli)
    if (email === 'murathanozel134@gmail.com') {
      role = 'Yönetici';
      finalUsername = username || 'Yönetici';
    } 
    // Diğer test hesapları
    else if (email === 'basadmin@anipeak.com') {
      role = 'Baş Admin';
    } else if (email === 'admin@anipeak.com') {
      role = 'Admin';
    } else if (email === 'yardimci@anipeak.com') {
      role = 'Admin Yardımcısı';
    }

    const userData = {
      id: Date.now(),
      username: finalUsername,
      email,
      role,
      avatar: null,
      joinDate: new Date().toISOString(),
      isPremium: role === 'Yönetici' ? true : false,
      totalRead: 0,
    };


    setUser(userData);
    localStorage.setItem('anipeak_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('anipeak_user');
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('anipeak_user', JSON.stringify(updated));
  };

  const addToHistory = (manhwaId, chapter) => {
    setReadingHistory((prev) => {
      const existing = prev.find((h) => h.manhwaId === manhwaId);
      let updated;
      if (existing) {
        updated = prev.map((h) =>
          h.manhwaId === manhwaId
            ? { ...h, lastChapter: chapter, lastRead: new Date().toISOString() }
            : h
        );
      } else {
        updated = [
          { manhwaId, lastChapter: chapter, lastRead: new Date().toISOString() },
          ...prev,
        ];
      }
      localStorage.setItem('anipeak_history', JSON.stringify(updated));
      return updated;
    });
    if (user) updateUser({ totalRead: (user.totalRead || 0) + 1 });
  };

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        readingHistory,
        addToHistory,
        notifications,
        markAllRead,
        unreadCount,
        maintenanceMode,
        toggleMaintenance,
        sendNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
