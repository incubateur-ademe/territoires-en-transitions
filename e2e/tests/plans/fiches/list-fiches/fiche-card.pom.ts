import { expect, Locator, Page } from '@playwright/test';

export class FicheCardPom {
  readonly card: Locator;
  readonly titre: Locator;
  readonly statutBadge: Locator;
  readonly prioriteBadge: Locator;
  readonly editButton: Locator;
  readonly privateIndicator: Locator;
  readonly footer: Locator;

  /**
   * Crée une instance pour une carte réprésentant une fiche action
   * @param page - La page Playwright
   * @param ficheTitre - Le titre de la fiche (optionnel, pour filtrer parmi plusieurs cartes)
   * @param index - L'index de la carte dans la liste (optionnel, par défaut 0)
   */
  constructor(readonly page: Page, ficheTitre?: string, index = 0) {
    this.page = page;

    // Sélectionner la carte spécifique
    if (ficheTitre) {
      this.card = page
        .locator('[data-test="FicheActionCarte"]')
        .filter({ hasText: ficheTitre })
        .first();
    } else {
      this.card = page.locator('[data-test="FicheActionCarte"]').nth(index);
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

  /**
   * Vérifie que la carte contient le texte spécifié
   */
  async expectContainsText(text: string) {
    await expect(this.card).toContainText(text);
  }
}
