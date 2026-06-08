import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ShoppingCart, Check, X, AlertCircle,
  Search, Filter, Zap, ShieldCheck, Crown,
  ChevronRight, Star, Package, ArrowRight, Lock, Gem
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSEO } from '../hooks/useSEO';
import { useNavigate } from 'react-router-dom';
import effectsData from '../data/effects.json';
import nameplatesData from '../data/nameplates.json';
import {
  buildMarketItems,
  RARITY_CONFIG,
  MARKET_CATEGORIES,
  RARITY_FILTERS,
  canUseEffect,
} from '../data/marketData.js';
import AnimeAvatar from '../components/AnimeAvatar.jsx';
import { getOptimizedImage } from '../utils/imageOpt.js';
import { StaticImageFallback } from '../components/StaticImageFallback.jsx';

// ── Fiyat formatı ──────────────────────────────────────────────
function formatPrice(price) {
  if (price >= 1000000) return (price / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (price >= 1000) return (price / 1000).toFixed(0) + 'K';
  return price.toLocaleString('tr-TR');
}

// ── Nadirlik Badge ─────────────────────────────────────────────
function RarityBadge({ rarity, size = 'sm' }) {
  const config = RARITY_CONFIG[rarity];
  if (!config) return null;
  const isSmall = size === 'sm';
  return (
    <div className={`inline-flex items-center gap-1 px-${isSmall ? '2' : '3'} py-${isSmall ? '0.5' : '1'} rounded-full ${config.bg} ${config.border} border`}>
      <span className={`text-[${isSmall ? '8px' : '9px'}] font-black uppercase tracking-widest ${config.text}`}>
        {config.icon} {config.label}
      </span>
    </div>
  );
}

// ── Efekt Kartı ────────────────────────────────────────────────
function EffectCard({ item, isOwned, onBuy, user }) {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const config = item.rarityConfig;
  const isNameplate = item.category === 'nameplates';
  const isNameEffect = item.category === 'name_effects';
  const isProfileEffect = item.category === 'profile_effects';
  const isFlag = item.category === 'flags';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`group relative rounded-[1.5rem] overflow-hidden bg-[#0c0a18] border transition-all duration-300 cursor-pointer ${
        isOwned
          ? 'border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
          : 'border-white/5 hover:border-white/20'
      }`}
      style={!isOwned ? { '--tw-shadow-color': config.glow, boxShadow: 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow, 0 0 30px var(--tw-shadow-color))' } : {}}
      onClick={() => !isOwned && onBuy(item)}
      onMouseEnter={() => { videoRef.current?.play(); setIsHovered(true); }}
      onMouseLeave={() => { videoRef.current?.pause(); setIsHovered(false); }}
    >
      {/* Glow effect on hover */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
        style={{ background: `radial-gradient(ellipse at center, ${config.glow}, transparent 70%)`, filter: 'blur(40px)' }}
      />

      {/* Preview area */}
      <div className={`relative ${isNameplate ? 'aspect-[2.5/1]' : isNameEffect ? 'aspect-[2/1]' : 'aspect-square'} flex items-center justify-center overflow-hidden bg-black/40`}>
        {isNameplate ? (
          <video
            ref={videoRef}
            src={item.url}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            muted loop playsInline
          >
            <track kind="captions" srcLang="tr" label="Efekt" />
          </video>
        ) : isNameEffect ? (
          <div className="flex items-center justify-center w-full h-full p-4 bg-gradient-to-br from-black to-zinc-900">
            <span
              className="text-lg font-black uppercase tracking-tighter name-effect-text drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              style={{ backgroundImage: `url(${item.url})` }}
            >
              MAHORAPEAK
            </span>
          </div>
        ) : isProfileEffect ? (
          isHovered ? (
            <img
              src={getOptimizedImage(item.url, 300)}
              loading="lazy"
              alt={item.label}
              className="w-full h-full object-contain p-2 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
            />
          ) : (
            <StaticImageFallback
              src={getOptimizedImage(item.url, 300)}
              alt={item.label}
              className="w-full h-full object-contain p-2 opacity-80"
            />
          )
        ) : isFlag ? (
          isHovered ? (
            <img
              src={getOptimizedImage(item.url, 200)}
              loading="lazy"
              alt={item.label}
              className="w-full h-full object-contain p-6 opacity-80 group-hover:opacity-100 transition-all"
            />
          ) : (
            <StaticImageFallback
              src={getOptimizedImage(item.url, 200)}
              alt={item.label}
              className="w-full h-full object-contain p-6 opacity-80"
            />
          )
        ) : (
          <div className="flex items-center justify-center w-full h-full p-4">
            <AnimeAvatar
              src={null}
              effect={item}
              size="w-20 h-20"
              forcePlay={isHovered}
              hoverOnly={true}
            />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a18] via-transparent to-transparent opacity-80" />

        {/* Owned badge */}
        {isOwned && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10">
            <Check size={14} className="text-white" strokeWidth={3} />
          </div>
        )}

        {/* Rarity badge */}
        <div className="absolute top-3 left-3 z-10">
          <RarityBadge rarity={item.rarity} />
        </div>
      </div>

      {/* Card info */}
      <div className="p-4 relative z-10">
        <h3 className="text-[11px] font-black text-white uppercase tracking-tight truncate mb-1 group-hover:text-white/90">
          {item.label}
        </h3>
        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
          {item.category?.replace(/_/g, ' ')}
        </p>

        {isOwned ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Check size={12} className="text-emerald-400" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
              Sahipsin
            </span>
          </div>
        ) : (
          <button
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r ${config.gradient} text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
            onClick={(e) => { e.stopPropagation(); onBuy(item); }}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} />
              {formatPrice(item.price)}
            </span>
            <ShoppingCart size={12} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Satın Alma Modal'ı ─────────────────────────────────────────
function PurchaseModal({ item, isOpen, onClose, onConfirm, userAura, isPurchasing }) {
  if (!isOpen || !item) return null;

  const config = item.rarityConfig;
  const hasEnough = userAura >= item.price;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-md rounded-[2rem] bg-[#0c0a18] border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Glow */}
            <div
              className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${config.glow}, transparent 70%)`, filter: 'blur(60px)', opacity: 0.4 }}
            />

            <div className="p-8 relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <RarityBadge rarity={item.rarity} size="md" />
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Item preview */}
              <div className="w-full aspect-[2/1] rounded-2xl bg-black/40 border border-white/5 overflow-hidden mb-6 flex items-center justify-center">
                {item.category === 'nameplates' ? (
                  <video src={item.url} className="w-full h-full object-cover" muted loop autoPlay playsInline>
                    <track kind="captions" srcLang="tr" label="Efekt" />
                  </video>
                ) : item.category === 'name_effects' ? (
                  <span
                    className="text-2xl font-black uppercase name-effect-text"
                    style={{ backgroundImage: `url(${item.url})` }}
                  >
                    MAHORAPEAK
                  </span>
                ) : item.category === 'profile_effects' ? (
                  <img src={getOptimizedImage(item.url, 400)} alt={item.label} className="w-full h-full object-contain p-4" />
                ) : (
                  <AnimeAvatar src={null} effect={item} size="w-24 h-24" forcePlay={false} />
                )}
              </div>

              {/* Item name */}
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">
                {item.label}
              </h3>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-6">
                {item.category?.replace(/_/g, ' ')}
              </p>

              {/* Price breakdown */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-5 mb-6 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 font-bold">Fiyat</span>
                  <span className={`font-black ${config.text} flex items-center gap-1`}>
                    <Sparkles size={14} />
                    {item.price.toLocaleString('tr-TR')} Aura
                  </span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 font-bold">Mevcut Bakiye</span>
                  <span className={`font-black ${hasEnough ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {userAura.toLocaleString('tr-TR')} Aura
                  </span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 font-bold">İşlem Sonrası</span>
                  <span className={`font-black ${hasEnough ? 'text-white' : 'text-rose-400'}`}>
                    {hasEnough ? (userAura - item.price).toLocaleString('tr-TR') : 'Yetersiz'} Aura
                  </span>
                </div>
              </div>

              {/* Actions */}
              {hasEnough ? (
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 rounded-xl bg-white/5 text-zinc-400 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() => onConfirm(item)}
                    disabled={isPurchasing}
                    className={`flex-[2] py-4 rounded-xl bg-gradient-to-r ${config.gradient} text-white font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    {isPurchasing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        İşleniyor...
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={14} />
                        Satın Al
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <AlertCircle size={18} className="text-rose-400 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-rose-400 uppercase">Yetersiz Aura!</p>
                      <p className="text-[10px] text-rose-400/70 font-bold mt-0.5">
                        {(item.price - userAura).toLocaleString('tr-TR')} Aura daha lazım.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 py-4 rounded-xl bg-white/5 text-zinc-400 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                    >
                      Kapat
                    </button>
                    <button
                      onClick={() => { onClose(); window.location.href = '/cuzdan'; }}
                      className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Sparkles size={14} />
                      Aura Satın Al
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── ANA SAYFA ──────────────────────────────────────────────────
export default function AuraMarket() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [purchaseItem, setPurchaseItem] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [toast, setToast] = useState(null);
  const [visibleCount, setVisibleCount] = useState(30);

  useSEO({
    title: 'Aura Market - Efekt Mağazası',
    description: 'MahoraPeak Aura Market. Profil efektleri, avatar çerçeveleri, isim efektleri ve daha fazlasını Aura puanlarınla satın al.',
    url: 'https://mahorapeak.com.tr/market'
  });

  // Build market items
  const allItems = useMemo(() => {
    return buildMarketItems(effectsData, nameplatesData);
  }, []);

  // Items filtered only by category (used for rarity counts)
  const itemsInCategory = useMemo(() => {
    if (selectedCategory === 'all') return allItems;
    return allItems.filter(i => i.category === selectedCategory);
  }, [allItems, selectedCategory]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let items = itemsInCategory;
    if (selectedRarity !== 'all') {
      items = items.filter(i => i.rarity === selectedRarity);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.label?.toLowerCase().includes(q));
    }
    // Sort by rarity (mythic first) then price (high first)
    const rarityOrder = { mythic: 0, legendary: 1, rare: 2, uncommon: 3, common: 4 };
    items.sort((a, b) => {
      const rd = (rarityOrder[a.rarity] || 5) - (rarityOrder[b.rarity] || 5);
      if (rd !== 0) return rd;
      return b.price - a.price;
    });
    return items;
  }, [allItems, selectedCategory, selectedRarity, searchQuery]);

  useEffect(() => {
    setVisibleCount(30);
  }, [selectedCategory, selectedRarity, searchQuery]);

  const userAura = user?.aura || 0;
  const ownedEffects = user?.unlocked_effects || [];

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Satın alma işlemi
  const handlePurchase = async (item) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }));
      return;
    }

    if (userAura < item.price) {
      showToast('Yetersiz Aura bakiyesi!', 'error');
      return;
    }

    setIsPurchasing(true);
    try {
      const newAura = userAura - item.price;
      const newUnlocked = [...(user.unlocked_effects || []), item.id];

      const newHistoryItem = {
        id: Date.now().toString(),
        action: `${item.label} satın alındı`,
        amount: `-${item.price.toLocaleString('tr-TR')}`,
        date: new Date().toLocaleDateString('tr-TR'),
        type: 'market_purchase',
        rarity: item.rarity,
      };
      const newHistory = [newHistoryItem, ...(user.wallet_history || [])];

      await updateProfile({
        aura: newAura,
        unlocked_effects: newUnlocked,
        wallet_history: newHistory,
      });

      setPurchaseItem(null);
      showToast(`${item.label} başarıyla satın alındı! ✨`, 'success');
    } catch (err) {
      console.error('Purchase error:', err);
      showToast('Satın alma sırasında bir hata oluştu!', 'error');
    } finally {
      setIsPurchasing(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: allItems.length,
      owned: ownedEffects.length,
      mythic: allItems.filter(i => i.rarity === 'mythic').length,
      legendary: allItems.filter(i => i.rarity === 'legendary').length,
    };
  }, [allItems, ownedEffects]);

  return (
    <div className="min-h-screen bg-[#070511] pb-20 relative overflow-x-hidden">

      {/* ── CINEMATIC HERO ── */}
      <div className="relative w-full h-[55vh] min-h-[450px] overflow-hidden flex items-end mb-8">
        {/* Background with multiple gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#070511] to-rose-900/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-purple-500/15 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-20 right-10 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-40 left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px]" />

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float-particle ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#070511] to-transparent z-10" />

        {/* Content */}
        <div className="relative z-20 w-full max-w-[1400px] mx-auto px-4 sm:px-12 pb-10 flex flex-col md:flex-row items-end justify-between gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-4 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full w-fit border border-white/10">
              <ShoppingCart size={14} className="text-purple-400" />
              <span className="text-xs font-bold text-white tracking-widest uppercase">Aura Market</span>
            </div>
            <h1
              className="text-5xl sm:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-2"
              style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8)' }}
            >
              EFEKT <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500">MARKETİ</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-xl font-medium drop-shadow-md mb-4">
              Profilini eşsiz kıl. Yüzlerce efekt, çerçeve ve isim efekti arasından seç, Aura puanlarınla sahip ol.
            </p>
            <div className="flex items-center gap-6 text-[10px] text-slate-400 font-black uppercase tracking-widest flex-wrap">
              <span className="flex items-center gap-1.5"><Package size={14} className="text-purple-400" /> {stats.total} Efekt</span>
              <span className="flex items-center gap-1.5"><Star size={14} className="text-amber-400" /> {stats.legendary} Efsanevi</span>
              <span className="flex items-center gap-1.5"><Gem size={14} className="text-rose-400" /> {stats.mythic} Gizemli</span>
            </div>
          </div>

          {/* Balance Card */}
          <div className="flex-shrink-0 bg-[#141414]/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.15)] text-center min-w-[200px]">
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Aura Bakiyen</div>
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={24} className="text-pink-500" />
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
                {userAura.toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="text-sm font-bold text-pink-500 tracking-widest mt-1">AURA</div>
            <button
              onClick={() => navigate('/cuzdan')}
              className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[9px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all flex items-center justify-center gap-1.5"
            >
              <Zap size={12} /> Aura Yükle
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTERS & CONTENT ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-12 relative z-30">

        {/* Owned Counter */}
        {ownedEffects.length > 0 && (
          <div className="mb-6 flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <Check size={16} className="text-emerald-400" />
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
              {ownedEffects.length} efekte sahipsin
            </span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Efekt ara... (örn: Gojo, Sakura, Venom)"
            className="w-full bg-[#141414] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-zinc-600 focus:border-purple-500/50 focus:shadow-[0_0_20px_rgba(168,85,247,0.15)] outline-none transition-all font-bold"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
          {MARKET_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Rarity Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 mb-2">
          {RARITY_FILTERS.map((r) => {
            const isActive = selectedRarity === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRarity(r.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 border ${
                  isActive
                    ? r.id === 'all'
                      ? 'bg-white/10 text-white border-white/20'
                      : `${r.bg} ${r.text} ${r.border}`
                    : 'bg-transparent text-zinc-500 border-white/5 hover:border-white/20 hover:text-zinc-300'
                }`}
              >
                {r.icon && <span>{r.icon}</span>}
                {r.label}
                <span className="text-[8px] opacity-60 ml-1">
                  ({r.id === 'all' ? itemsInCategory.length : itemsInCategory.filter(i => i.rarity === r.id).length})
                </span>
              </button>
            );
          })}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">
            {filteredItems.length} sonuç
          </span>
          {(selectedCategory !== 'all' || selectedRarity !== 'all' || searchQuery) && (
            <button
              onClick={() => { setSelectedCategory('all'); setSelectedRarity('all'); setSearchQuery(''); }}
              className="text-[10px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest flex items-center gap-1 transition-colors"
            >
              <X size={12} /> Filtreleri Temizle
            </button>
          )}
        </div>

        {/* ── ITEM GRID ── */}
        {filteredItems.length > 0 ? (
          <div className="flex flex-col items-center pb-20">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 w-full">
              {filteredItems.slice(0, visibleCount).map((item) => (
                <EffectCard
                  key={item.id}
                  item={item}
                  isOwned={ownedEffects.includes(item.id) || canUseEffect(item.id, user)}
                  onBuy={() => setPurchaseItem(item)}
                  user={user}
                />
              ))}
            </div>
            {visibleCount < filteredItems.length && (
              <button
                onClick={() => setVisibleCount(v => v + 30)}
                className="mt-10 px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 hover:border-white/20 transition-all"
              >
                Daha Fazla Göster ({filteredItems.length - visibleCount})
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 rounded-[3rem] bg-white/[0.02] border border-dashed border-white/10">
            <Search size={48} className="text-zinc-700 mb-4" />
            <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Sonuç bulunamadı</p>
            <p className="text-xs text-zinc-600 mt-2">Farklı bir filtre veya arama terimi deneyin.</p>
          </div>
        )}
      </div>

      {/* ── Purchase Modal ── */}
      <PurchaseModal
        item={purchaseItem}
        isOpen={!!purchaseItem}
        onClose={() => setPurchaseItem(null)}
        onConfirm={handlePurchase}
        userAura={userAura}
        isPurchasing={isPurchasing}
      />

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-4 px-8 py-4 backdrop-blur-2xl border rounded-[2rem] shadow-2xl ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.15)]'
                : 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.15)]'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border relative ${
              toast.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
            }`}>
              {toast.type === 'success' ? <Check size={18} strokeWidth={3} /> : <AlertCircle size={18} />}
            </div>
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${toast.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {toast.type === 'success' ? 'Başarılı' : 'Hata'}
              </p>
              <p className={`text-[10px] font-medium mt-0.5 ${toast.type === 'success' ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                {toast.msg}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating particle animation keyframes */}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.2; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
