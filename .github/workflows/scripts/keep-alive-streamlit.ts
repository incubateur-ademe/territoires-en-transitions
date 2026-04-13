import { chromium } from '@playwright/test';
import { STREAMLIT_IFRAME_SRC } from '../../../apps/site/app/stats/streamlit.utils.ts';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(STREAMLIT_IFRAME_SRC, { waitUntil: 'networkidle', timeout: 60_000 });

const wakeButton = page.getByRole('button', { name: /get this app back up/i });

if (await wakeButton.isVisible()) {
  console.log('App asleep — clicking wake button');
  await wakeButton.click();
  console.log('Waiting for app to reach networkidle after wake');
  await page.waitForLoadState('networkidle', { timeout: 120_000 });
  console.log('App woken up successfully');
} else {
  console.log('App already active');
}

await browser.close();
