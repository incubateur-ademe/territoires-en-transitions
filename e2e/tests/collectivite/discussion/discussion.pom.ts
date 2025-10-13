import { expect, Locator, Page } from '@playwright/test';

export class DiscussionPom {
  readonly page: Page;
  readonly discussionPanel: Locator;
  readonly discussionButton: Locator;
  readonly commentItem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.discussionPanel = page.locator('[data-test="ActionDiscussionsPanel"]');
    this.discussionButton = page.locator(
      '[data-test="ActionDiscussionsButton"]'
    );
    this.commentItem = this.discussionPanel.getByText("aujourd'hui");
  }

  async goto(collectiviteId: number, referentielId: string, actionId: string) {
    await this.page.goto(
      `/collectivite/${collectiviteId}/referentiel/${referentielId}/action/${actionId}`
    );
    await this.openDiscussionPanel();
  }

  async openDiscussionPanel() {
    await this.discussionButton.click();
    await expect(this.discussionPanel).toBeVisible();
  }

  async expectDiscussionPanelVisible() {
    await expect(this.discussionPanel).toBeVisible();
  }

  async expectedDiscussionCount(count: number) {
    await expect(this.commentItem).toHaveCount(count);
  }
}
