import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthToken,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import request from 'supertest';
import { createIndicateurPerso } from '../../definitions/definitions.test-fixture';

describe('ListIndicateursController', () => {
  let app: INestApplication;
  let authToken: string;
  let collectiviteId: number;
  let caller: ReturnType<TrpcRouter['createCaller']>;

  beforeAll(async () => {
    app = await getTestApp();
    const databaseService = await getTestDatabase(app);

    const { collectivite, user } = await addTestCollectiviteAndUser(
      databaseService,
      { user: { role: CollectiviteRole.ADMIN } }
    );
    collectiviteId = collectivite.id;
    authToken = await getAuthToken(user);

    caller = app
      .get(TrpcRouter)
      .createCaller({ user: getAuthUserFromUserCredentials(user) });
  });

  afterAll(async () => {
    await app.close();
  });

  test('expose estPerso à true pour un indicateur personnalisé', async () => {
    const indicateurPersoId = await createIndicateurPerso({
      caller,
      indicateurData: { collectiviteId, titre: 'Indicateur perso API' },
    });

    const response = await request(app.getHttpServer())
      .get(
        `/indicateurs?collectiviteId=${collectiviteId}&indicateurIds=${indicateurPersoId}`
      )
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data).toContainEqual(
      expect.objectContaining({
        id: indicateurPersoId,
        estPerso: true,
        identifiantReferentiel: null,
      })
    );
  });

  test('expose estPerso à false pour un indicateur prédéfini', async () => {
    const response = await request(app.getHttpServer())
      .get(
        `/indicateurs?collectiviteId=${collectiviteId}&identifiantsReferentiel=cae_2.a`
      )
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data).toContainEqual(
      expect.objectContaining({
        identifiantReferentiel: 'cae_2.a',
        estPerso: false,
      })
    );
  });
});
