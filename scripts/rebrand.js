import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories and files to scan
const rootDir = path.resolve(__dirname, '..');
const scanPaths = [
  'src',
  'server',
  'scripts',
  'public',
  'index.html',
  'package.json',
  '.env',
  '.env.example',
  'README.md'
];

// Directories to ignore
const ignoreDirs = ['node_modules', 'dist', 'build', '.git', '.gemini', 'android-app', 'discord-bots', 'artifacts'];

const replacements = [
  { from: /MahoraPeak/g, to: 'MahoraPeak' },
  { from: /mahorapeak/g, to: 'mahorapeak' },
  { from: /MAHORAPEAK/g, to: 'MAHORAPEAK' },
  { from: /MahoraPeak/g, to: 'MahoraPeak' }
];

let modifiedFilesCount = 0;

function walkAndReplace(currentPath) {
  if (!fs.existsSync(currentPath)) return;

  const stat = fs.statSync(currentPath);

  if (stat.isDirectory()) {
    const baseName = path.basename(currentPath);
    if (ignoreDirs.includes(baseName)) return;

    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      walkAndReplace(path.join(currentPath, file));
    }
  } else if (stat.isFile()) {
    const ext = path.extname(currentPath);
    // Only text files
    const validExts = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.md', '.txt', '.xml', ''];
    if (!validExts.includes(ext) && ext !== '') return;
    
    // Skip this script itself
    if (currentPath === __filename) return;

    let content = fs.readFileSync(currentPath, 'utf8');
    let originalContent = content;

    for (const { from, to } of replacements) {
      content = content.replace(from, to);
    }

    if (content !== originalContent) {
      fs.writeFileSync(currentPath, content, 'utf8');
      console.log(`Updated: ${currentPath.replace(rootDir, '')}`);
      modifiedFilesCount++;
    }
  }
}

console.log('Starting site-wide rebrand from MahoraPeak to MahoraPeak...');

for (const scanPath of scanPaths) {
  const fullPath = path.join(rootDir, scanPath);
  walkAndReplace(fullPath);
}

console.log(`\nRebrand complete! Modified ${modifiedFilesCount} files.`);
