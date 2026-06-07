const fs = require('fs');
let g = fs.readFileSync('discord-bots/XP/commands/gorev.js', 'utf8');
g = g.replace(/`\$\{newAura\.toLocaleString\(\)\}`/g, '\\`${newAura.toLocaleString()}\\`');
fs.writeFileSync('discord-bots/XP/commands/gorev.js', g);

let m = fs.readFileSync('discord-bots/XP/commands/magaza.js', 'utf8');
m = m.replace(/`\$\{profile\.aura \|\| 0\}`/g, '\\`${profile.aura || 0}\\`');
m = m.replace(/`\$\{item\.price\}`/g, '\\`${item.price}\\`');
m = m.replace(/`\$\{newAura\.toLocaleString\(\)\}`/g, '\\`${newAura.toLocaleString()}\\`');
fs.writeFileSync('discord-bots/XP/commands/magaza.js', m);
