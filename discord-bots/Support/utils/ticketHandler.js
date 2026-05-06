import { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  ChannelType, 
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MessageFlags
} from 'discord.js';
import { CONFIG } from './config.js';
import { ticketOpenEmbed, staffControlsEmbed, baseEmbed } from './embeds.js';

export async function handleTicketOpenModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('modal:ticket_open')
    .setTitle('🎫 Destek Talebi Formu');

  const titleInput = new TextInputBuilder()
    .setCustomId('ticket_title')
    .setLabel('Sorun Başlığı')
    .setPlaceholder('Örn: Üyelik Sorunu')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const descInput = new TextInputBuilder()
    .setCustomId('ticket_desc')
    .setLabel('Detaylı Açıklama')
    .setPlaceholder('Lütfen yaşadığınız sorunu detaylıca açıklayın...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput)
  );

  await interaction.showModal(modal);
}

export async function handleTicketSubmit(interaction, client) {
  const title = interaction.fields.getTextInputValue('ticket_title');
  const desc = interaction.fields.getTextInputValue('ticket_desc');

  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  try {
    const guild = interaction.guild;
    const channelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Yetki Overwrite'larını dinamik hazırla
    const overwrites = [
      {
        id: guild.id,
        type: 0, // Everyone Role
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: interaction.user.id,
        type: 1, // Member
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
    ];

    // Staff ID'lerini (Rol veya Kullanıcı) ekle
    const mentionList = [];
    for (const id of CONFIG.STAFF_IDS) {
      // Önce rol mü diye bak (Roller genelde cache'dedir)
      const isRole = guild.roles.cache.has(id);
      // Kullanıcı mı diye bak (Kullanıcılar cache'de olmayabilir ama intent varsa interaction sırasında eklenmiş olabilirler)
      const isMember = guild.members.cache.has(id);

      if (isRole || isMember) {
        overwrites.push({
          id: id,
          type: isRole ? 0 : 1, // 0: Role, 1: Member (Discord.js OverwriteType)
          allow: [
            PermissionFlagsBits.ViewChannel, 
            PermissionFlagsBits.SendMessages, 
            PermissionFlagsBits.ReadMessageHistory, 
            PermissionFlagsBits.ManageMessages
          ],
        });
        mentionList.push(isRole ? `<@&${id}>` : `<@${id}>`);
      } else {
        // Eğer cache'de yoksa ama ID geçerli bir snowflake ise d.js v14 hata verebilir.
        // Bu yüzden cache'de olmayanları atlıyoruz veya güvenli bir şekilde ekliyoruz.
        // En sağlıklısı bilinmeyen ID'leri atlamak veya sadece Role olduğunu varsayıp type:0 vermek (ama riskli).
        console.warn(`[Support] ⚠️ Staff ID ${id} sunucu cache'inde bulunamadı, atlanıyor.`);
      }
    }
    
    // Kanal oluştur (Parent/Kategori kontrolü ile)
    let categoryId = CONFIG.TICKET_CATEGORY_ID.length > 10 ? CONFIG.TICKET_CATEGORY_ID : null;

    let channel;
    try {
      channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: overwrites,
      });
    } catch (err) {
      if (err.code === 50035 || err.rawError?.errors?.parent_id) {
        console.warn(`[Support] ⚠️ Kategori ID (${categoryId}) sorunlu. Kanal kategorisiz açılıyor.`);
        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          permissionOverwrites: overwrites,
        });
      } else {
        throw err;
      }
    }

    const embed = ticketOpenEmbed(interaction.user, title, desc);
    const staffEmbed = staffControlsEmbed();
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket:lock').setLabel('Kilitle').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ticket:unlock').setLabel('Kilidi Aç').setEmoji('🔓').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('ticket:close_request').setLabel('Talebi Sonlandır').setEmoji('⛔').setStyle(ButtonStyle.Danger)
    );

    // Yetkilileri etiketle ve paneli gönder
    const staffMentions = mentionList.length > 0 ? mentionList.join(' ') : '`Yetkili Tanımlanmamış`';
    const mainMsg = await channel.send({ 
      content: `🔔 **Yeni Destek Talebi** | ${staffMentions}`, 
      embeds: [embed, staffEmbed], 
      components: [row] 
    });
    
    try { await mainMsg.pin(); } catch (e) {}

    await interaction.editReply(`✅ Destek talebiniz oluşturuldu: <#${channel.id}>`);
  } catch (err) {
    console.error('[Ticket] ❌ Kritik oluşturma hatası:', err);
    await interaction.editReply(`❌ Destek kanalı açılırken bir hata oluştu: \`${err.message}\``);
  }
}

export async function handleTicketAction(interaction) {
  const action = interaction.customId.split(':')[1];
  const channel = interaction.channel;

  // Ticket sahibini bul (Overwrites içindeki yetkililer ve everyone dışındaki ilk ID)
  const ownerId = channel.permissionOverwrites.cache.find(p => p.type === 1 && !CONFIG.STAFF_IDS.includes(p.id) && p.id !== interaction.guild.id)?.id;

  switch (action) {
    case 'lock':
      if (ownerId) {
        await channel.permissionOverwrites.edit(ownerId, { SendMessages: false });
        await interaction.reply({ embeds: [baseEmbed(CONFIG.COLORS.WARNING).setDescription('🔒 Kanal kilitlendi. Kullanıcı mesaj gönderemez.')] });
      } else {
        await interaction.reply({ content: '❌ Kullanıcı yetkisi bulunamadı.', flags: [MessageFlags.Ephemeral] });
      }
      break;

    case 'unlock':
      if (ownerId) {
        await channel.permissionOverwrites.edit(ownerId, { SendMessages: true });
        await interaction.reply({ embeds: [baseEmbed(CONFIG.COLORS.SUCCESS).setDescription('🔓 Kanal kilidi açıldı. Kullanıcı tekrar mesaj gönderebilir.')] });
      } else {
        await interaction.reply({ content: '❌ Kullanıcı yetkisi bulunamadı.', flags: [MessageFlags.Ephemeral] });
      }
      break;

    case 'close_request':
      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket:close_confirm').setLabel('Evet, Kapat').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket:cancel_close').setLabel('Vazgeç').setStyle(ButtonStyle.Secondary)
      );
      await interaction.reply({ 
        content: '⚠️ Bu talebi sonlandırmak istediğinizden emin misiniz? Konuşmalar loglanacak ve kanal silinecektir.', 
        components: [confirmRow], 
        flags: [MessageFlags.Ephemeral] 
      });
      break;

    case 'close_confirm':
      await handleTicketClose(interaction);
      break;

    case 'delete_ticket':
      await handleTicketDelete(interaction);
      break;

    case 'reopen_ticket':
      await handleTicketReopen(interaction);
      break;

    case 'reopen_from_log':
      await handleLogReopen(interaction);
      break;

    case 'transcript_ticket':
      await handleTicketTranscript(interaction);
      break;

    case 'cancel_close':
      await interaction.reply({ content: '❌ İşlem iptal edildi.', flags: [MessageFlags.Ephemeral] });
      break;
  }
}

async function handleTicketClose(interaction) {
  const channel = interaction.channel;
  await interaction.deferReply();

  try {
    // Ticket sahibini bul
    const ownerId = channel.permissionOverwrites.cache.find(p => p.type === 1 && !CONFIG.STAFF_IDS.includes(p.id) && p.id !== interaction.guild.id)?.id;

    if (ownerId) {
      // Kullanıcının görme yetkisini al (veya sadece yazma, ama genelde görme alınır)
      await channel.permissionOverwrites.edit(ownerId, { ViewChannel: false });
    }

    const embed = baseEmbed(CONFIG.COLORS.DANGER)
      .setTitle('🔒 Destek Talebi Kapatıldı')
      .setDescription('Bu talep yetkili tarafından kapatıldı. Aşağıdaki butonları kullanarak işlemi sonlandırabilir veya talebi geri açabilirsiniz.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket:reopen_ticket').setLabel('Yeniden Aç').setEmoji('🔓').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('ticket:transcript_ticket').setLabel('Transcript').setEmoji('📜').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ticket:delete_ticket').setLabel('Kanalı Sil').setEmoji('⛔').setStyle(ButtonStyle.Danger)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error('[Ticket] Kapatma hatası:', err);
    await interaction.editReply('❌ Kanal kapatılırken bir hata oluştu.');
  }
}

async function handleTicketDelete(interaction) {
  const channel = interaction.channel;
  await interaction.reply('⌛ Transcript oluşturuluyor ve kanal siliniyor...');

  try {
    const attachment = await generateTranscript(channel);
    console.log(`[Support] Log kanalı aranıyor: ${CONFIG.LOG_CHANNEL_ID}`);
    let logChannel = interaction.guild.channels.cache.get(CONFIG.LOG_CHANNEL_ID);
    if (!logChannel) {
      logChannel = await interaction.guild.channels.fetch(CONFIG.LOG_CHANNEL_ID).catch(() => null);
    }

    if (logChannel && (logChannel.type === ChannelType.GuildText || logChannel.type === ChannelType.GuildAnnouncement)) {
      console.log(`[Support] Log kanalı bulundu: ${logChannel.name}. Gönderiliyor...`);
      const ownerId = channel.permissionOverwrites.cache.find(p => p.type === 1 && !CONFIG.STAFF_IDS.includes(p.id) && p.id !== interaction.guild.id)?.id;
      const logEmbed = baseEmbed(CONFIG.COLORS.DANGER)
        .setTitle('⛔ Destek Talebi Silindi')
        .addFields(
          { name: '👤 Sahibi', value: ownerId ? `<@${ownerId}>` : 'Bilinmiyor', inline: true },
          { name: '👮 Silen Yetkili', value: `<@${interaction.user.id}>`, inline: true },
          { name: '📂 Kanal', value: `\`${channel.name}\``, inline: true }
        );

      // Mesajları JSON olarak yedekle (Restorasyon için)
      const messages = await channel.messages.fetch({ limit: 100 });
      const messageData = messages.reverse()
        .filter(m => !m.author.bot || m.embeds.length > 0) // Bot mesajlarını filtrele ama embedlıları tut (isteğe bağlı)
        .map(m => ({
          username: m.author.username,
          avatarURL: m.author.displayAvatarURL(),
          content: m.content,
          embeds: m.embeds,
          files: m.attachments.map(a => a.url)
        }));
      const dataBuffer = Buffer.from(JSON.stringify(messageData, null, 2));
      const dataAttachment = new AttachmentBuilder(dataBuffer, { name: `data-${channel.name}.json` });

      const logRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket:reopen_from_log:${ownerId || 'unknown'}:${channel.name.replace('ticket-', '')}`)
          .setLabel('Talebi Yeniden Aç')
          .setEmoji('🔓')
          .setStyle(ButtonStyle.Success)
      );

      await logChannel.send({ 
        embeds: [logEmbed], 
        files: [attachment, dataAttachment], 
        components: [logRow] 
      });
    } else {
      console.error(`[Support] ❌ Log kanalı bulunamadı! ID: ${CONFIG.LOG_CHANNEL_ID}`);
    }

    await channel.send('⚠️ Kanal 5 saniye içinde kalıcı olarak silinecektir...');
    setTimeout(() => channel.delete().catch(() => {}), 5000);
  } catch (err) {
    console.error('[Ticket] Silme hatası:', err);
    await channel.send(`❌ Silme işlemi sırasında hata oluştu: \`${err.message}\``);
  }
}

async function handleTicketTranscript(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
  try {
    const attachment = await generateTranscript(interaction.channel);
    await interaction.editReply({ content: '✅ Transcript hazır:', files: [attachment] });
  } catch (err) {
    await interaction.editReply(`❌ Transcript hatası: ${err.message}`);
  }
}

async function generateTranscript(channel) {
  try {
    // Alternatif kütüphaneyi dene
    const { createTranscript } = await import('discord-html-transcripts');
    return await createTranscript(channel, {
      limit: -1,
      fileName: `transcript-${channel.name}.html`,
      saveImages: true,
      poweredBy: false
    });
  } catch (err) {
    console.warn('[Support] HTML transcript hatası, basite geçiliyor:', err.message);
    const messages = await channel.messages.fetch({ limit: 100 });
    const logContent = messages.reverse().map(m => `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`).join('\n');
    return new AttachmentBuilder(Buffer.from(logContent), { name: `log-${channel.name}.txt` });
  }
}

function isStaff(member) {
  if (!member) return false;
  return CONFIG.STAFF_IDS.some(id => 
    member.id === id || member.roles.cache.has(id)
  );
}

export async function handleTicketReopen(interaction) {
  // Sadece yetkililer açabilir
  if (!isStaff(interaction.member)) {
    console.warn(`[Support] Yetkisiz açma denemesi! User: ${interaction.user.tag} (${interaction.user.id})`);
    return interaction.reply({ content: '❌ Bu işlemi sadece yetkililer yapabilir.', flags: [1 << 6] });
  }

  const channel = interaction.channel;
  await interaction.deferReply();

  try {
    const ownerId = channel.permissionOverwrites.cache.find(p => p.type === 1 && !CONFIG.STAFF_IDS.includes(p.id) && p.id !== interaction.guild.id)?.id;

    if (ownerId) {
      await channel.permissionOverwrites.edit(ownerId, { 
        ViewChannel: true, 
        SendMessages: true,
        ReadMessageHistory: true 
      });
    }

    const embed = baseEmbed(CONFIG.COLORS.SUCCESS)
      .setTitle('🔓 Destek Talebi Yeniden Açıldı')
      .setDescription(`Bu talep <@${interaction.user.id}> tarafından yeniden aktif edildi. Eski konuşmaları yukarıda görebilirsiniz.`);

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error('[Ticket] Yeniden açma hatası:', err);
    await interaction.editReply('❌ Kanal açılırken bir hata oluştu.');
  }
}

export async function handleLogReopen(interaction) {
  // Sadece yetkililer açabilir
  if (!isStaff(interaction.member)) {
    console.warn(`[Support] Yetkisiz LOG açma denemesi! User: ${interaction.user.tag} (${interaction.user.id})`);
    return interaction.reply({ content: '❌ Bu işlemi sadece yetkililer yapabilir.', flags: [MessageFlags.Ephemeral] });
  }

  const [,, ownerId, originalName] = interaction.customId.split(':');
  
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  try {
    const guild = interaction.guild;
    const channelName = `ticket-${originalName}`;

    // Yetki Overwrite'larını hazırla
    const overwrites = [
      { id: guild.id, type: 0, deny: [PermissionFlagsBits.ViewChannel] },
    ];

    if (ownerId !== 'unknown') {
      overwrites.push({
        id: ownerId,
        type: 1,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      });
    }

    for (const id of CONFIG.STAFF_IDS) {
      const isRole = guild.roles.cache.has(id);
      const isMember = guild.members.cache.has(id);

      if (isRole || isMember) {
        overwrites.push({
          id: id,
          type: isRole ? 0 : 1,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages],
        });
      }
    }

    const categoryId = CONFIG.TICKET_CATEGORY_ID.length > 10 ? CONFIG.TICKET_CATEGORY_ID : null;

    let channel;
    try {
      channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: overwrites,
      });
    } catch (err) {
      // Daha geniş kapsamlı hata kontrolü (ID geçersizse veya kategori değilse)
      if (err.code === 50035 || err.rawError?.errors?.parent_id) {
        console.warn(`[Support] Kategori ID (${categoryId}) sorunlu, kanal kategorisiz açılıyor.`);
        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          permissionOverwrites: overwrites,
        });
      } else {
        throw err;
      }
    }

    const embed = baseEmbed(CONFIG.COLORS.PRIMARY)
      .setTitle('🔓 Destek Talebi Yeniden Açıldı (Logdan)')
      .setDescription(`Bu talep <@${interaction.user.id}> tarafından loglar üzerinden yeniden aktif edildi.`)
      .addFields(
        { name: '👤 Sahibi', value: ownerId !== 'unknown' ? `<@${ownerId}>` : 'Bilinmiyor', inline: true }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket:lock').setLabel('Kilitle').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ticket:unlock').setLabel('Kilidi Aç').setEmoji('🔓').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('ticket:close_request').setLabel('Talebi Sonlandır').setEmoji('⛔').setStyle(ButtonStyle.Danger)
    );

    const staffMentions = CONFIG.STAFF_IDS.map(id => `<@&${id}>`).join(' ');
    await channel.send({ 
      content: `🔔 **Destek Talebi Yeniden Aktif Edildi** | ${staffMentions}`,
      embeds: [embed],
      components: [row]
    });

    // Eski konuşmaları (JSON) log mesajından alıp Webhook ile geri yükle
    try {
      const logMessage = interaction.message;
      const dataFile = logMessage.attachments.find(a => a.name.endsWith('.json'));
      
      if (dataFile) {
        const response = await fetch(dataFile.url);
        const messages = await response.json();
        
        if (messages.length > 0) {
          await channel.send('⏳ **Eski konuşmalar geri yükleniyor...**');
          
          const webhook = await channel.createWebhook({
            name: 'History Restorer',
            avatar: interaction.guild.iconURL()
          });

          for (const msg of messages) {
            try {
              await webhook.send({
                username: msg.username,
                avatarURL: msg.avatarURL,
                content: msg.content || (msg.files.length > 0 ? '' : '*(İçerik yok)*'),
                embeds: msg.embeds,
                files: msg.files
              });
            } catch (e) {
              console.error('[Support] Mesaj geri yükleme hatası:', e.message);
            }
          }
          
          await webhook.delete();
          await channel.send('✅ **Geçmiş başarıyla geri yüklendi.**');
        }
      }
    } catch (restoreErr) {
      console.warn('[Support] Mesaj restorasyon hatası:', restoreErr.message);
    }

    await interaction.editReply(`✅ Talep yeniden açıldı: <#${channel.id}>`);
  } catch (err) {
    console.error('[Ticket] Logdan açma hatası:', err);
    await interaction.editReply(`❌ Talep açılırken bir hata oluştu: \`${err.message}\``);
  }
}
