const fs = require('fs');
const files = [
  'discord-bots/XP/commands/aura.js',
  'discord-bots/XP/commands/gorev.js',
  'discord-bots/XP/commands/magaza.js'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\\\`/g, '`');
  content = content.replace(/\\\$/g, '$');
  fs.writeFileSync(f, content);
});
