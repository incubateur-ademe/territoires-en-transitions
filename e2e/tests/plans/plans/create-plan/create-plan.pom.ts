import { expect, Locator, Page } from '@playwright/test';

export class CreatePlanPom {
  readonly nomInput: Locator;
  readonly typeSelect: Locator;
  readonly submitButton: Locator;
  readonly title: Locator;
  readonly cancelButton: Locator;

  constructor(public readonly page: Page) {
    this.page = page;
    this.nomInput = page.locator('[data-test="PlanNomInput"]');
    this.typeSelect = page.locator('[data-test="Type"]');
    this.submitButton = page.getByRole('button', { name: 'Valider' });
    this.title = page.getByRole('heading', {
      name: "Créer un plan d'action",
    });
    this.cancelButton = page.getByRole('button', {
      name: "Revenir à l'étape précédente",
    });
  }

  async goto(collectiviteId: number) {
    await this.page.goto(`/collectivite/${collectiviteId}/plans/creer`);
    await expect(this.title).toBeVisible();
  }

  async fillNom(nom: string) {
    await this.nomInput.fill(nom);
  }

  async selectType(typeLabel: string) {
    await this.typeSelect.click();
    // Sélectionner l'option par son label
    const option = this.page.getByRole('button', { name: typeLabel });
    await option.click();
  }

  async submit() {
    await this.submitButton.click();
  }

  async expectSuccess(collectiviteId: number) {
    // Après une création réussie, on est redirigé vers la page du plan
    // L'URL devrait être /collectivite/:collectiviteId/plans/:planUid
    await expect(this.page).toHaveURL(
      new RegExp(`/collectivite/${collectiviteId}/plans/\\d+`)
    );
    // Le titre de création ne devrait plus être visible
    await expect(this.title).toBeHidden();
  }
}
