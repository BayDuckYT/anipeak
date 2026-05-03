// ── ready.js | XP Event ─────────────────────────────────────
// Bot başarıyla Discord'a bağlandığında tetiklenir.

export default {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`[XP] 🟢 ${client.user.tag} olarak giriş yapıldı!`);
    console.log(`[XP] 📊 ${client.guilds.cache.size} sunucuda aktif.`);
    if (client.supabase) {
      console.log(`[XP] 🗄️  Supabase bağlantısı aktif.`);
    }

    client.user.setPresence({
      activities: [{ name: '⚡ XP Takip', type: 3 }], // WATCHING
      status: 'online',
    });
  },
};
