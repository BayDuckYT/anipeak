import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Trash2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';

export default function CommentSystem({ seriesId, chapterNum }) {
  const { user } = useAuth();
  const { addComment } = useApp();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Fetch & Subscribe
  useEffect(() => {
    const fetchComments = async () => {
      let query = supabase
        .from('comments')
        .select('*')
        .eq('series_id', seriesId)
        .order('created_at', { ascending: false });
      
      if (chapterNum) query = query.eq('chapter_num', chapterNum);
      
      const { data } = await query;
      setComments(data || []);
    };

    fetchComments();

    // Real-time listener
    const channel = supabase
      .channel(`comments:${seriesId}`)
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
        chapterNum
      });
      setText('');
    } catch (err) {
      console.error('Yorum hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('comments').delete().eq('id', id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="text-purple-400" size={24} />
        <h3 className="text-xl font-black text-white">Yorumlar ({comments.length})</h3>
      </div>

      {/* Input Area */}
      {user ? (
        <form onSubmit={handleSubmit} className="glass border border-white/10 rounded-2xl p-4 mb-8">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 space-y-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Düşüncelerini evrenle paylaş..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all resize-none min-h-[100px]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !text.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl text-sm shadow-neon-purple hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Gönderiliyor...' : <><Send size={16} /> Gönder</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="glass border border-purple-500/20 rounded-2xl p-6 text-center mb-8 bg-purple-500/5">
          <MessageSquare size={32} className="text-purple-400 mx-auto mb-3 opacity-70" />
          <p className="text-slate-200 text-sm font-bold mb-1">Yorum yapmak için giriş yapmalısın</p>
          <p className="text-slate-500 text-xs mb-4">Topluluğa katıl, düşüncelerini paylaş!</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }))}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl text-sm shadow-neon-purple hover:scale-[1.02] transition-all"
          >
            Giriş Yap / Kayıt Ol
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group"
            >
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 font-bold overflow-hidden flex-shrink-0">
                  {comment.avatar_url ? (
                    <img src={comment.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    comment.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                       <span className="text-white font-bold text-sm">{comment.username}</span>
                       {comment.chapter_num && (
                         <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20 font-black">
                           BÖLÜM {comment.chapter_num}
                         </span>
                       )}
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] text-slate-500 flex items-center gap-1">
                         <Clock size={10} /> {new Date(comment.created_at).toLocaleDateString()}
                       </span>
                       {(user?.id === comment.user_id || user?.role === 'Baş Admin' || user?.role === 'Yönetici') && (
                         <button
                           onClick={() => handleDelete(comment.id)}
                           className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                         >
                           <Trash2 size={14} />
                         </button>
                       )}
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="text-center py-12 text-slate-600">
            <p>Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
          </div>
        )}
      </div>
    </div>
  );
}
