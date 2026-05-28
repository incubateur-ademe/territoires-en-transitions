import { expect, Locator, Page } from '@playwright/test';

export class DemarchePcaetPom {
  readonly createDemarcheButton: Locator;
  readonly createPlanButton: Locator;
  readonly planSelect: Locator;
  readonly linkPlanButton: Locator;
  readonly planHeader: Locator;

  constructor(readonly page: Page) {
    this.createDemarcheButton = page.getByRole('button', {
      name: 'Créer la démarche',
    });
    this.createPlanButton = page.getByTestId('demarche-creer-plan-pcaet');
    this.planSelect = page.getByTestId('demarche-plan-select');
    this.linkPlanButton = page.getByTestId('demarche-link-plan');
    this.planHeader = page.getByTestId('demarche-plan-header');
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
    await this.createDemarcheButton.click();
    await this.expectOnDetailPage(collectiviteId);
  }

  async expectOnDetailPage(collectiviteId: number) {
    await expect(this.page).toHaveURL(
      new RegExp(`/collectivite/${collectiviteId}/demarche-pcaet/.+`)
    );
  }

  async expectCreatePlanCta(collectiviteId: number) {
    await expect(this.createPlanButton).toBeVisible();
    await expect(this.createPlanButton).toHaveAttribute(
      'href',
      `/collectivite/${collectiviteId}/plans/creer`
    );
  }

  async expectPlanLinkingUi() {
    await expect(this.planSelect).toBeVisible();
    await expect(this.linkPlanButton).toBeVisible();
  }

  async linkSelectedPlan() {
    await this.linkPlanButton.click();
  }

  async expectLinkedPlanHeader(planName: string) {
    await expect(this.planHeader).toBeVisible();
    await expect(this.planHeader).toContainText(planName);
  }
}

