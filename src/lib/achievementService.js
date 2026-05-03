
import { supabase } from './supabaseClient';

/**
 * 🌌 ANIPEAK KOZMİK BAŞARIM SİSTEMİ — ACHIEVEMENT ENGINE
 */

const CATEGORIES = {
  READING: 'Okuma',
  STREAK: 'İstikrar',
  GENRE: 'Tür',
  SOCIAL: 'Sosyal',
  RANK: 'Rütbe',
  LEGENDARY: 'Efsanevi'
};

/**
 * Kullanıcının istatistiklerini günceller ve başarımları kontrol eder
 */
export async function trackActivity(userId, type, value = 1, extra = {}) {
  if (!userId) return;

  try {
    // 1. Mevcut istatistikleri ve kazanılmış başarıları çek
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (pError) throw pError;

    const { data: unlocked, error: uError } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    if (uError) throw uError;

    const unlockedIds = new Set(unlocked.map(a => a.achievement_id));
    const updates = {};
    let shouldUpdateProfile = false;

    // 2. Aksiyon tipine göre istatistikleri güncelle
    switch (type) {
      case 'read_chapter':
        updates.total_chapters_read = (profile.total_chapters_read || 0) + 1;
        
        // Streak Kontrolü
        const today = new Date().toISOString().split('T')[0];
        const lastActive = profile.last_active_date;
        
        if (lastActive !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastActive === yesterdayStr) {
            updates.current_streak = (profile.current_streak || 0) + 1;
          } else {
            updates.current_streak = 1;
          }
          updates.last_active_date = today;
          if (updates.current_streak > (profile.max_streak || 0)) {
            updates.max_streak = updates.current_streak;
          }
        }
        
        // Tür İstatistikleri
        if (extra.genres && Array.isArray(extra.genres)) {
          const stats = profile.genre_stats || {};
          extra.genres.forEach(g => {
            stats[g] = (stats[g] || 0) + 1;
          });
          updates.genre_stats = stats;
        }

        shouldUpdateProfile = true;
        break;

      case 'comment':
        updates.comments_count = (profile.comments_count || 0) + 1;
        shouldUpdateProfile = true;
        break;

      case 'like':
        updates.likes_count = (profile.likes_count || 0) + 1;
        shouldUpdateProfile = true;
        break;

      case 'level_up':
        // Seviye zaten profile yansıdığı için burada sadece kontrol tetiklenir
        break;
    }

    // Profili güncelle
    if (shouldUpdateProfile) {
      await supabase.from('profiles').update(updates).eq('id', userId);
    }

    // 3. BAŞARIM KONTROLÜ (Tüm kilitli başarımları tara)
    const { data: achievements } = await supabase.from('achievements').select('*');
    const newUnlocks = [];

    const currentStats = { ...profile, ...updates };

    for (const ach of achievements) {
      if (unlockedIds.has(ach.id)) continue;

      let met = false;
      const val = ach.requirement_value;

      switch (ach.requirement_type) {
        case 'total_chapters':
          if (currentStats.total_chapters_read >= val) met = true;
          break;
        case 'streak':
          if (currentStats.current_streak >= val) met = true;
          break;
        case 'level':
          // XP'den seviye hesapla (AuthContext'teki mantıkla paralel)
          const level = Math.floor(currentStats.xp / 100) + 1; // Basitleştirilmiş, asıl hesaplama AuthContext'te
          if (level >= val) met = true;
          break;
        case 'genre_count':
          // Bu seri tamamlama için, şimdilik okunan tür sayısı olarak bakalım
          if (currentStats.genre_stats?.[extra.primaryGenre] >= val) met = true;
          break;
        case 'comments':
          if (currentStats.comments_count >= val) met = true;
          break;
        case 'likes':
          if (currentStats.likes_count >= val) met = true;
          break;
        case 'discord_link':
          if (currentStats.discord_id) met = true;
          break;
      }

      if (met) {
        newUnlocks.push({
          user_id: userId,
          achievement_id: ach.id
        });
      }
    }

    // 4. Yeni başarımları veritabanına işle
    if (newUnlocks.length > 0) {
      const { error: insError } = await supabase.from('user_achievements').insert(newUnlocks);
      if (!insError) {
        return newUnlocks; // UI'da bildirim göstermek için dön
      }
    }

    return [];
  } catch (err) {
    console.error('[AchievementService] Hata:', err);
    return [];
  }
}

/**
 * Kullanıcının mevcut tüm istatistiklerini tarar ve hak ettiği başarıları topluca mühürler.
 * (Örn: Seviye 100 olan birinin eski seviye başarılarını otomatik alması için)
 */
export async function syncAllAchievements(userId) {
  if (!userId) return;

  try {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const { data: unlocked } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', userId);
    const { data: achievements } = await supabase.from('achievements').select('*');

    if (!profile || !achievements) return;

    const unlockedIds = new Set(unlocked?.map(a => a.achievement_id) || []);
    const newUnlocks = [];

    // Seviye hesaplama (AuthContext'ten paralel)
    const level = Math.floor((profile.xp || 0) / 100) + 1;

    for (const ach of achievements) {
      if (unlockedIds.has(ach.id)) continue;

      let met = false;
      const val = ach.requirement_value;

      switch (ach.requirement_type) {
        case 'level':
          if (level >= val) met = true;
          break;
        case 'total_chapters':
          if ((profile.total_chapters_read || 0) >= val) met = true;
          break;
        case 'streak':
          if ((profile.max_streak || 0) >= val) met = true;
          break;
        case 'discord_link':
          if (profile.discord_id) met = true;
          break;
        case 'comments':
          if ((profile.comments_count || 0) >= val) met = true;
          break;
        case 'likes':
          if ((profile.likes_count || 0) >= val) met = true;
          break;
      }

      if (met) {
        newUnlocks.push({ user_id: userId, achievement_id: ach.id });
      }
    }

    if (newUnlocks.length > 0) {
      await supabase.from('user_achievements').insert(newUnlocks);
      return newUnlocks;
    }
  } catch (err) {
    console.error('[AchievementService] Sync hatası:', err);
  }
}
