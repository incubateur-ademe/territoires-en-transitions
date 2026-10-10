import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { UpsertIndicateursValeursResponse } from '@tet/backend/indicateurs/valeurs/write-indicateur-valeurs/upsert-indicateurs-valeurs.response';
import {
  getAuthToken,
  getServiceRoleUser,
  getIndicateurIdByIdentifiant,
  getTestApp,
  getTestDatabase,
  signTestAuthToken,
} from '@tet/backend/test';
import { AuthRole } from '@tet/backend/users/models/auth.models';
import {
  addTestUser,
  setUserCollectiviteRole,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { CollectiviteRole } from '@tet/domain/users';
import { PCAET_COLLECTIVITE_SOURCE_ID } from '@tet/domain/indicateurs';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { randomUUID } from 'node:crypto';
import { indicateurSourceTable } from '../shared/models/indicateur-source.table';
import ManageIndicateurValeursService from './manage-indicateur-valeurs/manage-indicateur-valeurs.service';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { default as request } from 'supertest';
import { UpsertIndicateursValeursRequest } from './write-indicateur-valeurs/upsert-indicateurs-valeurs.request';

describe('Indicateurs', () => {
  let app: INestApplication;
  let authToken: string;
  let testUserId: string;
  let databaseService: DatabaseService;
  let serviceRoleToken: string;
  let collectiviteId: number;
  let calculationCollectiviteId: number;
  let readOnlyCollectiviteId: number;
  let rareMetadataId: number;
  let inseeMetadataId: number;
  const cleanupFixtures: Array<() => Promise<void>> = [];

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    serviceRoleToken = signTestAuthToken(
      { role: AuthRole.SERVICE_ROLE },
      app.get(ConfigurationService).get('SUPABASE_JWT_SECRET')
    );

    const fixture = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.EDITION },
      collectivite: { accesRestreint: false },
    });
    collectiviteId = fixture.collectivite.id;
    testUserId = fixture.user.id;
    cleanupFixtures.push(fixture.cleanup);

    const calculationFixture = await addTestCollectivite(databaseService);
    calculationCollectiviteId = calculationFixture.collectivite.id;
    cleanupFixtures.push(calculationFixture.cleanup);
    await setUserCollectiviteRole(databaseService, {
      userId: testUserId,
      collectiviteId: calculationCollectiviteId,
      role: CollectiviteRole.ADMIN,
    });

    const readOnlyFixture = await addTestCollectivite(databaseService);
    readOnlyCollectiviteId = readOnlyFixture.collectivite.id;
    cleanupFixtures.push(readOnlyFixture.cleanup);
    await setUserCollectiviteRole(databaseService, {
      userId: testUserId,
      collectiviteId: readOnlyCollectiviteId,
      role: CollectiviteRole.LECTURE,
    });

    const [rareMetadata, inseeMetadata] = await databaseService.db
      .insert(indicateurSourceMetadonneeTable)
      .values([
        { sourceId: 'rare', dateVersion: '2026-01-01' },
        { sourceId: 'insee', dateVersion: '2026-01-01' },
      ])
      .returning();
    rareMetadataId = rareMetadata.id;
    inseeMetadataId = inseeMetadata.id;

    authToken = await getAuthToken({
      email: fixture.user.email ?? '',
      password: fixture.user.password,
    });
  });

  afterAll(async () => {
    await databaseService.db
      .delete(indicateurValeurTable)
      .where(
        inArray(indicateurValeurTable.collectiviteId, [
          collectiviteId,
          calculationCollectiviteId,
          readOnlyCollectiviteId,
        ])
      );
    await databaseService.db
      .delete(indicateurSourceMetadonneeTable)
      .where(
        inArray(indicateurSourceMetadonneeTable.id, [
          rareMetadataId,
          inseeMetadataId,
        ])
      );
    for (const cleanup of cleanupFixtures) {
      await cleanup();
    }
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
    onTestFinished(noAccessUser.cleanup);
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
    const indicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.a'
    );
    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: calculationCollectiviteId,
          indicateurId,
          dateValeur: '2015-01-01',
          metadonneeId: null,
          resultat: 447868,
        },
        {
          collectiviteId: readOnlyCollectiviteId,
          indicateurId,
          dateValeur: '2015-01-01',
          metadonneeId: null,
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

  it(`Une intégration service-role peut alimenter une source open-data d'un indicateur sans valeur utilisateur`, async () => {
    const [protectedDefinition] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
        titre: 'Indicateur open-data protégé',
        unite: 'MWh',
        periodicite: 'annuelle',
        sansValeurUtilisateur: true,
      })
      .returning();
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, protectedDefinition.id));
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, protectedDefinition.id));
    });

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${serviceRoleToken}`)
      .send({
        valeurs: [
          {
            collectiviteId,
            indicateurId: protectedDefinition.id,
            dateValeur: '2026-01-01',
            metadonneeId: rareMetadataId,
            resultat: 42,
          },
        ],
      })
      .expect(201);

    expect(response.body.valeurs).toEqual([
      expect.objectContaining({
        collectiviteId,
        indicateurId: protectedDefinition.id,
        dateValeur: '2026-01-01',
        metadonneeId: rareMetadataId,
        resultat: 42,
      }),
    ]);
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
          eq(indicateurValeurTable.collectiviteId, calculationCollectiviteId),
          eq(indicateurValeurTable.indicateurId, cae1kIndicateurId),
          eq(indicateurValeurTable.dateValeur, '2015-01-01'),
          isNull(indicateurValeurTable.metadonneeId)
        )
      );

    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: calculationCollectiviteId,
          indicateurId: cae1fIndicateurId,
          dateValeur: '2015-01-01',
          metadonneeId: null,
          resultat: 2.039,
        },
        {
          collectiviteId: calculationCollectiviteId,
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
      collectiviteId: calculationCollectiviteId,
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
      collectiviteId: calculationCollectiviteId,
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
      collectiviteId: calculationCollectiviteId,
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
          collectiviteId: calculationCollectiviteId,
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
      collectiviteId: calculationCollectiviteId,
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
      collectiviteId: calculationCollectiviteId,
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
      collectiviteId: calculationCollectiviteId,
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

  it(`Import service-role et calcul d'un autre indicateur de la même source`, async () => {
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
          collectiviteId: calculationCollectiviteId,
          indicateurId: indicateurCae1fId,
          dateValeur: '2015-01-01',
          metadonneeId: rareMetadataId,
          resultat: 2.039,
        },
        {
          collectiviteId: calculationCollectiviteId,
          indicateurId: indicateurCae1eId,
          dateValeur: '2015-01-01',
          metadonneeId: rareMetadataId,
          resultat: 100,
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${serviceRoleToken}`)
      .send(indicateurValeurPayload)
      .expect(201);
    const upserIndicateurValeursResponse: UpsertIndicateursValeursResponse =
      response.body;
    expect(upserIndicateurValeursResponse.valeurs).toBeInstanceOf(Array);
    expect(
      upserIndicateurValeursResponse.valeurs.length
    ).toBeGreaterThanOrEqual(3);
    expect(upserIndicateurValeursResponse.valeurs[0]).toMatchObject({
      collectiviteId: calculationCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: indicateurCae1fId,
      indicateurIdentifiant: 'cae_1.f',
      metadonneeId: rareMetadataId,
      modifiedBy: null,
      resultat: 2.04,
      resultatCommentaire: null,
      sourceId: 'rare',
    });
    expect(upserIndicateurValeursResponse.valeurs[1]).toMatchObject({
      collectiviteId: calculationCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: indicateurCae1eId,
      indicateurIdentifiant: 'cae_1.e',
      metadonneeId: rareMetadataId,
      modifiedBy: null,
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
      collectiviteId: calculationCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: cae1kIndicateurId,
      indicateurIdentifiant: 'cae_1.k',
      metadonneeId: rareMetadataId,
      resultat: 102.04,
      resultatCommentaire: null,
      sourceId: 'rare',
      calculAuto: true,
    });
  });

  it(`Import service-role et calcul d'un autre indicateur de la même source ayant des valeurs manquantes`, async () => {
    const indicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.ca'
    );
    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: calculationCollectiviteId,
          indicateurId: indicateurId,
          dateValeur: '2015-01-01',
          metadonneeId: rareMetadataId,
          resultat: 2.039,
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${serviceRoleToken}`)
      .send(indicateurValeurPayload)
      .expect(201);
    const upserIndicateurValeursResponse: UpsertIndicateursValeursResponse =
      response.body;
    expect(upserIndicateurValeursResponse.valeurs).toBeInstanceOf(Array);
    expect(
      upserIndicateurValeursResponse.valeurs.length
    ).toBeGreaterThanOrEqual(2);
    expect(upserIndicateurValeursResponse.valeurs[0]).toMatchObject({
      collectiviteId: calculationCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: indicateurId,
      indicateurIdentifiant: 'cae_1.ca',
      metadonneeId: rareMetadataId,
      modifiedBy: null,
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
      collectiviteId: calculationCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: cae1cIndicateurId,
      indicateurIdentifiant: 'cae_1.c',
      metadonneeId: rareMetadataId,
      resultat: 2.04,
      resultatCommentaire: null,
      sourceId: 'rare',
      calculAuto: true,
      calculAutoIdentifiantsManquants: ['cae_1.cb', 'cae_1.cc'],
    });
  });

  it(`Import service-role et calcul d'un autre indicateur impliquant une autre source avec arrondi`, async () => {
    const indicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.a'
    );
    const indicateurPopulationId = await getIndicateurIdByIdentifiant(
      databaseService,
      'terr_1'
    );

    // Set the population for the cross-source calculation
    await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${serviceRoleToken}`)
      .send({
        valeurs: [
          {
            collectiviteId: calculationCollectiviteId,
            indicateurId: indicateurPopulationId,
            dateValeur: '2015-01-01',
            metadonneeId: inseeMetadataId,
            resultat: 41739,
          },
        ],
      })
      .expect(201);

    const indicateurValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: calculationCollectiviteId,
          indicateurId: indicateurId,
          dateValeur: '2015-01-01',
          metadonneeId: rareMetadataId,
          resultat: 10000.000002,
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${serviceRoleToken}`)
      .send(indicateurValeurPayload)
      .expect(201);
    const upserIndicateurValeursResponse: UpsertIndicateursValeursResponse =
      response.body;
    expect(upserIndicateurValeursResponse.valeurs).toBeInstanceOf(Array);
    expect(
      upserIndicateurValeursResponse.valeurs.length
    ).toBeGreaterThanOrEqual(2);
    expect(upserIndicateurValeursResponse.valeurs[0]).toMatchObject({
      collectiviteId: calculationCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: indicateurId,
      indicateurIdentifiant: 'cae_1.a',
      metadonneeId: rareMetadataId,
      modifiedBy: null,
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
      collectiviteId: calculationCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: computedIndicateurId,
      indicateurIdentifiant: 'cae_1.b',
      metadonneeId: rareMetadataId,
      resultat: 239.58,
      resultatCommentaire: null,
      sourceId: 'rare',
    });

    // We now test to change the population value from 41739 to 20000
    const indicateurPopulationValeurPayload: UpsertIndicateursValeursRequest = {
      valeurs: [
        {
          collectiviteId: calculationCollectiviteId,
          indicateurId: indicateurPopulationId,
          dateValeur: '2015-01-01',
          metadonneeId: inseeMetadataId,
          resultat: 20000,
        },
      ],
    };

    const responseAfterPopulationUpdate = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${serviceRoleToken}`)
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
      collectiviteId: calculationCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: indicateurPopulationId,
      indicateurIdentifiant: 'terr_1',
      metadonneeId: inseeMetadataId,
      modifiedBy: null,
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
      collectiviteId: calculationCollectiviteId,
      dateValeur: '2015-01-01',
      estimation: null,
      indicateurId: computedIndicateurId,
      indicateurIdentifiant: 'cae_1.b',
      metadonneeId: rareMetadataId,
      resultat: 500,
      resultatCommentaire: null,
      sourceId: 'rare',
    });

    // restore the population value
    await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${serviceRoleToken}`)
      .send({
        valeurs: [
          {
            collectiviteId: calculationCollectiviteId,
            indicateurId: indicateurPopulationId,
            dateValeur: '2015-01-01',
            metadonneeId: inseeMetadataId,
            resultat: 41739,
          },
        ],
      })
      .expect(201);
  });

  async function createCalculationFixture(
    dates: [string, string],
    pcaet = false
  ) {
    const fixture = await addTestCollectivite(databaseService);
    const prefix = `calcul_${randomUUID().replaceAll('-', '')}`;
    const sourceId = pcaet ? PCAET_COLLECTIVITE_SOURCE_ID : prefix;
    await databaseService.db
      .insert(indicateurSourceTable)
      .values({ id: sourceId, libelle: sourceId })
      .onConflictDoNothing();
    const metadonnees = await databaseService.db
      .insert(indicateurSourceMetadonneeTable)
      .values([
        ...dates.map((dateVersion) => ({ sourceId, dateVersion })),
        { sourceId: 'insee', dateVersion: '2026-01-01' },
      ])
      .returning();
    const [source, shared, target, downstream] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values([
        {
          identifiantReferentiel: `${prefix}_source`,
          titre: prefix,
          unite: 'u',
        },
        {
          identifiantReferentiel: `${prefix}_shared`,
          titre: prefix,
          unite: 'u',
        },
        {
          identifiantReferentiel: `${prefix}_target`,
          titre: prefix,
          unite: 'u',
          valeurCalcule: pcaet
            ? `val(${prefix}_source) + val(${prefix}_shared)`
            : `val(${prefix}_source) * 2`,
        },
        {
          identifiantReferentiel: `${prefix}_downstream`,
          titre: prefix,
          unite: 'u',
          valeurCalcule: `val(${prefix}_target) * 2`,
        },
      ])
      .returning();
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(
          inArray(indicateurDefinitionTable.id, [
            source.id,
            shared.id,
            target.id,
            downstream.id,
          ])
        );
      await databaseService.db.delete(indicateurSourceMetadonneeTable).where(
        inArray(
          indicateurSourceMetadonneeTable.id,
          metadonnees.map(({ id }) => id)
        )
      );
      if (!pcaet)
        await databaseService.db
          .delete(indicateurSourceTable)
          .where(eq(indicateurSourceTable.id, sourceId));
      await fixture.cleanup();
    });
    const caller = app
      .get(TrpcRouter)
      .createCaller({ user: getServiceRoleUser() });
    const importValeurs = (
      valeurs: {
        indicateurId: number;
        metadonneeId: number;
        resultat: number;
      }[]
    ) =>
      request(app.getHttpServer())
        .post('/indicateurs/valeurs')
        .set('Authorization', `Bearer ${serviceRoleToken}`)
        .send({
          valeurs: valeurs.map((valeur) => ({
            ...valeur,
            collectiviteId: fixture.collectivite.id,
            dateValeur: '2025-01-01',
          })),
        })
        .expect(201);
    const readCalculated = () =>
      databaseService.db
        .select()
        .from(indicateurValeurTable)
        .where(
          and(
            eq(indicateurValeurTable.collectiviteId, fixture.collectivite.id),
            inArray(indicateurValeurTable.indicateurId, [
              target.id,
              downstream.id,
            ])
          )
        )
        .orderBy(
          indicateurValeurTable.indicateurId,
          indicateurValeurTable.metadonneeId
        );
    return {
      collectiviteId: fixture.collectivite.id,
      sourceId,
      source,
      shared,
      target,
      downstream,
      metadonnees,
      caller,
      importValeurs,
      readCalculated,
    };
  }

  it.each([
    {
      dates: ['2026-02-01', '2026-01-01'] as [string, string],
      latestIndex: 0,
      reason: 'date de version',
    },
    {
      dates: ['2026-02-01', '2026-02-01'] as [string, string],
      latestIndex: 1,
      reason: 'identifiant à dates égales',
    },
  ])(
    'conserve la dernière métadonnée par $reason après un import ancien et un recalcul complet',
    async ({ dates, latestIndex }) => {
      const fixture = await createCalculationFixture(dates);
      const {
        source,
        target,
        downstream,
        metadonnees,
        importValeurs,
        readCalculated,
        caller,
      } = fixture;
      const latest = metadonnees[latestIndex];
      const older = metadonnees[1 - latestIndex];
      await importValeurs([
        { indicateurId: source.id, metadonneeId: latest.id, resultat: 20 },
      ]);
      await importValeurs([
        { indicateurId: source.id, metadonneeId: older.id, resultat: 5 },
      ]);
      const expected = [
        {
          indicateurId: target.id,
          metadonneeId: latest.id,
          resultat: 40,
          calculAuto: true,
        },
        {
          indicateurId: downstream.id,
          metadonneeId: latest.id,
          resultat: 80,
          calculAuto: true,
        },
      ];
      expect(await readCalculated()).toMatchObject(expected);
      const listed = await caller.indicateurs.valeurs.list({
        collectiviteId: fixture.collectiviteId,
        indicateurIds: [target.id],
      });
      expect(
        listed.indicateurs[0].sources[fixture.sourceId].valeurs
      ).toMatchObject([{ metadonneeId: latest.id, resultat: 40 }]);

      // A legacy automatic row must disappear when the newest version is recomputed.
      await databaseService.db.insert(indicateurValeurTable).values({
        collectiviteId: fixture.collectiviteId,
        indicateurId: target.id,
        metadonneeId: older.id,
        dateValeur: '2025-01-01',
        resultat: 10,
        calculAuto: true,
      });
      await caller.indicateurs.valeurs.recompute({
        collectiviteId: fixture.collectiviteId,
      });
      expect(await readCalculated()).toMatchObject(expected);
    }
  );

  it('isole les calculs de deux démarches PCAET lors des imports, mises à jour et suppressions', async () => {
    const fixture = await createCalculationFixture(
      ['2026-01-01', '2026-02-01'],
      true
    );
    const {
      source,
      shared,
      target,
      downstream,
      metadonnees: [first, second, insee],
      importValeurs,
      readCalculated,
      caller,
    } = fixture;
    await importValeurs([
      { indicateurId: shared.id, metadonneeId: insee.id, resultat: 5 },
      { indicateurId: source.id, metadonneeId: first.id, resultat: 10 },
      { indicateurId: source.id, metadonneeId: second.id, resultat: 100 },
    ]);
    const expected = (firstResult: number, secondResult: number) => [
      {
        indicateurId: target.id,
        metadonneeId: first.id,
        resultat: firstResult,
      },
      {
        indicateurId: target.id,
        metadonneeId: second.id,
        resultat: secondResult,
      },
      {
        indicateurId: downstream.id,
        metadonneeId: first.id,
        resultat: firstResult * 2,
      },
      {
        indicateurId: downstream.id,
        metadonneeId: second.id,
        resultat: secondResult * 2,
      },
    ];
    expect(await readCalculated()).toMatchObject(expected(15, 105));
    await importValeurs([
      { indicateurId: source.id, metadonneeId: first.id, resultat: 20 },
    ]);
    expect(await readCalculated()).toMatchObject(expected(25, 105));
    await importValeurs([
      { indicateurId: shared.id, metadonneeId: insee.id, resultat: 7 },
    ]);
    expect(await readCalculated()).toMatchObject(expected(27, 107));
    await caller.indicateurs.valeurs.recompute({
      collectiviteId: fixture.collectiviteId,
    });
    expect(await readCalculated()).toMatchObject(expected(27, 107));

    // Internal source deletion has no public endpoint; use its real application service.
    await app.get(ManageIndicateurValeursService).deleteIndicateurValeurs({
      collectiviteId: fixture.collectiviteId,
      indicateurId: source.id,
      metadonneeId: first.id,
    });
    const remaining = [
      { indicateurId: target.id, metadonneeId: second.id, resultat: 107 },
      { indicateurId: downstream.id, metadonneeId: second.id, resultat: 214 },
    ];
    expect(await readCalculated()).toMatchObject(remaining);
    await caller.indicateurs.valeurs.recompute({
      collectiviteId: fixture.collectiviteId,
    });
    expect(await readCalculated()).toMatchObject(remaining);
  });
});
