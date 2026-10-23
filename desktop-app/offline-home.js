const api = window.__TAURI__?.core;
const $ = (selector) => document.querySelector(selector);
let checkRunning = false;
let returnedOnline = false;

async function invoke(command) {
  if (!api?.invoke) throw new Error('Masaüstü uygulama bağlantısı kullanılamıyor.');
  return api.invoke(command);
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unit = 0;
  while (bytes >= 1024 && unit < units.length - 1) { bytes /= 1024; unit++; }
  return `${bytes.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

async function refreshLibrarySummary() {
  try {
    const chapters = await invoke('list_offline_chapters');
    const bytes = chapters.reduce((total, chapter) => total + chapter.bytes, 0);
    $('#chapter-total').textContent = `${chapters.length} bölüm indirildi`;
    $('#storage-total').textContent = formatBytes(bytes);
    $('#library-summary').textContent = chapters.length
      ? `${new Set(chapters.map((chapter) => chapter.seriesSlug || chapter.seriesTitle)).size} seride, internet olmadan okunmaya hazır.`
      : 'Henüz indirilen bölüm yok. Bağlantı gelince serilerden bölüm indirebilirsin.';
  } catch {
    $('#chapter-total').textContent = 'Kütüphane şu an açılamadı';
    $('#library-summary').textContent = 'Biraz sonra yeniden deneyebilirsin.';
  }
}

async function checkConnection({ manual = false } = {}) {
  if (checkRunning || returnedOnline) return;
  checkRunning = true;
  const retry = $('#retry');
  const status = $('#retry-status');
  try {
    if (manual) { retry.disabled = true; retry.classList.add('is-checking'); status.textContent = 'MahoraPeak bağlantısı kontrol ediliyor…'; }
    const available = await invoke('check_site_available');
    if (available) {
      returnedOnline = true;
      $('#connection-label').textContent = 'BAĞLANTI GERİ GELDİ';
      status.textContent = 'Site açılıyor…';
      await invoke('open_site');
    } else if (manual) {
      status.textContent = 'Siteye henüz ulaşılamıyor. Biraz sonra tekrar deneyebilirsin.';
    }
  } catch {
    if (manual) status.textContent = 'Bağlantı kontrol edilemedi. Yeniden deneyebilirsin.';
  } finally {
    checkRunning = false;
    retry.disabled = false;
    retry.classList.remove('is-checking');
  }
}

$('#open-library').addEventListener('click', () => invoke('open_offline_library'));
$('#card-library').addEventListener('click', () => invoke('open_offline_library'));
$('#retry').addEventListener('click', () => checkConnection({ manual: true }));
$('#home').addEventListener('click', () => checkConnection({ manual: true }));
document.querySelectorAll('[data-window]').forEach((button) => button.addEventListener('click', () => {
  const command = { minimize: 'window_minimize', maximize: 'window_toggle_maximize', close: 'window_close' }[button.dataset.window];
  invoke(command);
}));
document.querySelector('.offline-topbar')?.addEventListener('mousedown', (event) => {
  if (event.button === 0 && !event.target.closest('button')) invoke('window_start_dragging');
});

refreshLibrarySummary();
checkConnection();
window.addEventListener('online', () => checkConnection());
window.setInterval(() => { refreshLibrarySummary(); checkConnection(); }, 15000);
