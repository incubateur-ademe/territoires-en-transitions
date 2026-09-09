import { INestApplication } from '@nestjs/common';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { ReportGeneration } from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { TrpcRouter } from '../../../utils/trpc/trpc.router';

const SEED_DATA_PLAN_ID = 1;
const SEED_DATA_COLLECTIVITE_ID = 1;

describe('generate-reports.router.e2e-spec.ts', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let adminUser: AuthenticatedUser;
  let noAccessUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const db = await getTestDatabase(app);

    // User with admin access to seed collectivite
    const adminResult = await addTestUser(db, {
      collectiviteId: SEED_DATA_COLLECTIVITE_ID,
      role: CollectiviteRole.ADMIN,
    });
    adminUser = getAuthUserFromUserCredentials(adminResult.user);

    // User without access (for permission test)
    const noAccessResult = await addTestUser(db);
    noAccessUser = getAuthUserFromUserCredentials(noAccessResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Génère un rapport de plan au format PPTX', async () => {
    const caller = router.createCaller({ user: adminUser });
    const reportGeneration = await caller.plans.reports.create({
      planId: SEED_DATA_PLAN_ID,
      templateKey: 'general_bilan_template',
    });

    const expectedFileName =
      /^Rapport_Amberieu-en-Bugey_Plan Velo 2020-2024.*\.pptx$/;

    expect(reportGeneration.name).toMatch(expectedFileName);

    const getReportGeneration = (): Promise<ReportGeneration> =>
      caller.plans.reports.get({ reportId: reportGeneration.id });

    await expect
      .poll(async () => (await getReportGeneration()).status, {
        interval: 2000,
        timeout: 60000,
      })
      .toMatch(/^(completed|failed)$/);

    const updatedReportGeneration = await getReportGeneration();
    expect(
      updatedReportGeneration.status,
      `Report generation failed: ${updatedReportGeneration.errorMessage}`
    ).toBe('completed');

    const fichierId = updatedReportGeneration.fileId;
    if (fichierId === null) {
      throw new Error('A completed report must carry a fileId');
    }

    const { signedUrl, filename } =
      await caller.collectivites.documents.getDownloadUrl({
        collectiviteId: SEED_DATA_COLLECTIVITE_ID,
        fichierId,
      });

    expect(filename).toMatch(expectedFileName);

    const response = await fetch(signedUrl);
    expect(response.ok).toBe(true);

    const reportBuffer = Buffer.from(await response.arrayBuffer());
    expect(reportBuffer.byteLength).toBeGreaterThan(1000);
  }, 90000);

  it("Refuse la génération de rapport si l'utilisateur n'a pas les droits", async () => {
    const caller = router.createCaller({ user: noAccessUser });

    await expect(() =>
      caller.plans.reports.create({
        planId: SEED_DATA_PLAN_ID,
        templateKey: 'general_bilan_template',
      })
    ).rejects.toThrowError(/Vous n'avez pas les permissions nécessaires/i);
  });
});
