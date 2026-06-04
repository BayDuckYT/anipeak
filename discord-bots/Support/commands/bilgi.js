// ============================================================
//  /bilgi — Bilgi ve Yardım Komutları
// ============================================================

import { SlashCommandBuilder, MessageFlags, EmbedBuilder, version as djsVersion } from 'discord.js';

const COLORS = { BLUE: 0x00BFFF, GREEN: 0x00FF88, PURPLE: 0x8A2BE2 };

export default {
  data: new SlashCommandBuilder()
    .setName('bilgi')
    .setDescription('ℹ️ Bilgi ve yardım komutları')
    .addSubcommand(sub =>
      sub.setName('bot')
        .setDescription('Bot hakkında bilgi gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('uptime')
        .setDescription('Bot\'un çalışma süresini gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('yardım')
        .setDescription('Tüm komutları listeler.')
    )
    .addSubcommand(sub =>
      sub.setName('davet')
        .setDescription('Sunucu davet linklerini gösterir.')
    )
    .addSubcommand(sub =>
      sub.setName('kurallar')
        .setDescription('Sunucu kurallarını gösterir.')
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'bot': {
        const totalMembers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
        const uptime = formatUptime(client.uptime);

        const embed = new EmbedBuilder()
          .setTitle('🤖 MahoraPeak Support Bot')
          .setDescription('MahoraPeak topluluğu için geliştirilmiş destek ve yardım botu.')
          .addFields(
            { name: '⏱️ Uptime', value: `\`${uptime}\``, inline: true },
            { name: '🏠 Sunucu', value: `\`${client.guilds.cache.size}\``, inline: true },
            { name: '👥 Üye', value: `\`${totalMembers}\``, inline: true },
            { name: '📡 Ping', value: `\`${client.ws.ping}ms\``, inline: true },
            { name: '⚙️ Discord.js', value: `\`v${djsVersion}\``, inline: true },
            { name: '🟢 Node.js', value: `\`${process.version}\``, inline: true },
            { name: '💾 RAM', value: `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``, inline: true },
          )
          .setColor(COLORS.BLUE)
          .setFooter({ text: 'MahoraPeak Support — Her zaman yanınızda!' })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'uptime': {
        const uptime = formatUptime(client.uptime);
        const embed = new EmbedBuilder()
          .setTitle('⏱️ Bot Çalışma Süresi')
          .setDescription(`Bot **${uptime}** süredir kesintisiz çalışıyor!`)
          .setColor(COLORS.GREEN);
        await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        break;
      }

      case 'yardım': {
        const commands = client.commands;
        const list = commands.map(cmd => `\`/${cmd.data.name}\` — ${cmd.data.description}`).join('\n');

        const embed = new EmbedBuilder()
          .setTitle('📋 KOMUT LİSTESİ')
          .setDescription(list || '*Komut yok*')
          .setColor(COLORS.BLUE)
          .setFooter({ text: `Toplam ${commands.size} komut` });
        await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        break;
      }

      case 'davet': {
        const embed = new EmbedBuilder()
          .setTitle('🔗 MahoraPeak Linkleri')
          .setDescription(
            '🌐 **Web Sitesi:** [mahorapeak.com.tr](https://mahorapeak.com.tr)\n' +
            '💬 **Discord:** [discord.gg/mahorapeak](https://discord.gg/mahorapeak)\n' +
            '🐦 **Twitter/X:** [@mahorapeak](https://x.com/mahorapeak)\n' +
            '📸 **Instagram:** [@mahorapeak](https://instagram.com/mahorapeak)'
          )
          .setColor(COLORS.PURPLE);
        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'kurallar': {
        const embed = new EmbedBuilder()
          .setTitle('📜 SUNUCU KURALLARI')
          .setDescription(
            '**1.** Saygılı ve nazik olun — hakaret, küfür yasaktır.\n' +
            '**2.** Spam yapmayın — tekrarlayan mesajlar silinir.\n' +
            '**3.** NSFW içerik paylaşmayın.\n' +
            '**4.** Reklam yapmayın — izinsiz link paylaşımı yasaktır.\n' +
            '**5.** Moderatörlerin kararlarına saygı gösterin.\n' +
            '**6.** Kişisel bilgi paylaşmayın.\n' +
            '**7.** Doğru kanallarda konuşun.\n' +
            '**8.** Bot komutlarını gereksiz kullanmayın.\n\n' +
            '*Kuralları ihlal eden üyelere uyarı, susturma veya ban cezası uygulanır.*'
          )
          .setColor(COLORS.PURPLE)
          .setFooter({ text: 'MahoraPeak — Keyifli bir topluluk için!' });
        await interaction.reply({ embeds: [embed] });
        break;
      }
    }
  },
};

function formatUptime(ms) {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const parts = [];
  if (days) parts.push(`${days}g`);
  if (hours) parts.push(`${hours}s`);
  if (minutes) parts.push(`${minutes}dk`);
  if (seconds) parts.push(`${seconds}sn`);
  return parts.join(' ') || '0sn';
}
