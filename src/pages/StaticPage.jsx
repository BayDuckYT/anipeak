import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import DOMPurify from 'dompurify';
import { 
  ChevronRight, 
  FileText, 
  ShieldCheck, 
  Scale, 
  Sparkles, 
  Users, 
  RefreshCw, 
  AlertTriangle, 
  Headphones, 
  CheckCircle2,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import Loader from '../components/Loader';
import { DEFAULT_LEGAL_PAGES } from '../data/legalPages';

// URL slug alias haritası — Her türlü varyasyonu doğru sayfaya eşler
const SLUG_ALIASES = {
  'kullanim-sartlari': 'sartlar',
  'kullanim-kosullari': 'sartlar',
  'terms': 'sartlar',
  'terms-of-service': 'sartlar',
  'gizlilik-politikasi': 'gizlilik',
  'privacy': 'gizlilik',
  'privacy-policy': 'gizlilik',
  'kvkk': 'gizlilik',
  'hakkimizda': 'hakkinda',
  'about': 'hakkinda',
  'about-us': 'hakkinda',
  'topluluk': 'topluluk-kurallari',
  'kurallar': 'topluluk-kurallari',
  'community': 'topluluk-kurallari',
  'iade': 'iade-ve-teslimat',
  'teslimat': 'iade-ve-teslimat',
  'refund': 'iade-ve-teslimat',
  'telif': 'dmca',
  'copyright': 'dmca',
};

const LEGAL_TABS = [
  { slug: 'hakkinda', label: 'Hakkında', icon: Sparkles },
  { slug: 'sartlar', label: 'Kullanım Şartları', icon: Scale },
  { slug: 'gizlilik', label: 'Gizlilik Politikası', icon: ShieldCheck },
  { slug: 'topluluk-kurallari', label: 'Topluluk Kuralları', icon: Users },
  { slug: 'iade-ve-teslimat', label: 'İade ve Teslimat', icon: RefreshCw },
  { slug: 'dmca', label: 'DMCA / Telif', icon: AlertTriangle },
];

function getPageIcon(slug) {
  switch (slug) {
    case 'hakkinda': return Sparkles;
    case 'sartlar': return Scale;
    case 'gizlilik': return ShieldCheck;
    case 'topluluk-kurallari': return Users;
    case 'iade-ve-teslimat': return RefreshCw;
    case 'dmca': return AlertTriangle;
    default: return FileText;
  }
}

export default function StaticPage() {
  const { slug } = useParams();
  const location = useLocation();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  const rawSlug = (slug || '').toLowerCase().trim();
  const resolvedSlug = SLUG_ALIASES[rawSlug] || rawSlug;

  useSEO({
    title: page?.title ? `${page.title} — MahoraPeak` : 'MahoraPeak Kurumsal & Yasal',
    description: page?.title ? `MahoraPeak resmi mevzuat ve kurumsal sayfası: ${page.title}` : 'MahoraPeak bilgi sayfası.',
    url: `https://mahorapeak.com.tr/${resolvedSlug}`
  });

  useEffect(() => {
    async function fetchPage() {
      setLoading(true);

      // 1. ÖNCELİK: MahoraPeak resmi küratörlü güncel yasal ve kurumsal sayfalarımız
      // Veritabanındaki eski dummy/stale metinlerin bu sayfaları ezmesini önler
      if (DEFAULT_LEGAL_PAGES[resolvedSlug]) {
        setPage({
          ...DEFAULT_LEGAL_PAGES[resolvedSlug],
          slug: resolvedSlug
        });
        setLoading(false);
        return;
      }

      // 2. Dinamik oluşturulan veritabanı sayfaları
      try {
        const { data } = await supabase.from('pages').select('*').eq('slug', resolvedSlug).maybeSingle();
        if (data) {
          setPage(data);
        } else {
          setPage(null);
        }
      } catch (err) {
        setPage(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resolvedSlug]);

  if (loading) {
    return <Loader fullScreen={false} text="Yükleniyor..." />;
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-[#070511] pt-32 pb-20 px-4 text-center">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
          <AlertTriangle size={48} className="mx-auto text-amber-400 mb-4" />
          <h1 className="text-3xl font-black text-white mb-3">Sayfa Bulunamadı</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Aradığınız yasal veya kurumsal sayfa sistemde mevcut değil veya kaldırılmış olabilir.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-purple-900/30">
              Ana Sayfa
            </Link>
            <Link to="/sartlar" className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold rounded-xl text-sm transition-all">
              Kullanım Şartları
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const PageIcon = getPageIcon(resolvedSlug);
  const isLegalTab = LEGAL_TABS.some(t => t.slug === resolvedSlug);

  return (
    <div className="min-h-screen bg-[#070511] pt-28 pb-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Arka plan atmosferik neon parlamaları */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-purple-600/10 via-fuchsia-600/10 to-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-10 right-10 w-80 h-80 bg-violet-500/5 blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-6">
          <Link to="/" className="hover:text-purple-400 transition-colors">Ana Sayfa</Link>
          <ChevronRight size={12} className="text-slate-600" />
          <span className="text-slate-500">Yasal &amp; Kurumsal</span>
          <ChevronRight size={12} className="text-slate-600" />
          <span className="text-white truncate max-w-[220px] sm:max-w-none">{page.title}</span>
        </nav>

        {/* Hızlı Yasal Sekmeler (Yatay kaydırılabilir bar) */}
        {isLegalTab && (
          <div className="mb-8 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {LEGAL_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = resolvedSlug === tab.slug;
              return (
                <Link
                  key={tab.slug}
                  to={`/${tab.slug}`}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40 ring-1 ring-purple-400/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Ana İçerik Kartı */}
        <motion.article
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-[2rem] bg-gradient-to-b from-[#0f0c1d] to-[#070511] border border-white/[0.08] p-6 sm:p-10 md:p-12 shadow-2xl relative overflow-hidden backdrop-blur-2xl"
        >
          {/* Üst Başlık & Rozetler */}
          <div className="border-b border-white/[0.08] pb-8 mb-8">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                <CheckCircle2 size={12} className="text-purple-400" />
                Resmi MahoraPeak Belgesi
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white/[0.03] text-slate-400 border border-white/[0.06]">
                <Calendar size={12} />
                Son Güncelleme: {page.updated_at ? new Date(page.updated_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Şubat 2026'}
              </span>
            </div>

            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-fuchsia-600 p-0.5 shadow-xl shadow-purple-900/40 flex-shrink-0">
                <div className="w-full h-full bg-[#0c091a] rounded-[14px] flex items-center justify-center">
                  <PageIcon size={26} className="text-purple-300" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
                  {page.title}
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">
                  5651 Sayılı Kanun, 5846 FSEK ve 6698 KVKK Standartları Güvencesiyle
                </p>
              </div>
            </div>
          </div>

          {/* HTML Gövde */}
          <div 
            className="legal-prose"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }}
          />

          {/* Alt Bilgi & Hızlı İletişim Kutusu */}
          <div className="mt-12 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02] -mx-6 sm:-mx-10 md:-mx-12 -mb-6 sm:-mb-10 md:-mb-12 p-6 sm:p-8 rounded-b-[2rem]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 flex-shrink-0">
                <Headphones size={20} />
              </div>
              <div>
                <p className="text-white text-sm font-bold">Sorunuz veya yasal bildiriminiz mi var?</p>
                <p className="text-slate-400 text-xs">Resmi İletişim Masamız veya Canlı Destek üzerinden bize dilediğiniz an ulaşabilirsiniz.</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Link
                to="/iletisim"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/30"
              >
                <span>İletişim Masası</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
}
