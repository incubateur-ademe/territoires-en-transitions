import { expect, Locator, Page } from '@playwright/test';

export class EditAxePom {
  readonly addAxeButton: Locator;

  constructor(public readonly page: Page) {
    this.page = page;
    this.addAxeButton = page.locator('[data-test="AjouterAxe"]');
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

    // ouvrir le menu "..." (apparaît au survol de l'axe)
    await parentAxe.hover();
    const axeMenuButton = parentAxe.locator('button[title="Editer cet axe"]');
    await axeMenuButton.click();

    // Chercher le bouton "Créer un axe"
    const addSousAxeButton = this.page.getByRole('button', {
      name: 'Créer un axe',
    });

    await addSousAxeButton.click();

    // Attendre que l'input du titre du sous-axe soit visible
    const sousAxeInput = this.page.locator('textarea:focus');
    await expect(sousAxeInput).toBeVisible();

    // Remplir le titre du sous-axe
    await sousAxeInput.fill(sousAxeNom);
    await sousAxeInput.blur();
  }

  /**
   * Ouvre le menu d'un axe et clique sur un élément de menu
   * @param axeNom - Le nom de l'axe
   * @param title - Le titre de l'élément de menu à cliquer
   */
  private async clickOnAxeMenuItem(axeNom: string, title: string) {
    const axe = this.getAxeByName(axeNom);

    // Ouvrir le menu "..." (apparaît au survol de l'axe)
    await axe.hover({ position: { x: 0, y: 0 } });
    const axeMenuButton = axe.locator('button[title="Editer cet axe"]');
    await axeMenuButton.click();

    // Cliquer sur l'élément de menu avec le titre donné
    const menuItem = this.page.getByRole('button', { name: title });
    await menuItem.click();
  }

  /**
   * Ouvre le panneau pour lier un indicateur à un axe
   * @param axeNom - Le nom de l'axe auquel ajouter un indicateur
   */
  async openLinkIndicateurPanel(axeNom: string) {
    // Cliquer sur "Lier un indicateur"
    await this.clickOnAxeMenuItem(axeNom, 'Lier un indicateur');

    // Attendre que le panneau latéral soit ouvert
    const sideMenu = this.getIndicateursPanel();
    await expect(sideMenu).toBeVisible();
  }

  getIndicateursPanel() {
    return this.page.locator('[data-test=axe-indicateurs-panel]');
  }

  /**
   * Coche la checkbox "Indicateurs personnalisés" dans le panneau latéral
   */
  async filterIndicateursPerso() {
    // Trouver la checkbox "Indicateurs personnalisés" dans le panneau latéral
    const checkboxPerso = this.getIndicateursPanel()
      .locator('label')
      .filter({ hasText: 'Indicateurs personnalisés' })
      .first();

    await expect(checkboxPerso).toBeVisible();
    await checkboxPerso.click();
  }

  /**
   * Sélectionne un indicateur dans le panneau latéral en cliquant sur sa checkbox
   * @param indicateurTitre - Le titre de l'indicateur à sélectionner
   */
  async selectIndicateur(indicateurTitre: string) {
    // Trouver la checkbox de l'indicateur dans le panneau latéral
    // Les indicateurs sont dans des cartes avec data-test="chart-{id}"
    // Le titre est dans le label de la checkbox, on peut cliquer directement sur le label
    const indicateurLabel = this.getIndicateursPanel()
      .locator('label')
      .filter({ hasText: indicateurTitre })
      .first();

    await expect(indicateurLabel).toBeVisible();
    await indicateurLabel.click();
  }

  /**
   * Vérifie qu'un indicateur est lié à un axe
   * @param axeNom - Le nom de l'axe
   * @param indicateurTitre - Le titre de l'indicateur à vérifier
   */
  async getIndicateurLinkedToAxe(axeNom: string, indicateurTitre: string) {
    const axe = this.getAxeByName(axeNom);

    // Vérifier que la section "Indicateurs liés" existe
    const indicateursSection = axe.getByText('Indicateurs liés').locator('..');
    await expect(indicateursSection).toBeVisible();

    // localiser l'indicateur dans la liste
    return indicateursSection
      .locator('[data-test^="chart-"]')
      .filter({ hasText: indicateurTitre })
      .first();
  }

  async expectIndicateurLinkedToAxe(axeNom: string, indicateurTitre: string) {
    const indicateur = await this.getIndicateurLinkedToAxe(
      axeNom,
      indicateurTitre
    );
    await expect(indicateur).toBeVisible();
  }

  async expectIndicateurNotLinkedToAxe(
    axeNom: string,
    indicateurTitre: string
  ) {
    const indicateur = await this.getIndicateurLinkedToAxe(
      axeNom,
      indicateurTitre
    );
    await expect(indicateur).toBeHidden();
  }

  /**
   * Ouvre le menu d'un axe et clique sur "Ajouter une description"
   * @param axeNom - Le nom de l'axe auquel ajouter une description
   */
  async addDescriptionToAxe(axeNom: string) {
    await this.clickOnAxeMenuItem(axeNom, 'Ajouter une description');
  }

  /**
   * Récupère l'éditeur de description d'un axe
   * @param axeNom - Le nom de l'axe
   */
  private getDescriptionEditor(axeNom: string) {
    const axe = this.getAxeByName(axeNom);
    // Le RichTextEditor crée un élément contenteditable dans un div avec l'id axe-desc-{id}
    return axe.locator('[id^="axe-desc-"] div[contenteditable="true"]').first();
  }

  /**
   * Vérifie que l'éditeur de description est visible pour un axe
   * @param axeNom - Le nom de l'axe
   */
  async expectDescriptionEditorVisible(axeNom: string) {
    const editor = this.getDescriptionEditor(axeNom);
    await expect(editor).toBeVisible();
  }

  /**
   * Remplit la description d'un axe
   * @param axeNom - Le nom de l'axe
   * @param description - Le texte de la description à saisir
   */
  async fillDescription(axeNom: string, description: string) {
    const editor = this.getDescriptionEditor(axeNom);
    await editor.click();
    await editor.fill(description);
  }

  /**
   * Vérifie qu'un axe contient une description avec le texte attendu
   * @param axeNom - Le nom de l'axe
   * @param expectedText - Le texte attendu dans la description
   */
  async expectDescriptionContains(axeNom: string, expectedText: string) {
    const editor = this.getDescriptionEditor(axeNom);
    await expect(editor).toBeVisible();
    await expect(editor).toContainText(expectedText);
  }

  /**
   * Supprime la description d'un axe
   * @param axeNom - Le nom de l'axe
   */
  async removeDescriptionFromAxe(axeNom: string) {
    await this.clickOnAxeMenuItem(axeNom, 'Supprimer la description');
  }

  /**
   * Vérifie qu'un axe n'a pas de description visible
   * @param axeNom - Le nom de l'axe
   */
  async expectDescriptionNotVisible(axeNom: string) {
    const editor = this.getDescriptionEditor(axeNom);
    await expect(editor).toBeHidden();
  }
}
