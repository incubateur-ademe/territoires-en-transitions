import { expect, Locator, Page, Route } from '@playwright/test';

const LIST_URL_PATTERN = /\/trpc\/shared\.actionsDeReference\.list/;

type HeldListResponses = {
  readonly release: () => Promise<void>;
};

export class ActionsDeReferencePom {
  readonly title: Locator;
  readonly cards: Locator;
  readonly loadingStatus: Locator;
  readonly errorTitle: Locator;
  readonly retryButton: Locator;
  readonly emptyStateMessage: Locator;
  readonly resetFiltersButton: Locator;
  readonly updateButtons: Locator;
  readonly navEntry: Locator;
  readonly indicateursNavEntry: Locator;

  constructor(readonly page: Page) {
    this.title = page.getByRole('heading', {
      level: 1,
      name: 'Actions de référence',
      exact: true,
    });
    this.cards = page
      .getByRole('listitem')
      .filter({ has: page.getByRole('heading', { level: 2 }) });
    this.loadingStatus = page
      .getByRole('status')
      .filter({ hasText: 'Chargement en cours...' });
    this.errorTitle = page.getByRole('heading', {
      name: 'Une erreur est survenue',
    });
    this.retryButton = page.getByRole('button', {
      name: 'Réessayer',
      exact: true,
    });
    this.emptyStateMessage = page.getByText(
      'Aucune action de référence ne correspond à votre recherche'
    );
    this.resetFiltersButton = page.getByRole('button', {
      name: 'Effacer les filtres',
      exact: true,
    });
    this.updateButtons = page.getByRole('button', {
      name: /^Modifier l'action/,
    });
    this.navEntry = page.getByRole('link', {
      name: 'Actions de référence',
      exact: true,
    });
    this.indicateursNavEntry = page.getByRole('button', {
      name: /^Indicateurs/,
    });
  }

  card(titre: string): Locator {
    return this.page.getByRole('listitem').filter({
      has: this.page.getByRole('heading', {
        level: 2,
        name: titre,
        exact: true,
      }),
    });
  }

  url(collectiviteId: number): string {
    return `/collectivite/${collectiviteId}/actions-reference`;
  }

  dashboardUrl(collectiviteId: number): string {
    return `/collectivite/${collectiviteId}/tableau-de-bord`;
  }

  async open(collectiviteId: number): Promise<void> {
    await this.page.goto(this.url(collectiviteId));
  }

  async openAndWaitForTitle(collectiviteId: number): Promise<void> {
    await this.open(collectiviteId);
    await expect(this.title).toBeVisible();
  }

  async holdListResponses(): Promise<HeldListResponses> {
    const heldRoutes: Route[] = [];
    let isReleased = false;
    await this.page.route(LIST_URL_PATTERN, async (route) => {
      if (isReleased) {
        await route.continue();
        return;
      }
      heldRoutes.push(route);
    });
    return {
      release: async () => {
        isReleased = true;
        await Promise.all(heldRoutes.map((route) => route.continue()));
        await this.page.unroute(LIST_URL_PATTERN);
      },
    };
  }

  async failListResponses(): Promise<void> {
    await this.page.route(LIST_URL_PATTERN, (route) =>
      route.fulfill({ status: 500 })
    );
  }

  async stopFailingListResponses(): Promise<void> {
    await this.page.unroute(LIST_URL_PATTERN);
  }
}
