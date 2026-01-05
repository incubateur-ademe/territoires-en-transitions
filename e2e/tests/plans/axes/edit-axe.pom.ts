import { expect, Locator, Page } from '@playwright/test';

export class EditAxePom {
  readonly addAxeButton: Locator;

  constructor(public readonly page: Page) {
    this.page = page;
    this.addAxeButton = page.locator('[data-test="AjouterAxe"]');
  }

  // libellés des sections affichés dans un axe
  sectionLabels = {
    description: 'Description',
    indicateurs: 'Indicateurs liés',
    actions: 'Actions',
  } as const;

  async getSection(
    axeNom: string,
    sectionNom: keyof typeof this.sectionLabels
  ) {
    const axe = this.getAxeByName(axeNom);
    const section = axe.getByText(this.sectionLabels[sectionNom], {
      exact: true,
    });
    return { axe, section };
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
    return this.page
      .locator('[data-test="Axe"]')
      .filter({
        hasText: name,
      })
      .first();
  }

  /**
   * Vérifie qu'un axe est ouvert (déplié)
   * Un axe est ouvert si son bouton de déplier a la classe "rotate-90"
   */
  async expectAxeIsOpen(axeNom: string) {
    const axe = this.getAxeByName(axeNom);
    await expect(axe).toBeVisible();
    const expandButton = axe.locator('[data-test="BoutonDeplierAxe"]').first();
    await expect(expandButton).toHaveClass(/rotate-90/);
  }

  /**
   * Vérifie qu'un axe est fermé (replié)
   * Un axe est fermé si son bouton de déplier n'a pas la classe "rotate-90"
   */
  async expectAxeIsClosed(axeNom: string) {
    const axe = this.getAxeByName(axeNom);
    await expect(axe).toBeVisible();
    const expandButton = axe.locator('[data-test="BoutonDeplierAxe"]').first();
    await expect(expandButton).not.toHaveClass(/rotate-90/);
  }

  /**
   * Vérifie qu'un axe est visible (même s'il est dans un parent replié, il peut être présent dans le DOM mais caché)
   * Pour vérifier qu'un sous-axe est vraiment visible, il faut que son parent soit ouvert
   */
  async expectAxeIsVisible(axeNom: string) {
    const axe = this.getAxeByName(axeNom);
    await expect(axe).toBeVisible();
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
   * Ouvre le menu d'un axe et renvoi l'élément de menu voulu
   * @param axeNom - Le nom de l'axe
   * @param title - Le titre de l'élément de menu à cliquer
   */
  async getAxeMenuItem(axeNom: string, title: string) {
    const axe = this.getAxeByName(axeNom);

    // Ouvrir le menu "..." (apparaît au survol de l'axe)
    await axe.hover({ position: { x: 0, y: 0 } });
    const axeMenuButton = axe.locator('button[title="Editer cet axe"]');
    await axeMenuButton.click();

    return this.page
      .locator('[data-floating-ui-portal]')
      .getByRole('button', { name: title });
  }

  /**
   * Ouvre le menu d'un axe et clique sur un élément de menu
   * @param axeNom - Le nom de l'axe
   * @param title - Le titre de l'élément de menu à cliquer
   */
  async clickOnAxeMenuItem(axeNom: string, title: string) {
    const menuItem = await this.getAxeMenuItem(axeNom, title);
    await menuItem.click();
  }

  async expectAxeMenuItemIsVisible(axeNom: string, title: string) {
    const menuItem = await this.getAxeMenuItem(axeNom, title);
    await menuItem.isVisible();
    // ferme le menu en cliquant ailleurs
    await this.page.mouse.click(0, 0);
  }

  async expectAxeMenuItemIsNotVisible(axeNom: string, title: string) {
    const menuItem = await this.getAxeMenuItem(axeNom, title);
    await menuItem.isVisible();
    // ferme le menu en cliquant ailleurs
    await this.page.mouse.click(0, 0);
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

  /**
   * Déplace un axe vers un nouvel emplacement
   * @param axeNom - Le nom de l'axe à déplacer
   * @param nouvelAxeParentNom - Le nom de l'axe parent de destination
   */
  async moveAxe(planNom: string, axeNom: string, nouvelAxeParentNom: string) {
    // Ouvrir le menu de l'axe et cliquer sur "Déplacer"
    await this.clickOnAxeMenuItem(axeNom, 'Déplacer');

    // Attendre que le modal soit visible
    const modal = this.page.locator('[data-test="move-axe-modal"]');
    await expect(modal).toBeVisible();

    // Sélectionner le plan et l'axe parent de destination dans le modal
    const planTargetButton = modal.getByRole('button', {
      name: planNom,
    });
    await expect(planTargetButton).toBeVisible();
    await planTargetButton.click();

    const targetAxeButton = modal.getByRole('button', {
      name: nouvelAxeParentNom,
    });
    await expect(targetAxeButton).toBeVisible();
    await targetAxeButton.click();

    // Valider le déplacement
    const submitButton = modal.getByRole('button', { name: 'Valider' });
    await submitButton.click();

    // Attendre que le modal se ferme
    await expect(modal).toBeHidden();
  }

  /**
   * Vérifie qu'un axe est un sous-axe d'un autre axe
   * @param sousAxeNom - Le nom du sous-axe à vérifier
   * @param parentAxeNom - Le nom de l'axe parent
   */
  async expectAxeIsSubAxeOf(sousAxeNom: string, parentAxeNom: string) {
    // S'assurer que l'axe parent est ouvert pour voir ses sous-axes
    await this.expectAxeIsOpen(parentAxeNom);

    // Vérifier que le sous-axe existe et est visible
    await this.expectAxeExists(sousAxeNom);

    // Vérifier que le sous-axe est bien à l'intérieur de l'axe parent
    const parentAxe = this.getAxeByName(parentAxeNom);

    // Vérifier que le sous-axe est dans le conteneur des enfants de l'axe parent
    const sousAxeInContainer = parentAxe
      .locator('[data-test="Axe"]')
      .filter({ hasText: sousAxeNom });
    await expect(sousAxeInContainer).toBeVisible();
  }

  /**
   * Vérifie que la section Description est visible dans un axe
   * @param axeNom - Le nom de l'axe
   * @param axeDescription - Le texte de la description attendu
   */
  async getDescriptionSection(axeNom: string, axeDescription: string) {
    const { axe, section } = await this.getSection(axeNom, 'description');
    const description = axe.getByText(axeDescription, { exact: true });
    return { axe, section, description };
  }
  async expectDescriptionSectionVisible(
    axeNom: string,
    axeDescription: string
  ) {
    const { section, description } = await this.getDescriptionSection(
      axeNom,
      axeDescription
    );
    await expect(section).toBeVisible();
    await expect(description).toBeVisible();
  }

  /**
   * Vérifie que la section Description n'est pas visible dans un axe
   * @param axeNom - Le nom de l'axe
   * @param axeDescription - Le texte de la description à vérifier
   */
  async expectDescriptionSectionNotVisible(
    axeNom: string,
    axeDescription: string
  ) {
    const { section, description } = await this.getDescriptionSection(
      axeNom,
      axeDescription
    );
    await expect(section).toBeHidden();
    await expect(description).toBeHidden();
  }

  /**
   * Vérifie que la section Indicateurs liés est visible dans un axe
   * @param axeNom - Le nom de l'axe
   */
  async expectIndicateursSectionVisible(axeNom: string) {
    const { section } = await this.getSection(axeNom, 'indicateurs');
    await expect(section).toBeVisible();
  }

  /**
   * Vérifie que la section Indicateurs liés n'est pas visible dans un axe
   * @param axeNom - Le nom de l'axe
   */
  async expectIndicateursSectionNotVisible(axeNom: string) {
    const { section } = await this.getSection(axeNom, 'indicateurs');
    await expect(section).toBeHidden();
  }

  /**
   * Vérifie que le graphique des indicateurs est visible dans un axe
   * @param axeNom - Le nom de l'axe
   */
  async expectIndicateursChartVisible(axeNom: string) {
    const { section } = await this.getSection(axeNom, 'indicateurs');
    const chart = section
      .locator('..')
      .locator('[data-test^="chart-"]')
      .first();
    await expect(chart).toBeVisible();
    // l'indicateur affiché est créé pour le test et n'a pas de données : on
    // vérifie juste que le placeholder svg est présent
    await expect(chart.locator('svg').first()).toBeVisible();
  }

  /**
   * Vérifie que le graphique des indicateurs n'est pas visible dans un axe
   * @param axeNom - Le nom de l'axe
   */
  async expectIndicateursChartNotVisible(axeNom: string) {
    const { section } = await this.getSection(axeNom, 'indicateurs');
    const chart = section
      .locator('..')
      .locator('[data-test^="chart-"]')
      .first();
    await expect(chart).toBeVisible();
    // l'indicateur affiché est créé pour le test et n'a pas de données : on
    // vérifie juste que le placeholder svg n'est pas présent
    await expect(chart.locator('svg').first()).toBeHidden();
  }

  /**
   * Vérifie que la section Actions est visible dans un axe
   * @param axeNom - Le nom de l'axe
   */
  async expectActionsSectionVisible(axeNom: string) {
    const { section } = await this.getSection(axeNom, 'actions');
    await expect(section).toBeVisible();
  }

  /**
   * Vérifie que la section Actions n'est pas visible dans un axe
   * @param axeNom - Le nom de l'axe
   */
  async expectActionsSectionNotVisible(axeNom: string) {
    const { section } = await this.getSection(axeNom, 'actions');
    await expect(section).toBeHidden();
  }
}
