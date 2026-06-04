import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { WHITELIST_DOMAINS, SPAM_CONFIG, SECURITY_CONFIG, GREETINGS, PUNISHMENT_CONFIG, COLORS, STRICT_LINK_CHANNELS, containsProfanity } from '../utils/config.js';
import { antiSpamEmbed, antiLinkEmbed, securityAlertEmbed, baseEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logger.js';
import { trackAndCheck, resetUser } from '../utils/antiSpam.js';

// URL tespit regex'i
const URL_REGEX = /https?:\/\/[^\s]+/gi;
// Discord davet linki regex'i
const INVITE_REGEX = /(?:discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9]+/gi;

// Duplicate kontrolü için basit cache
const lastMessages = new Map();
// Uyarı takibi için map
const userWarnings = new Map();

import { getSettings } from '../utils/settingsManager.js';

export default {
  name: 'messageCreate',
  once: false,

  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const settings = getSettings();
    const chanSettings = settings.channels[message.channel.id] || settings.global;

    const content = message.content;
    const lowerContent = content.toLowerCase().trim();

    // ══════════════════════════════════════════════════════════
    //  0. AKILLI SELAMLAŞMA MODÜLÜ
    // ══════════════════════════════════════════════════════════
    if (GREETINGS.INPUTS.includes(lowerContent)) {
      const response = GREETINGS.OUTPUTS[Math.floor(Math.random() * GREETINGS.OUTPUTS.length)];
      return message.reply(response);
    }

    // GS Kontrolü (Sunucu Sahibi Bypass)
    const isOwner = message.author.id === message.guild.ownerId;
    if (isOwner) return;

    // ══════════════════════════════════════════════════════════
    //  1. ANTI-LINK FİLTRESİ
    // ══════════════════════════════════════════════════════════
    if (chanSettings.antiLink) {
      const isStrictChannel = STRICT_LINK_CHANNELS.includes(message.channel.id);
      
      const inviteMatch = lowerContent.match(INVITE_REGEX);
      if (inviteMatch) {
        if (isStrictChannel) {
          return await handleViolation(message, 'Yasaklı Davet Linki (Strict Kanal)', antiLinkEmbed(message.author, inviteMatch[0]));
        }
        
        const isWhitelisted = WHITELIST_DOMAINS.some(d => inviteMatch.some(l => l.includes(d)));
        if (!isWhitelisted) return await handleViolation(message, 'Yasaklı Davet Linki', antiLinkEmbed(message.author, inviteMatch[0]));
      }

      const urlMatch = lowerContent.match(URL_REGEX);
      if (urlMatch) {
        if (isStrictChannel) {
          return await handleViolation(message, 'Yasaklı Link (Strict Kanal)', antiLinkEmbed(message.author, urlMatch[0]));
        }
        
        const hasBlockedUrl = urlMatch.some(url => !WHITELIST_DOMAINS.some(d => url.includes(d)));
        if (hasBlockedUrl) return await handleViolation(message, 'Yasaklı Link', antiLinkEmbed(message.author, urlMatch[0]));
      }
    }

    // ══════════════════════════════════════════════════════════
    //  2. KÜFÜR FİLTRESİ (TEMİZ REGEX TABANLI)
    //  Artık devasa kelime listesi YOK — sadece kök küfürler
    //  "allah", "din", "ataturk" gibi kelimeler engellenMEZ
    // ══════════════════════════════════════════════════════════
    if (chanSettings.badWords) {
      if (containsProfanity(content)) {
        await handleProfanityViolation(message);
        return;
      }
    }

    // ══════════════════════════════════════════════════════════
    //  3. CAPS LOCK FİLTRESİ
    // ══════════════════════════════════════════════════════════
    if (chanSettings.capsFilter && content.length >= SECURITY_CONFIG.MIN_LENGTH_FOR_CAPS) {
      const capsCount = (content.match(/[A-Z]/g) || []).length;
      const totalLetters = (content.match(/[a-zA-Z]/g) || []).length;
      
      if (totalLetters > 0 && (capsCount / totalLetters) * 100 >= SECURITY_CONFIG.CAPS_LOCK_PERCENTAGE) {
        return await handleViolation(message, 'Aşırı Caps-Lock kullanımı', securityAlertEmbed(message.author, 'Lütfen bağırmayın (Büyük Harf Kullanımı)'));
      }
    }

    // ══════════════════════════════════════════════════════════
    //  4. DUPLICATE (TEKRAR) FİLTRESİ
    // ══════════════════════════════════════════════════════════
    if (chanSettings.duplicateFilter) {
      const lastMsg = lastMessages.get(message.author.id);
      if (lastMsg && lastMsg.content === content && (Date.now() - lastMsg.time) < 10000) {
        return await handleViolation(message, 'Tekrarlayan Mesaj', securityAlertEmbed(message.author, 'Aynı mesajı tekrar gönderemezsiniz.'));
      }
      lastMessages.set(message.author.id, { content, time: Date.now() });
    }

    // ══════════════════════════════════════════════════════════
    //  5. ANTI-SPAM MOTORU
    // ══════════════════════════════════════════════════════════
    if (chanSettings.antiSpam) {
      const isSpamming = trackAndCheck(message.author.id);
      if (isSpamming) {
        try {
          await message.member.timeout(SPAM_CONFIG.TIMEOUT_DURATION_MS, 'MahoraPeak Guard — Otomatik spam tespiti');
          resetUser(message.author.id);
          const embed = antiSpamEmbed(message.author);
          await message.channel.send({ embeds: [embed] });
          await sendLog(message.guild, embed);
        } catch (err) {
          console.error('[Infinity-Guard] Anti-spam timeout hatası:', err.message);
        }
      }
    }
  },
};

/**
 * Genel İhlal Yönetimi
 */
async function handleViolation(message, reason, embed) {
  try {
    await message.delete().catch(() => {});
    const warning = await message.channel.send({ content: `${message.author}`, embeds: [embed] });
    setTimeout(() => warning.delete().catch(() => {}), 5000);
    await sendLog(message.guild, embed);
    console.log(`[Infinity-Guard] 🛡️ Güvenlik İhlali: ${message.author.tag} | Neden: ${reason}`);
    return true;
  } catch (err) {
    console.error(`[Infinity-Guard] İhlal yönetimi hatası (${reason}):`, err.message);
  }
}

/**
 * Küfür İhlali — 3 uyarı sonrası 10dk timeout
 * Artık HEAVY/LIGHT ayrımı yok, tek sistem.
 */
async function handleProfanityViolation(message) {
  const userId = message.author.id;
  let count = (userWarnings.get(userId) || 0) + 1;
  userWarnings.set(userId, count);

  await message.delete().catch(() => {});

  if (count >= PUNISHMENT_CONFIG.MAX_WARNINGS) {
    // Timeout uygula
    try {
      await message.member.timeout(PUNISHMENT_CONFIG.WARNING_TIMEOUT_MS, `Küfür limitini aştı (${count}/${PUNISHMENT_CONFIG.MAX_WARNINGS})`);
      userWarnings.set(userId, 0); // Sıfırla

      const embed = baseEmbed(COLORS.DANGER)
        .setTitle('🤐 OTOMATİK SUSTURMA')
        .setDescription(`${message.author}, küfür limitini aştığın için **10 dakika** boyunca susturuldun.`)
        .addFields({ name: '📊 Uyarı Sayısı', value: `\`${count} / ${PUNISHMENT_CONFIG.MAX_WARNINGS}\`` });

      await message.channel.send({ embeds: [embed] });
      await sendLog(message.guild, embed);
    } catch (err) {
      console.error('[Infinity-Guard] Küfür timeout hatası:', err.message);
    }
  } else {
    // Sadece uyar
    const embed = securityAlertEmbed(message.author, 'Küfür / Uygunsuz İfade')
      .addFields({ name: '⚠️ Uyarı Durumu', value: `\`${count} / ${PUNISHMENT_CONFIG.MAX_WARNINGS}\`` });
    
    const warningMsg = await message.channel.send({ content: `${message.author}`, embeds: [embed] });
    setTimeout(() => warningMsg.delete().catch(() => {}), 6000);
    await sendLog(message.guild, embed);
  }
}
