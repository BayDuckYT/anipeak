// ============================================================
//  /giveaway — Çekiliş Sistemi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS } from '../utils/config.js';
import { baseEmbed } from '../utils/embeds.js';

const activeGiveaways = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('🎉 Çekiliş sistemi')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('basla')
        .setDescription('Yeni çekiliş başlatır.')
        .addStringOption(opt => opt.setName('ödül').setDescription('Çekiliş ödülü').setRequired(true))
        .addIntegerOption(opt => opt.setName('süre').setDescription('Süre (dakika)').setRequired(true).setMinValue(1).setMaxValue(43200))
        .addIntegerOption(opt => opt.setName('kazanan').setDescription('Kazanan sayısı').setMinValue(1).setMaxValue(20))
        .addChannelOption(opt => opt.setName('kanal').setDescription('Çekiliş kanalı'))
    )
    .addSubcommand(sub =>
      sub.setName('bitir')
        .setDescription('Aktif çekilişi erken bitirir.')
        .addStringOption(opt => opt.setName('mesaj-id').setDescription('Çekiliş mesajının ID\'si').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('yeniden-cek')
        .setDescription('Bitmiş çekilişte yeni kazanan seçer.')
        .addStringOption(opt => opt.setName('mesaj-id').setDescription('Çekiliş mesajının ID\'si').setRequired(true))
        .addIntegerOption(opt => opt.setName('kazanan').setDescription('Yeni kazanan sayısı').setMinValue(1).setMaxValue(20))
    )
    .addSubcommand(sub =>
      sub.setName('liste')
        .setDescription('Aktif çekilişleri listeler.')
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'basla': return await startGiveaway(interaction, client);
      case 'bitir': return await endGiveaway(interaction, client);
      case 'yeniden-cek': return await rerollGiveaway(interaction, client);
      case 'liste': return await listGiveaways(interaction);
    }
  },
};

async function startGiveaway(interaction, client) {
  const prize = interaction.options.getString('ödül');
  const durationMinutes = interaction.options.getInteger('süre');
  const winnerCount = interaction.options.getInteger('kazanan') || 1;
  const channel = interaction.options.getChannel('kanal') || interaction.channel;

  const endTime = Date.now() + durationMinutes * 60 * 1000;

  const embed = new EmbedBuilder()
    .setTitle('🎉 ÇEKİLİŞ BAŞLADI!')
    .setDescription(
      `**Ödül:** ${prize}\n\n` +
      `**Bitiş:** <t:${Math.floor(endTime / 1000)}:R>\n` +
      `**Kazanan Sayısı:** \`${winnerCount}\`\n` +
      `**Düzenleyen:** ${interaction.user}\n\n` +
      `Katılmak için aşağıdaki 🎉 butonuna tıkla!`
    )
    .setColor(COLORS.NEON_PINK)
    .setFooter({ text: 'MahoraPeak Çekiliş Sistemi' })
    .setTimestamp(endTime);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway:join')
      .setLabel('Katıl (0)')
      .setEmoji('🎉')
      .setStyle(ButtonStyle.Success)
  );

  const msg = await channel.send({ embeds: [embed], components: [row] });

  const giveawayData = {
    messageId: msg.id,
    channelId: channel.id,
    prize,
    winnerCount,
    endTime,
    participants: new Set(),
    ended: false,
  };
  activeGiveaways.set(msg.id, giveawayData);

  // Buton interaction collector
  const collector = msg.createMessageComponentCollector({ time: durationMinutes * 60 * 1000 });

  collector.on('collect', async (btnInt) => {
    if (btnInt.customId === 'giveaway:join') {
      const gw = activeGiveaways.get(msg.id);
      if (!gw || gw.ended) return btnInt.reply({ content: '❌ Bu çekiliş sona erdi.', flags: [MessageFlags.Ephemeral] });

      if (gw.participants.has(btnInt.user.id)) {
        gw.participants.delete(btnInt.user.id);
        await btnInt.reply({ content: '❌ Çekilişten ayrıldın.', flags: [MessageFlags.Ephemeral] });
      } else {
        gw.participants.add(btnInt.user.id);
        await btnInt.reply({ content: '✅ Çekilişe katıldın! 🎉', flags: [MessageFlags.Ephemeral] });
      }

      // Buton label güncelle
      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('giveaway:join')
          .setLabel(`Katıl (${gw.participants.size})`)
          .setEmoji('🎉')
          .setStyle(ButtonStyle.Success)
      );
      await msg.edit({ components: [newRow] }).catch(() => {});
    }
  });

  collector.on('end', async () => {
    const gw = activeGiveaways.get(msg.id);
    if (gw && !gw.ended) {
      await pickWinners(msg, gw);
    }
  });

  await interaction.reply({ content: `✅ Çekiliş başlatıldı: ${channel}`, flags: [MessageFlags.Ephemeral] });
}

async function pickWinners(msg, gw) {
  gw.ended = true;
  const participants = [...gw.participants];

  if (participants.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('🎉 ÇEKİLİŞ SONA ERDİ')
      .setDescription(`**Ödül:** ${gw.prize}\n\n❌ Yeterli katılımcı olmadığı için kazanan belirlenemedi.`)
      .setColor(COLORS.DANGER)
      .setTimestamp();
    await msg.edit({ embeds: [embed], components: [] }).catch(() => {});
    return;
  }

  const shuffled = participants.sort(() => 0.5 - Math.random());
  const winners = shuffled.slice(0, Math.min(gw.winnerCount, participants.length));

  const winnerMentions = winners.map(id => `<@${id}>`).join(', ');

  const embed = new EmbedBuilder()
    .setTitle('🎉 ÇEKİLİŞ SONA ERDİ!')
    .setDescription(
      `**Ödül:** ${gw.prize}\n\n` +
      `🏆 **Kazanan${winners.length > 1 ? 'lar' : ''}:** ${winnerMentions}\n\n` +
      `📊 **Toplam Katılımcı:** \`${participants.length}\``
    )
    .setColor(COLORS.SUCCESS)
    .setTimestamp();

  await msg.edit({ embeds: [embed], components: [] }).catch(() => {});
  await msg.reply({ content: `🎉 Tebrikler ${winnerMentions}! **${gw.prize}** kazandınız!` }).catch(() => {});
}

async function endGiveaway(interaction, client) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
  const messageId = interaction.options.getString('mesaj-id').trim();
  const gw = activeGiveaways.get(messageId);

  if (!gw || gw.ended) {
    return interaction.editReply({ content: '❌ Aktif çekiliş bulunamadı.' });
  }

  const channel = await client.channels.fetch(gw.channelId).catch(() => null);
  if (!channel) return interaction.editReply({ content: '❌ Kanal bulunamadı.' });

  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) return interaction.editReply({ content: '❌ Mesaj bulunamadı.' });

  await pickWinners(msg, gw);
  await interaction.editReply({ content: '✅ Çekiliş erken sonlandırıldı!' });
}

async function rerollGiveaway(interaction, client) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
  const messageId = interaction.options.getString('mesaj-id').trim();
  const newCount = interaction.options.getInteger('kazanan') || 1;
  const gw = activeGiveaways.get(messageId);

  if (!gw) return interaction.editReply({ content: '❌ Çekiliş bulunamadı.' });

  const participants = [...gw.participants];
  if (participants.length === 0) return interaction.editReply({ content: '❌ Katılımcı yok.' });

  const shuffled = participants.sort(() => 0.5 - Math.random());
  const winners = shuffled.slice(0, Math.min(newCount, participants.length));
  const winnerMentions = winners.map(id => `<@${id}>`).join(', ');

  const channel = await client.channels.fetch(gw.channelId).catch(() => null);
  if (channel) {
    await channel.send({ content: `🎉 Yeniden çekildi! Yeni kazanan${winners.length > 1 ? 'lar' : ''}: ${winnerMentions} — **${gw.prize}**` });
  }

  await interaction.editReply({ content: `✅ Yeniden çekildi: ${winnerMentions}` });
}

async function listGiveaways(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  const active = [...activeGiveaways.values()].filter(gw => !gw.ended);
  if (active.length === 0) {
    return interaction.editReply({ embeds: [baseEmbed(COLORS.CYBER_BLUE).setTitle('📋 Aktif çekiliş yok')] });
  }

  const list = active.map(gw =>
    `• **${gw.prize}** — \`${gw.participants.size}\` katılımcı — Bitiş: <t:${Math.floor(gw.endTime / 1000)}:R>`
  ).join('\n');

  const embed = baseEmbed(COLORS.NEON_PINK)
    .setTitle(`🎉 AKTİF ÇEKİLİŞLER (${active.length})`)
    .setDescription(list);
  await interaction.editReply({ embeds: [embed] });
}
