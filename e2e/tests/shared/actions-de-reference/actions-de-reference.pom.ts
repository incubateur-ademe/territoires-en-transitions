import { expect, Locator, Page, Route } from '@playwright/test';

const LIST_URL_PATTERN = /\/trpc\/shared\.actionsDeReference\.list/;
const UPDATE_URL_PATTERN = /\/trpc\/shared\.actionsDeReference\.update/;

type HeldListResponses = {
  readonly release: () => Promise<void>;
};

type CountedUpdateRequests = {
  readonly count: () => number;
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
  readonly leviersFilter: Locator;
  readonly updatePanel: Locator;
  readonly titreField: Locator;
  readonly descriptionField: Locator;
  readonly levierSelect: Locator;
  readonly categorieSelect: Locator;
  readonly saveButton: Locator;
  readonly closePanelButton: Locator;
  readonly titreFieldBlock: Locator;
  readonly descriptionFieldBlock: Locator;
  readonly discardChangesDialog: Locator;
  readonly discardChangesButton: Locator;
  readonly keepEditingButton: Locator;
  readonly indicateursListNavLink: Locator;

  constructor(readonly page: Page) {
    this.leviersFilter = page
      .getByRole('group', { name: 'Leviers' })
      .getByRole('button', { name: 'ouvrir le menu' });
    this.updatePanel = page.getByRole('complementary', {
      name: "Modifier l'action de référence",
    });
    this.titreField = this.updatePanel.getByRole('textbox').nth(0);
    this.descriptionField = this.updatePanel.getByRole('textbox').nth(1);
    this.levierSelect = this.updatePanel
      .getByRole('button', { name: 'ouvrir le menu' })
      .nth(0);
    this.categorieSelect = this.updatePanel
      .getByRole('button', { name: 'ouvrir le menu' })
      .nth(1);
    this.saveButton = this.updatePanel.getByRole('button', {
      name: 'Enregistrer',
    });
    this.closePanelButton = this.updatePanel.getByTitle('Fermer', {
      exact: true,
    });
    this.titreFieldBlock = this.fieldBlock('Titre');
    this.descriptionFieldBlock = this.fieldBlock('Description');
    this.discardChangesDialog = page.getByRole('dialog', {
      name: 'Modifications non enregistrées',
    });
    this.discardChangesButton = this.discardChangesDialog.getByRole('button', {
      name: 'Fermer sans enregistrer',
      exact: true,
    });
    this.keepEditingButton = this.discardChangesDialog.getByRole('button', {
      name: 'Poursuivre la modification',
      exact: true,
    });
    this.indicateursListNavLink = page.getByRole('link', {
      name: 'Indicateurs',
      exact: true,
    });
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

  private fieldBlock(fieldTitle: string): Locator {
    return this.updatePanel
      .locator('div')
      .filter({ has: this.page.getByText(fieldTitle, { exact: true }) })
      .filter({ has: this.page.getByRole('textbox') })
      .filter({ hasNot: this.page.getByRole('button') });
  }

  toast(message: string): Locator {
    return this.page.getByText(message, { exact: true });
  }

  updateButton(titre: string): Locator {
    return this.card(titre).getByRole('button', {
      name: `Modifier l'action « ${titre} »`,
    });
  }

  async openUpdatePanel(titre: string): Promise<void> {
    await this.updateButton(titre).click();
    await expect(this.updatePanel).toBeVisible();
  }

  async chooseOption({
    select,
    optionLabel,
  }: {
    readonly select: Locator;
    readonly optionLabel: string;
  }): Promise<void> {
    await select.click();
    await this.page
      .getByRole('button', { name: optionLabel, exact: true })
      .click();
    await expect(select).toContainText(optionLabel);
  }

  async chooseLevierFilter(levierLabel: string): Promise<void> {
    await this.leviersFilter.click();
    await this.page
      .getByRole('button', { name: levierLabel, exact: true })
      .click();
    await this.page.keyboard.press('Escape');
  }

  url(collectiviteId: number): string {
    return `/collectivite/${collectiviteId}/actions-reference`;
  }

  indicateursListUrl(collectiviteId: number): string {
    return `/collectivite/${collectiviteId}/indicateurs/liste`;
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

  async failUpdateResponses(): Promise<void> {
    await this.page.route(UPDATE_URL_PATTERN, (route) =>
      route.fulfill({ status: 500 })
    );
  }

  countUpdateRequests(): CountedUpdateRequests {
    let updateRequestCount = 0;
    this.page.on('request', (request) => {
      if (UPDATE_URL_PATTERN.test(request.url())) {
        updateRequestCount += 1;
      }
    });
    return { count: () => updateRequestCount };
  }

  async saveAndWaitForUpdateResponse(): Promise<void> {
    const updateResponse = this.page.waitForResponse(UPDATE_URL_PATTERN);
    await this.saveButton.click();
    await updateResponse;
  }

  async leaveThroughIndicateursNav(): Promise<void> {
    await this.indicateursNavEntry.click();
    await this.indicateursListNavLink.click();
  }
}
