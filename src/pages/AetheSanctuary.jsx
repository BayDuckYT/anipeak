import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Loader2, Sparkles, MessageSquare, Shield, Trophy, Crown, Flame, Swords, ChevronRight, ChevronLeft } from 'lucide-react';
import AnimeAvatar from '../components/AnimeAvatar';
import UserBadges from '../components/UserBadges';
import effectsData from '../data/effects.json';

const HOUSES = [
  { id: 'dragon', name: 'Kızıl Ejder', color: 'text-red-500', bg: 'from-red-900/40', border: 'border-red-500', desc: 'Güç, cesaret ve savaşçı ruh. (Saldırgan ve lider ruhlular)' },
  { id: 'fox', name: 'Gümüş Kitsune', color: 'text-purple-400', bg: 'from-purple-900/40', border: 'border-purple-400', desc: 'Kurnazlık, zeka ve gizem. (Stratejik ve zeki olanlar)' },
  { id: 'wolf', name: 'Buz Kurt', color: 'text-blue-400', bg: 'from-blue-900/40', border: 'border-blue-400', desc: 'Sadakat, takım çalışması ve onur. (Birlikte hareket eden dayanışmacılar)' },
  { id: 'phoenix', name: 'Altın Anka', color: 'text-orange-400', bg: 'from-orange-900/40', border: 'border-orange-400', desc: 'Bilgelik, azim ve küllerinden doğuş. (Asla pes etmeyen azimliler)' }
];

export default function AetheSanctuary() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [housesLeaderboard, setHousesLeaderboard] = useState([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/'); return; }
    fetchProfile();
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) throw error;
      setProfile(data);
      if (data.house_id) {
        setSelectedHouse(HOUSES.find(h => h.id === data.house_id));
        fetchChat(data.house_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHousesLeaderboard = async () => {
    try {
      const { data, error } = await supabase.from('houses').select('*').order('points', { ascending: false });
      if (!error && data) setHousesLeaderboard(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHousesLeaderboard();
  }, []);

  const fetchChat = async (houseId) => {
    try {
      const { data } = await supabase.from('house_chats').select('*, profiles(username, avatar_url, role, active_mix, is_elite, active_plan_id, rank, house_id)').eq('house_id', houseId).order('created_at', { ascending: false }).limit(50);
      if (data) setChatMessages(data.reverse());
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !profile?.house_id) return;
    try {
      const { data, error } = await supabase.from('house_chats').insert([{
        house_id: profile.house_id,
        user_id: user.id,
        message: message.trim()
      }]).select('*, profiles(username, avatar_url, role, active_mix, is_elite, active_plan_id, rank, house_id)').single();
      
      if (!error && data) {
        setChatMessages([...chatMessages, data]);
        setMessage('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelection = async () => {
    setIsSelecting(true);
    setTimeout(async () => {
      const randomHouse = HOUSES[Math.floor(Math.random() * HOUSES.length)];
      try {
        await supabase.from('profiles').update({ house_id: randomHouse.id }).eq('id', user.id);
        setSelectedHouse(randomHouse);
        setProfile({ ...profile, house_id: randomHouse.id });
        fetchChat(randomHouse.id);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSelecting(false);
      }
    }, 4000);
  };

  if (loading || authLoading) return <div className="min-h-screen bg-[#070511] flex items-center justify-center"><Loader2 className="animate-spin text-purple-500" size={40} /></div>;

  const isAethe = profile?.active_plan_id === 'aethe' || ['Baş Admin', 'Yönetici'].includes(profile?.role);
  if (!isAethe) {
    return (
      <div className="min-h-screen bg-[#070511] flex flex-col items-center justify-center text-center p-6">
        <Shield size={60} className="text-red-500 mb-6" />
        <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Aethe Kutsal Alanı</h1>
        <p className="text-zinc-400 mb-8 max-w-md">Bu gizli karargaha sadece Efsanevi Aethe Mührü'ne sahip olan savaşçılar girebilir. Hane savaşlarına katılmak için Aethe paketine yükseltmelisin.</p>
        <button onClick={() => navigate('/elite-upgrade')} className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold uppercase tracking-widest hover:bg-purple-500 transition-all">Aethe Mührü Al</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070511] pb-12 overflow-x-hidden">
      {!profile?.house_id ? (
        <div className="relative w-full h-screen min-h-[600px] overflow-hidden flex flex-col justify-center">
          <div className="absolute inset-0 bg-[url('/yayinarkaplan.jpg')] bg-cover bg-center opacity-30 mix-blend-screen scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070511] via-[#070511]/60 to-transparent" />
          
          <div className="relative z-10 px-4 sm:px-12 max-w-[1400px] w-full mx-auto">
            <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-2xl" style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8)' }}>
              KADERİNİ <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">SEÇ</span>
            </h1>
            <p className="text-slate-300 text-lg sm:text-2xl mb-12 max-w-2xl font-medium drop-shadow-md">
              Aethe Kutsal Alanı'na hoş geldin. Dört büyük haneden hangisine ait olacağına kader karar verecek. Bu seçim sadece bir kez yapılır ve asla değiştirilemez.
            </p>
            
            {isSelecting ? (
              <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} transition={{ duration: 2, repeat: Infinity }} className="w-40 h-40 rounded-full border-4 border-dashed border-purple-500 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.5)] bg-black/50 backdrop-blur-sm">
                <Sparkles size={40} className="text-white animate-pulse" />
              </motion.div>
            ) : (
              <button onClick={handleSelection} className="relative group px-12 py-6 rounded-2xl bg-white text-black overflow-hidden hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 group-hover:opacity-100 opacity-0 transition-all" />
                <span className="relative z-10 text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                  <Sparkles size={24} /> RİTÜELİ BAŞLAT
                </span>
              </button>
            )}
          </div>
          
          {/* Houses Horizontal Row Display */}
          <div className="absolute bottom-10 left-0 right-0 z-20 px-4 sm:px-12 overflow-x-auto no-scrollbar">
            <div className="flex gap-4 min-w-max pb-4">
              {HOUSES.map(house => (
                <div key={house.id} className="w-[280px] h-[140px] rounded-xl relative overflow-hidden bg-[#141414] border border-white/5 flex items-end p-4">
                  <div className={`absolute inset-0 bg-gradient-to-br ${house.bg} opacity-50`} />
                  <div className="relative z-10">
                    <h3 className={`text-xl font-black uppercase tracking-widest ${house.color}`}>{house.name}</h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{house.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {selectedHouse && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              {/* ── NETFLIX HERO ── */}
              <div className="relative w-full h-[60vh] min-h-[500px] overflow-hidden flex items-end mb-12">
                 <div className={`absolute inset-0 bg-gradient-to-br ${selectedHouse.bg} to-[#070511] opacity-50 mix-blend-screen scale-105 transition-all duration-1000`} />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#070511] via-[#070511]/80 to-transparent" />
                 <div className="absolute inset-0 bg-gradient-to-r from-[#070511] via-[#070511]/60 to-transparent" />
                 <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#070511] to-transparent z-10" />

                 <div className="relative z-20 w-full max-w-[1400px] mx-auto px-4 sm:px-12 pt-28 pb-12 flex flex-col justify-end">
                   <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full w-fit border border-white/20">
                     <Shield size={14} className={selectedHouse.color} />
                     <span className="text-xs font-bold text-white tracking-widest uppercase">Senin Hanen</span>
                   </div>
                   
                   <h1 className={`text-6xl sm:text-8xl lg:text-9xl font-black ${selectedHouse.color} uppercase tracking-tighter drop-shadow-2xl mb-4 max-w-4xl`} style={{ textShadow: '2px 4px 10px rgba(0,0,0,0.8)' }}>
                     {selectedHouse.name}
                   </h1>
                   
                   <p className="text-slate-200 text-lg sm:text-xl font-medium max-w-2xl drop-shadow-md">
                     {selectedHouse.desc}
                   </p>
                 </div>
              </div>

              <div className="max-w-[1400px] mx-auto px-4 sm:px-12 relative z-30 -mt-10">
                {/* ── BÜYÜK SAVAŞ (HORIZONTAL ROW) ── */}
                <div className="mb-16">
                  <div className="flex items-end gap-3 mb-6">
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Büyük Savaş</h2>
                    <span className="text-sm font-bold text-slate-500 mb-1">Liderlik Tablosu</span>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x pb-4">
                    {housesLeaderboard.map((houseData, idx) => {
                      const houseMeta = HOUSES.find(h => h.id === houseData.id);
                      if (!houseMeta) return null;
                      
                      return (
                        <div key={houseData.id} className={`snap-start w-[260px] flex-shrink-0 relative h-[160px] rounded-xl overflow-hidden border ${houseData.id === selectedHouse.id ? 'border-white/20' : 'border-white/5'} flex flex-col justify-between p-5 group cursor-pointer hover:scale-105 transition-transform`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${houseMeta.bg} opacity-20 group-hover:opacity-40 transition-opacity`} />
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${houseMeta.color.replace('text-', 'bg-')}`} />
                          
                          <div className="relative z-10 flex items-start justify-between">
                            <span className={`text-4xl font-black ${idx === 0 ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'text-slate-700'}`}>#{idx + 1}</span>
                            {idx === 0 && <Crown className="text-amber-400" size={24} />}
                          </div>
                          
                          <div className="relative z-10">
                            <h3 className={`text-lg font-black uppercase tracking-widest ${houseMeta.color}`}>{houseMeta.name}</h3>
                            <div className="text-2xl font-black text-white mt-1">{houseData.points.toLocaleString()} <span className="text-xs text-slate-500 font-bold tracking-widest uppercase">Puan</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── HANE KARARGAHI (CHAT) ── */}
                <div className="mb-20">
                  <div className="flex items-end gap-3 mb-6">
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Karargah</h2>
                    <span className="text-sm font-bold text-slate-500 mb-1">Sohbet Merkezi</span>
                  </div>
                  
                  <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 flex flex-col h-[500px] shadow-2xl relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${selectedHouse.bg} opacity-10 rounded-full blur-3xl`} />
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 mb-4 pr-2 relative z-10">
                      {chatMessages.length === 0 ? (
                        <p className="text-center text-zinc-500 mt-10 text-sm font-medium">Henüz mesaj yok. İlk mesajı sen gönder!</p>
                      ) : (
                        chatMessages.map(msg => {
                          const prof = msg.profiles;
                          const mix = prof?.active_mix || {};
                          const nameTagStyle = mix.nametag && mix.nametag !== 'none' ? { backgroundImage: `url(${effectsData.find(e => e.id === mix.nametag)?.url})`, filter: `hue-rotate(${mix.hue || 0}deg)` } : {};
                          
                          return (
                            <div key={msg.id} className="flex gap-4 group">
                              <div className="shrink-0 cursor-pointer" onClick={() => navigate(`/profil/${prof.username}`)}>
                                <AnimeAvatar src={prof.avatar_url || '/default-avatar.png'} effect={mix.avatar ? effectsData.find(e => e.id === mix.avatar) : null} size="w-10 h-10" forcePlay={true} />
                              </div>
                              <div className={`rounded-2xl p-4 flex-1 border ${!mix.commentColor || mix.commentColor === 'none' ? 'bg-[#070511]/40 border-transparent' : 'bg-black/60 border-white/5'}`} style={mix.commentColor && mix.commentColor !== 'none' ? { boxShadow: `inset 0 0 20px ${mix.commentColor}20`, borderColor: `${mix.commentColor}40` } : {}}>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span onClick={() => navigate(`/profil/${prof.username}`)} className={`text-xs font-black uppercase cursor-pointer hover:underline ${mix.nametag && mix.nametag !== 'none' ? 'name-effect-text drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : selectedHouse.color}`} style={nameTagStyle}>
                                    {prof.username}
                                  </span>
                                  <UserBadges user={prof} showCrown={true} iconSize={12} />
                                  <div className={`px-1.5 py-0.5 rounded border text-[6px] font-black uppercase tracking-widest bg-white/5 border-white/10 text-slate-400`}>
                                    {['Baş Admin', 'Yönetici', 'Admin Yardımcısı'].includes(prof.role) ? `${prof.role}` : prof.rank || 'Çaylak'}
                                  </div>
                                  <span className="text-[10px] text-zinc-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">{new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-sm text-slate-300 drop-shadow-md leading-relaxed">{msg.message}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={sendMessage} className="relative mt-auto z-10">
                      <input 
                        type="text" 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Hanene bir mesaj gönder..."
                        className="w-full bg-[#070511]/80 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-white/30 transition-all backdrop-blur-md"
                      />
                      <button type="submit" className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all`}>
                        <MessageSquare size={20} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
