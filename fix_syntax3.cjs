const fs = require('fs');
let g = fs.readFileSync('discord-bots/XP/commands/gorev.js', 'utf8');
// Fix the literal: `${icon} **${q.title}** (`${q.id}`)\n└ *${q.desc}*\n└ İlerleme: `${progress}/${q.requirement}` | Ödül: 🌟 `${q.reward}``
g = g.replace(/`\$\{q\.id\}`/g, '\\`${q.id}\\`');
g = g.replace(/`\$\{progress\}\/\$\{q\.requirement\}`/g, '\\`${progress}/${q.requirement}\\`');
g = g.replace(/`\$\{q\.reward\}`/g, '\\`${q.reward}\\`');
fs.writeFileSync('discord-bots/XP/commands/gorev.js', g);

let m = fs.readFileSync('discord-bots/XP/commands/magaza.js', 'utf8');
// Fix the literal: `**${index + 1}. ${item.name}**\n🌟 Fiyat: `${item.price.toLocaleString()}` Aura\n📝 ${item.desc}\n`
m = m.replace(/`\$\{item\.price\.toLocaleString\(\)\}`/g, '\\`${item.price.toLocaleString()}\\`');
fs.writeFileSync('discord-bots/XP/commands/magaza.js', m);
