// ============================================================
//  SERVER BUILDER — Şablondan sunucu kurulum motoru
//  • Eski kanalları / rolleri siler
//  • Rolleri, kategorileri, kanalları ve izinleri oluşturur
//  • Kurallar, doğrulama, rol-al vb. mesajları gönderir
//  • Rol/kanal ID'lerini settings.json'a kaydeder
// ============================================================

import {
  ChannelType,
  PermissionFlagsBits as P,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildVerificationLevel,
  GuildExplicitContentFilter,
  GuildDefaultMessageNotifications,
  MessageFlags,
} from 'discord.js';
import {
  BRAND, BASE_MEMBER_PERMS, ROLE_TEMPLATE, CATEGORY_TEMPLATE,
  NOTIFICATION_ROLES, HOUSE_ROLES, RULES, FAQ, STAFF_GUIDE,
} from './serverTemplate.js';
import { getSettings, saveSettings } from './settingsManager.js';

const REASON = 'Infinity Guard — Sunucu şablonu kurulumu';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ════════════════════════════════════════════════════════════
//  İZİN OLUŞTURUCU
// ════════════════════════════════════════════════════════════
const ACCESS_ROLES = {
  staff:      ['destek', 'mod', 'lead_mod', 'ayk', 'uyk', 'cto', 'coo', 'byk', 'ceo', 'kurucu'],
  moderation: ['mod', 'lead_mod', 'ayk', 'uyk', 'cto', 'coo', 'byk', 'ceo', 'kurucu'],
  board:      ['uyk', 'cto', 'coo', 'byk', 'ceo', 'kurucu'],
  c_level:    ['cto', 'coo', 'byk', 'ceo', 'kurucu'],
  team:       ['uyk', 'cto', 'coo', 'byk', 'ceo', 'kurucu'],
  logs:       ['ayk', 'uyk', 'cto', 'coo', 'byk', 'ceo', 'kurucu'],
};

const TEXT_SEND = [P.SendMessages, P.SendMessagesInThreads, P.CreatePublicThreads, P.CreatePrivateThreads];
const CEZALI_DENY = [P.SendMessages, P.SendMessagesInThreads, P.CreatePublicThreads, P.AddReactions, P.Speak, P.Stream];

function buildOverwrites(access, ch, ctx) {
  const { everyoneId, R, verify, botId } = ctx;
  const map = new Map();
  const add = (id, allow = [], deny = []) => {
    if (!id) return;
    const e = map.get(id) || { allow: new Set(), deny: new Set() };
    allow.forEach((p) => { e.allow.add(p); e.deny.delete(p); });
    deny.forEach((p) => { e.deny.add(p); e.allow.delete(p); });
    map.set(id, e);
  };

  const isVoice = ch.type === 'voice';
  const memberTarget = verify ? R.uye : everyoneId;

  switch (access) {
    case 'public':
      add(everyoneId, [P.ViewChannel, P.ReadMessageHistory]);
      if (ch.readOnly) add(everyoneId, [], TEXT_SEND);
      if (ch.verifyOnly && verify) add(R.uye, [], [P.ViewChannel]); // doğrulananlar artık görmez
      break;

    case 'member':
      if (verify) {
        add(everyoneId, [], [P.ViewChannel]);
        add(R.uye, [P.ViewChannel]);
      }
      if (ch.readOnly && !isVoice) add(memberTarget, [], TEXT_SEND);
      add(R.cezali, [], CEZALI_DENY);
      break;

    default: { // staff / moderation / board / team / logs
      add(everyoneId, [], [P.ViewChannel]);
      const keys = [...(ACCESS_ROLES[access] || ACCESS_ROLES.board), ...(ch.roles || [])];
      keys.forEach((k) => add(R[k], [P.ViewChannel, P.ReadMessageHistory]));
      if (access === 'logs') keys.forEach((k) => add(R[k], [], TEXT_SEND));
    }
  }

  // Salt-okunur kanallarda yazabilecekler
  if (ch.readOnly && !isVoice && access !== 'logs') {
    ['kurucu', 'ceo', 'byk', 'coo', 'cto', 'uyk', ...(ch.writers || [])].forEach((k) => add(R[k], [P.ViewChannel, ...TEXT_SEND]));
  }

  // Bot her yeri görebilsin / yazabilsin
  add(botId, [P.ViewChannel, P.SendMessages, P.EmbedLinks, P.ReadMessageHistory, P.ManageChannels]);

  return [...map].map(([id, e]) => ({ id, allow: [...e.allow], deny: [...e.deny] }));
}

// ════════════════════════════════════════════════════════════
//  MESAJ ŞABLONLARI
// ════════════════════════════════════════════════════════════
const brandEmbed = (color = BRAND.COLOR) =>
  new EmbedBuilder().setColor(color).setFooter({ text: BRAND.FOOTER }).setTimestamp();

async function postTemplateMessages(guild, C, R, verify) {
  const icon = guild.iconURL({ size: 256 }) ?? undefined;
  const ch = (k) => (C[k] ? `<#${C[k]}>` : `#${k}`);

  // 👋 Hoş geldin
  await guild.channels.cache.get(C.hosgeldin)?.send({
    embeds: [
      brandEmbed(BRAND.ACCENT)
        .setTitle(`🌸 ${BRAND.NAME} Topluluğuna Hoş Geldin!`)
        .setThumbnail(icon)
        .setDescription(
          `Türkiye'nin anime & manga topluluğu **${BRAND.NAME}**'e hoş geldin! ✨\n\n` +
          `> 🌐 **Site:** ${BRAND.SITE}\n` +
          `> 📜 **Kurallar:** ${ch('kurallar')}\n` +
          (verify ? `> ✅ **Doğrulama:** ${ch('dogrulama')}\n` : '') +
          `> 🔔 **Bildirim Rolleri:** ${ch('rol_al')}\n` +
          `> 🎫 **Destek:** ${ch('destek')}\n\n` +
          '**İyi seyirler ve keyifli sohbetler!** 🍿',
        ),
    ],
  });

  // 📜 Kurallar
  await guild.channels.cache.get(C.kurallar)?.send({
    embeds: [
      brandEmbed()
        .setTitle(`📜 ${BRAND.NAME} — Sunucu Kuralları`)
        .setDescription(
          RULES.map(([t, d], i) => `**${i + 1}. ${t}**\n${d}`).join('\n\n') +
          '\n\n━━━━━━━━━━━━━━━━━━━━━━\n' +
          '**⚖️ Ceza Sistemi:** Uyarı → Susturma → Atılma → Yasaklama\n' +
          '🛡️ *Infinity Guard kural ihlallerini otomatik tespit eder ve cezalandırır.*',
        ),
    ],
  });

  // ✅ Doğrulama
  if (verify && C.dogrulama) {
    await guild.channels.cache.get(C.dogrulama)?.send({
      embeds: [
        brandEmbed(0x00FF88)
          .setTitle('✅ Doğrulama')
          .setDescription(
            `${ch('kurallar')} kanalındaki kuralları okuduysan aşağıdaki butona bas.\n\n` +
            '> Butona basarak kuralları **kabul etmiş** sayılırsın.\n' +
            '> Doğrulandıktan sonra tüm kanallara erişebilirsin. 🎉',
          ),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('kur:verify')
            .setLabel('Kuralları Okudum, Onaylıyorum')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success),
        ),
      ],
    });
  }

  // 🔔 Rol al
  await guild.channels.cache.get(C.rol_al)?.send({
    embeds: [
      brandEmbed(BRAND.ACCENT)
        .setTitle('🔔 Bildirim Rolleri')
        .setDescription(
          'Hangi konularda etiketlenmek istediğini seç. Butona tekrar basarak rolü bırakabilirsin.\n\n' +
          NOTIFICATION_ROLES.map((n) => `${n.emoji} **${n.label}** → <@&${R[n.key]}>`).join('\n'),
        ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        NOTIFICATION_ROLES.map((n) =>
          new ButtonBuilder()
            .setCustomId(`kur:notif:${n.key}`)
            .setLabel(n.label)
            .setEmoji(n.emoji)
            .setStyle(ButtonStyle.Secondary),
        ),
      ),
    ],
  });

  // 📚 Site Kılavuzu & Gamification
  await guild.channels.cache.get(C.site_rehber)?.send({
    embeds: [
      brandEmbed(BRAND.COLOR)
        .setTitle(`📚 ${BRAND.NAME} — Okur Kılavuzu & Sistemler`)
        .setDescription(
          `**${BRAND.NAME}** sıradan bir manga sitesi değil; RPG seviye atlama, Aura pazarı ve Haneler mekaniğine sahip interaktif bir evrendir!\n\n` +
          '**⚡ XP Nasıl Kazanılır?**\n' +
          '• Her okunan manga bölümü: `+10 XP`\n' +
          '• 7 günlük okuma serisi (streak): `+100 XP`\n' +
          '• Serileri ilk kez puanlamak: `+5 XP`\n\n' +
          '**🏆 Rütbeler (Maks Lv. 100):**\n' +
          '📖 Çaylak Okur (1-9) ➔ 🗺️ Maceracı (10-24) ➔ 🏹 Kıdemli Avcı (25-49) ➔ 🛡️ Üstün Şövalye (50-74) ➔ ⚔️ Hükümdar Muhafızı (75-99) ➔ 👑 Mahora Hükümdarı (Lv.100)\n\n' +
          '**✨ Aura Pazarı:**\n' +
          'Bölüm okudukça biriktirdiğin Auralarla siteden hareketli avatarlar, isim plaketleri ve auralar kuşanabilirsin!\n\n' +
          `> 🌐 Detaylı rehber: [mahorapeak.com.tr/rehber](${BRAND.SITE}/rehber)`
        ),
    ],
  });

  // 🏰 Hane Seçimi
  await guild.channels.cache.get(C.hane_sec)?.send({
    embeds: [
      brandEmbed(BRAND.ACCENT)
        .setTitle('🏰 4 Büyük Aethe Hanesi — Tarafını Seç!')
        .setDescription(
          'MahoraPeak evreninde ait olduğun haneyi seçerek rengini kuşan ve haneler arenasında söz sahibi ol!\n\n' +
          HOUSE_ROLES.map((h) => `${h.emoji} **${h.label}** — *${h.desc}*\n↳ Rol: <@&${R[h.key]}>`).join('\n\n') +
          '\n\n*Not: Bir haneye katılmak için aşağıdaki butona tıkla. Tekrar basarak ayrılabilirsin.*'
        ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        HOUSE_ROLES.map((h) =>
          new ButtonBuilder()
            .setCustomId(`kur:house:${h.key}`)
            .setLabel(h.label)
            .setEmoji(h.emoji)
            .setStyle(ButtonStyle.Primary)
        )
      ),
    ],
  });

  // ❓ SSS
  await guild.channels.cache.get(C.sss)?.send({
    embeds: [
      brandEmbed(0x00FFFF)
        .setTitle('❓ Sıkça Sorulan Sorular')
        .addFields(FAQ.map(([q, a]) => ({ name: q, value: a }))),
    ],
  });

  // 🎫 Destek
  await guild.channels.cache.get(C.destek)?.send({
    embeds: [
      brandEmbed(0x3DDC97)
        .setTitle('🎫 Destek Merkezi')
        .setDescription(
          'Bir sorun mu yaşıyorsun? Destek ekibimiz yardıma hazır!\n\n' +
          '> 📌 Support botunun **ticket paneli** bu kanala kurulacaktır.\n' +
          `> ❓ Önce ${ch('sss')} kanalına göz atmayı unutma.`,
        ),
    ],
  });

  // 📋 Yetkili rehberi
  await guild.channels.cache.get(C.y_duyuru)?.send({
    embeds: [
      brandEmbed(BRAND.GOLD)
        .setTitle('📋 Yetkili Hiyerarşisi & Rehber')
        .setDescription(
          STAFF_GUIDE.map(([r, d]) => `**${r}**\n> ${d}`).join('\n\n') +
          '\n\n━━━━━━━━━━━━━━━━━━━━━━\n' +
          '**📌 Temel Kurallar**\n' +
          '• Ceza vermeden önce kanıt (ekran görüntüsü) al.\n' +
          '• Kararsız kaldığın durumları ⚖️ ceza-tartışma kanalında sor.\n' +
          '• Yetkini kişisel meselelerde kullanma.\n' +
          '• Bot komutları: `/modpanel`, `/warn`, `/mute`, `/ban`, `/purge`',
        ),
    ],
  });
}

// ════════════════════════════════════════════════════════════
//  ANA KURULUM
// ════════════════════════════════════════════════════════════
/**
 * @param {import('discord.js').Guild} guild
 * @param {{ verify:boolean, deleteRoles:boolean, serverName?:string, keepChannelId?:string, executor:import('discord.js').User }} opts
 * @param {(text:string)=>Promise<void>} progress
 */
export async function buildServer(guild, opts, progress = async () => {}) {
  const { verify, deleteRoles, serverName, keepChannelId, executor } = opts;
  const stats = { chDeleted: 0, chFailed: [], roleDeleted: 0, roleSkipped: 0, rolesCreated: 0, chCreated: 0, errors: [] };
  const me = guild.members.me;

  // ── 1. Eski kanalları sil ─────────────────────────────────
  await progress('🗑️ Eski kanallar siliniyor...');
  await guild.channels.fetch();
  const oldChannels = [...guild.channels.cache.values()]
    .filter((c) => !c.isThread() && c.id !== keepChannelId)
    // önce alt kanallar, en son kategoriler
    .sort((a, b) => (a.type === ChannelType.GuildCategory) - (b.type === ChannelType.GuildCategory));

  for (const c of oldChannels) {
    try { await c.delete(REASON); stats.chDeleted++; }
    catch { stats.chFailed.push(c); } // community kural/duyuru kanalı vb.
  }

  // ── 2. Eski rolleri sil ───────────────────────────────────
  if (deleteRoles) {
    await progress('🗑️ Eski roller siliniyor...');
    await guild.roles.fetch();
    const oldRoles = guild.roles.cache.filter((r) => r.id !== guild.id && !r.managed);
    for (const r of oldRoles.values()) {
      if (!r.editable) { stats.roleSkipped++; continue; }
      try { await r.delete(REASON); stats.roleDeleted++; }
      catch { stats.roleSkipped++; }
    }
  }

  // ── 3. @everyone temel izinleri ───────────────────────────
  try { await guild.roles.everyone.setPermissions(BASE_MEMBER_PERMS, REASON); }
  catch (e) { stats.errors.push(`@everyone izinleri: ${e.message}`); }

  // ── 4. Rolleri oluştur (yukarıdan aşağıya) ────────────────
  await progress('🎭 Roller oluşturuluyor...');
  const R = {};
  for (const def of ROLE_TEMPLATE) {
    try {
      const role = await guild.roles.create({
        name: def.name,
        color: def.separator ? 0x2B2D31 : (def.color ?? 0),
        hoist: def.separator ? false : !!def.hoist,
        mentionable: !!def.mentionable,
        permissions: def.permissions ?? [],
        reason: REASON,
      });
      R[def.key] = role.id;
      stats.rolesCreated++;
    } catch (e) {
      stats.errors.push(`Rol "${def.name}": ${e.message}`);
    }
  }

  // Yeni roller hep en alta eklendiği için sırayı garantiye al
  try {
    const positions = ROLE_TEMPLATE
      .filter((d) => R[d.key])
      .map((d, i, arr) => ({ role: R[d.key], position: arr.length - i }));
    await guild.roles.setPositions(positions);
  } catch (e) {
    stats.errors.push(`Rol sıralaması: ${e.message}`);
  }

  // ── 5. Kategoriler & kanallar ─────────────────────────────
  await progress('📁 Kategoriler ve kanallar oluşturuluyor...');
  const ctx = { everyoneId: guild.id, R, verify, botId: me.id };
  const C = {};

  for (const cat of CATEGORY_TEMPLATE) {
    let category;
    try {
      category = await guild.channels.create({
        name: cat.name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: buildOverwrites(cat.access, { readOnly: cat.readOnly }, ctx),
        reason: REASON,
      });
      C[cat.key] = category.id;
      stats.chCreated++;
    } catch (e) {
      stats.errors.push(`Kategori "${cat.name}": ${e.message}`);
      continue;
    }

    for (const chDef of cat.channels) {
      if (chDef.verifyOnly && !verify) continue;
      const isVoice = chDef.type === 'voice';
      const merged = { ...chDef, readOnly: chDef.readOnly ?? cat.readOnly };
      try {
        const created = await guild.channels.create({
          name: chDef.name,
          type: isVoice ? ChannelType.GuildVoice : ChannelType.GuildText,
          parent: category.id,
          topic: isVoice ? undefined : chDef.topic,
          rateLimitPerUser: !isVoice && chDef.slowmode ? chDef.slowmode : undefined,
          userLimit: isVoice ? chDef.userLimit : undefined,
          permissionOverwrites: buildOverwrites(chDef.access || cat.access, merged, ctx),
          reason: REASON,
        });
        C[chDef.key] = created.id;
        stats.chCreated++;
      } catch (e) {
        stats.errors.push(`Kanal "${chDef.name}": ${e.message}`);
      }
    }
  }

  // ── 6. Sunucu ayarları ────────────────────────────────────
  await progress('⚙️ Sunucu ayarları yapılandırılıyor...');
  const edit = {
    verificationLevel: GuildVerificationLevel.Medium,
    explicitContentFilter: GuildExplicitContentFilter.AllMembers,
    defaultMessageNotifications: GuildDefaultMessageNotifications.OnlyMentions,
    reason: REASON,
  };
  if (C.hosgeldin) edit.systemChannel = C.hosgeldin;
  if (C.afk) { edit.afkChannel = C.afk; edit.afkTimeout = 900; }
  if (serverName) edit.name = serverName;
  if (guild.features.includes('COMMUNITY')) {
    if (C.kurallar) edit.rulesChannel = C.kurallar;
    if (C.y_duyuru) edit.publicUpdatesChannel = C.y_duyuru;
  }
  try { await guild.edit(edit); }
  catch (e) { stats.errors.push(`Sunucu ayarları: ${e.message}`); }

  // Community nedeniyle silinemeyen eski kanalları tekrar dene
  for (const c of [...stats.chFailed]) {
    try { await c.delete(REASON); stats.chDeleted++; stats.chFailed.splice(stats.chFailed.indexOf(c), 1); }
    catch { /* yine olmadıysa bırak */ }
  }

  // ── 7. Mesajlar ───────────────────────────────────────────
  await progress('✉️ Kurallar, doğrulama ve rol menüleri gönderiliyor...');
  try { await postTemplateMessages(guild, C, R, verify); }
  catch (e) { stats.errors.push(`Mesajlar: ${e.message}`); }

  // ── 8. Ayarları kaydet ────────────────────────────────────
  const settings = getSettings();
  settings.templates = settings.templates || {};
  settings.templates[guild.id] = {
    roles: R,
    channels: C,
    verify,
    createdAt: new Date().toISOString(),
    createdBy: executor?.id ?? null,
  };
  // Eski kanal ID'lerine ait özel koruma ayarları artık geçersiz
  settings.channels = Object.fromEntries(
    Object.entries(settings.channels || {}).filter(([id]) => guild.channels.cache.has(id)),
  );
  saveSettings(settings);

  return { stats, R, C };
}

/**
 * Mevcut üyelere rol dağıtır (arka planda, uzun sürebilir).
 */
export async function assignMemberRoles(guild, R) {
  let done = 0;
  try {
    const members = await guild.members.fetch();
    for (const m of members.values()) {
      const add = [];
      if (m.user.bot) { if (R.bot) add.push(R.bot); }
      else if (R.uye) add.push(R.uye);
      if (m.id === guild.ownerId && R.kurucu) add.push(R.kurucu);
      const missing = add.filter((id) => !m.roles.cache.has(id));
      if (missing.length === 0) continue;
      try { await m.roles.add(missing, REASON); done++; }
      catch { /* hiyerarşi üstündeki üyeler vb. */ }
      if (done % 10 === 0) await sleep(250);
    }
  } catch (e) {
    console.error('[Infinity-Guard] Üye rol dağıtım hatası:', e.message);
  }
  return done;
}

/**
 * Kurulum özeti embed'i
 */
export function summaryEmbed(guild, { stats, R, C }, verify) {
  const embed = new EmbedBuilder()
    .setColor(stats.errors.length ? 0xFFAA00 : 0x00FF88)
    .setTitle(`✅ ${BRAND.NAME} Sunucu Şablonu Kuruldu`)
    .setDescription(
      '```\n' +
      '╔═══════════════════════════════════════╗\n' +
      '║   INFINITY GUARD — KURULUM TAMAM      ║\n' +
      '╚═══════════════════════════════════════╝\n' +
      '```',
    )
    .addFields(
      { name: '🗑️ Silinen Kanal', value: `\`${stats.chDeleted}\``, inline: true },
      { name: '🗑️ Silinen Rol', value: `\`${stats.roleDeleted}\``, inline: true },
      { name: '⏭️ Atlanan Rol', value: `\`${stats.roleSkipped}\``, inline: true },
      { name: '🎭 Oluşturulan Rol', value: `\`${stats.rolesCreated}\``, inline: true },
      { name: '📁 Oluşturulan Kanal', value: `\`${stats.chCreated}\``, inline: true },
      { name: '✅ Doğrulama', value: verify ? '`Aktif`' : '`Kapalı`', inline: true },
      {
        name: '🏛️ Üst Yönetim Rolleri',
        value: ['kurucu', 'ceo', 'byk', 'coo', 'cto', 'uyk', 'ayk', 'lead_mod', 'mod', 'destek']
          .filter((k) => R[k])
          .map((k) => `<@&${R[k]}>`)
          .join('\n') || '—',
      },
      {
        name: '📌 Sonraki Adımlar',
        value:
          `• Yetkililere rollerini ver (BYK/UYK/AYK/Mod)\n` +
          `• Support botunda \`LOG_CHANNEL_ID\` → ${C.ticket_log ? `<#${C.ticket_log}>` : 'ticket-log'}\n` +
          `• Ticket panelini ${C.destek ? `<#${C.destek}>` : 'destek-talebi'} kanalına kur\n` +
          '• Bot rolünü rol listesinde **en üstte** tut',
      },
    )
    .setFooter({ text: BRAND.FOOTER })
    .setTimestamp();

  if (stats.errors.length) {
    embed.addFields({
      name: `⚠️ Uyarılar (${stats.errors.length})`,
      value: stats.errors.slice(0, 8).map((e) => `• ${e}`).join('\n').slice(0, 1024),
    });
  }
  if (stats.chFailed.length) {
    embed.addFields({
      name: '⚠️ Silinemeyen Kanallar',
      value: stats.chFailed.map((c) => `• ${c.name}`).join('\n').slice(0, 1024),
    });
  }
  return embed;
}

// ════════════════════════════════════════════════════════════
//  KALICI BUTONLAR — kur:verify / kur:notif:<rol>
// ════════════════════════════════════════════════════════════
export async function handleTemplateButton(interaction) {
  const tpl = getSettings().templates?.[interaction.guild.id];
  if (!tpl) {
    return interaction.reply({ content: '❌ Bu sunucuda şablon kaydı bulunamadı.', flags: [MessageFlags.Ephemeral] });
  }
  const member = interaction.member;

  // ✅ Doğrulama
  if (interaction.customId === 'kur:verify') {
    const roleId = tpl.roles?.uye;
    if (!roleId || !interaction.guild.roles.cache.has(roleId)) {
      return interaction.reply({ content: '❌ Üye rolü bulunamadı, lütfen yetkililere bildir.', flags: [MessageFlags.Ephemeral] });
    }
    if (member.roles.cache.has(roleId)) {
      return interaction.reply({ content: '✅ Zaten doğrulanmışsın!', flags: [MessageFlags.Ephemeral] });
    }
    try {
      await member.roles.add(roleId, 'Infinity Guard — Doğrulama');
      return interaction.reply({
        content: `🎉 Doğrulandın! **${BRAND.NAME}** ailesine hoş geldin. Artık tüm kanallara erişebilirsin.`,
        flags: [MessageFlags.Ephemeral],
      });
    } catch {
      return interaction.reply({ content: '❌ Rol verilemedi. Bot rolünün yeterince yüksek olduğundan emin olun.', flags: [MessageFlags.Ephemeral] });
    }
  }

  // 🔔 Bildirim rolleri
  if (interaction.customId.startsWith('kur:notif:')) {
    const key = interaction.customId.split(':')[2];
    const roleId = tpl.roles?.[key];
    const def = NOTIFICATION_ROLES.find((n) => n.key === key);
    if (!roleId || !def || !interaction.guild.roles.cache.has(roleId)) {
      return interaction.reply({ content: '❌ Bu rol artık mevcut değil.', flags: [MessageFlags.Ephemeral] });
    }
    try {
      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId, 'Bildirim rolü bırakıldı');
        return interaction.reply({ content: `🔕 ${def.emoji} **${def.label}** bildirim rolü kaldırıldı.`, flags: [MessageFlags.Ephemeral] });
      }
      await member.roles.add(roleId, 'Bildirim rolü alındı');
      return interaction.reply({ content: `🔔 ${def.emoji} **${def.label}** bildirim rolü verildi!`, flags: [MessageFlags.Ephemeral] });
    } catch {
      return interaction.reply({ content: '❌ Rol güncellenemedi.', flags: [MessageFlags.Ephemeral] });
    }
  }

  // 🏰 Hane rolleri
  if (interaction.customId.startsWith('kur:house:')) {
    const key = interaction.customId.split(':')[2];
    const roleId = tpl.roles?.[key];
    const def = HOUSE_ROLES.find((h) => h.key === key);
    if (!roleId || !def || !interaction.guild.roles.cache.has(roleId)) {
      return interaction.reply({ content: '❌ Bu hane rolü bulunamadı.', flags: [MessageFlags.Ephemeral] });
    }

    try {
      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId, 'Haneden ayrıldı');
        return interaction.reply({ content: `🏳️ ${def.emoji} **${def.label}** hanesinden ayrıldın.`, flags: [MessageFlags.Ephemeral] });
      }

      // Diğer hanelerden çıkar (tek hane kuralı)
      const otherHouseRoleIds = HOUSE_ROLES.filter(h => h.key !== key).map(h => tpl.roles?.[h.key]).filter(Boolean);
      for (const otherId of otherHouseRoleIds) {
        if (member.roles.cache.has(otherId)) {
          await member.roles.remove(otherId, 'Yeni haneye geçildi').catch(() => null);
        }
      }

      await member.roles.add(roleId, 'Haneye katıldı');
      return interaction.reply({ content: `🔥 ${def.emoji} Tebrikler! **${def.label}** hanesine katıldın. Sancağın dalgalansın!`, flags: [MessageFlags.Ephemeral] });
    } catch {
      return interaction.reply({ content: '❌ Hane rolü verilemedi.', flags: [MessageFlags.Ephemeral] });
    }
  }
}
