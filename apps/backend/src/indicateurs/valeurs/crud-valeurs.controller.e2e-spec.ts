import { INestApplication } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { UpsertIndicateursValeursResponse } from '@tet/backend/indicateurs/valeurs/upsert-indicateurs-valeurs.response';
import {
  getAuthToken,
  getCollectiviteIdBySiren,
  getIndicateurIdByIdentifiant,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import {
  addTestUser,
  setUserCollectiviteRole,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, isNull } from 'drizzle-orm';
import { default as request } from 'supertest';
import { UpsertIndicateursValeursRequest } from './upsert-indicateurs-valeurs.request';

const collectiviteId = 3;

describe('Indicateurs', () => {
  let app: INestApplication;
  let authToken: string;
  let testUserId: string;
  let databaseService: DatabaseService;
  let paysDuLaonCollectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);

    // Create isolated test user with access to needed collectivites
    const testUserResult = await addTestUser(databaseService);
    testUserId = testUserResult.user.id;

    // Give user edition access to collectiviteId 3 (for read tests)
    await setUserCollectiviteRole(databaseService, {
      userId: testUserId,
      collectiviteId,
      role: CollectiviteRole.EDITION,
    });

    paysDuLaonCollectiviteId = await getCollectiviteIdBySiren(
      databaseService,
      '200043495'
    );

    // Give user admin access to paysDuLaon (for write/computed tests)
    await setUserCollectiviteRole(databaseService, {
      userId: testUserId,
      collectiviteId: paysDuLaonCollectiviteId,
      role: CollectiviteRole.ADMIN,
    });

    authToken = await getAuthToken({
      email: testUserResult.user.email ?? '',
      password: testUserResult.user.password,
    });

    await databaseService.db
      .update(collectiviteTable)
      .set({ accesRestreint: false })
      .where(eq(collectiviteTable.id, collectiviteId));

  });

  afterAll(async () => {
    await app.close();
  });

  it(`Lecture sans acces`, async () => {
    // interdit sans filtre
    const withoutFilterResponse = await request(app.getHttpServer())
      .get(`/indicateurs/valeurs?collectiviteId=${collectiviteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    expect(withoutFilterResponse.body).toMatchObject({
      error: 'Bad Request',
      message: 'indicateurIds or identifiantsReferentiel required',
      statusCode: 400,
    });

    // accessible en mode public
    const onlyOneValueResponse = await request(app.getHttpServer())
      .get(
        `/indicateurs/valeurs?collectiviteId=${collectiviteId}&identifiantsReferentiel=cae_1.a`
      )
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(onlyOneValueResponse.body).toMatchObject({
      count: 1,
      indicateurs: expect.any(Array),
    });

    // mais pas si la collectivité est en accès restreint
    await databaseService.db
      .update(collectiviteTable)
      .set({ accesRestreint: true })
      .where(eq(collectiviteTable.id, collectiviteId));

    // The user has edition access, so they should still be able to read even when restricted
    // Let's use a completely different user without any access
    const noAccessUser = await addTestUser(databaseService);
    const noAccessToken = await getAuthToken({
      email: noAccessUser.user.email ?? '',
      password: noAccessUser.user.password,
    });

    return request(app.getHttpServer())
      .get(
        `/indicateurs/valeurs?collectiviteId=${collectiviteId}&identifiantsReferentiel=cae_1.a`
      )
      .set('Authorization', `Bearer ${noAccessToken}`)
      .expect(403);
  });

  it(`Lecture sans collectivite est interdit`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/indicateurs/valeurs?identifiantsReferentiel=cae_1.a`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);
    expect(response.body).toMatchObject({
      message: 'Validation failed',
      statusCode: 400,
      errors: expect.any(Array),
    });
  });

  it(`Ecriture sans acces (uniquement lecture sur un des deux)`, async () => {
    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: 4936,
          indicateurId: 4,
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: 447868,
        },
        {
          collectiviteId: 3895,
          indicateurId: 4,
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: 54086,
        },
      ],
    };
    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(indicateurValeurPayload)
      .expect(403);

    expect(response.body).toMatchObject({
      error: 'Forbidden',
      statusCode: 403,
    });
    expect(response.body.message).toMatch(/Droits insuffisants/);
  });

  it(`Ecriture avec accès et calcul d'un autre indicateur pour la collectivité > ok si pas de valeur déja saisie manuellement, sinon pas de valeur calculée`, async () => {
    const cae1fIndicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.f'
    );
    const cae1eIndicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.e'
    );
    const cae1kIndicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.k'
    );

    // Delete existing
    await databaseService.db
      .delete(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, paysDuLaonCollectiviteId),
          eq(indicateurValeurTable.indicateurId, cae1kIndicateurId),
          eq(indicateurValeurTable.dateValeur, '2015-01-01'),
          isNull(indicateurValeurTable.metadonneeId)
        )
      );

    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: paysDuLaonCollectiviteId,
          indicateurId: cae1fIndicateurId,
          dateValeur: '2015-01-01',
          metadonneeId: null,
          resultat: 2.039,
        },
        {
          collectiviteId: paysDuLaonCollectiviteId,
          indicateurId: cae1eIndicateurId,
          dateValeur: '2015-01-01',
          metadonneeId: null,
          resultat: 100,
        },
      ],
    };
    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(indicateurValeurPayload)
      .expect(201);

    const upserIndicateurValeursResponse: UpsertIndicateursValeursResponse =
      response.body;
    expect(upserIndicateurValeursResponse.valeurs).toBeInstanceOf(Array);

    const nbCalculatedValues = 1;
    const nbUpsertedValues =
      indicateurValeurPayload.valeurs.length + nbCalculatedValues;
    expect(upserIndicateurValeursResponse.valeurs.length).greaterThanOrEqual(
      nbUpsertedValues
    );
    expect(upserIndicateurValeursResponse.valeurs[0]).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: cae1fIndicateurId,
      indicateurIdentifiant: 'cae_1.f',
      metadonneeId: null,
      modifiedBy: testUserId,
      resultat: 2.04,
      resultatCommentaire: null,
    });
    expect(upserIndicateurValeursResponse.valeurs[1]).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: cae1eIndicateurId,
      indicateurIdentifiant: 'cae_1.e',
      metadonneeId: null,
      modifiedBy: testUserId,
      resultat: 100,
      resultatCommentaire: null,
    });

    // Calculated indicateur
    const cae1kCalculatedValeur = upserIndicateurValeursResponse.valeurs.find(
      (v) => v.indicateurId === cae1kIndicateurId
    );

    expect(cae1kCalculatedValeur).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: cae1kIndicateurId,
      indicateurIdentifiant: 'cae_1.k',
      metadonneeId: null,
      resultat: 102.04,
      resultatCommentaire: null,
      calculAuto: true,
      calculAutoIdentifiantsManquants: [],
    });

    // Now we insert manually the cae_1.k value
    const indicateurValeurCae1kPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: paysDuLaonCollectiviteId,
          indicateurId: cae1kIndicateurId,
          dateValeur: '2015-01-01',
          metadonneeId: null,
          resultat: 106,
        },
      ],
    };
    const responseCae1k = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(indicateurValeurCae1kPayload)
      .expect(201);
    expect(responseCae1k.body.valeurs[0]).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: cae1kIndicateurId,
      indicateurIdentifiant: 'cae_1.k',
      metadonneeId: null,
      resultat: 106,
      resultatCommentaire: null,
      calculAuto: false,
      calculAutoIdentifiantsManquants: null,
    });

    // now if we write again the cae_1.f value, we should not have the cae_1.k value
    const responseAfterManualInsert = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(indicateurValeurPayload)
      .expect(201);
    const upserIndicateurValeursResponseAfterManualInsert: UpsertIndicateursValeursResponse =
      responseAfterManualInsert.body;
    expect(
      upserIndicateurValeursResponseAfterManualInsert.valeurs
    ).toBeInstanceOf(Array);
    expect(
      upserIndicateurValeursResponseAfterManualInsert.valeurs.length
    ).toEqual(2);
    expect(
      upserIndicateurValeursResponseAfterManualInsert.valeurs[0]
    ).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: cae1fIndicateurId,
      indicateurIdentifiant: 'cae_1.f',
      metadonneeId: null,
      modifiedBy: testUserId,
      resultat: 2.04,
      resultatCommentaire: null,
    });
    expect(
      upserIndicateurValeursResponseAfterManualInsert.valeurs[1]
    ).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: cae1eIndicateurId,
      indicateurIdentifiant: 'cae_1.e',
      metadonneeId: null,
      modifiedBy: testUserId,
      resultat: 100,
      resultatCommentaire: null,
    });
  });

  it(`Ecriture avec accès et calcul d'un autre indicateur de la même source`, async () => {
    const indicateurCae1eId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.e'
    );
    const indicateurCae1fId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.f'
    );
    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: paysDuLaonCollectiviteId,
          indicateurId: indicateurCae1fId,
          dateValeur: '2015-01-01',
          metadonneeId: 2,
          resultat: 2.039,
        },
        {
          collectiviteId: paysDuLaonCollectiviteId,
          indicateurId: indicateurCae1eId,
          dateValeur: '2015-01-01',
          metadonneeId: 2,
          resultat: 100,
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(indicateurValeurPayload)
      .expect(201);
    const upserIndicateurValeursResponse: UpsertIndicateursValeursResponse =
      response.body;
    expect(upserIndicateurValeursResponse.valeurs).toBeInstanceOf(Array);
    expect(
      upserIndicateurValeursResponse.valeurs.length
    ).toBeGreaterThanOrEqual(3);
    expect(upserIndicateurValeursResponse.valeurs[0]).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: indicateurCae1fId,
      indicateurIdentifiant: 'cae_1.f',
      metadonneeId: 2,
      modifiedBy: testUserId,
      resultat: 2.04,
      resultatCommentaire: null,
      sourceId: 'rare',
    });
    expect(upserIndicateurValeursResponse.valeurs[1]).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: indicateurCae1eId,
      indicateurIdentifiant: 'cae_1.e',
      metadonneeId: 2,
      modifiedBy: testUserId,
      resultat: 100,
      resultatCommentaire: null,
      sourceId: 'rare',
    });
    // Calculated indicateur
    const cae1kIndicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.k'
    );
    const cae1kCalculatedValeur = upserIndicateurValeursResponse.valeurs.find(
      (v) => v.indicateurId === cae1kIndicateurId
    );
    expect(cae1kCalculatedValeur).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: cae1kIndicateurId,
      indicateurIdentifiant: 'cae_1.k',
      metadonneeId: 2,
      resultat: 102.04,
      resultatCommentaire: null,
      sourceId: 'rare',
      calculAuto: true,
    });
  });

  it(`Ecriture avec accès et calcul d'un autre indicateur de la même source ayant des valeurs manquantes`, async () => {
    const indicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.ca'
    );
    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: paysDuLaonCollectiviteId,
          indicateurId: indicateurId,
          dateValeur: '2015-01-01',
          metadonneeId: 2,
          resultat: 2.039,
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(indicateurValeurPayload)
      .expect(201);
    const upserIndicateurValeursResponse: UpsertIndicateursValeursResponse =
      response.body;
    expect(upserIndicateurValeursResponse.valeurs).toBeInstanceOf(Array);
    expect(
      upserIndicateurValeursResponse.valeurs.length
    ).toBeGreaterThanOrEqual(2);
    expect(upserIndicateurValeursResponse.valeurs[0]).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: indicateurId,
      indicateurIdentifiant: 'cae_1.ca',
      metadonneeId: 2,
      modifiedBy: testUserId,
      resultat: 2.04,
      resultatCommentaire: null,
      sourceId: 'rare',
    });
    // Calculated indicateur
    const cae1cIndicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.c'
    );
    const cae1cCalculatedValeur = upserIndicateurValeursResponse.valeurs.find(
      (v) => v.indicateurId === cae1cIndicateurId
    );
    expect(cae1cCalculatedValeur).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: cae1cIndicateurId,
      indicateurIdentifiant: 'cae_1.c',
      metadonneeId: 2,
      resultat: 2.04,
      resultatCommentaire: null,
      sourceId: 'rare',
      calculAuto: true,
      calculAutoIdentifiantsManquants: ['cae_1.cb', 'cae_1.cc'],
    });
  });

  it(`Ecriture avec accès et calcul d'un autre indicateur impliquant une autre source avec arrondi`, async () => {
    const indicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.a'
    );
    const indicateurPopulationId = await getIndicateurIdByIdentifiant(
      databaseService,
      'terr_1'
    );

    // restore the population value
    await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        valeurs: [
          {
            collectiviteId: paysDuLaonCollectiviteId,
            indicateurId: indicateurPopulationId,
            dateValeur: '2015-01-01',
            metadonneeId: 5,
            resultat: 41739,
          },
        ],
      })
      .expect(201);

    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: paysDuLaonCollectiviteId,
          indicateurId: indicateurId,
          dateValeur: '2015-01-01',
          metadonneeId: 2,
          resultat: 10000.000002,
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(indicateurValeurPayload)
      .expect(201);
    const upserIndicateurValeursResponse: UpsertIndicateursValeursResponse =
      response.body;
    expect(upserIndicateurValeursResponse.valeurs).toBeInstanceOf(Array);
    expect(
      upserIndicateurValeursResponse.valeurs.length
    ).toBeGreaterThanOrEqual(2);
    expect(upserIndicateurValeursResponse.valeurs[0]).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: indicateurId,
      indicateurIdentifiant: 'cae_1.a',
      metadonneeId: 2,
      modifiedBy: testUserId,
      resultat: 10000,
      resultatCommentaire: null,
      sourceId: 'rare',
    });
    const computedIndicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.b'
    );
    const computedValeur = upserIndicateurValeursResponse.valeurs.find(
      (v) => v.indicateurId === computedIndicateurId
    );
    // Calculated indicateur
    expect(computedValeur).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: computedIndicateurId,
      indicateurIdentifiant: 'cae_1.b',
      metadonneeId: 2,
      resultat: 239.58,
      resultatCommentaire: null,
      sourceId: 'rare',
    });

    // We now test to change the population value from 41739 to 20000
    const indicateurPopulationValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: paysDuLaonCollectiviteId,
          indicateurId: indicateurPopulationId,
          dateValeur: '2015-01-01',
          metadonneeId: 5,
          resultat: 20000,
        },
      ],
    };

    const responseAfterPopulationUpdate = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(indicateurPopulationValeurPayload)
      .expect(201);
    const upsertIndicateurPopulationValeursResponse: UpsertIndicateursValeursResponse =
      responseAfterPopulationUpdate.body;
    expect(upsertIndicateurPopulationValeursResponse.valeurs).toBeInstanceOf(
      Array
    );
    expect(
      upsertIndicateurPopulationValeursResponse.valeurs.length
    ).toBeGreaterThanOrEqual(2);
    expect(upsertIndicateurPopulationValeursResponse.valeurs[0]).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: indicateurPopulationId,
      indicateurIdentifiant: 'terr_1',
      metadonneeId: 5,
      modifiedBy: testUserId,
      resultat: 20000,
      resultatCommentaire: null,
      sourceId: 'insee',
    });
    // Calculated indicateur
    const computedValeurAfterPopulation =
      upsertIndicateurPopulationValeursResponse.valeurs.find(
        (v) => v.indicateurId === computedIndicateurId
      );
    expect(computedValeurAfterPopulation).toMatchObject({
      collectiviteId: paysDuLaonCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: computedIndicateurId,
      indicateurIdentifiant: 'cae_1.b',
      metadonneeId: 2,
      resultat: 500,
      resultatCommentaire: null,
      sourceId: 'rare',
    });

    // restore the population value
    await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        valeurs: [
          {
            collectiviteId: paysDuLaonCollectiviteId,
            indicateurId: indicateurPopulationId,
            dateValeur: '2015-01-01',
            metadonneeId: 5,
            resultat: 41739,
          },
        ],
      })
      .expect(201);
  });
});
