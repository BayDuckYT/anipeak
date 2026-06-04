// ============================================================
//  /report — Rapor/Bug Bildirimi Sistemi
// ============================================================

import { SlashCommandBuilder, MessageFlags, EmbedBuilder, ChannelType } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, RED: 0xFF003C, YELLOW: 0xFFAA00 };

export default {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('🐛 Hata/Rapor bildirimi komutları')
    .addSubcommand(sub =>
      sub.setName('hata')
        .setDescription('Site/bot hatası bildirir.')
        .addStringOption(opt => opt.setName('başlık').setDescription('Hata başlığı').setRequired(true))
        .addStringOption(opt => opt.setName('açıklama').setDescription('Detaylı açıklama').setRequired(true))
        .addStringOption(opt => opt.setName('oncelik').setDescription('Öncelik').addChoices(
          { name: '🟢 Düşük', value: 'dusuk' },
          { name: '🟡 Normal', value: 'normal' },
          { name: '🔴 Yüksek', value: 'yuksek' },
        ))
    )
    .addSubcommand(sub =>
      sub.setName('kullanıcı')
        .setDescription('Bir kullanıcıyı raporlar.')
        .addUserOption(opt => opt.setName('hedef').setDescription('Raporlanacak kullanıcı').setRequired(true))
        .addStringOption(opt => opt.setName('sebep').setDescription('Rapor sebebi').setRequired(true))
        .addStringOption(opt => opt.setName('kanıt').setDescription('Kanıt (mesaj linki vb.)'))
    )
    .addSubcommand(sub =>
      sub.setName('oneri')
        .setDescription('Bir öneri/istek gönderir.')
        .addStringOption(opt => opt.setName('başlık').setDescription('Öneri başlığı').setRequired(true))
        .addStringOption(opt => opt.setName('açıklama').setDescription('Detaylı açıklama').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    // Log kanalını bul
    const logChannel = interaction.guild.channels.cache.find(c =>
      c.name.includes('report') || c.name.includes('rapor') || c.name.includes('log') || c.name.includes('mod-log')
    );

    switch (sub) {
      case 'hata': {
        const title = interaction.options.getString('başlık');
        const desc = interaction.options.getString('açıklama');
        const priority = interaction.options.getString('oncelik') || 'normal';
        const pMap = { dusuk: '🟢 Düşük', normal: '🟡 Normal', yuksek: '🔴 Yüksek' };

        const embed = new EmbedBuilder()
          .setTitle(`🐛 HATA BİLDİRİMİ: ${title}`)
          .setDescription(desc)
          .addFields(
            { name: '📋 Öncelik', value: pMap[priority], inline: true },
            { name: '👤 Bildiren', value: `${interaction.user} (\`${interaction.user.tag}\`)`, inline: true },
            { name: '📅 Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          )
          .setColor(priority === 'yuksek' ? COLORS.RED : COLORS.YELLOW)
          .setTimestamp();

        if (logChannel) await logChannel.send({ embeds: [embed] });
        await interaction.editReply({ content: '✅ Hata bildiriminiz alındı. Ekibimiz en kısa sürede inceleyecek!' });
        break;
      }

      case 'kullanıcı': {
        const target = interaction.options.getUser('hedef');
        const reason = interaction.options.getString('sebep');
        const evidence = interaction.options.getString('kanıt');

        const embed = new EmbedBuilder()
          .setTitle('🚨 KULLANICI RAPORU')
          .addFields(
            { name: '🎯 Raporlanan', value: `${target} (\`${target.tag}\`)`, inline: true },
            { name: '👤 Raporlayan', value: `${interaction.user}`, inline: true },
            { name: '📋 Sebep', value: reason },
          )
          .setColor(COLORS.RED)
          .setTimestamp();

        if (evidence) embed.addFields({ name: '🔗 Kanıt', value: evidence });

        if (logChannel) await logChannel.send({ embeds: [embed] });
        await interaction.editReply({ content: '✅ Rapor alındı. Moderatörler inceleyecek.' });
        break;
      }

      case 'oneri': {
        const title = interaction.options.getString('başlık');
        const desc = interaction.options.getString('açıklama');

        const embed = new EmbedBuilder()
          .setTitle(`💡 ÖNERİ: ${title}`)
          .setDescription(desc)
          .addFields(
            { name: '👤 Öneren', value: `${interaction.user}`, inline: true },
            { name: '📅 Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          )
          .setColor(COLORS.BLUE)
          .setTimestamp();

        const oneriChannel = interaction.guild.channels.cache.find(c => c.name.includes('oneri') || c.name.includes('suggest'));
        const target = oneriChannel || logChannel || interaction.channel;
        await target.send({ embeds: [embed] });
        await interaction.editReply({ content: '✅ Öneriniz gönderildi. Teşekkürler!' });
        break;
      }
    }
  },
};
