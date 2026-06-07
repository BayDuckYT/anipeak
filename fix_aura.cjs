const fs = require('fs');
let code = fs.readFileSync('discord-bots/XP/commands/aura.js', 'utf8');
code = code.replace(/\\\`/g, '`').replace(/\\\$/g, '$').replace(/\\n/g, '\n');
fs.writeFileSync('discord-bots/XP/commands/aura.js', code);

// also let's check gorev.js and magaza.js just in case
let gorev = fs.readFileSync('discord-bots/XP/commands/gorev.js', 'utf8');
if (gorev.includes('\\`')) {
  gorev = gorev.replace(/\\\`/g, '`').replace(/\\\$/g, '$').replace(/\\n/g, '\n');
  fs.writeFileSync('discord-bots/XP/commands/gorev.js', gorev);
}
let magaza = fs.readFileSync('discord-bots/XP/commands/magaza.js', 'utf8');
if (magaza.includes('\\`')) {
  magaza = magaza.replace(/\\\`/g, '`').replace(/\\\$/g, '$').replace(/\\n/g, '\n');
  fs.writeFileSync('discord-bots/XP/commands/magaza.js', magaza);
}
