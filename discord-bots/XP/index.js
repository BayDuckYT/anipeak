// ============================================================
//  ██╗  ██╗██████╗     ██████╗  ██████╗ ████████╗
//  ╚██╗██╔╝██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝
//   ╚███╔╝ ██████╔╝    ██████╔╝██║   ██║   ██║
//   ██╔██╗ ██╔═══╝     ██╔══██╗██║   ██║   ██║
//  ██╔╝ ██╗██║         ██████╔╝╚██████╔╝   ██║
//  ╚═╝  ╚═╝╚═╝         ╚═════╝  ╚═════╝    ╚═╝
//    XP — MahoraPeak Deneyim Merkezi | Leveling & Experience Service
// ============================================================

import dotenv from 'dotenv';
import { Client, Collection, IntentsBitField, REST, Routes, MessageFlags } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncUserToDiscord } from './utils/levelUtils.js';

// ── ESM __dirname polyfill ──────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── .env dosyasını BOTUN KENDİ dizininden yükle ─────────────
dotenv.config({ path: path.join(__dirname, '.env') });

// ── Supabase Client ─────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
// Service role key RLS'yi bypass eder — bot için zorunlu
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[XP] ⚠️  SUPABASE_URL veya SUPABASE_KEY tanımlı değil! Supabase devre dışı.');
}

if (process.env.SUPABASE_SERVICE_KEY && !process.env.SUPABASE_SERVICE_KEY.startsWith('BURAYA')) {
  console.log('[XP] 🔑 Service Role Key kullanılıyor (RLS bypass aktif)');
} else {
  console.warn('[XP] ⚠️  Publishable key kullanılıyor — /istatistik gibi komutlar çalışmayabilir!');
  console.warn('[XP] ➡️  .env dosyasına SUPABASE_SERVICE_KEY ekle!');
}

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

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

// Supabase instance'ını client üzerinden paylaş (komutlar erişebilsin)
client.supabase = supabase;

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
      console.log(`[XP] ✅ Komut yüklendi: ${cmd.data.name}`);
    } else {
      console.warn(`[XP] ⚠️  Geçersiz komut dosyası: ${file}`);
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
    console.log(`[XP] 🔄 ${commands.length} slash komut kaydediliyor...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log(`[XP] ✅ Slash komutlar başarıyla kaydedildi!`);
  } catch (error) {
    console.error('[XP] ❌ Slash komut kayıt hatası:', error);
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
    console.log(`[XP] 🎧 Event yüklendi: ${evt.name}`);
  }
}

// ── Interaction Handler (Slash Commands) ────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`[XP] ❌ Komut hatası (${interaction.commandName}):`, error);
    try {
      const reply = { content: '❌ Komut çalıştırılırken bir hata oluştu!', flags: [MessageFlags.Ephemeral] };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    } catch (replyErr) {
      console.warn('[XP] Hata yanıtı gönderilemedi:', replyErr.message);
    }
  }
});

// ── BOOT SEQUENCE ───────────────────────────────────────────
// ── BOOT SEQUENCE (Retry Mekanizmalı) ───────────────────────
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 3000;

async function bootWithRetry(attempt = 1) {
  try {
    console.log(`[XP] 🔄 Bağlantı denemesi ${attempt}/${MAX_RETRIES}...`);
    await client.login(process.env.DISCORD_TOKEN);
    console.log('[XP] ⚡ Bot aktif ve XP takip modunda!');
    
    if (supabase) {
      console.log('[XP] 🗄️  Supabase bağlantısı hazır.');
      
      // ── Supabase Realtime Dinleyici ──────────────────────────
      const channel = supabase
        .channel('public:profiles')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles' },
          async (payload) => {
            const { new: newData, old: oldData } = payload;
            
            // Supabase Realtime 'oldData' check (Replica Identity Full logic)
            // Eğer oldData yoksa veya xp alanı gelmemişse, karşılaştırma yapamayız.
            const newXp = Number(newData.xp);
            const oldXp = oldData ? Number(oldData.xp) : null;

            if (oldXp !== null && newXp !== oldXp) {
              console.log(`[XP] Anlık değişim: ${newData.username} (${oldXp} -> ${newXp} XP)`);
              await syncUserToDiscord(client, newData);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[XP] 📡 Supabase Realtime dinleniyor: profiles (XP takip)');
          } else {
            console.warn(`[XP] 📡 Supabase Realtime durumu: ${status}`);
          }
        });
    }
    await registerSlashCommands();

    // ── GLOBAL SYNC LOOP (Every 30 mins) ────────────────────────
    setInterval(async () => {
      console.log('[XP] 🔄 Global senkronizasyon başlatıldı...');
      try {
        const { data: profiles } = await client.supabase
          .from('profiles')
          .select('*')
          .not('discord_id', 'is', null);

        if (profiles) {
          for (const profile of profiles) {
            await syncUserToDiscord(client, profile).catch(() => {});
          }
        }
        console.log(`[XP] ✅ ${profiles?.length || 0} kullanıcı mühür kontrolünden geçti.`);
      } catch (err) {
        console.error('[XP] Global Sync Hatası:', err.message);
      }
    }, 30 * 60 * 1000);

  } catch (err) {
    const isNetworkError = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNREFUSED']
      .some((code) => err.message?.includes(code));

    if (isNetworkError && attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * attempt;
      console.warn(`[XP] ⚠️  Ağ hatası: ${err.message}`);
      console.warn(`[XP] ⏳ ${delay / 1000}sn sonra tekrar denenecek... (${attempt}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, delay));
      return bootWithRetry(attempt + 1);
    }

    console.error('[XP] ❌ Login hatası:', err.message);
    process.exit(1);
  }
}

(async () => {
  await loadCommands();
  await loadEvents();
  await bootWithRetry();
})();
