import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Tv,
  Image as ImageIcon,
  User,
  Filter,
  Paintbrush,
  Shield,
  Bell,
  Play,
  Lock,
  X,
  CreditCard,
  Check,
  AlertCircle,
  Upload,
  Minus,
  ShoppingCart,
  Package,
  Crown, 
  Sparkles, 
  ChevronRight, 
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth, getLevelInfo } from '../context/AuthContext.jsx';
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
import { fetchMALList } from '../lib/malService';

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


/**
 * ProfileEffectSpritesheet — Otomatik kare sayısı tespiti.
 * Discord tarzı spritesheet'ler yatay şeritlerdir: width / height = kare sayısı.
 * Resmin gerçek piksel boyutlarını ölçüp doğru steps() değerini hesaplar.
 */
function ProfileEffectSpritesheet({ url }) {
  const [frameData, setFrameData] = useState({ count: null, direction: 'h' });
  const containerRef = useRef(null);

  useEffect(() => {
    setFrameData({ count: null, direction: 'h' });
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w > h) {
        const ratio = Math.round(w / h);
        setFrameData({ count: ratio > 1 ? ratio : 1, direction: 'h' });
      } else {
        const ratio = Math.round(h / w);
        setFrameData({ count: ratio > 1 ? ratio : 1, direction: 'v' });
      }
    };
    img.onerror = () => setFrameData({ count: 1, direction: 'h' });
    img.src = url;
  }, [url]);

  if (frameData.count === null || frameData.count <= 1) {
    return <img src={url} alt="Effect" className="w-full h-full object-fill" />;
  }

  const fps = 12;
  const duration = frameData.count / fps;
  const isV = frameData.direction === 'v';

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundImage: `url(${url})`,
        backgroundSize: isV ? `100% ${frameData.count * 100}%` : `${frameData.count * 100}% 100%`,
        backgroundPosition: 'center center',
        animation: `${isV ? 'siber-spritesheet-vertical' : 'siber-spritesheet'} ${duration}s steps(${frameData.count - 1}) infinite`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}

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
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [malError, setMalError] = useState(null);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [listLikes, setListLikes] = useState({}); // { listId: { count: 0, isLiked: false } }
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [isListCreating, setIsListCreating] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };
  
  // SOCIAL & RPG STATES
  const [readHistory, setReadHistory] = useState([]);
  const [customLists, setCustomLists] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [malList, setMalList] = useState([]);
  const [malLoading, setMalLoading] = useState(false);
  
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
          const { data: followData, error: followErr } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', data.id)
            .maybeSingle();
            
          if (!followErr) {
            setIsFollowing(!!followData);
          }
        }

        // Fetch Real Stats (Follows, Comments, Favorites)
        if (data.id) {
          fetchCounts(data.id);
          fetchSocialData(data.id, data.mal_username);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchProfile();
  }, [username, supabase, currentUser?.id]); 

  const fetchCounts = async (userId) => {
    const { count: fCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
    const { count: fwCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
    setFollowersCount(fCount || 0);
    setFollowingCount(fwCount || 0);

    const { count: cCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    setCommentsCount(cCount || 0);

    const { count: favCount } = await supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    setFavoritesCount(favCount || 0);
  };

  const fetchSocialData = async (userId, malUsername) => {
    // 1. Reading History
    const { data: rhData } = await supabase
      .from('reading_history')
      .select('*, series(title, cover, description)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    setReadHistory(rhData || []);

    // 2. Custom Lists
    const { data: clData } = await supabase
      .from('custom_lists')
      .select('*, custom_list_items(series_id, series(title, cover))')
      .eq('user_id', userId);
    setCustomLists(clData || []);

    // 3. Achievements
    const { data: achData } = await supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', userId);
    setUserAchievements(achData || []);

    // 4. MAL List (if provided)
    if (malUsername) {
      setMalLoading(true);
      setMalError(null);
      try {
        const data = await fetchMALList(malUsername, 'animelist'); // Try anime first
        setMalList(data || []);
        if (!data || data.length === 0) {
          // If anime is empty, try manga
          const mData = await fetchMALList(malUsername, 'mangalist');
          setMalList(mData || []);
        }
      } catch (err) {
        console.error("Fetch social error:", err);
        setMalError(err.message || "MAL verisi alınamadı.");
      } finally {
        setMalLoading(false);
      }
    }
  };

  const handleCreateList = async (e) => {
    if (e) e.preventDefault();
    if (!newListName.trim()) return;
    setIsListCreating(true);
    try {
      const { data, error } = await supabase
        .from('custom_lists')
        .insert({
          user_id: currentUser.id,
          name: newListName,
          description: newListDesc,
          is_public: true
        })
        .select()
        .single();
      
      if (error) {
        console.log("Supabase Kayıt Hatası [custom_lists]:", error);
        throw error;
      }
      
      setCustomLists(prev => [data, ...prev]);
      setShowCreateListModal(false);
      setNewListName('');
      setNewListDesc('');
      
      // Anında ışınlanıyoruz uşağım!
      navigate(`/${currentUser.username}/liste/${data.id}`);
    } catch (err) {
      console.error("Create list error:", err);
      showToast("Liste oluşturulamadı uşağım! Konsolu kontrol et.");
    } finally {
      setIsListCreating(false);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!confirm('Bu listeyi ebediyen silmek istediğine emin misin uşağım?')) return;
    try {
      await supabase.from('custom_lists').delete().eq('id', listId);
      setCustomLists(prev => prev.filter(l => l.id !== listId));
    } catch (err) {
      console.error("Delete list error:", err);
    }
  };



  // Real-time Follows Subscription
  useEffect(() => {
    if (!profileData?.id) return;

    const channel = supabase.channel(`profile-stats-${profileData.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'follows' 
      }, (payload) => {
        // Eğer bu profili ilgilendiren bir takip değişikliği varsa sayıları tazele
        fetchCounts(profileData.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileData?.id, supabase]);

  const rawUser = (isOwnProfile ? (profileData || currentUser) : profileData) || {
    username: username,
    role: 'Üye',
    bio: 'Profil yükleniyor...',
    avatar_url: null,
    xp: 0,
    joinDate: '...',
    followers: 0,
    following: 0,
    active_decoration: 'none',
    active_mix: { avatar: 'none', comment: 'none', nametag: 'none', aura: 'none', nameplate: 'none', profile_effect: 'none' },
  };

  const levelInfo = getLevelInfo(rawUser.xp || 0);
  
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
  const [mixState, setMixState] = useState(currentUser?.active_mix || { avatar: 'none', comment: 'none', nametag: 'none', aura: 'none', nameplate: 'none', profile_effect: 'none' });
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

  const displayUser = useMemo(() => {
    const base = { ...rawUser, ...levelInfo };
    if (isOwnProfile) {
      return {
        ...base,
        active_decoration: mixState.avatar || activeDecoration || 'none',
        active_mix: mixState
      };
    }
    return base;
  }, [rawUser, levelInfo, isOwnProfile, mixState, activeDecoration]);

  // --- Verification Logic (Siber Karargah Versiyonu) ---
  const [verifCode, setVerifCode] = useState(currentUser?.discord_sync_code || null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mevcut kodun süresini kontrol et
  useEffect(() => {
    if (currentUser?.discord_sync_code && currentUser?.discord_sync_code_expires) {
      const expiry = new Date(currentUser.discord_sync_code_expires).getTime();
      const remaining = Math.floor((expiry - Date.now()) / 1000);
      if (remaining > 0) {
        setVerifCode(currentUser.discord_sync_code);
        setTimeLeft(remaining);
      } else {
        setVerifCode(null);
        setTimeLeft(0);
      }
    }
  }, [currentUser]);

  const generateDiscordCode = async () => {
    if (!currentUser?.id) return;
    setIsGenerating(true);
    
    try {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const code = `AP-${randomDigits}`;
      const expiresAt = new Date(Date.now() + 5 * 60000).toISOString(); // 5 Dakika

      const { error } = await supabase
        .from('profiles')
        .update({
          discord_sync_code: code,
          discord_sync_code_expires: expiresAt
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      setVerifCode(code);
      setTimeLeft(300); // 5 minutes
    } catch (err) {
      console.error('[Verification] Kod üretme hatası:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const disconnectDiscord = async () => {
    if (!confirm('Discord mührünü bozmak istediğine emin misin uşağım?')) return;
    try {
      await updateProfile({ 
        discord_id: null, 
        discord_sync_code: null, 
        discord_sync_code_expires: null 
      });
      setVerifCode(null);
      setTimeLeft(0);
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeEffectObj = useMemo(() => {
    return effectsData.find(e => e.id === activeDecoration);
  }, [activeDecoration]);

  const handleSaveLinks = async (newLinks) => {
    try {
      const malLink = newLinks.find(l => l.platform === 'myanimelist');
      const updates = { links: newLinks };
      if (malLink) updates.mal_username = malLink.value;
      
      await updateProfile(updates);
      setUserLinks(newLinks);
      
      if (isOwnProfile) {
        setProfileData(prev => ({ ...prev, ...updates }));
      }
      
      // If MAL changed, re-fetch social data
      if (malLink && malLink.value) {
        fetchSocialData(currentUser.id, malLink.value);
      }
    } catch (err) {
      console.error('Links save error:', err);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return;
    try {
      if (isFollowing) {
        setIsFollowing(false);
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profileData.id);
        if (error) {
          console.error('Unfollow error details:', error.message, error.details, error.hint);
          setIsFollowing(true);
        } else {
          fetchCounts(profileData.id);
        }
      } else {
        setIsFollowing(true);
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: profileData.id });
        if (error) {
          console.error('Follow error details:', error.message, error.details, error.hint);
          setIsFollowing(false);
        } else {
          fetchCounts(profileData.id);
        }
      }
    } catch (err) {
      console.error('Follow error handle:', err);
    }
  };

  const handleStartChat = () => {
    if (!profileData?.username) return;
    navigate(`/messages?user=${profileData.username}`);
  };
  

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
    const activeId = isOwnProfile ? (mixState.avatar || 'none') : (displayUser.active_mix?.avatar || 'none');
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

  // Navigation Tabs
  const tabs = isOwnProfile ? [
    { id: 'okunanlar', label: 'Okuduklarım', icon: History },
    { id: 'listeler', label: 'Listeler', icon: BookOpen },
    { id: 'mal', label: 'MAL Listem', icon: Tv },
    { id: 'basarimlar', label: 'Başarımlar', icon: Award },
    { id: 'customize', label: 'Market', icon: ShoppingCart },
    { id: 'settings', label: 'Ayarlar', icon: SettingsIcon, link: '/settings' },
  ] : [
    { id: 'okunanlar', label: 'Okudukları', icon: History },
    { id: 'listeler', label: 'Listeler', icon: BookOpen },
    { id: 'mal', label: 'MAL Listesi', icon: Tv },
    { id: 'basarimlar', label: 'Başarımlar', icon: Award },
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
        updates = { active_mix: { avatar: 'none', comment: 'none', nametag: 'none', aura: 'none', nameplate: 'none', profile_effect: 'none' } };
      } else if (bundleId && bundleId !== 'mix') {
        const bundle = ELITE_BUNDLES.find(b => b.id === bundleId);
        updates = { active_mix: { ...bundle.effects, aura: bundle.canvasEffect, nameplate: mixState.nameplate, profile_effect: mixState.profile_effect || 'none' } };
      } else {
        updates = { active_mix: mixState };
      }
      await updateProfile(updates);
    } catch (err) { console.error(err); }
  };

  const decorationEffectsData = useMemo(() => effectsData.filter(e => e.category !== 'profile_effects'), []);
  const categories = useMemo(() => ['Tümü', ...new Set(decorationEffectsData.map(d => d.category))], [decorationEffectsData]);

  const filteredDecorations = useMemo(() => {
    return decorationCategory === 'Tümü' 
      ? decorationEffectsData 
      : decorationEffectsData.filter(d => d.category === decorationCategory);
  }, [decorationCategory, decorationEffectsData]);

  const getSocialIcon = (platform) => {
    switch (platform) {
      case 'discord': return <MessageSquare size={14} className="text-indigo-400" />;
      case 'youtube': return <Youtube size={14} className="text-red-500" />;
      case 'instagram': return <Instagram size={14} className="text-pink-500" />;
      case 'twitter': return <Twitter size={14} className="text-blue-400" />;
      case 'github': return <Github size={14} className="text-white" />;
      case 'myanimelist': return <Tv size={14} className="text-blue-500" />;
      default: return <LinkIcon size={14} className="text-zinc-500" />;
    }
  };

  const getPlatformUrl = (link) => {
    if (link.type === 'url') return link.value;
    switch (link.platform) {
      case 'discord': return `https://discord.com/users/${link.value}`;
      case 'youtube': return `https://youtube.com/@${link.value}`;
      case 'instagram': return `https://instagram.com/${link.value}`;
      case 'twitter': return `https://twitter.com/${link.value}`;
      case 'github': return `https://github.com/${link.value}`;
      case 'myanimelist': return `https://myanimelist.net/profile/${link.value}`;
      default: return link.value;
    }
  };

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-purple-500/30 pt-24 pb-12 bg-[#020203]">
      
      {/* ── MODALS ── */}
      <AnimatePresence>
        {showLinksModal && (
          <ConnectedAccountsModal 
            isOpen={showLinksModal} 
            onClose={() => setShowLinksModal(false)} 
            onSave={handleSaveLinks}
            initialLinks={userLinks}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMixModalOpen && (
          <EliteMixModal 
            isOpen={isMixModalOpen} 
            onClose={() => setIsMixModalOpen(false)} 
            mixState={mixState} 
            setMixState={setMixState} 
            onSave={(newMix) => updateProfile({ active_mix: newMix })} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPremiumModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPremiumModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-5xl bg-zinc-950 border border-amber-500/30 rounded-[3rem] p-10 overflow-hidden shadow-[0_0_100px_rgba(245,158,11,0.15)]">
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowPremiumModal(false)} className="p-3 rounded-2xl bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"><X size={20} /></button>
              </div>
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 font-black text-[10px] uppercase tracking-widest mb-6"><Crown size={14} /> ELITE KARARGAH</div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">Sınırsız Güce <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Eriş</span></h2>
                <p className="text-zinc-400 max-w-xl mx-auto">Premium olarak tüm kilitli özel efektlere ve dekorasyonlara anında eriş ve gününü kanıtla uşağım.</p>
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
                <button onClick={() => setShowPremiumModal(false)} className="px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-zinc-500 hover:text-white transition-all">Şimdilik Kalsın</button>
                <button onClick={() => navigate('/elite-upgrade')} className="px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/20 hover:scale-105 hover:shadow-amber-500/40 transition-all flex items-center gap-2">ŞİMDİ YÜKSELT <ArrowRight size={16} /></button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

               <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start max-w-[1700px] mx-auto px-4 sm:px-6">
          
          {/* ── LEFT SIDEBAR (SCREENSHOT 1 STYLE) ── */}
          <aside className="w-full lg:w-[320px] shrink-0 space-y-6">
            <div className="glass bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden p-6 sm:p-8 flex flex-col items-center relative">
               {/* Background Effect */}
               {displayUser.active_mix?.profile_effect && displayUser.active_mix?.profile_effect !== 'none' && (
                 <div className="absolute inset-0 z-[-1] opacity-20">
                   <img 
                     src={effectsData.find(e => e.id === displayUser.active_mix.profile_effect)?.url} 
                     className="w-full h-full object-cover" 
                   />
                 </div>
               )}

               <div className="relative mb-8">
                  <div className="w-40 h-40 relative">
                     <AnimeAvatar 
                        src={displayUser.avatar_url} 
                        effect={selectedDecoration}
                        size="w-40 h-40"
                        className="rounded-full shadow-2xl"
                     />
                  </div>
               </div>

               {/* SCREENSHOT 3 STYLE NAME AREA */}
               <div className="w-full text-center space-y-4 relative z-10">
                  <div className="relative inline-flex items-center justify-center min-w-[240px] min-h-[60px] px-10 py-4">
                    {/* Nameplate Background */}
                    {displayUser.active_mix?.nameplate && displayUser.active_mix?.nameplate !== 'none' && (
                      <div className="absolute inset-0 z-[-1] rounded-xl overflow-hidden shadow-2xl border border-white/10">
                        <video 
                          src={`/nameplates/${displayUser.active_mix.nameplate}`} 
                          autoPlay 
                          muted 
                          loop 
                          playsInline 
                          className="w-full h-full object-fill opacity-100" 
                        />
                      </div>
                    )}
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)] z-10">
                      {displayUser.username}
                    </h1>
                  </div>

                  <div className="inline-flex px-4 py-1.5 rounded-full bg-zinc-950 border border-zinc-800">
                     <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{displayUser.fullLabel}</span>
                  </div>

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-40" />
                  
                  <div className="flex justify-between items-end px-2">
                     <div className="text-left">
                        <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">RANK</div>
                        <div className="text-[10px] font-black text-white uppercase">LV. {displayUser.level} MANGA HÜKÜMDARI</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">TOTAL XP</div>
                        <div className="text-[10px] font-black text-white">{displayUser.xp}</div>
                     </div>
                  </div>
               </div>

               {/* Discord Seal / Mührü (Interaktif) */}
               <div className="w-full mt-8 pt-8 border-t border-white/5 space-y-4">
                  {displayUser.discord_id ? (
                     <div className="group relative p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-4 overflow-hidden">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                 <Shield size={14} />
                              </div>
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">Discord Mührü</span>
                           </div>
                           <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#10b981]" />
                        </div>
                        {isOwnProfile && (
                           <button 
                              onClick={disconnectDiscord}
                              className="w-full py-2 bg-zinc-950/50 hover:bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl border border-white/5 hover:border-red-500/20 transition-all"
                           >
                              MÜHRÜ BOZ
                           </button>
                        )}
                     </div>
                  ) : isOwnProfile ? (
                     <div className="space-y-4">
                        {verifCode && timeLeft > 0 ? (
                           <div className="p-5 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 space-y-4 text-center animate-in zoom-in-95 duration-300">
                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Senkronizasyon Kodu</p>
                              <div className="py-3 bg-zinc-950 rounded-xl border border-indigo-500/30">
                                 <span className="text-2xl font-black text-white tracking-[0.2em] font-mono select-all leading-none">{verifCode}</span>
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                 <p className="text-[9px] font-bold text-amber-500/80 uppercase">Geçerlilik: {formatTime(timeLeft)}</p>
                              </div>
                              <button 
                                 onClick={generateDiscordCode}
                                 className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
                              >
                                 YENİ KOD AL
                              </button>
                           </div>
                        ) : (
                           <button 
                              onClick={generateDiscordCode}
                              disabled={isGenerating}
                              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                           >
                              <Shield size={14} />
                              {isGenerating ? 'YÜKLENİYOR...' : 'DİSCORD BAĞLA'}
                           </button>
                        )}
                     </div>
                  ) : (
                     <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-zinc-800/20 border border-white/5 opacity-50">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded-lg bg-zinc-800 text-zinc-500">
                              <MessageSquare size={14} />
                           </div>
                           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Mühür Yok</span>
                        </div>
                     </div>
                  )}
               </div>

               <p className="text-zinc-500 text-[11px] font-medium leading-relaxed mt-6 mb-8 text-center italic">
                 "{displayUser.bio || 'Henüz bir biyografi eklenmemiş.'}"
               </p>

               <div className="w-full space-y-3">
                  {isOwnProfile ? (
                    <>
                      <button onClick={() => navigate('/settings')} className="w-full py-4 rounded-2xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white text-[10px] font-black uppercase tracking-widest transition-all">PROFİLİ DÜZENLE</button>
                      <button onClick={() => navigate('/elite-upgrade')} className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <Crown size={14} /> PREMIUM
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={handleFollow} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isFollowing ? 'bg-zinc-800 text-zinc-400' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}>
                        {isFollowing ? 'TAKİPTEN ÇIK' : 'TAKİP ET'}
                      </button>
                      <button onClick={handleStartChat} className="p-4 rounded-2xl bg-zinc-800 text-zinc-400 hover:text-white transition-all"><MessageSquare size={16} /></button>
                    </div>
                  )}
               </div>

               <div className="w-full mt-10 pt-8 border-t border-white/5 space-y-8">
                  <div className="space-y-4">
                     <div className="text-[10px] font-black text-white uppercase tracking-[0.2em]">BAĞLANTILAR</div>
                     <div className="space-y-2">
                        {userLinks.map((link, idx) => (
                           <a key={idx} href={getPlatformUrl(link)} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:border-blue-500/30 transition-all group">
                              <div className="flex items-center gap-3">
                                 {getSocialIcon(link.platform)}
                                 <span className="text-[10px] font-black text-zinc-300 uppercase">{link.platform}</span>
                              </div>
                              <ChevronRight size={12} className="text-zinc-600 group-hover:text-blue-400 transition-colors" />
                           </a>
                        ))}
                        {isOwnProfile && userLinks.length === 0 && (
                          <button onClick={() => setShowLinksModal(true)} className="w-full p-4 rounded-xl border border-dashed border-white/10 text-[9px] font-black text-zinc-500 hover:text-white transition-all uppercase">HESABI BAĞLA</button>
                        )}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <div className="text-[10px] font-black text-white uppercase tracking-[0.2em]">BAŞARIMLAR</div>
                        <div className="text-[9px] font-black text-zinc-500">{userAchievements.length}/100</div>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {userAchievements.slice(0, 5).map((ua, i) => (
                           <div key={i} className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/5 flex items-center justify-center text-amber-500" title={ua.achievements?.name}>
                              <Award size={14} />
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="flex items-center gap-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest pt-4 border-t border-white/5">
                     <Calendar size={14} className="text-blue-500" />
                     {new Date(displayUser.joinDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} TARIHINDEN BERI ÜYE
                  </div>
               </div>
            </div>
          </aside>

          {/* ── MIDDLE MAIN CONTENT (SCREENSHOT 1 & 2 STYLE) ── */}
          <main className="flex-1 min-w-0 space-y-8">
            
            {/* LARGE BANNER CARD */}
            <div className="relative rounded-[3rem] overflow-hidden bg-zinc-900 border border-white/5 aspect-[16/6] lg:aspect-[16/5]">
               <div className="absolute inset-0">
                  <img src="https://images.unsplash.com/photo-1541560052-77ec1bbc09f7?q=80&w=2574&auto=format&fit=crop" className="w-full h-full object-cover" />
                  
                  {/* Profile Effect Overlay on Banner */}
                  {displayUser.active_mix?.profile_effect && displayUser.active_mix?.profile_effect !== 'none' && (
                    <div className="absolute inset-0 z-10 opacity-30 mix-blend-screen overflow-hidden pointer-events-none">
                      <img 
                        src={effectsData.find(e => e.id === displayUser.active_mix.profile_effect)?.url} 
                        className="w-full h-full object-cover animate-pulse" 
                        style={{ animationDuration: '10s' }}
                      />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-20" />
               </div>
               
               <div className="absolute inset-0 p-10 lg:p-16 flex flex-col justify-end">
                  <p className="text-zinc-400 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mb-4">Hoş geldin,</p>
                  <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">{displayUser.username} <span className="text-lg md:text-xl align-middle text-blue-500 opacity-50 ml-2">LV. {displayUser.level}</span></h2>
                  <p className="text-zinc-400 max-w-xl text-xs sm:text-sm font-medium leading-relaxed mb-10">Manga okumak, başka dünyalarda yaşamaktır. Kendi efsaneni burada inşa etmeye devam et uşağım.</p>
                  
                  {/* STATS ROW (SCREENSHOT 2 STYLE) */}
                  <div className="flex flex-wrap gap-4 sm:gap-10">
                     {[
                        { label: 'Okuduğu Seri', value: readHistory.length, icon: BookOpen },
                        { label: 'Favoriler', value: favoritesCount, icon: Star },
                        { label: 'Yorumlar', value: commentsCount, icon: MessageSquare },
                        { label: 'Takipçi', value: followersCount, icon: UserPlus },
                        { label: 'Takip', value: followingCount, icon: User },
                        { label: 'Günlük Seri', value: 12, icon: Zap },
                     ].map((stat, i) => (
                        <div key={i} className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                              <stat.icon size={20} />
                           </div>
                           <div>
                              <div className="text-2xl font-black text-white">{stat.value}</div>
                              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                {/* DEVAM EDİYOR (ALT ALTA LİSTE) */}
                <div className="glass bg-zinc-900/20 border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 space-y-8">
                   <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">DEVAM EDİYOR</h3>
                      <button onClick={() => setActiveTab('okunanlar')} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">Tümünü Gör <ChevronRight size={10} className="inline ml-1" /></button>
                   </div>
                   
                   <div className="space-y-6">
                     {readHistory.length > 0 ? readHistory.slice(0, 3).map((history, idx) => (
                       <div key={idx} className="flex gap-6 group">
                          <div className="w-24 h-36 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/5 group-hover:scale-105 transition-transform">
                             <img src={history.series?.cover} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 flex flex-col justify-center py-2">
                             <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">{history.series?.title}</h4>
                             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">Bölüm {history.last_read_chapter}</p>
                             
                             <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                   <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden mr-4">
                                      <div className="h-full w-[78%] bg-blue-600 rounded-full" />
                                   </div>
                                   <span className="text-[10px] font-black text-zinc-500">%78</span>
                                </div>
                                <Link to={`/manhwa/${history.series_id}`} className="px-6 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 w-fit">
                                   <Play size={12} className="fill-current" /> Devam Et
                                </Link>
                             </div>
                          </div>
                       </div>
                     )) : (
                       <div className="py-12 text-center text-zinc-600 text-[10px] font-bold uppercase">Henüz okunmuş bir seri yok.</div>
                     )}
                   </div>
                </div>

               {/* OKUMA İSTATİSTİKLERİ */}
               <div className="glass bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-sm font-black text-white uppercase tracking-widest">OKUMA İSTATİSTİKLERİ</h3>
                     <select className="bg-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-none rounded-lg py-2 px-4 outline-none">
                        <option>Bu Ay</option>
                     </select>
                  </div>
                  
                  <div className="flex items-center gap-10">
                     <div className="relative w-32 h-32 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90">
                           <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="12" className="text-zinc-800" />
                           <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray="364.4" strokeDashoffset="260" className="text-blue-500" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-3xl font-black text-white leading-none">36</span>
                           <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1">Saat</span>
                        </div>
                     </div>
                     
                     <div className="flex-1 space-y-4">
                        {[
                           { label: 'Okuma Süresi', value: '36 saat', color: 'bg-blue-500' },
                           { label: 'Okuduğun Bölüm', value: '245', color: 'bg-purple-500' },
                           { label: 'Tamamlanan Seri', value: '8', color: 'bg-emerald-500' },
                           { label: 'Favoriye Eklenen', value: '12', color: 'bg-orange-500' },
                        ].map((item, i) => (
                           <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{item.label}</span>
                              </div>
                              <span className="text-[10px] font-black text-white uppercase">{item.value}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* LOWER CONTENT AREA */}
            <AnimatePresence mode="wait">
               <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
               >
                  {activeTab === 'etkinlik' && (
                    <div className="grid grid-cols-1 gap-8">
                       {/* FAVORİLERİM */}
                       <div className="glass bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                          <div className="flex justify-between items-center">
                             <h3 className="text-sm font-black text-white uppercase tracking-widest">FAVORİLERİM</h3>
                             <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">Tümünü Gör <ChevronRight size={10} className="inline ml-1" /></button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                             {readHistory.slice(0, 6).map((h, i) => (
                               <Link key={i} to={`/manhwa/${h.series_id}`} className="group relative rounded-2xl overflow-hidden aspect-[2/3] bg-zinc-950 border border-white/5">
                                  <img src={h.series?.cover} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                  <div className="absolute bottom-3 left-3 right-3">
                                     <div className="text-[9px] font-black text-white uppercase truncate">{h.series?.title}</div>
                                     <div className="text-[7px] font-black text-zinc-500 uppercase">Bölüm {h.last_read_chapter}</div>
                                  </div>
                               </Link>
                             ))}
                          </div>
                       </div>

                       {/* SON AKTİVİTELER */}
                       <div className="glass bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                          <div className="flex justify-between items-center">
                             <h3 className="text-sm font-black text-white uppercase tracking-widest">SON AKTİVİTELER</h3>
                             <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">Tümünü Gör <ChevronRight size={10} className="inline ml-1" /></button>
                          </div>
                          <div className="space-y-6">
                             {readHistory.slice(0, 5).map((h, i) => (
                               <div key={i} className="flex items-center gap-4 group">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/5">
                                     <img src={h.series?.cover} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1">
                                     <div className="text-[10px] font-black text-zinc-300 uppercase leading-none">
                                        <span className="text-white">{h.series?.title}</span> serisinin {h.last_read_chapter}. bölümünü okudu.
                                     </div>
                                     <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">2 saat önce</div>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}

                  {activeTab === 'okunanlar' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {readHistory.map((h, i) => (
                          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                             <Link to={`/manhwa/${h.series_id}`} className="group block glass bg-zinc-950/40 border border-white/5 rounded-[2rem] p-5 hover:border-blue-500/30 transition-all">
                                <div className="flex gap-5">
                                   <div className="w-24 h-32 rounded-xl overflow-hidden shrink-0 shadow-2xl">
                                      <img src={h.series?.cover} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                   </div>
                                   <div className="flex-1 flex flex-col justify-center">
                                      <h4 className="text-sm font-black text-white uppercase truncate mb-1">{h.series?.title}</h4>
                                      <p className="text-[10px] font-black text-zinc-500 uppercase mb-4">Bölüm {h.last_read_chapter}</p>
                                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                         <div className="h-full w-[70%] bg-blue-600" />
                                      </div>
                                   </div>
                                </div>
                             </Link>
                          </motion.div>
                       ))}
                    </div>
                  )}

                  {activeTab === 'mal' && (
                    <div className="space-y-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3.5 rounded-[1.5rem] bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                            <Tv size={24} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">MAL Kütüphanesi</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">MyAnimeList üzerinden senkronize edilen kadim kayıtlar</p>
                          </div>
                        </div>
                      </div>

                      {malLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-6">
                           <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest animate-pulse">MAL Verileri Işınlanıyor...</p>
                        </div>
                      ) : malError ? (
                        <div className="py-20 text-center space-y-6">
                           <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                             <AlertCircle size={32} />
                           </div>
                           <p className="text-red-400 font-bold uppercase text-[10px] tracking-widest">{malError}</p>
                        </div>
                      ) : malList.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                           {malList.map((item, idx) => (
                             <motion.div
                               key={idx}
                               initial={{ opacity: 0, scale: 0.9 }}
                               animate={{ opacity: 1, scale: 1 }}
                               transition={{ delay: idx * 0.05 }}
                               className="group relative rounded-[2rem] overflow-hidden bg-zinc-950 border border-white/5 hover:border-blue-500/40 transition-all shadow-2xl"
                             >
                                <div className="aspect-[2/3] relative">
                                   <img src={item.node?.main_picture?.medium} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                   <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                                   <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-white/10 text-[10px] font-black text-blue-400">
                                      {item.list_status?.score > 0 ? `★ ${item.list_status.score}` : 'PUANSIZ'}
                                   </div>
                                </div>
                                <div className="p-4 space-y-2">
                                   <h5 className="text-[11px] font-black text-white uppercase truncate tracking-tighter">{item.node?.title}</h5>
                                   <div className="flex items-center justify-between">
                                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{item.list_status?.status?.replace(/_/g, ' ')}</span>
                                      <span className="text-[8px] font-black text-blue-500 uppercase">{item.list_status?.num_episodes_watched || item.list_status?.num_chapters_read} / {item.node?.num_episodes || item.node?.num_chapters || '?'}</span>
                                   </div>
                                </div>
                             </motion.div>
                           ))}
                        </div>
                      ) : (
                        <div className="py-24 text-center bg-zinc-950/50 rounded-[3rem] border border-dashed border-white/5 space-y-6">
                           <Tv size={64} className="text-zinc-800 mx-auto opacity-10" />
                           <p className="text-white font-black uppercase text-xs tracking-[0.2em]">MAL Listesi Boş veya Bağlı Değil</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'listeler' && (
                    <div className="space-y-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3.5 rounded-[1.5rem] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                            <BookOpen size={24} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Kadim Koleksiyonlar</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Kendi küratörlüğünle mühürlenmiş seriler</p>
                          </div>
                        </div>
                        {isOwnProfile && (
                          <button 
                            onClick={() => setShowCreateListModal(true)}
                            className="px-8 py-3.5 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                          >
                            <Plus size={16} /> Yeni Liste
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {customLists?.length > 0 ? customLists?.map((list, i) => (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => navigate(`/${displayUser.username}/liste/${list.id}`)}
                            className="group glass border border-white/5 rounded-[3rem] p-10 bg-zinc-950 hover:border-indigo-500/40 transition-all cursor-pointer relative overflow-hidden shadow-2xl"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                            
                            <div className="flex justify-between items-start mb-10">
                               <div>
                                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter group-hover:text-indigo-400 transition-colors leading-none">{list.name}</h4>
                                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-3">{list.custom_list_items?.length || 0} SERİ KOLEKSİYONU</p>
                               </div>
                               <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                  <ArrowRight size={20} />
                               </div>
                            </div>

                            <div className="flex -space-x-6">
                              {list.custom_list_items?.slice(0, 4).map((item, idx) => {
                                const s = series?.find(ser => String(ser.id) === String(item.series_id));
                                return (
                                  <motion.div 
                                    key={idx} 
                                    whileHover={{ y: -10, zIndex: 10, scale: 1.1 }}
                                    className="w-20 h-32 rounded-2xl border-4 border-zinc-950 overflow-hidden bg-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform transition-all"
                                  >
                                    <img src={s?.cover || '/placeholder.png'} className="w-full h-full object-cover" />
                                  </motion.div>
                                );
                              })}
                              {(list.custom_list_items?.length || 0) > 4 && (
                                <div className="w-20 h-32 rounded-2xl border-4 border-zinc-950 bg-zinc-900 flex flex-col items-center justify-center text-xs font-black text-indigo-400 shadow-2xl">
                                  <span>+{list.custom_list_items.length - 4}</span>
                                  <span className="text-[8px] uppercase">Daha</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-10 flex items-center gap-3 text-zinc-600 group-hover:text-indigo-500 transition-all">
                               <div className="w-8 h-px bg-current opacity-20" />
                               <span className="text-[9px] font-black uppercase tracking-[0.3em]">Mührü İncele</span>
                            </div>
                          </motion.div>
                        )) : (
                          <div className="col-span-full py-24 text-center bg-zinc-950/50 rounded-[3rem] border border-dashed border-white/5 space-y-6">
                            <BookOpen size={64} className="text-zinc-800 mx-auto opacity-10" />
                            <div>
                               <p className="text-white font-black uppercase text-sm tracking-[0.2em]">Henüz mühürlenmiş bir listen yok</p>
                               <p className="text-zinc-600 text-[10px] font-bold uppercase mt-2">Favori serilerini gruplayarak efsaneni başlat uşağım!</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'basarimlar' && (
                    <div className="space-y-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3.5 rounded-[1.5rem] bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5">
                            <Award size={24} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Kozmik Nişanlar</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Mühürlenmiş zaferler ve efsanevi görevler</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="text-right">
                              <div className="text-xs font-black text-white">{userAchievements?.length || 0}/100</div>
                              <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Tamamlandı</div>
                           </div>
                           <div className="w-12 h-12 rounded-full border-2 border-zinc-800 flex items-center justify-center p-1">
                              <div className="w-full h-full rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                 <Sparkles size={16} />
                              </div>
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {userAchievements.length > 0 ? userAchievements.map((ua, i) => (
                          <motion.div
                            key={ua.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -10, scale: 1.05 }}
                            className="group relative p-8 rounded-[2.5rem] bg-zinc-950 border border-white/5 hover:border-amber-500/40 transition-all text-center shadow-2xl overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="mb-6 relative z-10">
                              <div className="w-16 h-16 mx-auto rounded-[1.5rem] bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-zinc-950 shadow-[0_10px_30px_rgba(245,158,11,0.3)] group-hover:rotate-12 transition-transform duration-500">
                                <Award size={32} />
                              </div>
                            </div>
                            <div className="relative z-10 space-y-2">
                              <h4 className="text-[11px] font-black text-white uppercase tracking-tighter leading-tight line-clamp-1">{ua.achievements?.name}</h4>
                              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                                Mühür: {new Date(ua.unlocked_at).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                            <div className="absolute inset-0 p-6 opacity-0 group-hover:opacity-100 bg-zinc-950/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center text-center transition-all duration-300 z-20">
                              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 mb-4">
                                 <Info size={18} />
                              </div>
                              <p className="text-[10px] font-black text-white uppercase leading-relaxed tracking-tight">{ua.achievements?.description}</p>
                            </div>
                          </motion.div>
                        )) : (
                          <div className="col-span-full py-24 text-center bg-zinc-950/50 rounded-[3rem] border border-dashed border-white/5 space-y-6">
                            <Lock size={64} className="text-zinc-800 mx-auto opacity-10" />
                            <div>
                              <p className="text-white font-black uppercase text-sm tracking-[0.2em]">Henüz bir nişan kazanamadın</p>
                              <p className="text-zinc-600 text-[10px] font-bold uppercase mt-2">Okuma görevlerini tamamlayarak rütbeni kanıtla uşağım!</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'customize' && (
                    <div className="space-y-12">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3.5 rounded-[1.5rem] bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                            <ShoppingCart size={24} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Kozmik Cephanelik</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Görünüşünü efsanevi efektlerle donat</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsMixModalOpen(true)}
                          className="px-8 py-3.5 rounded-2xl bg-zinc-950 border border-white/10 flex items-center gap-3 hover:bg-zinc-900 hover:border-blue-500/50 transition-all shadow-xl"
                        >
                          <Palette size={18} className="text-blue-400" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Kombinasyon Oluştur</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-3 p-2 rounded-[2rem] bg-zinc-950 border border-white/5 shadow-inner">
                         {['Tümü', 'Efektler', 'Çerçeveler', 'Plaketler'].map((f) => (
                           <button 
                             key={f} 
                             onClick={() => setDecorationCategory(f)}
                             className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${decorationCategory === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-zinc-500 hover:text-white'}`}
                           >
                              {f}
                           </button>
                         ))}
                      </div>

                      {/* AVATAR ÇERÇEVELERİ */}
                      {(decorationCategory === 'Tümü' || decorationCategory === 'Çerçeveler') && (
                        <div>
                          <div className="flex items-center gap-3 text-indigo-400 mb-6">
                             <Shield size={14} />
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">AVATAR ÇERÇEVELERİ</h4>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              onClick={() => {
                                const newMix = { ...mixState, avatar: 'none' };
                                setMixState(newMix);
                                updateProfile({ active_mix: newMix });
                              }}
                              className={`p-6 rounded-[2.5rem] border transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer ${
                                mixState.avatar === 'none' ? 'bg-zinc-800 border-indigo-500 ring-2 ring-indigo-500/50' : 'bg-zinc-950 border-white/5'
                              }`}
                            >
                               <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-700 mb-4">
                                 <X size={20} />
                               </div>
                               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">HİÇ BİRİ</span>
                            </motion.div>

                            {effectsData.filter(e => e.category !== 'profile_effects' && e.category !== 'auras').map((effect) => (
                              <motion.div
                                key={effect.id}
                                whileHover={{ y: -5 }}
                                className={`group relative p-6 rounded-[2.5rem] bg-zinc-950 border transition-all duration-300 overflow-hidden cursor-pointer ${
                                  mixState.avatar === effect.id ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-2xl' : 'border-white/5 hover:border-white/20'
                                }`}
                                onClick={() => {
                                  const newMix = { ...mixState, avatar: effect.id };
                                  setMixState(newMix);
                                  updateProfile({ active_mix: newMix });
                                }}
                              >
                                 <div className="aspect-square w-full relative z-10 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <AnimeAvatar 
                                      src={displayUser.avatar_url} 
                                      effect={effect}
                                      size="w-24 h-24"
                                      forcePlay={true}
                                    />
                                 </div>
                                 <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
                                 <div className="relative z-20 mt-4 text-center">
                                    <span className="text-[10px] font-black text-white uppercase tracking-tight line-clamp-1">{effect.label}</span>
                                    <div className="text-[8px] font-bold text-zinc-500 uppercase mt-1 tracking-widest">{effect.category}</div>
                                 </div>
                                 {mixState.avatar === effect.id && (
                                   <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center z-30 shadow-lg">
                                     <Check size={12} className="text-white" />
                                   </div>
                                 )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
 
                      {/* Profil Efektleri */}
                      {(decorationCategory === 'Tümü' || decorationCategory === 'Efektler') && (
                        <div>
                          <div className="flex items-center gap-3 text-purple-400 mb-6 mt-10">
                             <Zap size={14} />
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">PROFİL KARTI EFEKTLERİ</h4>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className={`p-6 rounded-[2.5rem] border transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer ${
                                mixState.profile_effect === 'none' ? 'bg-zinc-800 border-purple-500 ring-2 ring-purple-500/50' : 'bg-zinc-950 border-white/5'
                              }`}
                              onClick={() => {
                                const newMix = { ...mixState, profile_effect: 'none' };
                                setMixState(newMix);
                                updateProfile({ active_mix: newMix });
                              }}
                            >
                               <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-700 mb-4">
                                 <X size={20} />
                               </div>
                               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">HİÇ BİRİ</span>
                            </motion.div>
  
                            {effectsData.filter(e => e.category === 'profile_effects').map((effect) => (
                              <motion.div
                                key={effect.id}
                                whileHover={{ y: -10, scale: 1.02 }}
                                className={`group relative aspect-[3/4] rounded-[2.5rem] bg-zinc-950 border transition-all duration-500 overflow-hidden cursor-pointer ${
                                  mixState.profile_effect === effect.id ? 'border-purple-500 ring-4 ring-purple-500/20 shadow-2xl' : 'border-white/5 hover:border-white/20'
                                }`}
                                onClick={() => {
                                  const newMix = { ...mixState, profile_effect: effect.id };
                                  setMixState(newMix);
                                  updateProfile({ active_mix: newMix });
                                }}
                              >
                                 <div className="absolute inset-0">
                                   <img 
                                     src={effect.url} 
                                     className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110" 
                                   />
                                   <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                                   <div className="absolute inset-0 bg-zinc-950/20 group-hover:bg-transparent transition-colors duration-500" />
                                 </div>
                                 
                                 <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                                    <div className="flex justify-between items-start">
                                      <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl">
                                        <Zap size={20} />
                                      </div>
                                      {mixState.profile_effect === effect.id && (
                                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                                          <Check size={14} className="text-white" />
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-3">
                                       <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
                                       <h5 className="text-xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-lg">{effect.label}</h5>
                                       <div className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">KOZMİK KOLEKSİYON</div>
                                    </div>
                                 </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
  
                      {/* İsim Plaketleri */}
                      {(decorationCategory === 'Tümü' || decorationCategory === 'Plaketler') && (
                        <div>
                          <div className="flex items-center gap-3 text-amber-400 mb-6 mt-10">
                             <CreditCard size={14} />
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">İSİM PLAKETLERİ</h4>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
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
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

          </main>

          {/* ── RIGHT NAVIGATION (SCREENSHOT 1 STYLE) ── */}
          <aside className="w-full lg:w-[350px] space-y-6 sticky top-24 no-scrollbar max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
             <div className="glass bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-4">
                <div className="space-y-2">
                   {tabs.map((tab) => (
                      <button
                         key={tab.id}
                         onClick={() => setActiveTab(tab.id)}
                         className={`w-full group relative flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-300 ${
                            activeTab === tab.id 
                               ? 'bg-blue-600 text-white shadow-[0_15px_30px_rgba(37,99,235,0.3)] scale-[1.02]' 
                               : 'text-zinc-500 hover:text-white hover:bg-white/5'
                         }`}
                      >
                         <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                            activeTab === tab.id ? 'bg-white/20' : 'bg-zinc-800'
                         }`}>
                            <tab.icon size={18} />
                         </div>
                         <div className="flex-1 text-left">
                            <div className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{tab.label}</div>
                            <div className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Görüntüle</div>
                         </div>
                         {activeTab === tab.id && (
                            <motion.div layoutId="activeTabGlow" className="absolute inset-0 rounded-2xl bg-white/10 blur-xl -z-10" />
                         )}
                         <ChevronRight size={14} className={`transition-transform duration-300 ${activeTab === tab.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                      </button>
                   ))}
                </div>
             </div>

             <div className="glass bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8">
                <div className="flex items-center gap-3 text-white mb-8">
                   <Award size={18} className="text-amber-500" />
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">BAŞARIMLAR</h4>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   {[
                     { id: 1, name: 'MÜREKKE...', date: '03.05.2026', color: 'amber' },
                     { id: 2, name: 'MANGA...', date: '03.05.2026', color: 'orange' },
                     { id: 3, name: 'KOZMİK...', date: '03.05.2026', color: 'indigo' },
                     { id: 4, name: 'KÜTÜPHA...', date: '04.05.2026', color: 'purple' },
                   ].map(ach => (
                      <motion.div 
                        key={ach.id} 
                        whileHover={{ y: -5 }}
                        className="flex flex-col items-center p-6 rounded-3xl bg-zinc-950 border border-white/5 relative overflow-hidden group cursor-pointer"
                      >
                         <div className={`absolute inset-0 bg-gradient-to-br from-${ach.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                         <div className={`w-14 h-14 rounded-2xl bg-${ach.color}-500/20 border border-${ach.color}-500/30 flex items-center justify-center text-${ach.color}-500 mb-4 shadow-lg shadow-${ach.color}-500/10`}>
                           <Award size={24} />
                         </div>
                         <span className="text-[10px] font-black text-white uppercase tracking-tight mb-1">{ach.name}</span>
                         <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">MÜHÜR:</div>
                         <div className="text-[8px] font-bold text-zinc-600 tracking-widest">{ach.date}</div>
                      </motion.div>
                   ))}
                </div>
             </div>
          </aside>
        </div>


      <AnimatePresence>
         {toast && (
           <motion.div 
             initial={{ opacity: 0, y: 50, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20, scale: 0.9 }}
             className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] px-8 py-4 bg-indigo-600 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(79,70,229,0.4)] flex items-center gap-4 border border-white/20"
           >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                 <Sparkles size={20} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest">Sistem Bilgisi</div>
                <div className="text-xs font-bold text-white/90">{toast}</div>
              </div>
              <button onClick={() => setToast(null)} className="ml-4 p-2 rounded-full hover:bg-white/10 transition-all">
                <X size={16} />
              </button>
           </motion.div>
         )}
      </AnimatePresence>

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
    { id: 'myanimelist', label: 'MyAnimeList', icon: Tv },
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-xl bg-zinc-950 border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden p-10"
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Kozmik Bağlantılar</h3>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Dijital varlığını senkronize et uşağım</p>
          </div>
          <button onClick={onClose} className="p-4 rounded-full bg-zinc-900 text-zinc-500 hover:text-white transition-all border border-white/5"><X size={24} /></button>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pr-2 mb-10">
          {links.map((link, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center group p-4 rounded-[2rem] bg-zinc-900/50 border border-white/5">
              <div className="relative w-full sm:w-44 shrink-0">
                <select value={link.platform} onChange={(e) => updateRow(idx, 'platform', e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-4 px-6 text-xs font-black text-zinc-300 appearance-none focus:border-purple-500 transition-all cursor-pointer">
                  <option value="">Platform Seç</option>
                  {platforms.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div className="relative flex-1 w-full">
                <input type="text" placeholder={link.type === 'username' ? "Kullanıcı Adı" : "URL Adresi"} value={link.value} onChange={(e) => updateRow(idx, 'value', e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-zinc-100 focus:border-purple-500 transition-all outline-none" />
              </div>
              <button onClick={() => removeRow(idx)} className="p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"><Minus size={20} /></button>
            </div>
          ))}
          <button onClick={addRow} className="w-full py-5 rounded-[2.5rem] bg-zinc-900 border border-dashed border-white/10 text-[10px] font-black uppercase text-zinc-500 hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center gap-3"><Plus size={16} /> Yeni Bağlantı Ekle</button>
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 rounded-[2.5rem] bg-zinc-900 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">İPTAL</button>
          <button onClick={() => { onSave(links.filter(l => l.platform && l.value)); onClose(); }} className="flex-[2] py-5 rounded-[2.5rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">MÜHÜRLERİ KAYDET <Sparkles size={18} /></button>
        </div>
      </motion.div>
    </div>
  );
}

function NameplateItem({ filename, isActive, onSelect }) {
  const isVideo = filename.endsWith('.webm');
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className={`relative aspect-[3/1] rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
        isActive ? 'border-purple-500 shadow-lg shadow-purple-500/30' : 'border-white/5 bg-zinc-900/50'
      }`}
    >
      {isVideo ? (
        <video 
          src={`/nameplates/${filename}`} 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="w-full h-full object-cover" 
        />
      ) : (
        <img src={`/nameplates/${filename}`} className="w-full h-full object-cover" />
      )}
      {isActive && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
          <Check size={12} className="text-white" />
        </div>
      )}
    </motion.div>
  );
}

function EliteMixModal({ isOpen, onClose, mixState, setMixState, onSave }) {
  if (!isOpen) return null;

  const parts = {
    aura: effectsData.filter(e => e.category === 'profile_effects'),
    avatar: effectsData.filter(e => e.category === 'avatar_decorations'),
    nameplate: nameplatesData
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-4xl bg-zinc-950 border border-white/5 rounded-[3rem] overflow-hidden flex flex-col h-[80vh]"
      >
        <div className="p-10 border-b border-white/5 flex items-center justify-between">
           <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Kozmik Mikser</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Kendi efsanevi kombinasyonunu yarat</p>
           </div>
           <button onClick={onClose} className="p-4 rounded-full bg-zinc-900 text-zinc-500 hover:text-white transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
           {/* Section by Section */}
           <div className="space-y-6">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">PROFIL EFEKTI</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <button 
                   onClick={() => setMixState(prev => ({ ...prev, profile_effect: 'none' }))}
                   className={`p-4 rounded-2xl border transition-all ${mixState.profile_effect === 'none' ? 'bg-purple-600 border-transparent text-white' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}
                 >
                    HİÇ BİRİ
                 </button>
                 {parts.aura.map(eff => (
                   <button 
                     key={eff.id}
                     onClick={() => setMixState(prev => ({ ...prev, profile_effect: eff.id }))}
                     className={`p-4 rounded-2xl border transition-all truncate text-[10px] font-bold ${mixState.profile_effect === eff.id ? 'bg-purple-600 border-transparent text-white' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}
                   >
                      {eff.label}
                   </button>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">AVATAR ÇERÇEVESİ</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <button 
                   onClick={() => setMixState(prev => ({ ...prev, avatar: 'none' }))}
                   className={`p-4 rounded-2xl border transition-all ${mixState.avatar === 'none' ? 'bg-purple-600 border-transparent text-white' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}
                 >
                    HİÇ BİRİ
                 </button>
                 {parts.avatar.map(eff => (
                   <button 
                     key={eff.id}
                     onClick={() => setMixState(prev => ({ ...prev, avatar: eff.id }))}
                     className={`p-4 rounded-2xl border transition-all truncate text-[10px] font-bold ${mixState.avatar === eff.id ? 'bg-purple-600 border-transparent text-white' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}
                   >
                      {eff.label}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="p-10 bg-zinc-900/50 border-t border-white/5 flex gap-4">
           <button onClick={onClose} className="flex-1 py-5 rounded-2xl bg-zinc-800 text-zinc-400 text-xs font-black uppercase">İPTAL</button>
           <button 
             onClick={() => { onSave(mixState); onClose(); }}
             className="flex-[2] py-5 rounded-2xl bg-purple-600 text-white text-xs font-black uppercase shadow-xl shadow-purple-600/30"
           >
              KOMBİNASYONU MÜHÜRLE
           </button>
        </div>
      </motion.div>
    </div>
  );
}

