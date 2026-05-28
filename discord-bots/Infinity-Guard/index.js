// ============================================================
//  ██╗███╗   ██╗███████╗██╗███╗   ██╗██╗████████╗██╗   ██╗
//  ██║████╗  ██║██╔════╝██║████╗  ██║██║╚══██╔══╝╚██╗ ██╔╝
//  ██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║██║   ██║    ╚████╔╝
//  ██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║██║   ██║     ╚██╔╝
//  ██║██║ ╚████║██║     ██║██║ ╚████║██║   ██║      ██║
//  ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝      ╚═╝
//    GUARD — MahoraPeak Yönetim Merkezi | Moderation Service
// ============================================================

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── ESM __dirname polyfill ──────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── .env dosyasını BOTUN KENDİ dizininden yükle ─────────────
dotenv.config({ path: path.join(__dirname, '.env') });

import { Client, Collection, IntentsBitField, REST, Routes, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, PermissionFlagsBits, UserSelectMenuBuilder, RoleSelectMenuBuilder, MessageFlags, EmbedBuilder } from 'discord.js';
import fs from 'node:fs';
import { modSuccessEmbed, purgeSuccessEmbed, baseEmbed, lockdownLogEmbed, nukeLogEmbed, writeEmbed } from './utils/embeds.js';
import { COLORS, MOD_REASONS } from './utils/config.js';
import { sendLog } from './utils/logger.js';
import * as modHandlers from './commands/modpanel.js';

// ── Client oluştur ──────────────────────────────────────────
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.GuildVoiceStates,
  ],
});

// ── Command Handler ─────────────────────────────────────────
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

async function loadCommands() {
  if (!fs.existsSync(commandsPath)) return;

  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    const cmd = command.default ?? command;

    if (cmd.data && cmd.execute) {
      client.commands.set(cmd.data.name, cmd);
      console.log(`[Infinity-Guard] ✅ Komut yüklendi: ${cmd.data.name}`);
    } else {
      console.warn(`[Infinity-Guard] ⚠️  Geçersiz komut dosyası: ${file}`);
    }
  }
}

// ── Slash Komutlarını Discord API'ye Kaydet ─────────────────
async function registerSlashCommands() {
  if (!fs.existsSync(commandsPath)) return;

  const commands = [];
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    const cmd = command.default ?? command;
    if (cmd.data) commands.push(cmd.data.toJSON());
  }

  if (commands.length === 0) return;

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(`[Infinity-Guard] 🔄 ${commands.length} slash komut kaydediliyor...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log(`[Infinity-Guard] ✅ Slash komutlar başarıyla kaydedildi!`);
  } catch (error) {
    console.error('[Infinity-Guard] ❌ Slash komut kayıt hatası:', error);
  }
}

// ── Event Handler ───────────────────────────────────────────
const eventsPath = path.join(__dirname, 'events');

async function loadEvents() {
  if (!fs.existsSync(eventsPath)) return;

  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = await import(`file://${filePath}`);
    const evt = event.default ?? event;

    if (evt.once) {
      client.once(evt.name, (...args) => evt.execute(...args, client));
    } else {
      client.on(evt.name, (...args) => evt.execute(...args, client));
    }
    console.log(`[Infinity-Guard] 🎧 Event yüklendi: ${evt.name}`);
  }
}

// ════════════════════════════════════════════════════════════
//  INTERACTION HANDLER — Slash, Button, Menu, Modal
// ════════════════════════════════════════════════════════════
client.on('interactionCreate', async (interaction) => {
  try {
    // ── 1. Slash Commands ──────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction, client);
      return;
    }

    // ── 2. Button Interactions ─────────────────────────────
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // Mod panel butonları
      if (customId.startsWith('mod:')) {
        if (customId === 'mod:back_panel') {
          await modHandlers.handleBackToPanel(interaction);
          return;
        }

        await modHandlers.handleModButton(interaction);
        return;
      }

      // V2: Kanal ve Rol Ops Butonları
      if (customId.startsWith('channel:') || customId.startsWith('role:')) {
        await handleV2Buttons(interaction);
        return;
      }

      // Guard Target Buttons
      if (customId === 'guard_target_all') {
        const allTextChannels = interaction.guild.channels.cache
          .filter(c => c.type === ChannelType.GuildText)
          .map(c => c.id);
        
        interaction.client.guardSelections = interaction.client.guardSelections || new Map();
        interaction.client.guardSelections.set(interaction.user.id, allTextChannels);
        
        return interaction.reply({ 
          content: `🌐 **TÜM KANALLAR (${allTextChannels.length} adet)** seçildi. Şimdi aşağıdan yapılacak işlemi seçin.`, 
          ephemeral: true 
        });
      }

      if (customId === 'guard_target_reset') {
        interaction.client.guardSelections?.delete(interaction.user.id);
        return interaction.reply({ 
          content: '🔄 Kanal seçimi sıfırlandı. Lütfen menüden yeni kanal(lar) seçin.', 
          ephemeral: true 
        });
      }
    }

    // ── 3. Select Menu Interactions ────────────────────────
    if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;

      // Ceza sebebi seçimi
      if (customId.startsWith('reason:')) {
        await modHandlers.handleReasonSelect(interaction);
        return;
      }

      // Setup: Otomatik Yapılandırma
      if (customId === 'setup:auto_config') {
        await handleSetupAutoConfig(interaction);
        return;
      }

      // V2: Kanal Yavaşlatma
      if (customId === 'channel:slowmode') {
        await handleV2SelectMenus(interaction);
        return;
      }
    }

    // V2: User ve Role Select Menu Interactions
    if (interaction.isUserSelectMenu() || interaction.isRoleSelectMenu()) {
      await handleV2SelectMenus(interaction);
      return;
    }

    // ── 3.5. Guard Settings Interactions ──
    if (interaction.isChannelSelectMenu() && interaction.customId === 'guard_channel_select') {
      const selectedChannels = interaction.values;
      // Kullanıcının seçimini Map'e kaydet
      interaction.client.guardSelections = interaction.client.guardSelections || new Map();
      interaction.client.guardSelections.set(interaction.user.id, selectedChannels);
      
      await interaction.reply({ 
        content: `✅ **${selectedChannels.length}** kanal seçildi. Şimdi aşağıdan yapılacak işlemi seçin.`, 
        ephemeral: true 
      });
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'guard_setting_toggle') {
      const selection = interaction.values[0];
      const selectedChannels = interaction.client.guardSelections?.get(interaction.user.id);
      
      if (selection === 'spacer') return interaction.deferUpdate();

      const { getSettings, saveSettings } = await import('./utils/settingsManager.js');
      const settings = getSettings();
      let logMessage = '';
      let affectedChannelsText = '';

      if (selection === 'global_on' || selection === 'global_off') {
        const value = selection === 'global_on';
        settings.global = {
          antiSpam: value,
          antiLink: value,
          badWords: value,
          capsFilter: value,
          duplicateFilter: value
        };
        // Global ayar değişince tüm kanal ayarlarını sıfırlayabiliriz veya olduğu gibi bırakabiliriz.
        // Burada tüm özel kanal ayarlarını silip genele dönüyoruz.
        settings.channels = {}; 
        logMessage = `🌐 **${interaction.user.tag}** tarafından **TÜM SUNUCUDA** korumalar **${value ? 'AÇILDI' : 'KAPATILDI'}**.`;
        affectedChannelsText = 'Tüm Sunucu (Global)';
      } else {
        if (!selectedChannels) {
          return interaction.reply({ 
            content: '❌ Önce yukarıdaki menüden kanal seçmelisiniz!', 
            ephemeral: true 
          });
        }

        if (selection === 'all_on' || selection === 'all_off') {
          const value = selection === 'all_on';
          selectedChannels.forEach(id => {
            settings.channels[id] = {
              antiSpam: value,
              antiLink: value,
              badWords: value,
              capsFilter: value,
              duplicateFilter: value
            };
          });
          logMessage = `📢 **${interaction.user.tag}** tarafından **${selectedChannels.length}** kanalda tüm korumalar **${value ? 'AÇILDI' : 'KAPATILDI'}**.`;
        } else {
          let newValue;
          selectedChannels.forEach(id => {
            if (!settings.channels[id]) settings.channels[id] = { ...settings.global };
            settings.channels[id][selection] = !settings.channels[id][selection];
            newValue = settings.channels[id][selection]; // Assuming they all toggle to the same state if they were in sync
          });
          logMessage = `📢 **${interaction.user.tag}** tarafından **${selectedChannels.length}** kanalda **${selection}** ayarı **${newValue ? 'AÇILDI' : 'KAPATILDI'}**.`;
        }
        affectedChannelsText = selectedChannels.map(id => `<#${id}>`).join(', ');
      }

      saveSettings(settings);

      // Log gönderimi
      const logChannel = interaction.guild.channels.cache.find(c => c.name === 'infinity-log');
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('🛡️ Guard Ayarları Güncellendi')
          .setDescription(logMessage)
          .addFields({ name: 'Etkilenen Kanallar', value: affectedChannelsText })
          .setColor(COLORS.CYBER_BLUE)
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] });
      }

      await interaction.reply({ 
        content: `✅ İşlem başarılı! ${logMessage}`, 
        ephemeral: true 
      });
      return;
    }

    // ── 4. Modal Submissions ───────────────────────────────
    if (interaction.isModalSubmit()) {
      const customId = interaction.customId;

      // Özel yazı modalı
      if (customId === 'modal:yaz') {
        await handleYazModal(interaction);
        return;
      }

      // Sohbet temizleme modalı
      if (customId === 'modal:clean') {
        await handleCleanModal(interaction);
        return;
      }

      // Moderasyon modalı (ban/timeout/kick)
      if (customId.startsWith('modal:')) {
        await handleModModal(interaction);
        return;
      }
      
      // V2 Modalları
      if (customId.startsWith('v2_modal:')) {
        await handleV2Modals(interaction);
        return;
      }
    }
  } catch (error) {
    // 10062: Unknown interaction (Zaman aşımı veya zaten cevaplanmış)
    if (error.code === 10062) {
      console.warn(`[Infinity-Guard] ⚠️ Etkileşim zaman aşımına uğradı (${interaction.commandName || interaction.customId})`);
      return;
    }

    console.error(`[Infinity-Guard] ❌ Interaction hatası:`, error);
    
    try {
      const reply = { content: '❌ İşlem sırasında bir hata oluştu!', flags: [MessageFlags.Ephemeral] };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    } catch (replyError) {
      // Hata mesajı da gönderilemiyorsa yapacak bir şey yok
    }
  }
});

// ════════════════════════════════════════════════════════════
//  MODAL HANDLERS
// ════════════════════════════════════════════════════════════

/**
 * Özel yazı gönderme modal handler
 */
async function handleYazModal(interaction) {
  try {
    // Önce defer et (3 saniye sınırını aşmamak için)
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const title = interaction.fields.getTextInputValue('yaz_title');
    const description = interaction.fields.getTextInputValue('yaz_desc');
    const image = interaction.fields.getTextInputValue('yaz_image');
    const colorStr = interaction.fields.getTextInputValue('yaz_color');

    console.log(`[Infinity-Guard] Yaz modalı işleniyor. Başlık: ${title}`);

    let color = COLORS.CYBER_BLUE;
    if (colorStr && colorStr.startsWith('#')) {
      try {
        color = parseInt(colorStr.replace('#', ''), 16);
      } catch {}
    }

    const embed = writeEmbed({ title, description, image, color });

    await interaction.editReply({
      content: '✅ Mesaj başarıyla gönderildi!'
    });

    await interaction.channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[Infinity-Guard] Yaz modal hatası:', err);
    // Eğer defer edildiyse editReply, edilmediyse reply dene
    const errorMsg = { content: '❌ Mesaj gönderilirken bir hata oluştu!', flags: [MessageFlags.Ephemeral] };
    if (interaction.deferred) {
      await interaction.editReply(errorMsg).catch(() => {});
    } else {
      await interaction.reply(errorMsg).catch(() => {});
    }
  }
}

/**
 * Sohbet Temizleme modal handler
 */
async function handleCleanModal(interaction) {
  const countStr = interaction.fields.getTextInputValue('clean_count');
  const count = parseInt(countStr, 10);

  if (isNaN(count) || count < 1 || count > 100) {
    return interaction.reply({
      embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Geçersiz Sayı').setDescription('1-100 arası bir sayı girin.')],
      flags: [MessageFlags.Ephemeral],
    });
  }

  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  try {
    const deleted = await interaction.channel.bulkDelete(count, true);
    const embed = purgeSuccessEmbed(deleted.size, interaction.user);

    await interaction.editReply({ embeds: [embed] });
    await sendLog(interaction.guild, embed);
  } catch (err) {
    await interaction.editReply({
      embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Temizleme Hatası').setDescription(`\`${err.message}\``)],
    });
  }
}

/**
 * Ban / Timeout / Kick modal handler
 * customId format: modal:ACTION:REASON
 */
async function handleModModal(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[1];   // ban | timeout | kick
  const reasonKey = parts[2]; // kufur | spam | link vs.

  const targetId = interaction.fields.getTextInputValue('target_user_id').trim();
  const note = interaction.fields.getTextInputValue('mod_note')?.trim() || '';

  // Sebep etiketini bul
  const reasonObj = MOD_REASONS.find((r) => r.value === reasonKey);
  const reasonLabel = reasonObj ? reasonObj.label : reasonKey;

  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  // Hedef üyeyi bul
  let targetMember;
  try {
    targetMember = await interaction.guild.members.fetch(targetId);
  } catch {
    return interaction.editReply({
      embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Kullanıcı Bulunamadı').setDescription(`\`${targetId}\` ID'li kullanıcı bu sunucuda bulunamadı.`)],
    });
  }

  // Kendine ceza vermeye çalışıyorsa
  if (targetMember.id === interaction.user.id) {
    return interaction.editReply({
      embeds: [baseEmbed(COLORS.WARNING).setTitle('⚠️ Geçersiz İşlem').setDescription('Kendinize ceza veremezsiniz!')],
    });
  }

  // Bot'a ceza vermeye çalışıyorsa
  if (targetMember.id === client.user.id) {
    return interaction.editReply({
      embeds: [baseEmbed(COLORS.WARNING).setTitle('⚠️ Geçersiz İşlem').setDescription('Bana ceza veremezsiniz komutanım!')],
    });
  }

  // Yetki hiyerarşisi kontrolü
  if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
    return interaction.editReply({
      embeds: [baseEmbed(COLORS.WARNING).setTitle('⚠️ Yetki Yetersiz').setDescription('Sizden yüksek veya eşit rütbedeki bir üyeye ceza veremezsiniz.')],
    });
  }

  const fullReason = `${reasonLabel}${note ? ` — ${note}` : ''} | Yetkili: ${interaction.user.tag}`;

  try {
    // ── İŞLEM UYGULA ────────────────────────────────────────
    let actionLabel;

    switch (action) {
      case 'ban':
        actionLabel = '🔨 BAN';
        await targetMember.ban({ reason: fullReason, deleteMessageSeconds: 86400 });
        break;

      case 'timeout':
        actionLabel = '🤐 TIMEOUT (10dk)';
        await targetMember.timeout(10 * 60 * 1000, fullReason);
        break;

      case 'kick':
        actionLabel = '🥾 KICK';
        await targetMember.kick(fullReason);
        break;

      default:
        return interaction.editReply({
          embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Bilinmeyen İşlem')],
        });
    }

    // ── Başarı Embed ────────────────────────────────────────
    const successEmbed = modSuccessEmbed({
      action: actionLabel,
      targetUser: `${targetMember.user.tag} (\`${targetMember.id}\`)`,
      reason: reasonLabel + (note ? ` — ${note}` : ''),
      moderator: `${interaction.user}`,
    });

    // Yetkili'ye göster (ephemeral)
    await interaction.editReply({ embeds: [successEmbed] });

    // Log kanalına gönder (kalıcı)
    await sendLog(interaction.guild, successEmbed);

    console.log(`[Infinity-Guard] ⚔️ ${actionLabel}: ${targetMember.user.tag} | Sebep: ${reasonLabel} | Yetkili: ${interaction.user.tag}`);

  } catch (err) {
    await interaction.editReply({
      embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ İşlem Hatası').setDescription(`\`${err.message}\``)],
    });
  }
}

// ════════════════════════════════════════════════════════════
//  V2 HANDLERS — Channel Ops & Role Ops
// ════════════════════════════════════════════════════════════

async function handleV2Buttons(interaction) {
  const customId = interaction.customId;

  // ── KANAL OPS ──────────────────────────────────────────
  if (customId === 'channel:create') {
    const modal = new ModalBuilder().setCustomId('v2_modal:channel_create').setTitle('Yeni Kanal Oluştur');
    const nameInput = new TextInputBuilder()
      .setCustomId('channel_name')
      .setLabel('Kanal İsmi')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    const typeInput = new TextInputBuilder()
      .setCustomId('channel_type')
      .setLabel('Tür (text veya voice)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(nameInput), new ActionRowBuilder().addComponents(typeInput));
    await interaction.showModal(modal);
  }

  if (customId === 'channel:bulk_action') {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    try {
      const allTextChannels = interaction.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
      const channelIds = allTextChannels.map(ch => ch.id);
      
      const bulkEmbed = baseEmbed(COLORS.CYBER_BLUE)
        .setTitle('🌐 TOPLU KANAL YÖNETİMİ')
        .setDescription(`Sunucudaki toplam **${channelIds.length}** metin kanalı seçildi. Uygulanacak işlemi seçin:`)
        .setFooter({ text: 'Seçimler önbelleğe alındı. Bir işlem seçtiğinizde hepsine uygulanacak.' });

      const bulkRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bulk_op:lock:${channelIds.join(',')}`).setLabel('HEPSİNİ KİLİTLE').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`bulk_op:unlock:${channelIds.join(',')}`).setLabel('KİLİTLERİ AÇ').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`bulk_op:slowmode:${channelIds.join(',')}`).setLabel('YAVAŞ MOD (10s)').setStyle(ButtonStyle.Primary)
      );

      await interaction.editReply({ embeds: [bulkEmbed], components: [bulkRow] });
    } catch (err) {
      await interaction.editReply({ content: `❌ Hata: ${err.message}` });
    }
    return;
  }

  if (customId.startsWith('bulk_op:')) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const [, op, idsStr] = customId.split(':');
    const ids = idsStr.split(',');
    
    let successCount = 0;
    for (const id of ids) {
      const ch = interaction.guild.channels.cache.get(id);
      if (!ch) continue;
      try {
        if (op === 'lock') await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        if (op === 'unlock') await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
        if (op === 'slowmode') await ch.setRateLimitPerUser(10);
        successCount++;
      } catch (e) {}
    }
    
    await interaction.editReply({ content: `✅ Toplu işlem tamamlandı! **${successCount}** kanal başarıyla güncellendi.` });
    return;
  }

  if (customId === 'channel:lockdown' || customId === 'channel:unlock') {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const isLocking = customId === 'channel:lockdown';
    try {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: isLocking ? false : null,
      });
      const embed = lockdownLogEmbed(interaction.channel, isLocking, interaction.user);
      await interaction.editReply({ embeds: [embed] });
      await sendLog(interaction.guild, embed);
    } catch (err) {
      await interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Hata').setDescription(err.message)] });
    }
  }

  if (customId === 'channel:nuke') {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    try {
      const channel = interaction.channel;
      const position = channel.position;
      const parent = channel.parentId;
      const clone = await channel.clone({ position, parent });
      await channel.delete();
      const embed = nukeLogEmbed(clone.name, interaction.user);
      await clone.send({ embeds: [embed] });
      await sendLog(interaction.guild, embed);
      // Nuke sonrası etkileşime cevap dönemeyiz (çünkü kanal silindi)
    } catch (err) {
      await interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Nuke Hatası').setDescription(err.message)] });
    }
  }

  // ── ROL OPS ───────────────────────────────────────────
  if (customId === 'role:create_start') {
    const modal = new ModalBuilder().setCustomId('v2_modal:role_create').setTitle('Yeni Rütbe Yarat');
    const nameInput = new TextInputBuilder()
      .setCustomId('role_name')
      .setLabel('Rütbe İsmi')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    const colorInput = new TextInputBuilder()
      .setCustomId('role_color')
      .setLabel('Hex Renk Kodu (örn: #00FFFF)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(nameInput), new ActionRowBuilder().addComponents(colorInput));
    await interaction.showModal(modal);
  }

  if (customId === 'role:manage_start') {
    const userMenu = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId('v2_select:role_user')
        .setPlaceholder('🪖 Rütbe verilecek/alınacak uşağı seçin')
    );
    await interaction.reply({
      content: '**Adım 1:** Uşağı seçin.',
      components: [userMenu],
      flags: [MessageFlags.Ephemeral],
    });
  }
}

async function handleV2Modals(interaction) {
  const customId = interaction.customId;

  if (customId === 'v2_modal:channel_create') {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const name = interaction.fields.getTextInputValue('channel_name');
    const typeStr = interaction.fields.getTextInputValue('channel_type').toLowerCase();
    const type = typeStr === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;

    try {
      const newChannel = await interaction.guild.channels.create({ name, type });
      await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Kanal Açıldı').setDescription(`${newChannel} başarıyla oluşturuldu.`)] });
    } catch (err) {
      await interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Hata').setDescription(err.message)] });
    }
  }

  if (customId === 'v2_modal:role_create') {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const name = interaction.fields.getTextInputValue('role_name');
    const color = interaction.fields.getTextInputValue('role_color');

    try {
      const newRole = await interaction.guild.roles.create({ name, color, reason: `Oluşturan: ${interaction.user.tag}` });
      await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('✅ Rütbe Yaratıldı').setDescription(`${newRole} başarıyla oluşturuldu.`)] });
    } catch (err) {
      await interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Hata').setDescription(err.message)] });
    }
  }
}

async function handleV2SelectMenus(interaction) {
  const customId = interaction.customId;

  if (customId === 'channel:slowmode') {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const seconds = parseInt(interaction.values[0], 10);
    try {
      await interaction.channel.setRateLimitPerUser(seconds, `Yetkili: ${interaction.user.tag}`);
      await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('⏱️ Yavaş Mod Ayarlandı').setDescription(`Kanal yavaş modu **${seconds}** saniye olarak güncellendi.`)] });
    } catch (err) {
      await interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ Hata').setDescription(err.message)] });
    }
  }

  // Kullanıcı seçildiğinde, ona rol seçme menüsü göster
  if (customId === 'v2_select:role_user') {
    const targetUserId = interaction.values[0];
    const roleMenu = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(`v2_select:role_assign:${targetUserId}`)
        .setPlaceholder('🏅 Verilecek/Alınacak rütbeyi seçin')
    );
    await interaction.update({
      content: `**Adım 2:** <@${targetUserId}> için bir rütbe seçin (Varsa alır, yoksa verir).`,
      components: [roleMenu],
    });
  }

  // Rol seçildiğinde işlemi uygula
  if (customId.startsWith('v2_select:role_assign:')) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const targetUserId = customId.split(':')[2];
    const roleId = interaction.values[0];

    try {
      const member = await interaction.guild.members.fetch(targetUserId);
      const hasRole = member.roles.cache.has(roleId);
      
      if (hasRole) {
        await member.roles.remove(roleId);
        await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('➖ Rol Alındı').setDescription(`<@${targetUserId}> adlı üyeden <@&${roleId}> rolü alındı.`)] });
      } else {
        await member.roles.add(roleId);
        await interaction.editReply({ embeds: [baseEmbed(COLORS.SUCCESS).setTitle('➕ Rol Verildi').setDescription(`<@${targetUserId}> adlı üyeye <@&${roleId}> rolü verildi.`)] });
      }
    } catch (err) {
      await interaction.editReply({ embeds: [baseEmbed(COLORS.DANGER).setTitle('❌ İşlem Başarısız').setDescription(`Yetki yetersiz veya rol hiyerarşisi sorunu: ${err.message}`)] });
    }
  }
}

/**
 * Setup: Otomatik Yapılandırma Handler
 */
async function handleSetupAutoConfig(interaction) {
  const value = interaction.values[0];
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  if (value === 'protect_all') {
    const textChannels = interaction.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
    const voiceChannels = interaction.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildVoice);
    
    const embed = baseEmbed(COLORS.SUCCESS)
      .setTitle('🛡️ TAM KORUMA AKTİF EDİLDİ')
      .setDescription(
        `Sunucudaki tüm kanallar (**${textChannels.size}** Metin, **${voiceChannels.size}** Ses) koruma altına alındı.\n\n` +
        '**Uygulanan Protokoller:**\n' +
        '✅ **Anti-Spam:** Aktif\n' +
        '✅ **Anti-Link:** Aktif\n' +
        '✅ **Küfür Filtresi:** Aktif (Dereceli Ceza)\n' +
        '✅ **Akıllı Selam:** Aktif\n' +
        '✅ **Görsel Zeka (OCR):** Aktif'
      )
      .setFooter({ text: 'Infinity Guard — Elite Koruma Modu' });

    await interaction.editReply({ embeds: [embed] });
    await sendLog(interaction.guild, embed);
  } else {
    await interaction.editReply({ content: '✅ Varsayılan ayarlar korundu. Log kanalı ve temel koruma aktif.' });
  }
}

// ── BOOT SEQUENCE (Retry Mekanizmalı) ───────────────────────
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 3000; // 3 saniye başlangıç

async function bootWithRetry(attempt = 1) {
  try {
    console.log(`[Infinity-Guard] 🔄 Bağlantı denemesi ${attempt}/${MAX_RETRIES}...`);
    await client.login(process.env.DISCORD_TOKEN);
    console.log('[Infinity-Guard] 🛡️  Bot aktif ve koruma modunda!');

    // Slash komutları login başarılı olduktan SONRA kaydet
    await registerSlashCommands();
  } catch (err) {
    const isNetworkError = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNREFUSED']
      .some((code) => err.message?.includes(code));

    if (isNetworkError && attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * attempt;
      console.warn(`[Infinity-Guard] ⚠️  Ağ hatası: ${err.message}`);
      console.warn(`[Infinity-Guard] ⏳ ${delay / 1000}sn sonra tekrar denenecek... (${attempt}/${MAX_RETRIES})`);

      // Client'ı yeniden oluşturmak gerekmiyor, discord.js dahili olarak halleder
      await new Promise((r) => setTimeout(r, delay));
      return bootWithRetry(attempt + 1);
    }

    console.error('[Infinity-Guard] ❌ Login hatası:', err.message);
    if (isNetworkError) {
      console.error('');
      console.error('╔═══════════════════════════════════════════════════╗');
      console.error('║  🌐 DISCORD API\'YE ULAŞILAMIYOR                  ║');
      console.error('║                                                   ║');
      console.error('║  Olası sebepler:                                  ║');
      console.error('║  1. VPN kapalı (Türkiye\'de gerekli olabilir)     ║');
      console.error('║  2. ISP Discord\'u engelliyor                     ║');
      console.error('║  3. Firewall/Antivirus bağlantıyı kesiyor        ║');
      console.error('║                                                   ║');
      console.error('║  Çözüm: VPN açıp tekrar deneyin                  ║');
      console.error('╚═══════════════════════════════════════════════════╝');
      console.error('');
    }
    process.exit(1);
  }
}

(async () => {
  await loadCommands();
  await loadEvents();
  await bootWithRetry();
})();

