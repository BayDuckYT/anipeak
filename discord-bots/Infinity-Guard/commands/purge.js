// ============================================================
//  /purge — Gelişmiş Toplu Mesaj Silme Sistemi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { COLORS } from '../utils/config.js';
import { baseEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('🧹 Gelişmiş toplu mesaj silme')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub.setName('miktar')
        .setDescription('Belirtilen sayıda mesaj siler.')
        .addIntegerOption(opt => opt.setName('sayı').setDescription('Silinecek mesaj sayısı (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('kullanıcı')
        .setDescription('Belirli bir kullanıcının mesajlarını siler.')
        .addUserOption(opt => opt.setName('hedef').setDescription('Mesajları silinecek kullanıcı').setRequired(true))
        .addIntegerOption(opt => opt.setName('sayı').setDescription('Taranacak mesaj sayısı (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('botlar')
        .setDescription('Sadece bot mesajlarını siler.')
        .addIntegerOption(opt => opt.setName('sayı').setDescription('Taranacak mesaj sayısı').setRequired(true).setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('linkler')
        .setDescription('Link içeren mesajları siler.')
        .addIntegerOption(opt => opt.setName('sayı').setDescription('Taranacak mesaj sayısı').setRequired(true).setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('embedler')
        .setDescription('Embed içeren mesajları siler.')
        .addIntegerOption(opt => opt.setName('sayı').setDescription('Taranacak mesaj sayısı').setRequired(true).setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('dosyalar')
        .setDescription('Dosya/resim içeren mesajları siler.')
        .addIntegerOption(opt => opt.setName('sayı').setDescription('Taranacak mesaj sayısı').setRequired(true).setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('icerik')
        .setDescription('Belirli bir kelime içeren mesajları siler.')
        .addStringOption(opt => opt.setName('kelime').setDescription('Aranacak kelime').setRequired(true))
        .addIntegerOption(opt => opt.setName('sayı').setDescription('Taranacak mesaj sayısı').setRequired(true).setMinValue(1).setMaxValue(100))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const count = interaction.options.getInteger('sayı');
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    try {
      const messages = await interaction.channel.messages.fetch({ limit: count });
      let toDelete;

      switch (sub) {
        case 'miktar':
          toDelete = messages;
          break;
        case 'kullanıcı':
          const targetUser = interaction.options.getUser('hedef');
          toDelete = messages.filter(m => m.author.id === targetUser.id);
          break;
        case 'botlar':
          toDelete = messages.filter(m => m.author.bot);
          break;
        case 'linkler':
          toDelete = messages.filter(m => /https?:\/\/[^\s]+/gi.test(m.content));
          break;
        case 'embedler':
          toDelete = messages.filter(m => m.embeds.length > 0);
          break;
        case 'dosyalar':
          toDelete = messages.filter(m => m.attachments.size > 0);
          break;
        case 'icerik':
          const keyword = interaction.options.getString('kelime').toLowerCase();
          toDelete = messages.filter(m => m.content.toLowerCase().includes(keyword));
          break;
      }

      // 14 günden eski mesajları filtrele (Discord API limiti)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const filteredMessages = toDelete.filter(m => m.createdTimestamp > twoWeeksAgo);

      const deleted = await interaction.channel.bulkDelete(filteredMessages, true);

      const embed = baseEmbed(COLORS.SUCCESS)
        .setTitle('🧹 MESAJLAR TEMİZLENDİ')
        .addFields(
          { name: '🗑️ Silinen', value: `\`${deleted.size}\` mesaj`, inline: true },
          { name: '📋 Filtre', value: `\`${sub}\``, inline: true },
          { name: '👮 Yetkili', value: `${interaction.user}`, inline: true },
        );

      await interaction.editReply({ embeds: [embed] });
      await sendLog(interaction.guild, embed);
    } catch (err) {
      await interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Temizleme Hatası').setDescription(`\`${err.message}\``)] });
    }
  },
};
