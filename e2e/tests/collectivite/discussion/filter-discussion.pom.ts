import { Locator, Page } from '@playwright/test';

export type DiscussionStatus = 'all' | 'ouvert' | 'ferme';
export type DiscussionOrderBy = 'actionId' | 'createdAt' | 'createdBy';

export class FilterDiscussionPom {
  readonly page: Page;
  readonly statusSelect: Locator;
  readonly orderBySelect: Locator;

  constructor(page: Page) {
    this.page = page;
    const discussionPanel = page.locator(
      '[data-test="ActionDiscussionsPanel"]'
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
      .locator('button')
      .filter({ hasNotText: 'Commentaires ouverts' })
      .filter({ hasText: 'Ouvert' })
      .first()
      .click();
    await this.page
      .locator('button')
      .filter({ hasText: 'Fermé' })
      .first()
      .click();
  }

  async selectStatus(status: String) {
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
      .filter({ hasText: '1.1.1' })
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
