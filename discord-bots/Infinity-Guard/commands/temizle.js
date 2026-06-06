import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { hasPermission } from '../utils/permissions.js';
import { purgeSuccessEmbed, baseEmbed } from '../utils/embeds.js';
import { COLORS } from '../utils/config.js';
import { sendLog } from '../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('temizle')
    .setDescription('Belirtilen miktarda mesajı siler (1-100).')
    
    .addIntegerOption((option) =>
      option
        .setName('miktar')
        .setDescription('Silinecek mesaj sayısı')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    const miktar = interaction.options.getInteger('miktar');

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    if (!hasPermission(interaction.member, 'MOD')) return interaction.editReply ? await interaction.editReply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.' }).catch(()=>null) : await interaction.reply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.', ephemeral: true });


    try {
      const deleted = await interaction.channel.bulkDelete(miktar, true);
      const embed = purgeSuccessEmbed(deleted.size, interaction.user);

      await interaction.editReply({ embeds: [embed] });
      await sendLog(interaction.guild, embed);
    } catch (err) {
      await interaction.editReply({
        embeds: [
          baseEmbed(COLORS.DANGER)
            .setTitle('❌ Temizleme Hatası')
            .setDescription(`\`${err.message}\``),
        ],
      });
    }
  },
};
