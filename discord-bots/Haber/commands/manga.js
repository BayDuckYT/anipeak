// ============================================================
//  /manga — Manga Bilgi & Arama Sistemi
// ============================================================

import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, PINK: 0xFF10F0, GREEN: 0x00FF88 };

export default {
  data: new SlashCommandBuilder()
    .setName('manga')
    .setDescription('📚 Manga bilgi ve arama komutları')
    .addSubcommand(sub =>
      sub.setName('ara')
        .setDescription('Manga arar.')
        .addStringOption(opt => opt.setName('isim').setDescription('Manga ismi').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('yeni')
        .setDescription('Son eklenen mangaları gösterir.')
        .addIntegerOption(opt => opt.setName('sayı').setDescription('Kaç manga gösterilsin').setMinValue(1).setMaxValue(25))
    )
    .addSubcommand(sub =>
      sub.setName('populer')
        .setDescription('En popüler mangaları gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('rastgele')
        .setDescription('Rastgele manga önerir.')
    )
    .addSubcommand(sub =>
      sub.setName('oneri')
        .setDescription('Bir manga önerir.')
        .addStringOption(opt => opt.setName('tür').setDescription('Manga türü').setRequired(true)
          .addChoices(
            { name: 'Aksiyon', value: 'action' },
            { name: 'Romantik', value: 'romance' },
            { name: 'Komedi', value: 'comedy' },
            { name: 'Dram', value: 'drama' },
            { name: 'Fantastik', value: 'fantasy' },
            { name: 'Korku', value: 'horror' },
            { name: 'Isekai', value: 'isekai' },
          ))
    )
    .addSubcommand(sub =>
      sub.setName('istatistik')
        .setDescription('MahoraPeak manga istatistiklerini gösterir.')
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const supabase = client.supabase;
    if (!supabase) return interaction.editReply({ content: '❌ Veritabanı bağlantısı kurulamadı.' });

    switch (sub) {
      case 'ara': {
        const name = interaction.options.getString('isim');
        const { data, error } = await supabase.from('series').select('*').ilike('title', `%${name}%`).limit(10);
        if (error || !data?.length) return interaction.editReply({ content: '❌ Manga bulunamadı.' });

        const list = data.map((m, i) => `**${i + 1}.** [${m.title}](https://mahorapeak.com.tr/manga/${m.slug || m.id}) — ${m.status || 'Devam ediyor'}`).join('\n');
        const embed = new EmbedBuilder()
          .setTitle(`🔍 Arama Sonuçları: "${name}"`)
          .setDescription(list)
          .setColor(COLORS.BLUE)
          .setFooter({ text: `${data.length} sonuç bulundu` });
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'yeni': {
        const limit = interaction.options.getInteger('sayı') || 10;
        const { data } = await supabase.from('series').select('*').order('created_at', { ascending: false }).limit(limit);
        if (!data?.length) return interaction.editReply({ content: '❌ Manga bulunamadı.' });

        const list = data.map((m, i) => `**${i + 1}.** ${m.title} — <t:${Math.floor(new Date(m.created_at).getTime() / 1000)}:R>`).join('\n');
        const embed = new EmbedBuilder()
          .setTitle(`📚 Son Eklenen Mangalar (${data.length})`)
          .setDescription(list)
          .setColor(COLORS.GREEN)
          .setFooter({ text: 'MahoraPeak Manga Kütüphanesi' });
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'populer': {
        const { data } = await supabase.from('series').select('*').order('views', { ascending: false }).limit(10);
        if (!data?.length) return interaction.editReply({ content: '❌ Veri bulunamadı.' });

        const list = data.map((m, i) => {
          const medals = ['🥇', '🥈', '🥉'];
          const prefix = i < 3 ? medals[i] : `**${i + 1}.**`;
          return `${prefix} ${m.title} — \`${m.views || 0}\` görüntülenme`;
        }).join('\n');

        const embed = new EmbedBuilder()
          .setTitle('🏆 EN POPÜLER MANGALAR')
          .setDescription(list)
          .setColor(COLORS.PINK)
          .setFooter({ text: 'MahoraPeak Top 10' });
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'rastgele': {
        const { count } = await supabase.from('series').select('*', { count: 'exact', head: true });
        const randomOffset = Math.floor(Math.random() * (count || 1));
        const { data } = await supabase.from('series').select('*').range(randomOffset, randomOffset).limit(1);

        if (!data?.length) return interaction.editReply({ content: '❌ Manga bulunamadı.' });
        const m = data[0];

        const embed = new EmbedBuilder()
          .setTitle(`🎲 Rastgele Öneri: ${m.title}`)
          .setDescription(m.description?.substring(0, 500) || '*Açıklama yok*')
          .setColor(COLORS.BLUE)
          .setFooter({ text: `📚 ${m.status || 'Devam Ediyor'} | MahoraPeak` });
        if (m.cover_image) embed.setThumbnail(m.cover_image);
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'oneri': {
        const genre = interaction.options.getString('tür');
        const genreNames = { action: 'Aksiyon', romance: 'Romantik', comedy: 'Komedi', drama: 'Dram', fantasy: 'Fantastik', horror: 'Korku', isekai: 'Isekai' };

        const { data } = await supabase.from('series').select('*').contains('genres', [genre]).limit(5);
        if (!data?.length) {
          // Fallback: tüm mangalardan rastgele seç
          const { data: fallback } = await supabase.from('series').select('*').limit(5);
          if (!fallback?.length) return interaction.editReply({ content: '❌ Manga bulunamadı.' });

          const list = fallback.map((m, i) => `**${i + 1}.** ${m.title}`).join('\n');
          return interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`📖 ${genreNames[genre] || genre} Önerileri`).setDescription(list).setColor(COLORS.BLUE)] });
        }

        const list = data.map((m, i) => `**${i + 1}.** ${m.title}`).join('\n');
        const embed = new EmbedBuilder()
          .setTitle(`📖 ${genreNames[genre] || genre} Manga Önerileri`)
          .setDescription(list)
          .setColor(COLORS.BLUE);
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'istatistik': {
        const { count: seriesCount } = await supabase.from('series').select('*', { count: 'exact', head: true });
        const { count: chapterCount } = await supabase.from('chapters').select('*', { count: 'exact', head: true });
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

        const embed = new EmbedBuilder()
          .setTitle('📊 MAHORAPEAK MANGA İSTATİSTİKLERİ')
          .addFields(
            { name: '📚 Toplam Manga', value: `\`${seriesCount || 0}\``, inline: true },
            { name: '📖 Toplam Bölüm', value: `\`${chapterCount || 0}\``, inline: true },
            { name: '👥 Toplam Üye', value: `\`${userCount || 0}\``, inline: true },
          )
          .setColor(COLORS.BLUE)
          .setFooter({ text: 'MahoraPeak — Canlı Veriler' })
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  },
};
