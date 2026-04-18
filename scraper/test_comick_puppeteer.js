import { launchBrowser, safeEvaluate, delay } from './pipeline/01_navigator.js';

async function testApi() {
  const { browser, page } = await launchBrowser();
  console.log('Navigating to comick.io to clear CF...');
  await page.goto('https://comick.io/home', { waitUntil: 'domcontentloaded' });
  await delay(5000); // wait for CF

  console.log('Fetching API via evaluate...');
  const data = await safeEvaluate(page, async () => {
    const res = await fetch('https://api.comick.io/comic/solo-leveling');
    return res.json();
  });

  console.log(data ? Object.keys(data) : 'Failed to fetch');
  await browser.close();
}

testApi().catch(console.error);
