import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import DOMPurify from 'dompurify';
import { ChevronRight, FileText, Activity } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export default function StaticPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: page?.title || 'Bilgi Sayfası',
    description: page?.title ? `AniPeak - ${page.title}` : 'AniPeak bilgi sayfası.',
    url: `https://anipeak.com.tr/sayfa/${slug}`
  });

  useEffect(() => {
    async function fetchPage() {
      setLoading(true);
      const { data } = await supabase.from('pages').select('*').eq('slug', slug).single();
      if (data) setPage(data);
      setLoading(false);
    }
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070511] flex items-center justify-center">
        <Activity className="text-purple-500 animate-spin" size={48} />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-[#070511] pt-32 pb-20 px-4 text-center">
        <h1 className="text-4xl font-black text-white mb-4 uppercase italic">Sayfa Bulunamadı!</h1>
        <p className="text-slate-500 mb-8">Aradığın sayfa sistemde bulunamadı veya silinmiş olabilir.</p>
        <Link to="/" className="px-8 py-3 bg-purple-600 text-white font-black rounded-2xl shadow-neon-purple">Ana Sayfaya Dön</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070511] pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8">
          <Link to="/" className="hover:text-purple-400 transition-colors">Ana Sayfa</Link>
          <ChevronRight size={10} />
          <span className="text-white">{page.title}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-xl">
              <FileText size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">{page.title}</h1>
              <p className="text-slate-500 text-xs mt-2 uppercase tracking-[0.2em] font-bold">AniPeak Kurumsal • Son Güncelleme: {new Date(page.updated_at).toLocaleDateString('tr-TR')}</p>
            </div>
          </div>

          <div 
            className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-6 text-lg"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }}
          />
        </motion.div>
      </div>
    </div>
  );
}
