const fs = require('fs');
const path = require('path');

const cmdLevels = {
  // BYK (Highest)
  'setup.js': 'BYK',
  'automod.js': 'BYK',
  'guard-settings.js': 'BYK',
  'xp-ayar.js': 'BYK',
  'setup-support.js': 'BYK',
  'koruma.js': 'BYK',

  // UYK
  'ban.js': 'UYK',
  'poll.js': 'UYK',
  'rol-panel.js': 'UYK',
  'kanal-panel.js': 'UYK',
  'rol.js': 'UYK',
  'giveaway.js': 'UYK',

  // AYK
  'kick.js': 'AYK',
  'lock.js': 'AYK',
  'modpanel.js': 'AYK',

  // MOD
  'warn.js': 'MOD',
  'temizle.js': 'MOD',
  'purge.js': 'MOD',
  'mute.js': 'MOD',
  'embed-builder.js': 'MOD',
  'duyuru.js': 'MOD',
  'haber-panel.js': 'MOD',
  'user.js': 'MOD',
  'faq.js': 'MOD'
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('discord-bots/Infinity-Guard/commands')
  .concat(walk('discord-bots/XP/commands'))
  .concat(walk('discord-bots/Haber/commands'))
  .concat(walk('discord-bots/Support/commands'));

files.forEach(f => {
  const baseName = path.basename(f);
  
  let code = fs.readFileSync(f, 'utf8');
  let originalCode = code;

  // Level required for this command file
  let reqLevel = cmdLevels[baseName];

  // Some files have subcommands (like aura.js, seviye.js)
  // For these, we will inject the permission check later manually or use a general fallback.
  if (baseName === 'aura.js' || baseName === 'seviye.js') reqLevel = 'BYK';

  if (!reqLevel) return;

  // Add import if not exists and it needs permissions check
  if (code.includes('memberPermissions.has') && !code.includes('hasPermission')) {
    // find import statements block and insert after
    code = code.replace(/import .*?;\r?\n/, match => match + "import { hasPermission } from '../utils/permissions.js';\n");
  }

  // Replace checks:
  // e.g. if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return interaction.editReply({ content: '❌ Yetki yok.' });
  const regex = /if\s*\(\!interaction\.memberPermissions\.has\(PermissionFlagsBits\.[a-zA-Z]+\)\)\s*\{?\s*return\s+(interaction\.(editReply|reply)\(\{.*?\}\));?\s*\}?/g;
  
  code = code.replace(regex, `if (!hasPermission(interaction.member, '${reqLevel}')) { return $1; }`);

  if (code !== originalCode) {
    fs.writeFileSync(f, code);
    console.log(`Updated permissions in ${f} (Level: ${reqLevel})`);
  }
});
