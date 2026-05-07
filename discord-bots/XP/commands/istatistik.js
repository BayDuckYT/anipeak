import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { getLevelInfo } from '../utils/levelUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('istatistik')
    .setDescription('AniPeak web hesabındaki okuma ve XP istatistiklerini gösterir.'),

  async execute(interaction, client) {
    await interaction.deferReply();
    const discord_id = interaction.user.id;

    try {
      // 1. Kullanıcıyı bul
      const { data: profile, error: fetchError } = await client.supabase
        .from('profiles')
        .select('*')
        .eq('discord_id', discord_id)
        .single();

      if (fetchError || !profile) {
        return interaction.editReply({ 
          content: '❌ Hesabın henüz mühürlenmemiş uşağım! Siteden mühür kodu alıp `/bağla` komutunu kullanmalısın.' 
        });
      }

      // 2. Okuma geçmişini çek (Toplam okunan bölüm sayısı için)
      const { data: history, error: histError } = await client.supabase
        .from('reading_history')
        .select('last_read_chapter')
        .eq('user_id', profile.id);

      const totalChapters = history ? history.reduce((sum, h) => sum + (h.last_read_chapter || 0), 0) : 0;
      const totalSeries = history ? history.length : 0;

      const levelInfo = getLevelInfo(profile.xp, profile.is_elite);

      const embed = new EmbedBuilder()
        .setTitle(`📊 ANIPEAK KARARGAH VERİLERİ — ${profile.username}`)
        .setDescription('```ansi\n\u001b[2;34m[ VERİ SENKRONİZASYONU BAŞARILI ]\u001b[0m\n```')
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: '🔱 Seviye & Rütbe', value: `\`Lv. ${levelInfo.level}\` | **${levelInfo.rank}**`, inline: false },
          { name: '⚡ Toplam XP', value: `\`${profile.xp} XP\``, inline: true },
          { name: '🔥 Okuma Serisi', value: `\`${profile.reading_streak || 0} Gün\``, inline: true },
          { name: '📖 Toplam Okuma', value: `\`${totalChapters} Bölüm\` (${totalSeries} Seri)`, inline: true },
        )
        .setColor('#8B5CF6')
        .setFooter({ text: 'AniPeak Social Ecosystem — Real-time Statistics' })
        .setTimestamp();

      // İlerleme çubuğu
      if (levelInfo.level < 100) {
        const progress = Math.floor(levelInfo.progress / 10);
        const bar = '▓'.repeat(progress) + '░'.repeat(10 - progress);
        embed.addFields({ name: `📈 Seviye İlerlemesi (%${Math.floor(levelInfo.progress)})`, value: `\`${bar}\` \`${levelInfo.xpInLevel} / ${levelInfo.xpForNext} XP\`` });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error('[XP] İstatistik hatası:', err);
      await interaction.editReply({ content: '❌ Veriler çekilirken bir hata oluştu!' });
    }
  },
};
