import { PermissionFlagsBits } from 'discord.js';
import { getSettings } from './settingsManager.js';

// Yetkili Rol ID'leri
export const ROLES = {
  BYK: '1494328424653787201', // Baş Yönetim Kurulu
  UYK: '1494328424486015028', // Üst Yönetim Kurulu
  AYK: '1512780238151614564', // Alt Yönetim Kurulu
  MOD: '1494328424632946759', // Moderatör
};

// Hiyerarşi (Ne kadar yüksek o kadar fazla yetki)
const HIERARCHY = {
  MOD: 1,
  AYK: 2,
  UYK: 3,
  BYK: 4,
};

/**
 * Kullanıcının belirtilen seviye (veya daha üstü) yetkiye sahip olup olmadığını kontrol eder.
 * Ayrıca kullanıcının Discord Administrator yetkisi varsa her zaman true döner (Sunucu sahibi vb. için).
 * 
 * @param {import('discord.js').GuildMember} member - Komutu kullanan üye
 * @param {string} requiredLevel - Gerekli olan en düşük seviye ('MOD', 'AYK', 'UYK', 'BYK')
 * @returns {boolean} Yetkisi var mı?
 */
export function hasPermission(member, requiredLevel = 'MOD') {
  if (!member) return false;

  // Gerçek sunucu sahibi veya Administrator yetkisi olanlar her zaman her şeyi yapabilir
  if (member.permissions && member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  const reqValue = HIERARCHY[requiredLevel] || 1;
  let userValue = 0;

  // /sunucu-kur ile oluşturulan bu sunucuya özel roller
  const tplRoles = getSettings().templates?.[member.guild?.id]?.roles || {};
  const has = (key) =>
    (ROLES[key] && member.roles.cache.has(ROLES[key])) ||
    (tplRoles[key.toLowerCase()] && member.roles.cache.has(tplRoles[key.toLowerCase()]));

  // Kurumsal C-Level (Kurucu, CEO, BYK, COO, CTO) en üst seviyededir
  if (has('KURUCU') || has('CEO') || has('BYK') || has('COO') || has('CTO')) {
    userValue = Math.max(userValue, HIERARCHY.BYK);
  }
  if (has('UYK')) userValue = Math.max(userValue, HIERARCHY.UYK);
  if (has('AYK')) userValue = Math.max(userValue, HIERARCHY.AYK);
  if (has('LEAD_MOD') || has('MOD')) userValue = Math.max(userValue, HIERARCHY.MOD);

  return userValue >= reqValue;
}
