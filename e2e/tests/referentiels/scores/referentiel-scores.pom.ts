import { expect, Locator, Page } from '@playwright/test';
import {
  ReferentielId,
  StatutAvancementIncludingNonConcerne,
} from '@tet/domain/referentiels';
import { roundTo } from '@tet/domain/utils';
import { DocumentsPom } from 'tests/collectivite/documents/documents.pom';

export class ReferentielScoresPom {
  readonly title: Locator;
  readonly documentsExpandButton: Locator;
  readonly documentsAddPreuveComplementaireButton: Locator;
  readonly documentsPom: DocumentsPom;

  readonly SELECT_STATUT_LOCATOR = '[data-test="SelectStatut"]';

  constructor(readonly page: Page) {
    this.documentsPom = new DocumentsPom(page);
    this.title = page.getByRole('heading', { name: 'Référentiel' });
    this.documentsExpandButton = page.getByRole('button', {
      name: 'Documents',
    });
    this.documentsAddPreuveComplementaireButton = page.locator(
      '[data-test="AddPreuveComplementaire"]'
    );
  }

  getPreuveReglementaireButtonLocator(preuveId: string) {
    return this.page.locator(
      `[data-test="AddPreuveReglementaire-${preuveId}"]`
    );
  }

  async goto(referentielId: ReferentielId) {
    await this.page.locator('[data-test="nav-edl"]').click();
    await this.page.locator(`[data-test="edl-${referentielId}"]`).click();
    await expect(this.title).toBeVisible();
  }

  async goToActionPage(axe: string, sousAxe: string | null, action: string) {
    await this.page.getByRole('button', { name: axe }).click();
    if (sousAxe) {
      await this.page.getByRole('button', { name: sousAxe }).click();
    }
    await this.page.getByRole('link', { name: action }).click();
    await expect(
      this.page.getByRole('heading', { name: action })
    ).toBeVisible();
  }

  getSousActionLocationExpression(sousActionIdentifiant: string) {
    return `[data-test="SousAction-${sousActionIdentifiant}"]`;
  }

  getTacheLocationExpression(tacheIdentifiant: string) {
    return `[data-test="Tache-${tacheIdentifiant}"]`;
  }

  getActionCommentaireLocator(actionId: string) {
    return this.page.locator(
      `[data-test="action-${actionId}-commentaire-editor"]`
    );
  }

  getSousActionAvancementSelectLocator(sousActionIdentifiant: string) {
    return this.page.locator(
      `${this.getSousActionLocationExpression(sousActionIdentifiant)} ${
        this.SELECT_STATUT_LOCATOR
      }`
    );
  }

  getTacheAvancementSelectLocator(tacheIdentifiant: string) {
    return this.page.locator(
      `${this.getTacheLocationExpression(tacheIdentifiant)} ${
        this.SELECT_STATUT_LOCATOR
      }`
    );
  }

  getSousActionExpandLocator(sousActionIdentifiant: string) {
    return this.page.locator(
      `[data-test="SousAction-${sousActionIdentifiant}-expand"]`
    );
  }

  getSousActionAvancementBadgeLocator(sousActionIdentifiant: string) {
    return this.page.locator(
      `${this.getSousActionLocationExpression(
        sousActionIdentifiant
      )} [data-test="Badge-ActionStatutBadge"]`
    );
  }

  async expectScoreRatio(
    referentielId: ReferentielId,
    actionIdentifiant: string,
    pointFait: number,
    pointPotentiel: number
  ) {
    await expect(
      this.page.locator(
        `[data-test="scoreRatio-${referentielId}_${actionIdentifiant}"]`
      )
    ).toContainText(
      `${roundTo(pointFait, 1)} / ${roundTo(pointPotentiel, 1)} points`
    );
  }

  async expandSousAction(sousActionIdentifiant: string) {
    await this.getSousActionExpandLocator(sousActionIdentifiant).click();
  }

  async updateSousActionAvancement(
    sousActionIdentifiant: string,
    avancement: StatutAvancementIncludingNonConcerne
  ) {
    await this.getSousActionAvancementSelectLocator(
      sousActionIdentifiant
    ).click();
    await this.page.locator(`[data-test="${avancement}"]`).click();
  }

  async updateTacheAvancement(
    tacheIdentifiant: string,
    avancement: StatutAvancementIncludingNonConcerne
  ) {
    await this.getTacheAvancementSelectLocator(tacheIdentifiant).click();
    await this.page.locator(`[data-test="${avancement}"]`).click();
  }
}
