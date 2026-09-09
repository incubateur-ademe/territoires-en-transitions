import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  deleteIndicateurValeursForCollectivite,
  getAuthUserFromUserCredentials,
  getIndicateurIdByIdentifiant,
  getTestApp,
  insertFixtureIndicateurPourValeursReference,
  TEST_INDICATEUR_VALEURS_REFERENCE_REFERENTIEL_IDENTIFIANT,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { Collectivite } from '@tet/domain/collectivites';
import { IndicateurPeriods } from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import { and, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { DatabaseService } from '../../utils/database/database.service';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { indicateurCollectiviteTable } from '../definitions/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '../definitions/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '../shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '../shared/models/indicateur-source.table';
import { getIndicateursValeursResponseSchema } from './get-indicateur-valeurs.response';
import { indicateurValeurTable } from './indicateur-valeur.table';

type InputList = inferProcedureInput<
  AppRouter['indicateurs']['valeurs']['list']
>;

type InputUpsert = inferProcedureInput<
  AppRouter['indicateurs']['valeurs']['upsert']
>;
type InputUpsertMany = inferProcedureInput<
  AppRouter['indicateurs']['valeurs']['upsertMany']
>;

// Platform indicateur (shared across all collectivites)
const indicateurId = 1;

describe("Route de lecture/écriture des valeurs d'indicateurs", () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;
  let databaseService: DatabaseService;
  let collectivite: Collectivite;
  let collectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = app.get<DatabaseService>(DatabaseService);

    // Create isolated collectivite for CRUD tests
    const testResult = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    collectiviteId = collectivite.id;
    authenticatedUser = getAuthUserFromUserCredentials(testResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // reset les données avant de commencer les tests
    await databaseService.db
      .delete(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          eq(indicateurValeurTable.indicateurId, indicateurId)
        )
      );
  });

  const insertMonthlyIndicateur = async ({
    sansValeurUtilisateur = false,
  }: { sansValeurUtilisateur?: boolean } = {}) => {
    const [definition] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
        collectiviteId,
        titre: 'Indicateur mensuel de test',
        unite: 'MWh',
        periodicite: 'mensuelle',
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

  test('Écrit douze mois indépendants et conserve zéro comme valeur', async () => {
    const monthlyIndicateurId = await insertMonthlyIndicateur();
    const caller = router.createCaller({ user: authenticatedUser });
    const valeurs: InputUpsertMany['valeurs'] = Array.from(
      { length: 12 },
      (_, index) => ({
        indicateurId: monthlyIndicateurId,
        period: IndicateurPeriods.parse(
          'mensuelle',
          `2026-${String(index + 1).padStart(2, '0')}`
        ),
        resultat: index,
      })
    );

    await caller.indicateurs.valeurs.upsertMany({ collectiviteId, valeurs });

    const result = await caller.indicateurs.valeurs.list({
      collectiviteId,
      indicateurIds: [monthlyIndicateurId],
    });
    const saved = result.indicateurs[0].sources.collectivite.valeurs;
    expect(saved).toHaveLength(12);
    expect(saved[0]).toMatchObject({
      dateValeur: '2026-01-01',
      resultat: 0,
    });
    expect(saved[11]).toMatchObject({
      dateValeur: '2026-12-01',
      resultat: 11,
    });
    const [collectiviteMetadata] = await databaseService.db
      .select()
      .from(indicateurCollectiviteTable)
      .where(
        and(
          eq(indicateurCollectiviteTable.collectiviteId, collectiviteId),
          eq(indicateurCollectiviteTable.indicateurId, monthlyIndicateurId)
        )
      );
    expect(collectiviteMetadata?.modifiedBy).toBe(authenticatedUser.id);
  });

  test('Rejette atomiquement le lot si une période mensuelle est non canonique', async () => {
    const monthlyIndicateurId = await insertMonthlyIndicateur();
    const caller = router.createCaller({ user: authenticatedUser });

    await expect(
      caller.indicateurs.valeurs.upsertMany({
        collectiviteId,
        valeurs: [
          {
            indicateurId: monthlyIndicateurId,
            period: IndicateurPeriods.parse('mensuelle', '2026-01'),
            resultat: 1,
          },
          {
            indicateurId: monthlyIndicateurId,
            period: {
              periodicite: 'mensuelle',
              dateDebut: '2026-02-02',
            } as never,
            resultat: 2,
          },
        ],
      })
    ).rejects.toThrow(/non canonique/);

    const saved = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          eq(indicateurValeurTable.indicateurId, monthlyIndicateurId)
        )
      );
    expect(saved).toHaveLength(0);
  });

  test("Rejette tout le lot si un indicateur n'accepte pas de valeur utilisateur", async () => {
    const writableIndicateurId = await insertMonthlyIndicateur();
    const protectedIndicateurId = await insertMonthlyIndicateur({
      sansValeurUtilisateur: true,
    });
    const caller = router.createCaller({ user: authenticatedUser });

    await expect(
      caller.indicateurs.valeurs.upsertMany({
        collectiviteId,
        valeurs: [
          {
            indicateurId: writableIndicateurId,
            period: IndicateurPeriods.parse('mensuelle', '2026-01'),
            resultat: 1,
          },
          {
            indicateurId: protectedIndicateurId,
            period: IndicateurPeriods.parse('mensuelle', '2026-01'),
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
    const monthlyIndicateurId = await insertMonthlyIndicateur();
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
            indicateurId: monthlyIndicateurId,
            period: IndicateurPeriods.parse('mensuelle', '2026-01'),
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
          eq(indicateurValeurTable.indicateurId, monthlyIndicateurId)
        )
      );
    expect(saved).toHaveLength(0);
  });

  test('Une saisie manuelle efface le résultat sans perdre l objectif et remplace le calcul automatique', async () => {
    const monthlyIndicateurId = await insertMonthlyIndicateur();
    const [existing] = await databaseService.db
      .insert(indicateurValeurTable)
      .values({
        indicateurId: monthlyIndicateurId,
        collectiviteId,
        periodicite: 'mensuelle',
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
          indicateurId: monthlyIndicateurId,
          period: IndicateurPeriods.parse('mensuelle', '2026-01'),
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

  test("L'upsert historique applique aussi l'interdiction de saisie utilisateur", async () => {
    const protectedIndicateurId = await insertMonthlyIndicateur({
      sansValeurUtilisateur: true,
    });
    const caller = router.createCaller({ user: authenticatedUser });

    await expect(
      caller.indicateurs.valeurs.upsert({
        collectiviteId,
        indicateurId: protectedIndicateurId,
        dateValeur: '2026-01-01',
        resultat: 1,
      })
    ).rejects.toThrow(/n'accepte.*pas de valeur utilisateur/);
  });

  test("L'upsert historique remplace un calcul automatique par une saisie manuelle", async () => {
    const monthlyIndicateurId = await insertMonthlyIndicateur();
    const [existing] = await databaseService.db
      .insert(indicateurValeurTable)
      .values({
        indicateurId: monthlyIndicateurId,
        collectiviteId,
        periodicite: 'mensuelle',
        dateValeur: '2026-01-01',
        resultat: 10,
        objectif: 12,
        calculAuto: true,
        calculAutoIdentifiantsManquants: ['source_manquante'],
      })
      .returning();
    const caller = router.createCaller({ user: authenticatedUser });

    await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId: monthlyIndicateurId,
      id: existing.id,
      resultat: null,
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

  test('La suppression refuse une valeur open-data', async () => {
    const monthlyIndicateurId = await insertMonthlyIndicateur();
    const sourceId = `test-${randomUUID()}`;
    await databaseService.db.insert(indicateurSourceTable).values({
      id: sourceId,
      libelle: 'Source de test',
    });
    const [metadonnee] = await databaseService.db
      .insert(indicateurSourceMetadonneeTable)
      .values({
        sourceId,
        dateVersion: '2026-01-01T00:00:00.000Z',
      })
      .returning();
    const [openDataValeur] = await databaseService.db
      .insert(indicateurValeurTable)
      .values({
        indicateurId: monthlyIndicateurId,
        collectiviteId,
        periodicite: 'mensuelle',
        dateValeur: '2026-01-01',
        resultat: 10,
        metadonneeId: metadonnee.id,
      })
      .returning();
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.id, openDataValeur.id));
      await databaseService.db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.id, metadonnee.id));
      await databaseService.db
        .delete(indicateurSourceTable)
        .where(eq(indicateurSourceTable.id, sourceId));
    });
    const caller = router.createCaller({ user: authenticatedUser });

    await caller.indicateurs.valeurs.delete({
      collectiviteId,
      indicateurId: monthlyIndicateurId,
      id: openDataValeur.id,
    });

    const [saved] = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(eq(indicateurValeurTable.id, openDataValeur.id));
    expect(saved).toMatchObject({ id: openDataValeur.id, resultat: 10 });
  });

  test('La suppression propage la disparition des lignes calculées A → B → C', async () => {
    const suffix = randomUUID().replaceAll('-', '');
    const [sourceA, calculatedB, calculatedC] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values([
        {
          collectiviteId: null,
          identifiantReferentiel: `test_${suffix}_a`,
          titre: 'Source A',
          unite: 'MWh',
          periodicite: 'mensuelle',
        },
        {
          collectiviteId: null,
          identifiantReferentiel: `test_${suffix}_b`,
          titre: 'Calcul B',
          unite: 'MWh',
          periodicite: 'mensuelle',
          // Les formules sont insensibles à la casse : la découverte SQL des
          // dépendants doit suivre le même contrat que le parseur/évaluateur.
          valeurCalcule: `val(TEST_${suffix.toUpperCase()}_A)`,
          sansValeurUtilisateur: true,
        },
        {
          collectiviteId: null,
          identifiantReferentiel: `test_${suffix}_c`,
          titre: 'Calcul C',
          unite: 'MWh',
          periodicite: 'mensuelle',
          valeurCalcule: `val(test_${suffix}_b)`,
          sansValeurUtilisateur: true,
        },
      ])
      .returning();
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(
          inArray(indicateurDefinitionTable.id, [
            sourceA.id,
            calculatedB.id,
            calculatedC.id,
          ])
        );
    });
    const caller = router.createCaller({ user: authenticatedUser });
    const [savedA] = await caller.indicateurs.valeurs.upsertMany({
      collectiviteId,
      valeurs: [
        {
          indicateurId: sourceA.id,
          period: IndicateurPeriods.parse('mensuelle', '2026-01'),
          resultat: 1,
        },
      ],
    });

    const calculatedBeforeDeletion = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          inArray(indicateurValeurTable.indicateurId, [
            calculatedB.id,
            calculatedC.id,
          ]),
          eq(indicateurValeurTable.dateValeur, '2026-01-01')
        )
      );
    expect(calculatedBeforeDeletion).toHaveLength(2);
    expect(calculatedBeforeDeletion).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indicateurId: calculatedB.id,
          resultat: 1,
          calculAuto: true,
        }),
        expect.objectContaining({
          indicateurId: calculatedC.id,
          resultat: 1,
          calculAuto: true,
        }),
      ])
    );

    await caller.indicateurs.valeurs.delete({
      collectiviteId,
      indicateurId: sourceA.id,
      id: savedA.id,
    });

    const persistedValeurs = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          inArray(indicateurValeurTable.indicateurId, [
            sourceA.id,
            calculatedB.id,
            calculatedC.id,
          ]),
          eq(indicateurValeurTable.dateValeur, '2026-01-01')
        )
      );
    expect(persistedValeurs).toEqual([]);
  });

  test('Met à jour et supprime la période mensuelle ciblée', async () => {
    const monthlyIndicateurId = await insertMonthlyIndicateur();
    const caller = router.createCaller({ user: authenticatedUser });
    const [january, february] = await caller.indicateurs.valeurs.upsertMany({
      collectiviteId,
      valeurs: [
        {
          indicateurId: monthlyIndicateurId,
          period: IndicateurPeriods.parse('mensuelle', '2026-01'),
          resultat: 1,
        },
        {
          indicateurId: monthlyIndicateurId,
          period: IndicateurPeriods.parse('mensuelle', '2026-02'),
          resultat: 2,
        },
      ],
    });

    await caller.indicateurs.valeurs.upsertMany({
      collectiviteId,
      valeurs: [
        {
          indicateurId: monthlyIndicateurId,
          period: IndicateurPeriods.parse('mensuelle', '2026-02'),
          resultat: 20,
        },
      ],
    });
    await caller.indicateurs.valeurs.delete({
      collectiviteId,
      indicateurId: monthlyIndicateurId,
      id: january.id,
    });

    const result = await caller.indicateurs.valeurs.list({
      collectiviteId,
      indicateurIds: [monthlyIndicateurId],
    });
    expect(result.indicateurs[0].sources.collectivite.valeurs).toEqual([
      expect.objectContaining({ id: february.id, resultat: 20 }),
    ]);
  });

  test(`Renvoi des valeurs`, async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    // Insert a value first so we have something to retrieve
    await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId,
      dateValeur: '2020-01-01',
      resultat: 10,
    });

    const input: InputList = {
      collectiviteId,
      indicateurIds: [indicateurId],
    };
    const result = await caller.indicateurs.valeurs.list(input);
    if (Array.isArray(result.indicateurs) === false) {
      throw new Error('result.indicateurs is not an array');
    }
    expect(result.indicateurs.length).not.toBe(0);
    expect(result.indicateurs[0].sources.collectivite.valeurs.length).not.toBe(
      0
    );
    const toCheck = getIndicateursValeursResponseSchema.safeParse(result);
    expect(toCheck.success).toBe(true);
  });

  test("Permet d'insérer une valeur", async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    // vérifie le nombre de valeurs avant insertion
    const inputBefore: InputList = {
      collectiviteId,
      indicateurIds: [indicateurId],
    };
    const resultBefore = await caller.indicateurs.valeurs.list(inputBefore);
    if (Array.isArray(resultBefore.indicateurs) === false) {
      throw new Error('resultBefore.indicateurs is not an array');
    }
    expect(resultBefore.indicateurs[0].sources.collectivite).toBeUndefined();

    // insère une valeur
    const input: InputUpsert = {
      collectiviteId,
      indicateurId,
      dateValeur: '2021-01-01',
      resultat: 42.0001,
      resultatCommentaire: 'commentaire',
    };
    const result = await caller.indicateurs.valeurs.upsert(input);
    expect(result).not.toBe(null);
    expect(result?.resultat).toBe(42);

    // vérifie le nombre de valeurs après insertion
    const resultAfter = await caller.indicateurs.valeurs.list(inputBefore);
    if (Array.isArray(resultAfter.indicateurs) === false) {
      throw new Error('resultAfter.indicateurs is not an array');
    }
    expect(resultAfter.indicateurs[0].sources.collectivite.valeurs.length).toBe(
      1
    );
  });

  test('Permet de mettre à jour une valeur', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    // insère une valeur
    const inputInsert: InputUpsert = {
      collectiviteId,
      indicateurId,
      dateValeur: '2021-01-01',
      resultat: 42.0001,
      resultatCommentaire: 'commentaire',
    };
    await caller.indicateurs.valeurs.upsert(inputInsert);

    // vérifie le nombre de valeurs avant mise à jour
    const inputBefore: InputList = {
      collectiviteId,
      indicateurIds: [indicateurId],
    };
    const resultBefore = await caller.indicateurs.valeurs.list(inputBefore);
    if (Array.isArray(resultBefore.indicateurs) === false) {
      throw new Error('resultBefore.indicateurs is not an array');
    }
    expect(
      resultBefore.indicateurs[0].sources.collectivite.valeurs.length
    ).toBe(1);

    // met à jour que la valeur
    const inputUpdate: InputUpsert = {
      collectiviteId,
      indicateurId,
      id: resultBefore.indicateurs[0].sources.collectivite.valeurs[0].id,
      resultat: 43.001,
    };
    const result = await caller.indicateurs.valeurs.upsert(inputUpdate);
    expect(result).not.toBe(null);
    expect(result?.resultat).toBe(43);

    // vérifie le nombre de valeurs après mise à jour
    const resultAfter = await caller.indicateurs.valeurs.list(inputBefore);
    if (Array.isArray(resultAfter.indicateurs) === false) {
      throw new Error('resultAfter.indicateurs is not an array');
    }
    expect(resultAfter.indicateurs[0].sources.collectivite.valeurs.length).toBe(
      1
    );
    expect(
      resultAfter.indicateurs[0].sources.collectivite.valeurs[0].resultat
    ).toBe(43);
    expect(
      resultAfter.indicateurs[0].sources.collectivite.valeurs[0]
        .resultatCommentaire
    ).toBe('commentaire');

    // met à jour la valeur objectif pour la même date
    const inputUpdateObjectif: InputUpsert = {
      collectiviteId,
      indicateurId,
      id: resultBefore.indicateurs[0].sources.collectivite.valeurs[0].id,
      objectif: 44,
    };
    const resultObjectif = await caller.indicateurs.valeurs.upsert(
      inputUpdateObjectif
    );
    expect(resultObjectif).not.toBe(null);

    // vérifie le nombre de valeurs après mise à jour
    const resultAfterObjectif = await caller.indicateurs.valeurs.list(
      inputBefore
    );
    if (Array.isArray(resultAfterObjectif.indicateurs) === false) {
      throw new Error('resultAfterObjectif.indicateurs is not an array');
    }
    expect(
      resultAfterObjectif.indicateurs[0].sources.collectivite.valeurs.length
    ).toBe(1);
    expect(
      resultAfterObjectif.indicateurs[0].sources.collectivite.valeurs[0]
        .resultat
    ).toBe(43);
    expect(
      resultAfterObjectif.indicateurs[0].sources.collectivite.valeurs[0]
        .objectif
    ).toBe(44);
  });

  test("Mettre à jour par id ne peut pas muter la valeur d'un autre indicateur", async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const created = await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId,
      dateValeur: '2021-01-01',
      resultat: 10,
    });
    if (!created) {
      expect.fail('created is undefined');
    }

    const autreIndicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.e'
    );

    const result = await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId: autreIndicateurId,
      id: created.id,
      resultat: 999,
    });

    expect(result).toBeUndefined();

    const after = await caller.indicateurs.valeurs.list({
      collectiviteId,
      indicateurIds: [indicateurId],
    });
    if (Array.isArray(after.indicateurs) === false) {
      throw new Error('after.indicateurs is not an array');
    }
    expect(after.indicateurs[0].sources.collectivite.valeurs[0].resultat).toBe(
      10
    );
  });

  test('Mettre à jour par id ne peut pas écraser une valeur open-data', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const [metadonnee] = await databaseService.db
      .select()
      .from(indicateurSourceMetadonneeTable)
      .limit(1);

    const [openDataValeur] = await databaseService.db
      .insert(indicateurValeurTable)
      .values({
        collectiviteId,
        indicateurId,
        dateValeur: '2019-01-01',
        resultat: 5,
        metadonneeId: metadonnee.id,
      })
      .returning();

    const result = await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId,
      id: openDataValeur.id,
      resultat: 999,
    });

    expect(result).toBeUndefined();

    const [row] = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(eq(indicateurValeurTable.id, openDataValeur.id));
    expect(row.resultat).toBe(5);
  });

  test('Le filtre metadonneeId ne remonte que les valeurs de cette métadonnée', async () => {
    const caller = router.createCaller({ user: authenticatedUser });
    const sourceId = `test-metadonnee-filter-${collectiviteId}`;

    await databaseService.db
      .insert(indicateurSourceTable)
      .values({
        id: sourceId,
        libelle: 'Source test filtre métadonnée',
        ordreAffichage: null,
      })
      .onConflictDoNothing();

    const [metadonneeA, metadonneeB] = await databaseService.db
      .insert(indicateurSourceMetadonneeTable)
      .values([
        {
          sourceId,
          dateVersion: '2020-01-01T00:00:00.000Z',
          nomDonnees: null,
          diffuseur: null,
          producteur: null,
          methodologie: null,
          limites: null,
        },
        {
          sourceId,
          dateVersion: '2021-01-01T00:00:00.000Z',
          nomDonnees: null,
          diffuseur: null,
          producteur: null,
          methodologie: null,
          limites: null,
        },
      ])
      .returning({ id: indicateurSourceMetadonneeTable.id });

    await databaseService.db.insert(indicateurValeurTable).values([
      {
        collectiviteId,
        indicateurId,
        dateValeur: '2019-01-01',
        resultat: 11,
        metadonneeId: metadonneeA.id,
      },
      {
        collectiviteId,
        indicateurId,
        dateValeur: '2020-01-01',
        resultat: 22,
        metadonneeId: metadonneeB.id,
      },
    ]);

    const filtreA = await caller.indicateurs.valeurs.list({
      collectiviteId,
      indicateurIds: [indicateurId],
      metadonneeId: metadonneeA.id,
    });
    const filtreB = await caller.indicateurs.valeurs.list({
      collectiviteId,
      indicateurIds: [indicateurId],
      metadonneeId: metadonneeB.id,
    });

    expect(filtreA.indicateurs).toHaveLength(1);
    expect(filtreA.indicateurs[0].sources[sourceId]?.valeurs).toEqual([
      expect.objectContaining({
        dateValeur: '2019-01-01',
        resultat: 11,
        metadonneeId: metadonneeA.id,
      }),
    ]);

    expect(filtreB.indicateurs).toHaveLength(1);
    expect(filtreB.indicateurs[0].sources[sourceId]?.valeurs).toEqual([
      expect.objectContaining({
        dateValeur: '2020-01-01',
        resultat: 22,
        metadonneeId: metadonneeB.id,
      }),
    ]);
  });

  test('Un second upsert sur la même date met à jour au lieu de dupliquer', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId,
      dateValeur: '2021-01-01',
      resultat: 10,
    });

    const second = await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId,
      dateValeur: '2021-01-01',
      resultat: 20,
    });
    expect(second?.resultat).toBe(20);

    const after = await caller.indicateurs.valeurs.list({
      collectiviteId,
      indicateurIds: [indicateurId],
    });
    if (Array.isArray(after.indicateurs) === false) {
      throw new Error('after.indicateurs is not an array');
    }
    expect(after.indicateurs[0].sources.collectivite.valeurs.length).toBe(1);
    expect(after.indicateurs[0].sources.collectivite.valeurs[0].resultat).toBe(
      20
    );
  });

  test("Un second upsert sans id ne réinitialise pas l'objectif existant", async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId,
      dateValeur: '2021-01-01',
      resultat: 10,
      objectif: 5,
    });

    await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId,
      dateValeur: '2021-01-01',
      resultat: 20,
    });

    const after = await caller.indicateurs.valeurs.list({
      collectiviteId,
      indicateurIds: [indicateurId],
    });
    if (Array.isArray(after.indicateurs) === false) {
      throw new Error('after.indicateurs is not an array');
    }
    expect(after.indicateurs[0].sources.collectivite.valeurs.length).toBe(1);
    expect(after.indicateurs[0].sources.collectivite.valeurs[0].resultat).toBe(
      20
    );
    expect(after.indicateurs[0].sources.collectivite.valeurs[0].objectif).toBe(
      5
    );
  });

  test("Valeurs calculées lors de l'insertion d'une valeur", async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const cae1eIndicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.e'
    );
    const cae1fIndicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.f'
    );
    const indicateurCalculeId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_1.k'
    );

    await deleteIndicateurValeursForCollectivite(
      databaseService,
      collectiviteId,
      [indicateurCalculeId, cae1fIndicateurId, cae1eIndicateurId]
    );

    // vérifie le nombre de valeurs avant insertion
    const inputBefore: InputList = {
      collectiviteId,
      indicateurIds: [indicateurCalculeId],
    };

    const resultBefore = await caller.indicateurs.valeurs.list(inputBefore);
    if (Array.isArray(resultBefore.indicateurs) === false) {
      throw new Error('resultBefore.indicateurs is not an array');
    }
    expect(resultBefore.indicateurs[0].sources.collectivite).toBeUndefined();

    // insère une valeur
    const inputCae1e: InputUpsert = {
      collectiviteId,
      indicateurId: cae1eIndicateurId,
      dateValeur: '2015-01-01',
      resultat: 102.04,
    };
    const resultCae1e = await caller.indicateurs.valeurs.upsert(inputCae1e);
    expect(resultCae1e).not.toBe(null);
    expect(resultCae1e?.resultat).toBe(102.04);

    // vérifie le nombre de valeurs après insertion
    const resultAfter = await caller.indicateurs.valeurs.list(inputBefore);
    if (Array.isArray(resultAfter.indicateurs) === false) {
      throw new Error('resultAfter.indicateurs is not an array');
    }
    expect(resultAfter.indicateurs[0].sources.collectivite.valeurs.length).toBe(
      1
    );
    const indicateurCalculeValeur =
      resultAfter.indicateurs[0].sources.collectivite.valeurs[0];
    expect(indicateurCalculeValeur.resultat).toBe(102.04);
    expect(indicateurCalculeValeur.calculAuto).toBe(true);
    expect(
      indicateurCalculeValeur.calculAutoIdentifiantsManquants
    ).toStrictEqual(['cae_1.f']);
  });

  test("Ne permet pas d'insérer une valeur si on n'a pas le droit requis", async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const input: InputUpsert = {
      collectiviteId: 100,
      indicateurId: 1,
      dateValeur: '2021-01-01',
      resultat: 42,
    };
    await expect(caller.indicateurs.valeurs.upsert(input)).rejects.toThrow();
  });

  test('Ne permet pas de recalculer si on utilise pas un compte de service', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    await expect(caller.indicateurs.valeurs.recompute({})).rejects.toThrow();
  });

  test('Permet de supprimer une valeur', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    // insère une valeur
    const inputInsert: InputUpsert = {
      collectiviteId,
      indicateurId,
      dateValeur: '2021-01-01',
      resultat: 42,
      resultatCommentaire: 'commentaire',
    };
    await caller.indicateurs.valeurs.upsert(inputInsert);

    // vérifie le nombre de valeurs avant la suppression
    const inputBefore: InputList = {
      collectiviteId,
      indicateurIds: [indicateurId],
    };
    const resultBefore = await caller.indicateurs.valeurs.list(inputBefore);
    if (Array.isArray(resultBefore.indicateurs) === false) {
      throw new Error('resultBefore.indicateurs is not an array');
    }
    expect(
      resultBefore.indicateurs[0].sources.collectivite.valeurs.length
    ).toBe(1);

    // supprime l'entrée
    const valeurId =
      resultBefore.indicateurs[0].sources.collectivite.valeurs[0].id;
    await caller.indicateurs.valeurs.delete({
      collectiviteId,
      indicateurId,
      id: valeurId,
    });

    // vérifie le nombre de valeurs après la suppression
    const resultAfter = await caller.indicateurs.valeurs.list(inputBefore);
    if (Array.isArray(resultAfter.indicateurs) === false) {
      throw new Error('resultAfter.indicateurs is not an array');
    }
    expect(resultAfter.indicateurs.length).toBe(1);
    expect(resultAfter.indicateurs[0].sources.collectivite).toBeUndefined();
  });

  test('Donne la moyenne des valeurs pour un indicateur', async () => {
    const caller = router.createCaller({ user: authenticatedUser });
    const result = await caller.indicateurs.valeurs.average({
      collectiviteId: 3895,
      indicateurId: 73,
    });
    expect(result).toStrictEqual({
      indicateurId: 73,
      typeCollectivite: 'CA',
      valeurs: [
        {
          dateValeur: '2014-01-01',
          valeur: 7.39,
          sourceLibelle: 'RARE-OREC',
        },
        {
          dateValeur: '2016-01-01',
          valeur: 7.47,
          sourceLibelle: 'RARE-OREC',
        },
        {
          dateValeur: '2017-01-01',
          valeur: 7.48,
          sourceLibelle: 'RARE-OREC',
        },
      ],
    });
  });

  test('Donne les valeurs de référence pour un indicateur', async () => {
    const caller = router.createCaller({ user: authenticatedUser });
    const cae7IndicateurId = await getIndicateurIdByIdentifiant(
      databaseService,
      'cae_7'
    );
    const result = await caller.indicateurs.valeurs.reference({
      collectiviteId: collectiviteId,
      indicateurIds: [cae7IndicateurId],
    });
    expect(result).toMatchObject([
      {
        indicateurId: cae7IndicateurId,
        identifiantReferentiel: 'cae_7',
        cible: 65,
        drom: false,
        libelle: expect.any(String),
        objectifs: null,
        seuil: 45,
      },
    ]);
  });

  test('Sans contexte référentiel, referentiel(te) est évalué à `true`', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    // sans contexte explicite, ValeursReferenceService injecte te @ version courante
    //   → referentiel(te) = true  → cible 42
    //   → referentiel(te) = false → cible 10
    const { indicateurId, cleanup } =
      await insertFixtureIndicateurPourValeursReference(
        databaseService,
        'si referentiel(te) alors 42 sinon 10'
      );
    onTestFinished(() => cleanup());

    const result = await caller.indicateurs.valeurs.reference({
      collectiviteId,
      indicateurIds: [indicateurId],
    });

    expect(result).toMatchObject([
      {
        indicateurId,
        identifiantReferentiel:
          TEST_INDICATEUR_VALEURS_REFERENCE_REFERENTIEL_IDENTIFIANT,
        cible: 42,
        seuil: null,
      },
    ]);
  });

  test("Un utilisateur ayant le droit edition limité, ne peut insérer / modifier / supprimer une valeur que si il est pilote de l'indicateur", async () => {
    const adminCaller = router.createCaller({ user: authenticatedUser });
    const adminValue = await adminCaller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId,
      dateValeur: '2025-01-01',
      resultat: 42,
    });

    const { user } = await addTestUser(databaseService, {
      collectiviteId: collectiviteId,
      role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
    });

    const limitedEditionUser = getAuthUserFromUserCredentials(user);
    const limitedEditionCaller = router.createCaller({
      user: limitedEditionUser,
    });

    const input: InputUpsert = {
      collectiviteId,
      indicateurId,
      dateValeur: '2050-01-01',
      resultat: 43,
      resultatCommentaire: `commentaire utilisateur ${limitedEditionUser.id}`,
    };
    await expect(
      limitedEditionCaller.indicateurs.valeurs.upsert(input)
    ).rejects.toThrowError(/Droits insuffisants/);

    if (!adminValue) {
      expect.fail('adminValue is undefined');
    }

    // We can't delete the value too
    await expect(
      limitedEditionCaller.indicateurs.valeurs.delete({
        collectiviteId,
        indicateurId,
        id: adminValue.id,
      })
    ).rejects.toThrowError(/Droits insuffisants/);

    const indicateurDefinitionResult =
      await adminCaller.indicateurs.indicateurs.list({
        collectiviteId,
        filters: {
          indicateurIds: [indicateurId],
        },
      });
    const indicateur = indicateurDefinitionResult.data[0];
    const pilotes = indicateur.pilotes || [];

    // now set it as pilote
    await adminCaller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        pilotes: [...pilotes, { userId: limitedEditionUser.id }],
      },
    });

    const result = await limitedEditionCaller.indicateurs.valeurs.upsert(input);

    if (!result) {
      expect.fail('result is undefined');
    }

    expect(result.resultat).toBe(43);

    // The API-key scope gate is a no-op for a human session, so the dedicated
    // grid command keeps the same "piloted by me" fallback as legacy upsert.
    const [batchResult] =
      await limitedEditionCaller.indicateurs.valeurs.upsertMany({
        collectiviteId,
        valeurs: [
          {
            indicateurId,
            period: IndicateurPeriods.parse('annuelle', '2051'),
            resultat: 44,
          },
        ],
      });
    expect(batchResult).toMatchObject({ resultat: 44 });

    // We can delete the value too
    await limitedEditionCaller.indicateurs.valeurs.delete({
      collectiviteId,
      indicateurId,
      id: result.id,
    });
    await limitedEditionCaller.indicateurs.valeurs.delete({
      collectiviteId,
      indicateurId,
      id: batchResult.id,
    });

    // Remove the user from pilote
    await adminCaller.indicateurs.indicateurs.update({
      indicateurId,
      collectiviteId,
      indicateurFields: {
        pilotes: pilotes.filter((p) => p.userId !== limitedEditionUser.id),
      },
    });
  });
});
