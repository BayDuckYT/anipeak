import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { WHITELIST_DOMAINS, SPAM_CONFIG, SECURITY_CONFIG, BAD_WORDS, GREETINGS, PUNISHMENT_CONFIG, COLORS, STRICT_LINK_CHANNELS } from '../utils/config.js';
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

    const isStaff = message.member?.permissions?.has(PermissionFlagsBits.ManageMessages);
    
    const content = message.content;
    const lowerContent = content.toLowerCase().trim();

    // ══════════════════════════════════════════════════════════
    //  0. AKILLI SELAMLAŞMA MODÜLÜ (Staff olmasa da çalışır)
    // ══════════════════════════════════════════════════════════
    if (GREETINGS.INPUTS.includes(lowerContent)) {
      const response = GREETINGS.OUTPUTS[Math.floor(Math.random() * GREETINGS.OUTPUTS.length)];
      return message.reply(response);
    }

    // GS Kontrolü (Sunucu Sahibi Bypass için)
    const isOwner = message.author.id === message.guild.ownerId;
    
    // Filtre Bypass Mantığı:
    // Sadece Sunucu Sahibi (GS) filtrelerden muaftır.
    // Diğer tüm yetkililer ve üyeler filtreye tabidir.
    if (isOwner) return;

    // Diğer filtreler için (Link, Spam vs.) hala Staff kontrolü yapabiliriz 
    // ama kullanıcı "her türlü küfür engellencek rütbesi ne olursa olsun gs hariç" dediği için
    // küfür filtresinden önce GS kontrolü yapıyoruz.

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
    //  2. KÜFÜR / ARGO FİLTRESİ (DİNAMİK & DERECELİ)
    // ══════════════════════════════════════════════════════════
    if (chanSettings.badWords) {
      // Metni normalize et (boşlukları, noktaları temizle, tekrarlayan harfleri teke indir)
      const normalizedContent = lowerContent
        .replace(/[^a-z0-9ğüşıöç]/gi, '') // Sadece harf ve rakam kalsın
        .replace(/\s+/g, '') // Boşlukları temizle
        .replace(/(.)\1+/g, '$1') // Tekrarlayan harfleri teke indir (amkkkk -> amk)
        .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't').replace(/8/g, 'b').replace(/@/g, 'a').replace(/v/g, 'u').replace(/w/g, 'v');

      // Önce AĞIR küfürleri kontrol et (Doğrudan ceza)
      const hasHeavyBadWord = BAD_WORDS.HEAVY.some(word => {
        return normalizedContent.includes(word.toLowerCase());
      });

      if (hasHeavyBadWord) {
        const timeoutDuration = Math.floor(Math.random() * (PUNISHMENT_CONFIG.HEAVY_TIMEOUT_MAX_MS - PUNISHMENT_CONFIG.HEAVY_TIMEOUT_MIN_MS + 1)) + PUNISHMENT_CONFIG.HEAVY_TIMEOUT_MIN_MS;
        const hours = Math.floor(timeoutDuration / (60 * 60 * 1000));
        
        await handleHeavyViolation(message, 'Ağır Küfür / Kutsal Değerlere Saldırı', hours);
        return;
      }

      // Sonra HAFİF küfürleri kontrol et (Uyarı sistemi)
      const hasLightBadWord = BAD_WORDS.LIGHT.some(word => {
        // Tam eşleşme veya kelime içinde geçme kontrolü
        return normalizedContent.includes(word.toLowerCase());
      });

      if (hasLightBadWord) {
        await handleLightViolation(message, 'Yasaklı Kelime / Küfür');
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
    //  6. GÖRSEL ZEKA (OCR) TARAMASI
    // ══════════════════════════════════════════════════════════
    if (message.attachments.size > 0) {
      const image = message.attachments.find(a => a.contentType?.startsWith('image/'));
      if (image) {
        try {
          const Tesseract = (await import('tesseract.js')).default;
          const { data: { text } } = await Tesseract.recognize(image.url, 'tur+eng');
          const lowerText = text.toLowerCase();

          const hasViolation = 
            BAD_WORDS.LIGHT.some(word => lowerText.includes(word.toLowerCase())) ||
            BAD_WORDS.HEAVY.some(word => lowerText.includes(word.toLowerCase())) ||
            INVITE_REGEX.test(lowerText) ||
            ["scam", "crypto", "free nitro", "dolandırıcılık"].some(w => lowerText.includes(w));

          if (hasViolation) {
            return await handleViolation(message, 'Resim Üzerinde Yasaklı İçerik (OCR)', securityAlertEmbed(message.author, 'Resim üzerinde yasaklı kelime veya link tespit edildi!'));
          }
        } catch (ocrErr) {
          console.error('[Infinity-Guard] OCR Hatası:', ocrErr.message);
        }
      }
    }

    // ══════════════════════════════════════════════════════════
    //  5. ANTI-SPAM MOTORU
    // ══════════════════════════════════════════════════════════
    if (chanSettings.antiSpam) {
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
 * Hafif Küfür / Uyarı Sistemi
 */
async function handleLightViolation(message, reason) {
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
        .setDescription(`${message.author}, küfür/uyarı limitini aştığın için **1 saat** boyunca susturuldun.`)
        .addFields({ name: '📊 Uyarı Sayısı', value: `\`${count} / ${PUNISHMENT_CONFIG.MAX_WARNINGS}\`` });

      await message.channel.send({ embeds: [embed] });
      await sendLog(message.guild, embed);
    } catch (err) {
      console.error('[Infinity-Guard] Light violation timeout hatası:', err.message);
    }
  } else {
    // Sadece uyar
    const embed = securityAlertEmbed(message.author, reason)
      .addFields({ name: '⚠️ Uyarı Durumu', value: `\`${count} / ${PUNISHMENT_CONFIG.MAX_WARNINGS}\`` });
    
    const warningMsg = await message.channel.send({ content: `${message.author}`, embeds: [embed] });
    setTimeout(() => warningMsg.delete().catch(() => {}), 6000);
    await sendLog(message.guild, embed);
  }
}

/**
 * Ağır Küfür / Doğrudan Ceza
 */
async function handleHeavyViolation(message, reason, hours) {
  await message.delete().catch(() => {});

  try {
    const durationMs = hours * 60 * 60 * 1000;
    await message.member.timeout(durationMs, reason);

    const embed = baseEmbed(COLORS.DANGER)
      .setTitle('🔥 AĞIR İHLAL — ANINDA CEZA')
      .setDescription(
        `${message.author}, sunucu kurallarını ağır şekilde ihlal ettiğin için **${hours} saat** susturuldun.\n` +
        `**Sebep:** \`${reason}\``
      )
      .setFooter({ text: 'Sıfır Tolerans Politikası Aktif' });

    await message.channel.send({ embeds: [embed] });
    await sendLog(message.guild, embed);
  } catch (err) {
    console.error('[Infinity-Guard] Heavy violation timeout hatası:', err.message);
  }
}
