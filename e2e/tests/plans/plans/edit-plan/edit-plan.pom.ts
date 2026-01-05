import { expect, Locator, Page } from '@playwright/test';
import { DropdownPersonnePom } from 'tests/shared/dropdown.pom';

export class EditPlanPom {
  readonly planTitle: Locator;
  readonly emptyPlanMessage: Locator;
  readonly addAxeButton: Locator;
  readonly modifierPlanButton: Locator;
  readonly createFicheButton: Locator;

  constructor(public readonly page: Page) {
    this.page = page;
    this.planTitle = page.locator('h2');
    this.emptyPlanMessage = page.getByRole('heading', {
      name: "Vous n'avez aucune action ni arborescence de plan",
    });
    this.addAxeButton = page.locator('[data-test="AjouterAxe"]');
    this.modifierPlanButton = page.locator('[data-test="ModifierPlanBouton"]');
    this.createFicheButton = page.getByRole('button', {
      name: 'Créer une action',
    });
  }

  getPlanUrl(collectiviteId: number, planId: number): string {
    return `/collectivite/${collectiviteId}/plans/${planId}`;
  }

  async goto(collectiviteId: number, planId: number) {
    await this.page.goto(this.getPlanUrl(collectiviteId, planId));
    // Attendre que le titre soit visible pour confirmer que la page est chargée
    await expect(this.planTitle).toBeVisible();
  }

  async expectPlanTitle(title: string) {
    await expect(this.planTitle).toHaveText(title);
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
   * Ouvre la modale d'édition du plan et retourne le locator de la modale
   */
  private async openEditPlanModal() {
    await this.modifierPlanButton.click();
    const modal = this.page.locator('[data-test="ModifierPlanTitreModale"]');
    await expect(modal).toBeVisible();
    return modal;
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
    const modal = await this.openEditPlanModal();
    const nomInput = modal.locator('[data-test="PlanNomInput"]');
    await nomInput.clear();
    await nomInput.fill(nom);
    await this.submitEditPlanModal(modal);
  }

  /**
   * Édite le type d'un plan
   */
  async editPlanType(type: string) {
    const modal = await this.openEditPlanModal();
    const typeSelect = modal.locator('[data-test="Type"]');
    await typeSelect.click();
    const option = this.page.getByRole('button', { name: type });
    await option.click();
    await this.submitEditPlanModal(modal);
  }

  /**
   * Édite le pilote d'un plan
   */
  async editPlanPilote(piloteNom: string) {
    const modal = await this.openEditPlanModal();
    const pilotesDropdown = new DropdownPersonnePom(
      this.page,
      'Personne pilote'
    );
    await pilotesDropdown.selectOption(piloteNom);
    await this.submitEditPlanModal(modal);
  }

  /**
   * Édite le référent d'un plan
   */
  async editPlanReferent(referentNom: string) {
    const modal = await this.openEditPlanModal();
    const referentsDropdown = new DropdownPersonnePom(
      this.page,
      'Élu·e référent·e'
    );
    await referentsDropdown.selectOption(referentNom);
    await this.submitEditPlanModal(modal);
  }

  /**
   * Ajoute une fiche action au plan ou à un axe
   * @param ficheTitre - Titre de la fiche (optionnel)
   * @param axeNom - Nom de l'axe dans lequel ajouter la fiche (optionnel, si non fourni, ajoute au plan racine)
   */
  async addFiche(axeNom?: string) {
    if (axeNom) {
      // Déplier l'axe si nécessaire
      const axe = this.page.locator('[data-test="Axe"]').filter({
        hasText: axeNom,
      });
      await expect(axe).toBeVisible();

      const expandButton = axe.locator('[data-test="BoutonDeplierAxe"]');
      await expandButton.click();

      // le bouton "Créer une action" dans l'axe apparaît au survol
      await axe.hover();
      const addFicheButton = axe.locator('button[title="Créer une action"]');

      await addFicheButton.click();
    } else {
      // Ajouter la fiche au plan racine
      await this.createFicheButton.click();
    }
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
    // Les pilotes sont affichés dans PlanMetadata avec PiloteOrReferentLabel
    // On cherche le texte du pilote dans la section des métadonnées
    const pilote = this.page.getByText(piloteNom);
    await expect(pilote).toBeVisible();
  }

  /**
   * Vérifie qu'un référent est affiché dans les métadonnées du plan
   * @param referentNom - Le nom du référent à vérifier
   */
  async expectReferentExists(referentNom: string) {
    // Les référents sont affichés dans PlanMetadata avec PiloteOrReferentLabel
    // On cherche le texte du référent dans la section des métadonnées
    const referent = this.page.getByText(referentNom);
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
    await expect(button).toContainText('Fermer tous les axes/sous-axes');
  }

  /**
   * Vérifie que le bouton "Ouvrir/Fermer tous les axes/sous-axes" affiche "Ouvrir"
   * (indique que tous les axes sont ouverts, cliquer va les fermer)
   */
  async expectToggleAllAxesButtonShowsClose() {
    const button = this.getToggleAllAxesButton();
    await expect(button).toBeVisible();
    await expect(button).toContainText('Ouvrir tous les axes/sous-axes');
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
