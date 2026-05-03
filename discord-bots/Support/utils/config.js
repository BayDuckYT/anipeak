import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env dosyasını config'in olduğu klasörden değil, bir üst klasörden (Support) yükle
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const CONFIG = {
  STAFF_IDS: (process.env.STAFF_IDS || '').split(',').map(id => id.trim()).filter(id => id.length > 10),
  TICKET_CATEGORY_ID: process.env.TICKET_CATEGORY_ID || '',
  LOG_CHANNEL_ID: process.env.LOG_CHANNEL_ID || '',
  COLORS: {
    PRIMARY: 0x5865F2, // Siber Mavi
    SUCCESS: 0x2ECC71,
    DANGER: 0xE74C3C,
    WARNING: 0xF1C40F,
  }
};
