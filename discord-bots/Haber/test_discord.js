import { Client, IntentsBitField } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config(); // Because it's run inside Haber/

const client = new Client({
  intents: [IntentsBitField.Flags.Guilds],
});

client.once('ready', async () => {
  console.log('Logged in as', client.user.tag);
  const targetChannel = await client.channels.fetch(process.env.DUYURU_KANALI_ID).catch(err => err);
  if (targetChannel instanceof Error) {
    console.error('Failed to fetch channel:', targetChannel.message);
  } else if (!targetChannel) {
    console.error('Channel not found');
  } else {
    console.log('Channel found:', targetChannel.name);
    try {
      await targetChannel.send('🚀 AniPeak Radar Sistemi test mesajı.');
      console.log('Successfully sent message');
    } catch (err) {
      console.error('Failed to send message:', err.message);
    }
  }
  client.destroy();
});

client.login(process.env.DISCORD_TOKEN);
