// ============================================================
//  /abone — Manga Yeni Bölüm Abonelik Sistemi
// ============================================================

import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, PINK: 0xFF10F0, GREEN: 0x00FF88, RED: 0xFF003C };

export default {
  data: new SlashCommandBuilder()
    .setName('abone')
    .setDescription('🔔 Yeni manga bölümleri için abonelik sistemi')
    .addSubcommand(sub =>
      sub.setName('ol')
        .setDescription('Bir seriye abone olursun.')
        .addStringOption(opt => opt.setName('seri').setDescription('Seri adı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('iptal')
        .setDescription('Bir seriden aboneliğini iptal edersin.')
        .addStringOption(opt => opt.setName('seri').setDescription('Seri adı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('listem')
        .setDescription('Abone olduğun serileri gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('hepsini-iptal')
        .setDescription('Tüm aboneliklerini iptal eder.')
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const supabase = client.supabase;
    if (!supabase) return interaction.editReply({ content: '❌ Veritabanı bağlantısı kurulamadı.' });

    const discordId = interaction.user.id;
    // Find profile
    const { data: link } = await supabase.from('discord_links').select('profile_id').eq('discord_id', discordId).single();
    if (!link) return interaction.editReply({ content: '❌ Abonelik sistemi için Discord hesabınızı siteye bağlamanız gerekmektedir.' });

    const profileId = link.profile_id;

    switch (sub) {
      case 'ol': {
        const seriesName = interaction.options.getString('seri');
        // Find series
        const { data: series } = await supabase.from('series').select('id, title').ilike('title', `%${seriesName}%`).limit(1).single();
        if (!series) return interaction.editReply({ content: `❌ "${seriesName}" adında bir seri bulunamadı.` });

        // Check if already subscribed
        const { data: existing } = await supabase.from('bookmarks').select('id').eq('profile_id', profileId).eq('series_id', series.id).single();
        
        if (existing) {
          return interaction.editReply({ content: `⚠️ Zaten **${series.title}** serisine abonesiniz.` });
        }

        // Subscribe (Add to bookmarks)
        await supabase.from('bookmarks').insert([{ profile_id: profileId, series_id: series.id }]);

        const embed = new EmbedBuilder()
          .setTitle('🔔 Abonelik Başarılı!')
          .setDescription(`**${series.title}** serisine abone oldunuz. Yeni bölüm geldiğinde size bildirim göndereceğiz.`)
          .setColor(COLORS.GREEN);
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'iptal': {
        const seriesName = interaction.options.getString('seri');
        const { data: series } = await supabase.from('series').select('id, title').ilike('title', `%${seriesName}%`).limit(1).single();
        if (!series) return interaction.editReply({ content: `❌ "${seriesName}" adında bir seri bulunamadı.` });

        const { error } = await supabase.from('bookmarks').delete().eq('profile_id', profileId).eq('series_id', series.id);
        
        if (error) {
          return interaction.editReply({ content: '❌ Abonelik iptal edilirken bir hata oluştu.' });
        }

        const embed = new EmbedBuilder()
          .setTitle('🔕 Abonelik İptal Edildi')
          .setDescription(`**${series.title}** serisi aboneliklerinizden çıkarıldı.`)
          .setColor(COLORS.RED);
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'listem': {
        const { data: bookmarks } = await supabase.from('bookmarks').select('series(title)').eq('profile_id', profileId);
        
        if (!bookmarks || bookmarks.length === 0) {
          return interaction.editReply({ content: '❌ Hiçbir seriye abone değilsiniz.' });
        }

        const list = bookmarks.map((b, i) => `**${i + 1}.** ${b.series.title}`).join('\n');
        const embed = new EmbedBuilder()
          .setTitle('📚 Abonelikleriniz')
          .setDescription(list)
          .setColor(COLORS.PINK)
          .setFooter({ text: `Toplam ${bookmarks.length} abonelik` });
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'hepsini-iptal': {
        await supabase.from('bookmarks').delete().eq('profile_id', profileId);
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('🗑️ Tüm Abonelikler İptal Edildi').setDescription('Artık hiçbir seriden bildirim almayacaksınız.').setColor(COLORS.RED)] });
        break;
      }
    }
  },
};
