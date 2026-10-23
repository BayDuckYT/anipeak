import React from 'react';
import {
  BookOpen, Feather, BookmarkCheck, Layers, Skull, Flame, Archive, Zap,
  Calendar, Crown, Sparkles, Moon, Wind, Utensils, MessageSquare, FileText,
  Globe, Bot, Sword, Eye, Compass, Heart, Crosshair, Ghost, TrendingUp,
  Atom, Shield, Award, Trophy, Star, CheckCircle2, Coffee, ShieldAlert,
  Smartphone, Monitor, Sparkle, Target, Smile, UserCheck, Share2, HelpCircle
} from 'lucide-react';

/**
 * Başarım adı veya ID'sine göre benzersiz logo, ikon ve renk paleti döndüren sistem
 */
export const ACHIEVEMENT_PALETTES = {
  gold: {
    bg: 'from-amber-500/25 via-yellow-500/15 to-amber-950/40',
    border: 'border-amber-400/50 hover:border-amber-400',
    iconColor: 'text-amber-300',
    glow: 'shadow-[0_0_25px_rgba(251,191,36,0.4)]',
    badge: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
  },
  purple: {
    bg: 'from-violet-600/25 via-purple-600/15 to-purple-950/40',
    border: 'border-purple-400/50 hover:border-purple-400',
    iconColor: 'text-purple-300',
    glow: 'shadow-[0_0_25px_rgba(168,85,247,0.4)]',
    badge: 'bg-purple-400/20 text-purple-300 border-purple-400/40',
  },
  blue: {
    bg: 'from-blue-600/25 via-cyan-600/15 to-blue-950/40',
    border: 'border-cyan-400/50 hover:border-cyan-400',
    iconColor: 'text-cyan-300',
    glow: 'shadow-[0_0_25px_rgba(34,211,238,0.4)]',
    badge: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40',
  },
  rose: {
    bg: 'from-rose-600/25 via-red-600/15 to-rose-950/40',
    border: 'border-rose-400/50 hover:border-rose-400',
    iconColor: 'text-rose-300',
    glow: 'shadow-[0_0_25px_rgba(244,63,94,0.4)]',
    badge: 'bg-rose-400/20 text-rose-300 border-rose-400/40',
  },
  emerald: {
    bg: 'from-emerald-600/25 via-teal-600/15 to-emerald-950/40',
    border: 'border-emerald-400/50 hover:border-emerald-400',
    iconColor: 'text-emerald-300',
    glow: 'shadow-[0_0_25px_rgba(16,185,129,0.4)]',
    badge: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
  },
  orange: {
    bg: 'from-orange-600/25 via-amber-600/15 to-orange-950/40',
    border: 'border-orange-400/50 hover:border-orange-400',
    iconColor: 'text-orange-300',
    glow: 'shadow-[0_0_25px_rgba(249,115,22,0.4)]',
    badge: 'bg-orange-400/20 text-orange-300 border-orange-400/40',
  },
  cosmic: {
    bg: 'from-fuchsia-600/30 via-violet-600/25 to-indigo-950/50',
    border: 'border-fuchsia-400/60 hover:border-fuchsia-300',
    iconColor: 'text-fuchsia-200',
    glow: 'shadow-[0_0_35px_rgba(217,70,239,0.5)]',
    badge: 'bg-fuchsia-400/25 text-fuchsia-200 border-fuchsia-400/50',
  }
};

/**
 * Başarım adına göre özel ikon ve renk eşlemesi
 */
export function getAchievementMeta(name = '', category = '') {
  const n = (name || '').toLowerCase();

  // 1. ÖZEL İSİM EŞLEMELERİ
  if (n.includes('ilk sayfa')) return { icon: BookOpen, palette: 'blue', tag: 'Başlangıç' };
  if (n.includes('mürekkep')) return { icon: Feather, palette: 'purple', tag: 'Yazı' };
  if (n.includes('kütüphane faresi')) return { icon: BookmarkCheck, palette: 'emerald', tag: 'Okur' };
  if (n.includes('cilt avcısı')) return { icon: Layers, palette: 'orange', tag: 'Koleksiyon' };
  if (n.includes('seri katili')) return { icon: Skull, palette: 'rose', tag: 'Tamamlama' };
  if (n.includes('tiryakisi')) return { icon: Flame, palette: 'orange', tag: 'Bağımlı' };
  if (n.includes('arşivci')) return { icon: Archive, palette: 'purple', tag: 'Arşiv' };
  if (n.includes('sayfa canavarı')) return { icon: Zap, palette: 'gold', tag: 'Hız' };
  if (n.includes('haftalık')) return { icon: Calendar, palette: 'blue', tag: 'Maraton' };
  if (n.includes('okuma tanrısı')) return { icon: Crown, palette: 'cosmic', tag: 'Efsane' };
  if (n.includes('koleksiyoncu')) return { icon: Sparkles, palette: 'purple', tag: 'Liste' };
  if (n.includes('gece kuşu')) return { icon: Moon, palette: 'purple', tag: 'Gece' };
  if (n.includes('hızlı okur')) return { icon: Wind, palette: 'blue', tag: 'Rüzgar' };
  if (n.includes('gurme')) return { icon: Utensils, palette: 'rose', tag: 'Zevk' };
  if (n.includes('yorumcu') || n.includes('ilk yorum')) return { icon: MessageSquare, palette: 'blue', tag: 'Yorum' };
  if (n.includes('eleştirmen')) return { icon: FileText, palette: 'emerald', tag: 'İnceleme' };
  if (n.includes('siber mühür') || n.includes('discord')) return { icon: Bot, palette: 'blue', tag: 'Discord' };
  if (n.includes('shonen')) return { icon: Sword, palette: 'orange', tag: 'Shonen' };
  if (n.includes('seinen')) return { icon: Eye, palette: 'purple', tag: 'Seinen' };
  if (n.includes('isekai')) return { icon: Compass, palette: 'emerald', tag: 'Isekai' };
  if (n.includes('romantik')) return { icon: Heart, palette: 'rose', tag: 'Romantik' };
  if (n.includes('aksiyon')) return { icon: Crosshair, palette: 'rose', tag: 'Aksiyon' };
  if (n.includes('korku')) return { icon: Ghost, palette: 'purple', tag: 'Korku' };
  if (n.includes('yükseliş')) return { icon: TrendingUp, palette: 'blue', tag: 'Rütbe' };
  if (n.includes('kozmik tanrı') || n.includes('kozmik')) return { icon: Atom, palette: 'cosmic', tag: 'Kozmik' };
  if (n.includes('hükümdar')) return { icon: Crown, palette: 'gold', tag: 'Hükümdar' };
  if (n.includes('elit')) return { icon: Star, palette: 'gold', tag: 'Elit' };
  if (n.includes('beğeni')) return { icon: Heart, palette: 'rose', tag: 'Sosyal' };
  if (n.includes('mobil')) return { icon: Smartphone, palette: 'blue', tag: 'Mobil' };
  if (n.includes('masaüstü')) return { icon: Monitor, palette: 'purple', tag: 'PC' };
  if (n.includes('hata avcısı')) return { icon: ShieldAlert, palette: 'rose', tag: 'Gizli' };
  if (n.includes('solo leveling')) return { icon: Sword, palette: 'purple', tag: 'Özel' };
  if (n.includes('sadık') || n.includes('istikrar')) return { icon: Shield, palette: 'emerald', tag: 'İstikrar' };

  // 2. KATEGORİ BAZLI FALLBACK EŞLEMELERİ
  switch (category) {
    case 'Okuma':
      return { icon: BookOpen, palette: 'blue', tag: 'Okuma' };
    case 'İstikrar':
      return { icon: Zap, palette: 'emerald', tag: 'İstikrar' };
    case 'Tür':
      return { icon: Target, palette: 'orange', tag: 'Tür' };
    case 'Sosyal':
      return { icon: MessageSquare, palette: 'purple', tag: 'Sosyal' };
    case 'Rütbe':
      return { icon: Trophy, palette: 'gold', tag: 'Rütbe' };
    case 'Efsanevi':
      return { icon: Crown, palette: 'cosmic', tag: 'Efsanevi' };
    default:
      return { icon: Award, palette: 'purple', tag: 'Başarım' };
  }
}

/**
 * Şık, parıldayan Başarım Rozet İkon Bileşeni
 */
export function AchievementLogo({ name, category, isUnlocked = false, size = 'md', className = '' }) {
  const meta = getAchievementMeta(name, category);
  const Icon = meta.icon;
  const p = ACHIEVEMENT_PALETTES[meta.palette] || ACHIEVEMENT_PALETTES.purple;

  const sizeCls = {
    sm: 'w-10 h-10 rounded-xl p-2',
    md: 'w-14 h-14 rounded-2xl p-3',
    lg: 'w-20 h-20 rounded-3xl p-4.5',
    xl: 'w-24 h-24 rounded-3xl p-5.5'
  }[size] || 'w-14 h-14 rounded-2xl p-3';

  const iconSizes = { sm: 18, md: 24, lg: 36, xl: 44 };
  const iconSize = iconSizes[size] || 24;

  if (!isUnlocked) {
    return (
      <div className={`relative ${sizeCls} bg-black/50 border border-white/10 flex items-center justify-center text-slate-500 opacity-60 transition-all ${className}`}>
        <Icon size={iconSize} className="opacity-50" />
      </div>
    );
  }

  return (
    <div className={`relative ${sizeCls} bg-gradient-to-br ${p.bg} border-2 ${p.border} ${p.glow} flex items-center justify-center transition-all duration-300 transform group-hover:scale-105 ${className}`}>
      {/* Cam yansıma */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-white/10 to-transparent pointer-events-none" />
      <Icon size={iconSize} className={`${p.iconColor} drop-shadow-[0_0_12px_currentColor]`} />
    </div>
  );
}

/**
 * Veritabanı boşsa veya henüz yüklenmediyse kullanılacak 24 zengin temel başarım listesi (Fallback)
 */
export const DEFAULT_ACHIEVEMENTS = [
  { id: 'ach-1', name: 'İlk Sayfa', description: 'İlk manga bölümünü başarıyla bitir.', category: 'Okuma', requirement_type: 'total_chapters', requirement_value: 1 },
  { id: 'ach-2', name: 'Mürekkep Tadı', description: '10 farklı bölüm oku.', category: 'Okuma', requirement_type: 'total_chapters', requirement_value: 10 },
  { id: 'ach-3', name: 'Kütüphane Faresi', description: '50 bölüm bitir.', category: 'Okuma', requirement_type: 'total_chapters', requirement_value: 50 },
  { id: 'ach-4', name: 'Cilt Avcısı', description: '100 bölüm bitir.', category: 'Okuma', requirement_type: 'total_chapters', requirement_value: 100 },
  { id: 'ach-5', name: 'Manga Tiryakisi', description: '500 bölüm oku.', category: 'Okuma', requirement_type: 'total_chapters', requirement_value: 500 },
  { id: 'ach-6', name: 'İlk Adım', description: 'Üst üste 2 gün siteye giriş yap.', category: 'İstikrar', requirement_type: 'streak', requirement_value: 2 },
  { id: 'ach-7', name: 'Alışkanlık', description: '7 günlük giriş serisi yakala.', category: 'İstikrar', requirement_type: 'streak', requirement_value: 7 },
  { id: 'ach-8', name: 'Sadık Okur', description: '30 gün boyunca her gün en az 1 bölüm oku.', category: 'İstikrar', requirement_type: 'streak', requirement_value: 30 },
  { id: 'ach-9', name: 'Discord Mührü', description: 'Discord hesabını başarıyla bağla.', category: 'Sosyal', requirement_type: 'discord_link', requirement_value: 1 },
  { id: 'ach-10', name: 'İlk Yorum', description: 'Bir bölüme ilk yorumunu bırak.', category: 'Sosyal', requirement_type: 'comments', requirement_value: 1 },
  { id: 'ach-11', name: 'Fikir Önderi', description: '10 farklı bölüme yorum yap.', category: 'Sosyal', requirement_type: 'comments', requirement_value: 10 },
  { id: 'ach-12', name: 'Beğeni Yağmuru', description: '50 bölümü beğen.', category: 'Sosyal', requirement_type: 'likes', requirement_value: 50 },
  { id: 'ach-13', name: 'Shonen Kralı', description: '25 tane Shonen serisi oku.', category: 'Tür', requirement_type: 'genre_count', requirement_value: 25 },
  { id: 'ach-14', name: 'Isekai Yolcusu', description: '10 farklı Isekai dünyasına git.', category: 'Tür', requirement_type: 'genre_count', requirement_value: 10 },
  { id: 'ach-15', name: 'Aksiyon Tutkunu', description: '50 tane aksiyon odaklı bölüm oku.', category: 'Tür', requirement_type: 'genre_chapters', requirement_value: 50 },
  { id: 'ach-16', name: 'Yükseliş Başladı', description: 'Seviye 10\'a ulaş.', category: 'Rütbe', requirement_type: 'level', requirement_value: 10 },
  { id: 'ach-17', name: 'Çaylaklıktan Çıkış', description: 'Seviye 25\'e ulaş.', category: 'Rütbe', requirement_type: 'level', requirement_value: 25 },
  { id: 'ach-18', name: 'Üstün Avcı', description: 'Seviye 50\'ye ulaş.', category: 'Rütbe', requirement_type: 'level', requirement_value: 50 },
  { id: 'ach-19', name: 'Kadim Güç', description: 'Seviye 75\'e ulaş.', category: 'Rütbe', requirement_type: 'level', requirement_value: 75 },
  { id: 'ach-20', name: 'Mahora Hükümdarı', description: 'Seviye 100\'e ulaş ve tahta otur!', category: 'Rütbe', requirement_type: 'level', requirement_value: 100 },
  { id: 'ach-21', name: 'Gece Kuşu', description: 'Gece 00:00 - 04:00 arası 5 bölüm oku.', category: 'Okuma', requirement_type: 'night_reading', requirement_value: 5 },
  { id: 'ach-22', name: 'Hızlı Okur', description: 'Bir bölümü hızlıca tamamla.', category: 'Okuma', requirement_type: 'fast_read', requirement_value: 1 },
  { id: 'ach-23', name: 'Hata Avcısı', description: 'Sitede bir bug bul ve yetkililere bildir.', category: 'Efsanevi', requirement_type: 'special', requirement_value: 1, is_secret: true },
  { id: 'ach-24', name: 'Efsanevi Hükümdar', description: 'Tüm başarımları tamamla ve adını zirveye yazdır!', category: 'Efsanevi', requirement_type: 'completion_rate', requirement_value: 100, is_secret: true },
];
