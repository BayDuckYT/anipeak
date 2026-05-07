import { PermissionFlagsBits } from 'discord.js';
import { CONFIG } from '../utils/config.js';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Toksisite takibi için kanal bazlı puanlama
const channelToxicity = new Map();

export default {
  name: 'messageCreate',
  once: false,

  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // Sadece destek kanallarında veya tüm kanallarda (isteğe bağlı) çalışır
    // Burada tüm kanallarda "Termometre" olarak çalıştıralım
    
    const content = message.content;
    if (content.length < 5) return;

    try {
      // 1. AI ile agresiflik ölçümü (Basit kontrol veya OpenAI moderasyon)
      let isToxic = false;
      let score = 0;

      // OpenAI moderasyon API'si ücretsiz/ucuzdur ve hızlıdır
      if (openai) {
        const moderation = await openai.moderations.create({ input: content });
        const result = moderation.results[0];
        
        if (result.flagged) {
          isToxic = true;
          score = 50; // Bayraklı mesajlar direkt ortamı gerer
        }
      }

      // 2. Termometreyi güncelle
      const currentScore = channelToxicity.get(message.channel.id) || 0;
      if (isToxic) {
        const newScore = currentScore + score;
        channelToxicity.set(message.channel.id, newScore);

        // 3. Ortam gerilirse Slowmode çak (Ateşkes Sistemi)
        if (newScore >= 100) {
          await message.channel.setRateLimitPerUser(30, 'Yapay Zeka — Ortam gerginliği tespiti (Ateşkes Modu)');
          await message.channel.send({
             content: '🛡️ **ORTAM GERİLDİ — ATEŞKES MODU AKTİF!**\nChatteki agresiflik seviyesi limitleri aştı. 30 saniye yavaş mod açıldı. Biraz sakinleşin uşaklar!'
          });
          
          // 10 dakika sonra normale döndür (otomatik soğuma)
          setTimeout(async () => {
             await message.channel.setRateLimitPerUser(0, 'Soğuma tamamlandı.').catch(() => {});
             channelToxicity.set(message.channel.id, 0);
          }, 10 * 60 * 1000);
        }
      } else {
        // Doğal soğuma: Her normal mesaj puanı 1 düşürür
        channelToxicity.set(message.channel.id, Math.max(0, currentScore - 1));
      }

    } catch (err) {
      console.error('[Support-AI] Toksisite hatası:', err.message);
    }
  }
};
