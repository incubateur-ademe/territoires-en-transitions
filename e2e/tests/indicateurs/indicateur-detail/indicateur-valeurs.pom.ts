import { expect, Locator, Page } from '@playwright/test';

/** Saisie des valeurs depuis la fiche d'un indicateur */
export class IndicateurValeursPom {
  readonly ajouterAnneeButton: Locator;
  readonly editModal: Locator;

  constructor(readonly page: Page) {
    this.ajouterAnneeButton = page.getByRole('button', {
      name: 'Ajouter une année',
    });
    this.editModal = page
      .getByRole('dialog')
      .filter({ hasText: 'Compléter le tableau' });
  }

  waitForUpsertValeurResponse() {
    return this.page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('indicateurs.valeurs.upsert') &&
        res.ok()
    );
  }

  async addResultat(annee: number, resultat: number) {
    await this.ajouterAnneeButton.click();
    await expect(this.editModal).toBeVisible();

    await this.editModal
      .getByLabel('Année *', { exact: true })
      .fill(String(annee));
    await this.editModal
      .getByLabel('Résultat', { exact: true })
      .fill(String(resultat));

    const response = this.waitForUpsertValeurResponse();
    await this.editModal
      .getByRole('button', { name: 'Valider', exact: true })
      .click();
    await response;
    await expect(this.editModal).toBeHidden();
  }
}
