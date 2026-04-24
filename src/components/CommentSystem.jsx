import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Trash2, Clock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { getEffectCSS } from '../lib/profileEffects';

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
      const { error } = await addComment(seriesId, {
        userId: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        text: text.trim(),
        chapterNum: chapterNum || null,
        isSpoiler,
        avatar_effect: user?.avatar_effect || 'none',
        comment_effect: user?.comment_effect || 'none',
        nametag_effect: user?.nametag_effect || 'none'
      });

      if (error) {
        console.error('[COMMENTS] Kayıt Hatası:', error);
        alert('Yorum gönderilemedi: ' + error.message);
      } else {
        setText('');
        setIsSpoiler(false);
        updateXP(10);
        // Real-time bazen geç gelebilir, manuel tetikleyelim
        fetchComments();
      }
    } catch (err) {
      console.error('Yorum beklenmedik hata:', err);
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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">
              {chapterNum ? `Bölüm ${chapterNum}` : 'Seri Yorumları'}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{comments.length} TOPLAM MESAJ</p>
          </div>
        </div>
      </div>

      {/* Input Area */}
      {user ? (
        <form onSubmit={handleSubmit} className="relative glass border border-white/10 rounded-2xl p-4 bg-white/[0.01]">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-lg shadow-purple-900/20">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={chapterNum ? "Bu bölüm hakkında yorumun nedir?" : "Genel seri hakkında yorumun nedir?"}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/40 transition-all resize-none min-h-[100px]"
              />
              <div className="flex items-center justify-between mt-3 gap-2">
                <button
                  type="button"
                  onClick={() => setIsSpoiler(!isSpoiler)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    isSpoiler 
                      ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                      : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {isSpoiler ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span className="text-[10px] font-black uppercase tracking-widest">SPOİLER</span>
                </button>
                
                <button
                  type="submit"
                  disabled={loading || !text.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-xl text-xs shadow-neon-purple hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest"
                >
                  {loading ? '...' : <><Send size={14} /> GÖNDER</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="glass border border-purple-500/10 rounded-2xl p-6 text-center bg-purple-500/[0.02]">
          <p className="text-slate-200 text-xs font-bold mb-3">Yorum yapmak için giriş yapmalısınız.</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }))}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-xl text-xs shadow-neon-purple"
          >
            Giriş Yap
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-4 max-h-[800px] overflow-y-auto pr-1 no-scrollbar">
        <AnimatePresence initial={false}>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass border border-white/5 rounded-2xl p-4 bg-white/[0.01] group relative ${getEffectCSS('comment', comment.comment_effect)}`}
            >
              <div className="flex gap-3">
                <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 font-black text-sm overflow-hidden flex-shrink-0 ${getEffectCSS('avatar', comment.avatar_effect)}`}>
                  {comment.avatar_url ? (
                    <img src={comment.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    comment.username?.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                       <span className={`text-white font-black text-sm italic tracking-tighter truncate ${getEffectCSS('nametag', comment.nametag_effect)}`}>{comment.username}</span>
                       {comment.chapter_num && (
                         <span className="flex-shrink-0 text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 font-black uppercase">
                           B{comment.chapter_num}
                         </span>
                       )}
                    </div>
                    {(user?.id === comment.user_id || user?.role === 'Baş Admin' || user?.role === 'Yönetici') && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="p-1 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  
                  <div className="relative rounded-lg overflow-hidden mt-1">
                    <p className={`text-slate-300 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-500 ${comment.is_spoiler && !revealedSpoilers.has(comment.id) ? 'blur-xl opacity-20 select-none' : ''}`}>
                      {comment.text}
                    </p>
                    
                    {comment.is_spoiler && !revealedSpoilers.has(comment.id) && (
                      <div 
                        onClick={() => toggleSpoiler(comment.id)}
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md cursor-pointer border border-red-500/10 rounded-lg hover:bg-black/20 transition-all"
                      >
                         <AlertTriangle size={16} className="text-red-500 mb-1" />
                         <span className="text-[8px] font-black text-white uppercase tracking-widest">Sürpriz Bozan</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 opacity-40">
                     <Clock size={8} className="text-slate-500" />
                     <span className="text-[8px] font-bold text-slate-500">{new Date(comment.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="text-center py-10 opacity-30">
            <MessageSquare size={32} className="mx-auto mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">Henüz yorum yok</p>
          </div>
        )}
      </div>
    </div>
  );
}
