// ── ready.js | Haber Event ──────────────────────────────────
// Bot başarıyla Discord'a bağlandığında tetiklenir.

export default {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`[Haber] 🟢 ${client.user.tag} olarak giriş yapıldı!`);
    console.log(`[Haber] 📊 ${client.guilds.cache.size} sunucuda aktif.`);

    client.user.setPresence({
      activities: [{ name: '📰 MahoraPeak Haberler', type: 3 }], // WATCHING
      status: 'online',
    });
  },
};
