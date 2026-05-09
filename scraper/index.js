import { getSeriesLinks, getSeriesDetails, getChapterPages } from './src/scraper.js';
import { getOrCreateSeries, createChapterIfNotExists, supabase } from './src/db.js';
import { processAndUploadImage } from './utils/imageProcessor.js';
import logger from './utils/logger.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runScraper() {
  logger.info("==========================================");
  logger.info("🚀 AniPeak: Profesyonel Scraper V3 Başladı");
  logger.info("==========================================");

  try {
    logger.info("[Bot] Seri linkleri taranıyor...");
    let seriesUrls = [];
    
    const urlFilePath = path.resolve('scraper', 'urls.txt');
    if (fs.existsSync(urlFilePath)) {
      logger.info("[Bot] urls.txt bulundu, sadece bu linkler işlenecek.");
      seriesUrls = fs.readFileSync(urlFilePath, 'utf-8').split('\n').filter(l => l.trim().startsWith('http'));
    } else {
      seriesUrls = await getSeriesLinks();
    }
    
    logger.info(`[Bot] Toplam ${seriesUrls.length} potansiyel seri linki bulundu.`);

    for (const [sIdx, seriesUrl] of seriesUrls.entries()) {
      try {
        logger.info(`\n[Bot] İşleniyor (${sIdx + 1}/${seriesUrls.length}): ${seriesUrl}`);
        
        const sData = await getSeriesDetails(seriesUrl);
        if (!sData || !sData.title) {
          logger.warn(`[Kritik Hata] Detaylar çekilemedi, atlanıyor: ${seriesUrl}`);
          continue;
        }

        if (!sData.cover) {
           logger.warn(`[Kapak Koruması] Kapak resmi bulunamadı, seri reddedildi: ${sData.title}`);
           continue; 
        }

        logger.info(`[Bot] Seri: ${sData.title} | Durum: ${sData.status} | Tür: ${sData.genre.join(', ')}`);
        logger.info(`[Bot] Kapak İşleniyor ve Yükleniyor...`);
        
        let finalCoverUrl = '';
        try {
          finalCoverUrl = await processAndUploadImage(sData.cover, true, sData.title, 0, 0);
          logger.info(`[Bot] Kapak başarıyla yüklendi: ${finalCoverUrl}`);
        } catch (coverErr) {
          logger.error(`[Bot] Kapak yüklenemediği için seri durduruldu: ${sData.title} | Hata: ${coverErr.message}`);
          continue; 
        }

        let seriesId;
        try {
           seriesId = await getOrCreateSeries(sData.title, finalCoverUrl, sData.description, sData.genre, sData.status);
           logger.info(`[DB] Seri entegre edildi (ID: ${seriesId})`);
        } catch (err) {
           logger.error(`[DB] Seri oluşturma hatası (${sData.title}): ${err.message}`);
           continue; 
        }

        if (sData.chapters && sData.chapters.length > 0) {
          const sortedChapters = sData.chapters.sort((a, b) => a.number - b.number);
          logger.info(`[Bot] Toplam ${sortedChapters.length} bölüm sıralı olarak işlenecek.`);

          for (const [cIdx, chapter] of sortedChapters.entries()) {
            try {
               const { data: existing } = await supabase
                  .from('chapters')
                  .select('id')
                  .eq('series_id', seriesId)
                  .eq('number', chapter.number)
                  .limit(1)
                  .single();

               if (existing) {
                 logger.info(`[Atlandı] ${sData.title} - Bölüm ${chapter.number} zaten mevcut.`);
                 continue;
               }

               logger.info(`[Bot] > Bölüm ${chapter.number} indiriliyor... (${cIdx + 1}/${sortedChapters.length})`);
               const rawPages = await getChapterPages(chapter.href);
               
               if (rawPages.length === 0) {
                 logger.warn(`[Hata] Bölüm ${chapter.number} için sayfa bulunamadı, atlanıyor.`);
                 continue;
               }

               logger.info(`[Bot] > ${rawPages.length} HD sayfa işleniyor...`);
               const processedPages = [];
               
               for (const [pIdx, pageUrl] of rawPages.entries()) {
                  const cleanUrl = await processAndUploadImage(pageUrl, false, sData.title, chapter.number, pIdx + 1);
                  if (cleanUrl) processedPages.push(cleanUrl);
               }

               if (processedPages.length > 0) {
                 await createChapterIfNotExists(seriesId, chapter.number, chapter.title, processedPages);
                 logger.info(`[BAŞARILI] ==> ${sData.title} - Bölüm ${chapter.number} yüklendi!`);
               }
               
               await delay(500); 

            } catch (chErr) {
               logger.error(`[Bölüm Hatası] Bölüm ${chapter.number} işlenirken hata oluştu: ${chErr.message}`);
            }
          }
        }
        
        logger.info(`[BAŞARI] ${sData.title} serisinin tüm işlemleri tamamlandı.`);
        await delay(3000); // Seri bazlı bekleme

      } catch (seriesErr) {
        logger.error(`[Seri Hatası] ${seriesUrl} işlenirken kritik hata: ${seriesErr.message}`);
      }
    }

    logger.info("\n[Scraper V3] TÜM İŞLEMLER BAŞARIYLA TAMAMLANDI!");
  } catch (err) {
    logger.error(`[Sistem Hatası] Scraper ana döngüsü patladı: ${err.message}`);
  }
}

runScraper();
