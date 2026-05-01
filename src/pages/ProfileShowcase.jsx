import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  BookOpen, 
  Star, 
  History, 
  MessageSquare, 
  Share2,
  Calendar,
  Award,
  Link as LinkIcon,
  UserPlus,
  Mail,
  Instagram,
  Twitter,
  Github,
  Youtube,
  Settings as SettingsIcon,
  Edit3,
  Plus,
  Eye,
  EyeOff,
  Palette,
  Image as ImageIcon,
  User,
  Filter,
  Paintbrush,
  Shield,
  Bell,
  Play,
  Lock,
  X,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import AnimeAvatar from '../components/AnimeAvatar.jsx';
import effectsData from '../data/effects.json';
import nameplatesData from '../data/nameplates.json';
import Cropper from 'react-easy-crop';
import { uploadAvatar } from '../lib/imageService';
import { getEffectCSS, canUseBundle, getUnlockedEffectParts, ELITE_BUNDLES } from '../lib/eliteBundles';
import { renderCanvasEffect } from '../lib/canvasEffects';
import SiberVideo from '../components/SiberVideo';
import { usePerformance } from '../context/PerformanceContext';
import { Check, Upload, Minus, ShoppingCart, Package, Crown, Sparkles, ChevronRight, ArrowRight } from 'lucide-react';

// Profil Kırpma Yardımcısı
const getCroppedImg = async (imageSrc, pixelCrop) => {
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
    canvas.width = 512;
    canvas.height = 512;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 512, 512);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.8);
    });
  } catch (err) { throw err; }
};

const PREMIUM_FREE_COUNT = 10;

export default function ProfileShowcase() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isOwnProfile = currentUser?.username === username;
  
  // Mock/Fallback data

  const [activeTab, setActiveTab] = useState('etkinlik');
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [decorationCategory, setDecorationCategory] = useState('Tümü');
  const [activeDecoration, setActiveDecoration] = useState(isOwnProfile ? (currentUser?.active_decoration || 'none') : 'none');
  const [userLinks, setUserLinks] = useState(isOwnProfile ? (currentUser?.links || []) : []);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  const { updateProfile, readingHistory } = useAuth();
  const { supabase } = useApp();

  // Fetch Profile Data
  useEffect(() => {
    async function fetchProfile() {
      setLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();
          
        if (!error && data) {
          setProfileData(data);
          if (!isOwnProfile) {
            setActiveDecoration(data.active_decoration || 'none');
            setUserLinks(data.links || []);
          }
        }
        
        // Check if following
        if (currentUser && currentUser.id !== data.id) {
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', data.id)
            .single();
          setIsFollowing(!!followData);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchProfile();
  }, [username, supabase]); // Removed currentUser dependency to prevent loop on save

  const displayUser = (isOwnProfile ? (profileData || currentUser) : profileData) || {
    username: username,
    role: 'Üye',
    bio: 'Profil yükleniyor...',
    avatar_url: null,
    xp: 0,
    level: 1,
    joinDate: '...',
    followers: 0,
    following: 0,
    active_decoration: 'none',
  };

  const activeEffectObj = useMemo(() => {
    return effectsData.find(e => e.id === activeDecoration);
  }, [activeDecoration]);

  const handleSaveLinks = async (newLinks) => {
    try {
      await updateProfile({ links: newLinks });
      setUserLinks(newLinks);
    } catch (err) {
      console.error('Links save error:', err);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return;
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profileData.id);
        setIsFollowing(false);
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: profileData.id });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };
  
  // Dashboard Specific State
  const { series } = useApp();
  const { isLowPerformanceMode } = usePerformance();
  const [uploading, setUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef(null);
  const [isMixModalOpen, setIsMixModalOpen] = useState(false);
  const [mixState, setMixState] = useState(currentUser?.active_mix || { avatar: 'none', comment: 'none', nametag: 'none', aura: 'none', nameplate: 'none' });
  const [previewEffect, setPreviewEffect] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumToast, setPremiumToast] = useState(false);

  const [selectedBundle, setSelectedBundle] = useState(() => {
    const mix = currentUser?.active_mix;
    if (mix && mix.avatar !== 'none' && mix.avatar === mix.comment && mix.avatar === mix.nametag) {
      const found = ELITE_BUNDLES.find(p => p.effects.avatar === mix.avatar);
      return found?.id || 'mix';
    }
    if (mix && (mix.avatar !== 'none' || mix.comment !== 'none' || mix.nametag !== 'none' || mix.aura !== 'none')) {
      return 'mix';
    }
    return 'none';
  });

  const isSukuna = selectedBundle === 'sukuna' || (selectedBundle === 'mix' && mixState.aura === 'blood-rain');
  const isGojo = selectedBundle === 'gojo' || (selectedBundle === 'mix' && mixState.aura === 'void-particles');

  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  // Handle Hash-based Tabs
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const validTabs = isOwnProfile 
      ? ['history', 'customize', 'settings', 'notifications', 'listeler', 'basarimlar']
      : ['listeler', 'basarimlar', 'etkinlik'];
    if (validTabs.includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash, isOwnProfile]);

  const selectedDecoration = useMemo(() => {
    const activeId = isOwnProfile ? mixState.avatar : (displayUser.active_mix?.avatar || 'none');
    return effectsData.find(d => d.id === activeId) || null;
  }, [isOwnProfile, mixState.avatar, displayUser.active_mix?.avatar]);

  // Canvas Effect Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    let animationFrameId;
    const render = () => {
      const auraId = isOwnProfile ? mixState.aura : (displayUser.active_mix?.aura || 'none');
      renderCanvasEffect(ctx, canvas, auraId, particlesRef);
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOwnProfile, mixState.aura, displayUser.active_mix?.aura]);

  // Update displayUser with the activeDecoration state
  displayUser.active_decoration = activeDecoration;
  
  const tabs = isOwnProfile ? [
    { id: 'history', label: 'Okuduklarım', icon: History },
    { id: 'customize', label: 'Market', icon: ShoppingCart },
    { id: 'settings', label: 'Ayarlar', icon: SettingsIcon, link: '/settings' },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'listeler', label: 'Listeler', icon: BookOpen },
    { id: 'basarimlar', label: 'Başarımlar', icon: Award },
  ] : [
    { id: 'listeler', label: 'Listeler', icon: BookOpen },
    { id: 'basarimlar', label: 'Başarımlar', icon: Award },
    { id: 'etkinlik', label: 'Etkinlik', icon: History },
  ];

  // Helper for History
  const historyData = useMemo(() => {
    if (!readingHistory) return [];
    return readingHistory.map(h => {
      const s = series.find(ser => String(ser.id) === String(h.manhwaId));
      return { ...h, series: s };
    }).filter(h => h.series);
  }, [readingHistory, series]);

  const handleSaveEffects = async (bundleId = null) => {
    try {
      let updates = {};
      if (bundleId === 'none') {
        updates = { active_mix: { avatar: 'none', comment: 'none', nametag: 'none', aura: 'none', nameplate: 'none' } };
      } else if (bundleId && bundleId !== 'mix') {
        const bundle = ELITE_BUNDLES.find(b => b.id === bundleId);
        updates = { active_mix: { ...bundle.effects, aura: bundle.canvasEffect, nameplate: mixState.nameplate } };
      } else {
        updates = { active_mix: mixState };
      }
      await updateProfile(updates);
    } catch (err) { console.error(err); }
  };

  // --- SUB-COMPONENT: Nameplate Item ---
  const NameplateItem = ({ filename, isActive, onSelect }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onSelect}
        className={`relative aspect-[3/1] rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
          isActive 
            ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]' 
            : 'border-white/5 hover:border-white/20 bg-zinc-900/50'
        }`}
      >
        <video 
          src={`/nameplates/${filename}`} 
          autoPlay={isActive || isHovered} 
          muted loop 
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-300 ${isActive || isHovered ? 'opacity-100' : 'opacity-40'}`}
        />
        
        {isActive && (
          <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
            <div className="bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-md shadow-xl flex items-center gap-1">
              <Check size={10} /> KUŞANILDI
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const categories = useMemo(() => ['Tümü', ...new Set(effectsData.map(d => d.category))], []);

  const filteredDecorations = useMemo(() => {
    return decorationCategory === 'Tümü' 
      ? effectsData 
      : effectsData.filter(d => d.category === decorationCategory);
  }, [decorationCategory]);

  // ... (getSocialIcon, getPlatformUrl logic)

  const getSocialIcon = (platform) => {
    switch (platform) {
      case 'discord': return <MessageSquare size={14} className="text-indigo-400" />;
      case 'youtube': return <Youtube size={14} className="text-red-500" />;
      case 'instagram': return <Instagram size={14} className="text-pink-500" />;
      case 'twitter': return <Twitter size={14} className="text-blue-400" />;
      case 'github': return <Github size={14} className="text-white" />;
      default: return <LinkIcon size={14} className="text-zinc-500" />;
    }
  };

  const getPlatformUrl = (link) => {
    if (link.type === 'url') return link.value;
    switch (link.platform) {
      case 'instagram': return `https://instagram.com/${link.value}`;
      case 'twitter': return `https://twitter.com/${link.value}`;
      case 'youtube': return `https://youtube.com/@${link.value}`;
      case 'github': return `https://github.com/${link.value}`;
      case 'discord': return `https://discord.com/users/${link.value}`;
      default: return '#';
    }
  };

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-purple-500/30 pt-20 bg-[#0B0E14]">
      

      <AnimatePresence>
        {showLinksModal && (
          <ConnectedAccountsModal 
            isOpen={showLinksModal} 
            onClose={() => setShowLinksModal(false)} 
            onSave={setUserLinks}
            initialLinks={userLinks}
          />
        )}
      </AnimatePresence>

      {/* ── PREMIUM MODAL ── */}
      <AnimatePresence>
        {showPremiumModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPremiumModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl bg-zinc-950 border border-amber-500/30 rounded-[3rem] p-10 overflow-hidden shadow-[0_0_100px_rgba(245,158,11,0.15)]"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowPremiumModal(false)} className="p-3 rounded-2xl bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 font-black text-[10px] uppercase tracking-widest mb-6">
                  <Crown size={14} /> ELITE KARARGAH
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                  Sınırsız Güce <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Eriş</span>
                </h2>
                <p className="text-zinc-400 max-w-xl mx-auto">Premium olarak tüm kilitli siber donanımları anında cephaneliğine ekle ve gücünü kanıtla.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-12">
                {ELITE_BUNDLES.slice(0, 5).map(bundle => (
                  <div key={bundle.id} className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
                    <span className="text-3xl block mb-2">{bundle.icon}</span>
                    <span className="block text-[10px] font-black text-zinc-300 uppercase truncate">{bundle.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => setShowPremiumModal(false)} className="px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-zinc-500 hover:text-white transition-all">
                  Şimdilik Kalsın
                </button>
                <button onClick={() => navigate('/elite-upgrade')} className="px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/20 hover:scale-105 hover:shadow-amber-500/40 transition-all flex items-center gap-2">
                  ŞİMDİ YÜKSELT <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PREMIUM TOAST ── */}
      <AnimatePresence>
        {premiumToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-4 p-4 pr-6 rounded-2xl bg-zinc-900 border border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.2)]"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/50">
              <Lock size={20} className="text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-tight">Bu Efekt Kilitli</h4>
              <p className="text-[10px] text-zinc-400 font-medium">Kuşanmak için Elite Karargah üyesi olmalısın.</p>
            </div>
            <button onClick={() => { setPremiumToast(false); setShowPremiumModal(true); }} className="ml-4 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all">
              BİLGİ AL
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MIX & KARIŞTIR MODAL ── */}
      <AnimatePresence>
        {isMixModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMixModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl bg-[#151921] border border-zinc-800 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/30">
                    <Palette className="text-purple-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Siber Mix Masası</h3>
                    <p className="text-sm text-slate-400">Kilidini açtığın paketlerin parçalarını birleştir</p>
                  </div>
                </div>
                <button onClick={() => setIsMixModalOpen(false)} className="p-2 rounded-xl hover:bg-white/5 text-slate-400"><X /></button>
              </div>

              <div className="space-y-8">
                {(() => {
                  const parts = getUnlockedEffectParts(currentUser?.role, currentUser?.unlocked_effects);
                  const sections = [
                    { id: 'aura', label: 'Canvas Afiş (Arkaplan)', items: parts.aura },
                    { id: 'avatar', label: 'Profil Çerçevesi (Aura)', items: parts.avatar },
                    { id: 'comment', label: 'Yorum Kutusu', items: parts.comment },
                    { id: 'nametag', label: 'İsim Etiketi', items: parts.nametag }
                  ];

                  return sections.map(section => (
                    <div key={section.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <h4 className="text-lg font-black text-slate-300 mb-4">{section.label}</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        <button
                          onClick={() => setMixState(prev => ({ ...prev, [section.id]: 'none' }))}
                          className={`flex-shrink-0 px-5 py-3 rounded-xl border transition-all duration-300 font-bold text-sm
                            ${mixState[section.id] === 'none'
                              ? 'bg-slate-700 border-slate-500 text-white shadow-lg shadow-slate-900/20'
                              : 'bg-black/20 border-white/10 text-slate-400 hover:border-white/20'
                            }
                          `}
                        >
                          Hiçbiri
                        </button>
                        {section.items.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setMixState(prev => ({ ...prev, [section.id]: item.id }))}
                            className={`flex-shrink-0 px-5 py-3 rounded-xl border transition-all duration-300 font-bold text-sm
                              ${mixState[section.id] === item.id
                                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25'
                                : 'bg-black/20 border-white/10 text-slate-400 hover:border-white/20'
                              }
                            `}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ));
                })()}

                <div className="flex gap-4 pt-4 border-t border-white/10">
                  <button 
                    onClick={() => setIsMixModalOpen(false)}
                    className="flex-1 py-4 bg-zinc-900 border border-white/5 text-slate-400 font-bold rounded-2xl hover:text-white transition-all"
                  >
                    Kapat
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedBundle('mix');
                      setIsMixModalOpen(false);
                      handleSaveEffects('mix');
                    }}
                    className="flex-[2] py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-2xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 hover:scale-105 transition-all"
                  >
                    <Check size={20} /> MİXİ KAYDET & KUŞAN
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT SIDEBAR: User Info */}
          <aside className="w-full lg:w-[320px] shrink-0 space-y-6 relative z-10">
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2rem] overflow-hidden shadow-2xl relative">
              
              {/* Sidebar Background Blur Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-50 bg-zinc-950/20 backdrop-blur-3xl" />

              {/* Profile Header */}
              <div className="p-8 flex flex-col items-center text-center space-y-4 relative z-10">
                <AnimeAvatar 
                  src={displayUser.avatar_url} 
                  effect={previewEffect || activeEffectObj} 
                  size="w-32 h-32" 
                  forcePlay={true}
                />

                <div className="relative w-full aspect-[3/1] flex flex-col items-center justify-center overflow-hidden rounded-2xl group border border-white/5 shadow-xl">
                  {/* --- NAMEPLATE VIDEO BACKGROUND --- */}
                  {(isOwnProfile ? mixState.nameplate : (displayUser.active_mix?.nameplate || 'none')) !== 'none' && (
                    <div className="absolute inset-0 z-0">
                      <video 
                        src={`/nameplates/${isOwnProfile ? mixState.nameplate : displayUser.active_mix.nameplate}`} 
                        autoPlay muted loop playsInline 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                    </div>
                  )}

                  <div className="relative z-10 text-center w-full px-2">
                    <h2 className={`text-xl font-black tracking-tighter flex items-center justify-center gap-1.5 ${
                      (isOwnProfile ? mixState.nametag : (displayUser.active_mix?.nametag || 'none')) !== 'none' 
                        ? `nametag-effect-${isOwnProfile ? mixState.nametag : displayUser.active_mix.nametag}` 
                        : 'text-white'
                    }`}>
                      <span className="truncate max-w-[140px]">{displayUser.username}</span>
                      <span className="text-[7px] font-black bg-white/10 px-1 py-0.5 rounded text-zinc-400 border border-white/5 shadow-sm shrink-0">SV.{displayUser.level || 1}</span>
                    </h2>
                    <p className="text-zinc-500 text-[7px] font-bold tracking-[0.15em] uppercase mt-0.5 opacity-50 truncate">anipeak.com/profil/{displayUser.username}</p>
                  </div>
                </div>

                <p className="text-zinc-400 text-xs italic font-medium">
                  "{displayUser.bio || 'Henüz bir biyografi eklenmemiş.'}"
                </p>

                {!isOwnProfile && currentUser && (
                  <div className="flex gap-2 w-full pt-2">
                    <button 
                      onClick={handleFollow}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-xl ${
                        isFollowing 
                        ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'
                      }`}
                    >
                      {isFollowing ? <Minus size={14} /> : <UserPlus size={14} />}
                      {isFollowing ? 'Takipten Çık' : 'Takip Et'}
                    </button>
                    <button className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white transition-all">
                      <Mail size={16} />
                    </button>
                  </div>
                )}

                {isOwnProfile && (
                  <div className="flex gap-2 w-full pt-2">
                    <button 
                      onClick={() => navigate('/settings')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-[10px] font-black uppercase hover:bg-zinc-800 transition-all"
                    >
                      <Edit3 size={14} /> Profili Düzenle
                    </button>
                    <button 
                      onClick={() => setShowLinksModal(true)}
                      className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white transition-all"
                    >
                      <LinkIcon size={16} />
                    </button>
                    <button 
                      onClick={() => setShowPremiumModal(true)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase shadow-lg shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-1"
                    >
                      <Crown size={12} /> PREMIUM
                    </button>
                    {(currentUser?.role === 'Baş Admin' || currentUser?.role === 'Yönetici') && (
                      <Link to="/admin" className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase hover:bg-amber-500/20 transition-all">
                        <Shield size={14} />
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-5 border-y border-zinc-800/50 bg-zinc-950/30">
                {[
                  { label: 'TAKİPÇİ', value: displayUser.followers || 0 },
                  { label: 'TAKİP', value: displayUser.following || 0 },
                  { label: 'FAVORİ', value: displayUser.favorites || 0 },
                  { label: 'TAKİP', value: 0 },
                  { label: 'YORUM', value: displayUser.comments || 0 },
                ].map((stat, i) => (
                  <div key={i} className="py-4 flex flex-col items-center justify-center gap-0.5 border-r last:border-0 border-zinc-800/50">
                    <span className="text-xs font-black text-white">{stat.value}</span>
                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-tighter">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Footer Info */}
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  <Calendar size={14} /> {displayUser.joinDate || '29 Nis 2026'} Tarihinden Beri Üye
                </div>

                {/* Social Links */}
                <div className="space-y-3">
                  <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">BAĞLANTILAR</h3>
                  <div className="flex flex-col gap-2">
                    {userLinks.map((link, idx) => (
                      <a 
                        key={idx}
                        href={getPlatformUrl(link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900 transition-all group"
                      >
                         {getSocialIcon(link.platform)}
                         <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white truncate">{link.value}</span>
                      </a>
                    ))}
                    {isOwnProfile && (
                      <button 
                        onClick={() => setShowLinksModal(true)}
                        className="flex items-center justify-center gap-2 mt-1 p-3 rounded-2xl bg-zinc-950/20 border border-dashed border-zinc-800/50 text-[9px] font-black uppercase text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
                      >
                        <Plus size={12} /> Bağlantı Ekle
                      </button>
                    )}
                  </div>
                </div>

                {/* XP Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-zinc-500">SEVİYE {displayUser.level || 1}</span>
                    <span className="text-zinc-400">{displayUser.xp || 0} / 100 XP</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(displayUser.xp || 0, 100)}%` }}
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-500" 
                    />
                  </div>
                </div>

                {/* Achievements Preview */}
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">BAŞARIMLAR</h3>
                     <span className="text-[9px] font-black text-zinc-500">0/50</span>
                   </div>
                   <div className="grid grid-cols-5 gap-2">
                     {[...Array(5)].map((_, i) => (
                       <div key={i} className="aspect-square rounded-lg bg-zinc-950/50 border border-zinc-800/50 flex items-center justify-center text-zinc-800">
                         <Award size={14} />
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT CONTENT: Tabs & Sections */}
          <main className="flex-1 min-w-0 space-y-6">
            
            {/* Tab Navigation */}
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-1.5 flex gap-1 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const tabClass = `flex-1 min-w-[110px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-zinc-800 text-white shadow-xl' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`;
                if (tab.link) {
                  return (
                    <Link key={tab.id} to={tab.link} className={tabClass}>
                      <tab.icon size={16} />
                      {tab.label}
                    </Link>
                  );
                }
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={tabClass}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2.5rem] p-8 min-h-[600px]"
              >
                {activeTab === 'history' && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                        <History size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Okuma Geçmişi</h3>
                        <p className="text-zinc-500 text-xs">Kaldığın yerden devam et uşağım!</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {historyData.length > 0 ? historyData.map((h, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800/50 hover:border-purple-500/30 transition-all group">
                          <div className="w-20 h-28 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={h.series.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                            <h4 className="text-sm font-black text-white line-clamp-1">{h.series.title}</h4>
                            <p className="text-[10px] text-purple-400 font-bold uppercase mt-1">Bölüm {h.lastChapter}</p>
                            <p className="text-[9px] text-zinc-600 mt-2">{new Date(h.updatedAt).toLocaleDateString('tr-TR')}</p>
                          </div>
                          <button className="self-center p-3 rounded-xl bg-purple-600/10 text-purple-400 hover:bg-purple-600 hover:text-white transition-all">
                            <Play size={16} fill="currentColor" />
                          </button>
                        </div>
                      )) : (
                        <p className="text-zinc-500 text-sm italic col-span-full py-10 text-center">Henüz bir okuma geçmişi mühürlenmemiş.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'customize' && (
                  <div className="space-y-10">
                    {/* ── HEADER ── */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                          <ShoppingCart size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight">Siber Market</h3>
                          <p className="text-zinc-500 text-xs">Elit paketlerini kuşan &amp; efektlerini seç</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsMixModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center gap-2 hover:bg-purple-600/20 transition-all"
                      >
                        <Palette size={14} className="text-purple-400" />
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Siber Mix Masası</span>
                      </button>
                    </div>

                    {/* ── ELITE BUNDLES (Şimdilik Gizli) ── 
                    <div>
                      <div className="flex items-center gap-3 text-zinc-500 mb-5">
                        <Crown size={14} />
                        <h4 className="text-[10px] font-black uppercase tracking-widest">ELİT PAKETLER</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {ELITE_BUNDLES.map((bundle) => {
                          const hasAccess = canUseBundle(bundle.id, currentUser?.role, currentUser?.unlocked_effects);
                          const isActiveBnd = selectedBundle === bundle.id;
                          return (
                            <div key={bundle.id} className={`p-6 rounded-[2rem] border transition-all duration-300 relative overflow-hidden group ${
                              isActiveBnd ? 'bg-purple-600/10 border-purple-500 shadow-[0_0_30px_rgba(139,92,246,0.25)]' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                            }`}>
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-2xl">{bundle.icon}</span>
                                {hasAccess ? (
                                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><Check size={16} /></div>
                                ) : (
                                  <div className="p-2 rounded-lg bg-zinc-800 text-zinc-500"><Lock size={16} /></div>
                                )}
                              </div>
                              <h4 className="text-lg font-black text-white uppercase">{bundle.name}</h4>
                              <p className="text-[10px] text-zinc-500 font-bold mb-6">{bundle.anime}</p>
                              {hasAccess ? (
                                <button
                                  onClick={() => handleSaveEffects(bundle.id)}
                                  disabled={isActiveBnd}
                                  className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    isActiveBnd ? 'bg-zinc-800 text-zinc-500 cursor-default' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-105 shadow-lg shadow-purple-600/20'
                                  }`}
                                >
                                  {isActiveBnd ? 'KUŞANILDI' : 'KUŞAN'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => setShowPremiumModal(true)}
                                  className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-105 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                                >
                                  <Crown size={14} /> PREMIUM AL
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    */}

                    {/* --- İSİM PLAKETİ SECTION --- */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3 text-zinc-500">
                          <CreditCard size={14} />
                          <h4 className="text-[10px] font-black uppercase tracking-widest italic">İSİM PLAKETİ MARKERİ</h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                        {/* Remove Option */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const newMix = { ...mixState, nameplate: 'none' };
                            setMixState(newMix);
                            handleSaveEffects('mix');
                          }}
                          className={`relative aspect-[3/1] rounded-xl overflow-hidden border-2 flex items-center justify-center cursor-pointer transition-all ${
                            mixState.nameplate === 'none' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-zinc-900/50'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <X size={16} className="text-zinc-500" />
                            <span className="text-[10px] font-black uppercase text-zinc-500">Kaldır</span>
                          </div>
                          {mixState.nameplate === 'none' && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                              <Check size={10} className="text-white" />
                            </div>
                          )}
                        </motion.div>

                        {/* Nameplate List */}
                        {nameplatesData.map((filename) => (
                          <NameplateItem 
                            key={filename} 
                            filename={filename} 
                            isActive={mixState.nameplate === filename}
                            onSelect={() => {
                              const newMix = { ...mixState, nameplate: filename };
                              setMixState(newMix);
                              updateProfile({ active_mix: newMix });
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="h-[1px] bg-white/5 w-full my-8" />

                    {/* ── DECORATION GRID ── */}
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3 text-zinc-500">
                          <ImageIcon size={14} />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">PROFIL ÇERÇEVELİ &amp; DEKORASYONLAR</h4>
                        </div>
                        {/* Category Filter */}
                        <div className="flex gap-1.5 p-1 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                          {categories.slice(0, 4).map(cat => (
                            <button
                              key={cat}
                              onClick={() => setDecorationCategory(cat)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${decorationCategory === cat ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Live Preview Banner */}
                      {previewEffect && isOwnProfile && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mb-5 p-4 rounded-2xl border flex items-center justify-between transition-colors ${saveError ? 'bg-red-500/10 border-red-500/30' : 'bg-indigo-500/10 border-indigo-500/30'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${saveError ? 'bg-red-400' : 'bg-indigo-400'}`} />
                            <div className="flex flex-col">
                              <span className={`text-xs font-bold ${saveError ? 'text-red-300' : 'text-indigo-300'}`}>
                                {saveError ? 'Hata Oluştu' : `Canlı Önizleme: `}
                                {!saveError && <strong className="text-white">{previewEffect.label}</strong>}
                              </span>
                              {saveError && <span className="text-[10px] text-red-400 font-medium">{saveError}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              disabled={saveLoading}
                              onClick={() => { setPreviewEffect(null); setSaveError(null); }}
                              className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase hover:bg-zinc-700 transition-all disabled:opacity-50"
                            >
                              İptal
                            </button>
                            <button
                              disabled={saveLoading}
                              onClick={async () => { 
                                setSaveLoading(true);
                                setSaveError(null);
                                try {
                                  await updateProfile({ active_decoration: previewEffect.id });
                                  setActiveDecoration(previewEffect.id); 
                                  setPreviewEffect(null); 
                                } catch(err) {
                                  console.error('Kaydetme hatası:', err);
                                  const errorMsg = err.message || '';
                                  if (errorMsg.includes('profiles_role_check')) {
                                    setSaveError('KRİTİK: Veri tabanı rütbeni tanımıyor! supabase_patch.sql dosyasını Supabase SQL Editor\'de çalıştır.');
                                  } else {
                                    setSaveError(errorMsg || 'Veri tabanı hatası');
                                  }
                                } finally {
                                  setSaveLoading(false);
                                }
                              }}
                              className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              {saveLoading ? 'KAYDEDİLİYOR...' : 'Kaydet'}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
                        {filteredDecorations.map((effect, idx) => {
                          const premiumRoles = ['Baş Admin', 'Yönetici', 'Admin', 'Admin Yardımcısı', 'Editör', 'Tester', 'Premium'];
                          const hasPremiumAccess = premiumRoles.includes(currentUser?.role);
                          const isPremiumLocked = !hasPremiumAccess && idx >= PREMIUM_FREE_COUNT;
                          const isActive = previewEffect?.id === effect.id || (!previewEffect && activeDecoration === effect.id);

                          return (
                            <motion.div
                              key={effect.id}
                              whileHover={{ scale: isPremiumLocked ? 1.02 : 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`group relative flex flex-col items-center justify-center py-6 px-2 rounded-2xl border transition-all duration-300 ease-out cursor-pointer ${
                                isPremiumLocked
                                  ? 'bg-zinc-900/50 border-zinc-800/50 opacity-75'
                                  : isActive
                                    ? 'bg-zinc-800 ring-2 ring-indigo-500 shadow-[0_0_35px_rgba(99,102,241,0.5)] border-transparent'
                                    : 'bg-zinc-900 border-transparent hover:-translate-y-1 hover:bg-white/10 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.6)]'
                              }`}
                              onClick={() => {
                                if (isPremiumLocked) {
                                  setPremiumToast(true);
                                  setTimeout(() => setPremiumToast(false), 3000);
                                  return;
                                }
                                if (isOwnProfile) {
                                  setPreviewEffect(effect);
                                }
                              }}
                            >
                              {/* Effect preview image */}
                              <div className="relative flex items-center justify-center p-0 m-0 overflow-visible mb-6">
                                <AnimeAvatar 
                                  src={null} 
                                  effect={effect} 
                                  size="w-20 h-20" 
                                  forcePlay={isActive}
                                />
                                {isActive && !isPremiumLocked && (
                                  <div className="absolute -top-2 -right-2 p-1 rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/50 z-20">
                                    <Zap size={10} className="fill-current" />
                                  </div>
                                )}
                              </div>

                              {/* Label */}
                              <div className="text-center w-full overflow-hidden">
                                <span className={`block text-[10px] font-black uppercase tracking-tight transition-colors truncate ${
                                  isActive ? 'text-white' : isPremiumLocked ? 'text-zinc-600' : 'text-zinc-400 group-hover:text-zinc-200'
                                }`}>
                                  {effect.label || effect.name}
                                </span>
                                <span className="block text-[7px] font-bold text-zinc-700 uppercase tracking-[0.2em] mt-0.5 italic">
                                  {effect.category}
                                </span>
                              </div>

                              {/* Premium Lock Overlay (Siber Elite UI) */}
                              {isPremiumLocked && (
                                <div className="absolute inset-0 rounded-2xl bg-zinc-950/70 backdrop-blur-[3px] flex flex-col items-center justify-center p-4 transition-all duration-300 group-hover:bg-zinc-950/40 group-hover:backdrop-blur-none z-30">
                                  <motion.div 
                                    whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                                    className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                  >
                                    <Lock size={18} className="text-amber-500 shadow-sm" />
                                  </motion.div>
                                  <div className="mt-3 text-center">
                                    <span className="block text-[8px] font-black text-amber-500/80 uppercase tracking-[0.25em]">ELİT KİLİT</span>
                                    <span className="block text-[6px] font-bold text-zinc-500 uppercase mt-0.5">Premium Gerekir</span>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-8 max-w-2xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                        <SettingsIcon size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Hesap Ayarları</h3>
                        <p className="text-zinc-500 text-xs">Profilini ve tercihlerini güncelle</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
                        <input type="text" defaultValue={currentUser?.username} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-purple-500/50 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Biyografi</label>
                        <textarea defaultValue={currentUser?.bio} rows={4} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 text-sm font-medium text-white outline-none focus:border-purple-500/50 transition-all resize-none" />
                      </div>
                      <button className="px-10 py-4 rounded-2xl bg-purple-600 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-600/20 hover:scale-105 transition-all">
                        DEĞİŞİKLİKLERİ KAYDET
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-8 max-w-2xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-400">
                        <Bell size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Bildirimler</h3>
                        <p className="text-zinc-500 text-xs">Ne zaman rahatsız edilmek istersin?</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { id: 'new_chapter', title: 'Yeni Bölüm Uyarıları', desc: 'Takip ettiğin serilere yeni bölüm geldiğinde haber ver.' },
                        { id: 'system', title: 'Sistem Duyuruları', desc: 'Önemli güncellemeler ve bakım modları hakkında bilgilendir.' },
                        { id: 'mentions', title: 'Bahsetmeler ve Yanıtlar', desc: 'Yorumlarına gelen yanıtlar için bildirim gönder.' }
                      ].map((pref) => (
                        <div key={pref.id} className="flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800/50 rounded-2xl hover:bg-zinc-800/50 transition-all">
                          <div className="pr-6">
                            <h4 className="text-sm font-black text-white">{pref.title}</h4>
                            <p className="text-[10px] text-zinc-500 mt-1">{pref.desc}</p>
                          </div>
                          <label className="relative cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-12 h-6 bg-zinc-800 rounded-full peer peer-checked:bg-purple-600 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-zinc-400 after:rounded-full after:transition-all peer-checked:after:translate-x-6 peer-checked:after:bg-white shadow-sm" />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'listeler' && (
                  <div className="space-y-12">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight">Anime Listeleri (0)</h3>
                          <p className="text-zinc-500 text-xs">Özel anime koleksiyonları</p>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase hover:bg-zinc-700 transition-all">
                        <Plus size={14} /> Yeni Liste
                      </button>
                    </div>

                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                       <div className="p-6 rounded-full bg-zinc-950/50 text-zinc-800">
                         <BookOpen size={48} />
                       </div>
                       <div className="space-y-1">
                         <p className="text-zinc-500 text-sm font-medium">Henüz bir listen yok. İlk listeni oluştur!</p>
                       </div>
                       <button className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black uppercase shadow-lg shadow-purple-500/20 hover:scale-105 transition-all">
                         Liste Oluştur
                       </button>
                    </div>

                    <div className="pt-12 border-t border-zinc-800/50">
                       <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                               <img src="https://myanimelist.net/favicon.ico" className="w-6 h-6 grayscale brightness-200" />
                            </div>
                            <div>
                               <h3 className="text-sm font-black text-white uppercase tracking-tight">MyAnimeList</h3>
                               <p className="text-zinc-500 text-[10px] font-bold">Bağlı değil</p>
                            </div>
                         </div>
                         <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase hover:bg-zinc-700 transition-all">
                           MAL Bağla
                         </button>
                       </div>
                       <p className="text-center text-zinc-500 text-xs font-medium">
                         MAL hesabını bağlayarak anime listeni buraya aktarabilirsin.
                       </p>
                    </div>
                  </div>
                )}

                {(activeTab === 'basarimlar' || activeTab === 'etkinlik') && (
                   <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
                      <div className="p-4 rounded-full bg-zinc-950 text-zinc-800">
                        {activeTab === 'basarimlar' ? <Award size={48} /> : <History size={48} />}
                      </div>
                      <p className="text-zinc-500 text-sm font-medium">Bu bölüme ait bir veri bulunamadı.</p>
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

function ConnectedAccountsModal({ isOpen, onClose, onSave, initialLinks }) {
  const [links, setLinks] = useState(initialLinks?.length > 0 ? initialLinks : [{ platform: '', value: '', type: 'username' }]);
  const platforms = [
    { id: 'discord', label: 'Discord', icon: MessageSquare },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'twitter', label: 'Twitter / X', icon: Twitter },
    { id: 'reddit', label: 'Reddit', icon: LinkIcon },
    { id: 'tiktok', label: 'TikTok', icon: Zap },
    { id: 'github', label: 'GitHub', icon: Github },
  ];

  const addRow = () => setLinks([...links, { platform: '', value: '', type: 'username' }]);
  const removeRow = (idx) => setLinks(links.filter((_, i) => i !== idx));
  const updateRow = (idx, field, val) => {
    const newLinks = [...links];
    newLinks[idx][field] = val;
    setLinks(newLinks);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className="relative w-full max-w-lg bg-[#151921] border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Bağlı Hesaplar</h3>
          <button onClick={onClose} className="p-2 rounded-xl bg-zinc-900 text-zinc-500 hover:text-white transition-all">
            <Plus size={20} className="rotate-45" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {links.map((link, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center group">
              <div className="relative w-full sm:w-40 shrink-0">
                <select 
                  value={link.platform}
                  onChange={(e) => updateRow(idx, 'platform', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs font-bold text-zinc-300 appearance-none focus:border-purple-500 transition-all cursor-pointer"
                >
                  <option value="">Platform Seç</option>
                  {platforms.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                   <Plus size={14} className="rotate-0" />
                </div>
              </div>

              <div className="relative flex-1 w-full">
                <input 
                  type="text"
                  placeholder={link.type === 'username' ? "Kullanıcı adı" : "Bağlantı URL'si"}
                  value={link.value}
                  onChange={(e) => updateRow(idx, 'value', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs font-bold text-zinc-100 focus:border-purple-500 transition-all"
                />
                <button 
                  onClick={() => updateRow(idx, 'type', link.type === 'username' ? 'url' : 'username')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-zinc-500 hover:text-purple-400 transition-all"
                >
                  {link.type === 'username' ? 'URL GİR' : 'AD GİR'}
                </button>
              </div>

              <button 
                onClick={() => removeRow(idx)}
                className="p-3 rounded-xl bg-zinc-900 text-zinc-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
              >
                <Plus size={16} className="rotate-45" />
              </button>
            </div>
          ))}

          <button 
            onClick={addRow}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-[10px] font-black uppercase text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all w-fit"
          >
            <Plus size={14} /> Bağlantı Ekle
          </button>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/20">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-zinc-900 text-zinc-400 text-xs font-black uppercase hover:bg-zinc-800 transition-all"
          >
            İptal
          </button>
          <button 
            onClick={() => {
              handleSaveLinks(links.filter(l => l.platform && l.value));
              onClose();
            }}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black uppercase shadow-lg shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={14} className="rotate-0" /> Kaydet
          </button>
        </div>
      </motion.div>
    </div>
  );
}
