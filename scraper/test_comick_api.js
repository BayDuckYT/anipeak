import { launchBrowser, delay } from './pipeline/01_navigator.js';

async function test() {
  const { browser, page } = await launchBrowser();
  
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('api.comick') || url.includes('.pictures')) {
      console.log('Intercepted API:', url);
    }
  });

  console.log('Navigating to chapter reader...');
  await page.goto('https://comick.io/comic/00-jujutsu-kaisen/chapter-1-en', { waitUntil: 'networkidle2' });
  await delay(5000);
  
  await browser.close();
}

test().catch(console.error);
