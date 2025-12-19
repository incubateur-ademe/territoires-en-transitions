import { Locator, Page } from '@playwright/test';

export class FilterDiscussionsPom {
  readonly statusSelect: Locator;
  readonly orderBySelect: Locator;

  constructor(readonly page: Page) {
    this.page = page;
    const discussionPanel = page.locator(
      '[data-test="ActionCommentsSidePanelContent"]'
    );
    // The selects are within the panel - using more specific selectors
    this.orderBySelect = discussionPanel
      .locator('button')
      .filter({ hasText: 'Trier par mesure' });
    this.statusSelect = discussionPanel
      .locator('button')
      .filter({ hasText: 'Commentaires ouverts' });
  }

  async closeFirstComment() {
    await this.page
      .getByText('Troisième commentaire sur la mesure')
      .first()
      .hover();
    await this.page.getByRole('button', { name: 'Fermer' }).first().click();
  }

  async selectStatus(status: string) {
    await this.statusSelect.click();

    await this.page
      .locator('button')
      .filter({ hasText: status })
      .first()
      .click();
  }

  async selectOrderBy(orderBy: string) {
    await this.orderBySelect.click();
    await this.page
      .locator('button')
      .filter({ hasText: orderBy })
      .first()
      .click();
  }

  async filterAction(actionId: string) {
    await this.page
      .locator('button')
      .filter({ hasText: actionId.substring(0, 4) })
      .first()
      .click();
    await this.page
      .locator('button')
      .filter({ hasText: actionId })
      .first()
      .click();
  }

  async clickOnSubAction(actionId: string) {
    const subAction = this.page.locator(
      `[data-test="SousAction-${actionId}"] div`
    );
    subAction.locator('button').filter({ hasText: 'commentaires' }).click();
  }
}
