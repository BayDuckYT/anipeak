// ============================================================
//  /modpanel — Siber Karargah İnteraktif Moderasyon Paneli
//  Butonlu, menülü, modallı tam profesyonel Discord Dashboard
// ============================================================

import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  MessageFlags
} from 'discord.js';
import { modPanelEmbed, reasonSelectEmbed } from '../utils/embeds.js';
import { hasPermission } from '../utils/permissions.js';
import { MOD_REASONS } from '../utils/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('modpanel')
    .setDescription('🛡️ Yönetim Panelini açar.')
    ,

  async execute(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    if (!hasPermission(interaction.member, 'AYK')) return interaction.editReply ? await interaction.editReply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.' }).catch(()=>null) : await interaction.reply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.', ephemeral: true });


    // ── Ana Panel Embed ──────────────────────────────────────
    const embed = modPanelEmbed(interaction.guild);

    // ── Buton Satırı 1: Ceza Butonları ───────────────────────
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('mod:ban')
        .setLabel('Uzaklaştır')
        .setEmoji('🔨')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('mod:timeout')
        .setLabel('Sustur')
        .setEmoji('🤐')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('mod:kick')
        .setLabel('At (Kick)')
        .setEmoji('🥾')
        .setStyle(ButtonStyle.Secondary),
    );

    // ── Buton Satırı 2: Araçlar ──────────────────────────────
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('mod:clean')
        .setLabel('Sohbeti Temizle')
        .setEmoji('🧹')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('mod:radar')
        .setLabel('Kanal Analizi')
        .setEmoji('📊')
        .setStyle(ButtonStyle.Success),
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row1, row2]
    });
  },
};

// ════════════════════════════════════════════════════════════
//  COMPONENT HANDLERS — Buton / Menü / Modal İşleyicileri
// ════════════════════════════════════════════════════════════

const ACTION_LABELS = {
  ban:     '🔨 Uzaklaştır',
  timeout: '🤐 Sustur (Timeout)',
  kick:    '🥾 At (Kick)',
};

/**
 * Mod butonuna basıldığında çağrılır.
 * Ceza sebebi seçim menüsünü gösterir.
 */
export async function handleModButton(interaction) {
  const action = interaction.customId.split(':')[1]; // ban | timeout | kick

  // Sohbeti Temizle → direkt modal göster
  if (action === 'clean') {
    const modal = new ModalBuilder()
      .setCustomId('modal:clean')
      .setTitle('🧹 Sohbet Temizleme');

    const countInput = new TextInputBuilder()
      .setCustomId('clean_count')
      .setLabel('Kaç mesaj silinsin? (1-100)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('25')
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(3);

    modal.addComponents(new ActionRowBuilder().addComponents(countInput));
    return interaction.showModal(modal);
  }

  // Kanal Analizi → son mesajları analiz et
  if (action === 'radar') {
    return handleRadarScan(interaction);
  }

  // Ban / Timeout / Kick → sebep seçim menüsü göster
  const label = ACTION_LABELS[action] || action;
  const embed = reasonSelectEmbed(label);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`reason:${action}`)
    .setPlaceholder('⚖️ Ceza sebebini seçin...')
    .addOptions(
      MOD_REASONS.map((r) => ({
        label: r.label,
        value: r.value,
        emoji: r.emoji,
      }))
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await interaction.update({
    embeds: [embed],
    components: [row],
  });
}

/**
 * Sebep seçildikten sonra çağrılır.
 * Hedef kullanıcı ID'si için modal açar.
 */
export async function handleReasonSelect(interaction) {
  const action = interaction.customId.split(':')[1]; // ban | timeout | kick
  const reason = interaction.values[0]; // kufur | spam | link vs.

  const modal = new ModalBuilder()
    .setCustomId(`modal:${action}:${reason}`)
    .setTitle(`🎯 Hedef Kullanıcı — ${ACTION_LABELS[action] || action}`);

  const userIdInput = new TextInputBuilder()
    .setCustomId('target_user_id')
    .setLabel('Kullanıcı ID\'si')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('123456789012345678')
    .setRequired(true)
    .setMinLength(17)
    .setMaxLength(20);

  const noteInput = new TextInputBuilder()
    .setCustomId('mod_note')
    .setLabel('Ek Not (Opsiyonel)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Moderatör notu...')
    .setRequired(false)
    .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder().addComponents(userIdInput),
    new ActionRowBuilder().addComponents(noteInput),
  );

  await interaction.showModal(modal);
}

/**
 * Radar Tarama — son 50 mesajı analiz eder.
 */
async function handleRadarScan(interaction) {
  await interaction.deferUpdate();

  const messages = await interaction.channel.messages.fetch({ limit: 50 });
  const now = Date.now();
  const fiveMinAgo = now - 5 * 60 * 1000;

  let linkCount = 0;
  let spamSuspects = new Map();
  let recentCount = 0;

  messages.forEach((msg) => {
    if (msg.author.bot) return;
    if (msg.createdTimestamp > fiveMinAgo) recentCount++;

    // Link kontrolü
    if (/https?:\/\/[^\s]+/gi.test(msg.content)) linkCount++;

    // Spam kontrolü
    const count = spamSuspects.get(msg.author.id) || 0;
    spamSuspects.set(msg.author.id, count + 1);
  });

  const topSpammer = [...spamSuspects.entries()].sort((a, b) => b[1] - a[1])[0];

  const { baseEmbed } = await import('../utils/embeds.js');
  const { COLORS } = await import('../utils/config.js');

  const embed = baseEmbed(COLORS.CYBER_BLUE)
    .setTitle('📊 KANAL ANALİZ SONUÇLARI')
    .setDescription(
      '```\n' +
      '╔═══════════════════════════════════════╗\n' +
      '║   SON 50 MESAJ ANALİZ EDİLDİ         ║\n' +
      '╚═══════════════════════════════════════╝\n' +
      '```'
    )
    .addFields(
      { name: '📊 Son 5dk Mesaj',  value: `\`${recentCount}\``,  inline: true },
      { name: '🔗 Link İçeren',    value: `\`${linkCount}\``,    inline: true },
      { name: '👥 Benzersiz Yazar', value: `\`${spamSuspects.size}\``, inline: true },
      {
        name: '🚨 En Aktif Kullanıcı',
        value: topSpammer ? `<@${topSpammer[0]}> → \`${topSpammer[1]}\` mesaj` : '`Yok`',
      },
    );

  // Panele geri dönüş butonu
  const backRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('mod:back_panel')
      .setLabel('◀ Panele Dön')
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.editReply({
    embeds: [embed],
    components: [backRow],
  });
}

/**
 * Panele geri dönüş
 */
export async function handleBackToPanel(interaction) {
  const embed = modPanelEmbed(interaction.guild);

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('mod:ban').setLabel('Banla').setEmoji('🔨').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('mod:timeout').setLabel('Zindana At').setEmoji('🤐').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('mod:kick').setLabel('Kışladan Kov').setEmoji('🥾').setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('mod:clean').setLabel('Sohbeti Temizle').setEmoji('🧹').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('mod:radar').setLabel('Radar Tarama').setEmoji('📡').setStyle(ButtonStyle.Success),
  );

  await interaction.update({ embeds: [embed], components: [row1, row2] });
}
