import { expect, Locator, Page } from '@playwright/test';

export class SousActionsPom {
  readonly page: Page;
  readonly sousActionsTab: Locator;
  readonly addSousActionButton: Locator;
  readonly titleTextarea: Locator;
  readonly emptyStateHeading: Locator;
  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sousActionsTab = page.getByRole('tab', { name: /Sous-actions/ });
    this.addSousActionButton = page.getByRole('button', {
      name: /Ajouter une sous-action/,
    });
    this.titleTextarea = page.getByPlaceholder('Saisir un titre');
    this.emptyStateHeading = page.getByRole('heading', {
      name: /Aucune sous-action/,
    });
    this.confirmDeleteButton = page
      .getByRole('dialog', { name: /Supprimer la sous-action/ })
      .getByRole('button', { name: 'Valider' });
  }

  /**
   * Cible le bouton poubelle (colonne « actions ») de la ligne correspondant
   * à la sous-action identifiée par son titre. On vise l'attribut `title`
   * car c'est un bouton icône, non identifiable par son nom accessible.
   */
  deleteButton(currentTitle: string): Locator {
    return this.page
      .getByRole('row')
      .filter({ hasText: currentTitle })
      .getByTitle('Supprimer la sous-action');
  }

  async deleteSousAction(currentTitle: string) {
    await this.deleteButton(currentTitle).click();
    await expect(this.confirmDeleteButton).toBeVisible();
    await this.confirmDeleteButton.click();
    await expect(this.confirmDeleteButton).toBeHidden();
  }

  async goto(collectiviteId: number, ficheId: number) {
    await this.page.goto(
      `/collectivite/${collectiviteId}/actions/${ficheId}/sous-actions`
    );
  }

  async clickAddSousAction() {
    await this.addSousActionButton.click();
  }

  /**
   * Cible la cellule titre (première colonne) d'une sous-action via le texte
   * actuellement affiché.
   */
  titleCell(currentTitle: string): Locator {
    return this.page
      .getByRole('row')
      .filter({ hasText: currentTitle })
      .getByRole('cell')
      .first();
  }

  async editTitle(currentTitle: string, newTitle: string) {
    await this.titleCell(currentTitle).click();
    await expect(this.titleTextarea).toBeVisible();
    await this.titleTextarea.fill(newTitle);
    // `Enter` ferme l'édition et déclenche la sauvegarde
    await this.titleTextarea.press('Enter');
    await expect(this.titleTextarea).toBeHidden();
  }
}
