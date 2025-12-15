import { expect, Locator, Page } from '@playwright/test';
export class ListFichesPom {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly fichesCarte: Locator;
  readonly noFicheHeading: Locator;
  readonly filterButton: Locator;
  readonly title: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByRole('searchbox', {
      name: 'Rechercher par nom ou',
    });
    this.fichesCarte = page.locator('[data-test="FicheActionCarte"]');
    this.noFicheHeading = page.getByRole('heading', {
      name: 'Aucune action ne',
    });
    this.title = page.getByRole('heading', { name: 'Toutes les actions' });

    this.filterButton = page.getByRole('button', { name: 'Filtrer' });
  }

  async goto() {
    await this.page.locator('[data-test="nav-pa"]').click();
    await this.page.locator('[data-test="pa-fa-toutes"]').click();
    await expect(this.title).toBeVisible();
  }

  async search(search: string) {
    await this.searchInput.fill(search);
  }

  async openFilter() {
    await this.filterButton.click();
  }

  async expectFichesCount(count: number) {
    await expect(this.fichesCarte).toHaveCount(count);
  }
}
