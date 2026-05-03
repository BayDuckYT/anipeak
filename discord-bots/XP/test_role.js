import { Client, IntentsBitField } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const client = new Client({
  intents: [IntentsBitField.Flags.Guilds],
});

client.on('ready', async () => {
  console.log('Bot ready.');
  console.log('Guilds:', client.guilds.cache.map(g => `${g.name} (${g.id})`));
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
