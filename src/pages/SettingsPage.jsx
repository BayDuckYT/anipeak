import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Bell, Eye, Palette, Link as LinkIcon, 
  AlertTriangle, Settings as SettingsIcon, Check, Loader2, 
  Camera, ImageIcon, Zap, Swords, ChevronRight, Fingerprint, Calendar,
  Moon, Sun, Wind, Flame, ShieldAlert, Sparkles, Volume2, VolumeX,
  MonitorSmartphone, BellRing, BellOff, BookOpen, PartyPopper, MessageCircle,
  ExternalLink, Trash2, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useSEO } from '../hooks/useSEO';
import { uploadAvatar } from '../lib/imageService';
import {
  resolveNotifSettings,
  playNotificationSound,
  requestBrowserPermission,
  browserPushSupported,
} from '../lib/notifications.js';
import Cropper from 'react-easy-crop';

const SIZE_PRESETS = [
  { id: 'small', label: 'Küçük', desc: '128×128', size: 128, icon: '🔹' },
  { id: 'medium', label: 'Orta', desc: '256×256', size: 256, icon: '🔷' },
  { id: 'large', label: 'Büyük', desc: '512×512', size: 512, icon: '💎' },
  { id: 'original', label: 'Orijinal', desc: 'Tam Boyut', size: null, icon: '⚡' },
];

const BANNER_SIZE_PRESETS = [
  { id: 'small', label: 'Küçük', desc: '600×200', w: 600, h: 200, icon: '🔹' },
  { id: 'medium', label: 'Orta', desc: '900×300', w: 900, h: 300, icon: '🔷' },
  { id: 'large', label: 'Büyük', desc: '1200×400', w: 1200, h: 400, icon: '💎' },
  { id: 'original', label: 'Orijinal', desc: 'Tam Boyut', w: null, h: null, icon: '⚡' },
];

const getCroppedImg = async (imageSrc, pixelCrop, targetSize = null) => {
  const image = new Image();
  image.setAttribute('crossOrigin', 'anonymous');
  image.src = imageSrc;
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // targetSize varsa çıktıyı o boyuta ölçekle, yoksa orijinal kırpma boyutunu kullan
    const outW = targetSize || pixelCrop.width;
    const outH = targetSize || pixelCrop.height;
    canvas.width = outW;
    canvas.height = outH;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outW, outH);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        blob.name = `cropped_${Date.now()}.webp`;
        resolve(blob);
      }, 'image/webp', 0.9);
    });
  } catch (err) { throw err; }
};

const resizeImage = (file, maxDim) => {
  return new Promise((resolve) => {
    if (!maxDim) { resolve(file); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          blob.name = file.name || `resized_${Date.now()}.webp`;
          resolve(blob);
        }, 'image/webp', 0.9);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
};

// Geliştirilmiş Faction (Hane) Verileri
const HOUSES = [
  { 
    id: 'dragon', 
    name: 'Kızıl Ejder', 
    desc: 'Saldırgan ve lider ruhlular',
    icon: Flame,
    color: 'from-red-600 to-rose-900', 
    shadow: 'shadow-[0_0_40px_rgba(225,29,72,0.4)]', 
    border: 'border-red-500',
    glow: 'bg-red-500/20'
  },
  { 
    id: 'fox', 
    name: 'Gümüş Kitsune', 
    desc: 'Stratejik ve zeki olanlar',
    icon: Wind,
    color: 'from-purple-600 to-indigo-900', 
    shadow: 'shadow-[0_0_40px_rgba(147,51,234,0.4)]', 
    border: 'border-purple-500',
    glow: 'bg-purple-500/20'
  },
  { 
    id: 'wolf', 
    name: 'Buz Kurt', 
    desc: 'Dayanışmacı ve sadık olanlar',
    icon: Moon,
    color: 'from-blue-600 to-cyan-900', 
    shadow: 'shadow-[0_0_40px_rgba(37,99,235,0.4)]', 
    border: 'border-blue-500',
    glow: 'bg-blue-500/20'
  },
  { 
    id: 'phoenix', 
    name: 'Altın Anka', 
    desc: 'Küllerinden doğan azimliler',
    icon: Sun,
    color: 'from-amber-500 to-orange-900', 
    shadow: 'shadow-[0_0_40px_rgba(245,158,11,0.4)]', 
    border: 'border-amber-500',
    glow: 'bg-amber-500/20'
  },
];

export default function SettingsPage() {
  const { user, updateProfile, updatePassword, toggleTrackSeries } = useAuth();
  const { series = [] } = useApp();
  const [activeTab, setActiveTab] = useState('hesap');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Ayarlar Güncellendi');
  const [browserPermission, setBrowserPermission] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'));
  
  const [cropModal, setCropModal] = useState({
    isOpen: false,
    imageSrc: null,
    type: 'avatar', // 'avatar' | 'banner'
    file: null,
    crop: { x: 0, y: 0 },
    zoom: 1,
    croppedAreaPixels: null,
    outputSize: 'medium', // small | medium | large | original
  });

  // GIF boyut seçimi modalı
  const [gifSizeModal, setGifSizeModal] = useState({
    isOpen: false,
    file: null,
    type: 'avatar',
    previewUrl: null,
    selectedSize: 'medium',
  });

  useSEO({
    title: 'Ayarlar | MahoraPeak',
    description: 'MahoraPeak komuta ve kontrol merkezi.',
    url: 'https://mahorapeak.com.tr/settings'
  });

  const [notifSettings, setNotifSettings] = useState(() => resolveNotifSettings(user?.notification_settings));
  const [privacySettings, setPrivacySettings] = useState({ publicProfile: true, showActivity: true });
  const [appearanceSettings, setAppearanceSettings] = useState({ theme: 'dark', animations: true });
  const [malUsername, setMalUsername] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    if (user) {
      if (user.notification_settings) setNotifSettings(resolveNotifSettings(user.notification_settings));
      if (user.privacy_settings) setPrivacySettings(user.privacy_settings);
      if (user.appearance_settings) setAppearanceSettings(user.appearance_settings);
      if (user.mal_username) setMalUsername(user.mal_username);
    }
  }, [user]);

  const handleSave = async (data = {}, customMsg = 'Ayarlar Güncellendi') => {
    setIsSaving(true);
    try {
      await updateProfile(data);
      setToastMsg(customMsg);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      alert('Kaydedilirken hata oluştu!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'image/gif') {
      // GIF'ler için boyut seçim modalı göster
      const previewUrl = URL.createObjectURL(file);
      setGifSizeModal({
        isOpen: true,
        file,
        type,
        previewUrl,
        selectedSize: 'original',
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropModal({
        isOpen: true,
        imageSrc: reader.result,
        type,
        file,
        crop: { x: 0, y: 0 },
        zoom: 1,
        croppedAreaPixels: null,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const uploadDirectly = async (file, type) => {
    setIsSaving(true);
    try {
      const url = await uploadAvatar(file, type);
      if (url) {
        if (type === 'avatar') {
          await updateProfile({ avatar_url: url });
        } else {
          const nextApp = { ...appearanceSettings, custom_banner_url: url };
          setAppearanceSettings(nextApp);
          await updateProfile({ appearance_settings: nextApp });
        }
        setToastMsg('Profiliniz Güncellendi');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      alert('Yükleme hatası!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGifUpload = async () => {
    const { file, type, selectedSize } = gifSizeModal;
    if (!file) return;
    setGifSizeModal(prev => ({ ...prev, isOpen: false }));
    if (gifSizeModal.previewUrl) URL.revokeObjectURL(gifSizeModal.previewUrl);

    if (selectedSize === 'original') {
      // Orijinal boyutta direkt yükle
      await uploadDirectly(file, type);
    } else {
      // GIF'i boyutlandır (statik frame olarak — animasyon korunmaz)
      setIsSaving(true);
      try {
        const preset = SIZE_PRESETS.find(p => p.id === selectedSize);
        const resizedBlob = await resizeImage(file, preset?.size || null);
        await uploadDirectly(resizedBlob, type);
      } catch (err) {
        alert('Boyutlandırma hatası!');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCropComplete = async () => {
    if (!cropModal.croppedAreaPixels || !cropModal.imageSrc) return;
    setIsSaving(true);
    try {
      // Seçilen boyut presetini bul
      const presets = cropModal.type === 'avatar' ? SIZE_PRESETS : BANNER_SIZE_PRESETS;
      const preset = presets.find(p => p.id === cropModal.outputSize);
      const targetSize = cropModal.type === 'avatar' ? (preset?.size || null) : (preset?.w || null);
      
      const croppedBlob = await getCroppedImg(cropModal.imageSrc, cropModal.croppedAreaPixels, targetSize);
      const url = await uploadAvatar(croppedBlob, cropModal.type);
      if (url) {
        if (cropModal.type === 'avatar') {
          await updateProfile({ avatar_url: url });
        } else {
          const nextApp = { ...appearanceSettings, custom_banner_url: url };
          setAppearanceSettings(nextApp);
          await updateProfile({ appearance_settings: nextApp });
        }
        setToastMsg('Profiliniz Güncellendi');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      alert('Kırpma veya yükleme sırasında hata oluştu.');
    } finally {
      setIsSaving(false);
      setCropModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleChangePassword = async () => {
    if (passwords.next !== passwords.confirm) return alert('Şifreler eşleşmiyor!');
    setIsSaving(true);
    try {
      await updatePassword(passwords.next);
      setShowToast(true);
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    { id: 'hesap', label: 'Profil Kimliği', icon: User, color: 'text-purple-400' },
    { id: 'guvenlik', label: 'Güvenlik', icon: Shield, color: 'text-emerald-400' },
    { id: 'gorunum', label: 'Görünüm', icon: Palette, color: 'text-pink-400' },
    { id: 'bildirimler', label: 'Bildirimler', icon: Bell, color: 'text-blue-400' },
    { id: 'gizlilik', label: 'Gizlilik', icon: Eye, color: 'text-amber-400' },
    { id: 'mal', label: 'MyAnimeList', icon: LinkIcon, color: 'text-indigo-400' },
  ];

  return (
    <div className="min-h-screen bg-[#030208] text-zinc-100 font-sans pt-24 pb-20 relative overflow-hidden selection:bg-purple-500/30">
      
      {/* Cinematic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* Futuristic Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            transition={{ filter: { type: 'tween' } }}
            className="fixed bottom-10 right-10 z-[200] flex items-center gap-4 px-6 py-4 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.15)]"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400 relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-full" />
              <Check size={18} strokeWidth={3} className="relative z-10" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white">{toastMsg}</p>
              <p className="text-[10px] text-emerald-400/80 font-medium">Değişiklikler başarıyla kaydedildi.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cropper Modal */}
      {createPortal(
        <AnimatePresence>
          {cropModal.isOpen && (
            <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  {cropModal.type === 'avatar' ? 'Profil Fotoğrafını Kırp' : 'Arkaplanı Kırp'}
                </h3>
                <button 
                  onClick={() => setCropModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                >
                  <AlertTriangle size={20} className="hidden" />
                  <span className="text-xl font-bold leading-none">&times;</span>
                </button>
              </div>
              <div className="relative w-full h-[400px] bg-black">
                <Cropper
                  image={cropModal.imageSrc}
                  crop={cropModal.crop}
                  zoom={cropModal.zoom}
                  aspect={cropModal.type === 'avatar' ? 1 : 3}
                  cropShape={cropModal.type === 'avatar' ? 'round' : 'rect'}
                  showGrid={false}
                  onCropChange={(crop) => setCropModal(prev => ({ ...prev, crop }))}
                  onCropComplete={(croppedArea, croppedAreaPixels) => setCropModal(prev => ({ ...prev, croppedAreaPixels }))}
                  onZoomChange={(zoom) => setCropModal(prev => ({ ...prev, zoom }))}
                />
              </div>
              <div className="p-4 border-t border-white/5 bg-black/40 space-y-4">
                {/* Boyut Seçimi */}
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Çıktı Boyutu</p>
                  <div className="flex gap-2 flex-wrap">
                    {(cropModal.type === 'avatar' ? SIZE_PRESETS : BANNER_SIZE_PRESETS).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setCropModal(prev => ({ ...prev, outputSize: preset.id }))}
                        className={`px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border ${
                          cropModal.outputSize === preset.id
                            ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-105'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="mr-1.5">{preset.icon}</span>
                        {preset.label}
                        <span className="ml-1.5 opacity-60 text-[9px]">({preset.desc})</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Zoom + Kaydet */}
                <div className="flex justify-between items-center">
                  <div className="flex-1 px-4 hidden sm:block">
                    <input
                      type="range"
                      value={cropModal.zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-label="Zoom"
                      onChange={(e) => setCropModal(prev => ({ ...prev, zoom: e.target.value }))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <button 
                    onClick={handleCropComplete}
                    disabled={isSaving}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 ml-auto"
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}

      {/* GIF Boyut Seçim Modalı */}
      {createPortal(
        <AnimatePresence>
          {gifSizeModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/40">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  🎞️ GIF Boyut Seçimi
                </h3>
                <button 
                  onClick={() => { 
                    if (gifSizeModal.previewUrl) URL.revokeObjectURL(gifSizeModal.previewUrl);
                    setGifSizeModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                >
                  <span className="text-xl font-bold leading-none">&times;</span>
                </button>
              </div>

              {/* GIF Önizleme */}
              <div className="p-6 flex flex-col items-center gap-6">
                <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-white/20 bg-black flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                  {gifSizeModal.previewUrl && (
                    <img src={gifSizeModal.previewUrl} alt="GIF Önizleme" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="w-full">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 text-center">Boyut Seç</p>
                  <div className="grid grid-cols-2 gap-3">
                    {SIZE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setGifSizeModal(prev => ({ ...prev, selectedSize: preset.id }))}
                        className={`p-4 rounded-2xl text-center transition-all border ${
                          gifSizeModal.selectedSize === preset.id
                            ? 'bg-purple-600/20 text-white border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{preset.icon}</span>
                        <span className="text-xs font-black uppercase tracking-wider">{preset.label}</span>
                        <span className="block text-[10px] opacity-60 mt-0.5">{preset.desc}</span>
                        {preset.id !== 'original' && (
                          <span className="block text-[9px] text-amber-400/70 mt-1">⚠️ Animasyon kaybolur</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/5 bg-black/40 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    if (gifSizeModal.previewUrl) URL.revokeObjectURL(gifSizeModal.previewUrl);
                    setGifSizeModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="px-5 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 font-bold text-sm transition-all"
                >
                  İptal
                </button>
                <button 
                  onClick={handleGifUpload}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                  {isSaving ? 'Yükleniyor...' : '🚀 Yükle'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 relative z-10">
        
        {/* Header */}
        <header className="mb-14 px-4">
          <div className="flex items-end gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
              <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-black to-zinc-900 border border-white/10 flex items-center justify-center relative z-10 shadow-2xl">
                 <SettingsIcon size={36} className="text-white" strokeWidth={1.5} />
              </div>
            </div>
            <div className="pb-2">
              <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 uppercase tracking-tighter">Ayarlar</h1>
              <p className="text-purple-400/80 text-xs font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <Fingerprint size={14} /> Komuta Merkezi
              </p>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Cyber Sidebar */}
          <aside className="w-full lg:w-[320px] shrink-0">
            <div className="sticky top-28 p-3 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] shadow-2xl">
              <nav className="flex flex-col gap-1">
                {menuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`relative flex items-center justify-between px-6 py-5 rounded-[2rem] transition-all duration-500 group overflow-hidden ${isActive ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="active-nav-bg"
                          className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent border-l-4 border-white"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      
                      <div className="flex items-center gap-4 relative z-10">
                        <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/10 shadow-lg' : 'group-hover:bg-white/5'}`}>
                          <item.icon size={20} className={`${isActive ? item.color : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest transition-colors ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                          {item.label}
                        </span>
                      </div>
                      
                      {isActive && <ChevronRight size={16} className="text-white/50 relative z-10" />}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-3 p-1">
                 <button className="w-full flex items-center justify-between px-6 py-5 rounded-[2rem] bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all group overflow-hidden">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                        <ShieldAlert size={20} className="text-red-500" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-red-500">Tehlikeli Bölge</span>
                    </div>
                 </button>
              </div>
            </div>
          </aside>

          {/* Epic Main Content */}
          <main className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
                transition={{ type: "spring", stiffness: 400, damping: 30, filter: { type: 'tween', duration: 0.3 } }}
                className="bg-[#0A0A0F]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-6 md:p-12 shadow-2xl relative overflow-hidden min-h-[600px]"
              >
                {/* Glare effect */}
                <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                {activeTab === 'hesap' && (
                  <div className="space-y-16">
                    <header>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Profil Kimliği</h2>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Kişisel Veri Akışı</p>
                    </header>

                    {/* Cyber Avatar Section */}
                    <div className="relative p-1 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent group hover:from-purple-500/20 transition-all duration-700">
                      <div className="absolute inset-0 bg-black/60 rounded-[2.5rem] backdrop-blur-xl -z-10" />
                      <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="relative">
                          {/* Holographic rings */}
                          <div className="absolute -inset-4 rounded-full border border-white/10 animate-[spin_10s_linear_infinite]" />
                          <div className="absolute -inset-8 rounded-full border border-dashed border-white/5 animate-[spin_20s_linear_infinite_reverse]" />
                          
                          <div className="w-36 h-36 rounded-full bg-black border-2 border-white/20 overflow-hidden flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] group-hover:border-purple-500/50 transition-colors duration-500">
                            {user?.avatar_url ? (
                              <img src={user.avatar_url} alt="Profil" className="w-full h-full object-cover" />
                            ) : (
                              <User size={56} className="text-zinc-800" />
                            )}
                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity backdrop-blur-sm cursor-pointer">
                               <Camera size={24} className="text-white mb-1" />
                               <span className="text-[10px] font-black uppercase text-white">Değiştir</span>
                               <input type="file" className="hidden" accept="image/*,image/gif" onChange={(e) => handleFileSelect(e, 'avatar')} />
                            </label>
                          </div>
                        </div>
                        
                        <div className="flex-1 text-center md:text-left space-y-3">
                          <h3 className="text-4xl font-black text-white tracking-tighter flex items-center justify-center md:justify-start gap-4">
                            {user?.username}
                            {user?.is_elite && (
                              <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
                                <Zap size={28} className="text-amber-400 fill-amber-400 relative z-10" />
                              </div>
                            )}
                          </h3>
                          <p className="text-zinc-400 font-medium tracking-wide">{user?.email}</p>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                            <div className="px-5 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-[0.2em] text-white backdrop-blur-md">
                              {user?.role}
                            </div>
                            <label className="px-5 py-2 rounded-2xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 text-xs font-black uppercase tracking-[0.2em] text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.15)] cursor-pointer hover:bg-purple-500/30 transition-colors flex items-center gap-2">
                              <ImageIcon size={14} /> Profil Arkaplanı Seç (GIF/Foto)
                              <input type="file" className="hidden" accept="image/*,image/gif" onChange={(e) => handleFileSelect(e, 'banner')} />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FuturisticInput 
                        label="Kullanıcı Adı" 
                        value={user?.username} 
                        placeholder="Yeni adın..."
                        onSave={(val) => handleSave({ username: val })}
                        isSaving={isSaving}
                      />
                      <FuturisticInput 
                        label="E-posta Adresi" 
                        value={user?.email} 
                        type="email"
                        placeholder="Yeni e-posta..."
                        onSave={(val) => handleSave({ email: val })}
                        isSaving={isSaving}
                      />
                    </div>


                  </div>
                )}

                {activeTab === 'gorunum' && (
                  <div className="space-y-16">
                    <header>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Görünüm & Motor</h2>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Arayüz ve Performans Ayarları</p>
                    </header>

                    <div className="space-y-10">
                      <div>
                        <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] block mb-6">Arayüz Teması</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <button 
                            onClick={() => handleSave({ appearance_settings: { ...appearanceSettings, theme: 'dark' } })}
                            className={`relative p-8 rounded-[2.5rem] border transition-all text-left group overflow-hidden ${appearanceSettings.theme === 'dark' ? 'bg-[#13111C] border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.2)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                          >
                            <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${appearanceSettings.theme === 'dark' ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
                                 <ImageIcon size={24} />
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Standart Koyu</h4>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Dengeli kontrast</p>
                              </div>
                            </div>
                          </button>
                          <button 
                            onClick={() => handleSave({ appearance_settings: { ...appearanceSettings, theme: 'amoled' } })}
                            className={`relative p-8 rounded-[2.5rem] border transition-all text-left group overflow-hidden ${appearanceSettings.theme === 'amoled' ? 'bg-[#000000] border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                          >
                            <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${appearanceSettings.theme === 'amoled' ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
                                 <Zap size={24} />
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Ultra Siyah</h4>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Saf siyah pikseller</p>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-white/5 space-y-6">
                        <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] block">Sistem Parametreleri</label>
                        <EpicToggle 
                          icon={Sparkles}
                          title="Sinematik Animasyonlar" 
                          desc="Sitedeki parçacık efektlerini, glowları ve yumuşak geçişleri açar. Kapatırsan performans artar."
                          enabled={appearanceSettings.animations}
                          onToggle={() => handleSave({ appearance_settings: { ...appearanceSettings, animations: !appearanceSettings.animations } })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'guvenlik' && (
                  <div className="space-y-16">
                    <header>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Güvenlik Ağı</h2>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Şifreleme ve Erişim Yönetimi</p>
                    </header>

                    <div className="relative p-1 rounded-[3rem] bg-gradient-to-b from-white/10 to-transparent">
                      <div className="absolute inset-0 bg-black/60 rounded-[3rem] backdrop-blur-2xl -z-10" />
                      <div className="p-10 md:p-14">
                        <div className="flex items-center gap-6 mb-10">
                          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                            <ShieldAlert size={28} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">Şifre Güncelleme</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Erişim anahtarını yenile</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <input 
                            type="password" 
                            placeholder="Mevcut Şifre"
                            className="w-full bg-black/50 border border-white/10 rounded-[2rem] py-5 px-8 text-white text-sm font-bold focus:border-white focus:bg-white/5 transition-all outline-none placeholder:text-zinc-700"
                            value={passwords.current}
                            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <input 
                              type="password" 
                              placeholder="Yeni Şifre"
                              className="w-full bg-black/50 border border-white/10 rounded-[2rem] py-5 px-8 text-white text-sm font-bold focus:border-white focus:bg-white/5 transition-all outline-none placeholder:text-zinc-700"
                              value={passwords.next}
                              onChange={(e) => setPasswords({...passwords, next: e.target.value})}
                            />
                            <input 
                              type="password" 
                              placeholder="Yeni Şifre (Tekrar)"
                              className="w-full bg-black/50 border border-white/10 rounded-[2rem] py-5 px-8 text-white text-sm font-bold focus:border-white focus:bg-white/5 transition-all outline-none placeholder:text-zinc-700"
                              value={passwords.confirm}
                              onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                            />
                          </div>
                          
                          <div className="pt-6">
                            <button 
                              onClick={handleChangePassword}
                              disabled={isSaving || !passwords.next}
                              className="w-full py-6 rounded-[2rem] bg-white text-black text-sm font-black uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                            >
                              Güvenlik Protokolünü Onayla
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'bildirimler' && (
                  <div className="space-y-12">
                    <header>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Sinyal Ağları</h2>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Haberleşme ve İletim Tercihleri</p>
                    </header>

                    {/* ── BÖLÜM 1: İÇERİK FİLTRELERİ ── */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-purple-400" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">İçerik Bildirimleri</h3>
                      </div>

                      <EpicToggle 
                        icon={BookOpen}
                        title="Yeni Bölüm Bildirimleri" 
                        desc="Sitede yayınlanan yeni bölümler için anlık bildirim al."
                        enabled={notifSettings.newChapter}
                        onToggle={() => handleSave({ notification_settings: { ...notifSettings, newChapter: !notifSettings.newChapter } })}
                      />

                      <EpicToggle 
                        icon={BellRing}
                        title="Yalnızca Takip Ettiğim Seriler" 
                        desc="Açıkken yalnızca Takvim'de veya serilerde takip butonuna bastığın yapımların yeni bölüm bildirimleri gelir; diğer seriler bildirim kutunu doldurmaz."
                        enabled={notifSettings.onlyTracked}
                        onToggle={() => handleSave({ notification_settings: { ...notifSettings, onlyTracked: !notifSettings.onlyTracked } })}
                      />

                      <EpicToggle 
                        icon={Sparkles}
                        title="Yeni Seri Lansmanları" 
                        desc="Platforma yeni bir manhwa/webtoon eklendiğinde ilk senin haberin olsun."
                        enabled={notifSettings.newSeries}
                        onToggle={() => handleSave({ notification_settings: { ...notifSettings, newSeries: !notifSettings.newSeries } })}
                      />

                      <EpicToggle 
                        icon={Calendar}
                        title="Takvim Hatırlatıcıları" 
                        desc="Takip ettiğin serilerin yayın gününde veya bölümü yayına girdiği saatte otomatik hatırlatıcı oluştur."
                        enabled={notifSettings.scheduleReminders}
                        onToggle={() => handleSave({ notification_settings: { ...notifSettings, scheduleReminders: !notifSettings.scheduleReminders } })}
                      />

                      <EpicToggle 
                        icon={MessageCircle}
                        title="Sosyal & Yorum Etkileşimleri" 
                        desc="Yorumlarına yanıt geldiğinde, etiketlendiğinde veya beğeni aldığında bildirim al."
                        enabled={notifSettings.replies}
                        onToggle={() => handleSave({ notification_settings: { ...notifSettings, replies: !notifSettings.replies } })}
                      />

                      <EpicToggle 
                        icon={PartyPopper}
                        title="Etkinlikler & Aura Kampanyaları" 
                        desc="2X Aura hafta sonları, sezonluk etkinlikler ve özel hediye kodları."
                        enabled={notifSettings.events}
                        onToggle={() => handleSave({ notification_settings: { ...notifSettings, events: !notifSettings.events } })}
                      />

                      <EpicToggle 
                        icon={AlertTriangle}
                        title="Sistem & Güncelleme Duyuruları" 
                        desc="Planlı bakım çalışmaları, güvenlik uyarıları ve site yenilikleri (Kritik uyarılar her zaman gösterilir)."
                        enabled={notifSettings.system}
                        onToggle={() => handleSave({ notification_settings: { ...notifSettings, system: !notifSettings.system } })}
                      />
                    </div>

                    {/* ── BÖLÜM 2: İLETİM KANALLARI & SES ── */}
                    <div className="space-y-6 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <Volume2 size={16} className="text-cyan-400" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">İletim Kanalları & Ses</h3>
                      </div>

                      <EpicToggle 
                        icon={Sparkles}
                        title="Anlık Açılır Bildirim (Toast)" 
                        desc="Site içinde gezinirken yeni bir bildirim geldiğinde ekranın sağ üstünde şık bir kart belirir."
                        enabled={notifSettings.toast}
                        onToggle={() => handleSave({ notification_settings: { ...notifSettings, toast: !notifSettings.toast } })}
                      />

                      <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-6 flex-1 pr-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0 ${notifSettings.sound ? 'bg-white text-black border-transparent shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
                            {notifSettings.sound ? <Volume2 size={24} /> : <VolumeX size={24} />}
                          </div>
                          <div>
                            <h4 className="text-base font-black text-white uppercase tracking-widest">Bildirim Sesi</h4>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 leading-relaxed max-w-lg">
                              Yeni bildirimlerde fütüristik hafif sinyal sesi çal.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => playNotificationSound('normal')}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all flex items-center gap-1.5"
                          >
                            <Volume2 size={14} className="text-cyan-400" />
                            <span>Test Et</span>
                          </button>

                          <button 
                            type="button"
                            onClick={() => handleSave({ notification_settings: { ...notifSettings, sound: !notifSettings.sound } })}
                            className={`relative w-20 h-10 rounded-full transition-all duration-500 p-1 flex items-center shrink-0 border ${
                              notifSettings.sound ? 'bg-white/20 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'bg-black/60 border-white/10'
                            }`}
                          >
                            <motion.div 
                              animate={{ x: notifSettings.sound ? 40 : 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                              className={`w-8 h-8 rounded-full shadow-lg ${notifSettings.sound ? 'bg-white' : 'bg-zinc-600'}`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-6 flex-1 pr-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0 ${notifSettings.browserPush ? 'bg-white text-black border-transparent shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
                            <MonitorSmartphone size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-black text-white uppercase tracking-widest">Masaüstü / Tarayıcı Push Bildirimleri</h4>
                              {browserPermission === 'granted' && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  İzin Verildi
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 leading-relaxed max-w-lg">
                              Sekme arka plandayken veya simge durumundayken sistem bildirimleri gönder.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {browserPermission !== 'granted' && browserPushSupported() && (
                            <button
                              type="button"
                              onClick={async () => {
                                const perm = await requestBrowserPermission();
                                setBrowserPermission(perm);
                                if (perm === 'granted') {
                                  handleSave({ notification_settings: { ...notifSettings, browserPush: true } }, 'Tarayıcı Bildirimleri Aktif');
                                }
                              }}
                              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-all"
                            >
                              İzin Ver
                            </button>
                          )}

                          <button 
                            type="button"
                            onClick={async () => {
                              if (!notifSettings.browserPush && browserPermission !== 'granted') {
                                const perm = await requestBrowserPermission();
                                setBrowserPermission(perm);
                                if (perm !== 'granted') return;
                              }
                              handleSave({ notification_settings: { ...notifSettings, browserPush: !notifSettings.browserPush } });
                            }}
                            className={`relative w-20 h-10 rounded-full transition-all duration-500 p-1 flex items-center shrink-0 border ${
                              notifSettings.browserPush ? 'bg-white/20 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'bg-black/60 border-white/10'
                            }`}
                          >
                            <motion.div 
                              animate={{ x: notifSettings.browserPush ? 40 : 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                              className={`w-8 h-8 rounded-full shadow-lg ${notifSettings.browserPush ? 'bg-white' : 'bg-zinc-600'}`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── BÖLÜM 3: SESSİZ SAATLER (RAHATSIZ ETME) ── */}
                    <div className="space-y-6 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <Moon size={16} className="text-indigo-400" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Sessiz Saatler (Rahatsız Etmeyin)</h3>
                      </div>

                      <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">Gece Sessizlik Protokolü</h4>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                              Belirlenen saat aralığında ses ve açılır toast'lar susturulur, bildirimler kutuda sessizce birikir.
                            </p>
                          </div>

                          <button 
                            type="button"
                            onClick={() => handleSave({
                              notification_settings: {
                                ...notifSettings,
                                quietHours: {
                                  ...notifSettings.quietHours,
                                  enabled: !notifSettings.quietHours?.enabled,
                                }
                              }
                            })}
                            className={`relative w-16 h-8 rounded-full transition-all duration-500 p-1 flex items-center shrink-0 border ${
                              notifSettings.quietHours?.enabled ? 'bg-white/20 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-black/60 border-white/10'
                            }`}
                          >
                            <motion.div 
                              animate={{ x: notifSettings.quietHours?.enabled ? 32 : 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                              className={`w-6 h-6 rounded-full shadow-lg ${notifSettings.quietHours?.enabled ? 'bg-white' : 'bg-zinc-600'}`}
                            />
                          </button>
                        </div>

                        {notifSettings.quietHours?.enabled && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Clock size={12} /> Başlangıç Saati
                              </label>
                              <input
                                type="time"
                                value={notifSettings.quietHours?.start || '23:00'}
                                onChange={(e) => handleSave({
                                  notification_settings: {
                                    ...notifSettings,
                                    quietHours: { ...notifSettings.quietHours, start: e.target.value }
                                  }
                                })}
                                className="w-full bg-[#070511] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Clock size={12} /> Bitiş Saati
                              </label>
                              <input
                                type="time"
                                value={notifSettings.quietHours?.end || '08:00'}
                                onChange={(e) => handleSave({
                                  notification_settings: {
                                    ...notifSettings,
                                    quietHours: { ...notifSettings.quietHours, end: e.target.value }
                                  }
                                })}
                                className="w-full bg-[#070511] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── BÖLÜM 4: TAKİP EDİLEN SERİLER ── */}
                    <div className="space-y-6 pt-6 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-purple-400" />
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">
                            Takip Edilen Seriler ({notifSettings.scheduleSeriesIds?.length || 0})
                          </h3>
                        </div>

                        {(notifSettings.scheduleSeriesIds || []).length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSave({ notification_settings: { ...notifSettings, scheduleSeriesIds: [] } }, 'Tüm serilerin takibi kaldırıldı')}
                            className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Tümünü Temizle
                          </button>
                        )}
                      </div>

                      {(notifSettings.scheduleSeriesIds || []).length === 0 ? (
                        <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 text-center">
                          <BellOff size={28} className="text-slate-600 mx-auto mb-2" />
                          <p className="text-white text-xs font-bold mb-1">Henüz Takip Ettiğin Seri Yok</p>
                          <p className="text-slate-500 text-[11px] mb-4">
                            Yayın Takvimi'nde serilerin yanındaki zil ikonuna basarak anlık bölüm takibine alabilirsin.
                          </p>
                          <a
                            href="/takvim"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md"
                          >
                            <Calendar size={13} /> Yayın Takvimine Git
                          </a>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {notifSettings.scheduleSeriesIds.map((sid) => {
                            const match = series.find((s) => String(s.id) === String(sid));
                            return (
                              <div
                                key={sid}
                                className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-white/15 transition-all group"
                              >
                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                  {match?.cover ? (
                                    <img
                                      src={match.cover}
                                      alt={match.title}
                                      className="w-8 h-10 object-cover rounded-lg shrink-0 border border-white/10"
                                    />
                                  ) : (
                                    <div className="w-8 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 shrink-0">
                                      <BookOpen size={14} />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-white text-xs font-bold truncate">
                                      {match?.title || `Seri #${sid}`}
                                    </p>
                                    <p className="text-slate-500 text-[10px] truncate">
                                      Bölüm bildirimleri açık
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    await toggleTrackSeries(sid);
                                    setNotifSettings((prev) => ({
                                      ...prev,
                                      scheduleSeriesIds: prev.scheduleSeriesIds.filter((id) => id !== sid),
                                    }));
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                                  title="Takibi bırak"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'gizlilik' && (
                  <div className="space-y-16">
                    <header>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Gölge Modu</h2>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Gizlilik ve Görünürlük</p>
                    </header>

                    <div className="space-y-6">
                      <EpicToggle 
                        icon={Eye}
                        title="Profil Görünürlüğü" 
                        desc="Profilinin diğer kullanıcılar tarafından incelenmesine izin ver."
                        enabled={privacySettings.publicProfile}
                        onToggle={() => handleSave({ privacy_settings: { ...privacySettings, publicProfile: !privacySettings.publicProfile } })}
                      />
                      <EpicToggle 
                        icon={Zap}
                        title="Aktivite Radarı" 
                        desc="Şu an ne okuduğunun ve listelerinin başkaları tarafından görülmesine izin ver."
                        enabled={privacySettings.showActivity}
                        onToggle={() => handleSave({ privacy_settings: { ...privacySettings, showActivity: !privacySettings.showActivity } })}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'mal' && (
                  <div className="space-y-16">
                    <header>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Veritabanı Bağlantısı</h2>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">MyAnimeList Senkronizasyonu</p>
                    </header>

                    <div className="relative p-1 rounded-[3rem] bg-gradient-to-b from-[#2E51A2]/30 to-transparent overflow-hidden">
                      <div className="absolute inset-0 bg-black/80 rounded-[3rem] backdrop-blur-2xl -z-10" />
                      <div className="absolute -right-40 -top-40 w-96 h-96 bg-[#2E51A2]/30 blur-[120px] rounded-full pointer-events-none" />
                      
                      <div className="p-10 md:p-14 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-10 mb-10">
                          <div className="w-24 h-24 rounded-[2.5rem] bg-[#2E51A2] flex items-center justify-center text-white shadow-[0_0_50px_rgba(46,81,162,0.5)] border border-white/20">
                            <span className="font-black text-4xl italic tracking-tighter">MAL</span>
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-widest">Global Eşitleme</h3>
                            <p className="text-[11px] text-[#2E51A2] font-bold uppercase tracking-[0.2em] mt-2 leading-relaxed max-w-sm">
                              Hesabını bağla ve okuma listelerinin otomatik olarak MyAnimeList sunucularıyla eşitlenmesini sağla.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="relative">
                            <div className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-600">
                              <User size={20} />
                            </div>
                            <input 
                              type="text" 
                              placeholder="MAL Kullanıcı Adın"
                              className="w-full bg-black/60 border border-[#2E51A2]/30 rounded-[2rem] py-6 pl-20 pr-8 text-white text-base font-bold focus:border-[#2E51A2] focus:bg-white/5 transition-all outline-none placeholder:text-zinc-700"
                              value={malUsername}
                              onChange={(e) => setMalUsername(e.target.value)}
                            />
                          </div>
                          
                          <button 
                            onClick={() => handleSave({ mal_username: malUsername })}
                            disabled={isSaving}
                            className="w-full py-6 rounded-[2rem] bg-[#2E51A2] text-white text-sm font-black uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(46,81,162,0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                          >
                            Uplink Kur / Güncelle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

// ── Ozel Komponentler ────────────────────────────────────────────────────────

function FuturisticInput({ label, value, placeholder, onSave, isSaving, type = "text" }) {
  const [val, setVal] = useState(value || '');
  
  useEffect(() => {
    setVal(value || '');
  }, [value]);

  return (
    <div className="space-y-4">
       <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] block ml-4">{label}</label>
       <div className="relative group">
          <input 
            type={type}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-black/40 border border-white/5 rounded-[2rem] py-5 px-8 pr-20 text-white text-sm font-bold focus:border-white focus:bg-white/5 transition-all outline-none placeholder:text-zinc-700"
          />
          <button 
            onClick={() => onSave(val)}
            disabled={isSaving || val === value}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[1.5rem] bg-white flex items-center justify-center text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-0 disabled:scale-50 transition-all duration-300 hover:scale-105"
          >
             {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} strokeWidth={3} />}
          </button>
       </div>
    </div>
  );
}

function EpicToggle({ icon: Icon, title, desc, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between p-8 rounded-[2.5rem] bg-black/40 border border-white/5 hover:border-white/20 transition-all duration-500 group overflow-hidden relative">
       {/* Hover Glow */}
       <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
       
       <div className="flex items-center gap-6 relative z-10 flex-1 pr-8">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0 ${enabled ? 'bg-white text-black border-transparent shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
            <Icon size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h4 className="text-base font-black text-white uppercase tracking-widest">{title}</h4>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 leading-relaxed max-w-lg">{desc}</p>
          </div>
       </div>

       <button 
          onClick={onToggle}
          className={`relative w-20 h-10 rounded-full transition-all duration-500 p-1 flex items-center shrink-0 border relative z-10 ${
            enabled ? 'bg-white/20 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'bg-black/60 border-white/10'
          }`}
       >
          <motion.div 
            animate={{ x: enabled ? 40 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`w-8 h-8 rounded-full shadow-lg ${enabled ? 'bg-white' : 'bg-zinc-600'}`}
          />
       </button>
    </div>
  );
}
