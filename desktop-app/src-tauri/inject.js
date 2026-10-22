(() => {
  const isMahoraPeak = ['mahorapeak.com.tr', 'www.mahorapeak.com.tr'].includes(location.hostname);
  if (isMahoraPeak) {
    const installPageFrame = () => {
      if (!document.documentElement) return;
      document.documentElement.classList.add('mahorapeak-desktop-shell');
      if (document.getElementById('mahorapeak-desktop-layout')) return;
      const style = document.createElement('style');
      style.id = 'mahorapeak-desktop-layout';
      style.textContent = `html.mahorapeak-desktop-shell{scroll-padding-top:56px!important}html.mahorapeak-desktop-shell body{padding-top:44px!important}html.mahorapeak-desktop-shell header.fixed.top-0{top:44px!important;transform:none!important}html.mahorapeak-desktop-shell body header,html.mahorapeak-desktop-shell body nav{scroll-margin-top:48px!important}`;
      document.documentElement.append(style);
    };
    installPageFrame();
    if (!document.documentElement) document.addEventListener('readystatechange', installPageFrame, { once: true });
  }
  const boot = () => {
    if (!['mahorapeak.com.tr', 'www.mahorapeak.com.tr'].includes(location.hostname)) return;
    if (document.getElementById('mahorapeak-desktop-bar')) return;

    const invoke = window.__TAURI__?.core?.invoke;
    const bar = document.createElement('div');
    bar.id = 'mahorapeak-desktop-bar';
    bar.innerHTML = `<style>
      #mahorapeak-desktop-bar{position:fixed!important;z-index:2147483647!important;top:0!important;left:0!important;right:0!important;height:44px!important;display:flex!important;align-items:center!important;gap:7px!important;padding:0 0 0 14px!important;background:#0b0911!important;border-bottom:1px solid #ffffff1c!important;box-shadow:0 5px 22px #0008!important;color:#f4f0fb!important;font:600 12px Segoe UI,sans-serif!important;user-select:none!important}
      #mahorapeak-desktop-bar *{box-sizing:border-box!important;font:inherit!important}#mahorapeak-desktop-bar .brand{display:flex!important;align-items:center!important;gap:8px!important;padding:0 8px 0 2px!important}#mahorapeak-desktop-bar .brand-logo{width:92px!important;height:38px!important;object-fit:cover!important;object-position:center!important;border-radius:4px!important}#mahorapeak-desktop-bar .brand small{font-weight:800!important;color:#c7a6ff!important;letter-spacing:.12em!important;font-size:9px!important}#mahorapeak-desktop-bar .space{flex:1!important}#mahorapeak-desktop-bar button{height:29px!important;padding:0 9px!important;border:1px solid #ffffff1a!important;border-radius:7px!important;background:#ffffff0b!important;color:#eee8f8!important;cursor:pointer!important}#mahorapeak-desktop-bar button:hover{background:#8b5cf6!important;border-color:#a784ff!important}#mahorapeak-desktop-bar .primary{background:#7c4ad9!important;border-color:#9d73ed!important}#mahorapeak-desktop-bar .chapter{display:none!important}#mahorapeak-desktop-bar.chapter-page .chapter{display:inline-block!important}#mahorapeak-desktop-bar .window-controls{height:100%!important;display:flex!important;margin-left:7px!important}#mahorapeak-desktop-bar .window-controls button{width:43px!important;height:100%!important;border:0!important;border-radius:0!important;background:transparent!important;font-size:15px!important}#mahorapeak-desktop-bar .window-controls button:hover{background:#ffffff20!important}#mahorapeak-desktop-bar .window-controls .close:hover{background:#e81123!important}#mahorapeak-desktop-bar .drag{ -webkit-app-region:drag!important; flex:1!important;min-width:20px!important;height:100%!important}#mahorapeak-update-dialog{position:fixed;z-index:2147483647;inset:0;display:grid;place-items:center;background:#05040bcc;backdrop-filter:blur(10px);font:14px Segoe UI,sans-serif;color:#f5f0ff;animation:mpUpdateFade .22s ease-out}#mahorapeak-update-dialog[hidden]{display:none}#mahorapeak-update-dialog .card{position:relative;overflow:hidden;width:min(460px,calc(100vw - 32px));padding:28px;border:1px solid #ffffff24;border-radius:22px;background:radial-gradient(ellipse at 100% 0%,#733eea38,transparent 48%),linear-gradient(145deg,#211637,#11101b 70%);box-shadow:0 25px 90px #000a;animation:mpUpdatePop .36s cubic-bezier(.2,.8,.2,1)}#mahorapeak-update-dialog .card:before{content:"";position:absolute;top:-100px;right:-80px;width:210px;height:210px;border:1px solid #b88cff30;border-radius:50%;box-shadow:0 0 0 18px #b88cff0a,0 0 0 38px #b88cff08;animation:mpUpdateOrbit 9s linear infinite;pointer-events:none}#mahorapeak-update-dialog .update-mark{position:relative;display:grid;place-items:center;width:48px;height:48px;margin-bottom:17px;border:1px solid #b88cff55;border-radius:15px;background:#a06bff1b;color:#d3b5ff;font-size:22px}#mahorapeak-update-dialog .update-mark:before{content:'✦'}#mahorapeak-update-dialog[data-state=checking] .update-mark:before{content:'';width:20px;height:20px;border:2px solid #ffffff35;border-top-color:#c19bff;border-radius:50%;animation:mpUpdateSpin .8s linear infinite}#mahorapeak-update-dialog[data-state=current] .update-mark{color:#7ce2b0;border-color:#55ce9b55;background:#48cb8e18}#mahorapeak-update-dialog[data-state=current] .update-mark:before{content:'✓'}#mahorapeak-update-dialog[data-state=error] .update-mark{color:#ffd18b;border-color:#f4b65355;background:#f4b65318}#mahorapeak-update-dialog[data-state=error] .update-mark:before{content:'!'}#mahorapeak-update-dialog .eyebrow{position:relative;color:#c4a0ff;font-size:11px;letter-spacing:.16em;font-weight:700}#mahorapeak-update-dialog h2{position:relative;margin:10px 0;font-size:24px}#mahorapeak-update-dialog p{position:relative;white-space:pre-line;color:#c5bdd4;line-height:1.6}#mahorapeak-update-dialog .actions{position:relative;display:flex;gap:10px;margin-top:20px}#mahorapeak-update-dialog button{padding:10px 14px;border:1px solid #ffffff22;border-radius:9px;background:#ffffff0d;color:#fff;cursor:pointer}#mahorapeak-update-dialog button[data-update-install],#mahorapeak-update-dialog button[data-update-retry]{background:linear-gradient(110deg,#8651ed,#bd39d8);border-color:#b48bff;box-shadow:0 8px 24px #8745d94a}#mahorapeak-update-dialog button:disabled{opacity:.55;cursor:wait}#mahorapeak-update-dialog progress{position:relative;width:100%;height:8px;accent-color:#a97bff}@keyframes mpUpdateFade{from{opacity:0}to{opacity:1}}@keyframes mpUpdatePop{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes mpUpdateOrbit{to{transform:rotate(360deg)}}@keyframes mpUpdateSpin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){#mahorapeak-update-dialog,#mahorapeak-update-dialog .card,#mahorapeak-update-dialog .card:before,#mahorapeak-update-dialog .update-mark:before{animation:none}}@media(max-width:720px){#mahorapeak-desktop-bar .brand-logo{width:68px!important;height:29px!important}}
    </style><span class="brand"><img class="brand-logo" src="https://mahorapeak.com.tr/mahorapeaklogov2.webp" alt="MahoraPeak"/><small>DESKTOP</small></span><button data-action="back" title="Geri">‹</button><button data-action="forward" title="İleri">›</button><button data-action="reload" title="Yenile">↻</button><button data-action="home">⌂ Ana Sayfa</button><button data-action="library">▤ Kütüphanem</button><button class="chapter primary" data-action="download">↓ Bölümü İndir</button><span class="drag" data-tauri-drag-region></span><button data-action="updates" title="Güncellemeleri denetle">↻ Güncelleme</button><button data-action="fullscreen" title="Tam ekran">⛶</button><div class="window-controls"><button data-action="minimize" title="Küçült">—</button><button data-action="maximize" title="Büyüt">□</button><button class="close" data-action="close" title="Kapat">×</button></div>`;
    document.documentElement.append(bar);
    bar.querySelector('.drag').addEventListener('mousedown', event => {
      if (event.button === 0) invoke?.('window_start_dragging');
    });
    const chapterMatch = () => location.pathname.match(/^\/manga\/([^/]+)\/bolum-([^/]+)/);
    let appsObserver;
    let appsSyncQueued = false;
    const applyDesktopAppsView = () => {
      const isAppsPage = ['/uygulama', '/apps', '/indir'].includes(location.pathname.replace(/\/$/, ''));
      if (!isAppsPage) {
        appsObserver?.disconnect(); appsObserver = null;
        document.querySelectorAll('[data-mahorapeak-desktop-platform]').forEach(button => {
          button.style.removeProperty('display'); delete button.dataset.mahorapeakDesktopPlatform;
        });
        return;
      }
      for (const button of document.querySelectorAll('button')) {
        if (/windows\s*\(pc\)/i.test(button.textContent || '')) {
          button.dataset.mahorapeakDesktopPlatform = 'windows';
          button.style.setProperty('display', 'none', 'important');
        }
      }
      for (const label of document.querySelectorAll('span')) {
        if (label.textContent.includes('MahoraPeak Resmi Uygulamaları')) {
          label.textContent = 'MahoraPeak Resmi Mobil Uygulamaları • Android & iOS';
        }
      }
      if (!appsObserver && document.body) {
        appsObserver = new MutationObserver(() => {
          if (appsSyncQueued) return;
          appsSyncQueued = true;
          requestAnimationFrame(() => { appsSyncQueued = false; applyDesktopAppsView(); });
        });
        appsObserver.observe(document.body, { childList: true, subtree: true });
      }
    };
    const refresh = () => { bar.classList.toggle('chapter-page', Boolean(chapterMatch())); applyDesktopAppsView(); };
    refresh();
    const notifyRoute = () => { refresh(); };
    for (const method of ['pushState', 'replaceState']) {
      const original = history[method];
      history[method] = function (...args) { const result = original.apply(this, args); notifyRoute(); return result; };
    }
    addEventListener('popstate', notifyRoute);

    const toast = message => {
      const node = document.createElement('div');
      node.textContent = message;
      Object.assign(node.style,{position:'fixed',right:'18px',top:'66px',zIndex:'2147483647',padding:'11px 14px',borderRadius:'10px',background:'#21192c',color:'#fff',border:'1px solid #ffffff24',font:'13px Segoe UI,sans-serif',boxShadow:'0 12px 35px #0008'});
      document.documentElement.append(node); setTimeout(() => node.remove(), 4200);
    };
    const dialog=document.createElement('section');dialog.id='mahorapeak-update-dialog';dialog.hidden=true;
    dialog.dataset.state='checking';
    dialog.innerHTML='<div class="card"><div class="update-mark" aria-hidden="true"></div><div class="eyebrow">MAHORAPEAK DESKTOP · GÜNCELLEME</div><h2 data-update-title>Güncellemeler kontrol ediliyor</h2><p data-update-copy>Yeni sürüm olup olmadığını kontrol ediyoruz…</p><progress data-update-progress hidden max="100" value="0"></progress><div class="actions"><button data-update-retry hidden>Yeniden dene</button><button data-update-install hidden>Güncellemeyi yükle</button><button data-update-close>Kapat</button></div></div>';
    document.documentElement.append(dialog);
    const updateTitle=dialog.querySelector('[data-update-title]'), updateCopy=dialog.querySelector('[data-update-copy]'), updateProgress=dialog.querySelector('[data-update-progress]'), installButton=dialog.querySelector('[data-update-install]');
    const retryButton=dialog.querySelector('[data-update-retry]'), closeButton=dialog.querySelector('[data-update-close]');
    let updateCheckInFlight=false;
    const closeUpdateDialog=()=>{dialog.hidden=true;installButton.disabled=false;retryButton.hidden=true};
    const checkUpdates=async({manual=false}={})=>{
      if(updateCheckInFlight)return;
      updateCheckInFlight=true;
      if(manual){dialog.dataset.state='checking';dialog.hidden=false;updateTitle.textContent='Güncellemeler kontrol ediliyor';updateCopy.textContent='MahoraPeak için en yeni sürümü güvenli bağlantıyla kontrol ediyoruz…';installButton.hidden=true;retryButton.hidden=true;updateProgress.hidden=true;closeButton.textContent='Kapat'}
      try{
        const update=await invoke?.('check_for_updates');
        if(!update){if(manual){dialog.dataset.state='current';updateTitle.textContent='Uygulaman güncel';updateCopy.textContent='Şu anda kullanabileceğin en yeni MahoraPeak Desktop sürümündesin.';closeButton.textContent='Tamam'}return}
        dialog.dataset.state='available';
        updateTitle.textContent=`MahoraPeak ${update.version} hazır`;
        updateCopy.textContent=update.notes?`Yeni sürüm indirilmeye hazır.\n\n${update.notes}`:'Yeni özellikler ve iyileştirmeler seni bekliyor. Güncellemeyi şimdi indirip kurabilirsin.';
        updateProgress.hidden=true;updateProgress.value=0;retryButton.hidden=true;installButton.hidden=false;installButton.disabled=false;closeButton.textContent='Daha sonra';dialog.hidden=false;
        installButton.onclick=async()=>{
          installButton.disabled=true;updateTitle.textContent='Güncelleme indiriliyor';updateCopy.textContent='İndirme tamamlandığında kurulum otomatik olarak başlayacak.';updateProgress.hidden=false;updateProgress.removeAttribute('value');
          try{await invoke?.('install_update')}catch{updateTitle.textContent='Güncelleme tamamlanamadı';updateCopy.textContent='Bağlantını kontrol edip daha sonra yeniden deneyebilirsin.';installButton.disabled=false}
        };
      }catch(error){if(manual){dialog.dataset.state='error';updateTitle.textContent='Kontrol şu an yapılamadı';updateCopy.textContent='Güncelleme sunucusuna ulaşılamadı. İnternet bağlantını kontrol edip tekrar deneyebilirsin.';installButton.hidden=true;retryButton.hidden=false;closeButton.textContent='Kapat'}console.warn('MahoraPeak update check unavailable',error)}
      finally{updateCheckInFlight=false}
    };
    closeButton.onclick=closeUpdateDialog;
    retryButton.onclick=()=>checkUpdates({manual:true});
    window.__TAURI__?.event?.listen?.('mahorapeak-update-progress',event=>{const data=event.payload||{};if(data.total){const value=Math.min(100,Math.round(data.chunk/data.total*100));updateProgress.value=value;updateCopy.textContent=`Güncelleme indiriliyor… ${value}%`}});
    window.__TAURI__?.event?.listen?.('mahorapeak-update-finished',()=>{updateTitle.textContent='Kurulum başlıyor';updateCopy.textContent='Uygulama güncelleme için yeniden açılacak.'});
    bar.addEventListener('click', async event => {
      const action = event.target.closest('button')?.dataset.action;
      if (!action) return;
      if (action === 'back') history.back();
      if (action === 'forward') history.forward();
      if (action === 'reload') location.reload();
      if (action === 'home') await invoke?.('open_home');
      if (action === 'library') await invoke?.('open_offline_library');
      if (action === 'updates') await checkUpdates({manual:true});
      if (action === 'fullscreen') await invoke?.('toggle_fullscreen');
      if (action === 'minimize') await invoke?.('window_minimize');
      if (action === 'maximize') await invoke?.('window_toggle_maximize');
      if (action === 'close') await invoke?.('window_close');
      if (action === 'download') {
        const match = chapterMatch();
        const button = event.target.closest('button');
        try {
          const pages = [...document.querySelectorAll('img[alt^="Page "]')].map(image => image.currentSrc || image.src).filter(Boolean);
          if (!match || !pages.length) throw new Error('Bölüm sayfaları henüz yüklenmedi.');
          button.disabled = true; button.textContent = 'İndiriliyor…';
          const seriesTitle = document.querySelector('h1')?.textContent?.trim() || document.title.split(' - ')[0] || match[1];
          const result = await invoke?.('download_chapter',{payload:{seriesTitle,seriesSlug:match[1],chapterNumber:match[2],pages}});
          toast(result || 'İndirme başlatılamadı.');
        } catch (error) { toast(String(error.message || error)); }
        finally { button.disabled = false; button.textContent = '↓ Bölümü İndir'; }
      }
    });
    setTimeout(()=>checkUpdates(),4500);
    setInterval(()=>checkUpdates(),6*60*60*1000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
})();
