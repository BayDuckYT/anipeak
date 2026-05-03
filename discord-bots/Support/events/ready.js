// ── ready.js | Support Event ────────────────────────────────
// Bot başarıyla Discord'a bağlandığında tetiklenir.

export default {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`[Support] 🟢 ${client.user.tag} olarak giriş yapıldı!`);
    console.log(`[Support] 📊 ${client.guilds.cache.size} sunucuda aktif.`);

    client.user.setPresence({
      activities: [{ name: '🎫 Destek Talepleri', type: 3 }], // WATCHING
      status: 'online',
    });
  },
};
