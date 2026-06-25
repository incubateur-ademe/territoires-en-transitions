import { Page } from '@playwright/test';

const STABLE_SAMPLES_REQUIRED = 3;
const STABLE_TOLERANCE_PX = 0.5;
const POLL_INTERVAL_MS = 50;
const MAX_WAIT_MS = 5_000;

const waitUntilStable = async (
  page: Page,
  read: () => Promise<number | null>
): Promise<void> => {
  const deadline = Date.now() + MAX_WAIT_MS;
  let previous: number | null = null;
  let stableSamples = 0;
  while (stableSamples < STABLE_SAMPLES_REQUIRED) {
    if (Date.now() > deadline) {
      throw new Error(
        `waitUntilStable: la valeur ne s'est pas stabilisée en ${MAX_WAIT_MS} ms (dernière lecture : ${previous})`
      );
    }
    const current = await read();
    if (
      current !== null &&
      previous !== null &&
      Math.abs(current - previous) < STABLE_TOLERANCE_PX
    ) {
      stableSamples += 1;
    } else {
      stableSamples = 0;
    }
    previous = current;
    if (stableSamples < STABLE_SAMPLES_REQUIRED) {
      await page.waitForTimeout(POLL_INTERVAL_MS);
    }
  }
};

export const waitForScrollSettled = async (
  page: Page,
  elementId: string
): Promise<void> => {
  await waitUntilStable(page, () =>
    page.evaluate(
      (id) =>
        document.getElementById(id)?.getBoundingClientRect().top ?? null,
      elementId
    )
  );
};

export const waitForScrollStopped = async (page: Page): Promise<void> => {
  await waitUntilStable(page, () => page.evaluate(() => window.scrollY));
};

export const stickyHeaderBottom = async (page: Page): Promise<number> => {
  const stickyHeader = page.getByRole('region');
  const box = await stickyHeader.boundingBox();
  if (!box) throw new Error('Header sticky introuvable');
  return box.y + box.height;
};
