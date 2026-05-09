import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';

const BASE_URL = 'https://paradoxscans.com/seri/';

/**
 * Parses the main series page to get links to mangas.
 */
export async function getSeriesLinks() {
  try {
    const { data } = await axios.get(BASE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    
    const seriesLinks = new Set();
    $('a[href^="https://paradoxscans.com/seri/"]').each((_, el) => {
      let url = $(el).attr('href');
      if (
        url && 
        url !== BASE_URL && 
        !url.includes('/page/') && 
        !url.includes('#') && 
        !url.endsWith('/bolum-') 
      ) {
         if (!url.includes('/bolum-') && !url.includes('-bolum/')) {
           seriesLinks.add(url);
         }
      }
    });
    return Array.from(seriesLinks);
  } catch (error) {
    logger.error("[Scraper] Hata (getSeriesLinks): %s", error.message);
    return [];
  }
}

/**
 * Detailed scrape for a single series. Gets title, cover, desc, genre, status and chapter list.
 */
export async function getSeriesDetails(seriesUrl) {
  try {
    const { data } = await axios.get(seriesUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);

    // SEO Uyumlu İsimlendirme: 'X Oku' gibi ekleri temizle
    let rawTitle = $('h1').first().text().trim();
    let title = rawTitle
      .replace(/ Oku$/i, '')
      .replace(/ Türkçe$/i, '')
      .replace(/ Manga$/i, '')
      .replace(/ Webtoon$/i, '')
      .trim();

    // Alternatif/Orijinal İsim Arama (Solo Leveling, Jujutsu Kaisen vb. için)
    $('.alter b, .alternative b, .other-name b').parent().each((_, el) => {
        let altText = $(el).text().replace(/Alternatif İsimler:|Diğer İsimler:|Alternative Titles:/i, '').trim();
        if (altText && altText.length > 2) {
            // Eğer alternatif isim çok kısa değilse ve İngilizce karakterler içeriyorsa öncelik ver
            if (/^[a-zA-Z0-9\s:-]+$/.test(altText)) {
                logger.info(`[Scraper] Orijinal isim bulundu: ${altText} (Eski: ${title})`);
                title = altText;
            }
        }
    });
                
    let cover = '';
    $('img').each((_, el) => {
      if (cover) return;
      let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('data-litespeed-src');
      let classAttr = $(el).attr('class') || '';
      if (src && (classAttr.includes('wp-post-image') || classAttr.includes('ts-post-image') || src.includes('/uploads/'))) {
        if (!src.includes('data:image') && !src.includes('avatar')) {
          cover = src.trim();
        }
      }
    });
                
    let description = $('.entry-content p').text().trim() || $('.summary__content').text().trim() || $('p').first().text().trim();
    
    // Status (Devam Ediyor / Tamamlandı)
    let statusText = $('.tsinfo .imptdt').text().toLowerCase() || $('.post-content').text().toLowerCase() || '';
    let status = 'Devam Ediyor';
    if (statusText.includes('tamamlandı') || statusText.includes('completed') || statusText.includes('finish')) {
      status = 'Tamamlandı';
    }

    // Genres (Tür)
    let genre = [];
    $('.mgen a, .genres-content a, .genxed a').each((_, el) => {
      genre.push($(el).text().trim());
    });
    if (genre.length === 0) genre = ['Aksiyon']; 
                      
    const chapters = [];
    const $chapters = $('#chapterlist a, .cl_list a, a');

    $chapters.each((_, el) => {
      const href = $(el).attr('href');
      let rawText = $(el).text().trim();
      
      if (href && (href.includes('bolum-') || href.includes('-chapter-')) && !href.includes('#comment')) {
        let numMatch = href.match(/bolum-(\d+(\.\d+)?)/) || rawText.match(/(\d+(\.\d+)?)/);
        let number = numMatch ? parseFloat(numMatch[1]) : 0;
        
        if (number > 0) {
          if (!chapters.find(c => c.number === number)) {
            // SEO Uyumlu İsimlendirme (Temiz başlık: Seri Adı - Bölüm X)
            chapters.push({ 
              href: href.trim(), 
              title: `${title} - Bölüm ${number}`, 
              number 
            });
          }
        }
      }
    });

    return {
      title,
      cover,
      description,
      genre,     
      status,    
      chapters
    };
  } catch (error) {
    logger.error(`[Scraper] Hata detay çekilemedi (${seriesUrl}): %s`, error.message);
    return null;
  }
}

/**
 * Fetch a chapter page and extract the reading image URLs.
 */
export async function getChapterPages(chapterUrl) {
  try {
    const { data } = await axios.get(chapterUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    let images = [];
    
    const regex = /https:\/\/[^"'\\]+\/(init-manga|manga_|wp-content\/uploads\/)[^"'\\]+\.(jpg|jpeg|png|webp)/gi;
    let matches = data.match(regex);
    
    if (matches && matches.length > 0) {
       images = Array.from(new Set(matches));
    } else {
       const $ = cheerio.load(data);
       $('#readerarea img').each((_, img) => {
         let src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy-src') || $(img).attr('data-litespeed-src');
         if (src && !src.includes('data:image') && !src.includes('avatar') && !src.includes('logo')) {
            images.push(src.trim());
         }
       });
       
       if (images.length === 0) {
          $('img').each((_, img) => {
             let src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy-src');
             let classAttr = $(img).attr('class') || '';
             if (src && (classAttr.includes('wp-manga-chapter-img') || src.includes('uploads'))) {
                images.push(src.trim());
             }
          });
       }
       
       images = images.filter(u => !u.includes('-32x32') && !u.includes('-180x180'));
       images = Array.from(new Set(images));
    }
    
    return images;
  } catch (error) {
    logger.error(`[Scraper] Sayfalar çekilemedi (${chapterUrl}): %s`, error.message);
    return [];
  }
}
