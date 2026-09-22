import { expect, Locator, Page } from '@playwright/test';
import { Pertinence } from '@tet/domain/collectivites';
import { Levier, LevierId } from '@tet/domain/shared';

type PertinenceLabel = 'Non pertinent' | "À discuter avec l'élu" | 'Pertinent';

type PertinenceTrafficEvent = 'upsert-response' | 'list-request';

const UPSERT_URL_PATTERN = /collectivites\.pertinenceLeviers\.upsert/;

export class PriorisationLeviersPom {
  readonly title: Locator;
  readonly levierNames: Locator;
  readonly missingMobilisationMessage: Locator;
  readonly pertinenceSelectors: Locator;
  readonly saveErrorToast: Locator;

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
    this.pertinenceSelectors = page.getByRole('group', {
      name: /^Pertinence du levier /,
    });
    this.saveErrorToast = page.getByText("Erreur lors de l'enregistrement");
  }

  levierCard(nom: Levier): Locator {
    return this.page.getByRole('listitem').filter({
      has: this.page.getByRole('heading', { level: 2, name: nom, exact: true }),
    });
  }

  pertinenceSelector(nom: Levier): Locator {
    return this.page.getByRole('group', {
      name: `Pertinence du levier ${nom}`,
      exact: true,
    });
  }

  pertinenceButton(nom: Levier, pertinence: PertinenceLabel): Locator {
    return this.pertinenceSelector(nom).getByRole('button', {
      name: pertinence,
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
        payload.includes(`"${pertinence}"`)
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
