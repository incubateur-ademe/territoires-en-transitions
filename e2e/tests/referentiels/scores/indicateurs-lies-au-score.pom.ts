import { expect, Locator, Page } from '@playwright/test';

/**
 * Indicateurs liés au score d'une sous-mesure (référentiel TE) et modale de
 * sélection du résultat utilisé pour calculer le score.
 */
export class IndicateursLiesAuScorePom {
  readonly modal: Locator;
  readonly resultatsTab: Locator;
  readonly descriptionTab: Locator;
  readonly methodeCalculTab: Locator;
  readonly resultatsTable: Locator;
  readonly nonSuiviCheckbox: Locator;
  readonly aucunResultatMessage: Locator;
  readonly selectionnerResultatMessage: Locator;

  constructor(readonly page: Page) {
    this.modal = page.getByRole('dialog');
    this.resultatsTab = this.modal.getByRole('tab', { name: 'Résultats' });
    this.descriptionTab = this.modal.getByRole('tab', { name: 'Description' });
    this.methodeCalculTab = this.modal.getByRole('tab', {
      name: 'Méthode de calcul',
    });
    this.resultatsTable = this.modal.getByRole('table');
    this.nonSuiviCheckbox = this.modal.getByRole('checkbox', {
      name: 'Je valide que ma collectivité ne suit pas cet indicateur',
    });
    this.aucunResultatMessage = this.modal.getByText(
      "Aucun résultat n'a encore été renseigné pour cet indicateur."
    );
    this.selectionnerResultatMessage = this.modal.getByText(
      'Sélectionnez un résultat ci-dessous pour activer le calcul du score lié à cet indicateur.'
    );
  }

  /** Carte de la sous-mesure (contient la liste des indicateurs liés au score) */
  getSousActionCard(referentielActionId: string) {
    return this.page.locator(`[id="${referentielActionId}"]`);
  }

  getList(sousActionIdentifiant: string) {
    return this.page.getByTestId(
      `referentiels.indicateurs-score.list-${sousActionIdentifiant}`
    );
  }

  /** Carte d'un indicateur, identifiée par l'action qui porte la formule de score */
  getCarte(actionIdentifiant: string) {
    return this.page.getByTestId(
      `referentiels.indicateurs-score.carte-${actionIdentifiant}`
    );
  }

  async openModal(actionIdentifiant: string) {
    await this.getCarte(actionIdentifiant).click();
    await expect(this.modal).toBeVisible();
  }

  async closeModal() {
    await this.modal.getByRole('button', { name: 'Fermer' }).click();
    await expect(this.modal).toBeHidden();
  }

  getFooterLink(name: string) {
    return this.modal.getByRole('link', { name });
  }

  /** Ligne du tableau des résultats contenant tous les textes donnés */
  getResultatRow(...texts: string[]) {
    return texts.reduce(
      (row, text) => row.filter({ hasText: text }),
      this.resultatsTable.locator('tbody').getByRole('row')
    );
  }

  getSourceSelectionneeMessage(source: string, annee: number) {
    return this.modal.getByText(`Source : ${source} (${annee})`);
  }

  waitForSetScoreFromIndicateurResponse() {
    return this.page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('referentiels.actions.setScoreFromIndicateur') &&
        res.ok()
    );
  }

  waitForSetIndicateurSuiviResponse() {
    return this.page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('referentiels.actions.setIndicateurSuivi') &&
        res.ok()
    );
  }

  /** Clique sur une ligne de résultat et attend le recalcul du score */
  async clickResultatRow(row: Locator) {
    const response = this.waitForSetScoreFromIndicateurResponse();
    await row.click();
    await response;
  }

  /** Coche ou décoche « non suivi » et attend l'enregistrement du flag */
  async clickNonSuiviCheckbox() {
    const response = this.waitForSetIndicateurSuiviResponse();
    await this.nonSuiviCheckbox.click();
    await response;
  }
}
