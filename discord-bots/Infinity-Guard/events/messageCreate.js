import { PermissionFlagsBits } from 'discord.js';
import { WHITELIST_DOMAINS, SPAM_CONFIG, SECURITY_CONFIG, BAD_WORDS } from '../utils/config.js';
import { antiSpamEmbed, antiLinkEmbed, securityAlertEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logger.js';
import { trackAndCheck, resetUser } from '../utils/antiSpam.js';

// URL tespit regex'i
const URL_REGEX = /https?:\/\/[^\s]+/gi;
// Discord davet linki regex'i
const INVITE_REGEX = /(?:discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9]+/gi;

// Duplicate kontrolü için basit cache
const lastMessages = new Map();

export default {
  name: 'messageCreate',
  once: false,

  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const isStaff = message.member?.permissions?.has(PermissionFlagsBits.ManageMessages);
    if (isStaff) return;

    const content = message.content;
    const lowerContent = content.toLowerCase();

    // ══════════════════════════════════════════════════════════
    //  1. ANTI-LINK FİLTRESİ
    // ══════════════════════════════════════════════════════════
    const inviteMatch = lowerContent.match(INVITE_REGEX);
    if (inviteMatch) {
      const isWhitelisted = WHITELIST_DOMAINS.some(d => inviteMatch.some(l => l.includes(d)));
      if (!isWhitelisted) return await handleViolation(message, 'Yasaklı Davet Linki', antiLinkEmbed(message.author, inviteMatch[0]));
    }

    const urlMatch = lowerContent.match(URL_REGEX);
    if (urlMatch) {
      const hasBlockedUrl = urlMatch.some(url => !WHITELIST_DOMAINS.some(d => url.includes(d)));
      if (hasBlockedUrl) return await handleViolation(message, 'Yasaklı Link', antiLinkEmbed(message.author, urlMatch[0]));
    }

    // ══════════════════════════════════════════════════════════
    //  2. KÜFÜR / ARGO FİLTRESİ
    // ══════════════════════════════════════════════════════════
    if (SECURITY_CONFIG.BAD_WORDS_FILTER) {
      const hasBadWord = BAD_WORDS.some(word => {
        const regex = new RegExp(`(\\b|\\d|_)${word}(\\b|\\d|_|s|lar|ler)`, 'gi');
        return regex.test(lowerContent);
      });

      if (hasBadWord) {
        return await handleViolation(message, 'Yasaklı Kelime / Küfür', securityAlertEmbed(message.author, 'Yasaklı Kelime Kullanımı'));
      }
    }

    // ══════════════════════════════════════════════════════════
    //  3. CAPS LOCK FİLTRESİ
    // ══════════════════════════════════════════════════════════
    if (SECURITY_CONFIG.CAPS_LOCK_FILTER && content.length >= SECURITY_CONFIG.MIN_LENGTH_FOR_CAPS) {
      const capsCount = (content.match(/[A-Z]/g) || []).length;
      const totalLetters = (content.match(/[a-zA-Z]/g) || []).length;
      
      if (totalLetters > 0 && (capsCount / totalLetters) * 100 >= SECURITY_CONFIG.CAPS_LOCK_PERCENTAGE) {
        return await handleViolation(message, 'Aşırı Caps-Lock kullanımı', securityAlertEmbed(message.author, 'Lütfen bağırmayın (Büyük Harf Kullanımı)'));
      }
    }

    // ══════════════════════════════════════════════════════════
    //  4. DUPLICATE (TEKRAR) FİLTRESİ
    // ══════════════════════════════════════════════════════════
    if (SECURITY_CONFIG.DUPLICATE_FILTER) {
      const lastMsg = lastMessages.get(message.author.id);
      if (lastMsg && lastMsg.content === content && (Date.now() - lastMsg.time) < 10000) {
        return await handleViolation(message, 'Tekrarlayan Mesaj', securityAlertEmbed(message.author, 'Aynı mesajı tekrar gönderemezsiniz.'));
      }
      lastMessages.set(message.author.id, { content, time: Date.now() });
    }

    // ══════════════════════════════════════════════════════════
    //  5. ANTI-SPAM MOTORU
    // ══════════════════════════════════════════════════════════
    const isSpamming = trackAndCheck(message.author.id);
    if (isSpamming) {
      try {
        await message.member.timeout(SPAM_CONFIG.TIMEOUT_DURATION_MS, 'Infinity Guard — Otomatik spam tespiti');
        resetUser(message.author.id);
        const embed = antiSpamEmbed(message.author);
        await message.channel.send({ embeds: [embed] });
        await sendLog(message.guild, embed);
      } catch (err) {
        console.error('[Infinity-Guard] Anti-spam timeout hatası:', err.message);
      }
    }
  },
};

async function handleViolation(message, reason, embed) {
  try {
    await message.delete().catch(() => {});
    const warning = await message.channel.send({ embeds: [embed] });
    setTimeout(() => warning.delete().catch(() => {}), 5000);
    await sendLog(message.guild, embed);
    console.log(`[Infinity-Guard] 🛡️ Güvenlik İhlali: ${message.author.tag} | Neden: ${reason}`);
    return true;
  } catch (err) {
    console.error(`[Infinity-Guard] İhlal yönetimi hatası (${reason}):`, err.message);
  }
}
