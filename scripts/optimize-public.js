import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const filesToOptimize = [
  'bakim_arkaplanv2.png',
  'mahorapeaklogov2.png',
  'mahorapeaklogogoogle.png',
  'anipeaklogo.png',
  'anipeaklink.png',
  'aethe.png',
  'basadminicon.png'
];

async function optimize() {
  for (const file of filesToOptimize) {
    const inputPath = path.join(publicDir, file);
    if (!fs.existsSync(inputPath)) {
      console.log(`Skipping ${file}, not found.`);
      continue;
    }
    const ext = path.extname(file);
    const basename = path.basename(file, ext);
    const outputPath = path.join(publicDir, `${basename}.webp`);
    
    try {
      await sharp(inputPath)
        .webp({ quality: 80, effort: 6 })
        .toFile(outputPath);
      console.log(`Optimized ${file} to ${basename}.webp`);
    } catch (err) {
      console.error(`Failed to optimize ${file}:`, err);
    }
  }
}

optimize();
