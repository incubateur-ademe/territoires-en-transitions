import { expect, Locator, Page } from '@playwright/test';

export class ReferentielModeBannerPom {
  readonly banner: Locator;

  constructor(readonly page: Page) {
    this.banner = page.getByTestId('referentiels.mode-banner');
  }

  async expectVisibleWithMode(mode: 'readonly' | 'archived') {
    await expect(this.banner).toBeVisible();
    await expect(this.banner).toHaveAttribute('data-referentiel-mode', mode);
  }

  async expectHidden() {
    await expect(this.banner).toHaveCount(0);
  }
}
