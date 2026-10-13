import { INestApplication } from '@nestjs/common';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getAuthUserFromUserCredentials, getTestApp } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  IndicateurPeriodiciteEnum,
  IndicateurPeriodeErrorEnum,
  IndicateurPeriodes,
  MAX_GRID_VALEURS_BATCH_SIZE,
} from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, inArray } from 'drizzle-orm';
import { indicateurDefinitionTable } from '../definitions/indicateur-definition.table';
import { indicateurCollectiviteTable } from '../definitions/indicateur-collectivite.table';
import { inferProcedureInput } from '@trpc/server';
import { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { indicateurValeurTable } from './indicateur-valeur.table';

type InputUpsertMany = inferProcedureInput<
  AppRouter['indicateurs']['valeurs']['upsertMany']
>;

describe('Écriture atomique de lots de valeurs annuelles', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let authenticatedUser: AuthenticatedUser;
  let collectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = app.get(DatabaseService);
    const fixture = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteId = fixture.collectivite.id;
    authenticatedUser = getAuthUserFromUserCredentials(fixture.user);
  });

  afterAll(async () => {
    await app.close();
  });

  const insertAnnualIndicateur = async ({
    sansValeurUtilisateur = false,
  } = {}) => {
    const [definition] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
        collectiviteId,
        titre: 'Indicateur annuel de test',
        unite: 'MWh',
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        sansValeurUtilisateur,
      })
      .returning();
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, definition.id));
    });
    return definition.id;
  };

  test('Écrit douze années indépendantes et conserve zéro comme valeur', async () => {
    const annualIndicateurId = await insertAnnualIndicateur();
    const caller = router.createCaller({ user: authenticatedUser });
    const valeurs: InputUpsertMany['valeurs'] = Array.from(
      { length: 12 },
      (_, index) => ({
        indicateurId: annualIndicateurId,
        period: IndicateurPeriodes.parse(
          IndicateurPeriodiciteEnum.ANNUELLE,
          String(2015 + index)
        ),
        resultat: index,
      })
    );

    await caller.indicateurs.valeurs.upsertMany({ collectiviteId, valeurs });

    const result = await caller.indicateurs.valeurs.list({
      collectiviteId,
      indicateurIds: [annualIndicateurId],
    });
    const saved = result.indicateurs[0].sources.collectivite.valeurs;
    expect(saved).toHaveLength(12);
    expect(saved[0]).toMatchObject({
      dateValeur: '2015-01-01',
      resultat: 0,
    });
    expect(saved[11]).toMatchObject({
      dateValeur: '2026-01-01',
      resultat: 11,
    });
    const [collectiviteMetadata] = await databaseService.db
      .select()
      .from(indicateurCollectiviteTable)
      .where(
        and(
          eq(indicateurCollectiviteTable.collectiviteId, collectiviteId),
          eq(indicateurCollectiviteTable.indicateurId, annualIndicateurId)
        )
      );
    expect(collectiviteMetadata?.modifiedBy).toBe(authenticatedUser.id);
  });

  test('Fusionne résultat et objectif de la même année et applique la précision sans perdre les commentaires', async () => {
    const indicateurId = await insertAnnualIndicateur();
    await databaseService.db
      .update(indicateurDefinitionTable)
      .set({ precision: 2 })
      .where(eq(indicateurDefinitionTable.id, indicateurId));
    const caller = router.createCaller({ user: authenticatedUser });
    const saved = await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId,
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      dateValeur: '2026-01-01',
      resultat: 4,
      resultatCommentaire: 'Commentaire conservé',
    });
    assert.isDefined(saved);
    const period = {
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      dateDebut: '2026-01-01',
    } as const;
    await caller.indicateurs.valeurs.upsertMany({
      collectiviteId,
      valeurs: [
        { indicateurId, period, resultat: 1.2345 },
        { indicateurId, period, objectif: 9.8765 },
      ],
    });
    const readValues = () =>
      databaseService.db
        .select()
        .from(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, indicateurId));
    expect(await readValues()).toMatchObject([
      {
        id: saved.id,
        dateValeur: '2026-01-01',
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        resultat: 1.23,
        objectif: 9.88,
        resultatCommentaire: 'Commentaire conservé',
        calculAuto: false,
      },
    ]);
    await caller.indicateurs.valeurs.upsertMany({
      collectiviteId,
      valeurs: [{ indicateurId, period, resultat: null }],
    });
    expect(await readValues()).toMatchObject([
      {
        id: saved.id,
        resultat: null,
        objectif: 9.88,
        resultatCommentaire: 'Commentaire conservé',
      },
    ]);
  });

  test.each(['périodicité incompatible', 'indicateur inexistant'] as const)(
    'Refuse le lot entier avec %s',
    async (invalidCase) => {
      const indicateurId = await insertAnnualIndicateur();
      const caller = router.createCaller({ user: authenticatedUser });
      await expect(
        caller.indicateurs.valeurs.upsertMany({
          collectiviteId,
          valeurs: [
            {
              indicateurId,
              period: {
                periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
                dateDebut: '2026-01-01',
              },
              resultat: 1,
            },
            {
              indicateurId:
                invalidCase === 'indicateur inexistant'
                  ? 2147483647
                  : indicateurId,
              period: {
                periodicite:
                  invalidCase === 'périodicité incompatible'
                    ? IndicateurPeriodiciteEnum.MENSUELLE
                    : IndicateurPeriodiciteEnum.ANNUELLE,
                dateDebut: '2026-01-01',
              },
              resultat: 2,
            },
          ],
        })
      ).rejects.toMatchObject({
        code:
          invalidCase === 'indicateur inexistant' ? 'NOT_FOUND' : 'BAD_REQUEST',
      });
      expect(
        await databaseService.db
          .select()
          .from(indicateurValeurTable)
          .where(eq(indicateurValeurTable.indicateurId, indicateurId))
      ).toHaveLength(0);
    }
  );

  test.each(['vide', 'trop volumineux', 'sans valeur'] as const)(
    'Refuse un lot %s à la frontière tRPC sans écrire',
    async (invalidCase) => {
      const indicateurId = await insertAnnualIndicateur();
      const caller = router.createCaller({ user: authenticatedUser });
      const valeur = {
        indicateurId,
        period: {
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
          dateDebut: '2026-01-01',
        },
      } as const;
      const valeurs =
        invalidCase === 'vide'
          ? []
          : invalidCase === 'sans valeur'
          ? [valeur]
          : Array.from({ length: MAX_GRID_VALEURS_BATCH_SIZE + 1 }, () => ({
              ...valeur,
              resultat: 1,
            }));
      await expect(
        caller.indicateurs.valeurs.upsertMany({ collectiviteId, valeurs })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
      expect(
        await databaseService.db
          .select()
          .from(indicateurValeurTable)
          .where(eq(indicateurValeurTable.indicateurId, indicateurId))
      ).toHaveLength(0);
    }
  );

  test('Rejette atomiquement le lot si une période annuelle est non canonique', async () => {
    const annualIndicateurId = await insertAnnualIndicateur();
    const caller = router.createCaller({ user: authenticatedUser });

    await expect(
      caller.indicateurs.valeurs.upsertMany({
        collectiviteId,
        valeurs: [
          {
            indicateurId: annualIndicateurId,
            period: IndicateurPeriodes.parse(
              IndicateurPeriodiciteEnum.ANNUELLE,
              '2026'
            ),
            resultat: 1,
          },
          {
            indicateurId: annualIndicateurId,
            period: {
              periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
              dateDebut: '2026-02-02',
            } as never,
            resultat: 2,
          },
        ],
      })
    ).rejects.toThrow(
      IndicateurPeriodeErrorEnum.INDICATEUR_PERIODE_DATE_NON_CANONICAL
    );

    const saved = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          eq(indicateurValeurTable.indicateurId, annualIndicateurId)
        )
      );
    expect(saved).toHaveLength(0);
  });

  test("Rejette tout le lot si un indicateur n'accepte pas de valeur utilisateur", async () => {
    const writableIndicateurId = await insertAnnualIndicateur();
    const protectedIndicateurId = await insertAnnualIndicateur({
      sansValeurUtilisateur: true,
    });
    const caller = router.createCaller({ user: authenticatedUser });

    await expect(
      caller.indicateurs.valeurs.upsertMany({
        collectiviteId,
        valeurs: [
          {
            indicateurId: writableIndicateurId,
            period: IndicateurPeriodes.parse(
              IndicateurPeriodiciteEnum.ANNUELLE,
              '2026'
            ),
            resultat: 1,
          },
          {
            indicateurId: protectedIndicateurId,
            period: IndicateurPeriodes.parse(
              IndicateurPeriodiciteEnum.ANNUELLE,
              '2026'
            ),
            resultat: 2,
          },
        ],
      })
    ).rejects.toThrow(/n'accepte pas de valeur utilisateur/);

    const saved = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(
        inArray(indicateurValeurTable.indicateurId, [
          writableIndicateurId,
          protectedIndicateurId,
        ])
      );
    expect(saved).toHaveLength(0);
  });

  test("Une clé d'API en lecture seule ne peut pas écrire un lot de grille avec les droits de son propriétaire", async () => {
    const annualIndicateurId = await insertAnnualIndicateur();
    const readOnlyApiKeyUser: AuthenticatedUser = {
      ...authenticatedUser,
      jwtPayload: {
        ...authenticatedUser.jwtPayload,
        client_id: 'test-read-only-grid-key',
        permissions: [
          'indicateurs.indicateurs.read',
          'indicateurs.valeurs.read',
        ],
      },
    };
    const caller = router.createCaller({ user: readOnlyApiKeyUser });

    await expect(
      caller.indicateurs.valeurs.upsertMany({
        collectiviteId,
        valeurs: [
          {
            indicateurId: annualIndicateurId,
            period: IndicateurPeriodes.parse(
              IndicateurPeriodiciteEnum.ANNUELLE,
              '2026'
            ),
            resultat: 1,
          },
        ],
      })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      cause: expect.objectContaining({
        message: expect.stringMatching(
          /clé d'api.*indicateurs\.valeurs\.mutate/i
        ),
      }),
    });

    const saved = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          eq(indicateurValeurTable.indicateurId, annualIndicateurId)
        )
      );
    expect(saved).toHaveLength(0);
  });

  test('Une saisie manuelle efface le résultat sans perdre l objectif et remplace le calcul automatique', async () => {
    const annualIndicateurId = await insertAnnualIndicateur();
    const [existing] = await databaseService.db
      .insert(indicateurValeurTable)
      .values({
        indicateurId: annualIndicateurId,
        collectiviteId,
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        dateValeur: '2026-01-01',
        resultat: 10,
        objectif: 12,
        calculAuto: true,
        calculAutoIdentifiantsManquants: ['source_manquante'],
      })
      .returning();
    const caller = router.createCaller({ user: authenticatedUser });

    await caller.indicateurs.valeurs.upsertMany({
      collectiviteId,
      valeurs: [
        {
          indicateurId: annualIndicateurId,
          period: IndicateurPeriodes.parse(
            IndicateurPeriodiciteEnum.ANNUELLE,
            '2026'
          ),
          resultat: null,
        },
      ],
    });

    const [saved] = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(eq(indicateurValeurTable.id, existing.id));
    expect(saved).toMatchObject({
      resultat: null,
      objectif: 12,
      calculAuto: false,
      calculAutoIdentifiantsManquants: null,
    });
  });
  test('Autorise un utilisateur en édition limitée uniquement après son affectation comme pilote', async () => {
    const indicateurId = await insertAnnualIndicateur();
    const { user } = await addTestUser(databaseService, {
      collectiviteId,
      role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
    });
    const limitedUser = getAuthUserFromUserCredentials(user);
    const caller = router.createCaller({ user: limitedUser });
    const input: InputUpsertMany = {
      collectiviteId,
      valeurs: [
        {
          indicateurId,
          period: IndicateurPeriodes.parse(
            IndicateurPeriodiciteEnum.ANNUELLE,
            '2026'
          ),
          resultat: 0,
        },
      ],
    };
    await expect(
      caller.indicateurs.valeurs.upsertMany(input)
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await router
      .createCaller({ user: authenticatedUser })
      .indicateurs.indicateurs.update({
        collectiviteId,
        indicateurId,
        indicateurFields: { pilotes: [{ userId: limitedUser.id }] },
      });
    await expect(
      caller.indicateurs.valeurs.upsertMany(input)
    ).resolves.toMatchObject([{ resultat: 0 }]);
  });
});
