import { expect, Locator, Page } from '@playwright/test';
import {
  ReferentielId,
  StatutAvancementIncludingNonConcerne,
  StatutAvancementIncludingNonConcerneDetailleALaTache,
} from '@tet/domain/referentiels';
import { roundTo } from '@tet/domain/utils';
import { DocumentsPom } from 'tests/collectivite/documents/documents.pom';

export class ReferentielScoresPom {
  readonly title: Locator;
  readonly documentsExpandButton: Locator;
  readonly documentsAddPreuveComplementaireButton: Locator;
  readonly documentsPom: DocumentsPom;
  readonly detaillerAvancementModalTitle: Locator;
  readonly detaillerAvancementALaTacheModalTitle: Locator;
  readonly detaillerAvancementSlider: Locator;
  readonly detaillerAvancementSliderMinValue: Locator;
  readonly detaillerAvancementSliderMaxValue: Locator;
  readonly detaillerAvancementEditButton: Locator;

  readonly SELECT_STATUT_LOCATOR = '[data-test="SelectStatut"]';

  constructor(readonly page: Page) {
    this.documentsPom = new DocumentsPom(page);
    this.title = page.getByRole('heading', { name: 'Référentiel' });
    this.documentsExpandButton = page
      .getByRole('toolbar', { name: 'Panneaux latéraux' })
      .getByRole('button', {
        name: 'Document',
      });
    this.documentsAddPreuveComplementaireButton = page.locator(
      '[data-test="AddPreuveComplementaire"]'
    );
    this.detaillerAvancementModalTitle = page.getByRole('heading', {
      name: "Détailler l'avancement au pourcentage",
    });
    this.detaillerAvancementALaTacheModalTitle = page.getByRole('heading', {
      name: "Détailler l'avancement à la tâche",
    });
    this.detaillerAvancementSlider = page.locator(
      '[data-test="AvancementDetailleSlider"]'
    );
    this.detaillerAvancementSliderMinValue = page.getByRole('slider', {
      name: 'Minimum',
    });
    this.detaillerAvancementSliderMaxValue = page.getByRole('slider', {
      name: 'Maximum',
    });
    this.detaillerAvancementEditButton = page.getByTestId(
      'DetaillerAvancementButton'
    );
  }

  private async setDetaillerAvancementSliderValue(
    percentage: number,
    thumb: Locator
  ) {
    const sliderBox = await this.detaillerAvancementSlider.boundingBox();
    if (!sliderBox) {
      throw new Error('Slider not found');
    }
    const thumbBox = await thumb.boundingBox();
    if (!thumbBox) {
      throw new Error('Slider min not found');
    }
    // We add 0.5 to the percentage to ensure the slider is moved to the correct position
    const targetX =
      sliderBox.x + sliderBox.width * (Math.min(percentage + 0.5, 100) / 100);

    await thumb.hover();
    await this.page.mouse.down();
    await this.page.mouse.move(targetX, thumbBox.y, { steps: 1 });
    await this.page.mouse.up();
  }

  async setDetaillerAvancementSliderMinValue(percentage: number) {
    await this.setDetaillerAvancementSliderValue(
      percentage,
      this.detaillerAvancementSliderMinValue
    );
    await expect(this.detaillerAvancementSlider).toContainText(
      `Fait ${percentage}%`
    );
  }

  async setDetaillerAvancementSliderMaxValue(percentage: number) {
    await this.setDetaillerAvancementSliderValue(
      percentage,
      this.detaillerAvancementSliderMaxValue
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
    await this.page.waitForURL(
      new RegExp(`/referentiel/${referentielId}(/|$|\\?)`)
    );
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

  getActionLocationExpression(actionIdentifiant: string) {
    return `[data-test="Action-${actionIdentifiant}"]`;
  }

  getActionPointsPotentielsLocator(actionIdentifiant: string) {
    return this.page.locator(
      `${this.getActionLocationExpression(
        actionIdentifiant
      )} [data-test="points-potentiels"]`
    );
  }

  getSousActionLocationExpression(sousActionIdentifiant: string) {
    return `[data-test="SousActionHeader-${sousActionIdentifiant}"]`;
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
    return this.page.getByRole('button', {
      name: `Déplier la sous-action ${sousActionIdentifiant}`,
    });
  }

  getSousActionAvancementBadgeLocator(sousActionIdentifiant: string) {
    return this.page.locator(
      `${this.getSousActionLocationExpression(
        sousActionIdentifiant
      )} [data-test="Badge-ActionStatutBadge"]`
    );
  }

  getScoreRatioLocator(
    referentielId: ReferentielId,
    actionIdentifiant: string
  ) {
    return this.page.locator(
      `[data-test="scoreRatio-${referentielId}_${actionIdentifiant}"]`
    );
  }

  async expectScoreRatio(
    referentielId: ReferentielId,
    actionIdentifiant: string,
    pointFait: number,
    pointPotentiel: number
  ) {
    await expect(
      this.getScoreRatioLocator(referentielId, actionIdentifiant)
    ).toContainText(
      `${roundTo(pointFait, 1)} / ${roundTo(pointPotentiel, 1)} points`
    );
  }

  async expectScoreRatioNonConcerne(
    referentielId: ReferentielId,
    actionIdentifiant: string
  ) {
    await expect(
      this.getScoreRatioLocator(referentielId, actionIdentifiant)
    ).toContainText(/\b0 point\b/i);
  }

  async expandSousAction(sousActionIdentifiant: string) {
    await this.getSousActionExpandLocator(sousActionIdentifiant).click();
  }

  /** Edit (pen) button to open détaillé modal, scoped to a sous-action row */
  getDetaillerAvancementEditButtonLocator(sousActionIdentifiant: string) {
    return this.page.locator(
      `${this.getSousActionLocationExpression(
        sousActionIdentifiant
      )} [data-test="DetaillerAvancementButton"]`
    );
  }

  async updateSousActionAvancement(
    sousActionIdentifiant: string,
    avancement: StatutAvancementIncludingNonConcerneDetailleALaTache
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
