import { expect, Locator, Page } from '@playwright/test';
import { IndicateurPeriodes } from '@tet/domain/indicateurs';

/** Saisie des valeurs depuis la fiche d'un indicateur */
export class IndicateurValeursPom {
  readonly table: Locator;
  readonly ajouterAnneeInput: Locator;
  readonly scrollbar: Locator;

  constructor(readonly page: Page) {
    this.table = page.getByTestId('indicateurs.valeurs.table');
    this.ajouterAnneeInput = this.table.getByRole('textbox', {
      name: 'Ajouter une année',
    });
    this.scrollbar = page.getByRole('slider', {
      name: 'Défilement horizontal du tableau',
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

  cell(annee: number, source = 'collectivite') {
    const periode = IndicateurPeriodes.fromYear(annee);
    return this.table.locator(
      `td[data-periode="${periode.dateDebut}"][data-periodicite="${periode.periodicite}"][data-source="${source}"]`
    );
  }

  async expectPeriodeInView(annee: number) {
    const periode = IndicateurPeriodes.fromYear(annee);
    // Check geometry before any interaction can scroll the cell into view.
    // Playwright's toBeVisible also accepts cells hidden behind sticky columns.
    await expect
      .poll(() =>
        this.table.evaluate((viewport, dateDebut) => {
          const cell = viewport.querySelector(
            `td[data-periode="${dateDebut}"][data-source="collectivite"]`
          );
          if (!cell) return false;
          const bounds = viewport.getBoundingClientRect();
          const cellBounds = cell.getBoundingClientRect();
          const pinned = viewport.querySelector('[data-pinned="right"]');
          const visibleLeft = bounds.left + viewport.clientLeft;
          const visibleRight = pinned
            ? pinned.getBoundingClientRect().left
            : visibleLeft + viewport.clientWidth;
          return (
            cellBounds.left >= visibleLeft - 1 &&
            cellBounds.right <= visibleRight + 1
          );
        }, periode.dateDebut)
      )
      .toBe(true);
  }

  valueButton(annee: number, type: 'Résultat' | 'Objectif') {
    return this.cell(annee).getByRole('button', {
      name: `${type} — ${annee}`,
      exact: true,
    });
  }

  valueInput(annee: number, type: 'Résultat' | 'Objectif') {
    return this.cell(annee).getByRole('textbox', {
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

  commentaireButton(annee: number) {
    return this.table.getByRole('button', {
      name: `Commentaires — ${annee}`,
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
    const cell = this.cell(annee);
    await expect(cell).toBeVisible();
    const add = cell.getByTestId('indicateurs.valeurs.add');
    const addObjectif = cell.getByTestId('indicateurs.valeurs.objectif.add');
    if (await add.count()) {
      await add.click();
      await this.page.getByRole('button', { name: type, exact: true }).click();
    } else if (type === 'Objectif' && (await addObjectif.count())) {
      await addObjectif.click();
    } else {
      await this.valueButton(annee, type).click();
    }
    const input = this.valueInput(annee, type);
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
    await this.commentaireButton(annee).click();
    const modal = this.page.getByRole('dialog');
    await modal
      .getByRole('tab', {
        name: type === 'résultat' ? 'Résultats' : 'Objectifs',
        exact: true,
      })
      .click();
    await modal.getByRole('textbox').fill(value);
    const response = this.waitForUpsertValeurResponse();
    await modal.getByRole('button', { name: 'Valider', exact: true }).click();
    await response;
    await expect(modal).toBeHidden();
  }

  async addResultat(annee: number, resultat: number) {
    await expect(this.ajouterAnneeInput).toBeVisible();
    if (!(await this.cell(annee).count())) {
      await this.ajouterAnneeInput.fill(String(annee));
      await this.ajouterAnneeInput.press('Enter');
    }
    await this.editValeur(annee, 'Résultat', String(resultat));
  }
}
