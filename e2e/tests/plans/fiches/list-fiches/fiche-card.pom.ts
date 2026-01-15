import { expect, Locator, Page } from '@playwright/test';

interface FicheCardPomOptions {
  page: Page;
  ficheTitre?: string;
  index?: number;
  axeParent?: Locator;
}

export class FicheCardPom {
  readonly page: Page;
  readonly card: Locator;
  readonly titre: Locator;
  readonly statutBadge: Locator;
  readonly prioriteBadge: Locator;
  readonly editButton: Locator;
  readonly privateIndicator: Locator;
  readonly footer: Locator;

  /**
   * Crée une instance pour une carte réprésentant une fiche action
   * @param options - Options pour créer l'instance
   * @param options.page - La page Playwright
   * @param options.ficheTitre - Le titre de la fiche (optionnel, pour filtrer parmi plusieurs cartes)
   * @param options.index - L'index de la carte dans la liste (optionnel, par défaut 0)
   * @param options.axeParent - Le locator de l'axe parent (optionnel, si fourni, les cartes seront recherchées dans cet axe plutôt que dans toute la page)
   */
  constructor(options: FicheCardPomOptions) {
    this.page = options.page;

    // Utiliser axeParent si fourni, sinon utiliser page
    const parentLocator = options.axeParent ?? options.page;

    // Sélectionner la carte spécifique
    if (options.ficheTitre) {
      this.card = parentLocator
        .locator('[data-test="FicheActionCarte"]')
        .filter({ hasText: options.ficheTitre })
        .first();
    } else {
      this.card = parentLocator
        .locator('[data-test="FicheActionCarte"]')
        .nth(options.index ?? 0);
    }

    // Éléments de la carte
    this.titre = this.card.locator('span.text-base.font-bold.text-primary-9');
    this.statutBadge = this.card.locator(
      '[data-test="Badge-FicheActionBadgeStatut"]'
    );
    this.prioriteBadge = this.card
      .locator('span')
      .filter({ hasText: /^(Bas|Moyen|Élevé)$/ });
    this.editButton = this.card.locator('[data-test="EditerFicheBouton"]');
    this.privateIndicator = this.card.locator('[data-test="FicheCartePrivee"]');
    this.footer = this.card
      .locator('footer, [class*="flex flex-col gap-2"]')
      .last();
  }

  /**
   * Clique sur la carte pour ouvrir la fiche
   */
  async click() {
    await this.card.click();
  }

  /**
   * Vérifie que le titre de la fiche correspond au texte attendu
   */
  async expectTitre(expectedTitre: string) {
    await expect(this.titre).toHaveText(expectedTitre);
  }
  async expectSansTitre() {
    await expect(this.card).toContainText('Sans titre');
  }

  /**
   * Vérifie que le statut de la fiche correspond au statut attendu
   */
  async expectStatut(expectedStatut: string) {
    await expect(this.statutBadge).toContainText(expectedStatut);
  }

  /**
   * Vérifie que la priorité de la fiche correspond à la priorité attendue
   */
  async expectPriorite(expectedPriorite: 'Bas' | 'Moyen' | 'Élevé') {
    await expect(this.prioriteBadge).toContainText(expectedPriorite);
  }

  /**
   * Vérifie que la fiche est marquée comme privée
   */
  async expectIsPrivate() {
    await expect(this.privateIndicator).toBeVisible();
  }

  /**
   * Vérifie que la fiche n'est pas marquée comme privée
   */
  async expectIsNotPrivate() {
    await expect(this.privateIndicator).toBeHidden();
  }

  /**
   * Ouvre le menu d'édition en survolant la carte puis en cliquant sur le bouton d'édition
   */
  async edit() {
    await this.card.hover();
    await this.editButton.click();
  }

  /**
   * Vérifie que le bouton d'édition est visible (nécessite un survol)
   */
  async expectEditButtonVisible() {
    await this.card.hover();
    await expect(this.editButton).toBeVisible();
  }

  /**
   * Vérifie que la carte est visible
   */
  async expectVisible() {
    await expect(this.card).toBeVisible();
  }
  async expectHidden() {
    await expect(this.card).toBeHidden();
  }

  /**
   * Vérifie que la carte contient le texte spécifié
   */
  async expectContainsText(text: string) {
    await expect(this.card).toContainText(text);
  }

  /**
   * Ouvre le menu de la fiche et clique sur "Déplacer"
   */
  async openMoveMenu() {
    await this.card.hover();
    const menuButton = this.card
      .locator('..')
      .getByTestId('fiche-card-options');
    await menuButton.click();
    await this.page
      .locator('[data-floating-ui-portal]')
      .getByRole('button', { name: 'Déplacer' })
      .click();
  }

  /**
   * Déplace une fiche vers un axe spécifique
   * @param planNom - Le nom du plan contenant l'axe de destination
   * @param axeNom - Le nom de l'axe de destination (optionnel, si non fourni, déplace à la racine du plan)
   */
  async moveFicheToAxe(planNom: string, axeNom?: string) {
    // Ouvre le menu de la fiche et clique sur "Déplacer"
    await this.openMoveMenu();

    // Attend que la modale soit visible
    const modal = this.page.getByTestId('move-fiche.modal');
    await expect(modal).toBeVisible();

    // Sélectionne le plan de destination
    const planTargetButton = modal.getByText(planNom);
    await expect(planTargetButton).toBeVisible();
    await planTargetButton.click();

    // Si un axe est spécifié, sélectionne l'axe de destination
    if (axeNom) {
      const targetAxeButton = modal.getByText(axeNom);
      await expect(targetAxeButton).toBeVisible();
      await targetAxeButton.click();
    }

    // Valide le déplacement
    const submitButton = modal.getByRole('button', { name: 'Valider' });
    await submitButton.click();

    // Attend que la modale se ferme
    await expect(modal).toBeHidden();
  }
}
