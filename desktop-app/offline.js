const api = window.__TAURI__?.core;
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const chapterOrder = new Intl.Collator('tr', { numeric: true, sensitivity: 'base' });
let allChapters = [];
let activeSeriesKey = null;

function toast(message) {
  const node = document.createElement('div');
  node.className = 'toast'; node.textContent = message; document.body.append(node);
  setTimeout(() => node.remove(), 3500);
}

async function invoke(command, args) {
  if (!api) throw new Error('Uygulama bağlantısı kullanılamıyor.');
  return api.invoke(command, args);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB']; let index = -1;
  do { bytes /= 1024; index++; } while (bytes >= 1024 && index < units.length - 1);
  return `${bytes.toFixed(1)} ${units[index]}`;
}

function getSeriesKey(chapter) { return chapter.seriesSlug || chapter.seriesTitle; }

function groupChapters(chapters = allChapters) {
  const groups = new Map();
  for (const chapter of chapters) {
    const key = getSeriesKey(chapter);
    const series = groups.get(key) || { key, title: chapter.seriesTitle, chapters: [], bytes: 0, pages: 0 };
    series.chapters.push(chapter); series.bytes += chapter.bytes; series.pages += chapter.pages; groups.set(key, series);
  }
  return [...groups.values()].map(series => ({
    ...series,
    chapters: series.chapters.sort((a, b) => chapterOrder.compare(a.chapterNumber, b.chapterNumber)),
  })).sort((a, b) => chapterOrder.compare(a.title, b.title));
}

function chapterMatchesSearch(chapter, query) {
  const needle = query.trim().toLocaleLowerCase('tr');
  return !needle || `${chapter.seriesTitle} ${chapter.seriesSlug} ${chapter.chapterNumber}`.toLocaleLowerCase('tr').includes(needle);
}

function initials(title) {
  return title.trim().split(/\s+/).slice(0, 2).map(word => word[0] || '').join('').toLocaleUpperCase('tr') || 'MP';
}

function setCollectionMode(showCollection) {
  $('#page-heading').hidden = !showCollection;
  $('.library-toolbar').hidden = !showCollection;
  $('#chapter-list').hidden = !showCollection;
  if (!showCollection) $('#empty-state').hidden = true;
  $('#series-view').hidden = showCollection;
}

function makeChapterRow(chapter) {
  const row = document.createElement('article'); row.className = 'chapter-row';
  row.innerHTML = `<div class="chapter-index">${esc(chapter.chapterNumber)}</div><div class="chapter-row-info"><strong>Bölüm ${esc(chapter.chapterNumber)}</strong><span>${chapter.pages} sayfa · ${formatBytes(chapter.bytes)} · ${new Date(chapter.downloadedAt).toLocaleDateString('tr-TR')}</span></div><button class="read-button" type="button">Oku</button><button class="delete-button" type="button" title="Bölümü sil" aria-label="Bölüm ${esc(chapter.chapterNumber)} sil">Sil</button>`;
  row.querySelector('.read-button').onclick = () => openChapter(chapter);
  row.querySelector('.delete-button').onclick = async () => {
    if (!confirm(`${chapter.seriesTitle} · Bölüm ${chapter.chapterNumber} indirilenlerden silinsin mi?`)) return;
    try { await invoke('delete_offline_chapter', { id: chapter.id }); await load(); }
    catch (error) { toast(String(error.message || error)); }
  };
  return row;
}

function openSeries(key) {
  activeSeriesKey = key;
  const series = groupChapters().find(item => item.key === key);
  if (!series) return;
  $('#series-title').textContent = series.title;
  $('#series-summary').textContent = `Bu serinin ${series.chapters.length} bölümü bu cihazda çevrimdışı okumaya hazır.`;
  $('#series-monogram').textContent = initials(series.title);
  $('#series-chapter-total').textContent = String(series.chapters.length);
  $('#series-page-total').textContent = series.pages.toLocaleString('tr-TR');
  $('#series-size-total').textContent = formatBytes(series.bytes);
  $('#series-chapters').replaceChildren(...series.chapters.map(makeChapterRow));
  $('#series-resume').onclick = () => openChapter(series.chapters.at(-1));
  setCollectionMode(false);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderLibrary() {
  const search = $('#series-search').value;
  const seriesList = groupChapters().map(series => ({
    ...series,
    chapters: series.chapters.filter(chapter => chapterMatchesSearch(chapter, search)),
  })).filter(series => series.chapters.length);

  const list = $('#chapter-list'); list.replaceChildren();
  $('#series-count').textContent = `${seriesList.length} seri · ${seriesList.reduce((sum, series) => sum + series.chapters.length, 0)} bölüm`;
  $('#storage').textContent = formatBytes(allChapters.reduce((sum, chapter) => sum + chapter.bytes, 0));

  for (const series of seriesList) {
    const first = series.chapters[0]; const last = series.chapters.at(-1);
    const card = document.createElement('button'); card.type = 'button'; card.className = 'series-card';
    card.setAttribute('aria-label', `${series.title}, ${series.chapters.length} indirilen bölüm`);
    card.innerHTML = `<span class="series-card-poster"><span>MAHORAPEAK<br>OFFLINE ARCHIVE</span><strong>${esc(initials(series.title))}</strong><i></i></span><span class="series-card-info"><span class="series-card-label">SERİ KÜTÜPHANESİ</span><strong class="series-card-title">${esc(series.title)}</strong><span class="series-card-meta">${series.chapters.length} indirilen bölüm · ${formatBytes(series.bytes)}</span><span class="series-card-latest">Bölüm ${esc(last.chapterNumber)} hazır</span></span><span class="series-card-range">${esc(first.chapterNumber)} — ${esc(last.chapterNumber)} <b>›</b></span>`;
    card.onclick = () => openSeries(series.key);
    list.append(card);
  }

  const empty = $('#empty-state');
  empty.hidden = seriesList.length > 0;
  if (!allChapters.length) {
    empty.querySelector('h2').textContent = 'Henüz indirdiğin bölüm yok';
    empty.querySelector('p').innerHTML = 'Seri sayfasında bir bölüm açıp uygulama çubuğundaki <b>Bölümü İndir</b> düğmesine bas.';
  } else {
    empty.querySelector('h2').textContent = 'Eşleşen seri bulunamadı';
    empty.querySelector('p').textContent = 'Arama kelimeni değiştirip yeniden deneyebilirsin.';
  }

  if (activeSeriesKey) {
    if (groupChapters().some(series => series.key === activeSeriesKey)) openSeries(activeSeriesKey);
    else { activeSeriesKey = null; setCollectionMode(true); renderLibrary(); }
  } else setCollectionMode(true);
}

async function load() {
  try { allChapters = await invoke('list_offline_chapters'); renderLibrary(); }
  catch (error) { $('#notice').hidden = false; $('#notice').textContent = String(error); $('#series-count').textContent = 'Kütüphane açılamadı'; }
}

async function openChapter(chapter) {
  try {
    const data = await invoke('read_offline_chapter', { id: chapter.id });
    $('#reader-series').textContent = data.seriesTitle;
    $('#reader-chapter').textContent = `Bölüm ${data.chapterNumber}`;
    $('#reader-count').textContent = `${data.pages.length} sayfa`;
    const box = $('#reader-pages'); box.replaceChildren();
    for (const [index, src] of data.pages.entries()) {
      const frame = document.createElement('figure'); frame.className = 'reader-page';
      const image = document.createElement('img');
      image.loading = index < 2 ? 'eager' : 'lazy'; image.decoding = 'async'; image.src = src;
      image.alt = `${data.seriesTitle} · Bölüm ${data.chapterNumber} · Sayfa ${index + 1}`;
      image.onerror = () => {
        frame.classList.add('page-error');
        frame.innerHTML = `<div><strong>Sayfa ${index + 1} açılamadı</strong><span>Bu görsel yerel kütüphanede bulunamadı.</span></div>`;
      };
      const label = document.createElement('figcaption'); label.textContent = String(index + 1).padStart(2, '0');
      frame.append(image, label); box.append(frame);
    }
    $('#reader').hidden = false; document.body.style.overflow = 'hidden'; $('#reader').scrollTop = 0;
  } catch (error) { toast(String(error.message || error)); }
}

$('#series-search').addEventListener('input', renderLibrary);
$('#series-back').onclick = () => { activeSeriesKey = null; setCollectionMode(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
$('#close-reader').onclick = () => { $('#reader').hidden = true; document.body.style.overflow = ''; };
$('#home').onclick = () => invoke('open_site');
$('#browse').onclick = () => invoke('open_site');
$('#back').onclick = () => history.back();
document.querySelectorAll('[data-window]').forEach(button => button.addEventListener('click', () => invoke(({ minimize: 'window_minimize', maximize: 'window_toggle_maximize', close: 'window_close' })[button.dataset.window])));
document.querySelector('.topbar')?.addEventListener('mousedown', event => { if (event.button === 0 && !event.target.closest('button,a')) invoke('window_start_dragging'); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#reader').hidden) $('#close-reader').click(); else if (event.key === 'Escape' && activeSeriesKey) $('#series-back').click(); });
load();
