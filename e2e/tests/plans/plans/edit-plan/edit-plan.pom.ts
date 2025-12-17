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
      name: "Vous n'avez aucune fiche action ni arborescence de plan",
    });
    this.addAxeButton = page.locator('[data-test="AjouterAxe"]');
    this.modifierPlanButton = page.locator('[data-test="ModifierPlanBouton"]');
    this.createFicheButton = page.getByRole('button', {
      name: 'Créer une fiche action',
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

  async addAxe(axeNom: string) {
    await this.addAxeButton.click();
    // Attendre que l'input du titre de l'axe soit visible
    const axeInput = this.page.locator('[data-test="TitreAxeInput"]').last();
    await expect(axeInput).toBeVisible();
    // Remplir le titre de l'axe
    await axeInput.fill(axeNom);
    // Appuyer sur Entrée ou faire blur pour sauvegarder
    await axeInput.blur();
  }

  async expectAxeExists(axeNom: string) {
    // Vérifier qu'un axe avec ce nom existe
    const axe = this.page
      .locator('[data-test="Axe"]')
      .filter({
        hasText: axeNom,
      })
      .last();
    await expect(axe).toBeVisible();
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

  getAxeByName(name: string) {
    return this.page.locator('[data-test="Axe"]').filter({
      hasText: name,
    });
  }

  getAxeInputByName(name: string) {
    return this.page.locator('[data-test="Axe"] textarea').getByText(name);
  }

  /**
   * Édite le nom d'un axe en cliquant sur son input
   */
  async editAxeNom(ancienNom: string, nouveauNom: string) {
    // Trouver l'axe par son nom
    const axe = this.getAxeInputByName(ancienNom);

    // Clic et attend que l'input soit éditable
    await axe.click();
    await axe.isEditable();
    await axe.fill(nouveauNom);

    await expect(this.getAxeInputByName(ancienNom)).toBeHidden();
    await expect(this.getAxeInputByName(nouveauNom)).toBeVisible();
  }

  /**
   * Déplie un axe pour voir ses sous-axes et fiches
   */
  async expandAxe(axeNom: string) {
    const axe = this.getAxeByName(axeNom);
    await expect(axe).toBeVisible();

    const expandButton = axe.locator('[data-test="BoutonDeplierAxe"]');
    await expandButton.click();
  }

  /**
   * Ajoute un sous-axe à un axe existant
   */
  async addSousAxe(parentAxeNom: string, sousAxeNom: string) {
    // D'abord déplier l'axe parent pour voir le bouton d'ajout
    await this.expandAxe(parentAxeNom);

    const parentAxe = this.getAxeByName(parentAxeNom);

    // Le bouton "Créer un sous-titre" apparaît au survol de l'axe
    await parentAxe.hover();

    // Chercher le bouton "Créer un sous-titre" dans l'axe (apparaît au survol avec title="Créer un sous-titre")
    const addSousAxeButton = parentAxe.locator(
      'button[title="Créer un sous-titre"]'
    );

    await addSousAxeButton.click();

    // Attendre que l'input du titre du sous-axe soit visible
    const sousAxeInput = this.page.locator('textarea:focus');
    await expect(sousAxeInput).toBeVisible();

    // Remplir le titre du sous-axe
    await sousAxeInput.fill(sousAxeNom);
    await sousAxeInput.blur();
  }

  /**
   * Ajoute une fiche action au plan ou à un axe
   * @param ficheTitre - Titre de la fiche (optionnel)
   * @param axeNom - Nom de l'axe dans lequel ajouter la fiche (optionnel, si non fourni, ajoute au plan racine)
   */
  async addFiche(axeNom?: string) {
    if (axeNom) {
      await this.expandAxe(axeNom);

      const axe = this.getAxeByName(axeNom);

      // le bouton "Créer une fiche" dans l'axe apparaît au survol
      await axe.hover();
      const addFicheButton = axe.locator('button[title="Créer une fiche"]');

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
}
