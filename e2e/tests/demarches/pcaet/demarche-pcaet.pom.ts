import { expect, Locator, Page } from '@playwright/test';

export class DemarchePcaetPom {
  readonly createDemarcheButton: Locator;
  readonly dateLancementInput: Locator;
  readonly createPlanButton: Locator;
  readonly planTable: Locator;
  readonly linkPlanButton: Locator;
  readonly linkedPlanRow: Locator;

  constructor(readonly page: Page) {
    this.createDemarcheButton = page.getByRole('button', {
      name: 'Commencer le dépôt',
    });
    this.dateLancementInput = page.locator(
      '#create-demarche-pcaet-date-lancement'
    );
    this.createPlanButton = page.getByTestId('demarche-creer-plan-pcaet');
    this.planTable = page.getByTestId('demarche-plan-table');
    this.linkPlanButton = page.getByTestId('demarche-link-plan');
    this.linkedPlanRow = page.locator(
      '[data-test="demarche-plan-row"][data-linked="true"]'
    );
  }

  async goto(collectiviteId: number) {
    await this.page.goto(`/collectivite/${collectiviteId}/demarche-pcaet`);
  }

  async expectOnCreatePage(collectiviteId: number) {
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
    await this.page.getByTestId('demarche-etape-plan').click();
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
