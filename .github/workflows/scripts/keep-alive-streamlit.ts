import { chromium } from '@playwright/test';
import { STREAMLIT_IFRAME_SRC } from '../../../apps/site/app/stats/streamlit.utils.ts';

const STREAMLIT_URLS = [
  STREAMLIT_IFRAME_SRC,
  'https://dashboard-tet.streamlit.app/?embed=true',
];

const browser = await chromium.launch();

for (const url of STREAMLIT_URLS) {
  console.log(`Checking ${url}`);
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });

  const frame = page.frameLocator('iframe[title="streamlitApp"]');
  const wakeButton = frame.getByRole('button', {
    name: /get this app back up/i,
  });

  if (await wakeButton.isVisible()) {
    console.log('App asleep — clicking wake button');
    await wakeButton.click();
  }

  await frame
    .locator('.stAppViewContainer')
    .waitFor({ state: 'visible', timeout: 180_000 });
  console.log('App ready');

  await page.close();
}

await browser.close();
