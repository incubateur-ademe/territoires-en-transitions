import { chromium, expect, type FrameLocator, type Page } from '@playwright/test';
import { STREAMLIT_IMPACT_IFRAME_SRC } from '../../../apps/site/app/impact/streamlit.utils.ts';
import { STREAMLIT_STATS_IFRAME_SRC } from '../../../apps/site/app/stats/streamlit.utils.ts';

const LOAD_TIMEOUT_MS = 180_000;

/** Mirrors Streamlit's own e2e `wait_for_app_loaded` / `wait_for_app_run` checks. */
async function waitForStreamlitReady(
  frame: FrameLocator,
  timeout = LOAD_TIMEOUT_MS,
) {
  await frame.locator('[data-testid="stAppViewContainer"]').waitFor({
    state: 'attached',
    timeout,
  });

  const connectedApp = frame
    .locator('[data-testid="stApp"][data-test-connection-state="CONNECTED"]')
    .or(
      frame.locator(
        '[data-testid="stApp"][data-test-connection-state="STATIC_CONNECTED"]',
      ),
    );
  await connectedApp.waitFor({ state: 'attached', timeout });

  await frame
    .locator('[data-testid="stApp"][data-test-script-state="notRunning"]')
    .waitFor({ state: 'attached', timeout });

  await expect(frame.getByTestId('stSkeleton')).toHaveCount(0, { timeout });
}

async function keepAliveStreamlit(page: Page, iframeSrc: string, label: string) {
  await page.goto(iframeSrc, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });

  const frame = page.frameLocator('iframe[title="streamlitApp"]');
  const wakeButton = frame.getByRole('button', {
    name: /get this app back up/i,
  });

  if (await wakeButton.isVisible()) {
    console.log(`[${label}] App asleep — clicking wake button`);
    await wakeButton.click();
    await wakeButton.waitFor({ state: 'hidden', timeout: LOAD_TIMEOUT_MS });
  }

  await waitForStreamlitReady(frame);
  console.log(`[${label}] App ready`);
}

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await keepAliveStreamlit(page, STREAMLIT_STATS_IFRAME_SRC, 'stats');
  await keepAliveStreamlit(page, STREAMLIT_IMPACT_IFRAME_SRC, 'impact');
} finally {
  await browser.close();
}
