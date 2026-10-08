import { expect, Locator, Page } from '@playwright/test';

/** Saisie des valeurs depuis la fiche d'un indicateur */
export class IndicateurValeursPom {
  readonly table: Locator;
  readonly ajouterAnneeButton: Locator;
  readonly editModal: Locator;

  constructor(readonly page: Page) {
    this.table = page.getByTestId('indicateurs.valeurs.table');
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

  cell(annee: number, source = 'collectivite') {
    return this.table.locator(
      `td[data-period="${annee}-01-01"][data-periodicite="annuelle"][data-source="${source}"]`
    );
  }

  valueButton(annee: number, type: 'Résultat' | 'Objectif') {
    return this.cell(annee).getByRole('button', {
      name: `${type} — ${annee}`,
      exact: true,
    });
  }

  deletePeriodeButton(annee: number) {
    return this.table.getByRole('button', {
      name: `Supprimer la période ${annee}`,
      exact: true,
    });
  }

  commentaireButton(annee: number, type: 'résultat' | 'objectif') {
    const label = type === 'résultat' ? 'du résultat' : 'de l’objectif';
    return this.cell(annee).getByRole('button', {
      name: `Commentaire ${label} — ${annee}`,
      exact: true,
    });
  }

  waitForDeleteValeurResponse() {
    return this.page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('indicateurs.valeurs.delete') &&
        res.ok()
    );
  }

  async editValeur(
    annee: number,
    type: 'Résultat' | 'Objectif',
    value: string
  ) {
    await this.valueButton(annee, type).click();
    const input = this.cell(annee).getByRole('textbox', {
      name: `${type} — ${annee}`,
      exact: true,
    });
    await input.fill(value);
    const response = this.waitForUpsertValeurResponse();
    await input.press('Enter');
    await response;
    await expect(input).toHaveCount(0);
  }

  async editCommentaire(
    annee: number,
    type: 'résultat' | 'objectif',
    value: string
  ) {
    await this.commentaireButton(annee, type).click();
    const modal = this.page.getByRole('dialog');
    await modal.getByRole('textbox').fill(value);
    const response = this.waitForUpsertValeurResponse();
    await modal.getByRole('button', { name: 'Valider', exact: true }).click();
    await response;
    await expect(modal).toBeHidden();
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
