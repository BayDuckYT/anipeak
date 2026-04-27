import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Crown, Plus, Image as ImageIcon, Code, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EliteBadge from '../components/EliteBadge';

export default function CitadelCategory() {
  const { category } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEliteChamber = category === 'elite-chambers';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // --- ELITE PROTECTION ---
  if (isEliteChamber && !user?.is_elite) {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[100px]" />
        </div>
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="glass-strong border border-red-500/30 rounded-[2.5rem] p-12 max-w-lg text-center relative z-10 shadow-[0_0_100px_rgba(239,68,68,0.15)]"
        >
          <Lock size={80} className="text-red-500 mx-auto mb-6 opacity-90" />
          <h1 className="text-3xl font-black text-white mb-2">YASAK BÖLGE</h1>
          <p className="text-slate-400 mb-8">Sadece Elite Okurlar Karargaha Girebilir. Buradaki kadim parşömenleri okumak için sınırsız güce erişmelisin.</p>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigate('/elite-upgrade')}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 text-white font-black uppercase tracking-widest shadow-neon-purple hover:scale-[1.02] transition-transform"
            >
              Elite Upgrade Satın Al
            </button>
            <button 
              onClick={() => navigate('/citadel')}
              className="w-full py-4 rounded-xl glass border border-white/10 text-slate-400 font-bold hover:text-white transition-colors"
            >
              Geri Dön
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- MOCK DATA ---
  const posts = [
    { id: 1, author: 'Gojo Satoru', isElite: true, title: 'Son bölümdeki domain expansion cidden böyle mi olmalıydı?', replies: 142, views: 5000 },
    { id: 2, author: 'Yuji Itadori', isElite: false, title: 'Abi Sukuna harbiden harika çizilmiş', replies: 12, views: 340 },
  ];

  return (
    <div className="min-h-screen bg-[#050507] pt-24 pb-20 relative">
      <div className="max-w-5xl mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-white/10 gap-4">
          <div>
            <Link to="/citadel" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold mb-4">
              <ArrowLeft size={16} /> Karargah'a Dön
            </Link>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              {isEliteChamber ? <><Crown className="text-red-500"/> ELITE ODASI</> : category.toUpperCase().replace('-', ' ')}
            </h1>
          </div>
          
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold shadow-neon-blue hover:scale-[1.02] transition-transform">
            <Plus size={18} /> Yeni Konu Aç
          </button>
        </div>

        {/* Post Editor Preview (Mock) */}
        <div className="glass-strong border border-white/10 rounded-2xl p-6 mb-8">
           <h3 className="text-white font-bold mb-4">Hızlı Gönderi (Simülasyon)</h3>
           <textarea 
             placeholder="Düşüncelerini buraya dök..." 
             className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors mb-4 resize-none h-24"
           />
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-blue-400 transition-colors" title="Kod Ekle"><Code size={18}/></button>
                <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-purple-400 transition-colors" title="Görsel Ekle"><ImageIcon size={18}/></button>
                <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-red-400 transition-colors" title="Spoiler Gizle"><EyeOff size={18}/></button>
              </div>
              <button className="px-6 py-2 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">
                Gönder
              </button>
           </div>
        </div>

        {/* Post List */}
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="glass border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-200 mb-2 cursor-pointer hover:text-blue-400 transition-colors">
                  {post.title}
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`font-semibold ${post.isElite ? 'elite-text-gradient' : 'text-slate-400'}`}>
                    {post.author}
                  </span>
                  {post.isElite && <EliteBadge />}
                  <span className="text-slate-600">• 2 saat önce</span>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm font-bold text-slate-500">
                <span>{post.replies} YANIT</span>
                <span>{post.views} OKUNMA</span>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
