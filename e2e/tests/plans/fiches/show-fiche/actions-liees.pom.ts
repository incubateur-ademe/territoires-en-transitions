import { expect, Locator, Page } from '@playwright/test';

export class ActionsLieesFichePom {
  readonly lierActionButton: Locator;
  readonly panel: Locator;

  constructor(readonly page: Page) {
    this.lierActionButton = page
      .getByRole('button', { name: 'Lier une action' })
      .first();
    this.panel = page.getByRole('complementary');
  }

  async goto(collectiviteId: number, ficheId: number) {
    await this.page.goto(
      `/collectivite/${collectiviteId}/actions/${ficheId}/actions-liees`
    );
  }

  async openPanel() {
    await this.lierActionButton.click();
    await expect(this.panel).toBeVisible();
  }

  panelCard(titre: string) {
    return this.panel.getByRole('article').filter({ hasText: titre });
  }

  async hoverCard(titre: string) {
    await this.panelCard(titre).hover();
  }

  lierButton(titre: string) {
    return this.panelCard(titre).getByTitle("Lier l'action");
  }

  dissocierButton(titre: string) {
    return this.panelCard(titre).getByTitle("Dissocier l'action");
  }
}
