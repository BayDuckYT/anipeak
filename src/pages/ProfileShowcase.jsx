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
  Gem,
  Ghost,
  Trophy,
} from 'lucide-react';
import { useAuth, getLevelInfo } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabaseClient';
import { useApp } from '../context/AppContext.jsx';
import AnimeAvatar from '../components/AnimeAvatar.jsx';
import UserBadges from '../components/UserBadges';
import { getOptimizedImage } from '../utils/imageOpt.js';
import effectsData from '../data/effects.json';
import nameplatesData from '../data/nameplates.json';
import Cropper from 'react-easy-crop';
import { uploadAvatar } from '../lib/imageService';
import { getEffectCSS, canUseBundle, getUnlockedEffectParts, ELITE_BUNDLES } from '../lib/eliteBundles';
import Loader from '../components/Loader.jsx';
import { renderCanvasEffect } from '../lib/canvasEffects';
import SiberVideo from '../components/SiberVideo';
import { usePerformance } from '../context/PerformanceContext';
import { fetchMALList } from '../lib/malService';
import { useSEO } from '../hooks/useSEO';

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

  useSEO({
    title: `${username} - Profil`,
    description: `${username} kullanıcısının AniPeak profil sayfası.`,
    url: `https://anipeak.com.tr/profil/${username}`
  });
  
  // Mock/Fallback data

  const [activeTab, setActiveTab] = useState('okunanlar');
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
          
          // Profil İzi Kaydetme (Sadece Elite kullanıcılar başkalarının profillerine iz bırakabilir)
          if (currentUser && currentUser.id !== data.id && (currentUser.active_plan_id === 'aethe' || currentUser.active_plan_id === 'ruler')) {
             try {
                // Saniyede 1 kereden fazla spam olmaması için upsert veya on conflict
                await supabase.from('profile_visits').insert({
                   profile_id: data.id,
                   visitor_id: currentUser.id,
                   visitor_plan: currentUser.active_plan_id
                }).select().single(); // Unique constraint ihlali olursa fail olur ama sorun değil, try-catch içinde.
             } catch(e) {}
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
          fetchRecentVisits(data.id);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchProfile();
  }, [username, supabase, currentUser?.id]); 

  const [recentVisits, setRecentVisits] = useState([]);
  const fetchRecentVisits = async (userId) => {
    try {
      // Sadece son 5 benzersiz ziyaretçiyi al
      const { data } = await supabase
        .from('profile_visits')
        .select('visitor_id, visitor_plan, visited_at, profiles:visitor_id(username, avatar_url)')
        .eq('profile_id', userId)
        .order('visited_at', { ascending: false })
        .limit(20);
        
      if (data) {
         // Aynı kişiden birden fazla iz varsa sadece en yenisini göster
         const unique = [];
         const seen = new Set();
         for(let v of data) {
            if(!seen.has(v.visitor_id)) {
               seen.add(v.visitor_id);
               unique.push(v);
            }
         }
         setRecentVisits(unique.slice(0, 5));
      }
    } catch (e) {}
  }; 

  const fetchCounts = async (userId) => {
    const { count: fCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
    const { count: fwCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
    setFollowersCount(fCount || 0);
    setFollowingCount(fwCount || 0);

    const { count: cCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    setCommentsCount(cCount || 0);

    // favorites tablosu mevcut olmadığı için 404 hatasını önlemek adına sorgu kaldırıldı
    setFavoritesCount(0);
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
    // Eğer kendi profiliyse arka planda eksik başarımları mühürle
    if (currentUser?.id === userId) {
      const { syncAllAchievements } = await import('../lib/achievementService');
      await syncAllAchievements(userId);
    }
    const { data: achData } = await supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', userId);
    setUserAchievements(achData || []);

    // 4. MAL List (if provided)
    if (malUsername && malUsername.toLowerCase() !== 'anipeak') {
      setMalLoading(true);
      setMalError(null);
      try {
        const data = await fetchMALList(malUsername, 'animelist'); // Try anime first
        setMalList(data || []);
        if (!data || data.length === 0) {
          // If anime is empty, try manga
          const mangaData = await fetchMALList(malUsername, 'mangalist');
          setMalList(mangaData || []);
        }
      } catch (err) {
        setMalError('MAL listesi alınamadı.');
      } finally {
        setMalLoading(false);
      }
    } else {
      setMalList([]);
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
      showToast("Liste oluşturulamadı! Lütfen tekrar dene.");
    } finally {
      setIsListCreating(false);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!confirm('Bu listeyi silmek istediğine emin misin?')) return;
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

  const levelInfo = getLevelInfo(rawUser.xp || 0, rawUser.is_elite, rawUser.active_plan_id);
  
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
  const [mixState, setMixState] = useState(currentUser?.active_mix || { avatar: 'none', comment: 'none', nametag: 'none', aura: 'none', nameplate: 'none', profile_effect: 'none', hue: 0 });
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
    let rawUser = isOwnProfile ? currentUser : (profileData || currentUser);
    if (!rawUser) return null;

    if (rawUser.username === 'ANIPEAK') {
      rawUser = { ...rawUser, active_plan_id: 'aethe', is_elite: true };
    }

    const levelInfo = getLevelInfo(rawUser.xp || 0, rawUser.active_plan_id);
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
    if (!confirm('Discord bağlantısını kesmek istediğine emin misin?')) return;
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
      showToast('Profiliniz Güncellendi');
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

  const decorationEffectsData = useMemo(() => effectsData, []);
  const categories = useMemo(() => ['Tümü', ...new Set(decorationEffectsData.map(d => d.category))], [decorationEffectsData]);

  const filteredDecorations = useMemo(() => {
    if (decorationCategory === 'Tümü') return decorationEffectsData;
    if (decorationCategory === 'Auralar') return decorationEffectsData.filter(d => d.category === 'profile_effects');
    if (decorationCategory === 'Avatar Çerçeveleri') return decorationEffectsData.filter(d => d.category === 'avatar_decorations' || d.category === 'decorations');
    if (decorationCategory === 'Plaketler') return nameplatesData.map((n, i) => ({ id: n, label: `İsim Plakası ${i + 1}`, url: n, category: 'nameplates' }));
    if (decorationCategory === 'İsim Efektleri') return decorationEffectsData.filter(d => d.category === 'name_effects');
    return decorationEffectsData.filter(d => d.category === decorationCategory);
  }, [decorationCategory, decorationEffectsData]);

  const getSocialIcon = (platform) => {
    switch (platform) {
      case 'discord': return <MessageSquare size={14} className="text-indigo-400" />;
      case 'youtube': return <Youtube size={14} className="text-red-500" />;
      case 'instagram': return <Instagram size={14} className="text-pink-500" />;
      case 'twitter': return <Twitter size={14} className="text-blue-400" />;
      case 'github': return <Github size={14} className="text-white" />;
      case 'myanimelist': return <Tv size={14} className="text-blue-500" />;
      default: return <LinkIcon size={14} className="text-zinc-400" />;
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

  if (loadingProfile) {
    return <Loader fullScreen={false} text="Profil Yükleniyor..." />;
  }

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
            onSave={(newMix) => {
              updateProfile({ active_mix: newMix });
              showToast('Profiliniz Güncellendi');
            }} 
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            className="fixed bottom-10 right-10 z-[200] flex items-center gap-4 px-6 py-4 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.15)]"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400 relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-full" />
              <Check size={18} strokeWidth={3} className="relative z-10" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white">{toast}</p>
              <p className="text-[10px] text-emerald-400/80 font-medium">Değişiklikler başarıyla kaydedildi.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPremiumModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPremiumModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-5xl bg-zinc-950 border border-amber-500/30 rounded-[3rem] p-10 overflow-hidden shadow-[0_0_100px_rgba(245,158,11,0.15)]">
              <div className="absolute top-0 right-0 p-6">
                <button aria-label="Premium penceresini kapat" onClick={() => setShowPremiumModal(false)} className="p-3 rounded-2xl bg-card-navy text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"><X size={20} /></button>
              </div>
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 font-black text-[10px] uppercase tracking-widest mb-6"><Crown size={14} /> ELITE ÜYELİK</div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">Sınırsız Güce <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Eriş</span></h2>
                <p className="text-zinc-400 max-w-xl mx-auto">Premium olarak tüm kilitli özel efektlere ve dekorasyonlara anında eriş.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-12">
                {ELITE_BUNDLES.slice(0, 5).map(bundle => (
                  <div key={bundle.id} className="p-4 rounded-3xl bg-card-navy border border-zinc-800 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
                    <span className="text-3xl block mb-2">{bundle.icon}</span>
                    <span className="block text-[10px] font-black text-zinc-300 uppercase truncate">{bundle.name}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => setShowPremiumModal(false)} className="px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-zinc-400 hover:text-white transition-all">Şimdilik Kalsın</button>
                <button onClick={() => navigate('/elite-upgrade')} className="px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/20 hover:scale-105 hover:shadow-amber-500/40 transition-all flex items-center gap-2">ŞİMDİ YÜKSELT <ArrowRight size={16} /></button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

               <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start max-w-[1700px] mx-auto px-4 sm:px-6">
          
          {/* ── LEFT SIDEBAR (SCREENSHOT 1 STYLE) ── */}
          <aside className="w-full lg:w-[320px] shrink-0 space-y-6">
            <div className="bg-[#070511]/80 border border-white/20 rounded-[2.5rem] overflow-hidden p-6 sm:p-8 flex flex-col items-center relative backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
               {/* Background Effect */}
                 <div className="absolute inset-0 z-[-1] opacity-100">
                   {effectsData.find(e => e.id === displayUser.active_mix.profile_effect)?.url && (
                     <img 
                       src={getOptimizedImage(effectsData.find(e => e.id === displayUser.active_mix.profile_effect)?.url, 400)} 
                       className="w-full h-full object-cover mix-blend-screen" 
                       width={320} height={500}
                       loading="eager" fetchpriority="high" decoding="async"
                       style={{ filter: `hue-rotate(${displayUser.active_mix?.hue || 0}deg)` }}
                       alt="Profile Effect"
                     />
                   )}
                   <div className="absolute inset-0 bg-gradient-to-b from-[#070511]/40 via-[#070511]/80 to-[#070511]" />
                 </div>

               <div className="relative mb-8">
                  <div className="w-40 h-40 relative">
                     <AnimeAvatar 
                        src={displayUser.avatar_url} 
                        effect={
                          (displayUser.active_mix?.avatar && displayUser.active_mix.avatar !== 'none')
                            ? effectsData.find(e => e.id === displayUser.active_mix.avatar)
                            : selectedDecoration
                        }
                        size="w-40 h-40"
                        className="rounded-full shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-white/10"
                        style={{ filter: `hue-rotate(${displayUser.active_mix?.hue || 0}deg)` }}
                        eager={true}
                     />
                  </div>
               </div>

               {/* SCREENSHOT 3 STYLE NAME AREA */}
               <div className="w-full text-center space-y-4 relative z-10">
                  <div className="relative inline-flex items-center justify-center w-full max-w-[320px] min-h-[60px] px-10 py-4">
                    {/* Nameplate Background */}
                    {displayUser.active_mix?.nameplate && displayUser.active_mix?.nameplate !== 'none' && (
                      <div className="absolute inset-0 z-[-1] rounded-xl overflow-hidden shadow-2xl border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        <video 
                          src={`/nameplates/${displayUser.active_mix.nameplate}`} 
                          autoPlay 
                          muted 
                          loop 
                          playsInline 
                          className="w-full h-full object-fill opacity-80"
                          style={{ filter: `hue-rotate(${displayUser.active_mix?.hue || 0}deg)` }}
                        />
                      </div>
                    )}
                    <h1 
                      className={`text-4xl font-black text-white uppercase tracking-tighter leading-none z-10 flex flex-row items-center gap-2 flex-nowrap whitespace-nowrap ${!(displayUser.active_mix?.nametag && displayUser.active_mix.nametag !== 'none') ? 'drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]' : ''}`}
                    >
                      <div className="flex flex-row items-center gap-1 shrink-0">
                        {['Baş Admin', 'Yönetici', 'Admin Yardımcısı', 'Editör', 'Tester'].includes(displayUser.role) && !displayUser.is_elite && (
                          <Gem size={28} className="text-cyan-400 animate-pulse drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] shrink-0" />
                        )}
                        {displayUser.is_elite && (
                          <>
                            {displayUser.active_plan_id === 'aethe' ? <img src="/aethe.png" alt="Aethe" className="animate-pulse drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] shrink-0 object-contain" style={{ width: 36, height: 36 }} /> :
                             displayUser.active_plan_id === 'shadow' ? <Ghost size={28} className="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] shrink-0" /> :
                             displayUser.active_plan_id === 'pro' ? <Trophy size={28} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] shrink-0" /> :
                             <Crown size={28} className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] shrink-0" />}
                          </>
                        )}
                      </div>
                      <span
                        className={displayUser.active_mix?.nametag && displayUser.active_mix.nametag !== 'none' ? 'name-effect-text drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]'}
                        style={displayUser.active_mix?.nametag && displayUser.active_mix.nametag !== 'none' ? { backgroundImage: `url(${effectsData.find(e => e.id === displayUser.active_mix.nametag)?.url})`, filter: `hue-rotate(${displayUser.active_mix?.hue || 0}deg)` } : {}}
                      >
                        {displayUser.username}
                      </span>
                    </h1>
                  </div>

                  <div className="inline-flex px-4 py-1.5 rounded-xl bg-white/5 border border-white/20 backdrop-blur-md shadow-lg">
                     <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${displayUser.rankStyle === 'elite-gold-glow' ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'text-blue-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]'}`}>
                        {displayUser.is_elite && (
                           displayUser.active_plan_id === 'aethe' ? (
                               <div className="w-4 h-4 flex items-center justify-center shrink-0 mr-1 mb-0.5">
                                  <img src="/aethe.png" alt="Aethe" className="object-contain max-w-none" style={{ width: 80, height: 80 }} />
                               </div>
                           ) :
                           displayUser.active_plan_id === 'shadow' ? <Ghost size={10} className="inline mr-1 mb-0.5" /> :
                           displayUser.active_plan_id === 'pro' ? <Trophy size={10} className="inline mr-1 mb-0.5" /> :
                           <Crown size={10} className="inline mr-1 mb-0.5" />
                        )}
                        <span>{displayUser.fullLabel}</span>
                     </span>
                  </div>

                  {displayUser.house_id && (
                     <div className={`mt-2 inline-flex px-4 py-1.5 rounded-xl bg-black/40 border backdrop-blur-md shadow-lg ${
                        displayUser.house_id === 'dragon' ? 'border-red-500/30 text-red-500' :
                        displayUser.house_id === 'fox' ? 'border-purple-500/30 text-purple-400' :
                        displayUser.house_id === 'wolf' ? 'border-blue-500/30 text-blue-400' :
                        'border-orange-500/30 text-orange-400'
                     }`}>
                        <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 drop-shadow-md">
                           <Shield size={12} className="shrink-0" />
                           {displayUser.house_id === 'dragon' ? 'KIZIL EJDER' :
                            displayUser.house_id === 'fox' ? 'GÜMÜŞ KITSUNE' :
                            displayUser.house_id === 'wolf' ? 'BUZ KURT' :
                            'ALTIN ANKA'}
                        </span>
                     </div>
                  )}

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60 mt-4" />
                  
                  <div className="flex justify-between items-end px-2">
                     <div className="text-left">
                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">İSTATİSTİKLER</div>
                        <div className="text-2xl font-black text-white uppercase tracking-tighter drop-shadow-md">VERİLER</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">TOPLAM XP</div>
                        <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 tracking-tighter drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">{displayUser.xp}</div>
                     </div>
                  </div>
               </div>

               {/* Discord Connection */}
               <div className="w-full mt-8 pt-8 border-t border-white/10 space-y-4">
                  {displayUser.discord_id ? (
                     <div className="group relative p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 overflow-hidden backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                 <Shield size={14} />
                              </div>
                              <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-md">Discord Bağlantısı</span>
                           </div>
                           <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)] animate-pulse" />
                        </div>
                        {isOwnProfile && (
                           <button 
                              onClick={disconnectDiscord}
                              className="w-full py-2 bg-black/40 hover:bg-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all shadow-inner"
                           >
                              BAĞLANTIYI KES
                           </button>
                        )}
                     </div>
                  ) : isOwnProfile ? (
                     <div className="space-y-4">
                        {verifCode && timeLeft > 0 ? (
                           <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 space-y-4 text-center animate-in zoom-in-95 duration-300 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                              <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Senkronizasyon Kodu</p>
                              <div className="py-3 bg-black/60 rounded-xl border border-indigo-500/40 shadow-inner">
                                 <span className="text-2xl font-black text-indigo-300 tracking-[0.2em] font-mono select-all leading-none drop-shadow-[0_0_10px_rgba(165,180,252,0.5)]">{verifCode}</span>
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                                 <p className="text-[9px] font-bold text-amber-400 uppercase">Geçerlilik: {formatTime(timeLeft)}</p>
                              </div>
                              <button 
                                 onClick={generateDiscordCode}
                                 className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors drop-shadow-md"
                              >
                                 YENİ KOD AL
                              </button>
                           </div>
                        ) : (
                           <button 
                              onClick={generateDiscordCode}
                              disabled={isGenerating}
                              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2"
                           >
                              <Shield size={14} />
                              {isGenerating ? 'YÜKLENİYOR...' : 'DİSCORD HESABINI BAĞLA'}
                           </button>
                        )}
                     </div>
                  ) : (
                     <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded-xl bg-white/5 text-zinc-500">
                              <MessageSquare size={14} />
                           </div>
                           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Bağlantı Yok</span>
                        </div>
                     </div>
                  )}
               </div>

               <p className="text-zinc-300 text-[11px] font-medium leading-relaxed mt-6 mb-8 text-center italic drop-shadow-md">
                 "{displayUser.bio || 'Henüz bir biyografi eklenmemiş.'}"
               </p>

               <div className="w-full space-y-3">
                  {isOwnProfile ? (
                    <>
                      <button onClick={() => navigate('/settings')} className="w-full py-4 rounded-2xl bg-white/5 border border-white/20 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md shadow-lg">PROFİLİ DÜZENLE</button>
                      <button onClick={() => navigate('/elite-upgrade')} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 border hover:scale-[1.02] active:scale-[0.98] ${
                        displayUser.active_plan_id === 'aethe' ? 'bg-gradient-to-r from-rose-600 to-pink-500 shadow-rose-500/50 border-rose-400 text-white' :
                        displayUser.active_plan_id === 'shadow' ? 'bg-gradient-to-r from-purple-600 to-indigo-500 shadow-purple-500/50 border-purple-400 text-white' :
                        displayUser.active_plan_id === 'pro' ? 'bg-gradient-to-r from-cyan-600 to-blue-500 shadow-cyan-500/50 border-cyan-400 text-white' :
                        'bg-gradient-to-r from-orange-500 to-amber-500 shadow-amber-500/50 border-amber-400 text-white'
                      }`}>
                        {displayUser.active_plan_id === 'aethe' ? (
                           <>
                              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                 <img src="/aethe.png" alt="Aethe" className="object-contain max-w-none" style={{ width: 80, height: 80 }} />
                              </div>
                              Efsanevi Aethe
                           </>
                        ) :
                         displayUser.active_plan_id === 'shadow' ? <><Ghost size={14} /> Hükümdar Gölgesi</> :
                         displayUser.active_plan_id === 'pro' ? <><Trophy size={14} /> Pro Üye</> :
                         <><Crown size={14} /> PREMIUM</>}
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={handleFollow} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg backdrop-blur-md ${isFollowing ? 'bg-black/60 border border-white/10 text-zinc-400 hover:bg-black/80' : 'bg-blue-600 border border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:bg-blue-500'}`}>
                        {isFollowing ? 'TAKİPTEN ÇIK' : 'TAKİP ET'}
                      </button>
                      <button aria-label="Mesaj gönder" onClick={handleStartChat} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"><MessageSquare size={16} /></button>
                    </div>
                  )}
               </div>

               <div className="w-full mt-10 pt-8 border-t border-white/10 space-y-8">
                  <div className="space-y-4">
                     <div className="text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-md">BAĞLANTILAR</div>
                     <div className="space-y-2">
                        {userLinks.map((link, idx) => (
                           <a key={idx} href={getPlatformUrl(link)} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 hover:border-blue-400/50 hover:bg-black/60 transition-all group backdrop-blur-sm shadow-inner">
                              <div className="flex items-center gap-3">
                                 <div className="text-zinc-400 group-hover:text-blue-300 transition-colors">
                                   {getSocialIcon(link.platform)}
                                 </div>
                                 <span className="text-[10px] font-black text-zinc-300 uppercase group-hover:text-white transition-colors">{link.platform}</span>
                              </div>
                              <ChevronRight size={12} className="text-zinc-500 group-hover:text-blue-400 transition-colors" />
                           </a>
                        ))}
                        {isOwnProfile && userLinks.length === 0 && (
                          <button onClick={() => setShowLinksModal(true)} className="w-full p-4 rounded-xl bg-black/20 border border-dashed border-white/20 text-[9px] font-black text-zinc-400 hover:text-white hover:bg-white/5 transition-all uppercase backdrop-blur-sm">HESAP EKLE</button>
                        )}
                     </div>
                  </div>

                  {recentVisits.length > 0 && (
                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <div className="text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-md">PROFİL İZLERİ</div>
                          <div className="text-[9px] font-black text-zinc-300 bg-white/10 px-2 py-0.5 rounded-md">{recentVisits.length} Seçkin İz</div>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {recentVisits.map((visit, i) => (
                             <div key={i} className={`w-10 h-10 rounded-xl bg-black/60 border hover:scale-110 transition-all flex items-center justify-center shadow-lg relative group ${
                                visit.visitor_plan === 'aethe' ? 'border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.4)]' :
                                'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                             }`} title={`${visit.profiles?.username || 'Gizemli Seçkin'}`}>
                                {visit.visitor_plan === 'aethe' ? (
                                  <div className="w-full h-full p-2 flex items-center justify-center animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]">
                                     <img src="/aethe.png" alt="Aethe" className="object-contain w-full h-full" />
                                  </div>
                                ) : (
                                  <Crown size={18} className="text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
                                )}
                                
                                {/* Avatar tooltip for visitor */}
                                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-center">
                                  <div className="px-2 py-1 bg-black/90 border border-white/20 rounded-md text-[9px] font-black uppercase text-white whitespace-nowrap">
                                    {visit.profiles?.username}
                                  </div>
                                  <div className="w-2 h-2 bg-black/90 border-r border-b border-white/20 rotate-45 -mt-1.5" />
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}

                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <div className="text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-md">BAŞARIMLAR</div>
                        <div className="text-[9px] font-black text-zinc-300 bg-white/10 px-2 py-0.5 rounded-md">{userAchievements.length}/100</div>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {userAchievements.slice(0, 5).map((ua, i) => (
                           <div key={i} className="w-10 h-10 rounded-xl bg-black/60 border border-amber-500/30 hover:border-amber-400/60 transition-colors flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]" title={ua.achievements?.name}>
                              <Award size={16} />
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT AREA (ELITE REDESIGN) ── */}
          <main className="flex-1 min-w-0 flex flex-col w-full relative space-y-6 sm:space-y-8">
            
            {/* NEW PREMIUM BANNER */}
            <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px] rounded-[2rem] sm:rounded-[3rem] overflow-hidden bg-[#070511] border border-white/10 shadow-2xl group flex flex-col justify-end">
               <div className="absolute inset-0 z-0">
                  <img 
                    src={displayUser.appearance_settings?.custom_banner_url || "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop"} 
                    alt="Profil arkaplanı"
                    loading="eager"
                    className="w-full h-full object-cover opacity-60" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/40 to-transparent z-10" />
               </div>
               
               <div className="relative z-20 p-6 sm:p-10 flex flex-col sm:flex-row justify-between items-end gap-6 w-full">
                  <div>
                    <h2 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">PROFIL</h2>
                    <div className="flex items-center gap-3 mt-2 sm:mt-4">
                       <div className={`px-4 py-1.5 rounded-full backdrop-blur-md border ${displayUser.rankStyle === 'elite-gold-glow' ? 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-white/10 border-white/20'}`}>
                          <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${displayUser.rankStyle === 'elite-gold-glow' ? 'text-amber-300' : 'text-white'}`}>
                             {displayUser.is_elite && (
                                displayUser.active_plan_id === 'aethe' ? (
                                   <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                      <img src="/aethe.png" alt="Aethe" className="object-contain max-w-none" style={{ width: 80, height: 80 }} />
                                   </div>
                                ) :
                                displayUser.active_plan_id === 'shadow' ? <Ghost size={12} className="inline" /> :
                                displayUser.active_plan_id === 'pro' ? <Trophy size={12} className="inline" /> :
                                <Crown size={12} className="inline" />
                             )}
                             <span>{displayUser.rank}</span>
                          </span>
                       </div>
                       {displayUser.is_elite && (
                          <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 ${
                            displayUser.active_plan_id === 'aethe' ? 'bg-rose-500/20 border-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.3)]' :
                            displayUser.active_plan_id === 'shadow' ? 'bg-purple-500/20 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]' :
                            displayUser.active_plan_id === 'pro' ? 'bg-cyan-500/20 border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.3)]' :
                            'bg-amber-500/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                          }`}>
                            {displayUser.active_plan_id === 'aethe' ? (
                               <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                  <img src="/aethe.png" alt="Aethe" className="animate-pulse object-contain max-w-none drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]" style={{ width: 80, height: 80 }} />
                               </div>
                            ) :
                             displayUser.active_plan_id === 'shadow' ? <Ghost size={12} className="text-purple-400 animate-pulse" /> :
                             displayUser.active_plan_id === 'pro' ? <Trophy size={12} className="text-cyan-400 animate-pulse" /> :
                             <Crown size={12} className="text-amber-400 animate-pulse" />}
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                              displayUser.active_plan_id === 'aethe' ? 'text-rose-300' :
                              displayUser.active_plan_id === 'shadow' ? 'text-purple-300' :
                              displayUser.active_plan_id === 'pro' ? 'text-cyan-300' :
                              'text-amber-300'
                            }`}>
                              {displayUser.active_plan_id === 'pro' ? 'PRO AKTİF' :
                               displayUser.active_plan_id === 'shadow' ? 'HÜKÜMDAR GÖLGESİ AKTİF' :
                               displayUser.active_plan_id === 'ruler' ? 'HÜKÜMDAR AKTİF' :
                               displayUser.active_plan_id === 'aethe' ? 'AETHE MÜHRÜ AKTİF' : 'PREMIUM AKTİF'}
                            </span>
                          </div>
                       )}
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                     {[
                        { label: 'SERİ', value: readHistory.length, icon: BookOpen },
                        { label: 'FAVORİ', value: favoritesCount, icon: Star },
                        { label: 'TAKİPÇİ', value: followersCount, icon: UserPlus },
                     ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center justify-center p-3 sm:px-6 sm:py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[80px] sm:min-w-[100px] shrink-0">
                           <span className="block text-xl sm:text-2xl font-black text-white tracking-tighter drop-shadow-md leading-none mb-1">{stat.value}</span>
                           <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1"><stat.icon size={10} /> {stat.label}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* ACTION BAR & TABS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-40 bg-[#070511]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 shadow-2xl">
              <div className="flex w-full sm:w-auto items-center overflow-x-auto no-scrollbar rounded-[1.5rem] bg-white/5 p-1 border border-white/5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.link) { navigate(tab.link); } else { setActiveTab(tab.id); }
                    }}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-white/10 text-white shadow-md border border-white/10' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <tab.icon size={14} className={activeTab === tab.id ? 'text-white' : 'text-zinc-500'} />
                    {tab.label}
                  </button>
                ))}
              </div>
              
              {isOwnProfile && (
                <button 
                  onClick={() => setIsDrawerOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all border border-purple-400/50"
                >
                  <Palette size={14} /> GÖRÜNÜMÜ ÖZELLEŞTİR
                </button>
              )}
            </div>

            {/* CONTENT AREA */}
            <AnimatePresence mode="wait">
               <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full min-h-[500px]"
               >
                  {activeTab === 'okunanlar' && (
                     <div className="space-y-10">
                        <div className="flex justify-between items-end">
                           <div>
                              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2 drop-shadow-md">
                                <History size={24} className="text-purple-400" /> SON OKUNANLAR
                              </h3>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Kaldığın yerden devam et</p>
                           </div>
                        </div>

                        {readHistory.length > 0 ? (
                           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                              {readHistory.map((h, i) => (
                                <Link 
                                  key={i} 
                                  to={`/manhwa/${h.series_id}`}
                                  className="group relative h-40 sm:h-48 rounded-[2rem] overflow-hidden bg-zinc-900 border border-white/10 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all flex"
                                >
                                   <div className="w-28 sm:w-36 h-full shrink-0 overflow-hidden relative">
                                      <img src={getOptimizedImage(h.series?.cover, 300)} alt={h.series?.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900" />
                                   </div>
                                   <div className="flex-1 p-5 flex flex-col justify-center relative z-10 -ml-4 bg-gradient-to-r from-zinc-900/90 to-zinc-900">
                                      <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tighter mb-1 line-clamp-2 drop-shadow-md group-hover:text-purple-300 transition-colors">{h.series?.title}</h4>
                                      <p className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">BÖLÜM {h.last_read_chapter}</p>
                                      <div className="mt-auto">
                                         <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-zinc-300 uppercase tracking-widest group-hover:bg-purple-500/20 group-hover:text-purple-300 group-hover:border-purple-500/40 transition-all">
                                            <Play size={10} /> OKU
                                         </span>
                                      </div>
                                   </div>
                                </Link>
                              ))}
                           </div>
                        ) : (
                           <div className="w-full py-20 flex flex-col items-center justify-center rounded-[3rem] bg-white/5 border border-dashed border-white/10 backdrop-blur-md">
                              <History size={48} className="text-zinc-600 mb-4" />
                              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Henüz bir seri okunmamış.</p>
                           </div>
                        )}
                     </div>
                  )}

                  {activeTab === 'listeler' && (
                     <div className="space-y-10">
                        <div className="flex justify-between items-end">
                           <div>
                              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2 drop-shadow-md">
                                <BookOpen size={24} className="text-blue-400" /> ÖZEL LİSTELER
                              </h3>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                           {customLists.map((list, i) => (
                             <div 
                               key={i} 
                               onClick={() => navigate(`/${displayUser.username}/liste/${list.id}`)}
                               className="group relative aspect-[4/3] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden cursor-pointer border border-white/10 hover:border-blue-500/50 shadow-2xl"
                             >
                                <div className="absolute inset-0 flex flex-wrap">
                                  {list.custom_list_items?.slice(0, 4).map((item, idx) => {
                                    const s = series?.find(ser => String(ser.id) === String(item.series_id));
                                    return <div key={idx} className="w-1/2 h-1/2 overflow-hidden bg-zinc-900 border border-[#070511]"><img src={getOptimizedImage(s?.cover || '/placeholder.png', 300)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" /></div>;
                                  })}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                                <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex items-end justify-between">
                                   <div>
                                      <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter mb-1 drop-shadow-md">{list.name}</h4>
                                      <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-[9px] font-black text-blue-300 uppercase tracking-widest">{list.custom_list_items?.length || 0} SERİ</span>
                                   </div>
                                   <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md group-hover:bg-blue-600 transition-colors">
                                      <ChevronRight size={18} />
                                   </div>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {activeTab === 'mal' && (
                     <div className="space-y-10">
                        <div className="flex justify-between items-end">
                           <div>
                              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2 drop-shadow-md">
                                <Tv size={24} className="text-indigo-400" /> MYANIMELIST
                              </h3>
                           </div>
                        </div>
                        <div className="columns-2 md:columns-3 xl:columns-4 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
                           {malLoading ? (
                             Array.from({ length: 12 }).map((_, i) => <div key={i} className={`rounded-[2rem] bg-white/5 border border-white/10 animate-pulse ${i % 3 === 0 ? 'h-64' : 'h-48'}`} />)
                           ) : malList.length > 0 ? (
                             malList.map((item, idx) => (
                               <div key={idx} className="break-inside-avoid relative rounded-[2rem] overflow-hidden bg-zinc-900 border border-white/10 hover:border-indigo-500/50 transition-all shadow-xl group cursor-pointer">
                                  <img src={getOptimizedImage(item.node?.main_picture?.medium, 400)} loading="lazy" className="w-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                                  <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-black text-yellow-400">
                                     {item.list_status?.score > 0 ? `★ ${item.list_status.score}` : 'PUANSIZ'}
                                  </div>
                                  <div className="absolute bottom-0 inset-x-0 p-4">
                                     <h4 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-tighter drop-shadow-md mb-2">{item.node?.title}</h4>
                                     <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-[8px] font-black uppercase tracking-widest">{item.list_status?.status?.replace(/_/g, ' ')}</span>
                                        <span className="text-[8px] font-bold text-zinc-400">{item.list_status?.num_episodes_watched || item.list_status?.num_chapters_read}/{item.node?.num_episodes || item.node?.num_chapters || '?'}</span>
                                     </div>
                                  </div>
                               </div>
                             ))
                           ) : (
                             <div className="col-span-full py-20 flex flex-col items-center justify-center rounded-[3rem] bg-white/5 border border-dashed border-white/10 backdrop-blur-md">
                                <Tv size={48} className="text-zinc-600 mb-4" />
                                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Liste bulunamadı.</p>
                             </div>
                           )}
                        </div>
                     </div>
                  )}

                  {activeTab === 'basarimlar' && (
                     <div className="space-y-10">
                        <div className="flex justify-between items-end">
                           <div>
                              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2 drop-shadow-md">
                                <Award size={24} className="text-amber-400" /> BAŞARIMLAR
                              </h3>
                           </div>
                           <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-zinc-300">
                              {userAchievements.length} / 100
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                           {userAchievements.map((ua, i) => (
                              <div key={i} className="group relative aspect-square p-6 rounded-[2rem] bg-[#0A0A0A] border border-white/10 hover:border-amber-500/50 transition-all text-center flex flex-col items-center justify-center overflow-hidden shadow-xl">
                                 <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                 
                                 <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-4">
                                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-zinc-800 group-hover:text-amber-500/30 transition-colors">
                                       <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" fill="currentColor" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                                    </svg>
                                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-amber-500 scale-[0.85] opacity-20 group-hover:opacity-100 transition-all drop-shadow-[0_0_15px_rgba(245,158,11,1)]">
                                       <polygon points="50 1 95 25 95 75 50 99 5 75 5 25" fill="currentColor" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                       <Award size={24} className="text-white group-hover:text-black transition-colors relative z-10" />
                                    </div>
                                 </div>
                                 
                                 <h4 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-tighter leading-tight drop-shadow-md z-10">{ua.achievements?.name}</h4>
                                 <p className="text-[8px] font-bold text-amber-500/70 uppercase tracking-widest mt-2 z-10">{new Date(ua.unlocked_at).toLocaleDateString('tr-TR')}</p>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </motion.div>
            </AnimatePresence>
          </main>
       </div>

      {/* RIGHT SIDE DRAWER FOR CUSTOMIZATION */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[200] flex justify-end">
             {/* Backdrop */}
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
               onClick={() => setIsDrawerOpen(false)} 
               className="absolute inset-0 bg-black/60" 
             />
             
             {/* Drawer Panel */}
             <motion.div 
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="relative w-full max-w-md h-full bg-[#070511] border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] flex flex-col"
             >
                <div className="sticky top-0 z-20 bg-[#070511]/90 backdrop-blur-xl border-b border-white/10 p-6 sm:p-8 flex items-center justify-between">
                   <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2"><Palette size={20} className="text-purple-400" /> ÖZELLEŞTİRME</h3>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Profil Görünümünü Ayarla</p>
                   </div>
                   <button onClick={() => setIsDrawerOpen(false)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"><X size={20} /></button>
                </div>

                <div className="p-6 sm:p-8 space-y-10 flex-1 overflow-y-auto no-scrollbar">
                   {/* Drawer Category Selector */}
                   <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                      {['Tümü', 'Auralar', 'Avatar Çerçeveleri', 'Plaketler', 'İsim Efektleri'].map((f) => (
                        <button 
                          key={f} 
                          onClick={() => setDecorationCategory(f)}
                          className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${decorationCategory === f ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'}`}
                        >
                           {f}
                        </button>
                      ))}
                   </div>

                   {/* Aura Slider */}
                   <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest"><Paintbrush size={14} className="text-blue-400" /> AURA RENGİ</div>
                        <span className="text-[10px] font-black text-zinc-400">{mixState.hue || 0}°</span>
                      </div>
                      <input 
                        type="range" min="0" max="360" value={mixState.hue || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setMixState(prev => ({ ...prev, hue: val }));
                          updateProfile({ active_mix: { ...mixState, hue: val } });
                        }}
                        className="w-full h-1.5 bg-black rounded-full appearance-none cursor-pointer accent-purple-500"
                      />
                   </div>

                   {/* Yorum Kutusu Rengi */}
                   {(['Baş Admin', 'Yönetici', 'Admin Yardımcısı'].includes(currentUser?.role) || currentUser?.active_plan_id === 'aethe') && (
                     <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest"><Paintbrush size={14} className="text-purple-400" /> YORUM KUTUSU RENGİ</div>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                           <button 
                             onClick={() => {
                               setMixState(prev => ({ ...prev, commentColor: 'none' }));
                               updateProfile({ active_mix: { ...mixState, commentColor: 'none' } });
                             }}
                             className={`px-4 py-2 rounded-xl border transition-all text-[9px] font-bold uppercase ${(!mixState.commentColor || mixState.commentColor === 'none') ? 'bg-purple-600 border-transparent text-white' : 'bg-black/40 border-white/10 text-zinc-400'}`}
                           >
                              Varsayılan
                           </button>
                           <div className="flex items-center gap-3">
                              <label className="text-[9px] font-bold text-zinc-400 uppercase">Özel Renk:</label>
                              <input 
                                 type="color" 
                                 value={mixState.commentColor && mixState.commentColor !== 'none' ? mixState.commentColor : '#000000'}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   setMixState(prev => ({ ...prev, commentColor: val }));
                                   updateProfile({ active_mix: { ...mixState, commentColor: val } });
                                 }}
                                 className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                              />
                           </div>
                        </div>
                     </div>
                   )}

                   {/* Effect Items */}
                   <div className="grid grid-cols-2 gap-4">
                      {filteredDecorations.map(effect => {
                        const isNameplate = effect.category === 'nameplates';
                        const isProfileEffect = effect.category === 'profile_effects';
                        const isNameEffect = effect.category === 'name_effects';
                        const isActive = isNameplate ? mixState.nameplate === effect.id : isProfileEffect ? mixState.profile_effect === effect.id : isNameEffect ? mixState.nametag === effect.id : mixState.avatar === effect.id;

                        return (
                          <div 
                            key={effect.id} 
                            onClick={() => {
                              let newMix;
                              if (isNameplate) newMix = { ...mixState, nameplate: effect.id };
                              else if (isProfileEffect) newMix = { ...mixState, profile_effect: effect.id };
                              else if (isNameEffect) newMix = { ...mixState, nametag: effect.id };
                              else newMix = { ...mixState, avatar: effect.id };
                              setMixState(newMix);
                              updateProfile({ active_mix: newMix });
                            }} 
                            className={`group relative p-4 rounded-2xl bg-black/40 transition-all cursor-pointer border ${isActive ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'border-white/10 hover:border-white/30'}`}
                          >
                             <div className={`${isNameplate ? 'aspect-[3/1]' : isNameEffect ? 'aspect-[3/1]' : 'aspect-square'} relative flex items-center justify-center overflow-hidden rounded-xl bg-black border border-white/5 mb-3`}>
                               {isNameplate ? (
                                 <video src={`/nameplates/${effect.id}`} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                               ) : isNameEffect ? (
                                 <div className="flex items-center justify-center w-full h-full p-2">
                                   <span className="text-[10px] font-black uppercase tracking-tighter name-effect-text drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ backgroundImage: `url(${effect.url})`, filter: `hue-rotate(${mixState.hue || 0}deg)` }}>KULLANICI</span>
                                 </div>
                               ) : isProfileEffect ? (
                                 <img src={getOptimizedImage(effect.url, 200)} loading="lazy" className="w-full h-full object-contain drop-shadow-2xl" />
                               ) : (
                                 <AnimeAvatar src={displayUser.avatar_url} effect={effect} size="w-12 h-12" forcePlay={true} />
                               )}
                               <div className="absolute inset-0 pointer-events-none" style={{ filter: `hue-rotate(${mixState.hue || 0}deg)` }} />
                             </div>
                             
                             <div className="text-center">
                                <div className="text-[9px] font-black text-white uppercase tracking-tight truncate mb-0.5">{effect.label}</div>
                                <div className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">{effect.category?.replace('_', ' ')}</div>
                             </div>
                             
                             {isActive && (
                               <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                 <Check size={10} className="text-white" />
                               </div>
                             )}
                          </div>
                        );
                      })}
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <div className="text-[10px] font-black uppercase tracking-widest">Sistem Bildirimi</div>
                <div className="text-xs font-bold text-white/90">{toast}</div>
              </div>
              <button aria-label="Bildirimi kapat" onClick={() => setToast(null)} className="ml-4 p-2 rounded-full hover:bg-white/10 transition-all">
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

  const addRow = () => setLinks([{ platform: '', value: '', type: 'username' }, ...links]);
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
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">SOSYAL MEDYA</h3>
            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">Hesaplarını bağla</p>
          </div>
          <button aria-label="Bağlantı penceresini kapat" onClick={onClose} className="p-4 rounded-full bg-card-navy text-zinc-400 hover:text-white transition-all border border-white/5"><X size={24} /></button>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pr-2 mb-10">
          <button onClick={addRow} className="w-full py-5 rounded-[2.5rem] bg-card-navy border border-dashed border-white/10 text-[10px] font-black uppercase text-zinc-400 hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center gap-3"><Plus size={16} /> Yeni Bağlantı Ekle</button>
          {links.map((link, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center group p-4 rounded-[2rem] bg-card-navy/50 border border-white/5">
              <div className="relative w-full sm:w-44 shrink-0">
                <select value={link.platform} onChange={(e) => updateRow(idx, 'platform', e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-4 px-6 text-xs font-black text-zinc-300 appearance-none focus:border-purple-500 transition-all cursor-pointer">
                  <option value="">Platform Seç</option>
                  {platforms.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div className="relative flex-1 w-full">
                <input type="text" placeholder={link.type === 'username' ? "Kullanıcı Adı" : "URL Adresi"} value={link.value} onChange={(e) => updateRow(idx, 'value', e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-zinc-100 focus:border-purple-500 transition-all outline-none" />
              </div>
              <button aria-label="Bağlantıyı sil" onClick={() => removeRow(idx)} className="p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"><Minus size={20} /></button>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 rounded-[2.5rem] bg-card-navy text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">İPTAL</button>
          <button onClick={() => { onSave(links.filter(l => l.platform && l.value)); onClose(); }} className="flex-[2] py-5 rounded-[2.5rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">KAYDET <Sparkles size={18} /></button>
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
      className={`relative aspect-[3/1] rounded-xl overflow-hidden border-2 cursor-pointer transition-all flex items-center justify-center ${
        isActive ? 'border-purple-500 shadow-lg shadow-purple-500/30' : 'border-white/5 bg-card-navy/50'
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
        <img src={`/nameplates/${filename}`} alt="Nameplate Effect" className="w-full h-full object-cover" />
      )}
      {isActive && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
          <Check size={12} className="text-white" />
        </div>
      )}
    </motion.div>
  );
}

function EliteMixModal({ isOpen, onClose, mixState, setMixState, onSave, currentUser }) {
  if (!isOpen) return null;

  const parts = {
    aura: effectsData.filter(e => e.category === 'profile_effects'),
    avatar: effectsData.filter(e => e.category === 'avatar_decorations'),
    nametag: effectsData.filter(e => e.category === 'name_effects'),
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
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">GÖRÜNÜM</h3>
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">Efektlerini düzenle</p>
           </div>
           <button aria-label="Profil düzenleme penceresini kapat" onClick={onClose} className="p-4 rounded-full bg-card-navy text-zinc-400 hover:text-white transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
           <div className="space-y-6">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">PROFIL EFEKTI</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <button 
                   onClick={() => setMixState(prev => ({ ...prev, profile_effect: 'none' }))}
                   className={`p-4 rounded-2xl border transition-all ${mixState.profile_effect === 'none' ? 'bg-purple-600 border-transparent text-white' : 'bg-card-navy border-white/5 text-zinc-400'}`}
                 >
                    HİÇ BİRİ
                 </button>
                 {parts.aura.map(eff => (
                   <button 
                     key={eff.id}
                     onClick={() => setMixState(prev => ({ ...prev, profile_effect: eff.id }))}
                     className={`p-4 rounded-2xl border transition-all truncate text-[10px] font-bold ${mixState.profile_effect === eff.id ? 'bg-purple-600 border-transparent text-white' : 'bg-card-navy border-white/5 text-zinc-400'}`}
                   >
                      {eff.label}
                   </button>
                 ))}
              </div>
           </div>

            {(['Baş Admin', 'Yönetici', 'Admin Yardımcısı'].includes(currentUser?.role) || currentUser?.active_plan_id === 'aethe') && (
               <div className="space-y-6">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">YORUM KUTUSU RENGİ</h4>
                  <div className="flex items-center gap-4">
                     <button 
                       onClick={() => setMixState(prev => ({ ...prev, commentColor: 'none' }))}
                       className={`px-6 py-3 rounded-2xl border transition-all text-[10px] font-bold uppercase ${(!mixState.commentColor || mixState.commentColor === 'none') ? 'bg-purple-600 border-transparent text-white' : 'bg-card-navy border-white/5 text-zinc-400'}`}
                     >
                        VARSAYILAN
                     </button>
                     <div className="flex items-center gap-3">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">ÖZEL RENK SEÇ:</label>
                        <input 
                           type="color" 
                           value={mixState.commentColor && mixState.commentColor !== 'none' ? mixState.commentColor : '#000000'}
                           onChange={(e) => setMixState(prev => ({ ...prev, commentColor: e.target.value }))}
                           className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                     </div>
                  </div>
               </div>
            )}

           <div className="space-y-6">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">AVATAR ÇERÇEVESİ</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <button 
                   onClick={() => setMixState(prev => ({ ...prev, avatar: 'none' }))}
                   className={`p-4 rounded-2xl border transition-all ${mixState.avatar === 'none' ? 'bg-purple-600 border-transparent text-white' : 'bg-card-navy border-white/5 text-zinc-400'}`}
                 >
                    HİÇ BİRİ
                 </button>
                 {parts.avatar.map(eff => (
                   <button 
                     key={eff.id}
                     onClick={() => setMixState(prev => ({ ...prev, avatar: eff.id }))}
                     className={`p-4 rounded-2xl border transition-all truncate text-[10px] font-bold ${mixState.avatar === eff.id ? 'bg-purple-600 border-transparent text-white' : 'bg-card-navy border-white/5 text-zinc-400'}`}
                   >
                      {eff.label}
                   </button>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">İSİM EFEKTİ</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <button 
                   onClick={() => setMixState(prev => ({ ...prev, nametag: 'none' }))}
                   className={`p-4 rounded-2xl border transition-all ${mixState.nametag === 'none' ? 'bg-purple-600 border-transparent text-white' : 'bg-card-navy border-white/5 text-zinc-400'}`}
                 >
                    HİÇ BİRİ
                 </button>
                 {parts.nametag.map(eff => (
                   <button 
                     key={eff.id}
                     onClick={() => setMixState(prev => ({ ...prev, nametag: eff.id }))}
                     className={`p-4 rounded-2xl border transition-all truncate text-[10px] font-bold ${mixState.nametag === eff.id ? 'bg-purple-600 border-transparent text-white' : 'bg-card-navy border-white/5 text-zinc-400'}`}
                   >
                      {eff.label}
                   </button>
                 ))}
              </div>
           </div>

         </div>

        <div className="p-10 bg-card-navy/50 border-t border-white/5 flex gap-4">
           <button onClick={onClose} className="flex-1 py-5 rounded-2xl bg-zinc-800 text-zinc-400 text-xs font-black uppercase">İPTAL</button>
           <button 
             onClick={() => { onSave(mixState); onClose(); }}
             className="flex-[2] py-5 rounded-2xl bg-purple-600 text-white text-xs font-black uppercase shadow-xl shadow-purple-600/30"
           >
              AYARLARI KAYDET
           </button>
        </div>
      </motion.div>
    </div>
  );
}


