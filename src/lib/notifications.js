/**
 * MahoraPeak Bildirim Motoru v2
 * Tek kaynak: tip kayıt defteri, tercih çözümleme, filtreleme, normalize etme,
 * zaman biçimlendirme, ses ve tarayıcı bildirimi yardımcıları.
 */
import {
  Bell, BookOpen, Sparkles, MessageCircle, AtSign, Heart, AlertTriangle,
  PartyPopper, Wrench, Rocket, CalendarClock, Info, Gift, Send,
} from 'lucide-react';

// ── Tip Kayıt Defteri ────────────────────────────────────────────────────────
// category: tercih anahtarlarını ve sekmeleri belirler.
export const NOTIF_TYPES = {
  chapter:     { label: 'Yeni Bölüm',   category: 'chapter',   icon: BookOpen,      accent: '#34d399', gradient: 'from-emerald-500 to-teal-600',  title: 'Yeni bölüm yayında' },
  new_chapter: { label: 'Yeni Bölüm',   category: 'chapter',   icon: BookOpen,      accent: '#34d399', gradient: 'from-emerald-500 to-teal-600',  title: 'Yeni bölüm yayında' },
  series:      { label: 'Yeni Seri',    category: 'series',    icon: Sparkles,      accent: '#60a5fa', gradient: 'from-sky-500 to-indigo-600',     title: 'Yeni seri eklendi' },
  new_series:  { label: 'Yeni Seri',    category: 'series',    icon: Sparkles,      accent: '#60a5fa', gradient: 'from-sky-500 to-indigo-600',     title: 'Yeni seri eklendi' },
  schedule:    { label: 'Takvim',       category: 'schedule',  icon: CalendarClock, accent: '#a78bfa', gradient: 'from-violet-500 to-purple-700',  title: 'Takvim hatırlatıcısı' },
  reply:       { label: 'Yanıt',        category: 'social',    icon: MessageCircle, accent: '#f472b6', gradient: 'from-pink-500 to-rose-600',      title: 'Yorumuna yanıt geldi' },
  mention:     { label: 'Etiket',       category: 'social',    icon: AtSign,        accent: '#f472b6', gradient: 'from-fuchsia-500 to-pink-600',   title: 'Seni etiketlediler' },
  like:        { label: 'Beğeni',       category: 'social',    icon: Heart,         accent: '#fb7185', gradient: 'from-rose-500 to-red-600',       title: 'Yorumun beğenildi' },
  system:      { label: 'Sistem',       category: 'system',    icon: Info,          accent: '#94a3b8', gradient: 'from-slate-500 to-slate-700',    title: 'Sistem duyurusu' },
  update:      { label: 'Güncelleme',   category: 'system',    icon: Rocket,        accent: '#38bdf8', gradient: 'from-cyan-500 to-blue-600',      title: 'Yeni güncelleme' },
  maintenance: { label: 'Bakım',        category: 'system',    icon: Wrench,        accent: '#fbbf24', gradient: 'from-amber-500 to-orange-600',   title: 'Planlı bakım' },
  event:       { label: 'Etkinlik',     category: 'event',     icon: PartyPopper,   accent: '#c084fc', gradient: 'from-purple-500 to-fuchsia-600', title: 'Yeni etkinlik' },
  promo:       { label: 'Kampanya',     category: 'event',     icon: Gift,          accent: '#facc15', gradient: 'from-yellow-400 to-amber-600',   title: 'Özel kampanya' },
  important:   { label: 'Kritik',       category: 'important', icon: AlertTriangle, accent: '#f87171', gradient: 'from-red-500 to-rose-700',       title: 'Önemli duyuru' },
  direct:      { label: 'Özel Mesaj',   category: 'direct',    icon: Send,          accent: '#e879f9', gradient: 'from-fuchsia-500 to-violet-700', title: 'Yönetimden mesaj' },
  info:        { label: 'Bilgi',        category: 'system',    icon: Bell,          accent: '#94a3b8', gradient: 'from-slate-500 to-slate-700',    title: 'Bildirim' },
};

export const getTypeMeta = (type) => NOTIF_TYPES[type] || NOTIF_TYPES.info;

// Admin panelinde elle seçilebilen duyuru tipleri
export const ADMIN_ANNOUNCEMENT_TYPES = ['system', 'update', 'event', 'promo', 'maintenance', 'important'];

// Bildirim merkezi sekmeleri
export const NOTIF_TABS = [
  { id: 'all',     label: 'Tümü',      match: () => true },
  { id: 'reading', label: 'Okuma',     match: (n) => ['chapter', 'series', 'schedule'].includes(n.category) },
  { id: 'social',  label: 'Sosyal',    match: (n) => n.category === 'social' || n.category === 'direct' },
  { id: 'news',    label: 'Duyurular', match: (n) => ['system', 'event', 'important'].includes(n.category) },
];

export const AUDIENCES = {
  all:     { label: 'Herkes' },
  premium: { label: 'Premium Üyeler' },
  staff:   { label: 'Yetkililer' },
};

// ── Tercihler ───────────────────────────────────────────────────────────────
export const DEFAULT_NOTIF_SETTINGS = {
  newChapter: true,          // tüm yeni bölüm duyuruları
  newSeries: true,           // yeni seri duyuruları
  replies: true,             // yanıt / etiket / beğeni
  events: true,              // etkinlik & kampanya
  system: true,              // sistem, güncelleme, bakım
  schedule: true,            // takip edilen serilerin bölümleri her zaman gelsin
  scheduleReminders: true,   // takvimde yayın günü hatırlatıcısı
  onlyTracked: false,        // bölüm bildirimlerini yalnızca takip edilen serilerle sınırla
  scheduleSeriesIds: [],
  toast: true,               // sitede anlık açılır bildirim
  sound: false,              // bildirim sesi
  browserPush: false,        // sekme arka plandayken tarayıcı bildirimi
  quietHours: { enabled: false, start: '23:00', end: '08:00' },
};

export function resolveNotifSettings(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    ...DEFAULT_NOTIF_SETTINGS,
    ...src,
    scheduleSeriesIds: Array.isArray(src.scheduleSeriesIds) ? src.scheduleSeriesIds.map(String) : [],
    quietHours: { ...DEFAULT_NOTIF_SETTINGS.quietHours, ...(src.quietHours || {}) },
  };
}

const toMinutes = (hhmm = '00:00') => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

export function isQuietTime(settings, now = new Date()) {
  const q = settings?.quietHours;
  if (!q?.enabled) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(q.start);
  const end = toMinutes(q.end);
  if (start === end) return false;
  return start < end ? cur >= start && cur < end : cur >= start || cur < end;
}

/**
 * Bir bildirimin kullanıcıya gösterilip gösterilmeyeceğine karar verir.
 * ctx: { settings, tracked:Set<string>, isPremium, isStaff }
 */
export function shouldShowNotification(n, ctx) {
  const { settings: s, tracked, isPremium, isStaff } = ctx;
  if (n.expiresAt && n.expiresAt < Date.now()) return false;
  if (n.audience === 'premium' && !isPremium && !isStaff) return false;
  if (n.audience === 'staff' && !isStaff) return false;

  switch (n.category) {
    case 'important':
    case 'direct':
      return true;
    case 'chapter': {
      const isTracked = n.seriesId && tracked.has(String(n.seriesId));
      if (isTracked && s.schedule !== false) return true;
      if (s.newChapter === false) return false;
      if (s.onlyTracked) return false;
      return true;
    }
    case 'series':   return s.newSeries !== false;
    case 'social':   return s.replies !== false;
    case 'event':    return s.events !== false;
    case 'schedule': return s.schedule !== false && s.scheduleReminders !== false;
    case 'system':
    default:
      return s.system !== false;
  }
}

// ── Normalize ───────────────────────────────────────────────────────────────
const ts = (v) => (v ? new Date(v).getTime() : null);

export function normalizeAnnouncement(a, readIds = []) {
  const meta = getTypeMeta(a.type || 'system');
  return {
    id: `ann_${a.id}`,
    originalId: a.id,
    source: 'announcement',
    type: a.type || 'system',
    category: meta.category,
    title: a.title || null,
    text: a.text || '',
    link: a.link || null,
    imageUrl: a.image_url || null,
    audience: a.audience || 'all',
    pinned: Boolean(a.pinned),
    priority: a.priority || (a.type === 'important' ? 'high' : 'normal'),
    createdAt: ts(a.created_at) || Date.now(),
    expiresAt: ts(a.expires_at),
    read: readIds.includes(Number(a.id)),
    seriesId: a.series_id || null,
    chapterNum: a.chapter_num ?? null,
  };
}

export function normalizePersonal(p) {
  const meta = getTypeMeta(p.type || 'info');
  return {
    id: `notif_${p.id}`,
    originalId: p.id,
    source: 'personal',
    type: p.type || 'info',
    category: meta.category,
    title: p.title || null,
    text: p.message || p.text || 'Yeni bildirim',
    link: p.link || null,
    imageUrl: p.image_url || null,
    audience: 'all',
    pinned: false,
    priority: p.type === 'direct' ? 'high' : 'normal',
    createdAt: ts(p.created_at) || Date.now(),
    expiresAt: null,
    read: Boolean(p.is_read),
    seriesId: p.series_id || null,
    chapterNum: p.chapter_num ?? null,
    fromUsername: p.from_username || null,
  };
}

const normalizeName = (v) => String(v || '').trim().toLocaleLowerCase('tr-TR');

export function resolveScheduleSeriesId(item, seriesList = []) {
  if (item.series_id) return String(item.series_id);
  const target = normalizeName(item.series_name);
  const match = seriesList.find((s) => normalizeName(s.title) === target);
  return match ? String(match.id) : null;
}

/**
 * Bugünün yayın takviminden, takip edilen seriler için hatırlatıcı üretir.
 * Yayın saati geçince "şimdi yayında" fazına geçer (yeni id → yeni toast).
 */
export function buildScheduleReminders(items, trackedIds, seriesList, readLocalIds, now = Date.now()) {
  if (!items?.length || !trackedIds?.length) return [];
  const tracked = new Set(trackedIds.map(String));
  const out = [];
  for (const item of items) {
    const seriesId = resolveScheduleSeriesId(item, seriesList);
    if (!seriesId || !tracked.has(seriesId)) continue;
    const time = (item.release_time || '00:00').slice(0, 5);
    const releaseTs = new Date(`${item.release_date}T${time}:00`).getTime();
    const live = Number.isFinite(releaseTs) ? releaseTs <= now : true;
    const id = `sched_${item.id}_${item.release_date}_${live ? 'live' : 'soon'}`;
    const dayStart = new Date(`${item.release_date}T00:00:00`).getTime();
    out.push({
      id,
      originalId: item.id,
      source: 'schedule',
      type: 'schedule',
      category: 'schedule',
      title: live ? `${item.series_name} şimdi yayında!` : `${item.series_name} bugün yayında`,
      text: live
        ? `${item.chapter_info || 'Yeni bölüm'} yayınlandı. Hemen okumaya başla.`
        : `${item.chapter_info || 'Yeni bölüm'} bugün saat ${time}'de geliyor.`,
      link: null,
      imageUrl: item.poster_url || null,
      audience: 'all',
      pinned: false,
      priority: 'normal',
      createdAt: live ? releaseTs : Math.max(dayStart, now - 60_000),
      expiresAt: null,
      read: readLocalIds.includes(id),
      seriesId,
      chapterNum: null,
    });
  }
  return out;
}

export function sortNotifications(list) {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt - a.createdAt;
  });
}

// ── Zaman ───────────────────────────────────────────────────────────────────
export function timeAgo(timestamp, now = Date.now()) {
  if (!timestamp) return '';
  const diff = Math.max(0, now - timestamp);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'şimdi';
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'dün';
  if (day < 7) return `${day} gün önce`;
  return new Date(timestamp).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export function timeLeft(expiresAt, now = Date.now()) {
  if (!expiresAt) return 'Süresiz';
  const diff = expiresAt - now;
  if (diff <= 0) return 'Süresi doldu';
  const hr = Math.floor(diff / 3_600_000);
  if (hr < 1) return `${Math.max(1, Math.floor(diff / 60_000))} dk kaldı`;
  if (hr < 24) return `${hr} sa kaldı`;
  return `${Math.floor(hr / 24)} gün kaldı`;
}

export function groupByDay(list) {
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const t0 = startOfToday.getTime();
  const DAY = 86_400_000;
  const groups = [
    { id: 'pinned', label: 'Sabitlenmiş', items: [] },
    { id: 'today', label: 'Bugün', items: [] },
    { id: 'yesterday', label: 'Dün', items: [] },
    { id: 'week', label: 'Bu Hafta', items: [] },
    { id: 'older', label: 'Daha Eski', items: [] },
  ];
  for (const n of list) {
    if (n.pinned) groups[0].items.push(n);
    else if (n.createdAt >= t0) groups[1].items.push(n);
    else if (n.createdAt >= t0 - DAY) groups[2].items.push(n);
    else if (n.createdAt >= t0 - 6 * DAY) groups[3].items.push(n);
    else groups[4].items.push(n);
  }
  return groups.filter((g) => g.items.length);
}

export const localDateString = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ── Yerel depolama (kaldırılan / yerel okunan) ──────────────────────────────
const storageKey = (userId, kind) => `mp_notif_${kind}_${userId}`;

export function loadLocalList(userId, kind) {
  if (!userId) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(userId, kind)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveLocalList(userId, kind, list) {
  if (!userId) return;
  try {
    // Sınırsız büyümesin
    localStorage.setItem(storageKey(userId, kind), JSON.stringify(list.slice(-400)));
  } catch { /* depolama dolu olabilir */ }
}

// ── Ses ─────────────────────────────────────────────────────────────────────
let audioCtx = null;
export function playNotificationSound(priority = 'normal') {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    const notes = priority === 'high' ? [880, 660, 880] : [740, 988];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const t = audioCtx.currentTime + i * 0.12;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch { /* ses desteklenmiyor */ }
}

// ── Tarayıcı Bildirimi ─────────────────────────────────────────────────────
export const browserPushSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export async function requestBrowserPermission() {
  if (!browserPushSupported()) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') return Notification.permission;
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}

export function showBrowserNotification(n) {
  if (!browserPushSupported() || Notification.permission !== 'granted') return;
  try {
    const meta = getTypeMeta(n.type);
    const notif = new Notification(n.title || meta.title, {
      body: n.text,
      icon: n.imageUrl || '/favicon.ico',
      tag: n.id,
    });
    notif.onclick = () => { window.focus(); notif.close(); };
  } catch { /* bazı mobil tarayıcılar desteklemez */ }
}

// ── Şema uyumlu ekleme ─────────────────────────────────────────────────────
// Migration çalıştırılmadıysa bilinmeyen kolonları atıp temel alanlarla tekrar dener.
export async function insertWithFallback(client, table, payload, basicKeys, transformBasic) {
  let res = await client.from(table).insert([payload]).select().single();
  if (res.error && /column|schema cache/i.test(res.error.message || '')) {
    let basic = Object.fromEntries(Object.entries(payload).filter(([k]) => basicKeys.includes(k)));
    if (transformBasic) basic = transformBasic(basic, payload);
    res = await client.from(table).insert([basic]).select().single();
    if (!res.error) res.data = { ...res.data, __legacy: true };
  }
  if (res.error) throw res.error;
  return res.data;
}
