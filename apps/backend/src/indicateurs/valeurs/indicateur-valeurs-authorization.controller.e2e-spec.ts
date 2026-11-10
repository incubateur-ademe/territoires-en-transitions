import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createGroupement } from '@tet/backend/collectivites/shared/models/groupement.test-fixture';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { GenerateImportDraftWorker } from '@tet/backend/plans/ai-plan-import/generate-import-draft/generate-import-draft.worker';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
  signTestAuthToken,
} from '@tet/backend/test';
import {
  AuthenticatedUser,
  AuthRole,
} from '@tet/backend/users/models/auth.models';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  ELECTRIFICATION_SOURCE_ID,
  INDICATEUR_SOURCES_WITH_DEDICATED_METADATA,
  PCAET_COLLECTIVITE_SOURCE_ID,
} from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray } from 'drizzle-orm';
import request from 'supertest';
import { indicateurSourceMetadonneeTable } from '../shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '../shared/models/indicateur-source.table';
import ManageIndicateurValeursService from './manage-indicateur-valeurs/manage-indicateur-valeurs.service';

describe("Autorisation REST des valeurs d'indicateur", () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let collectiviteId: number;
  let authenticatedToken: string;
  let authenticatedUser: AuthenticatedUser;
  let router: TrpcRouter;
  let serviceRoleToken: string;
  let cleanupCollectiviteAndUser: () => Promise<void>;

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
    router = app.get(TrpcRouter);
    const fixture = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteId = fixture.collectivite.id;
    cleanupCollectiviteAndUser = fixture.cleanup;
    authenticatedUser = getAuthUserFromUserCredentials(fixture.user);

    const jwtSecret = app.get(ConfigurationService).get('SUPABASE_JWT_SECRET');
    authenticatedToken = signTestAuthToken(
      { role: AuthRole.AUTHENTICATED, sub: fixture.user.id },
      jwtSecret
    );
    serviceRoleToken = signTestAuthToken(
      { role: AuthRole.SERVICE_ROLE },
      jwtSecret
    );
  });

  afterAll(async () => {
    await cleanupCollectiviteAndUser?.();
    await app?.close();
  });

  it("ne divulgue pas la définition personnalisée d'une autre collectivité", async () => {
    const { collectivite: otherCollectivite, cleanup } =
      await addTestCollectivite(databaseService);
    const [foreignIndicateur] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
        collectiviteId: otherCollectivite.id,
        titre: 'Indicateur privé à masquer',
        unite: 't',
        periodicite: 'annuelle',
      })
      .returning();

    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, foreignIndicateur.id));
      await cleanup();
    });

    const response = await request(app.getHttpServer())
      .get(
        `/indicateurs/valeurs?collectiviteId=${collectiviteId}&indicateurIds=${foreignIndicateur.id}`
      )
      .set('Authorization', `Bearer ${authenticatedToken}`)
      .expect(200);

    expect(response.body).toEqual({ count: 0, indicateurs: [] });
  });

  it("refuse d'écrire une valeur pour la définition personnalisée d'une autre collectivité", async () => {
    const { collectivite: otherCollectivite, cleanup } =
      await addTestCollectivite(databaseService);
    const [foreignIndicateur] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
        collectiviteId: otherCollectivite.id,
        titre: 'Indicateur privé à une autre collectivité',
        unite: 't',
        periodicite: 'annuelle',
      })
      .returning();

    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, foreignIndicateur.id));
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, foreignIndicateur.id));
      await cleanup();
    });

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authenticatedToken}`)
      .send({
        valeurs: [
          {
            collectiviteId,
            indicateurId: foreignIndicateur.id,
            dateValeur: '2026-01-01',
            resultat: 42,
          },
        ],
      })
      .expect(400);

    expect(response.body.message).toContain(
      `Indicateur ${foreignIndicateur.id} non disponible pour la collectivité ${collectiviteId}`
    );
    await expect(
      databaseService.db
        .select()
        .from(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, foreignIndicateur.id))
    ).resolves.toEqual([]);
  });

  it("refuse atomiquement un lot contenant un indicateur de groupement dont la collectivité n'est pas membre", async () => {
    const groupement = await createGroupement({
      database: databaseService,
      groupementData: { nom: 'Groupement non membre' },
    });
    const indicateurs = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values([
        {
          identifiantReferentiel: `test_${randomUUID()}`,
          titre: 'Indicateur global autorisé',
          unite: 't',
          periodicite: 'annuelle',
        },
        {
          identifiantReferentiel: `test_${randomUUID()}`,
          groupementId: groupement.id,
          titre: 'Indicateur de groupement interdit',
          unite: 't',
          periodicite: 'annuelle',
        },
      ])
      .returning();
    const indicateurIds = indicateurs.map(({ id }) => id);

    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurValeurTable)
        .where(inArray(indicateurValeurTable.indicateurId, indicateurIds));
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(inArray(indicateurDefinitionTable.id, indicateurIds));
      await groupement.cleanup();
    });

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authenticatedToken}`)
      .send({
        valeurs: indicateurs.map(({ id }, index) => ({
          collectiviteId,
          indicateurId: id,
          dateValeur: '2026-01-01',
          resultat: index + 1,
        })),
      })
      .expect(400);

    expect(response.body.message).toContain(
      `Indicateur ${indicateurs[1].id} non disponible pour la collectivité ${collectiviteId}`
    );
    await expect(
      databaseService.db
        .select()
        .from(indicateurValeurTable)
        .where(inArray(indicateurValeurTable.indicateurId, indicateurIds))
    ).resolves.toEqual([]);
  });

  it("autorise l'écriture d'un indicateur de groupement pour une collectivité membre", async () => {
    const groupement = await createGroupement({
      database: databaseService,
      groupementData: {
        nom: 'Groupement membre',
        collectiviteIds: [collectiviteId],
      },
    });
    const [indicateur] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
        identifiantReferentiel: `test_${randomUUID()}`,
        groupementId: groupement.id,
        titre: 'Indicateur de groupement autorisé',
        unite: 't',
        periodicite: 'annuelle',
      })
      .returning();

    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, indicateur.id));
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateur.id));
      await groupement.cleanup();
    });

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authenticatedToken}`)
      .send({
        valeurs: [
          {
            collectiviteId,
            indicateurId: indicateur.id,
            dateValeur: '2026-01-01',
            resultat: 42,
          },
        ],
      })
      .expect(201);

    expect(response.body.valeurs).toEqual([
      expect.objectContaining({
        collectiviteId,
        indicateurId: indicateur.id,
        resultat: 42,
      }),
    ]);
  });

  it("préserve l'écriture service-role pour une collectivité non membre", async () => {
    const groupement = await createGroupement({
      database: databaseService,
      groupementData: { nom: 'Groupement réservé au traitement interne' },
    });
    const [indicateur] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
        identifiantReferentiel: `test_${randomUUID()}`,
        groupementId: groupement.id,
        titre: 'Indicateur de traitement interne',
        unite: 'MWh',
        periodicite: 'annuelle',
        sansValeurUtilisateur: true,
      })
      .returning();

    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, indicateur.id));
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateur.id));
      await groupement.cleanup();
    });

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${serviceRoleToken}`)
      .send({
        valeurs: [
          {
            collectiviteId,
            indicateurId: indicateur.id,
            dateValeur: '2026-01-01',
            resultat: 42,
          },
        ],
      })
      .expect(201);

    expect(response.body.valeurs).toEqual([
      expect.objectContaining({
        collectiviteId,
        indicateurId: indicateur.id,
        resultat: 42,
      }),
    ]);
  });

  const createMetadataFixture = async (
    options: { sourceId?: string; sansValeurUtilisateur?: boolean } = {}
  ) => {
    const [indicateur] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
        identifiantReferentiel: `test_${randomUUID()}`,
        titre: 'Indicateur de contrôle de provenance',
        unite: 't',
        periodicite: 'annuelle',
        sansValeurUtilisateur: options.sansValeurUtilisateur ?? false,
      })
      .returning();
    const sourceId = options.sourceId ?? `authorization-${indicateur.id}`;
    await databaseService.db
      .insert(indicateurSourceTable)
      .values({ id: sourceId, libelle: 'Source de contrôle de provenance' })
      .onConflictDoNothing();
    const [metadata] = await databaseService.db
      .insert(indicateurSourceMetadonneeTable)
      .values({ sourceId, dateVersion: '2026-01-01' })
      .returning();
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, indicateur.id));
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateur.id));
      await databaseService.db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.id, metadata.id));
      if (!options.sourceId) {
        await databaseService.db
          .delete(indicateurSourceTable)
          .where(eq(indicateurSourceTable.id, sourceId));
      }
    });
    const valeur = {
      collectiviteId,
      indicateurId: indicateur.id,
      dateValeur: '2026-01-01',
      metadonneeId: metadata.id,
      resultat: 42,
    };
    const readValeurs = () =>
      databaseService.db
        .select()
        .from(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, indicateur.id));
    return { valeur, readValeurs, sourceId };
  };

  it.each(['externe', 'PCAET', 'Électrification', 'contexte falsifié'])(
    'refuse la création REST authentifiée sous métadonnée %s',
    async (scenario) => {
      const { valeur, readValeurs } = await createMetadataFixture({
        sourceId:
          scenario === 'externe'
            ? undefined
            : scenario === 'PCAET'
            ? PCAET_COLLECTIVITE_SOURCE_ID
            : ELECTRIFICATION_SOURCE_ID,
      });
      const spoofedContext =
        scenario === 'contexte falsifié'
          ? {
              isUserTrusted: true,
              metadataAuthorization: {
                collectiviteId,
                metadonneeId: valeur.metadonneeId,
                sourceId: ELECTRIFICATION_SOURCE_ID,
              },
            }
          : {};
      await request(app.getHttpServer())
        .post('/indicateurs/valeurs')
        .set('Authorization', `Bearer ${authenticatedToken}`)
        .send({
          valeurs: [{ ...valeur, ...spoofedContext }],
          ...spoofedContext,
        })
        .expect(403);
      await expect(readValeurs()).resolves.toEqual([]);
    }
  );

  it('préserve intégralement une observation externe face à un remplacement REST authentifié', async () => {
    const { valeur, readValeurs } = await createMetadataFixture();
    await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${serviceRoleToken}`)
      .send({
        valeurs: [{ ...valeur, resultatCommentaire: 'Source originale' }],
      })
      .expect(201);
    const before = await readValeurs();
    expect(before).toHaveLength(1);
    await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authenticatedToken}`)
      .send({
        valeurs: [
          { ...valeur, resultat: 99, resultatCommentaire: 'Remplacement' },
        ],
      })
      .expect(403);
    expect(await readValeurs()).toEqual(before);
  });

  it('refuse tout le lot si une saisie locale accompagne une provenance interdite', async () => {
    const { valeur, readValeurs } = await createMetadataFixture();
    await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authenticatedToken}`)
      .send({ valeurs: [{ ...valeur, metadonneeId: null }, valeur] })
      .expect(403);
    await expect(readValeurs()).resolves.toEqual([]);
  });

  it('conserve la création, la modification REST et la suppression tRPC des saisies locales', async () => {
    const { valeur, readValeurs } = await createMetadataFixture();
    for (const resultat of [42, 99]) {
      await request(app.getHttpServer())
        .post('/indicateurs/valeurs')
        .set('Authorization', `Bearer ${authenticatedToken}`)
        .send({
          valeurs: [
            {
              ...valeur,
              metadonneeId: null,
              resultat,
              calculAuto: true,
              calculAutoIdentifiantsManquants: ['calcul_falsifie'],
            },
          ],
        })
        .expect(201);
    }
    const rows = await readValeurs();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      resultat: 99,
      metadonneeId: null,
      calculAuto: false,
      calculAutoIdentifiantsManquants: null,
      createdBy: authenticatedUser.id,
      modifiedBy: authenticatedUser.id,
    });
    const caller = router.createCaller({ user: authenticatedUser });
    await caller.indicateurs.valeurs.delete({
      collectiviteId,
      indicateurId: valeur.indicateurId,
      id: rows[0].id,
    });
    await expect(readValeurs()).resolves.toEqual([]);
  });

  it('ne modifie ni ne supprime une observation externe via les routes tRPC de saisie', async () => {
    const { valeur, readValeurs } = await createMetadataFixture();
    await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${serviceRoleToken}`)
      .send({ valeurs: [valeur] })
      .expect(201);
    const before = await readValeurs();
    expect(before).toHaveLength(1);
    const caller = router.createCaller({ user: authenticatedUser });
    const key = {
      collectiviteId,
      indicateurId: valeur.indicateurId,
      id: before[0].id,
    };
    await caller.indicateurs.valeurs.upsert({ ...key, resultat: 99 });
    await caller.indicateurs.valeurs.delete(key);
    expect(await readValeurs()).toEqual(before);
  });

  it('préserve les imports service-role avec métadonnées sur un indicateur protégé', async () => {
    const { valeur, readValeurs } = await createMetadataFixture({
      sansValeurUtilisateur: true,
    });
    for (const resultat of [42, 99]) {
      await request(app.getHttpServer())
        .post('/indicateurs/valeurs')
        .set('Authorization', `Bearer ${serviceRoleToken}`)
        .send({ valeurs: [{ ...valeur, resultat }] })
        .expect(201);
    }
    expect(await readValeurs()).toEqual([
      expect.objectContaining({ ...valeur, resultat: 99 }),
    ]);
  });

  describe.each(INDICATEUR_SOURCES_WITH_DEDICATED_METADATA)(
    'Autorisation interne de la source %s',
    (sourceId) => {
      it.each(['collectivité', 'métadonnée', 'source', 'source externe'])(
        'refuse un périmètre différent : %s',
        async (scope) => {
          const {
            valeur,
            readValeurs,
            sourceId: actualSourceId,
          } = await createMetadataFixture({
            sourceId: scope === 'source externe' ? undefined : sourceId,
          });
          await expect(
            app
              .get(ManageIndicateurValeursService)
              .upsertIndicateurValeurs([valeur], {
                user: authenticatedUser,
                metadataAuthorization: {
                  collectiviteId:
                    collectiviteId + (scope === 'collectivité' ? 1 : 0),
                  metadonneeId:
                    valeur.metadonneeId + (scope === 'métadonnée' ? 1 : 0),
                  sourceId:
                    scope === 'source'
                      ? sourceId === PCAET_COLLECTIVITE_SOURCE_ID
                        ? ELECTRIFICATION_SOURCE_ID
                        : PCAET_COLLECTIVITE_SOURCE_ID
                      : actualSourceId,
                },
              })
          ).rejects.toThrow('une autorisation interne dédiée');
          await expect(readValeurs()).resolves.toEqual([]);
        }
      );

      it('enregistre sous la métadonnée autorisée en conservant l’auteur', async () => {
        const { valeur, readValeurs } = await createMetadataFixture({
          sourceId,
        });
        await app
          .get(ManageIndicateurValeursService)
          .upsertIndicateurValeurs([{ ...valeur, calculAuto: true }], {
            user: authenticatedUser,
            metadataAuthorization: {
              collectiviteId,
              metadonneeId: valeur.metadonneeId,
              sourceId,
            },
          });
        expect(await readValeurs()).toEqual([
          expect.objectContaining({
            ...valeur,
            calculAuto: false,
            createdBy: authenticatedUser.id,
            modifiedBy: authenticatedUser.id,
          }),
        ]);
      });

      it('conserve la protection des indicateurs sans valeur utilisateur', async () => {
        const { valeur, readValeurs } = await createMetadataFixture({
          sourceId,
          sansValeurUtilisateur: true,
        });
        await expect(
          app
            .get(ManageIndicateurValeursService)
            .upsertIndicateurValeurs([valeur], {
              user: authenticatedUser,
              metadataAuthorization: {
                collectiviteId,
                metadonneeId: valeur.metadonneeId,
                sourceId,
              },
            })
        ).rejects.toThrow("n'acceptent pas de valeur utilisateur");
        await expect(readValeurs()).resolves.toEqual([]);
      });

      it('contrôle la périodicité sous métadonnée', async () => {
        const { valeur, readValeurs } = await createMetadataFixture({
          sourceId,
        });
        await expect(
          app
            .get(ManageIndicateurValeursService)
            .upsertIndicateurValeurs(
              [{ ...valeur, periodicite: 'mensuelle' }],
              {
                user: authenticatedUser,
                metadataAuthorization: {
                  collectiviteId,
                  metadonneeId: valeur.metadonneeId,
                  sourceId,
                },
              }
            )
        ).rejects.toThrow('respecter la périodicité');
        await expect(readValeurs()).resolves.toEqual([]);
      });
    }
  );
});
