import { expect, Locator, Page } from '@playwright/test';

export class DemarchePcaetPom {
  readonly startDepotButton: Locator;
  readonly createDemarcheButton: Locator;
  readonly dateLancementInput: Locator;
  readonly createPlanButton: Locator;
  readonly planTable: Locator;
  readonly linkPlanButton: Locator;
  readonly linkedPlanRow: Locator;

  constructor(readonly page: Page) {
    this.startDepotButton = page.getByRole('button', {
      name: 'Commencer un dépôt',
    });
    this.createDemarcheButton = page.getByRole('button', {
      name: 'Commencer le dépôt',
    });
    this.dateLancementInput = page.locator(
      '#create-demarche-pcaet-date-lancement'
    );
    this.createPlanButton = page.getByTestId('demarches.plan.creer-pcaet-button');
    this.planTable = page.getByTestId('demarches.plan.table');
    this.linkPlanButton = page.getByTestId('demarches.plan.link-button');
    this.linkedPlanRow = page.locator(
      '[data-test="demarches.plan.row"][data-linked="true"]'
    );
  }

  async goto(collectiviteId: number) {
    await this.page.goto(`/collectivite/${collectiviteId}/demarche-pcaet`);
  }

  /**
   * La page d'entrée est la liste des démarches (pas de redirection
   * automatique) : la création passe par son bouton « Commencer un dépôt ».
   */
  async gotoCreatePage(collectiviteId: number) {
    await this.goto(collectiviteId);
    await this.startDepotButton.click();
    await expect(this.page).toHaveURL(
      `/collectivite/${collectiviteId}/demarche-pcaet/nouveau`
    );
  }

  async createDemarche(collectiviteId: number) {
    await this.dateLancementInput.fill('2026-01-15');
    await this.createDemarcheButton.click();
    await this.expectOnDetailPage(collectiviteId);
  }

  async expectOnDetailPage(collectiviteId: number) {
    await expect(this.page).toHaveURL(
      new RegExp(`/collectivite/${collectiviteId}/demarche-pcaet/\\d+`)
    );
  }

  /**
   * The plan step lives in the avance side panel (often already open after
   * create). Hard navigation also works now that the demarche is persisted
   * server-side, but going through the panel exercises the real user path.
   */
  async gotoPlanActions() {
    const panelButton = this.page.getByTestId(
      'demarches.pcaet.avance-side-panel-button'
    );
    if ((await panelButton.getAttribute('aria-pressed')) !== 'true') {
      await panelButton.click();
    }
    await this.page.getByTestId('demarches.avance.etape-plan').click();
    await expect(this.page).toHaveURL(/\/plan\/?$/);
  }

  async expectCreatePlanCta(collectiviteId: number) {
    await this.gotoPlanActions();
    await expect(this.createPlanButton).toBeVisible();
    await expect(this.createPlanButton).toHaveAttribute(
      'href',
      `/collectivite/${collectiviteId}/plans/creer`
    );
  }

  async expectPlanLinkingUi() {
    await this.gotoPlanActions();
    await expect(this.planTable).toBeVisible();
    await expect(this.linkPlanButton).toBeVisible();
  }

  async linkSelectedPlan() {
    await this.linkPlanButton.click();
  }

  async expectLinkedPlanHeader(planName: string) {
    await expect(this.linkedPlanRow).toBeVisible();
    await expect(this.linkedPlanRow).toContainText(planName);
  }
}
