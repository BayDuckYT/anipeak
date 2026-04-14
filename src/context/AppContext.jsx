/**
 * AppContext — AniPeak Global Data Store
 * Manages: series chapters, announcements, registered users, trending state
 * Persistence: localStorage (simulated DB for frontend-only deployment)
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { manhwaData } from '../data/mockData.js';

const AppContext = createContext(null);

// ── Build initial chapter data from manhwaData
function buildInitialChapters() {
  const result = {};
  const titlesPool = [
    'Uyanış', 'İlk Adım', 'Karanlık Yol', 'Sır', 'Çatışma',
    'Dönüşüm', 'Zirve', 'Kayıp', 'Yeniden Doğuş', 'Son Karar',
    'Kader', 'İhanet', 'Güç Sınırı', 'Kristal Kule', 'Son Nefes',
  ];

  manhwaData.forEach((m) => {
    const chapters = [];
    for (let i = m.chapters; i >= 1; i--) {
      const idx = m.chapters - i;
      const daysAgo =
        idx === 0 ? 0 : idx < 3 ? idx : idx * 3 + (idx % 5);
      chapters.push({
        id: `${m.id}-ch-${i}`,
        number: i,
        title: titlesPool[idx % titlesPool.length] || null,
        isNew: idx < 2,
        hasNewBadge: false, // set by admin publish action
        isPremium: i > m.chapters - 5 && idx > 0,
        date:
          daysAgo === 0
            ? 'Bugün'
            : daysAgo === 1
            ? 'Dün'
            : `${daysAgo} gün önce`,
        views: 10000 + (m.chapters - i) * 1500 + idx * 200,
        likes: 200 + idx * 80,
        pages: [
          `https://picsum.photos/seed/${m.id}ch${i}p1/800/1200`,
          `https://picsum.photos/seed/${m.id}ch${i}p2/800/1200`,
          `https://picsum.photos/seed/${m.id}ch${i}p3/800/1200`,
        ],
        publishedAt: new Date(
          Date.now() - daysAgo * 86400000
        ).toISOString(),
      });
    }
    result[m.id] = chapters;
  });
  return result;
}

// ── Load/save from localStorage
function loadKey(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed || fallback;
  } catch (error) {
    console.warn(`[Kozmik Hata] ${key} yüklenemedi:`, error);
    return fallback;
  }
}
function saveKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[Kozmik Hata] ${key} kaydedilemedi:`, error);
  }
}

// ── Initial announcements
const SEED_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    type: 'chapter',
    text: "Ölümsüzlerin Oyunu'nun 89. Bölümü Yayında! 🔥",
    seriesId: 5,
    chapterNum: 89,
    time: '5 dk önce',
    ts: Date.now() - 300000,
  },
  {
    id: 'ann-2',
    type: 'chapter',
    text: "Gece Yarısı Efsanesi'nin 187. Bölümü Yayında!",
    seriesId: 1,
    chapterNum: 187,
    time: '2 sa önce',
    ts: Date.now() - 7200000,
  },
  {
    id: 'ann-3',
    type: 'system',
    text: 'AniPeak v2.0 — Bölüm Editörü ve Webtoon Önizleme aktif!',
    ts: Date.now() - 86400000,
    time: '1 gün önce',
  },
];

// ── Initial series state (isTrending, newChapterBadge, reads)
function buildInitialSeries() {
  return manhwaData.map((m, i) => ({
    ...m,
    isTrending: i < 3,
    hasNewChapter: i < 2,
    readsNum: m.views || 0,
    status: m.status,
    isDeleted: false,
  }));
}

export function AppProvider({ children }) {
  // ── Chapters: { [seriesId]: Chapter[] }
  const [chapters, setChapters] = useState(() =>
    loadKey('anipeak_chapters', buildInitialChapters())
  );

  // ── Series list (with dynamic trending/status)
  const [series, setSeries] = useState(() =>
    loadKey('anipeak_series', buildInitialSeries())
  );

  // ── Announcements
  const [announcements, setAnnouncements] = useState(() =>
    loadKey('anipeak_announcements', SEED_ANNOUNCEMENTS)
  );

  // ── Registered users table (admin view)
  const [registeredUsers, setRegisteredUsers] = useState(() =>
    loadKey('anipeak_registered_users', [
      {
        id: 'u-1',
        username: 'Yönetici',
        email: 'murathanozel134@gmail.com',
        role: 'Yönetici',
        status: 'Aktif',
        premium: true,
        joinDate: '2024-01-01',
        totalRead: 0,
        provider: 'email',
      },
      {
        id: 'u-2',
        username: 'basadmin',
        email: 'basadmin@anipeak.com',
        role: 'Baş Admin',
        status: 'Aktif',
        premium: true,
        joinDate: '2024-02-10',
        totalRead: 0,
        provider: 'email',
      },
      {
        id: 'u-3',
        username: 'galaksi_okuyucu',
        email: 'galaksi@mail.com',
        role: 'Kullanıcı',
        status: 'Aktif',
        premium: false,
        joinDate: '2024-03-15',
        totalRead: 47,
        provider: 'google',
      },
      {
        id: 'u-4',
        username: 'neon_rider',
        email: 'neon@mail.com',
        role: 'Kullanıcı',
        status: 'Aktif',
        premium: true,
        joinDate: '2024-04-02',
        totalRead: 128,
        provider: 'email',
      },
    ])
  );

  const persist = useCallback((key, value) => {
    try {
      saveKey(key, value);
    } catch (err) {
      console.error("Persist hatası:", err);
    }
  }, []);

  // ─────────────────────────────────────────────
  //  Chapter CRUD
  // ─────────────────────────────────────────────

  /** Get all chapters for a series (sorted newest first) */
  const getChapters = useCallback(
    (seriesId) => chapters[seriesId] || [],
    [chapters]
  );

  /** Add a new chapter + auto-announce + auto-trend */
  const addChapter = useCallback(
    (seriesId, { number, title, pages, isPremium = false }) => {
      const now = Date.now();
      const newChapter = {
        id: `${seriesId}-ch-${number}-${now}`,
        number,
        title: title || null,
        isNew: true,
        hasNewBadge: true,
        isPremium,
        date: 'Bugün',
        views: 0,
        likes: 0,
        pages: pages || [],
        publishedAt: new Date(now).toISOString(),
      };

      setChapters((prev) => {
        // Remove existing chapter with same number (overwrite)
        const existing = (prev[seriesId] || []).filter(
          (ch) => ch.number !== number
        );
        const updated = [newChapter, ...existing].sort(
          (a, b) => b.number - a.number
        );
        const next = { ...prev, [seriesId]: updated };
        persist('anipeak_chapters', next);
        return next;
      });

      // Auto-trend: bump this series to top
      setSeries((prev) => {
        const updated = prev.map((s) =>
          s.id === seriesId
            ? { ...s, isTrending: true, hasNewChapter: true }
            : s
        );
        persist('anipeak_series', updated);
        return updated;
      });

      // Auto-announcement
      const targetSeries = series.find((s) => s.id === seriesId);
      const annTitle = targetSeries?.title || `Seri #${seriesId}`;
      const ann = {
        id: `ann-${now}`,
        type: 'chapter',
        text: `🔥 ${annTitle}'nin ${number}. Bölümü Yayında!`,
        seriesId,
        chapterNum: number,
        time: 'Az önce',
        ts: now,
      };
      setAnnouncements((prev) => {
        const next = [ann, ...prev].slice(0, 20);
        persist('anipeak_announcements', next);
        return next;
      });

      return newChapter;
    },
    [series, persist]
  );

  /** Update an existing chapter */
  const updateChapter = useCallback(
    (seriesId, chapterId, updates) => {
      setChapters((prev) => {
        const list = prev[seriesId] || [];
        const updated = list.map((ch) =>
          ch.id === chapterId ? { ...ch, ...updates } : ch
        );
        const next = { ...prev, [seriesId]: updated };
        persist('anipeak_chapters', next);
        return next;
      });
    },
    [persist]
  );

  /** Delete a chapter */
  const deleteChapter = useCallback(
    (seriesId, chapterId) => {
      setChapters((prev) => {
        const updated = (prev[seriesId] || []).filter(
          (ch) => ch.id !== chapterId
        );
        const next = { ...prev, [seriesId]: updated };
        persist('anipeak_chapters', next);
        return next;
      });
    },
    [persist]
  );

  // ─────────────────────────────────────────────
  //  Series CRUD
  // ─────────────────────────────────────────────

  const addSeries = useCallback(
    (seriesData) => {
      const newSeries = {
        id: Date.now(), // Unique ID
        ...seriesData,
        rating: '0.0',
        reads: '0',
        readsNum: 0,
        chapters: 0,
        isTrending: true,
        hasNewChapter: true,
        isDeleted: false,
        genre: Array.isArray(seriesData.genre) ? seriesData.genre : seriesData.genre ? [seriesData.genre] : [],
      };

      setSeries((prev) => {
        const next = [newSeries, ...prev];
        persist('anipeak_series', next);
        return next;
      });

      // Auto-announcement for new Series
      const ann = {
        id: `ann-${Date.now()}`,
        type: 'series',
        text: `✨ Yeni Seri: "${seriesData.title}" Evrene Düştü!`,
        seriesId: newSeries.id,
        time: 'Az önce',
        ts: Date.now(),
      };
      setAnnouncements((prev) => {
        const next = [ann, ...prev].slice(0, 20);
        persist('anipeak_announcements', next);
        return next;
      });

      return newSeries;
    },
    [persist]
  );

  const deleteSeries = useCallback(
    (seriesId) => {
      setSeries((prev) => {
        const next = prev.filter((s) => s.id !== seriesId);
        persist('anipeak_series', next);
        return next;
      });

      // Cleanup associated chapters
      setChapters((prev) => {
        const next = { ...prev };
        delete next[seriesId];
        persist('anipeak_chapters', next);
        return next;
      });
    },
    [persist]
  );

  const updateSeries = useCallback(
    (seriesId, updates) => {
      setSeries((prev) => {
        const next = prev.map((s) => (s.id === seriesId ? { ...s, ...updates } : s));
        persist('anipeak_series', next);
        return next;
      });
    },
    [persist]
  );

  const toggleTrend = useCallback(
    (seriesId) => {
      setSeries((prev) => {
        const updated = prev.map((s) =>
          s.id === seriesId ? { ...s, isTrending: !s.isTrending } : s
        );
        persist('anipeak_series', updated);
        return updated;
      });
    },
    [persist]
  );

  const toggleStatus = useCallback(
    (seriesId) => {
      setSeries((prev) => {
        const updated = prev.map((s) =>
          s.id === seriesId
            ? {
                ...s,
                status:
                  s.status === 'Devam Ediyor' ? 'Tamamlandı' : 'Devam Ediyor',
              }
            : s
        );
        persist('anipeak_series', updated);
        return updated;
      });
    },
    [persist]
  );

  const updateSeriesReads = useCallback(
    (seriesId, readsNum) => {
      setSeries((prev) => {
        const updated = prev.map((s) =>
          s.id === seriesId ? { ...s, readsNum } : s
        );
        persist('anipeak_series', updated);
        return updated;
      });
    },
    [persist]
  );

  // Sort: trending first, then by hasNewChapter, then by reads
  const sortedSeries = [...series].sort((a, b) => {
    if (a.isTrending !== b.isTrending) return a.isTrending ? -1 : 1;
    if (a.hasNewChapter !== b.hasNewChapter)
      return a.hasNewChapter ? -1 : 1;
    return (b.readsNum || 0) - (a.readsNum || 0);
  });

  // ─────────────────────────────────────────────
  //  User Management (Admin)
  // ─────────────────────────────────────────────

  const registerUser = useCallback(
    ({ username, email, provider = 'email' }) => {
      setRegisteredUsers((prev) => {
        // Don't duplicate
        if (prev.some((u) => u.email === email)) return prev;
        const newUser = {
          id: `u-${Date.now()}`,
          username,
          email,
          role: 'Kullanıcı',
          status: 'Aktif',
          premium: false,
          joinDate: new Date().toISOString().split('T')[0],
          totalRead: 0,
          provider,
        };
        const updated = [...prev, newUser];
        persist('anipeak_registered_users', updated);
        return updated;
      });
    },
    [persist]
  );

  const updateRegisteredUser = useCallback(
    (userId, updates) => {
      setRegisteredUsers((prev) => {
        const updated = prev.map((u) =>
          u.id === userId ? { ...u, ...updates } : u
        );
        persist('anipeak_registered_users', updated);
        return updated;
      });
    },
    [persist]
  );

  const deleteRegisteredUser = useCallback(
    (userId) => {
      setRegisteredUsers((prev) => {
        const updated = prev.filter((u) => u.id !== userId);
        persist('anipeak_registered_users', updated);
        return updated;
      });
    },
    [persist]
  );

  // ─────────────────────────────────────────────
  //  Announcements
  // ─────────────────────────────────────────────

  const addAnnouncement = useCallback(
    (text, type = 'system') => {
      const ann = {
        id: `ann-${Date.now()}`,
        type,
        text,
        ts: Date.now(),
        time: 'Az önce',
      };
      setAnnouncements((prev) => {
        const next = [ann, ...prev].slice(0, 20);
        persist('anipeak_announcements', next);
        return next;
      });
    },
    [persist]
  );

  return (
    <AppContext.Provider
      value={{
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
