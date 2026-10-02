import { expect, Page } from '@playwright/test';

export class IndicateurVuesPom {
  constructor(readonly page: Page) {}

  readonly search = this.page.getByPlaceholder(
    'Rechercher par nom ou description'
  );
  readonly filterButton = this.page.getByTestId('indicateurs.vues.filters');
  readonly openData = this.page.getByRole('checkbox', {
    name: 'Données Open Data',
  });
  readonly vueActions = this.page.getByTestId('indicateurs.vues.actions');
  readonly status = this.page.getByTestId('indicateurs.vues.status');
  readonly nameInput = this.page.getByRole('textbox', {
    name: 'Nom de la vue',
  });

  tab(nom: string) {
    return this.page.getByRole('tab', { name: nom, exact: true });
  }

  async goto(collectiviteId: number, vueId?: string) {
    const route = vueId ? `vue/${vueId}` : 'tous';
    await this.page.goto(
      `/collectivite/${collectiviteId}/indicateurs/liste/${route}?$g=false`
    );
    await expect(this.filterButton).toBeVisible();
  }

  async filterByText(text: string) {
    await this.search.fill(text);
    // Commit on blur so the active filters are reflected in the URL.
    await this.search.press('Tab');
  }

  async openFilters() {
    await this.filterButton.click();
    await expect(this.openData).toBeVisible();
  }

  async closeFilters() {
    await this.filterButton.click();
    await expect(this.openData).toBeHidden();
  }

  async openVueActions(nom?: string) {
    const tab = nom
      ? this.tab(nom)
      : this.page.getByRole('tab', { selected: true });
    await tab.locator('..').getByTestId('indicateurs.vues.actions').click();
    await expect(
      this.page.getByRole('button', { name: 'Modifier le titre', exact: true })
    ).toBeVisible();
  }

  async rename(nom: string) {
    await this.openVueActions();
    await this.page
      .getByRole('button', { name: 'Modifier le titre', exact: true })
      .click();
    await this.submitName(nom);
  }

  async openVueFilters() {
    await this.openVueActions();
    await this.page
      .getByRole('button', { name: 'Modifier les filtres', exact: true })
      .click();
    await expect(this.openData).toBeVisible();
  }

  async saveFilters() {
    await this.page.getByTestId('indicateurs.vues.save').click();
    await expect(this.openData).toBeHidden();
    await expect(this.nameInput).toBeVisible();
  }

  async cancelName() {
    await this.page.getByTestId('indicateurs.vues.cancel').click();
    await expect(this.nameInput).toBeHidden();
  }

  async submitName(nom: string) {
    const input = this.nameInput;
    await input.fill(nom);
    await this.page.getByTestId('indicateurs.vues.submit').click();
    await expect(input).toBeHidden();
    const tab = this.tab(nom);
    await expect(tab).toBeVisible();
    const href = await tab.getAttribute('href');
    await expect(this.page).toHaveURL((url) => url.pathname === href);
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  }
}
