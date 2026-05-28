import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getLevelInfo } from '../utils/levelUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('istatistik')
    .setDescription('MahoraPeak web hesabındaki okuma ve XP istatistiklerini gösterir.'),

  async execute(interaction, client) {
    await interaction.deferReply();
    const discord_id = String(interaction.user.id); // Her zaman string yap

    try {
      // 1. Kullanıcıyı discord_id ile bul
      const { data: profile, error: fetchError } = await client.supabase
        .from('profiles')
        .select('id, username, xp, is_elite, reading_streak, discord_id')
        .eq('discord_id', discord_id)
        .maybeSingle(); // single() yerine maybeSingle() - hata fırlatmaz, null döner

      // Debug: Konsolda göster
      if (fetchError) {
        console.error(`[XP istatistik] Supabase fetchError (discord_id: ${discord_id}):`, fetchError);
      }
      if (!profile) {
        console.warn(`[XP istatistik] Profil bulunamadı — discord_id: ${discord_id}`);
        return interaction.editReply({
          content: '❌ Discord hesabın MahoraPeak\'e mühürlü değil!\n\n**Nasıl bağlarım?**\n1️⃣ Siteye gir → Profilim → "Discord Bağla" butonuna tıkla\n2️⃣ Oluşan kodu kopyala\n3️⃣ Buraya `/bağla kod:AP_XXXX` yaz',
        });
      }

      // 2. Okuma geçmişini çek
      const { data: history } = await client.supabase
        .from('reading_history')
        .select('last_read_chapter')
        .eq('user_id', profile.id);

      const totalChapters = history
        ? history.reduce((sum, h) => sum + (h.last_read_chapter || 0), 0)
        : 0;
      const totalSeries = history ? history.length : 0;

      const levelInfo = getLevelInfo(profile.xp || 0, profile.is_elite);

      const embed = new EmbedBuilder()
        .setTitle(`📊 MAHORAPEAK KARARGAH VERİLERİ — ${profile.username}`)
        .setDescription('```ansi\n\u001b[2;34m[ VERİ SENKRONİZASYONU BAŞARILI ]\u001b[0m\n```')
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: '🔱 Seviye & Rütbe', value: `\`Lv. ${levelInfo.level}\` | **${levelInfo.rank}**`, inline: false },
          { name: '⚡ Toplam XP', value: `\`${profile.xp || 0} XP\``, inline: true },
          { name: '🔥 Okuma Serisi', value: `\`${profile.reading_streak || 0} Gün\``, inline: true },
          { name: '📖 Toplam Okuma', value: `\`${totalChapters} Bölüm\` (${totalSeries} Seri)`, inline: true },
        )
        .setColor('#8B5CF6')
        .setFooter({ text: 'MahoraPeak Social Ecosystem — Real-time Statistics' })
        .setTimestamp();

      // İlerleme çubuğu
      if (levelInfo.level < 100) {
        const progress = Math.floor((levelInfo.progress || 0) / 10);
        const bar = '▓'.repeat(progress) + '░'.repeat(10 - progress);
        embed.addFields({
          name: `📈 Seviye İlerlemesi (%${Math.floor(levelInfo.progress || 0)})`,
          value: `\`${bar}\` \`${levelInfo.xpInLevel} / ${levelInfo.xpForNext} XP\``,
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error('[XP] İstatistik hatası:', err);
      await interaction.editReply({ content: '❌ Veriler çekilirken beklenmedik bir hata oluştu!' });
    }
  },
};
