import { launchBrowser, delay } from './pipeline/01_navigator.js';

async function test() {
  const { browser, page } = await launchBrowser();
  
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('chapter') || url.includes('comic')) {
      console.log('Intercepted:', url);
    }
  });

  console.log('Navigating to comic page...');
  await page.goto('https://comick.io/comic/solo-leveling', { waitUntil: 'networkidle2' });
  await delay(5000);
  
  await browser.close();
}

test().catch(console.error);
