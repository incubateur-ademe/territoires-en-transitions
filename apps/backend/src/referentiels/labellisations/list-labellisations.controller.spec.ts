import { INestApplication } from '@nestjs/common';
import { ListLabellisationApiResponse } from '@tet/backend/referentiels/labellisations/list-labellisations.api-response';
import { ReferentielsRouter } from '@tet/backend/referentiels/referentiels.router';
import {
  getAuthUser,
  getTestApp,
  ISO_8601_DATE_TIME_REGEX,
  signInWith,
  YOLO_DODO,
  YOULOU_DOUDOU,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import request from 'supertest';

describe('Api pour lister les labellisations des collectivités', () => {
  let app: INestApplication;
  let yoloDodoToken: string;
  let router: ReferentielsRouter;
  let yoloDodoUser: AuthenticatedUser;
  let youlouDoudouUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(ReferentielsRouter);
    yoloDodoUser = await getAuthUser();
    youlouDoudouUser = await getAuthUser(YOULOU_DOUDOU);
    const yoloDodo = await signInWith(YOLO_DODO);
    yoloDodoToken = yoloDodo.data.session?.access_token || '';
  });

  test('Liste des labellisations des collectivités & paginations', async () => {
    const response = await request(app.getHttpServer())
      .get(`/collectivites/labellisations?limit=50`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      count: expect.any(Number),
      pageCount: expect.any(Number),
      pageSize: 50,
      page: 1,
      data: expect.any(Array),
    });

    const responsePage2 = await request(app.getHttpServer())
      .get(`/collectivites/labellisations?limit=50&page=2`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    expect(responsePage2.body).toMatchObject({
      count: expect.any(Number),
      pageCount: expect.any(Number),
      pageSize: 50,
      page: 2,
      data: expect.any(Array),
    });
  });

  test('Liste des labellisations avec recherche par collectiviteId', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const parcours = await caller.labellisations.getParcours({
      collectiviteId: 1,
      referentielId: 'cae',
    });

    // Finalise l'audit si nécessaire
    // TODO: change the test to create a new collectivite
    if (
      parcours.audit?.id &&
      (!parcours.audit?.valide || !parcours.audit?.date_fin)
    ) {
      const auditeurCaller = router.createCaller({
        user: youlouDoudouUser,
      });

      if (!parcours.audit.date_debut) {
        await auditeurCaller.labellisations.startAudit({
          auditId: parcours.audit.id,
        });
      }

      await auditeurCaller.labellisations.validateAudit({
        auditId: parcours.audit.id,
      });
    }

    const response = await request(app.getHttpServer())
      .get(`/collectivites/labellisations?collectiviteId=1`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    const listCollectivitesResponse: ListLabellisationApiResponse =
      response.body;
    expect(listCollectivitesResponse).toMatchObject({
      count: 1,
      pageCount: 1,
      pageSize: expect.any(Number),
      page: 1,
      data: expect.any(Array),
    });

    expect(listCollectivitesResponse.data.length).toBe(1);

    expect(listCollectivitesResponse.data[0]).toMatchObject({
      id: expect.any(Number),
      nom: 'Ambérieu-en-Bugey',
      siren: null,
      natureInsee: null,
      communeCode: '01004',
      type: 'commune',
      labellisations: {
        cae: {
          courante: {
            id: expect.any(Number),
            obtenueLe: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
            etoiles: 2,
            referentiel: 'cae',
            annee: expect.any(Number),
            scoreRealise: 0.56,
            scoreProgramme: 0.62,
          },
          historique: [
            {
              id: expect.any(Number),
              obtenueLe: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
              etoiles: 1,
              referentiel: 'cae',
              annee: expect.any(Number),
              scoreRealise: 0.1,
              scoreProgramme: 0,
            },
          ],
        },
      },
    });
  });

  test('Liste des labellisations avec recherche par siren', async () => {
    const response = await request(app.getHttpServer())
      .get(`/collectivites/labellisations?siren=200043495`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    const listCollectivitesResponse: ListLabellisationApiResponse =
      response.body;
    expect(listCollectivitesResponse).toMatchObject({
      count: 1,
      pageCount: 1,
      pageSize: expect.any(Number),
      page: 1,
      data: expect.any(Array),
    });

    expect(listCollectivitesResponse.data.length).toBe(1);
    expect(listCollectivitesResponse.data[0]).toMatchObject({
      id: expect.any(Number),
      nom: 'CA du Pays de Laon',
      siren: '200043495',
      labellisations: expect.any(Object),
    });
    // TODO:  simulate labellisation data to be able to test it
  });

  test('Liste des labellisations avec recherche par communeCode', async () => {
    const response = await request(app.getHttpServer())
      .get(`/collectivites/labellisations?communeCode=97132`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    const listCollectivitesResponse: ListLabellisationApiResponse =
      response.body;
    expect(listCollectivitesResponse).toMatchObject({
      count: 1,
      pageCount: 1,
      pageSize: expect.any(Number),
      page: 1,
      data: expect.any(Array),
    });

    expect(listCollectivitesResponse.data.length).toBe(1);
    expect(listCollectivitesResponse.data[0]).toMatchObject({
      id: expect.any(Number),
      nom: 'Trois-Rivières',
      siren: null,
      labellisations: expect.any(Object),
    });
  });

  test('Liste des labellisations avec recherche par texte', async () => {
    const response = await request(app.getHttpServer())
      .get(`/collectivites/labellisations?text=rivieres`)
      .set('Authorization', `Bearer ${yoloDodoToken}`)
      .expect(200);

    const listCollectivitesResponse: ListLabellisationApiResponse =
      response.body;
    expect(listCollectivitesResponse).toMatchObject({
      count: expect.any(Number),
      pageCount: expect.any(Number),
      pageSize: expect.any(Number),
      page: 1,
      data: expect.any(Array),
    });

    expect(listCollectivitesResponse.data.length).toBeGreaterThan(0);

    const troisRivieresCollectivite = listCollectivitesResponse.data.find(
      (collectivite) => collectivite.nom === 'Trois-Rivières'
    );
    expect(troisRivieresCollectivite).toMatchObject({
      id: expect.any(Number),
      nom: 'Trois-Rivières',
      siren: null,
      labellisations: expect.any(Object),
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
