// ============================================================
//  /duyuru — Gelişmiş Duyuru Yönetim Sistemi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, PINK: 0xFF10F0, GREEN: 0x00FF88, RED: 0xFF003C, PURPLE: 0x8A2BE2 };

export default {
  data: new SlashCommandBuilder()
    .setName('duyuru')
    .setDescription('📢 Duyuru yönetim komutları')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub.setName('yayinla')
        .setDescription('Yeni duyuru yayınlar.')
        .addStringOption(opt => opt.setName('başlık').setDescription('Duyuru başlığı').setRequired(true))
        .addStringOption(opt => opt.setName('içerik').setDescription('Duyuru metni').setRequired(true))
        .addStringOption(opt => opt.setName('resim').setDescription('Resim URL'))
        .addStringOption(opt => opt.setName('etiket').setDescription('Etiketlenecek rol'))
        .addChannelOption(opt => opt.setName('kanal').setDescription('Hedef kanal'))
    )
    .addSubcommand(sub =>
      sub.setName('manga')
        .setDescription('Yeni manga bölümü duyurusu yayınlar.')
        .addStringOption(opt => opt.setName('seri').setDescription('Manga serisi adı').setRequired(true))
        .addStringOption(opt => opt.setName('bölüm').setDescription('Bölüm numarası').setRequired(true))
        .addStringOption(opt => opt.setName('link').setDescription('Okuma linki'))
        .addStringOption(opt => opt.setName('kapak').setDescription('Kapak resmi URL'))
    )
    .addSubcommand(sub =>
      sub.setName('anime')
        .setDescription('Anime ile ilgili duyuru yayınlar.')
        .addStringOption(opt => opt.setName('başlık').setDescription('Anime başlığı').setRequired(true))
        .addStringOption(opt => opt.setName('içerik').setDescription('Duyuru içeriği').setRequired(true))
        .addStringOption(opt => opt.setName('resim').setDescription('Resim URL'))
    )
    .addSubcommand(sub =>
      sub.setName('etkinlik')
        .setDescription('Etkinlik duyurusu yayınlar.')
        .addStringOption(opt => opt.setName('isim').setDescription('Etkinlik ismi').setRequired(true))
        .addStringOption(opt => opt.setName('açıklama').setDescription('Etkinlik açıklaması').setRequired(true))
        .addStringOption(opt => opt.setName('tarih').setDescription('Etkinlik tarihi').setRequired(true))
        .addStringOption(opt => opt.setName('resim').setDescription('Etkinlik resmi URL'))
    )
    .addSubcommand(sub =>
      sub.setName('guncelleme')
        .setDescription('Site/sunucu güncelleme duyurusu yayınlar.')
        .addStringOption(opt => opt.setName('versiyon').setDescription('Güncelleme versiyonu').setRequired(true))
        .addStringOption(opt => opt.setName('değişiklikler').setDescription('Değişiklikleri | ile ayırın').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    switch (sub) {
      case 'yayinla': {
        const title = interaction.options.getString('başlık');
        const content = interaction.options.getString('içerik');
        const image = interaction.options.getString('resim');
        const tag = interaction.options.getString('etiket');
        const channel = interaction.options.getChannel('kanal') || interaction.channel;

        const embed = new EmbedBuilder()
          .setTitle(`📢 ${title}`)
          .setDescription(content.replace(/\\n/g, '\n'))
          .setColor(COLORS.PINK)
          .setFooter({ text: `MahoraPeak Haber | Yayınlayan: ${interaction.user.tag}` })
          .setTimestamp();
        if (image) embed.setImage(image);

        await channel.send({ content: tag || null, embeds: [embed] });
        await interaction.editReply({ content: `✅ Duyuru yayınlandı: ${channel}` });
        break;
      }

      case 'manga': {
        const series = interaction.options.getString('seri');
        const chapter = interaction.options.getString('bölüm');
        const link = interaction.options.getString('link') || `https://mahorapeak.com.tr/manga/${series.toLowerCase().replace(/\s+/g, '-')}`;
        const cover = interaction.options.getString('kapak');

        const embed = new EmbedBuilder()
          .setTitle(`📚 ${series} — Bölüm ${chapter} Yayınlandı!`)
          .setDescription(
            `**${series}** serisinin **${chapter}. bölümü** yayınlandı!\n\n` +
            `📖 [Hemen Oku →](${link})\n\n` +
            `*Keyifli okumalar dileriz!*`
          )
          .setColor(COLORS.BLUE)
          .setFooter({ text: 'MahoraPeak Manga — Yeni Bölüm' })
          .setTimestamp();
        if (cover) embed.setThumbnail(cover);

        const duyuruChannel = interaction.guild.channels.cache.find(c => c.name.includes('duyuru') || c.name.includes('manga'));
        const target = duyuruChannel || interaction.channel;
        await target.send({ content: `📚 **Yeni Bölüm!** @everyone`, embeds: [embed] });
        await interaction.editReply({ content: `✅ Manga duyurusu yayınlandı: ${target}` });
        break;
      }

      case 'anime': {
        const title = interaction.options.getString('başlık');
        const content = interaction.options.getString('içerik');
        const image = interaction.options.getString('resim');

        const embed = new EmbedBuilder()
          .setTitle(`🎬 ${title}`)
          .setDescription(content.replace(/\\n/g, '\n'))
          .setColor(COLORS.PURPLE)
          .setFooter({ text: 'MahoraPeak Anime Haberleri' })
          .setTimestamp();
        if (image) embed.setImage(image);

        await interaction.channel.send({ embeds: [embed] });
        await interaction.editReply({ content: '✅ Anime duyurusu yayınlandı!' });
        break;
      }

      case 'etkinlik': {
        const name = interaction.options.getString('isim');
        const desc = interaction.options.getString('açıklama');
        const date = interaction.options.getString('tarih');
        const image = interaction.options.getString('resim');

        const embed = new EmbedBuilder()
          .setTitle(`🎉 ETKİNLİK: ${name}`)
          .setDescription(
            `${desc.replace(/\\n/g, '\n')}\n\n` +
            `📅 **Tarih:** ${date}\n` +
            `📍 **Yer:** MahoraPeak Discord Sunucusu`
          )
          .setColor(COLORS.GREEN)
          .setFooter({ text: 'MahoraPeak Etkinlikler' })
          .setTimestamp();
        if (image) embed.setImage(image);

        await interaction.channel.send({ content: '🎉 **YENİ ETKİNLİK!** @everyone', embeds: [embed] });
        await interaction.editReply({ content: '✅ Etkinlik duyurusu yayınlandı!' });
        break;
      }

      case 'guncelleme': {
        const version = interaction.options.getString('versiyon');
        const changesStr = interaction.options.getString('değişiklikler');
        const changes = changesStr.split('|').map(c => c.trim());
        const changesList = changes.map(c => `• ${c}`).join('\n');

        const embed = new EmbedBuilder()
          .setTitle(`🔄 MahoraPeak Güncelleme v${version}`)
          .setDescription(
            `**Değişiklikler:**\n\n${changesList}\n\n` +
            `*Daha iyi bir deneyim için güncellemeye devam ediyoruz!*`
          )
          .setColor(COLORS.BLUE)
          .setFooter({ text: 'MahoraPeak Geliştirme Ekibi' })
          .setTimestamp();

        await interaction.channel.send({ embeds: [embed] });
        await interaction.editReply({ content: '✅ Güncelleme duyurusu yayınlandı!' });
        break;
      }
    }
  },
};
