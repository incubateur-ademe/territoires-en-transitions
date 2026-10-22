import { expect, Locator, Page } from '@playwright/test';

export class IndicateurDetailPom {
  readonly favoriButton: Locator;
  readonly piloteButton: Locator;
  readonly piloteDropdown: Locator;

  constructor(readonly page: Page) {
    this.favoriButton = page.locator('[data-test="IndicateurFavoriButton"]');
    this.piloteButton = page.locator(
      '[data-test="indicateurs.detail.personnes-pilotes-button"]'
    );
    this.piloteDropdown = page.getByPlaceholder(
      'Sélectionner ou créer une personne pilote'
    );
  }

  async goto(collectiviteId: number, indicateurId: number) {
    await this.page.goto(
      `/collectivite/${collectiviteId}/indicateurs/perso/${indicateurId}`
    );
    await expect(this.favoriButton).toBeVisible();
  }

  async toggleFavori() {
    await this.favoriButton.click();
  }

  async openPiloteDropdown() {
    await this.piloteButton.click();
    await expect(this.piloteDropdown).toBeVisible();
  }

  async expectIsFavori() {
    await expect(this.favoriButton).toHaveClass(/text-warning-1/);
  }

  async expectIsNotFavori() {
    await expect(this.favoriButton).not.toHaveClass(/text-warning-1/);
  }
}
