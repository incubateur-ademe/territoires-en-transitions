import { expect, Locator, Page } from '@playwright/test';

export class IndicateurDetailPom {
  readonly favoriButton: Locator;
  readonly modifierButton: Locator;
  readonly editModal: Locator;
  readonly editModalValiderButton: Locator;
  readonly piloteDropdown: Locator;

  constructor(readonly page: Page) {
    this.favoriButton = page.locator('[data-test="IndicateurFavoriButton"]');
    this.modifierButton = page.getByRole('button', {
      name: 'Modifier',
    });
    this.editModal = page.locator('[data-test="IndicateurEditModal"]');
    this.editModalValiderButton = this.editModal.getByText('Valider');
    this.piloteDropdown = this.editModal.getByPlaceholder(
      'Sélectionner ou créer un pilote'
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

  async openEditModal() {
    await this.modifierButton.click();
    await expect(this.editModal).toBeVisible();
  }

  async saveEditModal() {
    await this.editModalValiderButton.click();
    await expect(this.editModal).toBeHidden();
  }

  async expectIsFavori() {
    await expect(this.favoriButton).toHaveClass(/text-warning-1/);
  }

  async expectIsNotFavori() {
    await expect(this.favoriButton).not.toHaveClass(/text-warning-1/);
  }
}
