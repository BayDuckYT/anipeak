import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Trash2, Clock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';

export default function CommentSystem({ seriesId, chapterNum }) {
  const { user, updateXP } = useAuth();
  const { addComment } = useApp();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState(new Set());

  // ── Fetch & Subscribe
  const fetchComments = async () => {
    let query = supabase
      .from('comments')
      .select('*')
      .eq('series_id', seriesId)
      .order('created_at', { ascending: false });
    
    // IF chapterNum is provided, filter by it. 
    // IF NOT provided, filter where chapter_num is NULL (Series-wide comments)
    if (chapterNum !== undefined && chapterNum !== null) {
      query = query.eq('chapter_num', chapterNum);
    } else {
      query = query.is('chapter_num', null);
    }
    
    const { data, error } = await query;
    if (error) console.error("[COMMENTS] Yükleme Hatası:", error);
    setComments(data || []);
  };

  useEffect(() => {
    fetchComments();

    // Real-time listener — refined for professional sync
    const channel = supabase
      .channel(`comments:${seriesId}:${chapterNum || 'main'}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'comments', 
        filter: `series_id=eq.${seriesId}` 
      }, () => fetchComments())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [seriesId, chapterNum]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !text.trim()) return;

    setLoading(true);
    try {
      await addComment(seriesId, {
        userId: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        text: text.trim(),
        chapterNum: chapterNum || null,
        isSpoiler
      });
      setText('');
      setIsSpoiler(false);
      updateXP(10); // +10 XP for commenting
    } catch (err) {
      console.error('Yorum hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (!error) fetchComments();
  };

  const toggleSpoiler = (id) => {
    const next = new Set(revealedSpoilers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRevealedSpoilers(next);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">
              {chapterNum ? `Bölüm ${chapterNum} Yorumları` : 'Seri Yorumları'}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{comments.length} TOPLAM MESAJ</p>
          </div>
        </div>
      </div>

      {/* Input Area */}
      {user ? (
        <form onSubmit={handleSubmit} className="glass-strong border border-white/10 rounded-3xl p-5 shadow-2xl bg-black/40">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-lg shadow-purple-900/40">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 space-y-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={chapterNum ? "Bu bölüm hakkında ne düşünüyorsun amk?" : "Genel seri hakkında yorumun nedir?"}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none min-h-[120px] shadow-inner"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsSpoiler(!isSpoiler)}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all ${
                    isSpoiler 
                      ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                      : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {isSpoiler ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isSpoiler ? 'SPOİLER AKTİF!' : 'SPOİLER MI?'}
                  </span>
                </button>
                
                <button
                  type="submit"
                  disabled={loading || !text.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-2xl text-sm shadow-neon-purple hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50 flex items-center gap-3 uppercase tracking-widest"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      GÖNDER <Send size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="glass border border-purple-500/20 rounded-3xl p-8 text-center bg-purple-500/5 shadow-2xl">
          <MessageSquare size={40} className="text-purple-400 mx-auto mb-4 opacity-50" />
          <h4 className="text-white font-black text-lg mb-2">EVRENE KATIL!</h4>
          <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto">Yorum yapmak ve toplulukla etkileşime girmek için giriş yapmalısın.</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }))}
            className="px-10 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-2xl text-sm shadow-neon-purple hover:scale-[1.05] transition-all uppercase tracking-widest"
          >
            Giriş Yap / Kayıt Ol
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-5">
        <AnimatePresence mode="popLayout">
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass border border-white/5 rounded-[2rem] p-6 hover:border-white/10 transition-all group relative bg-white/[0.01]"
            >
              <div className="flex gap-5">
                {/* Avatar Column */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 font-black text-lg overflow-hidden shadow-xl">
                    {comment.avatar_url ? (
                      <img src={comment.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      comment.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                       <span className="text-white font-black text-base italic tracking-tighter">{comment.username}</span>
                       {comment.chapter_num && (
                         <span className="text-[9px] bg-purple-500 text-white px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                           BÖLÜM {comment.chapter_num}
                         </span>
                       )}
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                         <Clock size={10} /> {new Date(comment.created_at).toLocaleDateString('tr-TR')}
                       </span>
                       {(user?.id === comment.user_id || user?.role === 'Baş Admin' || user?.role === 'Yönetici') && (
                         <button
                           onClick={() => handleDelete(comment.id)}
                           className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                         >
                           <Trash2 size={16} />
                         </button>
                       )}
                    </div>
                  </div>
                  
                  {/* Yorum Metni & Spoiler Perdesi */}
                  <div className="relative rounded-2xl overflow-hidden min-h-[40px]">
                    <p className={`text-slate-300 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-700 ${comment.is_spoiler && !revealedSpoilers.has(comment.id) ? 'blur-2xl opacity-10 select-none scale-95' : ''}`}>
                      {comment.text}
                    </p>
                    
                    {comment.is_spoiler && !revealedSpoilers.has(comment.id) && (
                      <div 
                        onClick={() => toggleSpoiler(comment.id)}
                        className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-md cursor-pointer hover:bg-black/40 transition-all border border-red-500/30 rounded-2xl group/spoiler"
                      >
                         <div className="flex flex-col items-center gap-2">
                           <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 group-hover/spoiler:scale-110 transition-transform">
                             <AlertTriangle size={20} />
                           </div>
                           <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-lg">
                             Sürpriz Bozan! Görmek İçin Tıkla
                           </span>
                         </div>
                      </div>
                    )}

                    {comment.is_spoiler && revealedSpoilers.has(comment.id) && (
                      <button 
                        onClick={() => toggleSpoiler(comment.id)}
                        className="mt-3 text-[9px] font-black text-red-400/60 hover:text-red-400 uppercase tracking-widest flex items-center gap-1 transition-colors"
                      >
                        <EyeOff size={10} /> Spoiler'ı Geri Gizle
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 glass border border-white/5 rounded-[3rem] bg-white/[0.01]">
            <MessageSquare size={48} className="text-slate-800 mb-4" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-sm italic">Sessizlik Hakim...</p>
            <p className="text-slate-600 text-xs mt-2">Bu evrendeki ilk ses sen ol amk.</p>
          </div>
        )}
      </div>
    </div>
  );
}
