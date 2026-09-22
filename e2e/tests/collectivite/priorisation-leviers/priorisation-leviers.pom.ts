import { expect, Locator, Page } from '@playwright/test';
import { Levier } from '@tet/domain/shared';

export class PriorisationLeviersPom {
  readonly title: Locator;
  readonly levierNames: Locator;
  readonly missingMobilisationMessage: Locator;

  constructor(readonly page: Page) {
    this.title = page.getByRole('heading', {
      level: 1,
      name: 'Priorisation des leviers',
    });
    this.levierNames = page
      .getByRole('listitem')
      .getByRole('heading', { level: 2 });
    this.missingMobilisationMessage = page.getByText(
      "Aucune action de la collectivité n'est encore rattachée à un levier"
    );
  }

  levierCard(nom: Levier): Locator {
    return this.page.getByRole('listitem').filter({
      has: this.page.getByRole('heading', { level: 2, name: nom, exact: true }),
    });
  }

  async open(collectiviteId: number): Promise<void> {
    await this.page.goto(`/collectivite/${collectiviteId}/priorisation`);
  }

  async goto(collectiviteId: number): Promise<void> {
    await this.open(collectiviteId);
    await expect(this.title).toBeVisible();
  }
}
