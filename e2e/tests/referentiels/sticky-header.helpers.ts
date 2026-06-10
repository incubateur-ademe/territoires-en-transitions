import { Page } from '@playwright/test';

const STABLE_SAMPLES_REQUIRED = 3;
const STABLE_TOLERANCE_PX = 0.5;

export const waitForScrollSettled = async (
  page: Page,
  elementId: string
): Promise<void> => {
  await page.waitForFunction(
    ({ id, samplesRequired, tolerance }) => {
      const top =
        document.getElementById(id)?.getBoundingClientRect().top ?? null;
      if (top === null) return false;
      const state = window as unknown as {
        __scrollSettleTop?: number;
        __scrollSettleCount?: number;
      };
      const previous = state.__scrollSettleTop;
      if (previous !== undefined && Math.abs(previous - top) < tolerance) {
        state.__scrollSettleCount = (state.__scrollSettleCount ?? 0) + 1;
      } else {
        state.__scrollSettleCount = 0;
      }
      state.__scrollSettleTop = top;
      return (state.__scrollSettleCount ?? 0) >= samplesRequired;
    },
    {
      id: elementId,
      samplesRequired: STABLE_SAMPLES_REQUIRED,
      tolerance: STABLE_TOLERANCE_PX,
    }
  );
};

export const waitForScrollStopped = async (page: Page): Promise<void> => {
  await page.waitForFunction(
    ({ samplesRequired, tolerance }) => {
      const y = window.scrollY;
      const state = window as unknown as {
        __scrollStopTop?: number;
        __scrollStopCount?: number;
      };
      const previous = state.__scrollStopTop;
      if (previous !== undefined && Math.abs(previous - y) < tolerance) {
        state.__scrollStopCount = (state.__scrollStopCount ?? 0) + 1;
      } else {
        state.__scrollStopCount = 0;
      }
      state.__scrollStopTop = y;
      return (state.__scrollStopCount ?? 0) >= samplesRequired;
    },
    {
      samplesRequired: STABLE_SAMPLES_REQUIRED,
      tolerance: STABLE_TOLERANCE_PX,
    }
  );
};

export const stickyHeaderBottom = async (page: Page): Promise<number> => {
  const stickyHeader = page.getByRole('region');
  const box = await stickyHeader.boundingBox();
  if (!box) throw new Error('Header sticky introuvable');
  return box.y + box.height;
};
