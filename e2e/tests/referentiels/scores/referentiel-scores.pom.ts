import { expect, Locator, Page } from '@playwright/test';
import {
  ReferentielId,
  StatutAvancementCreate,
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
    const referentielLink = this.page.locator(
      `[data-test="edl-${referentielId}"]`
    );
    const referentielUrl = new RegExp(
      `/referentiel/${referentielId}(/|$|\\?)`
    );
    await expect(async () => {
      await this.page.locator('[data-test="nav-edl"]').click();
      await expect(referentielLink).toBeVisible({ timeout: 3000 });
      await referentielLink.click();
      await this.page.waitForURL(referentielUrl, { timeout: 10000 });
    }).toPass({ timeout: 30000 });
    await expect(this.title).toBeVisible({ timeout: 15000 });
  }

  async expandAxe(axeName: string) {
    await this.page.getByRole('button', { name: axeName }).click();
  }

  async expandAxeByIdentifiant(identifiant: string) {
    await this.page.getByTestId(`ExpandableAction-${identifiant}`).click();
  }

  async goToActionPage(
    axe: string,
    sousAxe: string | null,
    action: string,
    doNotExpandAxes?: boolean
  ) {
    if (!doNotExpandAxes) {
      await this.expandAxe(axe);
      if (sousAxe) {
        await this.expandAxe(sousAxe);
      }
    }
    await this.getActionCardLocator(action).click();
    await expect(
      this.page.getByRole('heading', { name: action })
    ).toBeVisible();
  }

  getActionCardLocator(actionText: string) {
    return this.page.getByRole('link', { name: actionText });
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

  getActionExplicationLocator(actionId: string) {
    return this.page.locator(
      `[data-test="action-${actionId}-commentaire-editor"]`
    );
  }

  async expectActionExplicationEditorVisible(actionId: string) {
    await expect(this.getActionExplicationLocator(actionId)).toBeVisible();
  }

  async fillActionExplication(actionId: string, text: string) {
    const contentEditable = this.getActionExplicationLocator(actionId);
    await contentEditable.click();
    await contentEditable.pressSequentially(text);
  }

  waitForUpdateCommentaireResponse() {
    return this.page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('referentiels.actions.updateCommentaire') &&
        res.ok()
    );
  }

  getMesureSuivanteLink() {
    return this.page.getByRole('link', { name: 'Mesure suivante' });
  }

  getMesurePrecedenteLink() {
    return this.page.getByRole('link', { name: 'Mesure précédente' });
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

  async updateSousActionAvancement(
    sousActionIdentifiant: string,
    avancement: StatutAvancementCreate
  ) {
    await this.getSousActionAvancementSelectLocator(
      sousActionIdentifiant
    ).click();
    await this.page.locator(`[data-test="${avancement}"]`).click();
  }

  async updateTacheAvancement(
    tacheIdentifiant: string,
    avancement: StatutAvancementCreate
  ) {
    await this.getTacheAvancementSelectLocator(tacheIdentifiant).click();
    await this.page.locator(`[data-test="${avancement}"]`).click();
  }

  getDetailleALaTacheModal() {
    return this.page.getByRole('dialog').filter({
      has: this.detaillerAvancementALaTacheModalTitle,
    });
  }

  getModalTacheAvancementSelectLocator(tacheIdentifiant: string) {
    return this.getDetailleALaTacheModal().locator(
      `${this.getTacheLocationExpression(tacheIdentifiant)} ${
        this.SELECT_STATUT_LOCATOR
      }`
    );
  }

  waitForUpdateStatutResponse() {
    return this.page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('referentiels.actions.updateStatut') &&
        res.ok()
    );
  }

  /**
   * Sélectionne « détaillé à la tâche » sur une sous-action et attend
   * l'ouverture de la modale (après réinitialisation du statut parent).
   */
  async openDetailleALaTacheModal(sousActionIdentifiant: string) {
    const updateStatutResponse = this.waitForUpdateStatutResponse();

    await this.getSousActionAvancementSelectLocator(
      sousActionIdentifiant
    ).click();
    await this.page.locator('[data-test="detaille_a_la_tache"]').click();

    await updateStatutResponse;
    await expect(this.detaillerAvancementALaTacheModalTitle).toBeVisible();
  }

  async updateTacheAvancementInDetailleALaTacheModal(
    tacheIdentifiant: string,
    avancement: StatutAvancementCreate
  ) {
    await this.getModalTacheAvancementSelectLocator(tacheIdentifiant).click();
    await this.page.locator(`[data-test="${avancement}"]`).click();
  }

  async closeDetailleALaTacheModal() {
    await this.getDetailleALaTacheModal()
      .getByRole('button', { name: 'Valider' })
      .click();
    await expect(this.detaillerAvancementALaTacheModalTitle).toBeHidden();
  }
}
