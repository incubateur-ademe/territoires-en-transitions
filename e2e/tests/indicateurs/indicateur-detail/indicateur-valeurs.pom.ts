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

  async addResultat(annee: number, resultat: number) {
    const ajouterAnnee = this.table.getByRole('textbox', {
      name: 'Ajouter une année',
    });
    // A newly opened tab may still be loading the indicator data.
    await expect(ajouterAnnee.or(this.ajouterAnneeButton)).toBeVisible();
    if (await ajouterAnnee.isVisible()) {
      await this.addResultatFromTable(annee, resultat, ajouterAnnee);
      return;
    }
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

  private async addResultatFromTable(
    annee: number,
    resultat: number,
    ajouterAnnee: Locator
  ) {
    const resultatsTab = this.page.getByRole('button', {
      name: 'Résultats',
      exact: true,
    });
    if (await resultatsTab.count()) await resultatsTab.click();
    if (!(await this.table.getByText(String(annee), { exact: true }).count())) {
      await ajouterAnnee.fill(String(annee));
      await ajouterAnnee.press('Enter');
    }
    await expect(
      this.table.getByText(String(annee), { exact: true })
    ).toBeVisible();

    const combinedCell = this.table.locator(
      `td[data-period="${annee}"][data-source="collectivite"]`
    );
    if (await combinedCell.count()) {
      const add = combinedCell.getByTestId('indicateurs.valeurs.add');
      if (await add.count()) {
        await add.click();
        await this.page
          .getByRole('button', { name: 'Résultat', exact: true })
          .click();
      } else {
        await combinedCell
          .getByRole('button', { name: `Résultat — ${annee}`, exact: true })
          .click();
      }
      const input = combinedCell.getByRole('textbox', {
        name: `Résultat — ${annee}`,
        exact: true,
      });
      await input.fill(String(resultat));
      const response = this.waitForUpsertValeurResponse();
      await input.press('Enter');
      await response;
      await expect(input).toBeHidden();
      return;
    }

    // The original table saves inputs automatically; it keeps the two tabs.
    const column = await this.table
      .getByText(String(annee), { exact: true })
      .evaluate(
        (element) =>
          (element.closest('td, th') as HTMLTableCellElement).cellIndex
      );
    const input = this.table
      .getByRole('row')
      .nth(1)
      .getByRole('cell')
      .nth(column)
      .getByRole('textbox');
    const response = this.waitForUpsertValeurResponse();
    await input.fill(String(resultat));
    await response;
    await expect(input).toHaveValue(String(resultat));
  }
}
