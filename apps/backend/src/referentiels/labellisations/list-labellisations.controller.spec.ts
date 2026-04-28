import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ListLabellisationApiResponse } from '@tet/backend/referentiels/labellisations/list-labellisations.api-response';
import {
  createTRPCClientFromCaller,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  ISO_8601_DATE_TIME_REGEX,
  signInWith,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import request from 'supertest';
import {
  addAuditeurPermission,
  requestLabellisationForCot,
  validateAuditWithCnl,
} from './labellisations.test-fixture';

describe('Api pour lister les labellisations des collectivités', () => {
  let app: INestApplication;
  let yoloDodoToken: string;
  let router: TrpcRouter;
  let db: DatabaseService;
  let lectureUser: AuthenticatedUser;
  let editionUser: AuthenticatedUser;
  let collectivite: Collectivite;

  beforeAll(async () => {
    app = await getTestApp();
    router = await app.get(TrpcRouter);
    const yoloDodo = await signInWith(YOLO_DODO);
    yoloDodoToken = yoloDodo.data.session?.access_token || '';

    db = await getTestDatabase(app);
    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      db,
      {
        collectivite: {
          isCOT: true,
        },
        users: [
          {
            role: CollectiviteRole.LECTURE,
          },
          {
            role: CollectiviteRole.EDITION,
          },
        ],
      }
    );
    collectivite = testCollectiviteAndUsersResult.collectivite;
    const lectureUserFixture = testCollectiviteAndUsersResult.users[0];
    lectureUser = getAuthUserFromUserCredentials(lectureUserFixture);
    const editionUserFixture = testCollectiviteAndUsersResult.users[1];
    editionUser = getAuthUserFromUserCredentials(editionUserFixture);
  });

  afterAll(async () => {
    await app.close();
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

  test('Peut créer une labellisation via CNL et apparait dans la liste des labellisations avec recherche par collectiviteId', async () => {
    const caller = router.createCaller({ user: editionUser });
    const trpcClient = createTRPCClientFromCaller(caller);
    await requestLabellisationForCot(
      trpcClient,
      collectivite.id,
      ReferentielIdEnum.CAE
    );
    await caller.referentiels.actions.updateStatuts({
      actionStatuts: [
        {
          collectiviteId: collectivite.id,
          actionId: 'cae_1.1.1.2',
          statut: 'fait',
        },
      ],
    });

    const parcours = await caller.referentiels.labellisations.getParcours({
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
    });

    // Start & validate audit
    const audit = parcours.audit;
    if (!audit) {
      throw new Error('Audit not found');
    }
    await addAuditeurPermission({
      databaseService: db,
      auditId: audit.id,
      userId: lectureUser.id,
    });
    const auditeurCaller = router.createCaller({ user: lectureUser });
    await auditeurCaller.referentiels.labellisations.startAudit({
      auditId: audit.id,
    });
    await auditeurCaller.referentiels.labellisations.validateAudit({
      auditId: audit.id,
    });

    // Now we validate the labellisation with the CNL
    await validateAuditWithCnl({
      databaseService: db,
      auditId: audit.id,
      cnlDate: new Date(),
    });

    const response = await request(app.getHttpServer())
      .get(`/collectivites/labellisations?collectiviteId=${collectivite.id}`)
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
      nom: collectivite.nom,
      siren: collectivite.siren,
      natureInsee: collectivite.natureInsee,
      communeCode: collectivite.communeCode,
      type: collectivite.type,
      labellisations: {
        cae: {
          courante: {
            id: expect.any(Number),
            obtenueLe: expect.stringMatching(ISO_8601_DATE_TIME_REGEX),
            etoiles: 1,
            referentiel: 'cae',
            annee: expect.any(Number),
            scoreRealise: 2.3,
            scoreProgramme: 0,
          },
          historique: [],
        },
      },
    });
  }, 30000);

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
});
