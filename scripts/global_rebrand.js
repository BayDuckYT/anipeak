import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');

// Directories to explicitly ignore
const ignoreDirs = [
  'node_modules', 
  'dist', 
  'build', 
  '.git', 
  '.gemini', 
  '.vscode',
  '.wrangler',
  'artifacts'
];

// Valid file extensions to process (to avoid binary files)
const validExts = [
  '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.md', '.txt', '.xml', '.sql', '.vue', '.kts', '.kt', '.py', '.cjs', '.mjs', '.csv', '.env', '.example', ''
];

const replacements = [
  { from: /Anipeak/g, to: 'MahoraPeak' },
  { from: /anipeak/g, to: 'mahorapeak' },
  { from: /ANIPEAK/g, to: 'MAHORAPEAK' },
  { from: /AniPeak/g, to: 'MahoraPeak' }
];

let modifiedFilesCount = 0;

function walkAndReplace(currentPath) {
  if (!fs.existsSync(currentPath)) return;

  const stat = fs.statSync(currentPath);
  const baseName = path.basename(currentPath);

  if (stat.isDirectory()) {
    if (ignoreDirs.includes(baseName)) return;

    try {
      const files = fs.readdirSync(currentPath);
      for (const file of files) {
        walkAndReplace(path.join(currentPath, file));
      }
    } catch (err) {
      console.warn(`Could not read directory ${currentPath}: ${err.message}`);
    }
  } else if (stat.isFile()) {
    // Ignore files like package-lock.json if needed, but the user said EVERYTHING. Let's include package-lock.json to avoid broken lockfiles containing "anipeak".
    
    // Quick binary filter based on extension
    const ext = path.extname(currentPath).toLowerCase();
    const isEnvFile = baseName.startsWith('.env');
    
    if (!validExts.includes(ext) && !isEnvFile && ext !== '') return;
    
    // Skip this script itself
    if (currentPath === __filename) return;

    try {
      let content = fs.readFileSync(currentPath, 'utf8');
      
      // Basic check to see if it's actually a binary file masquerading without an extension
      if (content.indexOf('\\u0000') !== -1) return;

      let originalContent = content;

      for (const { from, to } of replacements) {
        content = content.replace(from, to);
      }

      if (content !== originalContent) {
        fs.writeFileSync(currentPath, content, 'utf8');
        console.log(`Updated: ${currentPath.replace(rootDir, '')}`);
        modifiedFilesCount++;
      }
    } catch (err) {
      console.warn(`Could not process file ${currentPath}: ${err.message}`);
    }
  }
}

console.log('Starting EXHAUSTIVE site-wide rebrand from Anipeak to MahoraPeak...');
console.log('Scanning all directories starting from root:', rootDir);

walkAndReplace(rootDir);

console.log(`\nRebrand complete! Modified ${modifiedFilesCount} files.`);
