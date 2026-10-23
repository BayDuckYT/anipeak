import { EmbedBuilder } from 'discord.js';
import { getLevelInfo } from '../../../src/lib/gamification.js';

export { getLevelInfo };

/**
 * Kullanıcıyı Discord ile Senkronize Et (Siber Başkomutan Versiyonu)
 * @param {Object} client - Discord Client
 * @param {Object|String} dataOrId - Profil objesi VEYA Discord ID
 * @param {Number} [xpIfProvided] - Eğer sadece ID verildiyse XP değeri
 */
export async function syncUserToDiscord(client, dataOrId, xpIfProvided) {
  let discord_id, xp, username, isElite, activePlanId;

  if (typeof dataOrId === 'object') {
    discord_id = dataOrId.discord_id;
    xp = dataOrId.xp;
    username = dataOrId.username;
    isElite = dataOrId.is_elite;
    activePlanId = dataOrId.active_plan_id;
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
    const info = getLevelInfo(xp || 0, isElite, activePlanId);
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
      'Çaylak Okur': process.env.ROLE_CAYLAK_OKUR,
      Maceracı: process.env.ROLE_MANGA_GEZGINI,
      'Kıdemli Avcı': process.env.ROLE_USTUN_SAVASCI,
      'Üstün Şövalye': process.env.ROLE_ELIT_AVCI,
      'Hükümdar Muhafızı': process.env.ROLE_ULUSAL_AVCI,
      'Mahora Hükümdarı': process.env.ROLE_MANGA_HUKUMDARI
    };
    const allRankRoleIds = [
      ...Object.values(rankRoles),
      process.env.ROLE_LONCA_UYESI,
      process.env.ROLE_USTUN_BASKINCI,
    ].filter(Boolean);

    const targetRank = info.baseRank;
    const targetRoleId = rankRoles[targetRank];
    const currentRankRole = member.roles.cache.find(r => allRankRoleIds.includes(r.id));

    if (targetRoleId && (!currentRankRole || currentRankRole.id !== targetRoleId)) {
      // Eski rütbeleri tarayıp sil
      const rolesToRemove = allRankRoleIds.filter(id => member.roles.cache.has(id) && id !== targetRoleId);
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
