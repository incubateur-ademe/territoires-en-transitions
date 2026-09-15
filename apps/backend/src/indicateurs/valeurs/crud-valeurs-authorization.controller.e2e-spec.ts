import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createGroupement } from '@tet/backend/collectivites/shared/models/groupement.test-fixture';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import {
  getTestApp,
  getTestDatabase,
  signTestAuthToken,
} from '@tet/backend/test';
import { AuthRole } from '@tet/backend/users/models/auth.models';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray } from 'drizzle-orm';
import request from 'supertest';

describe("Autorisation REST des valeurs d'indicateur", () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let collectiviteId: number;
  let authenticatedToken: string;
  let serviceRoleToken: string;
  let cleanupCollectiviteAndUser: () => Promise<void>;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    const fixture = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteId = fixture.collectivite.id;
    cleanupCollectiviteAndUser = fixture.cleanup;

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
});
