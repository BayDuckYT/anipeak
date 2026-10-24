import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import {
  getTypeMeta,
  playNotificationSound,
  showBrowserNotification,
  isQuietTime,
} from '../lib/notifications.js';

export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);
  const { user, notificationSettings, markNotificationRead } = useAuth();
  const { series = [] } = useApp();
  const navigate = useNavigate();

  const handleDismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleClick = useCallback(
    async (item) => {
      handleDismiss(item.id);
      if (!item.read) await markNotificationRead(item.id);

      if (item.link) {
        if (item.link.startsWith('http')) window.open(item.link, '_blank');
        else navigate(item.link);
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
    },
    [handleDismiss, markNotificationRead, navigate, series]
  );

  useEffect(() => {
    const onReceived = (e) => {
      const item = e.detail;
      if (!item) return;

      const s = notificationSettings;
      const quiet = isQuietTime(s);

      // Sekme arka plandaysa ve tarayıcı bildirimi açıksa
      if (document.visibilityState === 'hidden' && s.browserPush && !quiet) {
        showBrowserNotification(item);
      }

      // Sitede anlık toast gösterimi
      if (s.toast === false || quiet) return;

      if (s.sound) {
        playNotificationSound(item.priority);
      }

      setToasts((prev) => {
        const next = [item, ...prev.filter((t) => t.id !== item.id)].slice(0, 3);
        return next;
      });

      // 6.5 saniye sonra otomatik kaybol
      setTimeout(() => {
        handleDismiss(item.id);
      }, 6500);
    };

    window.addEventListener('notification-received', onReceived);
    return () => window.removeEventListener('notification-received', onReceived);
  }, [notificationSettings, handleDismiss]);

  if (!user || toasts.length === 0) return null;

  return (
    <div className="fixed top-20 sm:top-24 right-3 sm:right-6 z-[150] flex flex-col gap-2.5 max-w-[min(24rem,calc(100vw-1.5rem))] pointer-events-none">
      <AnimatePresence>
        {toasts.map((item) => {
          const meta = getTypeMeta(item.type);
          const Icon = meta.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -20, scale: 0.9, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, x: 40, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              onClick={() => handleClick(item)}
              className="pointer-events-auto cursor-pointer group relative overflow-hidden rounded-2xl border border-white/12 bg-[#0c0919]/90 backdrop-blur-2xl p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.7)] hover:border-white/25 transition-all"
              style={{
                boxShadow: `0 8px 32px ${meta.accent}20, 0 16px 48px rgba(0,0,0,0.8)`,
              }}
            >
              {/* Sol parlak kenar çizgisi */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: meta.accent }}
              />

              <div className="flex items-start gap-3 pl-1.5">
                {/* İkon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md bg-gradient-to-br ${meta.gradient}`}
                >
                  <Icon size={16} />
                </div>

                {/* İçerik */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: meta.accent }}
                    >
                      {item.title || meta.label}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(item.id);
                      }}
                      className="text-slate-500 hover:text-white transition-colors p-0.5 rounded"
                      aria-label="Kapat"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <p className="text-white text-xs font-semibold leading-snug line-clamp-2">
                    {item.text}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
                    <span className="text-[10px] text-slate-500 font-bold">
                      {item.tracked && '⭐ Takipte · '}
                      Şimdi geldi
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-white flex items-center gap-0.5 transition-colors">
                      {item.link ? 'Bağlantıyı Aç' : 'Görüntüle'}
                      <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
