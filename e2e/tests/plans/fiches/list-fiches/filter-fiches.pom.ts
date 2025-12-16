import { Locator, Page } from '@playwright/test';
import { Statut } from '@tet/domain/plans';

export class FilterFichesPom {
  readonly statutsSelector: Locator;

  constructor(readonly page: Page) {
    this.page = page;
    this.statutsSelector = page.locator('[data-test="statuts"]');
  }
  async selectStatut(statut: Statut) {
    await this.statutsSelector.click();
    await this.page.locator(`[data-test="${statut}"]`).click();
  }
}
