import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import logger from '../utils/logger.js';
import { USER_AGENTS, VIEWPORT, SCROLL_STEP_PX, SCROLL_INTERVAL_MS, NAVIGATION_TIMEOUT_MS } from '../utils/constants.js';

puppeteer.use(StealthPlugin());

export async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENTS[0]);
  await page.setViewport(VIEWPORT);
  
  // Sadece temel ayarlar
  logger.info(`[Navigator] V24 Siber Motor Başlatıldı.`);
  return { browser, page };
}

/**
 * Madara Bypass: Sayfadaki görsel isteklerini havada yakalar.
 */
export async function startImageInterception(page) {
  const images = [];
  await page.setRequestInterception(true);
  
  page.on('request', (request) => {
    const url = request.url();
    const type = request.resourceType();
    if (type === 'image' && (url.includes('.jpg') || url.includes('.png') || url.includes('.webp') || url.includes('chapter'))) {
      images.push(url);
    }
    request.continue();
  });
  
  return images;
}

export async function stopImageInterception(page) {
  try {
    await page.setRequestInterception(false);
    page.removeAllListeners('request');
  } catch (e) {}
}

export async function navigateTo(page, url, waitSeconds = 5) {
  logger.info(`[NAV] >> ${url}`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
    await delay(waitSeconds * 1000);
    return true;
  } catch (err) {
    logger.error(`[NAV-FAIL] >> ${url} | ${err.message}`);
    return false;
  }
}

export async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      let distance = 400;
      let timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
