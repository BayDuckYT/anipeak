// ============================================================
//  /sunucu-kur — MahoraPeak sunucu şablonunu sıfırdan kurar
//  ⚠️ TÜM kanalları (ve istenirse rolleri) siler!
//  Sadece SUNUCU SAHİBİ kullanabilir. Çift onay ister.
// ============================================================

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} from 'discord.js';
import { BRAND, ROLE_TEMPLATE, CATEGORY_TEMPLATE } from '../utils/serverTemplate.js';
import { buildServer, assignMemberRoles, summaryEmbed } from '../utils/serverBuilder.js';

const CONFIRM_WORD = 'ONAYLIYORUM';

export default {
  data: new SlashCommandBuilder()
    .setName('sunucu-kur')
    .setDescription('🏗️ MahoraPeak sunucu şablonunu kurar (TÜM kanalları siler!)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((o) =>
      o.setName('dogrulama').setDescription('Doğrulama sistemi kurulsun mu? (Varsayılan: Evet)'))
    .addBooleanOption((o) =>
      o.setName('rolleri-sil').setDescription('Mevcut roller silinsin mi? (Varsayılan: Evet)'))
    .addStringOption((o) =>
      o.setName('sunucu-adi').setDescription('Sunucunun yeni adı (boş bırakılırsa değişmez)').setMaxLength(100)),

  async execute(interaction, client) {
    const guild = interaction.guild;
    const verify = interaction.options.getBoolean('dogrulama') ?? true;
    const deleteRoles = interaction.options.getBoolean('rolleri-sil') ?? true;
    const serverName = interaction.options.getString('sunucu-adi') ?? undefined;

    // ── Güvenlik kontrolleri ────────────────────────────────
    if (interaction.user.id !== guild.ownerId) {
      return interaction.reply({
        content: '❌ Bu komutu sadece **sunucu sahibi** kullanabilir.',
        flags: [MessageFlags.Ephemeral],
      });
    }
    if (!guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Botun **Yönetici (Administrator)** yetkisi olmalı ve bot rolü rol listesinde **en üstte** olmalı.',
        flags: [MessageFlags.Ephemeral],
      });
    }
    client.templateBuilding = client.templateBuilding || new Set();
    if (client.templateBuilding.has(guild.id)) {
      return interaction.reply({ content: '⏳ Bu sunucuda zaten bir kurulum devam ediyor.', flags: [MessageFlags.Ephemeral] });
    }

    // ── Önizleme + onay ─────────────────────────────────────
    const roleCount = ROLE_TEMPLATE.length;
    const channelCount = CATEGORY_TEMPLATE.reduce((a, c) => a + c.channels.length, 0);

    const preview = new EmbedBuilder()
      .setColor(0xFF003C)
      .setTitle('⚠️ SUNUCU ŞABLONU KURULUMU — ONAY GEREKLİ')
      .setDescription(
        '```diff\n' +
        `- Sunucudaki TÜM kanallar silinecek (${guild.channels.cache.size} kanal)\n` +
        (deleteRoles ? '- Bot rolünün altındaki TÜM roller silinecek\n' : '') +
        '- Bu işlem GERİ ALINAMAZ!\n' +
        '```\n' +
        `**Kurulacak:** 🌸 ${BRAND.NAME} şablonu\n` +
        `> 🎭 **${roleCount}** rol (Kurucu, BYK, UYK, AYK, Moderatör, Destek, Ekip, Seviye, Bildirim...)\n` +
        `> 📁 **${CATEGORY_TEMPLATE.length}** kategori, **${channelCount}** kanal\n` +
        `> ✅ Doğrulama: **${verify ? 'Aktif' : 'Kapalı'}**\n` +
        (serverName ? `> ✏️ Yeni ad: **${serverName}**\n` : '') +
        '\n**Kategoriler:**\n' +
        CATEGORY_TEMPLATE.map((c) => `\`${c.name.replace('╭─ ', '')}\``).join(' • '),
      )
      .setFooter({ text: '60 saniye içinde onaylanmazsa iptal edilir.' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('kurulum:start').setLabel('Kurulumu Başlat').setEmoji('🏗️').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('kurulum:cancel').setLabel('İptal').setEmoji('✖️').setStyle(ButtonStyle.Secondary),
    );

    const msg = await interaction.reply({
      embeds: [preview],
      components: [row],
      flags: [MessageFlags.Ephemeral],
      withResponse: true,
    }).then((r) => r.resource?.message ?? r).catch(() => null);

    if (!msg) return;

    let btn;
    try {
      btn = await msg.awaitMessageComponent({
        filter: (i) => i.user.id === interaction.user.id && i.customId.startsWith('kurulum:'),
        time: 60_000,
      });
    } catch {
      return interaction.editReply({ content: '⌛ Süre doldu, kurulum iptal edildi.', embeds: [], components: [] }).catch(() => null);
    }

    if (btn.customId === 'kurulum:cancel') {
      return btn.update({ content: '✖️ Kurulum iptal edildi.', embeds: [], components: [] });
    }

    // ── İkinci onay: modal ile ONAYLIYORUM yazdır ───────────
    const modal = new ModalBuilder()
      .setCustomId(`kurulum:modal:${interaction.id}`)
      .setTitle('⚠️ Son Onay')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('confirm')
            .setLabel(`Onaylamak için "${CONFIRM_WORD}" yazın`)
            .setPlaceholder(CONFIRM_WORD)
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
      );
    await btn.showModal(modal);

    let submit;
    try {
      submit = await btn.awaitModalSubmit({
        filter: (i) => i.user.id === interaction.user.id && i.customId === `kurulum:modal:${interaction.id}`,
        time: 60_000,
      });
    } catch {
      return interaction.editReply({ content: '⌛ Süre doldu, kurulum iptal edildi.', embeds: [], components: [] }).catch(() => null);
    }

    if (submit.fields.getTextInputValue('confirm').trim().toLocaleUpperCase('tr-TR') !== CONFIRM_WORD) {
      return submit.reply({ content: '❌ Onay metni hatalı. Kurulum iptal edildi.', flags: [MessageFlags.Ephemeral] });
    }
    await submit.deferUpdate();

    // ── KURULUM ─────────────────────────────────────────────
    client.templateBuilding.add(guild.id);
    const startedAt = Date.now();
    const steps = [];
    const progress = async (text) => {
      steps.push(text);
      console.log(`[Infinity-Guard] [sunucu-kur] ${guild.name}: ${text}`);
      await interaction.editReply({
        content: '',
        embeds: [
          new EmbedBuilder()
            .setColor(BRAND.COLOR)
            .setTitle('🏗️ Sunucu kuruluyor...')
            .setDescription(steps.map((s, i) => (i === steps.length - 1 ? `⏳ ${s}` : `✅ ${s}`)).join('\n')),
        ],
        components: [],
      }).catch(() => null);
    };

    let result;
    try {
      result = await buildServer(
        guild,
        { verify, deleteRoles, serverName, keepChannelId: interaction.channelId, executor: interaction.user },
        progress,
      );
    } catch (err) {
      console.error('[Infinity-Guard] sunucu-kur hatası:', err);
      client.templateBuilding.delete(guild.id);
      await interaction.editReply({ content: `❌ Kurulum sırasında hata: \`${err.message}\``, embeds: [] }).catch(() => null);
      return;
    }

    const summary = summaryEmbed(guild, result, verify)
      .addFields({ name: '⏱️ Süre', value: `\`${Math.round((Date.now() - startedAt) / 1000)} sn\``, inline: true });

    // Özet: log kanalı + sahibe DM + mevcut mesaj
    const logChannel = guild.channels.cache.get(result.C.log);
    await logChannel?.send({ embeds: [summary] }).catch(() => null);
    await interaction.user.send({ embeds: [summary] }).catch(() => null);
    await interaction.editReply({
      content: '✅ Kurulum tamamlandı! Bu kanal **15 saniye** içinde silinecek. Özet `infinity-log` kanalına ve DM\'ine gönderildi.',
      embeds: [summary],
    }).catch(() => null);

    client.templateBuilding.delete(guild.id);

    // Mevcut üyelere Üye / Bot / Kurucu rollerini arka planda dağıt
    assignMemberRoles(guild, result.R).then((n) => {
      logChannel?.send(`👥 Mevcut **${n}** üyeye rolleri dağıtıldı.`).catch(() => null);
    });

    // Komutun kullanıldığı eski kanalı en son sil
    setTimeout(async () => {
      const origin = guild.channels.cache.get(interaction.channelId);
      if (origin && !Object.values(result.C).includes(origin.id)) {
        await origin.delete('Infinity Guard — Sunucu şablonu kurulumu').catch(() => null);
      }
    }, 15_000);
  },
};
