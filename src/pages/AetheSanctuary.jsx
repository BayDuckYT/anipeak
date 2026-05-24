import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Loader2, Sparkles, MessageSquare, Shield, Trophy, Crown, Flame, Swords } from 'lucide-react';
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
    // Simulate dramatic random selection
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

  // Sadece Aethe paketi veya Yetkililer
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
    <div className="min-h-screen bg-[#070511] pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        {!profile?.house_id ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 uppercase tracking-tighter mb-4">Kaderini Seç</h1>
            <p className="text-zinc-400 mb-12 max-w-lg">Aethe Kutsal Alanı'na hoş geldin. Dört büyük haneden hangisine ait olacağına kader karar verecek. Bu seçim sadece bir kez yapılır ve asla değiştirilemez.</p>
            
            {isSelecting ? (
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-40 h-40 rounded-full border-4 border-dashed border-purple-500 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.5)]"
              >
                <Sparkles size={40} className="text-white animate-pulse" />
              </motion.div>
            ) : (
              <button 
                onClick={handleSelection}
                className="relative group px-12 py-5 rounded-full bg-black border border-purple-500/50 overflow-hidden hover:scale-105 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 group-hover:opacity-100 opacity-50 transition-all" />
                <span className="relative z-10 text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <Sparkles size={20} /> Ritüeli Başlat
                </span>
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {selectedHouse && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                {/* House Header */}
                <div className={`relative overflow-hidden rounded-3xl border ${selectedHouse.border} bg-gradient-to-br ${selectedHouse.bg} to-black p-10 flex flex-col items-center text-center shadow-2xl`}>
                   <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0" />
                   <div className="relative z-10">
                     <h1 className={`text-5xl font-black ${selectedHouse.color} uppercase tracking-tighter mb-2 drop-shadow-lg`}>{selectedHouse.name}</h1>
                     <p className="text-white/80 font-medium tracking-wide max-w-2xl">{selectedHouse.desc}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* House Chat */}
                  <div className="lg:col-span-2 bg-card-navy/50 border border-white/5 rounded-3xl p-6 flex flex-col h-[600px]">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                      <MessageSquare className={selectedHouse.color} />
                      <h3 className="text-xl font-black text-white uppercase tracking-widest">Hane Karargahı</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 mb-4 pr-2">
                      {chatMessages.length === 0 ? (
                        <p className="text-center text-zinc-500 mt-10 text-sm font-medium">Henüz mesaj yok. İlk mesajı sen gönder!</p>
                      ) : (
                        chatMessages.map(msg => {
                          const prof = msg.profiles;
                          const mix = prof?.active_mix || {};
                          const nameTagStyle = mix.nametag && mix.nametag !== 'none' ? { backgroundImage: `url(${effectsData.find(e => e.id === mix.nametag)?.url})`, filter: `hue-rotate(${mix.hue || 0}deg)` } : {};
                          
                          return (
                            <div key={msg.id} className="flex gap-4">
                              <div className="shrink-0 cursor-pointer" onClick={() => navigate(`/profil/${prof.username}`)}>
                                <AnimeAvatar src={prof.avatar_url || '/default-avatar.png'} effect={mix.avatar ? effectsData.find(e => e.id === mix.avatar) : null} size="w-10 h-10" forcePlay={true} />
                              </div>
                              <div className={`rounded-2xl p-4 flex-1 border ${!mix.commentColor || mix.commentColor === 'none' ? 'bg-black/40 border-transparent' : 'bg-black/60 border-white/5'}`} style={mix.commentColor && mix.commentColor !== 'none' ? { boxShadow: `inset 0 0 20px ${mix.commentColor}20`, borderColor: `${mix.commentColor}40` } : {}}>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span 
                                    onClick={() => navigate(`/profil/${prof.username}`)}
                                    className={`text-xs font-black uppercase cursor-pointer hover:underline ${mix.nametag && mix.nametag !== 'none' ? 'name-effect-text drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : selectedHouse.color}`}
                                    style={nameTagStyle}
                                  >
                                    {prof.username}
                                  </span>
                                  <UserBadges user={prof} showCrown={true} iconSize={12} />
                                  <div className={`px-1.5 py-0.5 rounded border text-[6px] font-black uppercase tracking-widest bg-white/5 border-white/10 text-slate-400`}>
                                    {['Baş Admin', 'Yönetici', 'Admin Yardımcısı'].includes(prof.role) ? `${prof.role}` : prof.rank || 'Çaylak'}
                                  </div>
                                  <span className="text-[10px] text-zinc-600 ml-auto">{new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-sm text-zinc-300 drop-shadow-md">{msg.message}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={sendMessage} className="relative mt-auto">
                      <input 
                        type="text" 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Hanene bir mesaj gönder..."
                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-purple-500/50 transition-all"
                      />
                      <button type="submit" className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/5 hover:bg-white/10 ${selectedHouse.color} transition-all`}>
                        <MessageSquare size={20} />
                      </button>
                    </form>
                  </div>

                  {/* House Leaderboard / Info */}
                  <div className="bg-card-navy/50 border border-white/5 rounded-3xl p-6 flex flex-col h-[600px]">
                     <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                      <Swords className="text-red-500" />
                      <h3 className="text-xl font-black text-white uppercase tracking-widest">Büyük Savaş</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                      {housesLeaderboard.map((house, idx) => (
                        <div key={house.id} className={`relative p-4 rounded-2xl border flex items-center justify-between overflow-hidden group ${
                          house.id === selectedHouse.id ? 'bg-white/10 border-white/20' : 'bg-black/40 border-white/5'
                        }`}>
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                            house.id === 'dragon' ? 'bg-red-500' :
                            house.id === 'fox' ? 'bg-purple-500' :
                            house.id === 'wolf' ? 'bg-blue-500' :
                            'bg-orange-500'
                          }`} />
                          <div className="flex items-center gap-4 pl-2 z-10">
                            <span className={`text-2xl font-black ${idx === 0 ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'text-zinc-600'}`}>{idx + 1}</span>
                            <div>
                              <div className="text-sm font-black text-white uppercase tracking-widest mb-0.5">{house.name}</div>
                              <div className="text-[9px] text-zinc-400 font-bold tracking-widest uppercase">{house.id === selectedHouse.id ? 'Senin Hanen' : 'Rakip Hane'}</div>
                            </div>
                          </div>
                          <div className="text-right z-10">
                            <div className={`text-xl font-black ${
                              house.id === 'dragon' ? 'text-red-400' :
                              house.id === 'fox' ? 'text-purple-400' :
                              house.id === 'wolf' ? 'text-blue-400' :
                              'text-orange-400'
                            }`}>{house.points.toLocaleString()}</div>
                            <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Savaş Puanı</div>
                          </div>
                          
                          {idx === 0 && <Crown className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500/20 w-16 h-16 pointer-events-none" />}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-4 rounded-2xl bg-black/60 border border-white/5 text-center">
                      <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Haftalık görevleri tamamlayıp siteye katkıda bulunarak hanene puan kazandır. Zirvedeki hane her cuma gece yarısı özel ödüller kazanır!</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
