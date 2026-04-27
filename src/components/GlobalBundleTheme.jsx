import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SiberVideo from './SiberVideo';

/**
 * GlobalBundleTheme — Site genelinde paket temasını uygular.
 * Arka plan videolarını oynatır ve body'ye ilgili CSS sınıflarını ekler.
 */
export default function GlobalBundleTheme() {
  const { user } = useAuth();
  const location = useLocation();
  
  // Okuma sayfasında (Manga Reader) tema istemiyoruz
  const isReader = location.pathname.startsWith('/read/');
  
  // Aktif paketi belirle (Önce kullanıcıdan, yoksa önbellekten zorla oku)
  const getInitialMix = () => {
    if (user?.active_mix) return user.active_mix;
    try {
      const cached = localStorage.getItem('anipeak_user_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.active_mix) return parsed.active_mix;
      }
    } catch (e) {}
    return { avatar: 'none', comment: 'none', nametag: 'none', aura: 'none' };
  };

  const applied = getInitialMix();
  const isSukuna = applied.aura === 'blood-rain' || applied.avatar === 'sukuna-aura';
  const isGojo = applied.aura === 'void-particles' || applied.avatar === 'gojo-aura';

  console.log('[INFINITY-GUARD] Global Theme Status:', { isSukuna, isGojo, path: location.pathname });

  // Body'ye tema sınıflarını ekle/çıkar
  useEffect(() => {
    if (isReader) {
      document.body.classList.remove('theme-sukuna', 'theme-gojo');
      return;
    }

    if (isSukuna) {
      document.body.classList.add('theme-sukuna');
      document.body.classList.remove('theme-gojo');
    } else if (isGojo) {
      document.body.classList.add('theme-gojo');
      document.body.classList.remove('theme-sukuna');
    } else {
      document.body.classList.remove('theme-sukuna', 'theme-gojo');
    }

    return () => {
      document.body.classList.remove('theme-sukuna', 'theme-gojo');
    };
  }, [isSukuna, isGojo, isReader]);

  if (isReader || (!isSukuna && !isGojo)) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#020617]">
      {/* Sukuna Global Background */}
      {isSukuna && (
        <>
          <SiberVideo 
            src="/sukuna/bg.webm" 
            className="w-full h-full object-cover opacity-20 mix-blend-screen saturate-[0.8] blur-[2px] scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-black/60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.05)_0%,transparent_70%)]" />
        </>
      )}

      {/* Gojo Global Background */}
      {isGojo && (
        <>
          <SiberVideo 
            src="/gojo/arkaplangojo.webm" 
            className="w-full h-full object-cover opacity-15 mix-blend-screen saturate-[0.8] blur-[1px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-black/60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
        </>
      )}
    </div>
  );
}
