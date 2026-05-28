// ============================================================
//  EMBEDS — Infinity Guard Embed Fabrikası
//  Tüm mesajlar bu factory'den çıkar. Düz metin yasak amk!
// ============================================================

import { EmbedBuilder } from 'discord.js';
import { COLORS, MAHORAPEAK } from './config.js';

// ── Base Embed (Her embed'in temeli) ────────────────────────
export function baseEmbed(color = COLORS.CYBER_BLUE) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: MAHORAPEAK.FOOTER_TEXT, iconURL: MAHORAPEAK.FOOTER_ICON })
    .setTimestamp();
}

// ── Mod Panel Ana Embed ─────────────────────────────────────
export function modPanelEmbed(guild) {
  const onlineCount = guild.members.cache.filter(
    (m) => m.presence?.status && m.presence.status !== 'offline'
  ).size;

  return baseEmbed(COLORS.PURPLE)
    .setTitle(MAHORAPEAK.PANEL_TITLE)
    .setDescription(
      '```\n' +
      '╔═══════════════════════════════════════╗\n' +
      '║      YÖNETİM KONTROL PANELİ v2.0      ║\n' +
      '║   ─────────────────────────────────    ║\n' +
      '║   Kullanıcıyı seç ve işlemi uygula.   ║\n' +
      '╚═══════════════════════════════════════╝\n' +
      '```'
    )
    .addFields(
      { name: '⚡ Güvenlik Durumu', value: '```diff\n+ AKTİF\n```', inline: true },
      { name: '🔒 Sunucu Güvenliği', value: '```fix\nGÜVENLİ\n```', inline: true },
      { name: '👥 Çevrimiçi', value: `\`\`\`yaml\n${onlineCount} üye\n\`\`\``, inline: true },
      { name: '\u200b', value: '**Aşağıdaki butonları kullanarak moderasyon işlemi başlatın:**' },
    );
}

// ── Ceza Sebebi Seçim Embed ─────────────────────────────────
export function reasonSelectEmbed(actionLabel) {
  return baseEmbed(COLORS.WARNING)
    .setTitle(`⚙️ ${actionLabel} — Sebep Seçimi`)
    .setDescription(
      '> Uygulanacak cezanın sebebini aşağıdaki menüden seçin.\n' +
      '> Seçim yapıldıktan sonra hedef kullanıcı bilgisi istenecektir.'
    );
}

// ── Hedef Kullanıcı Girişi Embed ────────────────────────────
export function targetInputEmbed(actionLabel, reason) {
  return baseEmbed(COLORS.CYBER_BLUE)
    .setTitle(`🎯 ${actionLabel} — Hedef Belirle`)
    .setDescription(
      `> **Sebep:** ${reason}\n` +
      '> Aşağıdaki forma hedef kullanıcının **ID**\'sini girin.'
    );
}

// ── Başarılı Moderasyon Embed ───────────────────────────────
export function modSuccessEmbed({ action, targetUser, reason, moderator }) {
  return baseEmbed(COLORS.DANGER)
    .setTitle('🛡️ INFINITY GUARD — KORUMA SİSTEMİ')
    .setDescription(
      '```ansi\n' +
      '\u001b[2;34m██ KORUMA SİSTEMİ DEVREYE GİRDİ ██\u001b[0m\n' +
      '```'
    )
    .addFields(
      { name: '⚔️ İşlem',    value: `\`${action}\``,                          inline: true },
      { name: '🎯 Hedef',    value: `${targetUser}`,                          inline: true },
      { name: '📋 Sebep',    value: `\`${reason}\``,                          inline: true },
      { name: '👮 Yetkili',  value: `${moderator}`,                           inline: true },
      { name: '🕐 Tarih',    value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
    );
}

// ── Anti-Spam Devreye Girdi Embed ───────────────────────────
export function antiSpamEmbed(user) {
  return baseEmbed(COLORS.DANGER)
    .setTitle('🚨 MAHORAPEAK KORUMA — OTOMATİK ENGELLEME')
    .setDescription(
      '```ansi\n' +
      '\u001b[2;34m██ SPAM ALGILANDI — OTOMATİK MÜDAHALE ██\u001b[0m\n' +
      '```'
    )
    .addFields(
      { name: '🤖 Durum',   value: '`Otomatik Zindana Atıldı (10dk)`', inline: true },
      { name: '🎯 Hedef',   value: `${user}`,                          inline: true },
      { name: '📋 Sebep',   value: '`Spam / Flood Tespiti`',           inline: true },
    );
}

// ── Anti-Link Embed ─────────────────────────────────────────
export function antiLinkEmbed(user, deletedUrl) {
  return baseEmbed(COLORS.NEON_PINK)
    .setTitle('🔗 MAHORAPEAK KORUMA — LİNK FİLTRESİ')
    .setDescription(
      '> Link filtresi tarafından bir bağlantı tespit edildi ve engellendi.'
    )
    .addFields(
      { name: '🎯 Gönderen', value: `${user}`, inline: true },
      { name: '🔗 Engellenen', value: `\`${deletedUrl.substring(0, 50)}...\``, inline: true },
    );
}

// ── Mesaj Silme Log Embed ───────────────────────────────────
export function messageDeleteLogEmbed(message) {
  const content = message.content?.substring(0, 1024) || '*İçerik yok / Embed*';
  return baseEmbed(COLORS.LOG_DELETE)
    .setTitle('🗑️ Mesaj Silindi')
    .addFields(
      { name: '👤 Gönderen',  value: `${message.author ?? 'Bilinmiyor'}`, inline: true },
      { name: '📍 Kanal',     value: `${message.channel ?? 'Bilinmiyor'}`, inline: true },
      { name: '📝 İçerik',    value: content },
    );
}

// ── Mesaj Düzenleme Log Embed ───────────────────────────────
export function messageEditLogEmbed(oldMessage, newMessage) {
  const oldContent = oldMessage.content?.substring(0, 512) || '*Boş*';
  const newContent = newMessage.content?.substring(0, 512) || '*Boş*';
  return baseEmbed(COLORS.LOG_EDIT)
    .setTitle('✏️ Mesaj Düzenlendi')
    .addFields(
      { name: '👤 Gönderen', value: `${newMessage.author}`,      inline: true },
      { name: '📍 Kanal',    value: `${newMessage.channel}`,      inline: true },
      { name: '📝 Eski',     value: oldContent },
      { name: '📝 Yeni',     value: newContent },
      { name: '🔗 Git',      value: `[Mesaja Git](${newMessage.url})` },
    );
}

// ── Ses Kanalı Log Embed ────────────────────────────────────
export function voiceLogEmbed({ member, action, channel }) {
  const colorMap = { katıldı: COLORS.LOG_JOIN, ayrıldı: COLORS.LOG_LEAVE, taşındı: COLORS.LOG_VOICE };
  return baseEmbed(colorMap[action] || COLORS.CYBER_BLUE)
    .setTitle(`🔊 Ses Kanalı — ${action.charAt(0).toUpperCase() + action.slice(1)}`)
    .addFields(
      { name: '👤 Üye',  value: `${member}`, inline: true },
      { name: '🔊 Kanal', value: `${channel}`, inline: true },
    );
}

// ── Üye Katılma/Ayrılma Embed ───────────────────────────────
export function memberJoinEmbed(member) {
  return baseEmbed(COLORS.LOG_JOIN)
    .setTitle('📥 Yeni Üye Katıldı')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: '👤 Üye',       value: `${member} (${member.user.tag})`, inline: true },
      { name: '🆔 ID',        value: `\`${member.id}\``,              inline: true },
      { name: '📅 Hesap',     value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: '👥 Toplam Üye', value: `\`${member.guild.memberCount}\``, inline: true },
    );
}

export function memberLeaveEmbed(member) {
  return baseEmbed(COLORS.LOG_LEAVE)
    .setTitle('📤 Üye Ayrıldı')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: '👤 Üye',       value: `${member.user.tag}`, inline: true },
      { name: '🆔 ID',        value: `\`${member.id}\``,   inline: true },
      { name: '👥 Kalan Üye', value: `\`${member.guild.memberCount}\``, inline: true },
    );
}

// ── Temizleme Başarılı Embed ────────────────────────────────
export function purgeSuccessEmbed(count, moderator) {
  return baseEmbed(COLORS.SUCCESS)
    .setTitle('🧹 Sohbet Temizlendi')
    .addFields(
      { name: '📝 Silinen', value: `\`${count}\` mesaj`, inline: true },
      { name: '👮 Yetkili', value: `${moderator}`,       inline: true },
    );
}

// ── Sunucu Bilgisi Embed ────────────────────────────────────
export function serverInfoEmbed(guild) {
  const onlineCount = guild.members.cache.filter(
    (m) => m.presence?.status && m.presence.status !== 'offline'
  ).size;

  return baseEmbed(COLORS.CYBER_BLUE)
    .setTitle(`📊 ${guild.name} — Sunucu Bilgileri`)
    .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
    .addFields(
      { name: '👑 Sahip',       value: `<@${guild.ownerId}>`,               inline: true },
      { name: '👥 Toplam Üye',  value: `\`${guild.memberCount}\``,          inline: true },
      { name: '🟢 Çevrimiçi',   value: `\`${onlineCount}\``,               inline: true },
      { name: '💬 Kanal',       value: `\`${guild.channels.cache.size}\``,  inline: true },
      { name: '😀 Emoji',       value: `\`${guild.emojis.cache.size}\``,    inline: true },
      { name: '🚀 Boost',       value: `\`${guild.premiumSubscriptionCount || 0}\` (Seviye ${guild.premiumTier})`, inline: true },
      { name: '📅 Oluşturulma', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
      { name: '🔒 Doğrulama',   value: `\`${guild.verificationLevel}\``,    inline: true },
    );
}

// ════════════════════════════════════════════════════════════
//  V2 EKLENTİLERİ — Nükleer Yönetim ve İstihbarat Logları
// ════════════════════════════════════════════════════════════

// ── Kanal Ops Ana Panel ─────────────────────────────────────
export function channelPanelEmbed(guild) {
  return baseEmbed(COLORS.DANGER)
    .setTitle('🏢 KANAL YÖNETİM MERKEZİ')
    .setDescription(
      '```\n' +
      '╔═══════════════════════════════════════╗\n' +
      '║   CHANNEL OPS — KANAL YÖNETİMİ        ║\n' +
      '║   ─────────────────────────────────    ║\n' +
      '║   Kanal aç, kilit vur, temizle!       ║\n' +
      '╚═══════════════════════════════════════╝\n' +
      '```\n' +
      '> **Dikkat:** Kanal sıfırlama işlemi geri alınamaz!'
    );
}

// ── Rol Ops Ana Panel ───────────────────────────────────────
export function rolePanelEmbed(guild) {
  return baseEmbed(COLORS.PURPLE)
    .setTitle('🏅 YETKİ KONTROL MERKEZİ')
    .setDescription(
      '```\n' +
      '╔═══════════════════════════════════════╗\n' +
      '║    ROLE OPS — ROL VE YETKİ YÖNETİMİ   ║\n' +
      '╚═══════════════════════════════════════╝\n' +
      '```\n' +
      '> Yeni roller oluştur veya üyelere yetki ver.'
    );
}

// ── Lockdown Log ────────────────────────────────────────────
export function lockdownLogEmbed(channel, isLocked, moderator) {
  return baseEmbed(isLocked ? COLORS.DANGER : COLORS.SUCCESS)
    .setTitle(isLocked ? '🔒 KANAL KİLİTLENDİ' : '🔓 KANAL KİLİDİ AÇILDI')
    .addFields(
      { name: '📍 Kanal',   value: `${channel}`, inline: true },
      { name: '👮 Yetkili', value: `${moderator}`, inline: true },
    );
}

// ── Nuke Log ────────────────────────────────────────────────
export function nukeLogEmbed(channelName, moderator) {
  return baseEmbed(COLORS.DANGER)
    .setTitle('♻️ KANAL SIFIRLANDI')
    .setDescription(
      '```ansi\n' +
      '\u001b[2;34m██ KANAL TEMİZLİĞİ TAMAMLANDI ██\u001b[0m\n' +
      '```'
    )
    .addFields(
      { name: '📍 Kanal İsmi', value: `\`${channelName}\``, inline: true },
      { name: '👮 Yetkili',    value: `${moderator}`, inline: true },
    );
}

// ── Kanal Oluşturma/Silme Logları ───────────────────────────
export function channelCreateLogEmbed(channel, executor) {
  return baseEmbed(COLORS.SUCCESS)
    .setTitle('📂 Yeni Kanal Oluşturuldu')
    .addFields(
      { name: '📍 Kanal', value: `${channel} (\`${channel.name}\`)`, inline: true },
      { name: '👮 İşlemi Yapan', value: executor ? `${executor}` : '*Bilinmiyor (Bot/Sistem)*', inline: true },
      { name: '🏷️ Tür', value: `\`${channel.type}\``, inline: true },
    );
}

export function channelDeleteLogEmbed(channel, executor) {
  return baseEmbed(COLORS.DANGER)
    .setTitle('🗑️ Kanal Silindi')
    .addFields(
      { name: '📍 Kanal İsmi', value: `\`${channel.name}\``, inline: true },
      { name: '👮 İşlemi Yapan', value: executor ? `${executor}` : '*Bilinmiyor (Bot/Sistem)*', inline: true },
    );
}

// ── Rol Oluşturma/Silme Logları ─────────────────────────────
export function roleCreateLogEmbed(role, executor) {
  return baseEmbed(COLORS.SUCCESS)
    .setTitle('🏅 Yeni Rol Oluşturuldu')
    .addFields(
      { name: '🏷️ Rol', value: `${role}`, inline: true },
      { name: '🎨 Renk', value: `\`${role.hexColor}\``, inline: true },
      { name: '👮 İşlemi Yapan', value: executor ? `${executor}` : '*Bilinmiyor (Bot/Sistem)*', inline: true },
    );
}

export function roleDeleteLogEmbed(role, executor) {
  return baseEmbed(COLORS.DANGER)
    .setTitle('🔥 Rol Silindi')
    .addFields(
      { name: '🏷️ Rol İsmi', value: `\`${role.name}\``, inline: true },
      { name: '👮 İşlemi Yapan', value: executor ? `${executor}` : '*Bilinmiyor (Bot/Sistem)*', inline: true },
    );
}

// ── Özel Yazı (Yaz) Embed ────────────────────────────────────
export function writeEmbed({ title, description, image, color }) {
  const embed = baseEmbed(color || COLORS.CYBER_BLUE)
    .setTitle(title)
    .setDescription(description);
  
  if (image && image.startsWith('http')) {
    embed.setImage(image);
  }
  
  return embed;
}

// ── Güvenlik Uyarısı Embed ────────────────────────────────────
export function securityAlertEmbed(user, reason) {
  return baseEmbed(COLORS.NEON_PINK)
    .setTitle('🚨 MAHORAPEAK KORUMA — GÜVENLİK SİSTEMİ')
    .setDescription(
      `> Sayın ${user}, gönderdiğiniz içerik güvenlik politikalarımızı ihlal etmektedir.\n` +
      `> **İhlal Nedeni:** \`${reason}\``
    )
    .addFields(
      { name: '⚠️ Uyarı', value: 'Lütfen sunucu kurallarına uyun, aksi takdirde otomatik ceza uygulanacaktır.', inline: false }
    );
}
