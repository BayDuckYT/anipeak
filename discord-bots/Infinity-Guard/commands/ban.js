// ============================================================
//  /ban — Gelişmiş Ban Yönetim Sistemi
// ============================================================

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';
import { COLORS } from '../utils/config.js';
import { baseEmbed } from '../utils/embeds.js';
import { sendLog } from '../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Ban yönetim komutları')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addSubcommand(sub =>
      sub.setName('ekle')
        .setDescription('Kullanıcıyı sunucudan yasaklar.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Yasaklanacak kullanıcı').setRequired(true))
        .addStringOption(opt => opt.setName('sebep').setDescription('Ban sebebi').setRequired(false))
        .addIntegerOption(opt => opt.setName('mesaj-sil').setDescription('Kaç günlük mesaj silinsin (0-7)').setMinValue(0).setMaxValue(7))
    )
    .addSubcommand(sub =>
      sub.setName('kaldir')
        .setDescription('Kullanıcının banını kaldırır.')
        .addStringOption(opt => opt.setName('kullanıcı-id').setDescription('Kullanıcı ID').setRequired(true))
        .addStringOption(opt => opt.setName('sebep').setDescription('Unban sebebi'))
    )
    .addSubcommand(sub =>
      sub.setName('liste')
        .setDescription('Sunucudaki tüm banlı kullanıcıları listeler.')
    )
    .addSubcommand(sub =>
      sub.setName('toplu')
        .setDescription('Birden fazla kullanıcıyı aynı anda yasaklar.')
        .addStringOption(opt => opt.setName('kullanıcılar').setDescription('ID\'leri boşlukla ayırın').setRequired(true))
        .addStringOption(opt => opt.setName('sebep').setDescription('Ban sebebi'))
    )
    .addSubcommand(sub =>
      sub.setName('yumusak')
        .setDescription('Kullanıcıyı banlayıp hemen unbanlar (mesajları siler).')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Hedef kullanıcı').setRequired(true))
        .addStringOption(opt => opt.setName('sebep').setDescription('Ban sebebi'))
    )
    .addSubcommand(sub =>
      sub.setName('gecici')
        .setDescription('Kullanıcıyı belirli süreliğine yasaklar.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Hedef kullanıcı').setRequired(true))
        .addIntegerOption(opt => opt.setName('süre').setDescription('Süre (saat)').setRequired(true).setMinValue(1).setMaxValue(720))
        .addStringOption(opt => opt.setName('sebep').setDescription('Ban sebebi'))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    switch (sub) {
      case 'ekle': return await banAdd(interaction);
      case 'kaldir': return await banRemove(interaction);
      case 'liste': return await banList(interaction);
      case 'toplu': return await banMass(interaction);
      case 'yumusak': return await banSoft(interaction);
      case 'gecici': return await banTemp(interaction);
    }
  },
};

async function banAdd(interaction) {
  const target = interaction.options.getUser('kullanıcı');
  const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
  const days = interaction.options.getInteger('mesaj-sil') || 1;

  const member = await interaction.guild.members.fetch(target.id).catch(() => null);
  if (member) {
    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.editReply({ embeds: [baseEmbed(COLORS.WARNING).setTitle('⚠️ Yetki Yetersiz').setDescription('Bu kullanıcıyı yasaklayamazsınız.')] });
    }
    if (!member.bannable) {
      return interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ İşlem Başarısız').setDescription('Bu kullanıcı yasaklanamaz.')] });
    }
  }

  const fullReason = `${reason} | Yetkili: ${interaction.user.tag}`;
  await interaction.guild.members.ban(target.id, { reason: fullReason, deleteMessageSeconds: days * 86400 });

  const embed = baseEmbed(COLORS.DANGER)
    .setTitle('🔨 KULLANICI YASAKLANDI')
    .addFields(
      { name: '🎯 Kullanıcı', value: `${target.tag} (\`${target.id}\`)`, inline: true },
      { name: '📋 Sebep', value: `\`${reason}\``, inline: true },
      { name: '👮 Yetkili', value: `${interaction.user}`, inline: true },
      { name: '🗑️ Mesaj Silme', value: `\`${days} gün\``, inline: true },
    );

  await interaction.editReply({ embeds: [embed] });
  await sendLog(interaction.guild, embed);
}

async function banRemove(interaction) {
  const userId = interaction.options.getString('kullanıcı-id').trim();
  const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

  try {
    await interaction.guild.bans.remove(userId, `${reason} | Yetkili: ${interaction.user.tag}`);
    const embed = baseEmbed(COLORS.SUCCESS)
      .setTitle('✅ BAN KALDIRILDI')
      .addFields(
        { name: '🎯 Kullanıcı ID', value: `\`${userId}\``, inline: true },
        { name: '📋 Sebep', value: `\`${reason}\``, inline: true },
        { name: '👮 Yetkili', value: `${interaction.user}`, inline: true },
      );
    await interaction.editReply({ embeds: [embed] });
    await sendLog(interaction.guild, embed);
  } catch {
    await interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Hata').setDescription('Bu kullanıcının banı bulunamadı.')] });
  }
}

async function banList(interaction) {
  const bans = await interaction.guild.bans.fetch();
  if (bans.size === 0) {
    return interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Temiz').setDescription('Sunucuda banlı kullanıcı yok.')] });
  }

  const list = bans.first(25).map((b, i) => `**${i + 1}.** ${b.user.tag} — \`${b.reason || 'Sebep yok'}\``).join('\n');
  const embed = baseEmbed(COLORS.CYBER_BLUE)
    .setTitle(`📋 BAN LİSTESİ (${bans.size} kişi)`)
    .setDescription(list);

  await interaction.editReply({ embeds: [embed] });
}

async function banMass(interaction) {
  const ids = interaction.options.getString('kullanıcılar').split(/\s+/);
  const reason = interaction.options.getString('sebep') || 'Toplu ban';

  let success = 0, failed = 0;
  for (const id of ids) {
    try {
      await interaction.guild.members.ban(id.trim(), { reason: `${reason} | Yetkili: ${interaction.user.tag}` });
      success++;
    } catch { failed++; }
  }

  const embed = baseEmbed(success > 0 ? COLORS.SUCCESS : COLORS.DANGER)
    .setTitle('🔨 TOPLU BAN SONUÇLARI')
    .addFields(
      { name: '✅ Başarılı', value: `\`${success}\``, inline: true },
      { name: '❌ Başarısız', value: `\`${failed}\``, inline: true },
    );

  await interaction.editReply({ embeds: [embed] });
  await sendLog(interaction.guild, embed);
}

async function banSoft(interaction) {
  const target = interaction.options.getUser('kullanıcı');
  const reason = interaction.options.getString('sebep') || 'Soft ban (mesaj temizleme)';

  try {
    await interaction.guild.members.ban(target.id, { reason: `[SOFTBAN] ${reason}`, deleteMessageSeconds: 7 * 86400 });
    await interaction.guild.bans.remove(target.id, 'Soft ban — otomatik unban');

    const embed = baseEmbed(COLORS.WARNING)
      .setTitle('🔨 SOFT BAN UYGULANANDI')
      .setDescription('Kullanıcı banlanıp hemen unbanlandı. Son 7 günlük mesajları silindi.')
      .addFields(
        { name: '🎯 Kullanıcı', value: `${target.tag}`, inline: true },
        { name: '📋 Sebep', value: `\`${reason}\``, inline: true },
      );

    await interaction.editReply({ embeds: [embed] });
    await sendLog(interaction.guild, embed);
  } catch (err) {
    await interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Hata').setDescription(err.message)] });
  }
}

async function banTemp(interaction) {
  const target = interaction.options.getUser('kullanıcı');
  const hours = interaction.options.getInteger('süre');
  const reason = interaction.options.getString('sebep') || `Geçici ban (${hours} saat)`;

  try {
    await interaction.guild.members.ban(target.id, { reason: `[TEMPBAN ${hours}h] ${reason} | Yetkili: ${interaction.user.tag}` });

    // Otomatik unban zamanlayıcısı
    setTimeout(async () => {
      try {
        await interaction.guild.bans.remove(target.id, `Geçici ban süresi doldu (${hours} saat)`);
        console.log(`[Infinity-Guard] ⏰ Geçici ban süresi doldu: ${target.tag}`);
      } catch {}
    }, hours * 60 * 60 * 1000);

    const embed = baseEmbed(COLORS.DANGER)
      .setTitle('⏰ GEÇİCİ BAN UYGULANANDI')
      .addFields(
        { name: '🎯 Kullanıcı', value: `${target.tag}`, inline: true },
        { name: '⏱️ Süre', value: `\`${hours} saat\``, inline: true },
        { name: '📋 Sebep', value: `\`${reason}\``, inline: true },
      );

    await interaction.editReply({ embeds: [embed] });
    await sendLog(interaction.guild, embed);
  } catch (err) {
    await interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Hata').setDescription(err.message)] });
  }
}
