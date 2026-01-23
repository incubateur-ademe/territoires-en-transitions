import { expect, Locator, Page } from '@playwright/test';
import { DropdownPom } from 'tests/shared/dropdown.pom';

export class CreatePlanPom {
  readonly nomInput: Locator;
  readonly typeSelect: Locator;
  readonly submitButton: Locator;
  readonly title: Locator;
  readonly cancelButton: Locator;
  readonly pilotesDropdown: DropdownPom;
  readonly referentsDropdown: DropdownPom;

  constructor(public readonly page: Page) {
    this.page = page;
    this.nomInput = page.locator('[data-test="PlanNomInput"]');
    this.typeSelect = page.locator('[data-test="Type"]');
    this.submitButton = page.getByRole('button', { name: 'Valider' });
    this.title = page.getByRole('heading', {
      name: 'Créer un plan',
    });
    this.cancelButton = page.getByRole('button', {
      name: "Revenir à l'étape précédente",
    });
    this.pilotesDropdown = new DropdownPom(
      page,
      page.getByTestId('create-plan-pilote')
    );
    this.referentsDropdown = new DropdownPom(
      page,
      page.getByTestId('create-plan-referent')
    );
  }

  async goto(collectiviteId: number) {
    await this.page.goto(`/collectivite/${collectiviteId}/plans/creer`, {
      waitUntil: 'domcontentloaded',
    });
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

  async selectPilote(piloteNom: string) {
    await this.pilotesDropdown.selectOption(piloteNom);
  }

  async selectReferent(referentNom: string) {
    await this.referentsDropdown.selectOption(referentNom);
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
