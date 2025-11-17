import { Statut } from '@/domain/plans';
import { Locator, Page } from '@playwright/test';

export class FilterFichesPom {
  readonly page: Page;
  readonly statutsSelector: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statutsSelector = page.locator('[data-test="statuts"]');
  }
  async selectStatut(statut: Statut) {
    await this.statutsSelector.click();
    await this.page.locator(`[data-test="${statut}"]`).click();
  }
}
