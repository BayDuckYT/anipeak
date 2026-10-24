import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, Trash2, Pin, ExternalLink, Settings,
  Calendar, Check, Sparkles, BookOpen, Clock, ChevronRight, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import {
  getTypeMeta,
  NOTIF_TABS,
  groupByDay,
  timeAgo,
} from '../lib/notifications.js';
import { getOptimizedImage, handleImageError } from '../utils/imageOpt.js';

export default function NotificationCenter({ onClose, onAuthOpen }) {
  const [activeTab, setActiveTab] = useState('all');
  const [hoveredId, setHoveredId] = useState(null);

  const {
    user,
    notifications = [],
    unreadCount,
    markAllRead,
    markNotificationRead,
    dismissNotification,
    clearAllNotifications,
    notificationsLoading,
  } = useAuth();

  const { series = [] } = useApp();
  const navigate = useNavigate();

  // Tab filter
  const currentTabDef = NOTIF_TABS.find((t) => t.id === activeTab) || NOTIF_TABS[0];
  const filteredNotifications = useMemo(() => {
    return notifications.filter(currentTabDef.match);
  }, [notifications, currentTabDef]);

  const groups = useMemo(() => {
    return groupByDay(filteredNotifications);
  }, [filteredNotifications]);

  const handleItemClick = async (item) => {
    if (!item.read) {
      await markNotificationRead(item.id);
    }
    onClose?.();

    if (item.link) {
      if (item.link.startsWith('http')) {
        window.open(item.link, '_blank');
      } else {
        navigate(item.link);
      }
      return;
    }

    if (item.seriesId) {
      const target = series.find((s) => String(s.id) === String(item.seriesId));
      if (target?.slug) {
        navigate(`/manga/${target.slug}`);
        return;
      }
    }

    if (item.source === 'schedule') {
      navigate('/takvim');
    }
  };

  const getSeriesCover = (seriesId) => {
    if (!seriesId) return null;
    const match = series.find((s) => String(s.id) === String(seriesId));
    return match?.cover || null;
  };

  return (
    <div className="w-[min(26rem,calc(100vw-1.5rem))] flex flex-col max-h-[82vh] overflow-hidden rounded-3xl bg-[#0a0718]/95 backdrop-blur-2xl border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.85)] text-slate-200">
      {/* ── Üst Başlık & Aksiyonlar ── */}
      <div className="px-5 pt-4 pb-3 border-b border-white/8 bg-white/[0.02]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Bell size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-black tracking-tight">Bildirimler</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600/20 text-red-400 border border-red-500/30">
                    {unreadCount} yeni
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-semibold">
                {notifications.length} bildirim kaydı
              </p>
            </div>
          </div>

          {user && notifications.length > 0 && (
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-purple-300 hover:text-white hover:bg-white/5 border border-purple-500/20 hover:border-purple-500/40 transition-all flex items-center gap-1 active:scale-95"
                  title="Tümünü okundu işaretle"
                >
                  <CheckCheck size={13} />
                  <span className="hidden sm:inline">Tümü Okundu</span>
                </button>
              )}
              <button
                type="button"
                onClick={clearAllNotifications}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Tümünü temizle"
                aria-label="Tümünü temizle"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── Sekmeler ── */}
        {user && (
          <div className="flex items-center gap-1 mt-3 p-1 rounded-xl bg-black/40 border border-white/5">
            {NOTIF_TABS.map((tab) => {
              const count = notifications.filter(tab.match).filter((n) => !n.read).length;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all relative flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/30 to-red-600/30 text-white border border-white/10 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Liste İçeriği ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5 min-h-[220px]">
        {!user ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600/20 to-purple-600/20 border border-white/10 flex items-center justify-center mx-auto mb-3 text-red-400">
              <Bell size={26} />
            </div>
            <h4 className="text-white text-sm font-bold mb-1">Bildirimleri Görmek İçin Giriş Yap</h4>
            <p className="text-slate-400 text-xs mb-5 leading-relaxed">
              Takip ettiğin serilerin yeni bölümleri ve sistem duyuruları burada toplanır.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onAuthOpen?.('login');
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg active:scale-95 transition-all"
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onAuthOpen?.('register');
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-black bg-white/10 hover:bg-white/15 text-white border border-white/10 active:scale-95 transition-all"
              >
                Kayıt Ol
              </button>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-3">
              <Check size={22} className="text-emerald-400" />
            </div>
            <p className="text-white text-xs font-bold mb-1">Tertemiz!</p>
            <p className="text-slate-500 text-[11px] max-w-xs leading-relaxed">
              {activeTab === 'all'
                ? 'Okunacak yeni bir bildirim bulunmuyor.'
                : `${currentTabDef.label} kategorisinde henüz bildirim yok.`}
            </p>
          </div>
        ) : (
          groups.map((grp) => (
            <div key={grp.id} className="py-2">
              <div className="px-5 py-1.5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {grp.label}
                </span>
                <span className="text-[10px] font-bold text-slate-600">
                  {grp.items.length}
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {grp.items.map((n) => {
                  const meta = getTypeMeta(n.type);
                  const Icon = meta.icon;
                  const cover = n.imageUrl || getSeriesCover(n.seriesId);
                  const isHovered = hoveredId === n.id;

                  return (
                    <div
                      key={n.id}
                      onMouseEnter={() => setHoveredId(n.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleItemClick(n)}
                      className={`relative flex items-start gap-3 px-5 py-3.5 transition-all cursor-pointer group ${
                        !n.read
                          ? 'bg-gradient-to-r from-purple-500/10 via-transparent to-transparent'
                          : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      {/* Sol Okunmadı İndikatörü */}
                      {!n.read && (
                        <div
                          className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: meta.accent }}
                        />
                      )}

                      {/* İkon / Kapak Görseli */}
                      <div className="relative shrink-0 mt-0.5">
                        {cover ? (
                          <div className="relative w-10 h-13 rounded-lg overflow-hidden border border-white/15 bg-black">
                            <img
                              src={getOptimizedImage(cover, 80)}
                              alt="Kapak"
                              onError={handleImageError}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div
                              className="absolute bottom-0 right-0 p-1 rounded-tl bg-black/80 text-white"
                              style={{ color: meta.accent }}
                            >
                              <Icon size={10} />
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ${meta.gradient}`}
                          >
                            <Icon size={18} />
                          </div>
                        )}
                        {n.pinned && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center shadow">
                            <Pin size={9} />
                          </div>
                        )}
                      </div>

                      {/* Metin ve Detaylar */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="text-[10px] font-black uppercase tracking-wider"
                              style={{ color: meta.accent }}
                            >
                              {meta.label}
                            </span>
                            {n.tracked && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Takipte
                              </span>
                            )}
                            {n.priority === 'high' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/30">
                                Önemli
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>

                        {n.title && (
                          <h5 className="text-white text-xs font-bold line-clamp-1 mb-0.5">
                            {n.title}
                          </h5>
                        )}

                        <p className={`text-xs leading-relaxed ${!n.read ? 'text-slate-200 font-medium' : 'text-slate-400'} line-clamp-2`}>
                          {n.text}
                        </p>

                        <div className="flex items-center justify-between gap-2 mt-1.5">
                          <div className="flex items-center gap-2">
                            {n.chapterNum && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                Bölüm {n.chapterNum}
                              </span>
                            )}
                            {n.link && (
                              <span className="text-[10px] text-sky-400 flex items-center gap-0.5 hover:underline">
                                <ExternalLink size={10} /> Link
                              </span>
                            )}
                          </div>

                          {/* Hover Aksiyonları */}
                          <div
                            className={`flex items-center gap-1 transition-opacity ${
                              isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!n.read && (
                              <button
                                type="button"
                                onClick={() => markNotificationRead(n.id)}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="Okundu işaretle"
                              >
                                <Check size={12} />
                              </button>
                            )}
                            {!n.pinned && (
                              <button
                                type="button"
                                onClick={() => dismissNotification(n.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Kaldır"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Alt Çubuk (Hızlı Ayarlar & Takvim) ── */}
      {user && (
        <div className="p-3 border-t border-white/8 bg-black/40 flex items-center justify-between text-xs font-bold">
          <Link
            to="/takvim"
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-400 hover:text-purple-300 transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
          >
            <Calendar size={13} className="text-purple-400" />
            <span>Yayın Takvimi</span>
          </Link>

          <Link
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/5"
          >
            <Settings size={13} className="text-slate-400" />
            <span>Bildirim Ayarları</span>
            <ChevronRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}
