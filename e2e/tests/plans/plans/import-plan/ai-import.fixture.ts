import { expect, Page } from '@playwright/test';
import type { RouterOutput } from '@tet/api';

type ImportStatus = RouterOutput['plans']['aiImport']['getAiImportStatus'];
type ImportCapabilities =
  RouterOutput['plans']['aiImport']['getAiImportCapabilities'];

export const importStatus: ImportStatus = {
  jobId: 'e7c7e95e-1785-4aab-a498-40323e452247',
  planName: 'Plan de test',
  profile: 'generic',
  createdAt: '2026-01-01T10:00:00Z',
  finishedAt: null,
  status: 'running',
  createdPlanId: null,
  resumable: false,
  withSecteurs: false,
  error: null,
  qualitativeReview: null,
  stepStates: {
    reading: 'ok',
    scouting: 'pending',
    extraction: 'pending',
    hierarchy: 'pending',
    scoring: 'pending',
    consolidation: 'pending',
    enrichment: 'pending',
    secteurs: 'pending',
    qualitativeReview: 'pending',
  },
  report: { issues: [], qualitativeReview: null },
};

/** Toutes les écritures IA sont interceptées : aucun job ni appel au modèle. */
export class AiImportFixture {
  status = structuredClone(importStatus);
  capabilities: ImportCapabilities = {
    profiles: [
      { profile: 'generic', available: true },
      { profile: 'pcaet', available: true },
      { profile: 'annexe-3-electrification', available: false },
    ],
  };
  current: ImportStatus | null = null;
  recent: ImportStatus[] = [];
  cursors: Array<string | undefined> = [];
  queriedPlanIds: number[] = [];
  resumeCalls = 0;
  enqueueCalls = 0;
  enqueuedForms: FormData[] = [];
  statusCalls = 0;
  statusNotFound = false;

  async install(page: Page) {
    // Le mode dev/CI active tous les flags. Reproduire le parcours hors flag ;
    // les utilisateurs support gardent leur accès via le mode super-admin.
    await page.addInitScript(() => {
      let publicEnv: Record<string, string>;
      Object.defineProperty(window, '__TET_PUBLIC_ENV__', {
        get: () => publicEnv,
        set: (value: Record<string, string>) => {
          publicEnv = { ...value, ENV_NAME: 'test' };
        },
      });
    });
    await page.route('**/collectivites/*/plans/import-ia', async (route) => {
      this.enqueueCalls++;
      const request = route.request();
      const multipartBody = new Response(request.postData(), {
        headers: { 'content-type': request.headers()['content-type'] },
      });
      this.enqueuedForms.push(await multipartBody.formData());
      this.current = this.status;
      await route.fulfill({
        status: 201,
        json: {
          profile: this.status.profile,
          jobId: this.status.jobId,
          planId: this.status.createdPlanId,
        },
      });
    });
    await page.route('**/trpc/plans.aiImport.*', async (route) => {
      const url = new URL(route.request().url());
      const procedure = url.pathname.split('.').at(-1);
      let data: unknown;
      switch (procedure) {
        case 'getAiImportCapabilities':
          data = this.capabilities;
          break;
        case 'getCurrentAiImport':
          data = this.current;
          break;
        case 'getAiImportStatus':
          this.statusCalls++;
          if (this.statusNotFound) {
            await route.fulfill({
              status: 404,
              json: {
                error: {
                  message: 'Import introuvable',
                  code: -32004,
                  data: { code: 'NOT_FOUND', httpStatus: 404 },
                },
              },
            });
            return;
          }
          data = this.status;
          break;
        case 'findPreviousAiImport':
          data = null;
          break;
        case 'listRecentAiImports': {
          const input = JSON.parse(url.searchParams.get('input') ?? '{}');
          this.cursors.push(input.cursor);
          if (input.planId !== undefined) {
            this.queriedPlanIds.push(input.planId);
          }
          const recent = this.recent.filter(
            (item) =>
              input.planId === undefined || item.createdPlanId === input.planId
          );
          const start = input.cursor
            ? recent.findIndex((item) => item.jobId === input.cursor) + 1
            : 0;
          const items = recent.slice(start, start + input.limit);
          data = {
            items,
            nextCursor:
              start + items.length < recent.length ? items.at(-1)?.jobId : null,
          };
          break;
        }
        case 'resumeAiImport':
          this.resumeCalls++;
          this.status = {
            ...this.status,
            status: 'running',
            error: null,
            resumable: false,
            report: { issues: [], qualitativeReview: null },
          };
          this.current = this.status;
          data = { jobId: this.status.jobId };
          break;
        default:
          await route.abort();
          throw new Error(`Procédure IA inattendue : ${procedure}`);
      }
      await route.fulfill({ json: { result: { data } } });
    });
  }
}

export async function submitImport(page: Page) {
  await page.getByRole('textbox', { name: 'Nom du plan' }).fill('Plan de test');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'plan.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Axe,Action\nMobilité,Piste cyclable'),
  });
  const submit = page.getByRole('button', {
    name: "Lancer l'import",
  });
  await expect(submit).toBeEnabled();
  await submit.click();
}
