import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Crown, Plus, Image as ImageIcon, Code, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EliteBadge from '../components/EliteBadge';
import { useSEO } from '../hooks/useSEO';

import DOMPurify from 'dompurify';

export default function CitadelCategory() {
  const { category } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEliteChamber = category === 'elite-odasi';

  useSEO({
    title: `Citadel - ${category ? category.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Forum'}`,
    description: 'AniPeak Citadel topluluk tartışmaları.',
    url: `https://anipeak.com.tr/citadel/${category}`
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // --- ELITE PROTECTION ---
  if (isEliteChamber && !user?.is_elite) {
    return (
      <div className="min-h-screen bg-[#F8F5FF] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[100px]" />
        </div>
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="glass-strong border border-red-500/30 rounded-[2.5rem] p-12 max-w-lg text-center relative z-10 shadow-[0_0_100px_rgba(239,68,68,0.15)]"
        >
          <Lock size={80} className="text-red-500 mx-auto mb-6 opacity-90" />
          <h1 className="text-3xl font-black text-slate-900 mb-2">YASAK BÖLGE</h1>
          <p className="text-slate-600 mb-8">Sadece Elite statüsündeki okurlar bu odaya girebilir. Buradaki gizli gönderileri okumak ve siber elitlerin arasına katılmak için Premium'a yükselt.</p>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigate('/elite-upgrade')}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 text-slate-900 font-black uppercase tracking-widest shadow-neon-purple hover:scale-[1.02] transition-transform"
            >
              Elite Upgrade Satın Al
            </button>
            <button 
              onClick={() => navigate('/citadel')}
              className="w-full py-4 rounded-xl glass border border-purple-900/10 text-slate-600 font-bold hover:text-slate-900 transition-colors"
            >
              Foruma Dön
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- MOCK DATA ---
  const [posts, setPosts] = useState([
    { id: 1, author: 'Gojo Satoru', isElite: true, title: 'Domain Expansion İncelemesi', content: 'Son bölümdeki dövüş animasyonları hakkında ne düşünüyorsunuz? Bence kusursuzdu.\n\n![Gojo](https://i.pinimg.com/736x/8f/c9/b0/8fc9b08f4c1e4f4a39b4b04928e469e3.jpg)\n\n||Sıradaki bölümde işler karışacak||', replies: 142, views: 5000, avatar_url: 'https://i.pinimg.com/736x/8f/c9/b0/8fc9b08f4c1e4f4a39b4b04928e469e3.jpg' },
    { id: 2, author: 'Yuji Itadori', isElite: false, title: 'Manhwa Önerileri', content: 'Yeni başlayanlar için okunması gereken manhwa önerileri alabilir miyim?', replies: 12, views: 340, avatar_url: 'https://i.pinimg.com/736x/8b/63/05/8b630560a631d8e12177cd05ffb70e7a.jpg' },
  ]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [expandedPostId, setExpandedPostId] = useState(null);
  const textareaRef = useRef(null);

  const insertTextAtCursor = (text) => {
    if (!textareaRef.current) {
      setNewPostContent(prev => prev + text);
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const val = textareaRef.current.value;
    const newVal = val.substring(0, start) + text + val.substring(end);
    setNewPostContent(newVal);
    
    setTimeout(() => {
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + text.length;
      textareaRef.current.focus();
    }, 0);
  };
  
  const handlePostSubmit = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    if (!user) {
      alert("Gönderi paylaşmak için giriş yapmalısın.");
      return;
    }
    
    const newPost = {
      id: Date.now(),
      author: user.username || 'Misafir',
      isElite: user.is_elite || false,
      avatar_url: user.avatar_url || null,
      title: newPostTitle,
      content: newPostContent,
      replies: 0,
      views: 0
    };
    
    setPosts([newPost, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
  };

  const renderContent = (text) => {
    if (!text) return null;
    let html = text
      .replace(/</g, '&lt;').replace(/>/g, '&gt;') // escape HTML
      .replace(/\n/g, '<br />')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full md:max-w-[400px] rounded-xl my-3 border border-purple-900/10 shadow-lg" />')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-[#0a0a0c] p-4 rounded-xl font-mono text-xs my-3 text-emerald-400 overflow-x-auto border border-purple-900/5 shadow-inner"><code>$1</code></pre>')
      .replace(/\|\|(.*?)\|\|/g, '<span class="bg-slate-900/10 text-transparent hover:text-slate-900 px-2 py-0.5 rounded cursor-pointer transition-colors duration-300" onclick="this.classList.remove(\'text-transparent\')">$1</span>');
      
    // DOMPurify with ALLOWED_ATTR to keep our onclick functionality for spoilers
    const sanitizedHtml = DOMPurify.sanitize(html, {
      ADD_ATTR: ['onclick']
    });
      
    return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} className="text-slate-700 text-sm leading-relaxed" />;
  };

  return (
    <div className="min-h-screen bg-[#F8F5FF] pt-24 pb-20 relative">
      <div className="max-w-5xl mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-purple-900/10 gap-4">
          <div>
            <Link to="/citadel" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold mb-4">
              <ArrowLeft size={16} /> Forum'a Dön
            </Link>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              {isEliteChamber ? <><Crown className="text-red-500"/> ELITE ODASI</> : category.toUpperCase().replace('-', ' ')}
            </h1>
          </div>
        </div>

        {/* Post Editor */}
        <div className="glass-strong border border-purple-900/10 rounded-2xl p-6 mb-8 shadow-xl">
           <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2"><Plus size={18} className="text-blue-400"/> Hızlı Gönderi Paylaş</h3>
           <input 
             value={newPostTitle}
             onChange={(e) => setNewPostTitle(e.target.value)}
             placeholder="Konu Başlığı..." 
             className="w-full bg-black/50 border border-purple-900/10 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors mb-3 font-bold"
           />
           <textarea 
             ref={textareaRef}
             value={newPostContent}
             onChange={(e) => setNewPostContent(e.target.value)}
             placeholder="Düşüncelerini buraya dök..." 
             className="w-full bg-black/50 border border-purple-900/10 rounded-xl p-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors mb-4 resize-none h-32"
           />
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => insertTextAtCursor('```\n\n```')} aria-label="Kod ekle" className="p-2 rounded-lg bg-slate-900/5 text-slate-600 hover:text-blue-400 transition-colors" title="Kod Ekle"><Code size={18}/></button>
                <button onClick={() => insertTextAtCursor('![Resim Açıklaması](resim_linki)')} aria-label="Görsel ekle" className="p-2 rounded-lg bg-slate-900/5 text-slate-600 hover:text-purple-400 transition-colors" title="Görsel Ekle"><ImageIcon size={18}/></button>
                <button onClick={() => insertTextAtCursor('||gizli metin||')} aria-label="Spoiler gizle" className="p-2 rounded-lg bg-slate-900/5 text-slate-600 hover:text-red-400 transition-colors" title="Spoiler Gizle"><EyeOff size={18}/></button>
              </div>
              <button 
                onClick={handlePostSubmit}
                disabled={!newPostTitle.trim() || !newPostContent.trim()}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-slate-900 font-bold shadow-neon-blue hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Gönder
              </button>
           </div>
        </div>

        {/* Post List */}
        <div className="space-y-4">
          {posts.map(post => {
            const isExpanded = expandedPostId === post.id;
            
            return (
            <motion.div 
              layout
              key={post.id} 
              className={`glass border ${isExpanded ? 'border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'border-purple-900/5 hover:border-purple-900/10'} rounded-2xl p-6 transition-colors overflow-hidden`}
            >
              <div 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
                onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
              >
                <div>
                  <h3 className={`text-lg font-bold mb-2 transition-colors ${isExpanded ? 'text-blue-400' : 'text-slate-200 group-hover:text-blue-400'}`}>
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-900/10 flex items-center justify-center flex-shrink-0">
                      {post.avatar_url ? (
                        <img src={post.avatar_url} alt={`${post.author} avatarı`} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-900">{post.author?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${post.isElite ? 'elite-text-gradient' : 'text-slate-600'}`}>
                      {post.author}
                    </span>
                    {post.isElite && <EliteBadge className="!w-4 !h-4 text-[9px]" />}
                    <span className="text-xs text-slate-600">• 2 saat önce</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm font-bold text-slate-500">
                  <span>{post.replies} YANIT</span>
                  <span>{post.views} OKUNMA</span>
                </div>
              </div>
              
              {/* Expanded Content */}
              {isExpanded && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 pt-6 border-t border-purple-900/10"
                >
                  {renderContent(post.content)}
                  
                  {/* Fake Reply Box */}
                  <div className="mt-8 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900/5 border border-purple-900/10 flex items-center justify-center flex-shrink-0">
                       <span className="text-xs text-slate-600">{user ? user.username.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Bu konuya cevap yaz..." 
                      className="flex-1 bg-black/40 border border-purple-900/10 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button className="px-4 py-2 rounded-xl bg-purple-600 text-slate-900 text-sm font-bold shadow-neon-purple hover:bg-purple-500 transition-colors">Yanıtla</button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )})}
        </div>
        
      </div>
    </div>
  );
}
