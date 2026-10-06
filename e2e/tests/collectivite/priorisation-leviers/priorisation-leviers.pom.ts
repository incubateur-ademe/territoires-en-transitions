import { expect, Locator, Page } from '@playwright/test';
import { Pertinence } from '@tet/domain/collectivites';
import { CategorieAction, Levier, LevierId } from '@tet/domain/shared';

type PertinenceToggleLabel = 'Marquer non pertinent' | 'Marquer pertinent';

type CategorieLabel =
  | 'Aménagement & infrastructures'
  | 'Réglementation & planification'
  | 'Financement & fiscalité'
  | 'Gouvernance & partenariats'
  | 'Exemplarité interne'
  | 'Sensibilisation & accompagnement';

type PertinenceTrafficEvent = 'upsert-response' | 'list-request';

const UPSERT_URL_PATTERN = /collectivites\.pertinenceLeviers\.upsert/;

export class PriorisationLeviersPom {
  readonly title: Locator;
  readonly levierButtons: Locator;
  readonly missingMobilisationMessage: Locator;
  readonly pertinenceToggles: Locator;
  readonly saveErrorToast: Locator;

  constructor(readonly page: Page) {
    this.title = page.getByRole('heading', {
      level: 1,
      name: 'Priorisation des leviers',
    });
    const leviersInMatrix = page
      .getByRole('figure')
      .getByRole('listitem')
      .getByRole('button');
    const leviersOutsideMatrix = page
      .getByRole('region', { name: /leviers? hors matrice/ })
      .getByRole('listitem')
      .getByRole('button');
    this.levierButtons = leviersInMatrix.or(leviersOutsideMatrix);
    this.missingMobilisationMessage = page.getByText(
      "Aucune action de la collectivité n'est encore rattachée à un levier"
    );
    this.pertinenceToggles = page.getByRole('group', {
      name: /^Pertinence du levier /,
    });
    this.saveErrorToast = page.getByText("Erreur lors de l'enregistrement");
  }

  levierPanel(nom: Levier): Locator {
    return this.page.getByRole('complementary', { name: nom, exact: true });
  }

  metricCount(label: RegExp): Locator {
    return this.page
      .getByText(label)
      .locator('xpath=preceding-sibling::span[1]');
  }

  get actionsRattacheesCount(): Locator {
    return this.metricCount(
      /^actions? de la collectivité rattachées? à un levier$/
    );
  }

  get missingPotentielsMessage(): Locator {
    return this.page.getByText(
      /potentiel de réduction de GES par levier n'est disponible/
    );
  }

  get sousLeviersTab(): Locator {
    return this.page.getByRole('tab', { name: 'Sous-leviers à prioriser' });
  }

  get sousLeviersCaption(): Locator {
    return this.page.getByText(
      /^Sous-leviers \(levier × catégorie d'action\) par potentiel/
    );
  }

  get chartDataToggle(): Locator {
    return this.page.getByText('Voir les données du graphique');
  }

  get chartDataTable(): Locator {
    return this.page.getByRole('figure').getByRole('table');
  }

  actionSearch(nom: Levier): Locator {
    return this.levierPanel(nom).getByRole('searchbox', {
      name: 'Rechercher une action par titre ou description',
    });
  }

  actionsTrouveesCount(nom: Levier): Locator {
    return this.levierPanel(nom)
      .getByRole('status')
      .filter({ hasText: /actions? de référence trouvées?$/ });
  }

  categorieHeading(nom: Levier, categorie: CategorieLabel): Locator {
    return this.levierPanel(nom).getByRole('heading', {
      level: 3,
      name: categorie,
      exact: true,
    });
  }

  actionCardInPanel(nom: Levier, titre: string): Locator {
    return this.levierPanel(nom)
      .getByRole('listitem')
      .filter({
        has: this.page.getByRole('heading', { level: 4, name: titre }),
      });
  }

  noActionMessage(nom: Levier): Locator {
    return this.levierPanel(nom).getByText(
      "Nous n'avons pas de recommandation sur ce levier."
    );
  }

  noMatchingActionMessage(nom: Levier): Locator {
    return this.levierPanel(nom).getByText(
      'Aucune action de référence ne correspond à votre recherche'
    );
  }

  ignoredActionsAccordion(nom: Levier): Locator {
    return this.levierPanel(nom).getByRole('button', {
      name: /actions? marquées? « Pas intéressé »/,
    });
  }

  get preselectionLink(): Locator {
    return this.page.getByRole('link', {
      name: /^Actions pré-sélectionnées \(\d+\)$/,
    });
  }

  get preselectionTitle(): Locator {
    return this.page.getByRole('heading', {
      level: 1,
      name: 'Actions pré-sélectionnées',
    });
  }

  get fonctionnementButton(): Locator {
    return this.page.getByRole('button', { name: 'Comment ça marche ?' });
  }

  get fonctionnementModal(): Locator {
    return this.page.getByRole('dialog', { name: 'Comment ça marche ?' });
  }

  async openPreselection(): Promise<void> {
    await this.preselectionLink.click();
    await expect(this.preselectionTitle).toBeVisible();
  }

  async backToPriorisation(): Promise<void> {
    await this.page
      .getByRole('link', { name: 'Priorisation des leviers' })
      .click();
    await expect(this.title).toBeVisible();
  }

  get emptyPreselectionMessage(): Locator {
    return this.page.getByText(
      "Aucune action dans la présélection pour l'instant"
    );
  }

  get preselectedCards(): Locator {
    return this.page.getByRole('listitem').filter({
      has: this.page.getByRole('heading', { level: 4 }),
    });
  }

  preselectedCard(titre: string): Locator {
    return this.preselectedCards.filter({
      has: this.page.getByRole('heading', { level: 4, name: titre }),
    });
  }

  async chooseFilter(
    group: 'Tous les leviers' | 'Toutes les catégories',
    optionValue: LevierId | CategorieAction
  ): Promise<void> {
    await this.page
      .getByRole('group', { name: group })
      .getByRole('button', { name: 'ouvrir le menu' })
      .click();
    await this.page.getByTestId(optionValue).click();
  }

  addToPlanButton(titre: string): Locator {
    return this.preselectedCard(titre).getByRole('button', {
      name: /^Ajouter à « /,
    });
  }

  otherPlansButton(titre: string): Locator {
    return this.preselectedCard(titre).getByRole('button', {
      name: 'Autres actions',
    });
  }

  planMenuEntry(planNom: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${planNom}`) });
  }

  addedToPlanStatus(titre: string, planNom: string): Locator {
    return this.preselectedCard(titre).getByText(`Ajouté à « ${planNom} »`);
  }

  undoAddToPlanButton(titre: string): Locator {
    return this.preselectedCard(titre).getByRole('button', {
      name: 'Annuler',
    });
  }

  waitForFicheCreated(): Promise<unknown> {
    return this.page.waitForResponse(
      (response) =>
        response.url().includes('plans.fiches.create') && response.ok()
    );
  }

  waitForFicheDeleted(): Promise<unknown> {
    return this.page.waitForResponse(
      (response) =>
        response.url().includes('plans.fiches.delete') && response.ok()
    );
  }

  async openLevier(nom: Levier): Promise<void> {
    await this.levierButtons
      .filter({ has: this.page.getByText(nom, { exact: true }) })
      .first()
      .click();
    await expect(this.levierPanel(nom)).toBeVisible();
  }

  pertinenceToggle(nom: Levier): Locator {
    return this.levierPanel(nom).getByRole('group', {
      name: `Pertinence du levier ${nom}`,
      exact: true,
    });
  }

  pertinenceButton(nom: Levier, action: PertinenceToggleLabel): Locator {
    return this.pertinenceToggle(nom).getByRole('button', {
      name: action,
      exact: true,
    });
  }

  async waitForPertinenceSaved({
    levierId,
    pertinence,
  }: {
    levierId: LevierId;
    pertinence: Pertinence;
  }): Promise<void> {
    const upsertResponse = await this.page.waitForResponse((response) => {
      const payload = response.request().postData() ?? '';
      return (
        response.url().includes('collectivites.pertinenceLeviers.upsert') &&
        payload.includes(`"${levierId}"`) &&
        payload.includes(`"${pertinence}"`) &&
        !payload.includes('"categorie"')
      );
    });
    expect(upsertResponse.ok()).toBe(true);
  }

  waitForPertinencesReloaded(): Promise<unknown> {
    return this.page.waitForResponse((response) =>
      response.url().includes('collectivites.pertinenceLeviers.list')
    );
  }

  async delayPertinenceSave({
    saveIndex,
    delayMs,
  }: {
    saveIndex: number;
    delayMs: number;
  }): Promise<void> {
    let saveCount = 0;
    await this.page.route(UPSERT_URL_PATTERN, async (route) => {
      const isSaveToDelay = saveCount === saveIndex;
      saveCount += 1;
      if (isSaveToDelay) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      await route.continue();
    });
  }

  async failEveryPertinenceSave(): Promise<void> {
    await this.page.route(UPSERT_URL_PATTERN, (route) =>
      route.fulfill({ status: 500 })
    );
  }

  recordPertinenceTraffic(): PertinenceTrafficEvent[] {
    const events: PertinenceTrafficEvent[] = [];
    this.page.on('request', (request) => {
      if (request.url().includes('collectivites.pertinenceLeviers.list')) {
        events.push('list-request');
      }
    });
    this.page.on('response', (response) => {
      if (response.url().includes('collectivites.pertinenceLeviers.upsert')) {
        events.push('upsert-response');
      }
    });
    return events;
  }

  async open(collectiviteId: number): Promise<void> {
    await this.page.goto(`/collectivite/${collectiviteId}/priorisation`);
  }

  async goto(collectiviteId: number): Promise<void> {
    await this.open(collectiviteId);
    await expect(this.title).toBeVisible();
  }
}
