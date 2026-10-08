import { expect, Locator, Page } from '@playwright/test';

/** Saisie directe des valeurs depuis la fiche d'un indicateur. */
export class IndicateurValeursPom {
  readonly table: Locator;
  readonly ajouterAnneeInput: Locator;

  constructor(readonly page: Page) {
    this.table = page.getByTestId('indicateurs.valeurs.table');
    this.ajouterAnneeInput = this.table.getByRole('textbox', {
      name: 'Ajouter une année',
    });
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
    const cell = this.table.locator(
      `td[data-period="${annee}"][data-source="collectivite"]`
    );
    if ((await cell.count()) === 0) {
      await this.ajouterAnneeInput.fill(String(annee));
      await this.ajouterAnneeInput.press('Enter');
    }
    await expect(cell).toBeVisible();
    const add = cell.getByTestId('indicateurs.valeurs.add');
    if (await add.count()) {
      await add.click();
      await this.page
        .getByRole('button', { name: 'Résultat', exact: true })
        .click();
    } else {
      await cell
        .getByRole('button', { name: `Résultat — ${annee}`, exact: true })
        .click();
    }
    const input = cell.getByRole('textbox', {
      name: `Résultat — ${annee}`,
      exact: true,
    });
    await input.fill(String(resultat));
    const response = this.waitForUpsertValeurResponse();
    await input.press('Enter');
    await response;
    await expect(input).toBeHidden();
  }
}
