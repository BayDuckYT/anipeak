/**
 * MyAnimeList (MAL) Integration Service using Jikan API (V4)
 * https://jikan.moe/
 */

const BASE_URL = 'https://api.jikan.moe/v4';

/**
 * Fetch a user's anime or manga list from MAL via Jikan
 * @param {string} username - MAL Username
 * @param {string} type - 'animelist' or 'mangalist'
 */
export async function fetchMALList(username, type = 'mangalist') {
  if (!username) return null;
  
  try {
    const response = await fetch(`${BASE_URL}/users/${username}/${type}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error('MAL Kullanıcısı bulunamadı.');
      if (response.status === 429) throw new Error('MAL API Limitine ulaşıldı, lütfen biraz bekleyin.');
      throw new Error('MAL Verisi alınamadı.');
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (err) {
    console.error(`[MAL Service] Fetch error (${type}):`, err);
    throw err;
  }
}

/**
 * Fetch basic user profile info from MAL
 */
export async function fetchMALProfile(username) {
  if (!username) return null;
  
  try {
    const response = await fetch(`${BASE_URL}/users/${username}/full`);
    if (!response.ok) throw new Error('MAL Profili alınamadı.');
    
    const data = await response.json();
    return data.data;
  } catch (err) {
    console.error('[MAL Service] Profile fetch error:', err);
    return null;
  }
}
