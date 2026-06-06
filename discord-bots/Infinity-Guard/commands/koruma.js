// ============================================================
//  /koruma — Gelişmiş Sunucu Koruması (Anti-Raid/Nuke)
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { hasPermission } from '../utils/permissions.js';
import { COLORS } from '../utils/config.js';
import { baseEmbed } from '../utils/embeds.js';
import { getSettings, saveSettings } from '../utils/settingsManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('koruma')
    .setDescription('🛡️ Gelişmiş sunucu koruma ayarları')
    
    .addSubcommand(sub =>
      sub.setName('durum')
        .setDescription('Tüm koruma modüllerinin durumunu gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('anti-raid')
        .setDescription('Sunucuya ani bot/üye saldırılarını engeller.')
        .addBooleanOption(opt => opt.setName('durum').setDescription('Aç/Kapat').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('anti-nuke')
        .setDescription('Toplu kanal/rol silme işlemlerini engeller ve yapanı banlar.')
        .addBooleanOption(opt => opt.setName('durum').setDescription('Aç/Kapat').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('anti-bot')
        .setDescription('Sunucuya doğrulanmamış botların eklenmesini engeller.')
        .addBooleanOption(opt => opt.setName('durum').setDescription('Aç/Kapat').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('fake-hesap')
        .setDescription('Yeni açılmış (fake) hesapların sunucuya girmesini engeller.')
        .addIntegerOption(opt => opt.setName('gün').setDescription('Hesap minimum kaç günlük olmalı (0 = kapalı)').setRequired(true).setMinValue(0).setMaxValue(30))
    )
    .addSubcommand(sub =>
      sub.setName('beyaz-liste')
        .setDescription('Bir kullanıcıyı koruma sistemlerinden muaf tutar (Güvenli liste).')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Muaf tutulacak kullanıcı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('beyaz-liste-cikar')
        .setDescription('Kullanıcıyı beyaz listeden çıkarır.')
        .addUserOption(opt => opt.setName('kullanıcı').setDescription('Çıkarılacak kullanıcı').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    if (!hasPermission(interaction.member, 'BYK')) return interaction.editReply ? await interaction.editReply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.' }).catch(()=>null) : await interaction.reply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.', ephemeral: true });


    const settings = getSettings();
    if (!settings.protection) {
      settings.protection = { antiRaid: false, antiNuke: false, antiBot: false, fakeAccountDays: 0, whitelist: [] };
    }
    const p = settings.protection;

    switch (sub) {
      case 'durum': {
        const embed = baseEmbed(COLORS.CYBER_BLUE)
          .setTitle('🛡️ SUNUCU KORUMA DURUMU')
          .addFields(
            { name: '🚨 Anti-Raid', value: p.antiRaid ? '✅ Aktif' : '❌ Kapalı', inline: true },
            { name: '☢️ Anti-Nuke', value: p.antiNuke ? '✅ Aktif' : '❌ Kapalı', inline: true },
            { name: '🤖 Anti-Bot', value: p.antiBot ? '✅ Aktif' : '❌ Kapalı', inline: true },
            { name: '👤 Fake Hesap', value: p.fakeAccountDays > 0 ? `✅ Aktif (${p.fakeAccountDays} Gün)` : '❌ Kapalı', inline: true },
          );

        if (p.whitelist && p.whitelist.length > 0) {
          const wl = p.whitelist.map(id => `<@${id}>`).join(', ');
          embed.addFields({ name: '🌟 Beyaz Liste (Güvenli)', value: wl });
        }

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'anti-raid': {
        p.antiRaid = interaction.options.getBoolean('durum');
        saveSettings(settings);
        await interaction.editReply({ embeds: [baseEmbed(p.antiRaid ? COLORS.SUCCESS : COLORS.WARNING).setTitle(`🚨 Anti-Raid ${p.antiRaid ? 'AÇILDI' : 'KAPATILDI'}`)] });
        break;
      }

      case 'anti-nuke': {
        p.antiNuke = interaction.options.getBoolean('durum');
        saveSettings(settings);
        await interaction.editReply({ embeds: [baseEmbed(p.antiNuke ? COLORS.SUCCESS : COLORS.WARNING).setTitle(`☢️ Anti-Nuke ${p.antiNuke ? 'AÇILDI' : 'KAPATILDI'}`)] });
        break;
      }

      case 'anti-bot': {
        p.antiBot = interaction.options.getBoolean('durum');
        saveSettings(settings);
        await interaction.editReply({ embeds: [baseEmbed(p.antiBot ? COLORS.SUCCESS : COLORS.WARNING).setTitle(`🤖 Anti-Bot ${p.antiBot ? 'AÇILDI' : 'KAPATILDI'}`)] });
        break;
      }

      case 'fake-hesap': {
        const days = interaction.options.getInteger('gün');
        p.fakeAccountDays = days;
        saveSettings(settings);
        if (days === 0) {
          await interaction.editReply({ embeds: [baseEmbed(COLORS.WARNING).setTitle('👤 Fake Hesap Koruması KAPATILDI')] });
        } else {
          await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('👤 Fake Hesap Koruması AÇILDI').setDescription(`Bundan sonra sunucuya girecek hesaplar en az **${days} günlük** olmalıdır.`)] });
        }
        break;
      }

      case 'beyaz-liste': {
        const user = interaction.options.getUser('kullanıcı');
        if (!p.whitelist.includes(user.id)) {
          p.whitelist.push(user.id);
          saveSettings(settings);
        }
        await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Beyaz Listeye Eklendi').setDescription(`${user} artık koruma sistemlerinden (Anti-Nuke vb.) etkilenmeyecek.`)] });
        break;
      }

      case 'beyaz-liste-cikar': {
        const user = interaction.options.getUser('kullanıcı');
        p.whitelist = p.whitelist.filter(id => id !== user.id);
        saveSettings(settings);
        await interaction.editReply({ embeds: [baseEmbed(COLORS.WARNING).setTitle('❌ Beyaz Listeden Çıkarıldı').setDescription(`${user} artık koruma sistemlerine tabi.`)] });
        break;
      }
    }
  },
};
