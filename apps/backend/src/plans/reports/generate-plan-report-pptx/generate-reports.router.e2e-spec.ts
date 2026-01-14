import { INestApplication } from '@nestjs/common';
import {
  getAuthToken,
  getAuthUser,
  getTestApp,
  getTestRouter,
  YULU_DUDU,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { sleep } from '@tet/backend/utils/sleep.utils';
import { default as request } from 'supertest';
import { TrpcRouter } from '../../../utils/trpc/trpc.router';

const SEED_DATA_PLAN_ID = 1;
const SEED_DATA_COLLECTIVITE_ID = 1;

describe('generate-reports.router.e2e-spec.ts', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let yuluDuduUser: AuthenticatedUser;
  let yoloDodoToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    yoloDodoUser = await getAuthUser();
    yuluDuduUser = await getAuthUser(YULU_DUDU);
    yoloDodoToken = await getAuthToken();
  });

  it('Génère un rapport de plan au format PPTX', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const reportGeneration = await caller.plans.reports.create({
      planId: SEED_DATA_PLAN_ID,
      templateKey: 'general_bilan_template',
    });

    const expectedFileName =
      /^Rapport_Amberieu-en-Bugey_Plan Velo 2020-2024.*\.pptx$/;

    expect(reportGeneration.name).toMatch(expectedFileName);

    await sleep(10000);

    const updatedReportGeneration = await caller.plans.reports.get({
      reportId: reportGeneration.id,
    });
    expect(updatedReportGeneration.status).toBe('completed');

    const response = await request(app.getHttpServer())
      .get(
        `/collectivites/${SEED_DATA_COLLECTIVITE_ID}/documents/${updatedReportGeneration.id}/download`
      )
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200)
      .responseType('blob');

    const fileName = decodeURI(
      response.headers['content-disposition']
        .split('filename=')[1]
        .split(';')[0]
        .split('"')[1]
    );

    const body = response.body as Buffer;

    expect(fileName).toMatch(expectedFileName);
    // Vérifie que le fichier a une taille raisonnable (rapport PPTX)
    expect(body.byteLength).toBeGreaterThan(1000);
  }, 15000);

  it("Refuse la génération de rapport si l'utilisateur n'a pas les droits", async () => {
    const caller = router.createCaller({ user: yuluDuduUser });

    await expect(() =>
      caller.plans.reports.create({
        planId: SEED_DATA_PLAN_ID,
        templateKey: 'general_bilan_template',
      })
    ).rejects.toThrowError(/Vous n'avez pas les permissions nécessaires/i);
  });
});
