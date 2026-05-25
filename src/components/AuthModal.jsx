import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, UserPlus, Eye, EyeOff, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthModal({ mode, onClose }) {
  const [tab, setTab] = useState(mode || 'login'); // 'login', 'register', 'forgot'
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Modal Scroll Lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' });
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (tab === 'forgot') {
      if (!form.email.includes('@')) { setError('Geçerli bir e-posta girin.'); return; }
      setLoading(true);
      try {
        await resetPassword(form.email);
        setSuccess(true);
      } catch (err) {
        setError(err.message || 'Sıfırlama maili gönderilemedi.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Validation
    if (!form.email.includes('@')) { setError('Geçerli bir e-posta girin.'); return; }
    if (form.password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return; }
    if (tab === 'register' && form.password !== form.password2) { setError('Şifreler eşleşmiyor.'); return; }
    if (tab === 'register' && form.username.length < 3) { setError('Kullanıcı adı en az 3 karakter.'); return; }

    setLoading(true);
    try {
      let data;
      if (tab === 'register') {
        data = await signup(form.email, form.password, form.username);
      } else {
        data = await login(form.email, form.password);
      }
      
      // If no session is returned, it likely means email confirmation is required
      if (tab === 'register' && !data?.session) {
        setTab('confirm_email');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Auth Error:', err);
      if (err.message === 'Failed to fetch') {
        setError('Bağlantı engellendi! Lütfen AdBlocker, VPN veya Brave Kalkanları kullanıyorsanız devredışı bırakıp sayfayı yenileyin.');
      } else if (err.message === 'Invalid login credentials') {
        setError('E-posta veya şifre hatalı!');
      } else if (err.message === 'Email not confirmed') {
        setError('E-posta adresi henüz doğrulanmamış.');
      } else {
        setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] overflow-y-auto custom-scrollbar flex items-start justify-center pt-10 pb-10 px-4 sm:px-6 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Modal Content */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-[1001] w-full max-w-[400px] bg-[#0c0a10] glass-strong rounded-[2rem] p-6 shadow-[0_0_50px_rgba(168,85,247,0.15)] border border-white/10"
      >
          {/* Glows */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1 mb-2">
              <Zap size={22} className="text-purple-400" />
              <span className="text-2xl font-black gradient-text">AniPeak</span>
            </div>
            <p className="text-slate-400 text-sm">
              {tab === 'login' ? 'Hesabına giriş yap ve okumaya devam et' : 
               tab === 'register' ? 'Ücretsiz hesap oluştur, evrene katıl' : 
               tab === 'confirm_email' ? 'Kayıt başarılı! E-postanı onayla' :
               'Şifreni sıfırlamak için e-posta adresini gir'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-5">
            {['login', 'register'].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccess(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === t ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-neon-purple' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'login' ? <LogIn size={14} /> : <UserPlus size={14} />}
                {t === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            ))}
          </div>

          {/* Success / Confirm Email state */}
          <AnimatePresence mode="wait">
            {(success || tab === 'confirm_email') && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8"
              >
                <CheckCircle size={48} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-white font-bold text-lg">
                  {tab === 'forgot' ? 'Mail Gönderildi! 📧' : 
                   tab === 'confirm_email' ? 'Doğrulama Maili Gönderildi! 📧' : 
                   'İşlem Başarılı! 🎉'}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {tab === 'forgot' || tab === 'confirm_email' 
                    ? 'Lütfen gelen kutunu (ve spam klasörünü) kontrol et.' 
                    : 'Yönlendiriliyorsun...'}
                </p>
                {(tab === 'forgot' || tab === 'confirm_email') && (
                  <button 
                    onClick={() => { setTab('login'); setSuccess(false); }}
                    className="mt-6 text-purple-400 text-xs font-bold hover:underline"
                  >
                    Giriş Sayfasına Dön
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!success && tab !== 'confirm_email' && (
            <AnimatePresence mode="wait">
              <motion.form
                key={tab}
                initial={{ opacity: 0, x: tab === 'login' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tab === 'login' ? 20 : -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {tab === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Kullanıcı Adı</label>
                    <input
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      type="text"
                      required
                      placeholder="galaksi_okuyucu"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">E-posta</label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    required
                    placeholder="sen@anipeak.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_12px_rgba(59,130,246,0.4)] transition-all"
                  />
                </div>
                {tab !== 'forgot' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Şifre</label>
                    <div className="relative">
                      <input
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        type={showPass ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}
                {tab === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Şifre Tekrarı</label>
                    <div className="relative">
                      <input
                        name="password2"
                        value={form.password2}
                        onChange={handleChange}
                        type={showPass ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_12px_rgba(59,130,246,0.4)] transition-all"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        x: [0, -4, 4, -4, 4, 0] 
                      }}
                      transition={{ duration: 0.4 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={14} className="text-red-500" />
                      </div>
                      <span className="font-semibold">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {tab === 'login' && (
                  <div className="text-right">
                    <button 
                      type="button" 
                      onClick={() => setTab('forgot')}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Şifremi Unuttum?
                    </button>
                  </div>
                )}

                {tab === 'forgot' && (
                  <div className="text-left">
                    <button 
                      type="button" 
                      onClick={() => setTab('login')}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      ← Giriş Yap'a Dön
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 transition-all shadow-neon-purple disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> İşleniyor...</>
                  ) : tab === 'login' ? 'Giriş Yap' : tab === 'register' ? 'Hesap Oluştur' : 'Sıfırlama Bağlantısı Gönder'}
                </button>

                {tab !== 'forgot' && (
                  <>
                    <div className="relative flex items-center gap-3 my-1">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-xs text-slate-500">veya</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full py-3 rounded-xl text-sm font-medium border border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Google ile devam et
                    </button>
                  </>
                )}
              </motion.form>
            </AnimatePresence>
          )}
        </motion.div>
    </motion.div>
  );
}
