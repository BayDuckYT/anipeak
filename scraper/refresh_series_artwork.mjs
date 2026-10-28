import 'dotenv/config';
import axios from 'axios';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(ROOT, '.env');
// dotenv/config above reads cwd; explicitly load scraper-local secrets when invoked from the repo root.
const dotenv = await import('dotenv');
dotenv.config({ path: ENV_PATH, override: false });
const APPLY = process.argv.includes('--apply');
const ONLY_UNMATCHED = process.argv.includes('--only-unmatched');
const FALLBACK_EXISTING = process.argv.includes('--fallback-existing');
const MIN_SCORE = Number(process.env.ARTWORK_MIN_MATCH_SCORE || 0.88);
const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
const PUBLIC = (process.env.R2_PUBLIC_URL || 'https://pub-56389f4fc14f4af4b80a25136a28126e.r2.dev').replace(/\/$/, '');
const endpoint = process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '');
if (!SUPABASE_URL || !KEY) throw new Error('scraper/.env içinde SUPABASE_URL ve SUPABASE_SERVICE_KEY gerekli.');
if (APPLY && (!endpoint || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !BUCKET)) throw new Error('R2 upload yapılandırması eksik.');
const supabase = createClient(SUPABASE_URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const store = APPLY ? new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } }) : null;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const APPROVED_ALIASES = new Map(Object.entries({
  'The God Slaying Demon King': 'The God-Slaying Demon King: Reincarnated as a Mere Mortal to Become the Strongest in History!',
  'The Heavenly Demon Can’t Live a Normal Life': 'Descended from Divinity',
  'Heroes & Demons & Villains': 'The Hero, the Demon, and the Villain',
  'Beware of the Brothers!': 'Harley Takes the House',
  'The Husky And His White Cat Shizun': 'Erha He Tade Baimao Shizun',
  'Demon Lord’s Martial Arts Ascension': 'The Demon King Levels Up',
  'Star Martial God Technique': 'Astral Sutra',
  'Standard of Reincarnation': 'The Art of Reincarnation',
  'Coffee thief': 'Coffee Doduk',
  'Beware of the Villainess!': 'Beware the Villainess!',
  'July Found by Chance': 'July That I Randomly Discovered',
  'Infinite Apostles And Twelve War Girls': 'The Limitless Apostle and the Twelve Battle Maidens',
  'I want to be you just for a day': 'Your Throne',
  'The Husky And His White Cat Shizun': 'Erha He Tade Baimao Shizun',
  'I Reincarnated As The Crazed Heir': 'Reincarnated as an Unruly Heir',
  'Revenge of the Iron-Blooded Sword Hound': 'Revenge of the Baskerville Bloodhound',
  'Reincarnation of the Suicidal Battle God': 'Doom Breaker',
  'I Reincarnated as an SSS-Ranked Goblin': 'Tensei Shitara SSS-Kyuu Goblin ni Narimashita',
  'Tale of a Scribe Who Retires to the Countryside': 'Nakyangmunsajeon',
  'Kekkon Yubiwa Monogatari': 'Tales of Wedding Rings',
  'My School Life Pretending To Be a Worthless Person': 'My F-Rank High School Life',
  'Just Twilight': 'The Dawn to Come'
}));
const normalize = (s) => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
function similarity(a, b) {
  const x = normalize(a), y = normalize(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const wordsX = new Set(x.split(' ')), wordsY = new Set(y.split(' '));
  const overlap = [...wordsX].filter((w) => wordsY.has(w)).length;
  const tokenScore = (2 * overlap) / (wordsX.size + wordsY.size);
  const grams = (v) => new Set(Array.from({ length: Math.max(0, v.length - 1) }, (_, i) => v.slice(i, i + 2)));
  const gx = grams(x), gy = grams(y), common = [...gx].filter((g) => gy.has(g)).length;
  const dice = (2 * common) / Math.max(1, gx.size + gy.size);
  return Math.max(tokenScore, dice);
}
async function queryAniList(title) {
  const query = `query($q:String!){Page(page:1,perPage:10){media(search:$q,type:MANGA){id title{romaji english native} synonyms coverImage{extraLarge large medium} bannerImage siteUrl}}}`;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const res = await axios.post('https://graphql.anilist.co', { query, variables: { q: title } }, { timeout: 18000, headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
      const candidates = res.data?.data?.Page?.media || [];
      const ranked = candidates.map((m) => {
        const titles = [m.title?.english, m.title?.romaji, m.title?.native, ...(m.synonyms || [])].filter(Boolean);
        const canonicalTitles = [m.title?.english, m.title?.romaji, m.title?.native].filter(Boolean);
        const directCanonical = canonicalTitles.some((t) => normalize(t) === normalize(title));
        const approvedCanonical = APPROVED_ALIASES.get(title);
        const approvedAlias = Boolean(approvedCanonical && canonicalTitles.some((t) => normalize(t) === normalize(approvedCanonical)));
        return { m, directCanonical, approvedAlias, score: Math.max(0, ...titles.map((t) => similarity(title, t))), matched: titles.sort((a, b) => similarity(title, b) - similarity(title, a))[0] || '' };
      }).sort((a, b) => (Number(b.directCanonical) - Number(a.directCanonical)) || (Number(b.approvedAlias) - Number(a.approvedAlias)) || (b.score - a.score));
      const best = ranked[0], second = ranked[1];
      if (!best || (!best.directCanonical && !best.approvedAlias && best.score < MIN_SCORE) || (second && !best.directCanonical && !best.approvedAlias && best.score - second.score < 0.035 && best.score < 0.96)) return null;
      const contentWords = normalize(title).split(' ').filter((word) => !['the', 'a', 'an', 'of', 'and', 'to', 'in'].includes(word));
      const canonicalTitles = [best.m.title?.english, best.m.title?.romaji, best.m.title?.native].filter(Boolean);
      // A synonym match can point to a spin-off or an unrelated work (e.g. a parent title matching
      // a subtitle). Only replace artwork when a canonical title matches the catalog title itself.
      const directMatch = best.directCanonical;
      if (!directMatch && !best.approvedAlias) return null;
      if (contentWords.length < 1) return null;
      const image = best.m.coverImage?.extraLarge || best.m.coverImage?.large || best.m.coverImage?.medium;
      if (!image || !/^https:\/\/s\d+\.anilist\.co\//i.test(image)) return null;
      const banner = /^https:\/\/s\d+\.anilist\.co\//i.test(best.m.bannerImage || '') ? best.m.bannerImage : null;
      return { id: best.m.id, title: best.m.title?.english || best.m.title?.romaji || best.m.title?.native || best.m.synonyms?.[0] || '', matched: best.matched, score: Number(best.score.toFixed(3)), cover: image, banner, siteUrl: best.m.siteUrl };
    } catch (error) {
      if (error.response?.status === 429 || error.response?.status >= 500) { await sleep(1200 * (attempt + 1)); continue; }
      console.warn(`AniList eşleşmesi alınamadı: ${title} (${error.response?.status || error.message})`);
      return null;
    }
  }
  return null;
}
async function fetchImage(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 25000, maxContentLength: 35 * 1024 * 1024, headers: { 'User-Agent': 'MahoraPeak Artwork Refresh/1.0' } });
  const buffer = Buffer.from(response.data);
  const meta = await sharp(buffer, { limitInputPixels: 100_000_000 }).metadata();
  if (!meta.width || !meta.height || !meta.format) throw new Error('Kaynak görsel çözümlenemedi.');
  return { buffer, width: meta.width, height: meta.height };
}
async function outputCover(source) {
  // 4K-tall portrait output. If the source is smaller, this is an upscale and cannot restore detail.
  return sharp(source, { limitInputPixels: 100_000_000 }).rotate().resize(2560, 3840, { fit: 'cover', position: 'attention', kernel: 'lanczos3' }).webp({ quality: 90, effort: 6 }).toBuffer();
}
async function outputHero(banner, cover) {
  if (banner) {
    const { buffer, width, height } = banner;
    if (width / height >= 1.35) {
      const background = await sharp(cover, { limitInputPixels: 100_000_000 }).rotate().resize(3840, 2160, { fit: 'cover', position: 'attention' }).blur(36).modulate({ brightness: 0.48, saturation: 0.8 }).png().toBuffer();
      const foreground = await sharp(buffer, { limitInputPixels: 100_000_000 }).rotate().resize(3840, 2160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      return sharp(background).composite([{ input: foreground }]).webp({ quality: 90, effort: 6 }).toBuffer();
    }
  }
  // Use series-matched cover artwork as a subdued, blurred 4K fallback where AniList has no banner.
  return sharp(cover, { limitInputPixels: 100_000_000 }).rotate().resize(3840, 2160, { fit: 'cover', position: 'attention', kernel: 'lanczos3' }).blur(38).modulate({ brightness: 0.5, saturation: 0.8 }).webp({ quality: 88, effort: 6 }).toBuffer();
}
function safePart(title) { const base = normalize(title).replace(/\s+/g, '_').slice(0, 52) || 'series'; return `${base}_${createHash('sha1').update(title).digest('hex').slice(0, 8)}`; }
async function put(key, body) { await store.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: 'image/webp', CacheControl: 'public, max-age=31536000, immutable' })); return `${PUBLIC}/${key.split('/').map(encodeURIComponent).join('/')}`; }

const { data: rows, error } = await supabase.from('series').select('id,title,cover,hero_bg').order('id');
if (error) throw new Error(`Seri kayıtları alınamadı: ${error.message}`);
let priorReport = null;
if (ONLY_UNMATCHED) {
  try { priorReport = JSON.parse(await fs.readFile(path.join(ROOT, 'artwork-refresh-report.json'), 'utf8')); }
  catch { throw new Error('--only-unmatched için önceki artwork-refresh-report.json gerekli.'); }
}
const priorRows = new Map((priorReport?.rows || []).map((row) => [row.id, row]));
const plan = [];
for (let i = 0; i < rows.length; i += 1) {
  const series = rows[i];
  const previous = priorRows.get(series.id);
  if (ONLY_UNMATCHED && ['updated', 'updated-fallback'].includes(previous?.status)) { plan.push(previous); console.log(`[${i + 1}/${rows.length}] ZATEN GÜNCEL — ${series.title}`); continue; }
  const match = await queryAniList(series.title);
  if (!match) {
    if (FALLBACK_EXISTING && series.cover) {
      try {
        const source = await fetchImage(series.cover);
        const coverBuffer = await outputCover(source.buffer);
        const heroBuffer = await outputHero(null, source.buffer);
        const coverHash = createHash('sha256').update(coverBuffer).digest('hex').slice(0, 14);
        const heroHash = createHash('sha256').update(heroBuffer).digest('hex').slice(0, 14);
        const root = `manga/${safePart(series.title)}`;
        const coverKey = `${root}/cover-uhd-${coverHash}.webp`;
        const heroKey = `${root}/hero-4k-${heroHash}.webp`;
        const item = { id: series.id, title: series.title, oldCover: series.cover, oldHero: series.hero_bg, status: APPLY ? 'pending-fallback' : 'preview-fallback', match: null, sourceCoverSize: `${source.width}x${source.height}`, sourceBannerSize: null, heroMethod: 'blurred-existing-cover', upscaledExistingArtwork: true, outputCoverSize: '2560x3840', outputHeroSize: '3840x2160', coverKey, heroKey };
        if (APPLY) {
          const [coverUrl, heroUrl] = await Promise.all([put(coverKey, coverBuffer), put(heroKey, heroBuffer)]);
          const { error: updateError } = await supabase.from('series').update({ cover: coverUrl, hero_bg: heroUrl }).eq('id', series.id);
          if (updateError) throw updateError;
          item.status = 'updated-fallback'; item.coverUrl = coverUrl; item.heroUrl = heroUrl;
        }
        plan.push(item);
        console.log(`[${i + 1}/${rows.length}] MEVCUT KAPAK YÜKSELTİLDİ — ${series.title}; kaynak ${item.sourceCoverSize}`);
        await sleep(720);
        continue;
      } catch (fallbackError) {
        console.warn(`[${i + 1}/${rows.length}] MEVCUT KAPAK YEDEĞİ HATASI — ${series.title}: ${fallbackError.message}`);
      }
    }
    plan.push({ id: series.id, title: series.title, status: 'unmatched', oldCover: series.cover, oldHero: series.hero_bg });
    console.log(`[${i + 1}/${rows.length}] EŞLEŞME YOK — ${series.title}`);
    await sleep(720);
    continue;
  }
  try {
    const coverSource = await fetchImage(match.cover);
    const bannerSource = match.banner ? await fetchImage(match.banner).catch(() => null) : null;
    const coverBuffer = await outputCover(coverSource.buffer);
    const heroBuffer = await outputHero(bannerSource, coverSource.buffer);
    const coverHash = createHash('sha256').update(coverBuffer).digest('hex').slice(0, 14);
    const heroHash = createHash('sha256').update(heroBuffer).digest('hex').slice(0, 14);
    const root = `manga/${safePart(series.title)}`;
    const coverKey = `${root}/cover-uhd-${coverHash}.webp`;
    const heroKey = `${root}/hero-4k-${heroHash}.webp`;
    const item = { id: series.id, title: series.title, oldCover: series.cover, oldHero: series.hero_bg, status: APPLY ? 'pending' : 'preview', match, sourceCoverSize: `${coverSource.width}x${coverSource.height}`, sourceBannerSize: bannerSource ? `${bannerSource.width}x${bannerSource.height}` : null, heroMethod: bannerSource ? 'full-banner-on-matched-blur' : 'blurred-matched-cover', outputCoverSize: '2560x3840', outputHeroSize: '3840x2160', coverKey, heroKey };
    if (APPLY) {
      const [coverUrl, heroUrl] = await Promise.all([put(coverKey, coverBuffer), put(heroKey, heroBuffer)]);
      const { error: updateError } = await supabase.from('series').update({ cover: coverUrl, hero_bg: heroUrl }).eq('id', series.id);
      if (updateError) throw updateError;
      item.status = 'updated'; item.coverUrl = coverUrl; item.heroUrl = heroUrl;
    }
    plan.push(item);
    console.log(`[${i + 1}/${rows.length}] ${APPLY ? 'GÜNCELLENDİ' : 'ÖNİZLEME'} — ${series.title} ⇢ ${match.title} (${match.score}); kaynak kapak ${item.sourceCoverSize}; banner ${item.sourceBannerSize || 'yok, bulanık kapak yedeği'}`);
  } catch (error) {
    plan.push({ id: series.id, title: series.title, status: 'failed', reason: error.message });
    console.error(`[${i + 1}/${rows.length}] HATA — ${series.title}: ${error.message}`);
  }
  await sleep(720);
}
const report = path.join(ROOT, APPLY ? 'artwork-refresh-report.json' : 'artwork-refresh-preview.json');
await fs.writeFile(report, JSON.stringify({ createdAt: new Date().toISOString(), apply: APPLY, total: rows.length, matched: plan.filter((x) => ['preview', 'updated'].includes(x.status)).length, fallbackUpdated: plan.filter((x) => ['preview-fallback', 'updated-fallback'].includes(x.status)).length, unmatched: plan.filter((x) => x.status === 'unmatched').length, failed: plan.filter((x) => x.status === 'failed').length, rows: plan }, null, 2));
console.log(`Bitti: ${plan.filter((x) => ['updated', 'updated-fallback'].includes(x.status)).length} seri güncellendi (${plan.filter((x) => x.status === 'updated-fallback').length} mevcut kapak yükseltmesi); ${plan.filter((x) => x.status === 'unmatched').length} kapaksız/eşleşmesiz; rapor ${report}`);
