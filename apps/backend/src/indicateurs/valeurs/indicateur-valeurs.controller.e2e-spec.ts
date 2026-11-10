import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { UpsertIndicateursValeursResponse } from '@tet/backend/indicateurs/valeurs/write-indicateur-valeurs/upsert-indicateurs-valeurs.response';
import {
  getAuthToken,
  getAuthUserFromUserCredentials,
  getServiceRoleUser,
  getIndicateurIdByIdentifiant,
  getDisposableTestApp,
  getTestDatabase,
  signTestAuthToken,
} from '@tet/backend/test';
import { AuthRole } from '@tet/backend/users/models/auth.models';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import {
  addTestUser,
  setUserCollectiviteRole,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { CollectiviteRole } from '@tet/domain/users';
import {
  ELECTRIFICATION_SOURCE_ID,
  PCAET_COLLECTIVITE_SOURCE_ID,
} from '@tet/domain/indicateurs';
import { GenerateImportDraftWorker } from '@tet/backend/plans/ai-plan-import/generate-import-draft/generate-import-draft.worker';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
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
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder
          .overrideProvider(LlmService)
          .useValue(new LlmService(new FakeLlmRepository()));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
      },
    });
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
    const [protectedIndicateur] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
        identifiantReferentiel: `test_${randomUUID()}`,
        titre: 'Indicateur open-data protégé',
        unite: 'MWh',
        periodicite: 'annuelle',
        sansValeurUtilisateur: true,
      })
      .returning();
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, protectedIndicateur.id));
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, protectedIndicateur.id));
    });

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${serviceRoleToken}`)
      .send({
        valeurs: [
          {
            collectiviteId,
            indicateurId: protectedIndicateur.id,
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
        indicateurId: protectedIndicateur.id,
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

  it.each([50, 500])(
    'importe puis met à jour %i populations en recalculant les ratios de chaque collectivité et année',
    async (valeursCount) => {
      const populationId = await getIndicateurIdByIdentifiant(
        databaseService,
        'terr_1'
      );
      const emissionsId = await getIndicateurIdByIdentifiant(
        databaseService,
        'cae_1.a'
      );
      const emissionsParHabitantId = await getIndicateurIdByIdentifiant(
        databaseService,
        'cae_1.b'
      );
      const collectiviteIds: number[] = [];
      for (let index = 0; index < Math.ceil(valeursCount / 20); index++) {
        const fixture = await addTestCollectivite(databaseService);
        collectiviteIds.push(fixture.collectivite.id);
        onTestFinished(fixture.cleanup);
      }
      const populations = Array.from({ length: valeursCount }, (_, index) => ({
        collectiviteId: collectiviteIds[Math.floor(index / 20)],
        indicateurId: populationId,
        metadonneeId: inseeMetadataId,
        dateValeur: `${2006 + (index % 20)}-01-01`,
        resultat: 10000,
      }));
      // Chaque cellule a un numérateur distinct pour détecter un mélange
      // entre collectivités ou années pendant le recalcul.
      await databaseService.db.insert(indicateurValeurTable).values(
        populations.map((valeur, index) => ({
          ...valeur,
          indicateurId: emissionsId,
          metadonneeId: rareMetadataId,
          resultat: 100 * (index + 1),
        }))
      );
      const assertCalculatedValeurs = (
        valeurs: UpsertIndicateursValeursResponse['valeurs'],
        multiplier: number
      ) => {
        const calculated = valeurs.filter(
          ({ indicateurId }) => indicateurId === emissionsParHabitantId
        );
        expect(calculated).toHaveLength(valeursCount);
        const byCollectiviteAndDate = new Map(
          calculated.map((valeur) => [
            `${valeur.collectiviteId}:${valeur.dateValeur}`,
            valeur,
          ])
        );
        expect(byCollectiviteAndDate.size).toBe(valeursCount);
        for (const [index, population] of populations.entries()) {
          expect(
            byCollectiviteAndDate.get(
              `${population.collectiviteId}:${population.dateValeur}`
            )
          ).toMatchObject({
            metadonneeId: rareMetadataId,
            periodicite: 'annuelle',
            resultat: multiplier * (index + 1),
            calculAuto: true,
          });
        }
      };

      for (const populationMultiplier of [1, 2]) {
        const response = await request(app.getHttpServer())
          .post('/indicateurs/valeurs')
          .set('Authorization', `Bearer ${serviceRoleToken}`)
          .send({
            valeurs: populations.map((valeur) => ({
              ...valeur,
              resultat: valeur.resultat * populationMultiplier,
            })),
          })
          .expect(201);
        const { valeurs }: UpsertIndicateursValeursResponse = response.body;
        expect(
          valeurs.filter(({ indicateurId }) => indicateurId === populationId)
        ).toHaveLength(valeursCount);
        assertCalculatedValeurs(valeurs, 10 / populationMultiplier);
      }

      const stored = await databaseService.db
        .select()
        .from(indicateurValeurTable)
        .where(
          and(
            inArray(indicateurValeurTable.collectiviteId, collectiviteIds),
            eq(indicateurValeurTable.indicateurId, emissionsParHabitantId)
          )
        );
      assertCalculatedValeurs(stored, 5);
    }
  );

  async function createCalculationFixture(
    dates: [string, string],
    metadataSourceId?: string
  ) {
    const fixture = await addTestCollectivite(databaseService);
    const prefix = `calcul_${randomUUID().replaceAll('-', '')}`;
    const sourceId = metadataSourceId ?? prefix;
    const createdSources = await databaseService.db
      .insert(indicateurSourceTable)
      .values({ id: sourceId, libelle: sourceId })
      .onConflictDoNothing()
      .returning();
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
          valeurCalcule: metadataSourceId
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
      if (createdSources.length > 0)
        await databaseService.db
          .delete(indicateurSourceTable)
          .where(eq(indicateurSourceTable.id, sourceId));
      await databaseService.db
        .delete(utilisateurCollectiviteAccessTable)
        .where(
          eq(
            utilisateurCollectiviteAccessTable.collectiviteId,
            fixture.collectivite.id
          )
        );
      await fixture.cleanup();
    });
    const caller = app
      .get(TrpcRouter)
      .createCaller({ user: getServiceRoleUser() });
    const importValeurs = (
      valeurs: {
        indicateurId: number;
        metadonneeId: number;
        resultat?: number;
        objectif?: number;
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

  it.each([
    {
      sourceId: PCAET_COLLECTIVITE_SOURCE_ID,
      dates: ['2026-01-01', '2026-02-01'] as [string, string],
    },
    {
      sourceId: ELECTRIFICATION_SOURCE_ID,
      dates: ['2026-01-01', '2026-01-01'] as [string, string],
    },
  ])(
    'isole les métadonnées $sourceId lors des imports, mises à jour et suppressions',
    async ({ sourceId, dates }) => {
      const fixture = await createCalculationFixture(dates, sourceId);
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
      for (const [metadata, resultat] of [
        [first, 15],
        [second, 105],
      ] as const) {
        const listed = await caller.indicateurs.valeurs.list({
          collectiviteId: fixture.collectiviteId,
          indicateurIds: [target.id],
          metadonneeId: metadata.id,
        });
        expect(listed.indicateurs[0].sources[sourceId].valeurs).toMatchObject([
          { metadonneeId: metadata.id, resultat },
        ]);
        expect(listed.indicateurs[0].sources[sourceId].valeurs).toHaveLength(1);
      }
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
    }
  );

  describe.each([
    {
      source: 'Électrification',
      sourceId: ELECTRIFICATION_SOURCE_ID,
      expectedExternalValue: null,
    },
    {
      source: 'PCAET',
      sourceId: PCAET_COLLECTIVITE_SOURCE_ID,
      expectedExternalValue: 105,
    },
    {
      source: 'externe',
      sourceId: `calcul_${randomUUID().replaceAll('-', '')}`,
      expectedExternalValue: 105,
    },
  ])('Source $source', ({ sourceId, expectedExternalValue }) => {
    it.each(['objectif', 'resultat'] as const)(
      'respecte la politique de complément externe avec seulement %s renseigné',
      async (field) => {
        const fixture = await createCalculationFixture(
          ['2026-01-01', '2026-01-01'],
          sourceId
        );
        const {
          source,
          shared,
          target,
          downstream,
          metadonnees: [plan, , insee],
        } = fixture;
        await fixture.importValeurs([
          {
            indicateurId: source.id,
            metadonneeId: insee.id,
            resultat: 100,
            objectif: 100,
          },
          {
            indicateurId: shared.id,
            metadonneeId: insee.id,
            resultat: 5,
            objectif: 5,
          },
          { indicateurId: source.id, metadonneeId: plan.id, [field]: 0 },
        ]);
        const otherField = field === 'objectif' ? 'resultat' : 'objectif';
        const expected = [
          {
            indicateurId: target.id,
            metadonneeId: plan.id,
            [field]: 5,
            [otherField]: expectedExternalValue,
          },
          {
            indicateurId: downstream.id,
            metadonneeId: plan.id,
            [field]: 10,
            [otherField]:
              expectedExternalValue === null ? null : expectedExternalValue * 2,
          },
        ];
        const readPlan = async () =>
          (await fixture.readCalculated()).filter(
            (valeur) => valeur.metadonneeId === plan.id
          );
        expect(await readPlan()).toMatchObject(expected);
        await fixture.caller.indicateurs.valeurs.recompute({
          collectiviteId: fixture.collectiviteId,
        });
        expect(await readPlan()).toMatchObject(expected);
      }
    );
  });

  it.each([PCAET_COLLECTIVITE_SOURCE_ID, ELECTRIFICATION_SOURCE_ID])(
    'exclut les valeurs %s de la moyenne nationale',
    async (sourceId) => {
      const fixture = await createCalculationFixture(
        ['2026-01-01', '2026-01-01'],
        sourceId
      );
      const [metadata, , insee] = fixture.metadonnees;
      await fixture.importValeurs([
        {
          indicateurId: fixture.source.id,
          metadonneeId: metadata.id,
          resultat: 100,
        },
      ]);
      await setUserCollectiviteRole(databaseService, {
        userId: testUserId,
        collectiviteId: fixture.collectiviteId,
        role: CollectiviteRole.LECTURE,
      });
      const reader = app.get(TrpcRouter).createCaller({
        user: getAuthUserFromUserCredentials({ id: testUserId, email: null }),
      });
      const average = () =>
        reader.indicateurs.valeurs.average({
          collectiviteId: fixture.collectiviteId,
          indicateurId: fixture.source.id,
        });
      expect(await average()).toMatchObject({ valeurs: [] });
      await fixture.importValeurs([
        {
          indicateurId: fixture.source.id,
          metadonneeId: insee.id,
          resultat: 10,
        },
      ]);
      expect(await average()).toMatchObject({
        valeurs: [{ dateValeur: '2025-01-01', valeur: 10 }],
      });
    }
  );
});
