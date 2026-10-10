import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createGroupement } from '@tet/backend/collectivites/shared/models/groupement.test-fixture';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  signTestAuthToken,
} from '@tet/backend/test';
import {
  AuthenticatedUser,
  AuthRole,
} from '@tet/backend/users/models/auth.models';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { PCAET_COLLECTIVITE_SOURCE_ID } from '@tet/domain/indicateurs';
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
    app = await getTestApp();
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
    const [foreignDefinition] = await databaseService.db
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
        .where(eq(indicateurDefinitionTable.id, foreignDefinition.id));
      await cleanup();
    });

    const response = await request(app.getHttpServer())
      .get(
        `/indicateurs/valeurs?collectiviteId=${collectiviteId}&indicateurIds=${foreignDefinition.id}`
      )
      .set('Authorization', `Bearer ${authenticatedToken}`)
      .expect(200);

    expect(response.body).toEqual({ count: 0, indicateurs: [] });
  });

  it("refuse d'écrire une valeur pour la définition personnalisée d'une autre collectivité", async () => {
    const { collectivite: otherCollectivite, cleanup } =
      await addTestCollectivite(databaseService);
    const [foreignDefinition] = await databaseService.db
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
        .where(eq(indicateurValeurTable.indicateurId, foreignDefinition.id));
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, foreignDefinition.id));
      await cleanup();
    });

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authenticatedToken}`)
      .send({
        valeurs: [
          {
            collectiviteId,
            indicateurId: foreignDefinition.id,
            dateValeur: '2026-01-01',
            resultat: 42,
          },
        ],
      })
      .expect(400);

    expect(response.body.message).toContain(
      `Indicateur ${foreignDefinition.id} non disponible pour la collectivité ${collectiviteId}`
    );
    await expect(
      databaseService.db
        .select()
        .from(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, foreignDefinition.id))
    ).resolves.toEqual([]);
  });

  it("refuse atomiquement un lot contenant un indicateur de groupement dont la collectivité n'est pas membre", async () => {
    const groupement = await createGroupement({
      database: databaseService,
      groupementData: { nom: 'Groupement non membre' },
    });
    const definitions = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values([
        {
          titre: 'Indicateur global autorisé',
          unite: 't',
          periodicite: 'annuelle',
        },
        {
          groupementId: groupement.id,
          titre: 'Indicateur de groupement interdit',
          unite: 't',
          periodicite: 'annuelle',
        },
      ])
      .returning();
    const definitionIds = definitions.map(({ id }) => id);

    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurValeurTable)
        .where(inArray(indicateurValeurTable.indicateurId, definitionIds));
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(inArray(indicateurDefinitionTable.id, definitionIds));
      await groupement.cleanup();
    });

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authenticatedToken}`)
      .send({
        valeurs: definitions.map(({ id }, index) => ({
          collectiviteId,
          indicateurId: id,
          dateValeur: '2026-01-01',
          resultat: index + 1,
        })),
      })
      .expect(400);

    expect(response.body.message).toContain(
      `Indicateur ${definitions[1].id} non disponible pour la collectivité ${collectiviteId}`
    );
    await expect(
      databaseService.db
        .select()
        .from(indicateurValeurTable)
        .where(inArray(indicateurValeurTable.indicateurId, definitionIds))
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
    const [definition] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
        groupementId: groupement.id,
        titre: 'Indicateur de groupement autorisé',
        unite: 't',
        periodicite: 'annuelle',
      })
      .returning();

    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, definition.id));
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, definition.id));
      await groupement.cleanup();
    });

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${authenticatedToken}`)
      .send({
        valeurs: [
          {
            collectiviteId,
            indicateurId: definition.id,
            dateValeur: '2026-01-01',
            resultat: 42,
          },
        ],
      })
      .expect(201);

    expect(response.body.valeurs).toEqual([
      expect.objectContaining({
        collectiviteId,
        indicateurId: definition.id,
        resultat: 42,
      }),
    ]);
  });

  it("préserve l'écriture service-role pour une collectivité non membre", async () => {
    const groupement = await createGroupement({
      database: databaseService,
      groupementData: { nom: 'Groupement réservé au traitement interne' },
    });
    const [definition] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
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
        .where(eq(indicateurValeurTable.indicateurId, definition.id));
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, definition.id));
      await groupement.cleanup();
    });

    const response = await request(app.getHttpServer())
      .post('/indicateurs/valeurs')
      .set('Authorization', `Bearer ${serviceRoleToken}`)
      .send({
        valeurs: [
          {
            collectiviteId,
            indicateurId: definition.id,
            dateValeur: '2026-01-01',
            resultat: 42,
          },
        ],
      })
      .expect(201);

    expect(response.body.valeurs).toEqual([
      expect.objectContaining({
        collectiviteId,
        indicateurId: definition.id,
        resultat: 42,
      }),
    ]);
  });

  const createMetadataFixture = async (
    options: { pcaet?: boolean; sansValeurUtilisateur?: boolean } = {}
  ) => {
    const [definition] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
        titre: 'Indicateur de contrôle de provenance',
        unite: 't',
        periodicite: 'annuelle',
        sansValeurUtilisateur: options.sansValeurUtilisateur ?? false,
      })
      .returning();
    const sourceId = options.pcaet
      ? PCAET_COLLECTIVITE_SOURCE_ID
      : `authorization-${definition.id}`;
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
        .where(eq(indicateurValeurTable.indicateurId, definition.id));
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, definition.id));
      await databaseService.db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.id, metadata.id));
      if (!options.pcaet) {
        await databaseService.db
          .delete(indicateurSourceTable)
          .where(eq(indicateurSourceTable.id, sourceId));
      }
    });
    const valeur = {
      collectiviteId,
      indicateurId: definition.id,
      dateValeur: '2026-01-01',
      metadonneeId: metadata.id,
      resultat: 42,
    };
    const readValeurs = () =>
      databaseService.db
        .select()
        .from(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, definition.id));
    return { valeur, readValeurs };
  };

  it.each(['externe', 'PCAET', 'contexte falsifié'])(
    'refuse la création REST authentifiée sous métadonnée %s',
    async (scenario) => {
      const { valeur, readValeurs } = await createMetadataFixture({
        pcaet: scenario !== 'externe',
      });
      const spoofedContext =
        scenario === 'contexte falsifié'
          ? {
              isUserTrusted: true,
              pcaetMetadataAuthorization: {
                collectiviteId,
                metadonneeId: valeur.metadonneeId,
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

  it.each(['collectivité', 'métadonnée', 'source externe'])(
    'borne la capacité PCAET interne : %s',
    async (scope) => {
      const { valeur, readValeurs } = await createMetadataFixture({
        pcaet: scope !== 'source externe',
      });
      await expect(
        app
          .get(ManageIndicateurValeursService)
          .upsertIndicateurValeurs([valeur], {
            user: authenticatedUser,
            pcaetMetadataAuthorization: {
              collectiviteId:
                collectiviteId + (scope === 'collectivité' ? 1 : 0),
              metadonneeId:
                valeur.metadonneeId + (scope === 'métadonnée' ? 1 : 0),
            },
          })
      ).rejects.toThrow('une autorisation interne dédiée');
      await expect(readValeurs()).resolves.toEqual([]);
    }
  );

  it('conserve les règles utilisateur avec une capacité PCAET interne valide', async () => {
    const { valeur, readValeurs } = await createMetadataFixture({
      pcaet: true,
      sansValeurUtilisateur: true,
    });
    await expect(
      app
        .get(ManageIndicateurValeursService)
        .upsertIndicateurValeurs([valeur], {
          user: authenticatedUser,
          pcaetMetadataAuthorization: {
            collectiviteId,
            metadonneeId: valeur.metadonneeId,
          },
        })
    ).rejects.toThrow("n'acceptent pas de valeur utilisateur");
    await expect(readValeurs()).resolves.toEqual([]);
  });
});
