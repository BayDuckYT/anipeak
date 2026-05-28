import sys
path = 'src/pages/ProfileShowcase.jsx'
lines = open(path, encoding='utf-8').readlines()

new_sidebar = '''          <aside className="w-full lg:w-[320px] shrink-0 space-y-6 relative z-10">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2rem] overflow-hidden shadow-2xl relative">
              
              {/* Sidebar Background Blur Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-50 bg-zinc-950/20 backdrop-blur-3xl" />

              {/* FULL CARD PROFILE EFFECT OVERLAY */}
              {(() => {
                const visitorMix = displayUser.active_mix || {};
                const activePEId = isOwnProfile ? mixState.profile_effect : visitorMix.profile_effect;
                const previewPEId = previewEffect?.category === 'profile_effects' ? previewEffect.id : null;
                const targetPEId = previewPEId || activePEId;
                
                if (targetPEId && targetPEId !== 'none') {
                  const peData = effectsData.find(e => e.id === targetPEId);
                  if (peData?.url) {
                    const isVideo = peData.url.toLowerCase().endsWith('.webm');
                    const isPng = peData.url.toLowerCase().split('?')[0].endsWith('.png');

                    return (
                      <motion.div 
                        key={targetPEId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-[2rem]"
                      >
                        {isVideo ? (
                          <video src={peData.url} autoPlay muted loop playsInline className="w-full h-full object-cover mix-blend-screen" />
                        ) : isPng ? (
                          <ProfileEffectSpritesheet url={peData.url} />
                        ) : (
                          <img src={peData.url} alt="Profile Effect" className="w-full h-full object-cover mix-blend-screen" />
                        )}
                      </motion.div>
                    );
                  }
                }
                return null;
              })()}

              {/* Profile Header */}
              <div className="p-8 flex flex-col items-center text-center space-y-4 relative z-10">
                <AnimeAvatar 
                  src={displayUser.avatar_url} 
                  effect={(previewEffect?.category !== 'profile_effects' ? previewEffect : null) || activeEffectObj} 
                  size="w-32 h-32" 
                  forcePlay={true}
                />

                <div className="relative w-full aspect-[3/1] flex flex-col items-center justify-center overflow-hidden rounded-2xl group border border-white/5 shadow-xl">
                  {/* --- NAMEPLATE VIDEO BACKGROUND --- */}
                  {(isOwnProfile ? mixState.nameplate : (displayUser.active_mix?.nameplate || 'none')) !== 'none' && (
                    <div className="absolute inset-0 z-0">
                      <video 
                        src={`/nameplates/${isOwnProfile ? mixState.nameplate : displayUser.active_mix.nameplate}`} 
                        autoPlay muted loop playsInline 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                    </div>
                  )}

                  <div className="relative z-10 text-center w-full px-2">
                    <h2 className={`text-xl font-black tracking-tighter flex flex-col items-center justify-center gap-1 ${
                      (isOwnProfile ? mixState.nametag : (displayUser.active_mix?.nametag || 'none')) !== 'none' 
                        ? `nametag-effect-${isOwnProfile ? mixState.nametag : displayUser.active_mix.nametag}` 
                        : (displayUser.rank === 'Manga Hükümdarı' ? 'rank-glow-purple' : (displayUser.rank === 'Ulusal Seviye Avcı' || displayUser.premium) ? 'rank-glow-gold' : 'text-white')
                    }`}>
                      <span className="truncate max-w-[180px]">{displayUser.username}</span>
                      <span className="text-[9px] font-black bg-white/10 px-2 py-0.5 rounded text-zinc-400 border border-white/5 shadow-sm shrink-0 uppercase tracking-widest">{displayUser.rank || 'Çaylak Okur'}</span>
                    </h2>
                    
                    {/* XP Progress Bar */}
                    <div className="mt-2 w-full max-w-[160px] mx-auto">
                       <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(displayUser.xp % 1000) / 10}%` }}
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                          />
                       </div>
                       <div className="flex justify-between items-center mt-1 px-0.5">
                          <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-tighter">XP: {displayUser.xp || 0}</span>
                          <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-tighter">Sonraki Seviye</span>
                       </div>
                    </div>

                    <p className="text-zinc-500 text-[7px] font-bold tracking-[0.15em] uppercase mt-2 opacity-50 truncate">mahorapeak.com/profil/{displayUser.username}</p>
                  </div>
                </div>

                <p className="text-zinc-400 text-xs italic font-medium">
                  "{displayUser.bio || 'Henüz bir biyografi eklenmemiş.'}"
                </p>

                {!isOwnProfile && currentUser && (
                  <div className="flex gap-2 w-full pt-2">
                    <button 
                      onClick={handleFollow}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-xl ${
                        isFollowing 
                        ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'
                      }`}
                    >
                      {isFollowing ? <Minus size={14} /> : <UserPlus size={14} />}
                      {isFollowing ? 'Takipten Çık' : 'Takip Et'}
                    </button>
                    <button 
                      onClick={handleStartChat}
                      className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white transition-all"
                    >
                      <Mail size={16} />
                    </button>
                  </div>
                )}

                {isOwnProfile && (
                  <div className="flex gap-2 w-full pt-2">
                    <button 
                      onClick={() => navigate('/settings')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-[10px] font-black uppercase hover:bg-zinc-800 transition-all"
                    >
                      <Edit3 size={14} /> Profili Düzenle
                    </button>
                    <button 
                      onClick={() => setShowLinksModal(true)}
                      className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white transition-all"
                    >
                      <LinkIcon size={16} />
                    </button>
                    <button 
                      onClick={() => setShowPremiumModal(true)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase shadow-lg shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-1"
                    >
                      <Crown size={12} /> PREMIUM
                    </button>
                    {(currentUser?.role === 'Baş Admin' || currentUser?.role === 'Yönetici') && (
                      <Link to="/admin" className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase hover:bg-amber-500/20 transition-all">
                        <Shield size={14} />
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="profile-stats-grid">
                {[
                  { label: 'TAKİPÇİ', value: followersCount },
                  { label: 'TAKİP', value: followingCount },
                  { label: 'FAVORİ', value: favoritesCount },
                  { label: 'YORUM', value: commentsCount },
                ].map((stat, i) => (
                  <div key={i}>
                    <span className="text-xs font-black text-white">{stat.value}</span>
                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-tighter">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Footer Info */}
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  <Calendar size={14} /> {displayUser.joinDate || '29 Nis 2026'} Tarihinden Beri Üye
                </div>

                {/* Social Links */}
                <div className="space-y-3">
                  <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">BAĞLANTILAR</h3>
                  <div className="flex flex-col gap-2">
                    {userLinks.map((link, idx) => (
                      <a 
                        key={idx}
                        href={getPlatformUrl(link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900 transition-all group"
                      >
                         {getSocialIcon(link.platform)}
                         <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white truncate">{link.value}</span>
                      </a>
                    ))}
                    {isOwnProfile && (
                      <button 
                        onClick={() => setShowLinksModal(true)}
                        className="flex items-center justify-center gap-2 mt-1 p-3 rounded-2xl bg-zinc-950/20 border border-dashed border-zinc-800/50 text-[9px] font-black uppercase text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
                      >
                        <Plus size={12} /> Bağlantı Ekle
                      </button>
                    )}
                  </div>
                </div>

                {/* XP Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-zinc-500">SEVİYE {displayUser.level || 1}</span>
                    <span className="text-zinc-400">{displayUser.xp || 0} / 100 XP</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(displayUser.xp || 0, 100)}%` }}
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-500" 
                    />
                  </div>
                </div>

                {/* Achievements Preview */}
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">BAŞARIMLAR</h3>
                     <span className="text-[9px] font-black text-zinc-500">0/50</span>
                   </div>
                   <div className="grid grid-cols-5 gap-2">
                     {[...Array(5)].map((_, i) => (
                       <div key={i} className="aspect-square rounded-lg bg-zinc-950/50 border border-zinc-800/50 flex items-center justify-center text-zinc-800">
                         <Award size={14} />
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </aside>'''

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if '<aside' in line and 'shrink-0' in line:
        start_idx = i
    if '</aside>' in line and start_idx != -1:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    lines[start_idx:end_idx+1] = [new_sidebar + '\\n']
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(f'Sidebar replaced from line {start_idx+1} to {end_idx+1}.')
else:
    print('Could not find sidebar block.')
