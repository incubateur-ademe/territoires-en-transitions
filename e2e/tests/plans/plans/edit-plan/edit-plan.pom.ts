import { expect, Locator, Page } from '@playwright/test';
import { DropdownPom } from 'tests/shared/dropdown.pom';

export class EditPlanPom {
  readonly emptyPlanMessage: Locator;
  readonly addAxeButton: Locator;
  readonly createFicheButton: Locator;
  readonly header: {
    title: Locator;
    editableTitle: Locator;
    type: Locator;
    pilote: Locator;
    referent: Locator;
    investissement: Locator;
    fonctionnement: Locator;
    axes: Locator;
    sousAxes: Locator;
    actions: Locator;
  };

  constructor(public readonly page: Page) {
    this.page = page;
    this.emptyPlanMessage = page.getByRole('heading', {
      name: "Vous n'avez aucune action ni arborescence de plan",
    });
    this.addAxeButton = page.locator('[data-test="AjouterAxe"]');
    this.createFicheButton = page.getByRole('button', {
      name: 'Créer une action',
    });
    this.header = {
      title: page.locator('h1[data-test="plan-editable-title"]'),
      editableTitle: page.locator('textarea[data-test="plan-editable-title"]'),
      type: page.getByTestId('plan-header-type'),
      pilote: page.getByTestId('plan-header-pilote'),
      referent: page.getByTestId('plan-header-referent'),
      investissement: page.getByTestId('plan-header-investissement'),
      fonctionnement: page.getByTestId('plan-header-fonctionnement'),
      axes: page.getByTestId('plan-header-axes'),
      sousAxes: page.getByTestId('plan-header-sous-axes'),
      actions: page.getByTestId('plan-header-actions'),
    };
  }

  getPlanUrl(collectiviteId: number, planId: number): string {
    return `/collectivite/${collectiviteId}/plans/${planId}`;
  }

  async goto(collectiviteId: number, planId: number) {
    await this.page.goto(this.getPlanUrl(collectiviteId, planId));
    // Attendre que le titre soit visible pour confirmer que la page est chargée
    await expect(this.header.title).toBeVisible();
  }

  async expectPlanTitle(title: string) {
    await expect(this.header.title).toHaveText(title);
  }

  async expectPlanType(type: string) {
    await expect(this.page.getByText(type)).toBeVisible();
  }

  async expectUrl(collectiviteId: number, planId: number) {
    await expect(this.page).toHaveURL(this.getPlanUrl(collectiviteId, planId));
  }

  async expectPlanIsEmpty() {
    await expect(this.emptyPlanMessage).toBeVisible();
  }

  async expectPlanToHaveAxes() {
    await expect(this.emptyPlanMessage).toBeHidden();
  }

  /**
   * Valide et ferme la modale d'édition du plan
   */
  private async submitEditPlanModal(modal: Locator) {
    const submitButton = modal.getByRole('button', { name: 'Valider' });
    await submitButton.click();
    await expect(modal).toBeHidden();
  }

  /**
   * Édite le nom d'un plan
   */
  async editPlanNom(nom: string) {
    // clic sur le titre pour l'éditer
    await this.header.title.click();
    const nomInput = this.header.editableTitle;

    await nomInput.clear();
    await nomInput.fill(nom);
    await nomInput.blur();
  }

  /**
   * Ouvre le menu "..." et renvoi l'item voulu
   */
  async getMenuItem(axeNom: string, title: string) {
    const menuButton = this.header.title.locator(
      'button[title="Editer ce plan"]'
    );
    await menuButton.click();
    return this.page
      .locator('[data-floating-ui-portal]')
      .getByRole('button', { name: title });
  }

  /**
   * Édite le type d'un plan
   */
  async editPlanType(type: string) {
    await this.header.type.click();
    const option = this.page.getByRole('button', { name: type });
    await option.click();
  }

  /**
   * Édite le pilote d'un plan
   */
  async editPlanPilote(piloteNom: string) {
    await this.header.pilote.click();
    const pilotesDropdown = new DropdownPom(
      this.page,
      this.page.getByTestId('plan-header-pilote-dropdown')
    );
    await pilotesDropdown.selectOption(piloteNom);
  }

  /**
   * Édite le référent d'un plan
   */
  async editPlanReferent(referentNom: string) {
    await this.header.referent.click();
    const referentsDropdown = new DropdownPom(
      this.page,
      this.page.getByTestId('plan-header-referent-dropdown')
    );
    await referentsDropdown.selectOption(referentNom);
  }

  /**
   * Ajoute une fiche action à la racine du plan
   * @param ficheTitre - Titre de la fiche (optionnel)
   */
  async addFiche() {
    await this.createFicheButton.click();
  }

  /**
   * Vérifie qu'une fiche existe dans le plan
   */
  async expectFicheExists(ficheTitre: string) {
    // Les fiches sont affichées dans la liste des fiches
    const fiche = this.page.locator('[data-test="FicheActionCarte"]').filter({
      hasText: ficheTitre,
    });
    await expect(fiche).toBeVisible();
  }

  /**
   * Vérifie qu'un pilote est affiché dans les métadonnées du plan
   * @param piloteNom - Le nom du pilote à vérifier
   */
  async expectPiloteExists(piloteNom: string) {
    const pilote = this.header.pilote.getByText(piloteNom);
    await expect(pilote).toBeVisible();
  }

  /**
   * Vérifie qu'un référent est affiché dans les métadonnées du plan
   * @param referentNom - Le nom du référent à vérifier
   */
  async expectReferentExists(referentNom: string) {
    const referent = this.header.referent.getByText(referentNom);
    await expect(referent).toBeVisible();
  }

  /**
   * Récupère le bouton "Ouvrir/Fermer tous les axes/sous-axes"
   */
  getToggleAllAxesButton() {
    return this.page.locator('[data-test="ToggleAllAxes"]');
  }

  /**
   * Clique sur le bouton "Ouvrir/Fermer tous les axes/sous-axes"
   */
  async toggleAllAxes() {
    const button = this.getToggleAllAxesButton();
    await expect(button).toBeVisible();
    await button.click();
  }

  /**
   * Vérifie que le bouton "Ouvrir/Fermer tous les axes/sous-axes" affiche "Fermer"
   * (indique que tous les axes sont fermés, cliquer va les ouvrir)
   */
  async expectToggleAllAxesButtonShowsOpen() {
    const button = this.getToggleAllAxesButton();
    await expect(button).toBeVisible();
    await expect(button).toContainText('Fermer tous les axes');
  }

  /**
   * Vérifie que le bouton "Ouvrir/Fermer tous les axes/sous-axes" affiche "Ouvrir"
   * (indique que tous les axes sont ouverts, cliquer va les fermer)
   */
  async expectToggleAllAxesButtonShowsClose() {
    const button = this.getToggleAllAxesButton();
    await expect(button).toBeVisible();
    await expect(button).toContainText('Ouvrir tous les axes');
  }

  /**
   * Ouvre le menu des options d'affichage du plan
   */
  private async openPlanOptionsMenu() {
    const optionsButton = this.page.locator(
      '[data-test="plan-options.button"]'
    );
    await expect(optionsButton).toBeVisible();
    await optionsButton.click();
    // Attendre que le menu soit visible (dans le FloatingPortal)
    // Le menu contient les checkboxes avec les labels "Description", "Indicateurs", etc.
    const menu = this.page.locator('[data-floating-ui-focusable]').last();
    await expect(menu).toBeVisible();
    return menu;
  }

  /**
   * Ferme le menu des options d'affichage en cliquant en dehors
   */
  private async closePlanOptionsMenu() {
    // Cliquer en dehors du menu pour le fermer
    await this.page.mouse.click(0, 0);
  }

  /**
   * Active ou désactive une option d'affichage du plan
   * @param optionLabel - Le label de l'option (ex: "Description", "Indicateurs", etc.)
   */
  async togglePlanDisplayOption(optionLabel: string) {
    const menu = await this.openPlanOptionsMenu();
    const checkbox = menu
      .locator('label')
      .filter({ hasText: optionLabel })
      .first();
    await expect(checkbox).toBeVisible();
    await checkbox.click();
    await this.closePlanOptionsMenu();
  }

  /**
   * Vérifie qu'une option d'affichage est cochée
   * @param optionLabel - Le label de l'option à vérifier
   */
  async expectPlanDisplayOptionIsChecked(optionLabel: string) {
    const menu = await this.openPlanOptionsMenu();
    const checkbox = menu.getByRole('checkbox', { name: optionLabel }).first();
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeChecked();
    await this.closePlanOptionsMenu();
  }

  /**
   * Vérifie qu'une option d'affichage est décochée
   * @param optionLabel - Le label de l'option à vérifier
   */
  async expectPlanDisplayOptionIsUnchecked(optionLabel: string) {
    const menu = await this.openPlanOptionsMenu();
    const checkbox = menu.getByRole('checkbox', { name: optionLabel }).first();
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
    await this.closePlanOptionsMenu();
  }

  /**
   * Vérifie qu'une option d'affichage est désactivée (disabled)
   * @param optionLabel - Le label de l'option à vérifier
   */
  async expectPlanDisplayOptionIsDisabled(optionLabel: string) {
    const menu = await this.openPlanOptionsMenu();
    const checkbox = menu.getByRole('checkbox', { name: optionLabel }).first();
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeDisabled();
    await this.closePlanOptionsMenu();
  }
}
