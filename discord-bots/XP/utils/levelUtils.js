import { EmbedBuilder } from 'discord.js';

/**
 * Yeni Kademeli Seviye ve Rütbe Hesaplama (MahoraPeak V4 - 100 Seviye Kuralı)
 */
export function getLevelInfo(xp) {
  let level, rank, xpInLevel, xpForNext;
  const val = Number(xp) || 0;

  if (val < 500) {
    level = Math.floor(val / 50) + 1;
    rank = 'Manga Çırağı';
    xpInLevel = val % 50;
    xpForNext = 50;
  } else if (val < 2000) {
    level = 11 + Math.floor((val - 500) / 100);
    rank = 'Manga Yolcusu';
    xpInLevel = (val - 500) % 100;
    xpForNext = 100;
  } else if (val < 5000) {
    level = 26 + Math.floor((val - 2000) / 200);
    rank = 'Manga Savaşçısı';
    xpInLevel = (val - 2000) % 200;
    xpForNext = 200;
  } else if (val < 10000) {
    level = 41 + Math.floor((val - 5000) / 333);
    rank = 'Manga Koruması';
    xpInLevel = (val - 5000) % 333;
    xpForNext = 333;
  } else if (val < 25000) {
    level = 56 + Math.floor((val - 10000) / 1000);
    rank = 'Manga Koleksiyoncusu';
    xpInLevel = (val - 10000) % 1000;
    xpForNext = 1000;
  } else if (val < 50000) {
    level = 71 + Math.floor((val - 25000) / 1666);
    rank = 'Manga Ustası';
    xpInLevel = (val - 25000) % 1666;
    xpForNext = 1666;
  } else if (val < 100000) {
    level = 86 + Math.floor((val - 50000) / 3333);
    rank = 'Manga Efsanesi';
    xpInLevel = (val - 50000) % 3333;
    xpForNext = 3333;
  } else {
    level = 100;
    rank = 'Manga Hükümdarı';
    xpInLevel = 1;
    xpForNext = 1;
  }

  // İlerleme yüzdesi hesapla
  const progress = level === 100 ? 100 : (xpInLevel / xpForNext) * 100;

  return { level, rank, xpInLevel, xpForNext, progress };
}

/**
 * Kullanıcıyı Discord ile Senkronize Et (Siber Başkomutan Versiyonu)
 * @param {Object} client - Discord Client
 * @param {Object|String} dataOrId - Profil objesi VEYA Discord ID
 * @param {Number} [xpIfProvided] - Eğer sadece ID verildiyse XP değeri
 */
export async function syncUserToDiscord(client, dataOrId, xpIfProvided) {
  let discord_id, xp, username;

  if (typeof dataOrId === 'object') {
    discord_id = dataOrId.discord_id;
    xp = dataOrId.xp;
    username = dataOrId.username;
  } else {
    discord_id = dataOrId;
    xp = xpIfProvided;
    username = 'Bilinmeyen Kullanıcı';
  }

  if (!discord_id) return;

  const guildId = process.env.GUILD_ID;
  const guild = client.guilds.cache.get(guildId);
  const logChannel = guild?.channels.cache.get(process.env.CHANNEL_XP_LOGS);

  if (!guild) return console.error('[XP Sync] Sunucu bulunamadı!');

  try {
    const member = await guild.members.fetch(discord_id).catch(() => null);
    if (!member) return;

    // ── 1. NICKNAME GÜNCELLEME (Sadece Seviye + Discord İsmi) ──────
    // Sitedeki ismi kullanmıyoruz, Discord'daki orijinal ismini koruyoruz.
    const info = getLevelInfo(xp || 0); // ← Eksik olan bu satırdı!
    const baseName = member.user.globalName || member.user.username;
    // Eğer isimde zaten bir [Lv. X] varsa onu temizle ki üst üste binmesin
    const cleanName = baseName.replace(/^\[Lv\.\s\d+\]\s/, '');
    const newNickname = `[Lv. ${info.level}] ${cleanName}`.substring(0, 32);
    
    // ── 1. OWNER VE İSİM KONTROLÜ ──────────────────────────────────
    let nameChangeSuccess = true;
    if (member.id === guild.ownerId) {
      console.log(`[XP Sync] Sunucu sahibi (${member.user.tag}) ismi değiştirilemiyor.`);
      if (logChannel) {
        logChannel.send({ 
          content: `ℹ️ **Sunucu Sahibi Koruması:** <@${member.id}> sunucu sahibi olduğu için ismi değiştirilemedi ama rütbe işlemleri devam ediyor amk!` 
        }).catch(() => {});
      }
      nameChangeSuccess = false;
    } else if (member.nickname !== newNickname) {
      try {
        await member.setNickname(newNickname);
      } catch (e) {
        console.warn(`[XP Sync] İsim değiştirme yetki hatası:`, e.message);
        nameChangeSuccess = false;
      }
    }

    // ── 2. RÜTBE ROL OPERASYONU (Site İle Aynı - XP Bazlı) ────────────
    const rankRoles = {
      'Manga Çırağı': process.env.ROLE_CAYLAK_OKUR,
      'Manga Yolcusu': process.env.ROLE_MANGA_GEZGINI,
      'Manga Savaşçısı': process.env.ROLE_USTUN_SAVASCI,
      'Manga Koruması': process.env.ROLE_ELIT_AVCI,
      'Manga Koleksiyoncusu': process.env.ROLE_LONCA_UYESI,
      'Manga Ustası': process.env.ROLE_USTUN_BASKINCI,
      'Manga Efsanesi': process.env.ROLE_ULUSAL_AVCI,
      'Manga Hükümdarı': process.env.ROLE_MANGA_HUKUMDARI
    };

    const targetRank = info.rank; // Sitedeki getLevelInfo ile gelen rütbe ismi
    const targetRoleId = rankRoles[targetRank];
    const currentRankRole = member.roles.cache.find(r => Object.values(rankRoles).includes(r.id));

    if (targetRoleId && (!currentRankRole || currentRankRole.id !== targetRoleId)) {
      // Eski rütbeleri tarayıp sil
      const rolesToRemove = Object.values(rankRoles).filter(id => id && member.roles.cache.has(id) && id !== targetRoleId);
      if (rolesToRemove.length > 0) {
        await member.roles.remove(rolesToRemove).catch(() => {});
      }
      
      // Yeni rütbeyi tak
      await member.roles.add(targetRoleId)
        .then(() => {
           console.log(`[XP Sync] Rütbe verildi: ${targetRank} -> ${member.user.tag}`);
        })
        .catch(e => {
           console.error('[XP Sync] Rütbe verme hatası:', e.message);
        });

      // ── 3. LEVEL UP DUYURUSU ──────────────────────────────────────
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🚀 KADEMELİ RÜTBE ATLANDI!')
          .setDescription(`Tebrikler <@${member.id}>! Sitedeki başarınla Discord'da **${targetRank}** rütbesine ulaştın!`)
          .addFields(
            { name: 'Seviye', value: `\`Lv. ${info.level}\``, inline: true },
            { name: 'Rütbe',  value: `\`${targetRank}\``, inline: true },
            { name: 'Toplam', value: `\`${xp} XP\``, inline: true }
          )
          .setColor('#8B5CF6')
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp();

        await logChannel.send({ content: `<@${member.id}>`, embeds: [embed] }).catch(() => {});
      }
    }
  } catch (err) {
    console.error(`[XP Sync] Kritik Hata:`, err);
    if (logChannel) {
      logChannel.send({ content: `❌ **Kritik Hata:** \`${discord_id}\` için senkronizasyon başarısız!\n\`\`\`${err.message}\`\`\`` }).catch(() => {});
    }
  }
}
