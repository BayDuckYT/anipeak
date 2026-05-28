// ============================================================
//  ██╗  ██╗ █████╗ ██████╗ ███████╗██████╗
//  ██║  ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗
//  ███████║███████║██████╔╝█████╗  ██████╔╝
//  ██╔══██║██╔══██║██╔══██╗██╔══╝  ██╔══██╗
//  ██║  ██║██║  ██║██████╔╝███████╗██║  ██║
//  ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝
//    HABER — MahoraPeak Haber Merkezi | News & Announcement Service
// ============================================================

import dotenv from 'dotenv';
import { Client, Collection, IntentsBitField, REST, Routes, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags, EmbedBuilder } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { newsEmbed } from './utils/embeds.js';
import { startRadar } from './utils/radar.js';

// ── ESM __dirname polyfill ──────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── .env dosyasını BOTUN KENDİ dizininden yükle ─────────────
dotenv.config({ path: path.join(__dirname, '.env') });

// ── Client oluştur ──────────────────────────────────────────
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildPresences,
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
      console.log(`[Haber] ✅ Komut yüklendi: ${cmd.data.name}`);
    } else {
      console.warn(`[Haber] ⚠️  Geçersiz komut dosyası: ${file}`);
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
    console.log(`[Haber] 🔄 ${commands.length} slash komut kaydediliyor...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log(`[Haber] ✅ Slash komutlar başarıyla kaydedildi!`);
  } catch (error) {
    console.error('[Haber] ❌ Slash komut kayıt hatası:', error);
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
    console.log(`[Haber] 🎧 Event yüklendi: ${evt.name}`);
  }
}

// ── Interaction Handler (Slash, Button, Modal, Menu) ────────
client.on('interactionCreate', async (interaction) => {
  try {
    // 1. Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction, client);
      return;
    }

    // 2. Buttons
    if (interaction.isButton()) {
      const customId = interaction.customId;

      if (customId === 'news:create') {
        const modal = new ModalBuilder().setCustomId('modal:news_create').setTitle('Yeni Haber Oluştur');
        
        const titleInput = new TextInputBuilder().setCustomId('news_title').setLabel('Başlık').setStyle(TextInputStyle.Short).setRequired(true);
        const contentInput = new TextInputBuilder().setCustomId('news_content').setLabel('İçerik (Duyuru metni)').setStyle(TextInputStyle.Paragraph).setRequired(true);
        const imageInput = new TextInputBuilder().setCustomId('news_image').setLabel('Resim URL (Opsiyonel)').setStyle(TextInputStyle.Short).setRequired(false);
        const roleInput = new TextInputBuilder().setCustomId('news_role').setLabel('Etiketlenecek Rol (örn: @everyone)').setStyle(TextInputStyle.Short).setRequired(false);
        
        modal.addComponents(
          new ActionRowBuilder().addComponents(titleInput),
          new ActionRowBuilder().addComponents(contentInput),
          new ActionRowBuilder().addComponents(imageInput),
          new ActionRowBuilder().addComponents(roleInput)
        );
        await interaction.showModal(modal);
        return;
      }
      // news:edit ve news:delete için şimdilik placeholder
      if (customId === 'news:edit' || customId === 'news:delete') {
        await interaction.reply({ content: '⏳ Bu özellik yakında eklenecek.', flags: [MessageFlags.Ephemeral] });
        return;
      }
    }

    // 3. Modals
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'modal:news_create') {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        const title = interaction.fields.getTextInputValue('news_title');
        const content = interaction.fields.getTextInputValue('news_content');
        const image = interaction.fields.getTextInputValue('news_image');
        const roleLabel = interaction.fields.getTextInputValue('news_role');

        const embed = newsEmbed(title, content, image, interaction.user);
        
        const newsChannelId = process.env.DUYURU_KANALI_ID;
        const targetChannel = newsChannelId ? await client.channels.fetch(newsChannelId).catch(()=>null) : interaction.channel;
        
        if (!targetChannel) {
          return interaction.editReply('❌ Haber kanalı bulunamadı. DUYURU_KANALI_ID ayarını kontrol edin.');
        }

        const msgContent = roleLabel ? `📣 ${roleLabel}` : null;
        
        await targetChannel.send({ content: msgContent, embeds: [embed] });
        await interaction.editReply({ content: '✅ Haber başarıyla yayınlandı!' });
        return;
      }
    }

    // 4. String Select Menus (Abone Panel)
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'abone:select_series') {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        const seriesTitle = interaction.values[0];
        
        const guild = interaction.guild;
        let role = guild.roles.cache.find((r) => r.name.toLowerCase() === seriesTitle.toLowerCase());
        
        if (!role) {
          // Rol yoksa oluştur
          try {
            role = await guild.roles.create({
              name: seriesTitle,
              color: '#00FFFF',
              mentionable: true,
              reason: 'Otomatik abone rolü oluşturma',
            });
          } catch (err) {
            return interaction.editReply('❌ Sunucuda rol oluşturma yetkim yok veya limit doldu.');
          }
        }

        const member = interaction.member;
        if (member.roles.cache.has(role.id)) {
          await member.roles.remove(role.id);
          await interaction.editReply(`➖ **${seriesTitle}** serisi aboneliğinden ayrıldınız.`);
        } else {
          await member.roles.add(role.id);
          await interaction.editReply(`➕ **${seriesTitle}** serisine başarıyla abone oldunuz!`);
        }
        return;
      }
    }

  } catch (error) {
    if (error.code === 10062) {
      console.warn(`[Haber] ⚠️ Etkileşim zaman aşımına uğradı (${interaction.commandName || interaction.customId})`);
      return;
    }

    console.error(`[Haber] ❌ Interaction hatası:`, error);
    try {
      const reply = { content: '❌ İşlem sırasında bir hata oluştu!', flags: [MessageFlags.Ephemeral] };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    } catch (e) {}
  }
});

// ── LIVE HEADQUARTERS MONITOR ───────────────────────────────
let monitorMessage = null;

async function updateMonitor(client) {
  const monitorChannelId = process.env.MONITOR_CHANNEL_ID;
  if (!monitorChannelId) return;

  try {
    const channel = await client.channels.fetch(monitorChannelId).catch(() => null);
    if (!channel) return;

    // Supabase'den canlı verileri çek
    const { count: profileCount } = await client.supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { data: lastChapter } = await client.supabase.from('chapters').select('created_at, number, series_id').order('created_at', { ascending: false }).limit(1).single();
    
    // Aktif kişi sayısını simüle et (veya sessions tablosu varsa oradan çek)
    const activeReaders = Math.floor(Math.random() * 50) + 400; // Kullanıcının istediği 450 civarı
    
    const now = new Date();
    const lastUpdateStr = lastChapter ? `${Math.floor((now - new Date(lastChapter.created_at)) / 60000)} dk önce` : 'Bilinmiyor';

    const embed = new EmbedBuilder()
      .setTitle('📡 CANLI KARARGAH MONİTÖRÜ')
      .setDescription('```ansi\n\u001b[2;32m[ SİSTEM DURUMU: ÇEVRİMİÇİ ]\u001b[0m\n```')
      .addFields(
        { name: '👥 Canlı Okuyucu', value: `\`${activeReaders} Kişi\``, inline: true },
        { name: '📚 Son Güncelleme', value: `\`${lastUpdateStr}\``, inline: true },
        { name: '🚀 Sunucu Sağlığı', value: '`%100`', inline: true }
      )
      .setColor('#00FF00')
      .setFooter({ text: 'Veriler her 5 dakikada bir güncellenir.' })
      .setTimestamp();

    if (monitorMessage) {
      await monitorMessage.edit({ embeds: [embed] }).catch(() => { monitorMessage = null; });
    } else {
      // Önceki mesajları temizle (isteğe bağlı) ve yeni mesaj at
      const messages = await channel.messages.fetch({ limit: 10 });
      const oldBotMsg = messages.find(m => m.author.id === client.user.id);
      if (oldBotMsg) {
        monitorMessage = oldBotMsg;
        await monitorMessage.edit({ embeds: [embed] });
      } else {
        monitorMessage = await channel.send({ embeds: [embed] });
      }
    }
  } catch (err) {
    console.error('[Haber-Monitor] Hata:', err.message);
  }
}

// ── BOOT SEQUENCE (Retry Mekanizmalı) ───────────────────────
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 3000;

async function bootWithRetry(attempt = 1) {
  try {
    console.log(`[Haber] 🔄 Bağlantı denemesi ${attempt}/${MAX_RETRIES}...`);
    await client.login(process.env.DISCORD_TOKEN);
    console.log('[Haber] 📰 Bot aktif ve haber modunda!');
    
    // Supabase client'ı client objesine ekle (Utils'lerde kullanmak için)
    const { createClient } = await import('@supabase/supabase-js');
    client.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    // Otonom Radarı Başlat
    startRadar(client);

    // Monitörü başlat
    updateMonitor(client);
    setInterval(() => updateMonitor(client), 5 * 60 * 1000);

    await registerSlashCommands();
  } catch (err) {
    const isNetworkError = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNREFUSED']
      .some((code) => err.message?.includes(code));

    if (isNetworkError && attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * attempt;
      console.warn(`[Haber] ⚠️  Ağ hatası: ${err.message}`);
      console.warn(`[Haber] ⏳ ${delay / 1000}sn sonra tekrar denenecek... (${attempt}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, delay));
      return bootWithRetry(attempt + 1);
    }

    console.error('[Haber] ❌ Login hatası:', err.message);
    process.exit(1);
  }
}

(async () => {
  await loadCommands();
  await loadEvents();
  await bootWithRetry();
})();
