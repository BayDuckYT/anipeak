import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Bell, Eye, Palette, Link as LinkIcon, 
  AlertTriangle, Settings as SettingsIcon, Check, Loader2, 
  Camera, ImageIcon, Zap, Swords, ChevronRight, Fingerprint, Calendar,
  Moon, Sun, Wind, Flame, ShieldAlert, Sparkles, Volume2, VolumeX,
  MonitorSmartphone, BellRing, BellOff, BookOpen, PartyPopper, MessageCircle,
  ExternalLink, Trash2, Clock, KeyRound, AlertOctagon, RefreshCw, X, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useSEO } from '../hooks/useSEO';
import { uploadAvatar } from '../lib/imageService';
import { supabase } from '../lib/supabaseClient';
import {
  resolveNotifSettings,
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

const HOUSES = [
  { 
    id: 'dragon', 
    name: 'Kızıl Ejder', 
    desc: 'Saldırgan ve lider ruhlular',
    icon: Flame,
    color: 'from-red-600 to-rose-900', 
    shadow: 'shadow-[0_0_40px_rgba(225,29,72,0.4)]', 
    border: 'border-rose-500',
    glow: 'bg-rose-500/20'
  },
  { 
    id: 'shadow', 
    name: 'Gölge Tarikatı', 
    desc: 'Sessiz ve stratejik hareket edenler',
    icon: Moon,
    color: 'from-purple-600 to-indigo-950', 
    shadow: 'shadow-[0_0_40px_rgba(147,51,234,0.4)]', 
    border: 'border-purple-500',
    glow: 'bg-purple-500/20'
  },
  { 
    id: 'storm', 
    name: 'Fırtına Lejyonu', 
    desc: 'Hızlı ve sınır tanımayanlar',
    icon: Wind,
    color: 'from-cyan-500 to-blue-900', 
    shadow: 'shadow-[0_0_40px_rgba(6,182,212,0.4)]', 
    border: 'border-cyan-500',
    glow: 'bg-cyan-500/20'
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
  const { user, updateProfile, updatePassword, toggleTrackSeries, clearAllNotifications, logout } = useAuth();
  const { series = [] } = useApp();
  const [activeTab, setActiveTab] = useState('hesap');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Ayarlar Güncellendi');
  const [browserPermission, setBrowserPermission] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'));
  
  // Tehlikeli Bölge Modalı
  const [dangerModal, setDangerModal] = useState({ isOpen: false, action: null, confirmText: '' });

  const [cropModal, setCropModal] = useState({
    isOpen: false,
    imageSrc: null,
    type: 'avatar',
    file: null,
    crop: { x: 0, y: 0 },
    zoom: 1,
    croppedAreaPixels: null,
    outputSize: 'medium',
  });

  const [gifSizeModal, setGifSizeModal] = useState({
    isOpen: false,
    file: null,
    type: 'avatar',
    previewUrl: null,
    selectedSize: 'medium',
  });

  useSEO({
    title: 'Ayarlar | MahoraPeak Komuta Merkezi',
    description: 'MahoraPeak kullanıcı ayarları, güvenlik, bildirimler ve profil kontrol merkezi.',
    url: 'https://mahorapeak.com.tr/settings'
  });

  const [notifSettings, setNotifSettings] = useState(() => resolveNotifSettings(user?.notification_settings));
  const [privacySettings, setPrivacySettings] = useState({ publicProfile: true, showActivity: true });
  const [appearanceSettings, setAppearanceSettings] = useState({ theme: 'dark', animations: true });
  const [malUsername, setMalUsername] = useState('');
  const [bioText, setBioText] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    if (user) {
      setNotifSettings(resolveNotifSettings(user.notification_settings));
      if (user.privacy_settings) setPrivacySettings(user.privacy_settings);
      if (user.appearance_settings) setAppearanceSettings(user.appearance_settings);
      if (user.mal_username) setMalUsername(user.mal_username);
      if (user.bio) setBioText(user.bio);
    }
  }, [user]);

  const handleSave = async (fields, customMsg = 'Ayarlar Güncellendi') => {
    setIsSaving(true);
    try {
      await updateProfile(fields);
      setToastMsg(customMsg);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      alert('Ayarlar kaydedilirken hata oluştu: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.next !== passwords.confirm) {
      alert('Yeni şifreler birbiriyle eşleşmiyor!');
      return;
    }
    if (passwords.next.length < 6) {
      alert('Şifre en az 6 karakter olmalıdır!');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updatePassword(passwords.next);
      if (res?.error) throw res.error;
      setToastMsg('Şifreniz Başarıyla Değiştirildi');
      setShowToast(true);
      setPasswords({ current: '', next: '', confirm: '' });
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      alert('Şifre değiştirilemedi: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'image/gif') {
      const url = URL.createObjectURL(file);
      setGifSizeModal({
        isOpen: true,
        file,
        type,
        previewUrl: url,
        selectedSize: 'medium',
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
        outputSize: 'medium'
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
        setToastMsg('Profil Görseliniz Güncellendi');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      alert('Görsel yüklenemedi!');
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
      await uploadDirectly(file, type);
    } else {
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
        setCropModal(prev => ({ ...prev, isOpen: false }));
        setToastMsg('Profiliniz Güncellendi');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      alert('Kırpma/Yükleme hatası!');
    } finally {
      setIsSaving(false);
    }
  };

  // Tehlikeli Bölge Eylemleri
  const handleExecuteDangerAction = async () => {
    const { action } = dangerModal;
    setIsSaving(true);

    try {
      if (action === 'clear_history') {
        localStorage.removeItem('reading_history');
        localStorage.removeItem('mahorapeak_reading_history');
        if (user?.id) {
          await supabase.from('reading_progress').delete().eq('user_id', user.id);
        }
        setToastMsg('Okuma Geçmişiniz Sıfırlandı');
        setShowToast(true);
      } else if (action === 'clear_notifications') {
        if (clearAllNotifications) await clearAllNotifications();
        setToastMsg('Tüm Bildirimler Temizlendi');
        setShowToast(true);
      } else if (action === 'clear_cache') {
        localStorage.clear();
        sessionStorage.clear();
        setToastMsg('Önbellek Temizlendi, Sayfa Yenileniyor...');
        setShowToast(true);
        setTimeout(() => window.location.reload(), 1200);
      } else if (action === 'delete_account') {
        if (dangerModal.confirmText !== 'HESABIMI SİL') {
          alert('Onaylamak için lütfen tam olarak "HESABIMI SİL" yazınız.');
          setIsSaving(false);
          return;
        }
        if (user?.id) {
          await supabase.from('profiles').update({ is_deleted: true, username: `deleted_${Date.now()}` }).eq('id', user.id);
        }
        alert('Hesabınız başarıyla silindi ve oturum kapatıldı.');
        await logout();
        return;
      }
    } catch (err) {
      alert('İşlem başarısız oldu: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
      setDangerModal({ isOpen: false, action: null, confirmText: '' });
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const menuItems = [
    { id: 'hesap', label: 'Profil Kimliği', icon: User, color: 'text-purple-400' },
    { id: 'guvenlik', label: 'Güvenlik', icon: Shield, color: 'text-indigo-400' },
    { id: 'gorunum', label: 'Görünüm', icon: Palette, color: 'text-pink-400' },
    { id: 'bildirimler', label: 'Bildirimler', icon: Bell, color: 'text-cyan-400' },
    { id: 'gizlilik', label: 'Gizlilik', icon: Eye, color: 'text-emerald-400' },
    { id: 'mal', label: 'MyAnimeList', icon: LinkIcon, color: 'text-blue-400' },
  ];

  return (
    <div className="min-h-screen bg-[#070412] text-white pt-28 pb-24 relative overflow-hidden selection:bg-purple-600 selection:text-white">
      
      {/* Background Cyber Glows */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 right-10 z-[200] flex items-center gap-4 px-6 py-4 bg-[#0e0924]/95 backdrop-blur-2xl border border-purple-500/40 rounded-2xl shadow-[0_10px_40px_rgba(168,85,247,0.3)]"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 text-emerald-400">
              <Check size={18} strokeWidth={3} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-white">{toastMsg}</p>
              <p className="text-[10px] text-gray-400">MahoraPeak Sistemi Güncellendi</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tehlikeli Bölge Onay Modalı */}
      {createPortal(
        <AnimatePresence>
          {dangerModal.isOpen && (
            <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[#0e071c] border border-red-500/40 rounded-3xl p-6 shadow-[0_20px_60px_rgba(239,68,68,0.25)] relative overflow-hidden"
              >
                <div className="flex items-center gap-3 text-red-400 mb-4">
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-2xl">
                    <AlertOctagon size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base uppercase">Eylemi Onayla</h3>
                    <p className="text-[11px] text-red-300">Bu işlem geri alınamaz</p>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed mb-6">
                  {dangerModal.action === 'clear_history' && 'Tüm okuma geçmişiniz ve bölümlerde kaldığınız yer bilgileri kalıcı olarak sıfırlanacaktır.'}
                  {dangerModal.action === 'clear_notifications' && 'Gelen kutunuzdaki tüm okunmuş ve okunmamış bildirimler tamamen silinecektir.'}
                  {dangerModal.action === 'clear_cache' && 'Tarayıcınızdaki yerel veriler temizlenecek ve sayfa yeniden yüklenecektir.'}
                  {dangerModal.action === 'delete_account' && 'DİKKAT: Hesabınız kalıcı olarak kapatılacaktır. Onaylamak için lütfen aşağıdaki alana tam olarak "HESABIMI SİL" yazınız.'}
                </p>

                {dangerModal.action === 'delete_account' && (
                  <div className="mb-6">
                    <input
                      type="text"
                      placeholder="HESABIMI SİL"
                      value={dangerModal.confirmText}
                      onChange={(e) => setDangerModal({ ...dangerModal, confirmText: e.target.value })}
                      className="w-full bg-black/50 border border-red-500/40 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-400 font-bold"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setDangerModal({ isOpen: false, action: null, confirmText: '' })}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleExecuteDangerAction}
                    disabled={isSaving || (dangerModal.action === 'delete_account' && dangerModal.confirmText !== 'HESABIMI SİL')}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-40 transition"
                  >
                    {isSaving ? 'İşleniyor...' : 'Evet, Onaylıyorum'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Cropper Modal */}
      {createPortal(
        <AnimatePresence>
          {cropModal.isOpen && (
            <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-2xl bg-[#0f0924] border border-purple-500/30 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    {cropModal.type === 'avatar' ? 'Profil Fotoğrafını Kırp' : 'Arkaplanı Kırp'}
                  </h3>
                  <button onClick={() => setCropModal(prev => ({ ...prev, isOpen: false }))} className="p-1.5 text-gray-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <div className="relative w-full h-[380px] bg-black">
                  <Cropper
                    image={cropModal.imageSrc}
                    crop={cropModal.crop}
                    zoom={cropModal.zoom}
                    aspect={cropModal.type === 'avatar' ? 1 : 3}
                    cropShape={cropModal.type === 'avatar' ? 'round' : 'rect'}
                    showGrid={false}
                    onCropChange={(crop) => setCropModal(prev => ({ ...prev, crop }))}
                    onCropComplete={(_, croppedAreaPixels) => setCropModal(prev => ({ ...prev, croppedAreaPixels }))}
                    onZoomChange={(zoom) => setCropModal(prev => ({ ...prev, zoom }))}
                  />
                </div>
                <div className="p-4 border-t border-white/10 bg-black/40 flex justify-between items-center">
                  <div className="w-48 hidden sm:block">
                    <input
                      type="range"
                      value={cropModal.zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      onChange={(e) => setCropModal(prev => ({ ...prev, zoom: Number(e.target.value) }))}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <button 
                    onClick={handleCropComplete}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg ml-auto"
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* GIF Modal */}
      {createPortal(
        <AnimatePresence>
          {gifSizeModal.isOpen && (
            <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#0f0924] border border-purple-500/30 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-sm font-black text-white uppercase mb-4">🎞️ GIF Boyut Seçimi</h3>
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-purple-500/40 mb-6 bg-black flex items-center justify-center">
                  {gifSizeModal.previewUrl && <img src={gifSizeModal.previewUrl} alt="GIF" className="w-full h-full object-cover" />}
                </div>
                <div className="grid grid-cols-2 gap-2.5 mb-6">
                  {SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setGifSizeModal(prev => ({ ...prev, selectedSize: preset.id }))}
                      className={`p-3 rounded-xl border text-center transition ${
                        gifSizeModal.selectedSize === preset.id
                          ? 'bg-purple-600/30 border-purple-500 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold block">{preset.label}</span>
                      <span className="text-[10px] opacity-60">{preset.desc}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setGifSizeModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 text-xs font-bold text-gray-400">İptal</button>
                  <button onClick={handleGifUpload} disabled={isSaving} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg">
                    {isSaving ? 'Yükleniyor...' : 'Yükle'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ÜST BAŞLIK & KOMUTA MERKEZİ */}
        <header className="mb-10 flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/30 blur-xl rounded-2xl" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-700 via-indigo-700 to-pink-600 border border-white/20 flex items-center justify-center relative z-10 shadow-[0_0_25px_rgba(168,85,247,0.5)]">
              <SettingsIcon size={30} className="text-white animate-[spin_12s_linear_infinite]" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">Ayarlar</h1>
            <p className="text-purple-400 text-xs font-extrabold uppercase tracking-widest mt-1 flex items-center gap-1.5">
              <Fingerprint size={14} /> MahoraPeak Komuta Merkezi
            </p>
          </div>
        </header>

        {/* ANA DÜZEN: SOL SİDEBAR & SAĞ İÇERİK */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* SOL MENÜ */}
          <aside className="w-full lg:w-[300px] shrink-0">
            <div className="sticky top-28 p-3 bg-[#0a0618]/90 backdrop-blur-2xl border border-purple-500/20 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
              <nav className="flex flex-col gap-1.5">
                {menuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`relative flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group overflow-hidden ${
                        isActive 
                          ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/40 border border-purple-500/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.25)]' 
                          : 'hover:bg-white/[0.04] text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <div className={`p-2 rounded-xl transition ${isActive ? 'bg-purple-600/40 text-purple-200' : 'bg-white/5 group-hover:bg-white/10'}`}>
                          <item.icon size={18} className={isActive ? item.color : 'text-gray-400 group-hover:text-white'} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight size={15} className="text-purple-300 relative z-10" />}
                    </button>
                  );
                })}
              </nav>

              {/* TEHLİKELİ BÖLGE BUTONU */}
              <div className="mt-3 pt-3 border-t border-purple-500/20">
                <button
                  onClick={() => setActiveTab('danger')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group border ${
                    activeTab === 'danger'
                      ? 'bg-red-950/60 border-red-500/60 text-white shadow-[0_0_25px_rgba(239,68,68,0.35)]'
                      : 'bg-red-500/5 hover:bg-red-500/15 border-red-500/20 text-red-400 hover:text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 text-red-400">
                      <ShieldAlert size={18} />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider">Tehlikeli Bölge</span>
                  </div>
                  {activeTab === 'danger' && <ChevronRight size={15} className="text-red-400" />}
                </button>
              </div>
            </div>
          </aside>

          {/* SAĞ İÇERİK ALANI */}
          <main className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0b071e]/90 backdrop-blur-3xl border border-purple-500/25 rounded-3xl p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative overflow-hidden"
              >
                
                {/* 1. PROFİL KİMLİĞİ */}
                {activeTab === 'hesap' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Profil Kimliği</h2>
                      <p className="text-purple-400/80 text-xs font-bold uppercase tracking-widest mt-1">Kişisel Bilgiler ve Görünüm</p>
                    </div>

                    {/* Profil Başlık Kartı */}
                    <div className="relative p-6 rounded-3xl bg-gradient-to-r from-purple-950/50 via-[#150d30] to-indigo-950/40 border border-purple-500/30 flex flex-col md:flex-row items-center gap-6 shadow-xl">
                      <div className="relative group">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-purple-400/50 bg-black flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.4)]">
                          {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User size={44} className="text-purple-400" />
                          )}
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition cursor-pointer backdrop-blur-xs">
                            <Camera size={20} className="text-white mb-1" />
                            <span className="text-[9px] font-black uppercase text-white">Değiştir</span>
                            <input type="file" className="hidden" accept="image/*,image/gif" onChange={(e) => handleFileSelect(e, 'avatar')} />
                          </label>
                        </div>
                      </div>

                      <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                          <h3 className="text-2xl font-black text-white tracking-tight">{user?.username || 'Kullanıcı'}</h3>
                          <Zap size={20} className="text-amber-400 fill-amber-400" />
                        </div>
                        <p className="text-xs text-gray-400">{user?.email || 'kullanici@mahorapeak.com.tr'}</p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
                          <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase tracking-widest">
                            {user?.role || 'ÜYE'}
                          </span>
                          <label className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer">
                            <ImageIcon size={14} className="text-purple-400" />
                            <span>Profil Arkaplanı Seç (GIF/Foto)</span>
                            <input type="file" className="hidden" accept="image/*,image/gif" onChange={(e) => handleFileSelect(e, 'banner')} />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Form Alanları */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <FuturisticInput
                        label="KULLANICI ADI"
                        value={user?.username}
                        placeholder="Kullanıcı Adı"
                        onSave={(val) => handleSave({ username: val }, 'Kullanıcı Adı Güncellendi')}
                        isSaving={isSaving}
                      />
                      <FuturisticInput
                        label="E-POSTA ADRESİ"
                        value={user?.email}
                        placeholder="E-posta Adresi"
                        onSave={(val) => handleSave({ email: val }, 'E-posta Güncellendi')}
                        isSaving={isSaving}
                      />
                    </div>

                    {/* Biyografi */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-300 uppercase tracking-widest block">BİYOGRAFİ / HAKKINDA</label>
                      <textarea
                        rows={3}
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        placeholder="Profilinizde görünecek kısa bir biyografi yazın..."
                        className="w-full bg-black/40 border border-purple-500/20 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition resize-none"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleSave({ bio: bioText }, 'Biyografi Güncellendi')}
                          disabled={isSaving}
                          className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md"
                        >
                          Biyografiyi Kaydet
                        </button>
                      </div>
                    </div>

                    {/* Faction / Hane Seçimi */}
                    <div className="space-y-3 pt-4 border-t border-purple-500/20">
                      <label className="text-[11px] font-black text-gray-300 uppercase tracking-widest block">TARİKAT / HANE SEÇİMİ</label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {HOUSES.map((house) => {
                          const isSelected = user?.house === house.id;
                          const Icon = house.icon;
                          return (
                            <div
                              key={house.id}
                              onClick={() => handleSave({ house: house.id }, `${house.name} Hanesine Katıldınız!`)}
                              className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-center justify-between ${
                                isSelected
                                  ? `bg-gradient-to-r ${house.color} border-white/40 text-white shadow-lg`
                                  : 'bg-black/30 border-white/5 hover:border-purple-500/30 text-gray-400 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-white/10">
                                  <Icon size={18} />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black uppercase text-white">{house.name}</h4>
                                  <p className="text-[10px] opacity-75">{house.desc}</p>
                                </div>
                              </div>
                              {isSelected && <Check size={16} className="text-white" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}

                {/* 2. GÜVENLİK */}
                {activeTab === 'guvenlik' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Güvenlik Ağı</h2>
                      <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-1">Şifreleme ve Erişim Yönetimi</p>
                    </div>

                    {/* Şifre Güncelleme Kartı */}
                    <div className="p-6 md:p-8 rounded-3xl bg-black/40 border border-purple-500/20 space-y-6">
                      <div className="flex items-center gap-3 text-white">
                        <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-300">
                          <KeyRound size={22} />
                        </div>
                        <div>
                          <h3 className="font-black text-sm uppercase">Şifre Değiştir</h3>
                          <p className="text-[11px] text-gray-400">Hesabınızın erişim anahtarını güncelleyin</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <input
                          type="password"
                          placeholder="Mevcut Şifre"
                          value={passwords.current}
                          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                          className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-400 transition"
                        />
                        <div className="grid sm:grid-cols-2 gap-4">
                          <input
                            type="password"
                            placeholder="Yeni Şifre"
                            value={passwords.next}
                            onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-400 transition"
                          />
                          <input
                            type="password"
                            placeholder="Yeni Şifre (Tekrar)"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-400 transition"
                          />
                        </div>

                        <button
                          onClick={handleChangePassword}
                          disabled={isSaving || !passwords.next}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-widest shadow-lg transition disabled:opacity-40"
                        >
                          {isSaving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                        </button>
                      </div>
                    </div>

                    {/* Güvenlik Tavsiyeleri */}
                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                      <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-200 leading-relaxed">
                        <p className="font-bold text-emerald-300 mb-0.5">Hesabınız Güvende</p>
                        MahoraPeak şifreleriniz SHA-256 ve bcrypt ile tuzlanmış hash olarak korunur. Sistem yöneticileri dahi şifrenizi açık halde göremez.
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. GÖRÜNÜM */}
                {activeTab === 'gorunum' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Görünüm & Motor</h2>
                      <p className="text-pink-400 text-xs font-bold uppercase tracking-widest mt-1">Arayüz ve Performans Seçenekleri</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-3">Arayüz Teması</label>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <button
                            onClick={() => handleSave({ appearance_settings: { ...appearanceSettings, theme: 'dark' } }, 'Cyber Mor Tema Seçildi')}
                            className={`p-5 rounded-2xl border text-left transition flex items-center gap-4 ${
                              appearanceSettings.theme === 'dark'
                                ? 'bg-purple-950/50 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                            }`}
                          >
                            <div className="p-3 bg-purple-600/30 rounded-xl text-purple-300">
                              <Moon size={22} />
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase">Cyber Mor (Standart)</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">Dengeli neon kontrast</p>
                            </div>
                          </button>

                          <button
                            onClick={() => handleSave({ appearance_settings: { ...appearanceSettings, theme: 'amoled' } }, 'Saf Siyah Tema Seçildi')}
                            className={`p-5 rounded-2xl border text-left transition flex items-center gap-4 ${
                              appearanceSettings.theme === 'amoled'
                                ? 'bg-black border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                            }`}
                          >
                            <div className="p-3 bg-emerald-600/30 rounded-xl text-emerald-300">
                              <Zap size={22} />
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase">Saf Siyah (AMOLED)</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">Piksel tasarrufu ve derin siyah</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      <EpicToggle
                        icon={Sparkles}
                        title="Sinematik Animasyonlar"
                        desc="Sitedeki neon parçacık efektlerini, cam yansımalarını ve akıcı geçişleri etkinleştirir."
                        enabled={appearanceSettings.animations}
                        onToggle={() => handleSave({ appearance_settings: { ...appearanceSettings, animations: !appearanceSettings.animations } })}
                      />
                    </div>
                  </div>
                )}

                {/* 4. BİLDİRİMLER */}
                {activeTab === 'bildirimler' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Sinyal Ağları</h2>
                      <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mt-1">Haberleşme ve Bölüm Alarmları</p>
                    </div>

                    <div className="space-y-4">
                      <EpicToggle
                        icon={BookOpen}
                        title="Yeni Bölüm Bildirimleri"
                        desc="Takip ettiğin serilere yeni bölüm geldiğinde anlık bildirim al."
                        enabled={notifSettings.newChapter}
                        onToggle={() => handleSave({ notification_settings: { ...notifSettings, newChapter: !notifSettings.newChapter } })}
                      />

                      <div className="p-5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MonitorSmartphone size={20} className="text-purple-400" />
                          <div>
                            <h4 className="text-xs font-black uppercase text-white">Tarayıcı Masaüstü Bildirimleri</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">Sekme arka plandayken sistem bildirimi al</p>
                          </div>
                        </div>

                        {browserPermission !== 'granted' && browserPushSupported() ? (
                          <button
                            onClick={async () => {
                              const perm = await requestBrowserPermission();
                              setBrowserPermission(perm);
                              if (perm === 'granted') {
                                handleSave({ notification_settings: { ...notifSettings, browserPush: true } }, 'Masaüstü Bildirimleri Açıldı');
                              }
                            }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition"
                          >
                            İzin Ver
                          </button>
                        ) : (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Aktif
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. GİZLİLİK */}
                {activeTab === 'gizlilik' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Gölge Modu</h2>
                      <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-1">Gizlilik ve Görünürlük Tercihleri</p>
                    </div>

                    <div className="space-y-4">
                      <EpicToggle
                        icon={Eye}
                        title="Profil Görünürlüğü"
                        desc="Profilinizin diğer kullanıcılar tarafından incelenmesine izin verin."
                        enabled={privacySettings.publicProfile}
                        onToggle={() => handleSave({ privacy_settings: { ...privacySettings, publicProfile: !privacySettings.publicProfile } })}
                      />
                      <EpicToggle
                        icon={Zap}
                        title="Aktivite Radarı"
                        desc="Şu an okuduğunuz serilerin ve listelerinizin profilinizde görünmesini sağlayın."
                        enabled={privacySettings.showActivity}
                        onToggle={() => handleSave({ privacy_settings: { ...privacySettings, showActivity: !privacySettings.showActivity } })}
                      />
                    </div>
                  </div>
                )}

                {/* 6. MYANIMELIST */}
                {activeTab === 'mal' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Veritabanı Bağlantısı</h2>
                      <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1">MyAnimeList Entegrasyonu</p>
                    </div>

                    <div className="p-6 md:p-8 rounded-3xl bg-[#2e51a2]/10 border border-[#2e51a2]/30 space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#2e51a2] flex items-center justify-center font-black text-xl italic text-white shadow-lg">
                          MAL
                        </div>
                        <div>
                          <h3 className="font-black text-sm uppercase text-white">Global Senkronizasyon</h3>
                          <p className="text-[11px] text-gray-400">Okuma listelerinizi MyAnimeList hesabınızla bağlayın</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="MyAnimeList Kullanıcı Adınız"
                          value={malUsername}
                          onChange={(e) => setMalUsername(e.target.value)}
                          className="w-full bg-black/50 border border-[#2e51a2]/40 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#2e51a2] transition"
                        />
                        <button
                          onClick={() => handleSave({ mal_username: malUsername }, 'MyAnimeList Hesabı Bağlandı')}
                          disabled={isSaving}
                          className="w-full py-3.5 rounded-2xl bg-[#2e51a2] hover:bg-[#3b64c2] text-white font-bold text-xs uppercase tracking-wider transition shadow-lg"
                        >
                          {isSaving ? 'Bağlanıyor...' : 'Bağlantıyı Kaydet'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. TEHLİKELİ BÖLGE (DANGER ZONE) */}
                {activeTab === 'danger' && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-400">
                        <ShieldAlert size={26} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Tehlikeli Bölge</h2>
                        <p className="text-red-400 text-xs font-bold uppercase tracking-widest mt-0.5">Kritik ve Geri Alınamaz İşlemler</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      
                      {/* Okuma Geçmişini Sıfırla */}
                      <div className="p-5 rounded-2xl bg-black/40 border border-red-500/20 hover:border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition">
                        <div>
                          <h4 className="text-xs font-black uppercase text-white">Okuma Geçmişini Sıfırla</h4>
                          <p className="text-[11px] text-gray-400 mt-1">Okuduğunuz tüm bölümlerin ve serilerin kayıtlarını temizler.</p>
                        </div>
                        <button
                          onClick={() => setDangerModal({ isOpen: true, action: 'clear_history', confirmText: '' })}
                          className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/30 font-bold text-xs transition shrink-0"
                        >
                          Geçmişi Temizle
                        </button>
                      </div>

                      {/* Bildirimleri Boşalt */}
                      <div className="p-5 rounded-2xl bg-black/40 border border-red-500/20 hover:border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition">
                        <div>
                          <h4 className="text-xs font-black uppercase text-white">Bildirim Kutusunu Boşalt</h4>
                          <p className="text-[11px] text-gray-400 mt-1">Gelen kutunuzdaki tüm duyuru ve kişisel bildirimleri temizler.</p>
                        </div>
                        <button
                          onClick={() => setDangerModal({ isOpen: true, action: 'clear_notifications', confirmText: '' })}
                          className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/30 font-bold text-xs transition shrink-0"
                        >
                          Bildirimleri Sil
                        </button>
                      </div>

                      {/* Önbelleği Temizle */}
                      <div className="p-5 rounded-2xl bg-black/40 border border-red-500/20 hover:border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition">
                        <div>
                          <h4 className="text-xs font-black uppercase text-white">Tarayıcı Önbelleğini Boşalt</h4>
                          <p className="text-[11px] text-gray-400 mt-1">Yerel verileri temizleyip siteyi baştan yükler.</p>
                        </div>
                        <button
                          onClick={() => setDangerModal({ isOpen: true, action: 'clear_cache', confirmText: '' })}
                          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-bold text-xs transition shrink-0"
                        >
                          Önbelleği Temizle
                        </button>
                      </div>

                      {/* Hesabı Kalıcı Olarak Sil */}
                      <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/50 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-black uppercase text-red-300 flex items-center gap-2">
                              <AlertOctagon size={16} /> Hesabı Kalıcı Olarak Kapat
                            </h4>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                              Hesabınız silindiğinde tüm favorileriniz, seviye puanlarınız (XP), Aura bakiyeniz ve VIP aboneliğiniz kalıcı olarak silinir. Bu işlem geri döndürülemez.
                            </p>
                          </div>
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={() => setDangerModal({ isOpen: true, action: 'delete_account', confirmText: '' })}
                            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.5)] transition"
                          >
                            Hesabımı Kalıcı Olarak Sil
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

function FuturisticInput({ label, value, placeholder, onSave, isSaving }) {
  const [val, setVal] = useState(value || '');

  useEffect(() => {
    setVal(value || '');
  }, [value]);

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-black text-gray-300 uppercase tracking-widest block">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-black/40 border border-purple-500/20 rounded-2xl p-4 pr-14 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition"
        />
        <button
          onClick={() => onSave(val)}
          disabled={isSaving || val === value}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-0 transition"
          title="Kaydet"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
        </button>
      </div>
    </div>
  );
}

function EpicToggle({ icon: Icon, title, desc, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-purple-500/30 transition">
      <div className="flex items-center gap-4 pr-4">
        <div className={`p-2.5 rounded-xl border ${enabled ? 'bg-purple-600/30 border-purple-500/50 text-purple-300' : 'bg-white/5 border-white/10 text-gray-500'}`}>
          <Icon size={20} />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase text-white">{title}</h4>
          <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={`relative w-14 h-8 rounded-full transition-colors p-1 flex items-center shrink-0 border ${
          enabled ? 'bg-purple-600 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-black/60 border-white/20'
        }`}
      >
        <motion.div
          animate={{ x: enabled ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="w-6 h-6 rounded-full bg-white shadow-md"
        />
      </button>
    </div>
  );
}
