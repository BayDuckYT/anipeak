import { EmbedBuilder } from 'discord.js';

// ── RENK PALETİ ─────────────────────────────────────────────
export const COLORS = {
  PRIMARY: '#00FFFF', // Siber Mavi
  SECONDARY: '#8A2BE2', // Mor
  SUCCESS: '#00FF00', // Neon Yeşil
  DANGER: '#FF003C', // Neon Kırmızı
  WARNING: '#FFD700', // Altın Sarısı
  DARK: '#121212',
};

// ── TEMEL EMBED ŞABLONU ─────────────────────────────────────
export function baseEmbed(color = COLORS.PRIMARY) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({
      text: '⚡ MahoraPeak Haber Ajansı • ' + new Date().toLocaleString('tr-TR'),
      iconURL: 'https://i.ibb.co/3Wk09r7/mahorapeak-logo.png', // Opsiyonel logo
    });
}

// ── MANUEL HABER / DUYURU EMBED ─────────────────────────────
export function newsEmbed(title, content, imageUrl, author) {
  const embed = baseEmbed(COLORS.SECONDARY)
    .setTitle(`📰 ${title}`)
    .setDescription(content)
    .setAuthor({ name: author.tag, iconURL: author.displayAvatarURL() });

  if (imageUrl && imageUrl.startsWith('http')) {
    embed.setImage(imageUrl);
  }

  return embed;
}

// ── OTONOM BÖLÜM RADARI EMBED ───────────────────────────────
export function chapterRadarEmbed(seriesTitle, chapterNumber, chapterTitle, coverImage, url) {
  const embed = baseEmbed(COLORS.PRIMARY)
    .setTitle(`🚨 YENİ BÖLÜM GELDİ UYANMIŞLAR!`)
    .setDescription(
      `Radarlarımız **${seriesTitle}** için yeni bir bölüm tespit etti!\n\n` +
      `**Bölüm:** ${chapterNumber}\n` +
      (chapterTitle ? `**Başlık:** ${chapterTitle}\n` : '') +
      `\n> Hemen okumak için aşağıdaki butona tıkla veya [buraya tıkla](${url}).`
    );

  const fallbackImage = 'https://i.ibb.co/3Wk09r7/mahorapeak-logo.png';
  const finalImage = (coverImage && coverImage.startsWith('http')) ? coverImage : fallbackImage;

  embed.setImage(finalImage);

  return embed;
}

// ── OTONOM YENİ SERİ RADARI EMBED ───────────────────────────
export function newSeriesRadarEmbed(seriesTitle, synopsis, coverImage, url) {
  const embed = baseEmbed(COLORS.SUCCESS)
    .setTitle(`🔥 YENİ SERİ AĞA DÜŞTÜ: ${seriesTitle}`)
    .setDescription(
      `Sitemize yepyeni bir şaheser eklendi!\n\n` +
      (synopsis ? `**Özet:**\n${synopsis.substring(0, 300)}...\n\n` : '') +
      `> Bu yeni efsaneye başlamak için aşağıdaki butona tıkla veya [buraya tıkla](${url}).`
    );

  const fallbackImage = 'https://i.ibb.co/3Wk09r7/mahorapeak-logo.png';
  const finalImage = (coverImage && coverImage.startsWith('http')) ? coverImage : fallbackImage;

  embed.setImage(finalImage);

  return embed;
}

// ── PANEL EMBEDLERİ ─────────────────────────────────────────
export function haberPanelEmbed() {
  return baseEmbed(COLORS.SECONDARY)
    .setTitle('🏢 HABER VE BÜLTEN KONTROL MERKEZİ')
    .setDescription(
      '```\n' +
      '╔═══════════════════════════════════════╗\n' +
      '║   MAHORAPEAK HABER MERKEZİ               ║\n' +
      '║   ─────────────────────────────────    ║\n' +
      '║   Haber oluştur, düzenle ve yayınla.  ║\n' +
      '╚═══════════════════════════════════════╝\n' +
      '```\n' +
      '> Sadece yetkililer erişebilir.'
    );
}

export function abonePanelEmbed() {
  return baseEmbed(COLORS.PRIMARY)
    .setTitle('📡 MAHORAPEAK HABER ABONELİK MERKEZİ')
    .setDescription(
      'Zırt pırt `@everyone` atıp kafanızı şişirmiyoruz!\n\n' +
      'Aşağıdaki menüden takip ettiğiniz serileri seçin, **sadece o seriye yeni bölüm geldiğinde** size haber gelsin amk.\n\n' +
      '> İstediğiniz seriyi seçtiğinizde rolünüz otomatik atanır. Çıkarmak için tekrar seçmeniz yeterlidir.'
    );
}
