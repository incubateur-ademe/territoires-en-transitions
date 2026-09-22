import { expect, Locator, Page } from '@playwright/test';

export class PriorisationLeviersPom {
  readonly title: Locator;
  readonly levierNames: Locator;

  constructor(readonly page: Page) {
    this.title = page.getByRole('heading', {
      level: 1,
      name: 'Priorisation des leviers',
    });
    this.levierNames = page
      .getByRole('listitem')
      .getByRole('heading', { level: 2 });
  }

  async open(collectiviteId: number): Promise<void> {
    await this.page.goto(`/collectivite/${collectiviteId}/priorisation`);
  }

  async goto(collectiviteId: number): Promise<void> {
    await this.open(collectiviteId);
    await expect(this.title).toBeVisible();
  }
}
