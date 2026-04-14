import { chromium } from '@playwright/test';
import { STREAMLIT_IFRAME_SRC } from '../../../apps/site/app/stats/streamlit.utils.ts';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(STREAMLIT_IFRAME_SRC, {
  waitUntil: 'domcontentloaded',
  timeout: 60_000,
});

const frame = page.frameLocator('iframe[title="streamlitApp"]');
const wakeButton = frame.getByRole('button', { name: /get this app back up/i });
const readyText = frame.getByText(
  'Déployer la transition écologique sur la totalité du territoire'
);

if (await wakeButton.isVisible()) {
  console.log('App asleep — clicking wake button');
  await wakeButton.click();
}

await readyText.waitFor({ state: 'visible', timeout: 180_000 });
console.log('App ready');

await browser.close();
