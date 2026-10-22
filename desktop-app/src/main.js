import './style.css';
import './frame.css';
import { invoke } from '@tauri-apps/api/core';

const bytes = value => {
  if (!value) return 'İnternetsiz okumaya hazır';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value, unit = 0;
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit += 1; }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]} bu cihazda`;
};

async function refreshLibrary() {
  try {
    const chapters = await invoke('list_offline_chapters');
    const total = chapters.reduce((sum, chapter) => sum + chapter.bytes, 0);
    document.querySelector('#nav-count').textContent = chapters.length;
    document.querySelector('#download-count').textContent = `${chapters.length} bölüm indirildi`;
    document.querySelector('#download-storage').textContent = bytes(total);
    document.querySelector('#storage-fill').style.width = `${Math.min(100, 10 + chapters.length * 12)}%`;
  } catch {
    document.querySelector('#download-storage').textContent = 'Kütüphane bilgisi alınamadı';
  }
}

async function handleAction(action) {
  if (action === 'site') await invoke('open_site');
  if (action === 'home') await invoke('open_home');
  if (action === 'library') await invoke('open_offline_library');
  if (action === 'fullscreen') await invoke('toggle_fullscreen');
  if (action === 'back') history.back();
  if (action === 'forward') history.forward();
  if (action === 'reload') location.reload();
  if (action === 'minimize') await invoke('window_minimize');
  if (action === 'maximize') await invoke('window_toggle_maximize');
  if (action === 'close') await invoke('window_close');
}

document.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action) handleAction(action).catch(console.error);
});

refreshLibrary();
