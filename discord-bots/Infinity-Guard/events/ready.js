// ── ready.js | Infinity-Guard Event ─────────────────────────
// Bot başarıyla Discord'a bağlandığında tetiklenir.

export default {
  name: 'ready',
  once: true,
  execute(client) {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║   🛡️  INFINITY GUARD — KORUMA AKTİF              ║');
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(`║   Bot:      ${client.user.tag.padEnd(33)}  ║`);
    console.log(`║   Sunucu:   ${String(client.guilds.cache.size).padEnd(33)}  ║`);
    console.log(`║   Komut:    ${String(client.commands?.size || 0).padEnd(33)}  ║`);
    console.log('║   Durum:    ✅ SİSTEM HAZIR                       ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('');

    // Rotating presence
    const activities = [
      { name: '🛡️ AniPeak Koruma', type: 3 },   // WATCHING
      { name: '✨ Güvenli Sohbet', type: 0 },      // PLAYING
      { name: '📊 Sunucu Takibi', type: 3 },       // WATCHING
      { name: `👥 ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} üye`, type: 3 },
    ];

    let activityIndex = 0;
    client.user.setPresence({ activities: [activities[0]], status: 'online' });

    setInterval(() => {
      activityIndex = (activityIndex + 1) % activities.length;
      client.user.setPresence({ activities: [activities[activityIndex]], status: 'online' });
    }, 30_000); // 30 saniyede bir değiştir
  },
};
