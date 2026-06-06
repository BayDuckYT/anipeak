const fs = require('fs');
const path = require('path');

const cmdLevels = {
  // BYK
  'setup.js': 'BYK',
  'automod.js': 'BYK',
  'guard-settings.js': 'BYK',
  'xp-ayar.js': 'BYK',
  'setup-support.js': 'BYK',
  'koruma.js': 'BYK',
  'aura.js': 'BYK',
  'seviye.js': 'BYK',

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
  const reqLevel = cmdLevels[baseName];
  if (!reqLevel) return;

  let code = fs.readFileSync(f, 'utf8');
  let originalCode = code;

  // Ensure import
  if (!code.includes('hasPermission')) {
    code = code.replace(/(import .*?;\r?\n)/, "$1import { hasPermission } from '../utils/permissions.js';\n");
  }

  // Ensure check inside execute
  if (!code.includes('hasPermission(interaction.member')) {
    const checkStr = `\n    if (!hasPermission(interaction.member, '${reqLevel}')) return interaction.editReply ? await interaction.editReply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.' }).catch(()=>null) : await interaction.reply({ content: '❌ Bu komutu kullanmak için yetkiniz yok.', ephemeral: true });\n`;
    
    // Find where to insert: right after `async execute(interaction, client) {` or `async execute(interaction) {`
    // And ideally AFTER deferReply if there is one. Let's just insert it right after the execute method declaration.
    // Or, if deferReply is at the top, insert after it.
    
    // Let's find "async execute(interaction"
    const executeRegex = /async execute\s*\([^)]*\)\s*\{/;
    const match = code.match(executeRegex);
    if (match) {
      const matchIndex = match.index + match[0].length;
      
      // we check if the next line is deferReply
      const snippet = code.substring(matchIndex, matchIndex + 200);
      let insertIndex = matchIndex;
      
      const deferMatch = snippet.match(/await interaction\.deferReply\(\{.*\}\);/);
      if (deferMatch) {
        insertIndex += deferMatch.index + deferMatch[0].length;
      } else {
        const deferMatch2 = snippet.match(/await interaction\.deferReply\(\);/);
        if (deferMatch2) {
          insertIndex += deferMatch2.index + deferMatch2[0].length;
        }
      }

      code = code.substring(0, insertIndex) + checkStr + code.substring(insertIndex);
    }
  }

  if (code !== originalCode) {
    fs.writeFileSync(f, code);
    console.log("Added permission check to " + f);
  }
});
