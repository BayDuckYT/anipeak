import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsPath = path.join(__dirname, '../data/settings.json');

export const getSettings = () => {
  try {
    const data = fs.readFileSync(settingsPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Settings read error:', err);
    return { global: {}, channels: {} };
  }
};

export const saveSettings = (settings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (err) {
    console.error('Settings save error:', err);
    return false;
  }
};

export const updateGlobalSetting = (key, value) => {
  const settings = getSettings();
  settings.global[key] = value;
  return saveSettings(settings);
};

export const updateChannelSetting = (channelId, key, value) => {
  const settings = getSettings();
  if (!settings.channels[channelId]) settings.channels[channelId] = {};
  settings.channels[channelId][key] = value;
  return saveSettings(settings);
};
