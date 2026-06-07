const fs = require('fs');
const files = [
  'discord-bots/XP/commands/aura.js',
  'discord-bots/XP/commands/gorev.js',
  'discord-bots/XP/commands/magaza.js'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  // It currently has `\\`${...}\\``, which ends the string early.
  // We want to replace \`\\`${...}\\`` with \`\\\`${...}\\\`\` so the backslash escapes the backtick inside the template string.
  // Wait, if we want \`\${...}\`, we just replace \\\\\\\` with \\\`
  // Let's just find exactly what's there.
  content = content.replace(/\\\\\`/g, '\\`'); 
  fs.writeFileSync(f, content);
});
