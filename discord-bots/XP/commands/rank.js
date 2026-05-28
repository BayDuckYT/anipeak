import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getLevelInfo } from '../utils/levelUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Mevcut seviyeni ve rütbeni gör!')
    .addUserOption(option => option.setName('kullanici').setDescription('Rütbesine bakmak istediğin kullanıcı')),

  async execute(interaction, client) {
    // 1. ANINDA DEFER (Unknown Interaction hatasını önlemek için)
    await interaction.deferReply();
    
    const target = interaction.options.getUser('kullanici') || interaction.user;

    try {
      const { data, error } = await client.supabase
        .from('profiles')
        .select('*')
        .eq('discord_id', target.id)
        .single();

      if (error || !data) {
        return interaction.editReply({ 
          content: target.id === interaction.user.id 
            ? '❌ Henüz hesabını bağlamamışsın! `/link` komutunu kullanarak bağlayabilirsin.' 
            : '❌ Bu kullanıcının bağlı bir MahoraPeak hesabı bulunamadı.' 
        });
      }

      const info = getLevelInfo(data.xp || 0);
      const progressPercent = Math.floor(info.progress || 0);
      
      // Fiyakalı İlerleme Çubuğu
      const filled = Math.min(10, Math.max(0, Math.floor(progressPercent / 10)));
      const progressBar = '▰'.repeat(filled) + '▱'.repeat(10 - filled);

      const embed = new EmbedBuilder()
        .setTitle(`${data.username} — Rütbe Bilgisi`)
        .setDescription(`**${info.rank}**\n${progressBar} %${progressPercent}`)
        .addFields(
          { name: 'Seviye', value: `\`Lv. ${info.level}\``, inline: true },
          { name: 'Mevcut XP', value: `\`${data.xp || 0} XP\``, inline: true },
          { name: 'Kademeli İlerleme', value: info.level === 100 ? '`MAX LEVEL`' : `\`${info.xpInLevel} / ${info.xpForNext} XP\``, inline: true }
        )
        .setThumbnail(target.displayAvatarURL())
        .setColor('#8B5CF6')
        .setFooter({ text: 'MahoraPeak Seviye Sistemi', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error('[XP] Rank komut hatası:', err);
      await interaction.editReply({ content: '❌ Beklenmedik bir hata oluştu!' });
    }
  },
};
