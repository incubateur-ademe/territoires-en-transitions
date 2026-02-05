import { expect, Locator, Page } from '@playwright/test';
import {
  ReferentielId,
  StatutAvancementIncludingNonConcerne,
} from '@tet/domain/referentiels';
import { roundTo } from '@tet/domain/utils';

export class ReferentielScoresPom {
  readonly title: Locator;
  constructor(readonly page: Page) {
    this.title = page.getByRole('heading', { name: 'Référentiel' });
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

  getSousActionAvancementSelectLocator(sousActionIdentifiant: string) {
    return this.page.locator(
      `${this.getSousActionLocationExpression(
        sousActionIdentifiant
      )} [data-test="SelectStatut"]`
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

  async updateSousActionAvancement(
    sousActionIdentifiant: string,
    avancement: StatutAvancementIncludingNonConcerne
  ) {
    await this.getSousActionAvancementSelectLocator(
      sousActionIdentifiant
    ).click();
    await this.page.locator(`[data-test="${avancement}"]`).click();
  }
}
