// ============================================================
//  /poll — Anket Sistemi
// ============================================================

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { hasPermission } from '../utils/permissions.js';
import { COLORS } from '../utils/config.js';
import { baseEmbed } from '../utils/embeds.js';

const activePolls = new Map();
const EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export default {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('📊 Anket sistemi')
    
    .addSubcommand(sub =>
      sub.setName('olustur')
        .setDescription('Yeni anket oluşturur.')
        .addStringOption(opt => opt.setName('soru').setDescription('Anket sorusu').setRequired(true))
        .addStringOption(opt => opt.setName('secenekler').setDescription('Seçenekleri | ile ayırın (örn: Evet | Hayır | Belki)').setRequired(true))
        .addIntegerOption(opt => opt.setName('süre').setDescription('Süre (dakika, 0=süresiz)').setMinValue(0).setMaxValue(10080))
        .addChannelOption(opt => opt.setName('kanal').setDescription('Anket kanalı'))
    )
    .addSubcommand(sub =>
      sub.setName('bitir')
        .setDescription('Aktif anketi bitirir ve sonuçları gösterir.')
        .addStringOption(opt => opt.setName('mesaj-id').setDescription('Anket mesaj ID\'si').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('hizli')
        .setDescription('Hızlı Evet/Hayır anketi oluşturur.')
        .addStringOption(opt => opt.setName('soru').setDescription('Anket sorusu').setRequired(true))
    ),

  async execute(interaction, client) {
    if (!hasPermission(interaction.member, 'UYK')) return interaction.editReply ? await interaction.editReply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.' }).catch(()=>null) : await interaction.reply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.', ephemeral: true });

    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'olustur': return await createPoll(interaction);
      case 'bitir': return await endPoll(interaction, client);
      case 'hizli': return await quickPoll(interaction);
    }
  },
};

async function createPoll(interaction) {
  const question = interaction.options.getString('soru');
  const optionsStr = interaction.options.getString('secenekler');
  const durationMinutes = interaction.options.getInteger('süre') || 0;
  const channel = interaction.options.getChannel('kanal') || interaction.channel;

  const options = optionsStr.split('|').map(o => o.trim()).filter(o => o.length > 0);
  if (options.length < 2 || options.length > 10) {
    return interaction.reply({ content: '❌ 2-10 arası seçenek girin.', flags: [MessageFlags.Ephemeral] });
  }

  const optionList = options.map((opt, i) => `${EMOJIS[i]} ${opt}`).join('\n');
  const embed = new EmbedBuilder()
    .setTitle('📊 ANKET')
    .setDescription(`**${question}**\n\n${optionList}\n\n*Oy vermek için aşağıdaki butonlara tıkla!*`)
    .setColor(COLORS.CYBER_BLUE)
    .setFooter({ text: `MahoraPeak Anket Sistemi${durationMinutes > 0 ? ` • ${durationMinutes} dk` : ' • Süresiz'}` })
    .setTimestamp();

  // Butonları oluştur (5'erli satırlarda)
  const rows = [];
  for (let i = 0; i < options.length; i += 5) {
    const row = new ActionRowBuilder();
    for (let j = i; j < Math.min(i + 5, options.length); j++) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`poll:vote:${j}`)
          .setLabel(`${options[j]} (0)`)
          .setEmoji(EMOJIS[j])
          .setStyle(ButtonStyle.Secondary)
      );
    }
    rows.push(row);
  }

  const msg = await channel.send({ embeds: [embed], components: rows });

  const pollData = {
    messageId: msg.id,
    channelId: channel.id,
    question,
    options,
    votes: options.map(() => new Set()),
    voters: new Set(),
    ended: false,
  };
  activePolls.set(msg.id, pollData);

  // Collector
  const collectorTime = durationMinutes > 0 ? durationMinutes * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // Max 7 gün
  const collector = msg.createMessageComponentCollector({ time: collectorTime });

  collector.on('collect', async (btnInt) => {
    if (!btnInt.customId.startsWith('poll:vote:')) return;
    const optIndex = parseInt(btnInt.customId.split(':')[2]);
    const poll = activePolls.get(msg.id);
    if (!poll || poll.ended) return btnInt.reply({ content: '❌ Anket sona erdi.', flags: [MessageFlags.Ephemeral] });

    // Önceki oyu kaldır
    for (const voteSet of poll.votes) {
      voteSet.delete(btnInt.user.id);
    }

    // Yeni oy ekle
    poll.votes[optIndex].add(btnInt.user.id);
    poll.voters.add(btnInt.user.id);

    await btnInt.reply({ content: `✅ Oyun kaydedildi: **${poll.options[optIndex]}**`, flags: [MessageFlags.Ephemeral] });

    // Butonları güncelle
    const newRows = [];
    for (let i = 0; i < poll.options.length; i += 5) {
      const row = new ActionRowBuilder();
      for (let j = i; j < Math.min(i + 5, poll.options.length); j++) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`poll:vote:${j}`)
            .setLabel(`${poll.options[j]} (${poll.votes[j].size})`)
            .setEmoji(EMOJIS[j])
            .setStyle(ButtonStyle.Secondary)
        );
      }
      newRows.push(row);
    }
    await msg.edit({ components: newRows }).catch(() => {});
  });

  collector.on('end', async () => {
    const poll = activePolls.get(msg.id);
    if (poll && !poll.ended) {
      await showResults(msg, poll);
    }
  });

  await interaction.reply({ content: `✅ Anket oluşturuldu: ${channel}`, flags: [MessageFlags.Ephemeral] });
}

async function showResults(msg, poll) {
  poll.ended = true;
  const totalVotes = poll.voters.size;
  const results = poll.options.map((opt, i) => {
    const count = poll.votes[i].size;
    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
    return `${EMOJIS[i]} **${opt}** — \`${count}\` oy (%${pct})\n${bar}`;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle('📊 ANKET SONUÇLARI')
    .setDescription(`**${poll.question}**\n\n${results}\n\n📈 **Toplam oy:** \`${totalVotes}\``)
    .setColor(COLORS.SUCCESS)
    .setTimestamp();

  await msg.edit({ embeds: [embed], components: [] }).catch(() => {});
}

async function endPoll(interaction, client) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
  const messageId = interaction.options.getString('mesaj-id').trim();
  const poll = activePolls.get(messageId);

  if (!poll || poll.ended) return interaction.editReply({ content: '❌ Aktif anket bulunamadı.' });

  const channel = await client.channels.fetch(poll.channelId).catch(() => null);
  if (!channel) return interaction.editReply({ content: '❌ Kanal bulunamadı.' });
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) return interaction.editReply({ content: '❌ Mesaj bulunamadı.' });

  await showResults(msg, poll);
  await interaction.editReply({ content: '✅ Anket sonlandırıldı ve sonuçlar gösterildi!' });
}

async function quickPoll(interaction) {
  const question = interaction.options.getString('soru');

  const embed = new EmbedBuilder()
    .setTitle('📊 HIZLI ANKET')
    .setDescription(`**${question}**\n\n*Aşağıdaki butonlarla oy verin!*`)
    .setColor(COLORS.CYBER_BLUE)
    .setFooter({ text: `Soran: ${interaction.user.tag}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('poll:vote:0').setLabel('Evet (0)').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('poll:vote:1').setLabel('Hayır (0)').setEmoji('❌').setStyle(ButtonStyle.Danger),
  );

  const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

  const pollData = {
    messageId: msg.id, channelId: interaction.channel.id,
    question, options: ['Evet', 'Hayır'],
    votes: [new Set(), new Set()], voters: new Set(), ended: false,
  };
  activePolls.set(msg.id, pollData);

  const collector = msg.createMessageComponentCollector({ time: 24 * 60 * 60 * 1000 });
  collector.on('collect', async (btnInt) => {
    if (!btnInt.customId.startsWith('poll:vote:')) return;
    const optIndex = parseInt(btnInt.customId.split(':')[2]);
    const poll = activePolls.get(msg.id);
    if (!poll || poll.ended) return;

    for (const voteSet of poll.votes) voteSet.delete(btnInt.user.id);
    poll.votes[optIndex].add(btnInt.user.id);
    poll.voters.add(btnInt.user.id);

    await btnInt.reply({ content: `✅ Oyun: **${poll.options[optIndex]}**`, flags: [MessageFlags.Ephemeral] });
    const newRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('poll:vote:0').setLabel(`Evet (${poll.votes[0].size})`).setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('poll:vote:1').setLabel(`Hayır (${poll.votes[1].size})`).setEmoji('❌').setStyle(ButtonStyle.Danger),
    );
    await msg.edit({ components: [newRow] }).catch(() => {});
  });

  collector.on('end', async () => {
    const poll = activePolls.get(msg.id);
    if (poll && !poll.ended) await showResults(msg, poll);
  });

  await interaction.reply({ content: '✅ Hızlı anket oluşturuldu!', flags: [MessageFlags.Ephemeral] });
}
