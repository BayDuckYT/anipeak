// ============================================================
//  /xp-ayar — XP Ayarları Yönetimi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { hasPermission } from '../utils/permissions.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, RED: 0xFF003C, PURPLE: 0x8A2BE2 };

// In-memory ayarlar
const xpSettings = new Map();

function getGuildSettings(guildId) {
  if (!xpSettings.has(guildId)) {
    xpSettings.set(guildId, {
      minXP: 15,
      maxXP: 25,
      cooldown: 60000, // 1 dakika
      levelUpChannel: null,
      levelUpMessage: '🎉 Tebrikler {user}! **Seviye {level}** oldun!',
      ignoredChannels: new Set(),
      ignoredRoles: new Set(),
      multiplier: 1.0,
      channelMultipliers: new Map(),
      roleMultipliers: new Map(),
    });
  }
  return xpSettings.get(guildId);
}

export default {
  data: new SlashCommandBuilder()
    .setName('xp-ayar')
    .setDescription('⚙️ XP sistemi ayarları')
    
    .addSubcommand(sub =>
      sub.setName('durum')
        .setDescription('Mevcut XP ayarlarını gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('min-max')
        .setDescription('Mesaj başına min/max XP ayarlar.')
        .addIntegerOption(opt => opt.setName('min').setDescription('Minimum XP').setRequired(true).setMinValue(1).setMaxValue(100))
        .addIntegerOption(opt => opt.setName('max').setDescription('Maximum XP').setRequired(true).setMinValue(1).setMaxValue(500))
    )
    .addSubcommand(sub =>
      sub.setName('cooldown')
        .setDescription('XP cooldown süresini ayarlar.')
        .addIntegerOption(opt => opt.setName('saniye').setDescription('Cooldown (saniye)').setRequired(true).setMinValue(10).setMaxValue(600))
    )
    .addSubcommand(sub =>
      sub.setName('carpan')
        .setDescription('Global XP çarpanını ayarlar.')
        .addNumberOption(opt => opt.setName('carpan').setDescription('XP çarpanı (1.0 = normal)').setRequired(true).setMinValue(0.1).setMaxValue(10.0))
    )
    .addSubcommand(sub =>
      sub.setName('kanal-engelle')
        .setDescription('Bir kanalda XP kazanımını engeller.')
        .addChannelOption(opt => opt.setName('kanal').setDescription('Engellenecek kanal').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('kanal-ac')
        .setDescription('Bir kanalda XP engelini kaldırır.')
        .addChannelOption(opt => opt.setName('kanal').setDescription('Açılacak kanal').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('seviye-mesaj')
        .setDescription('Seviye atlama mesajını ayarlar.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Mesaj ({user}, {level} değişkenlerini kullanın)').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('seviye-kanal')
        .setDescription('Seviye atlama mesajlarının gideceği kanalı ayarlar.')
        .addChannelOption(opt => opt.setName('kanal').setDescription('Seviye mesaj kanalı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('kanal-carpan')
        .setDescription('Belirli bir kanala XP çarpanı ayarlar.')
        .addChannelOption(opt => opt.setName('kanal').setDescription('Hedef kanal').setRequired(true))
        .addNumberOption(opt => opt.setName('carpan').setDescription('XP çarpanı').setRequired(true).setMinValue(0.0).setMaxValue(10.0))
    )
    .addSubcommand(sub =>
      sub.setName('rol-carpan')
        .setDescription('Belirli bir role XP çarpanı ayarlar.')
        .addRoleOption(opt => opt.setName('rol').setDescription('Hedef rol').setRequired(true))
        .addNumberOption(opt => opt.setName('carpan').setDescription('XP çarpanı').setRequired(true).setMinValue(0.0).setMaxValue(10.0))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = getGuildSettings(interaction.guild.id);
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    if (!hasPermission(interaction.member, 'BYK')) return interaction.editReply ? await interaction.editReply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.' }).catch(()=>null) : await interaction.reply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.', ephemeral: true });


    switch (sub) {
      case 'durum': {
        const ignoredList = [...settings.ignoredChannels].map(id => `<#${id}>`).join(', ') || '*Yok*';

        const embed = new EmbedBuilder()
          .setTitle('⚙️ XP AYARLARI')
          .addFields(
            { name: '📊 Min XP', value: `\`${settings.minXP}\``, inline: true },
            { name: '📊 Max XP', value: `\`${settings.maxXP}\``, inline: true },
            { name: '⏱️ Cooldown', value: `\`${settings.cooldown / 1000}s\``, inline: true },
            { name: '✖️ Global Çarpan', value: `\`${settings.multiplier}x\``, inline: true },
            { name: '📢 Seviye Kanalı', value: settings.levelUpChannel ? `<#${settings.levelUpChannel}>` : '*Aynı kanal*', inline: true },
            { name: '🚫 Engelli Kanallar', value: ignoredList },
            { name: '💬 Seviye Mesajı', value: `\`${settings.levelUpMessage}\`` },
          )
          .setColor(COLORS.BLUE)
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'min-max': {
        const min = interaction.options.getInteger('min');
        const max = interaction.options.getInteger('max');
        if (min > max) return interaction.editReply({ content: '❌ Min değer max\'tan büyük olamaz.' });
        settings.minXP = min;
        settings.maxXP = max;
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ XP Aralığı Güncellendi').setDescription(`Min: \`${min}\` — Max: \`${max}\``).setColor(COLORS.GREEN)] });
        break;
      }

      case 'cooldown': {
        const seconds = interaction.options.getInteger('saniye');
        settings.cooldown = seconds * 1000;
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Cooldown Güncellendi').setDescription(`\`${seconds}\` saniye`).setColor(COLORS.GREEN)] });
        break;
      }

      case 'carpan': {
        const mul = interaction.options.getNumber('carpan');
        settings.multiplier = mul;
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ XP Çarpanı Güncellendi').setDescription(`\`${mul}x\``).setColor(COLORS.GREEN)] });
        break;
      }

      case 'kanal-engelle': {
        const ch = interaction.options.getChannel('kanal');
        settings.ignoredChannels.add(ch.id);
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('🚫 Kanal Engellendi').setDescription(`${ch} artık XP kazandırmaz.`).setColor(COLORS.RED)] });
        break;
      }

      case 'kanal-ac': {
        const ch = interaction.options.getChannel('kanal');
        settings.ignoredChannels.delete(ch.id);
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Kanal Açıldı').setDescription(`${ch} artık XP kazandırır.`).setColor(COLORS.GREEN)] });
        break;
      }

      case 'seviye-mesaj': {
        const msg = interaction.options.getString('mesaj');
        settings.levelUpMessage = msg;
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Seviye Mesajı Güncellendi').setDescription(`\`${msg}\``).setColor(COLORS.GREEN)] });
        break;
      }

      case 'seviye-kanal': {
        const ch = interaction.options.getChannel('kanal');
        settings.levelUpChannel = ch.id;
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Seviye Kanalı Ayarlandı').setDescription(`Seviye mesajları ${ch} kanalına gidecek.`).setColor(COLORS.GREEN)] });
        break;
      }

      case 'kanal-carpan': {
        const ch = interaction.options.getChannel('kanal');
        const mul = interaction.options.getNumber('carpan');
        settings.channelMultipliers.set(ch.id, mul);
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Kanal Çarpanı Ayarlandı').setDescription(`${ch} → \`${mul}x\``).setColor(COLORS.GREEN)] });
        break;
      }

      case 'rol-carpan': {
        const role = interaction.options.getRole('rol');
        const mul = interaction.options.getNumber('carpan');
        settings.roleMultipliers.set(role.id, mul);
        await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Rol Çarpanı Ayarlandı').setDescription(`${role} → \`${mul}x\``).setColor(COLORS.GREEN)] });
        break;
      }
    }
  },
};
