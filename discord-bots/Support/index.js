// ============================================================
//  ███████╗██╗   ██╗██████╗ ██████╗  ██████╗ ██████╗ ████████╗
//  ██╔════╝██║   ██║██╔══██╗██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝
//  ███████╗██║   ██║██████╔╝██████╔╝██║   ██║██████╔╝   ██║
//  ╚════██║██║   ██║██╔═══╝ ██╔═══╝ ██║   ██║██╔══██╗   ██║
//  ███████║╚██████╔╝██║     ██║     ╚██████╔╝██║  ██║   ██║
//  ╚══════╝ ╚═════╝ ╚═╝     ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝
//    SUPPORT — AniPeak Destek Merkezi | Ticket & Help Service
// ============================================================

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── ESM __dirname polyfill ──────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── .env dosyasını BOTUN KENDİ dizininden yükle ─────────────
dotenv.config({ path: path.join(__dirname, '.env') });

import { Client, Collection, IntentsBitField, REST, Routes, MessageFlags } from 'discord.js';
import fs from 'node:fs';
import * as ticketHandler from './utils/ticketHandler.js';

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
      console.log(`[Support] ✅ Komut yüklendi: ${cmd.data.name}`);
    } else {
      console.warn(`[Support] ⚠️  Geçersiz komut dosyası: ${file}`);
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
    console.log(`[Support] 🔄 ${commands.length} slash komut kaydediliyor...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log(`[Support] ✅ Slash komutlar başarıyla kaydedildi!`);
  } catch (error) {
    console.error('[Support] ❌ Slash komut kayıt hatası:', error);
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
    console.log(`[Support] 🎧 Event yüklendi: ${evt.name}`);
  }
}

// ── Interaction Handler (Slash Commands) ────────────────────
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
      if (customId === 'ticket:open_modal') {
        await ticketHandler.handleTicketOpenModal(interaction);
        return;
      }
      if (customId.startsWith('ticket:reopen:')) {
        await ticketHandler.handleTicketReopen(interaction);
        return;
      }
      if (customId.startsWith('ticket:')) {
        await ticketHandler.handleTicketAction(interaction);
        return;
      }
    }

    // ── 3. Modal Submissions ───────────────────────────────
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'modal:ticket_open') {
        await ticketHandler.handleTicketSubmit(interaction, client);
        return;
      }
    }
  } catch (error) {
    if (error.code === 10062) {
      console.warn(`[Support] ⚠️ Etkileşim zaman aşımına uğradı (${interaction.commandName || interaction.customId})`);
      return;
    }

    console.error(`[Support] ❌ Interaction hatası:`, error);
    try {
      const reply = { content: '❌ İşlem gerçekleştirilirken bir hata oluştu!', flags: [MessageFlags.Ephemeral] };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    } catch (e) {}
  }
});

// ── BOOT SEQUENCE ───────────────────────────────────────────
// ── BOOT SEQUENCE (Retry Mekanizmalı) ───────────────────────
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 3000;

async function bootWithRetry(attempt = 1) {
  try {
    console.log(`[Support] 🔄 Bağlantı denemesi ${attempt}/${MAX_RETRIES}...`);
    await client.login(process.env.DISCORD_TOKEN);
    console.log('[Support] 🎫 Bot aktif ve destek modunda!');
    await registerSlashCommands();
  } catch (err) {
    const isNetworkError = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNREFUSED']
      .some((code) => err.message?.includes(code));

    if (isNetworkError && attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * attempt;
      console.warn(`[Support] ⚠️  Ağ hatası: ${err.message}`);
      console.warn(`[Support] ⏳ ${delay / 1000}sn sonra tekrar denenecek... (${attempt}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, delay));
      return bootWithRetry(attempt + 1);
    }

    console.error('[Support] ❌ Login hatası:', err.message);
    process.exit(1);
  }
}

(async () => {
  await loadCommands();
  await loadEvents();
  await bootWithRetry();
})();
