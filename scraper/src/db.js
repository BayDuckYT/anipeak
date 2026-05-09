import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

if (fs.existsSync(path.resolve('scraper', '.env'))) {
  dotenv.config({ path: path.resolve('scraper', '.env') });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Service Role Key (Botun RLS bypass etmesi için)

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Checks if a series exists by title, creates it if not.
 * @returns {number|string} series ID
 */
export async function getOrCreateSeries(title, cover, description, genre = ['Aksiyon'], status = 'Devam Ediyor') {
  const { data: existing, error: searchError } = await supabase
    .from('series')
    .select('id, title, cover')
    .ilike('title', title.trim())
    .limit(1)
    .single();

  if (existing) {
    // Seri varsa ama kapağı eksikse veya güncellenmesi gerekiyorsa burada yapılabilir
    if (!existing.cover && cover) {
      await supabase.from('series').update({ cover }).eq('id', existing.id);
      logger.info(`[DB] Seri kapağı güncellendi: ${title}`);
    }
    return existing.id;
  }

  if (searchError && searchError.code !== 'PGRST116') {
     logger.error(`[DB] Arama hatası (Seri: ${title}): %s`, searchError.message);
  }

  const { data: newSeries, error: insertError } = await supabase
    .from('series')
    .insert([{
      title: title.trim(),
      cover: cover || '',
      description: description || '',
      genre: Array.isArray(genre) ? genre : [genre],
      reads_num: 0,
      rating: 0.0,
      status: status || 'Devam Ediyor'
    }])
    .select()
    .single();

  if (insertError) {
    logger.error(`[DB] Seri ekleme hatası: %s`, insertError.message);
    throw insertError;
  }
  
  return newSeries.id;
}

/**
 * Checks if a chapter number exists for a given series.
 * @returns {boolean} true if newly created, false if already exists
 */
export async function createChapterIfNotExists(seriesId, chapterNumber, chapterTitle, pagesUrlArray) {
   const { data: existing, error: searchError } = await supabase
    .from('chapters')
    .select('id')
    .eq('series_id', seriesId)
    .eq('number', chapterNumber)
    .limit(1)
    .single();
    
   if (existing) {
     return false; // Already exists
   }
   
   if (searchError && searchError.code !== 'PGRST116') {
      logger.error(`[DB] Bölüm arama hatası (Bölüm: ${chapterNumber}): %s`, searchError.message);
   }

   const { error: insertError } = await supabase
     .from('chapters')
     .insert([{
       series_id: seriesId,
       number: chapterNumber,
       title: chapterTitle || `Bölüm ${chapterNumber}`,
       images: pagesUrlArray,
       is_premium: false
     }]);

   if (insertError) {
     logger.error(`[DB] Bölüm ekleme hatası: %s`, insertError.message);
     throw insertError;
   }
   return true; // Successfully created
}
