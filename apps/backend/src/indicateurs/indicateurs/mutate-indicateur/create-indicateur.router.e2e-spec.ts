import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { GenerateImportDraftWorker } from '@tet/backend/plans/ai-plan-import/generate-import-draft/generate-import-draft.worker';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { createFiche } from '@tet/backend/plans/fiches/fiches.test-fixture';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { describe, expect, onTestFinished, vi } from 'vitest';
import z from 'zod';
import { indicateurGroupeTable } from '../../shared/models/indicateur-groupe.table';
import { indicateurThematiqueTable } from '../../shared/models/indicateur-thematique.table';
import { indicateurCollectiviteTable } from '../../indicateur/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '../../indicateur/indicateur-definition.table';
import { indicateurValeurTable } from '../../valeurs/indicateur-valeur.table';
import { indicateurSourceMetadonneeTable } from '../../shared/models/indicateur-source-metadonnee.table';
import CreateIndicateurService from './create-indicateur.service';
import { createIndicateurInputSchema } from './mutate-indicateur.input';
import { MutateIndicateurRepository } from './mutate-indicateur.repository';
import {
  IndicateurPeriodiciteEnum,
  PCAET_COLLECTIVITE_SOURCE_ID,
} from '@tet/domain/indicateurs';

// On prend le typage en entrée, avant parsing zod du router trpc
type CreateIndicateurInput = z.input<typeof createIndicateurInputSchema>;

describe('createIndicateurPerso', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;
  let collectivite: Collectivite;
  let createService: CreateIndicateurService;

  const loadIndicateurRows = (
    indicateurId: number,
    db: DatabaseService['db'] | Transaction = databaseService.db
  ) =>
    Promise.all([
      db
        .select()
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId)),
      db
        .select()
        .from(indicateurThematiqueTable)
        .where(eq(indicateurThematiqueTable.indicateurId, indicateurId)),
      db
        .select()
        .from(indicateurCollectiviteTable)
        .where(eq(indicateurCollectiviteTable.indicateurId, indicateurId)),
      db
        .select()
        .from(ficheActionIndicateurTable)
        .where(eq(ficheActionIndicateurTable.indicateurId, indicateurId)),
    ]);

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder
          .overrideProvider(LlmService)
          .useValue(new LlmService(new FakeLlmRepository()));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
      },
    });
    router = app.get(TrpcRouter);
    databaseService = await getTestDatabase(app);
    createService = app.get(CreateIndicateurService);

    const testResult = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    authenticatedUser = getAuthUserFromUserCredentials(testResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test.each([
    undefined,
    IndicateurPeriodiciteEnum.ANNUELLE,
    IndicateurPeriodiciteEnum.SEMESTRIELLE,
    IndicateurPeriodiciteEnum.TRIMESTRIELLE,
    IndicateurPeriodiciteEnum.MENSUELLE,
  ] as const)(
    'creates, writes and reads an indicator with periodicite=%s',
    async (periodicite) => {
      const caller = router.createCaller({ user: authenticatedUser });
      const indicateurId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Périodicité de bout en bout',
        periodicite,
      });
      onTestFinished(async () => {
        await caller.indicateurs.indicateurs.delete({
          collectiviteId: collectivite.id,
          indicateurId,
        });
      });
      const dateValeur =
        periodicite === undefined ? '2024-12-31' : '2024-01-01';

      await caller.indicateurs.valeurs.upsert({
        collectiviteId: collectivite.id,
        indicateurId,
        periodicite,
        dateValeur,
        resultat: 0,
      });

      await caller.indicateurs.indicateurs.update({
        collectiviteId: collectivite.id,
        indicateurId,
        indicateurFields: { titre: 'Titre modifié sans changer la cadence' },
      });

      const { indicateurs } = await caller.indicateurs.valeurs.list({
        collectiviteId: collectivite.id,
        indicateurIds: [indicateurId],
      });
      expect(indicateurs[0].definition).toMatchObject({
        titre: 'Titre modifié sans changer la cadence',
        periodicite: periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE,
      });
      expect(indicateurs[0].sources.collectivite.valeurs).toMatchObject([
        {
          periodicite: periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE,
          dateValeur: '2024-01-01',
          resultat: 0,
        },
      ]);
    }
  );

  test('should create a personal indicator with all fields', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    // Create a fiche in the collectivite for the ficheId field
    const fiche = await caller.plans.fiches.create({
      fiche: {
        collectiviteId: collectivite.id,
        titre: 'Fiche test indicateur',
      },
    });

    const data = {
      collectiviteId: collectivite.id,
      titre: 'Test Personal Indicator',
      unite: 'kg',
      thematiques: [{ id: 1 }, { id: 2 }],
      commentaire: 'Test comment for personal indicator',
      estFavori: true,
      estConfidentiel: true,
      ficheId: fiche.id,
    } satisfies CreateIndicateurInput;

    const indicateurId = await caller.indicateurs.indicateurs.create(data);

    expect(indicateurId).toBeDefined();
    expect(typeof indicateurId).toBe('number');

    // Verify the indicator was created in the database
    const createdIndicateur = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1);

    expect(createdIndicateur).toHaveLength(1);
    expect(createdIndicateur[0].titre).toBe(data.titre);
    expect(createdIndicateur[0].unite).toBe(data.unite);
    expect(createdIndicateur[0].collectiviteId).toBe(data.collectiviteId);

    // Verify the collectivite-specific data was created
    const collectiviteData = await databaseService.db
      .select()
      .from(indicateurCollectiviteTable)
      .where(eq(indicateurCollectiviteTable.indicateurId, indicateurId))
      .limit(1);

    expect(collectiviteData).toHaveLength(1);
    expect(collectiviteData[0].commentaire).toBe(data.commentaire);
    expect(collectiviteData[0].favoris).toBe(data.estFavori);
    expect(collectiviteData[0].confidentiel).toBe(data.estConfidentiel);

    // Verify thematic associations were created
    const thematiqueData = await databaseService.db
      .select()
      .from(indicateurThematiqueTable)
      .where(eq(indicateurThematiqueTable.indicateurId, indicateurId));

    expect(thematiqueData).toHaveLength(data.thematiques.length);
    expect(thematiqueData.map((t) => t.thematiqueId)).toEqual(
      expect.arrayContaining(data.thematiques.map((t) => t.id))
    );

    // Verify fiche association was created
    const ficheData = await databaseService.db
      .select()
      .from(ficheActionIndicateurTable)
      .where(eq(ficheActionIndicateurTable.indicateurId, indicateurId))
      .limit(1);

    expect(ficheData).toHaveLength(1);
    expect(ficheData[0].ficheId).toBe(data.ficheId);
  });

  test('should create a personal indicator with minimal fields', async () => {
    const data: CreateIndicateurInput = {
      collectiviteId: collectivite.id,
      titre: 'Minimal Test Indicator',
      unite: '',
      thematiques: [],
      commentaire: undefined,
      estFavori: false,
      ficheId: undefined,
    };

    const caller = router.createCaller({ user: authenticatedUser });
    const indicateurId = await caller.indicateurs.indicateurs.create(data);

    expect(indicateurId).toBeDefined();
    expect(typeof indicateurId).toBe('number');

    // Verify the indicator was created
    const createdIndicateur = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1);

    expect(createdIndicateur).toHaveLength(1);
    expect(createdIndicateur[0].titre).toBe(data.titre);
    expect(createdIndicateur[0].unite).toBe('');
    expect(createdIndicateur[0].collectiviteId).toBe(data.collectiviteId);

    // Verify collectivite data was created with defaults
    const collectiviteData = await databaseService.db
      .select()
      .from(indicateurCollectiviteTable)
      .where(eq(indicateurCollectiviteTable.indicateurId, indicateurId))
      .limit(1);

    expect(collectiviteData).toHaveLength(1);
    expect(collectiviteData[0].commentaire).toBeNull();
    expect(collectiviteData[0].favoris).toBe(false);
    expect(collectiviteData[0].confidentiel).toBe(false);

    // Verify no thematic associations were created
    const thematiqueData = await databaseService.db
      .select()
      .from(indicateurThematiqueTable)
      .where(eq(indicateurThematiqueTable.indicateurId, indicateurId));

    expect(thematiqueData).toHaveLength(0);

    // Verify no fiche association was created
    const ficheData = await databaseService.db
      .select()
      .from(ficheActionIndicateurTable)
      .where(eq(ficheActionIndicateurTable.indicateurId, indicateurId));

    expect(ficheData).toHaveLength(0);
  });

  test('crée un indicateur déjà déclaré non applicable', async () => {
    const data: CreateIndicateurInput = {
      collectiviteId: collectivite.id,
      titre: 'Indicateur non applicable dès la création',
      unite: 'kg',
      isApplicable: false,
    };

    const caller = router.createCaller({ user: authenticatedUser });
    const indicateurId = await caller.indicateurs.indicateurs.create(data);

    const [collectiviteData] = await databaseService.db
      .select()
      .from(indicateurCollectiviteTable)
      .where(eq(indicateurCollectiviteTable.indicateurId, indicateurId))
      .limit(1);

    expect(collectiviteData.isApplicable).toBe(false);
  });

  test('should set modified_by field when creating an indicator', async () => {
    const data: CreateIndicateurInput = {
      collectiviteId: collectivite.id,
      titre: 'Test Indicator for modified_by',
      unite: 'kg',
      commentaire: 'Test comment',
      estFavori: true,
    };

    const caller = router.createCaller({ user: authenticatedUser });
    const indicateurId = await caller.indicateurs.indicateurs.create(data);

    expect(indicateurId).toBeDefined();

    // Verify the modified_* fields are set by using the list service
    const {
      data: [indicateur],
    } = await caller.indicateurs.indicateurs.list({
      collectiviteId: collectivite.id,
      filters: {
        indicateurIds: [indicateurId],
      },
    });

    expect(indicateur).toBeDefined();

    if (!indicateur.modifiedBy) {
      expect.fail('modifiedBy is null');
    }

    expect(indicateur.modifiedBy.id).toBe(authenticatedUser.id);
    expect(indicateur.modifiedAt).toBeDefined();
  });

  test('should throw error when user lacks permission', async () => {
    const data: CreateIndicateurInput = {
      collectiviteId: 999,
      titre: 'Unauthorized Test Indicator',
      unite: 'kg',
    };

    const caller = router.createCaller({ user: authenticatedUser });

    await expect(
      caller.indicateurs.indicateurs.create(data)
    ).rejects.toThrowError(/permissions nécessaires/);
  });

  test('should reject a fiche owned by another collectivite and roll back creation', async () => {
    const other = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    onTestFinished(other.cleanup);
    const otherCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(other.user),
    });
    const foreignFicheId = await createFiche({
      caller: otherCaller,
      ficheInput: {
        collectiviteId: other.collectivite.id,
        titre: 'Foreign fiche for indicator creation',
      },
    });
    const titre = `Indicator rejected with foreign fiche ${crypto.randomUUID()}`;

    const caller = router.createCaller({ user: authenticatedUser });
    await expect(
      caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre,
        ficheId: foreignFicheId,
      })
    ).rejects.toThrow(/fiches doivent appartenir/i);

    const indicateurs = await databaseService.db
      .select({ id: indicateurDefinitionTable.id })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.titre, titre));
    expect(indicateurs).toHaveLength(0);
  });
  test('annule la définition, les thématiques, les préférences et le lien fiche si la transaction appelante échoue', async () => {
    const caller = router.createCaller({ user: authenticatedUser });
    const ficheId = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: collectivite.id,
        titre: 'Fiche conservée après annulation',
      },
    });
    const input = createIndicateurInputSchema.parse({
      collectiviteId: collectivite.id,
      titre: 'Indicateur annulé avec la transaction appelante',
      unite: 'kg',
      thematiques: [{ id: 1 }, { id: 2 }],
      commentaire: 'Préférences à annuler',
      estFavori: true,
      estConfidentiel: true,
      ficheId,
    });
    let indicateurId = 0;
    const outerError = new Error('Échec après la création de l’indicateur');

    await expect(
      databaseService.db.transaction(async (tx) => {
        const created = await createService.createIndicateurPerso(input, {
          user: authenticatedUser,
          tx,
        });
        if (!created.success) {
          throw new Error('La création aurait dû réussir');
        }
        indicateurId = created.data;
        const rows = await loadIndicateurRows(indicateurId, tx);
        expect(rows.map((tableRows) => tableRows.length)).toEqual([1, 2, 1, 1]);
        throw outerError;
      })
    ).rejects.toBe(outerError);

    const rows = await loadIndicateurRows(indicateurId);
    expect(rows.map((tableRows) => tableRows.length)).toEqual([0, 0, 0, 0]);
    const fiche = await databaseService.db
      .select({ id: ficheActionTable.id })
      .from(ficheActionTable)
      .where(eq(ficheActionTable.id, ficheId));
    expect(fiche).toEqual([{ id: ficheId }]);
  });

  test('persiste l’indicateur uniquement au commit de la transaction appelante', async () => {
    const input = createIndicateurInputSchema.parse({
      collectiviteId: collectivite.id,
      titre: 'Indicateur créé dans une transaction partagée',
    });

    const indicateurId = await databaseService.db.transaction(async (tx) => {
      const created = await createService.createIndicateurPerso(input, {
        user: authenticatedUser,
        tx,
      });
      if (!created.success) {
        throw new Error('La création aurait dû réussir');
      }
      const createdId = created.data;
      const rowsBeforeCommit = await loadIndicateurRows(createdId);
      expect(rowsBeforeCommit.map((rows) => rows.length)).toEqual([0, 0, 0, 0]);
      return createdId;
    });

    const [definitions, , preferences] = await loadIndicateurRows(indicateurId);
    expect(definitions).toEqual([
      expect.objectContaining({
        titre: input.titre,
        collectiviteId: collectivite.id,
      }),
    ]);
    expect(preferences).toEqual([
      expect.objectContaining({ modifiedBy: authenticatedUser.id }),
    ]);
  });

  test('refuse la création en lecture seule même avec une transaction appelante', async () => {
    const fixture = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.LECTURE },
    });
    onTestFinished(fixture.cleanup);
    const input = createIndicateurInputSchema.parse({
      collectiviteId: fixture.collectivite.id,
      titre: 'Indicateur non autorisé dans une transaction partagée',
    });

    await expect(
      databaseService.db.transaction((tx) =>
        createService.createIndicateurPerso(input, {
          user: getAuthUserFromUserCredentials(fixture.user),
          tx,
        })
      )
    ).resolves.toEqual({ success: false, error: 'UNAUTHORIZED' });

    const definitions = await databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(
        eq(indicateurDefinitionTable.collectiviteId, fixture.collectivite.id)
      );
    expect(definitions).toEqual([]);
  });

  describe('sous-indicateur', () => {
    const createParentMensuel = async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      return caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Déchets ménagers',
        unite: 't',
        periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
      });
    };

    test('rattache le nouvel indicateur à son parent en reprenant unité et périodicité', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const parentId = await createParentMensuel();

      const childId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Ordures ménagères',
        parentId,
      });

      const [child] = await databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, childId));
      expect(child).toMatchObject({
        titre: 'Ordures ménagères',
        unite: 't',
        periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
        collectiviteId: collectivite.id,
      });

      const links = await databaseService.db
        .select()
        .from(indicateurGroupeTable)
        .where(eq(indicateurGroupeTable.enfant, childId));
      expect(links).toEqual([{ parent: parentId, enfant: childId }]);
    });

    test('refuse un sous-indicateur sous un indicateur prédéfini', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const [predefini] = await databaseService.db
        .select({ id: indicateurDefinitionTable.id })
        .from(indicateurDefinitionTable)
        .where(isNull(indicateurDefinitionTable.collectiviteId))
        .limit(1);
      const titre = `Sous-indicateur refusé ${crypto.randomUUID()}`;

      await expect(
        caller.indicateurs.indicateurs.create({
          collectiviteId: collectivite.id,
          titre,
          parentId: predefini.id,
        })
      ).rejects.toThrow(/indicateur personnalisé/);

      const created = await databaseService.db
        .select({ id: indicateurDefinitionTable.id })
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.titre, titre));
      expect(created).toHaveLength(0);
    });

    test.each([true, false])(
      'reprend le cumul du parent (%s) pour le nouveau sous-indicateur',
      async (totalEstCumulDesSousIndicateurs) => {
        const caller = router.createCaller({ user: authenticatedUser });
        const parentId = await createParentMensuel();
        await caller.indicateurs.indicateurs.update({
          collectiviteId: collectivite.id,
          indicateurId: parentId,
          indicateurFields: { totalEstCumulDesSousIndicateurs },
        });

        const childId = await caller.indicateurs.indicateurs.create({
          collectiviteId: collectivite.id,
          titre: 'Ordures ménagères',
          parentId,
        });

        const [child] = await databaseService.db
          .select({
            totalEstCumulDesSousIndicateurs:
              indicateurDefinitionTable.totalEstCumulDesSousIndicateurs,
          })
          .from(indicateurDefinitionTable)
          .where(eq(indicateurDefinitionTable.id, childId));
        expect(child).toEqual({ totalEstCumulDesSousIndicateurs });
      }
    );

    test('accepte un sous-indicateur sous un sous-indicateur, avec l’unité et la périodicité du parent', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const parentId = await createParentMensuel();
      const childId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Tri sélectif',
        parentId,
      });

      const grandChildId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Verre',
        parentId: childId,
      });

      const [indicateurGroupe] = await databaseService.db
        .select()
        .from(indicateurGroupeTable)
        .where(eq(indicateurGroupeTable.enfant, grandChildId));
      expect(indicateurGroupe).toMatchObject({
        parent: childId,
        enfant: grandChildId,
      });
      const [grandChildDefinition] = await databaseService.db
        .select({
          unite: indicateurDefinitionTable.unite,
          periodicite: indicateurDefinitionTable.periodicite,
        })
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, grandChildId));
      expect(grandChildDefinition).toEqual({
        unite: 't',
        periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
      });
    });

    test('ne révèle pas un indicateur d’une autre collectivité', async () => {
      const other = await addTestCollectiviteAndUser(databaseService, {
        user: { role: CollectiviteRole.ADMIN },
      });
      onTestFinished(other.cleanup);
      const [foreignParent] = await databaseService.db
        .insert(indicateurDefinitionTable)
        .values({
          collectiviteId: other.collectivite.id,
          titre: 'Indicateur d’une autre collectivité',
          unite: 't',
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        })
        .returning({ id: indicateurDefinitionTable.id });
      const caller = router.createCaller({ user: authenticatedUser });

      await expect(
        caller.indicateurs.indicateurs.create({
          collectiviteId: collectivite.id,
          titre: 'Enfant sans parent accessible',
          parentId: foreignParent.id,
        })
      ).rejects.toThrow(/parent n'a pas été trouvé/);
    });
  });

  describe('premier sous-indicateur', () => {
    const createParentWithValeurs = async ({
      estConfidentiel = false,
    }: { estConfidentiel?: boolean } = {}) => {
      const caller = router.createCaller({ user: authenticatedUser });
      const parentId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Déchets ménagers',
        unite: 't',
        estConfidentiel,
      });
      await caller.indicateurs.valeurs.upsert({
        collectiviteId: collectivite.id,
        indicateurId: parentId,
        dateValeur: '2022-01-01',
        resultat: 500,
        resultatCommentaire: 'Résultat 2022',
        objectif: 480,
        objectifCommentaire: 'Objectif 2022',
      });
      await caller.indicateurs.valeurs.upsert({
        collectiviteId: collectivite.id,
        indicateurId: parentId,
        dateValeur: '2023-01-01',
        resultat: 520,
        objectif: 490,
      });
      return { caller, parentId };
    };

    const createSousIndicateur = ({
      caller,
      parentId,
      titre,
      estConfidentiel,
    }: {
      caller: ReturnType<TrpcRouter['createCaller']>;
      parentId: number;
      titre: string;
      estConfidentiel?: boolean;
    }) =>
      caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre,
        parentId,
        estConfidentiel,
      });

    const listValeurs = (indicateurId: number) =>
      databaseService.db
        .select({
          dateValeur: indicateurValeurTable.dateValeur,
          resultat: indicateurValeurTable.resultat,
          resultatCommentaire: indicateurValeurTable.resultatCommentaire,
          objectif: indicateurValeurTable.objectif,
          objectifCommentaire: indicateurValeurTable.objectifCommentaire,
        })
        .from(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, indicateurId))
        .orderBy(asc(indicateurValeurTable.dateValeur));

    const readConfidentiel = async (indicateurId: number) => {
      const [indicateurCollectivite] = await databaseService.db
        .select({ confidentiel: indicateurCollectiviteTable.confidentiel })
        .from(indicateurCollectiviteTable)
        .where(eq(indicateurCollectiviteTable.indicateurId, indicateurId));
      return indicateurCollectivite.confidentiel;
    };

    test('reprend les résultats, objectifs et commentaires du parent qui n’en garde aucun', async () => {
      const { caller, parentId } = await createParentWithValeurs();

      const sousIndicateurId = await createSousIndicateur({
        caller,
        parentId,
        titre: 'Sous-indicateur 1',
      });

      expect(await listValeurs(parentId)).toEqual([]);
      expect(await listValeurs(sousIndicateurId)).toEqual([
        {
          dateValeur: '2022-01-01',
          resultat: 500,
          resultatCommentaire: 'Résultat 2022',
          objectif: 480,
          objectifCommentaire: 'Objectif 2022',
        },
        {
          dateValeur: '2023-01-01',
          resultat: 520,
          resultatCommentaire: null,
          objectif: 490,
          objectifCommentaire: null,
        },
      ]);
    });

    test('ne déplace rien quand le parent n’a aucune valeur', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const parentId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Parent sans valeur',
        unite: 't',
      });

      const sousIndicateurId = await createSousIndicateur({
        caller,
        parentId,
        titre: 'Sous-indicateur 1',
      });

      expect(await listValeurs(parentId)).toEqual([]);
      expect(await listValeurs(sousIndicateurId)).toEqual([]);
    });

    test('ne déplace rien vers un deuxième sous-indicateur', async () => {
      const { caller, parentId } = await createParentWithValeurs();
      const firstId = await createSousIndicateur({
        caller,
        parentId,
        titre: 'Sous-indicateur 1',
      });

      const secondId = await createSousIndicateur({
        caller,
        parentId,
        titre: 'Sous-indicateur 2',
      });

      expect(await listValeurs(firstId)).toHaveLength(2);
      expect(await listValeurs(secondId)).toEqual([]);
    });

    test('reprend la confidentialité du parent qui a des valeurs quand la création n’en demande aucune', async () => {
      const { caller, parentId } = await createParentWithValeurs({
        estConfidentiel: true,
      });

      const sousIndicateurId = await createSousIndicateur({
        caller,
        parentId,
        titre: 'Sous-indicateur 1',
      });

      expect(await readConfidentiel(sousIndicateurId)).toBe(true);
    });

    test('ne reprend pas la confidentialité du parent pour un deuxième sous-indicateur sans choix explicite', async () => {
      const { caller, parentId } = await createParentWithValeurs({
        estConfidentiel: true,
      });
      await createSousIndicateur({
        caller,
        parentId,
        titre: 'Sous-indicateur 1',
      });

      const secondId = await createSousIndicateur({
        caller,
        parentId,
        titre: 'Sous-indicateur 2',
      });

      expect(await readConfidentiel(secondId)).toBe(false);
    });

    test('garde la confidentialité demandée explicitement plutôt que celle du parent', async () => {
      const { caller, parentId } = await createParentWithValeurs({
        estConfidentiel: true,
      });

      const sousIndicateurId = await createSousIndicateur({
        caller,
        parentId,
        titre: 'Sous-indicateur 1',
        estConfidentiel: false,
      });

      expect(await readConfidentiel(sousIndicateurId)).toBe(false);
    });

    test('rend confidentiel un sous-indicateur demandé confidentiel sous un parent public qui a des valeurs', async () => {
      const { caller, parentId } = await createParentWithValeurs();

      const sousIndicateurId = await createSousIndicateur({
        caller,
        parentId,
        titre: 'Sous-indicateur 1',
        estConfidentiel: true,
      });

      expect(await readConfidentiel(sousIndicateurId)).toBe(true);
    });

    test('garde la confidentialité demandée quand le parent confidentiel n’a aucune valeur', async () => {
      const caller = router.createCaller({ user: authenticatedUser });
      const parentId = await caller.indicateurs.indicateurs.create({
        collectiviteId: collectivite.id,
        titre: 'Parent confidentiel sans valeur',
        unite: 't',
        estConfidentiel: true,
      });

      const sousIndicateurId = await createSousIndicateur({
        caller,
        parentId,
        titre: 'Sous-indicateur 1',
        estConfidentiel: false,
      });

      expect(await readConfidentiel(sousIndicateurId)).toBe(false);
    });

    test('laisse sur le parent les valeurs issues d’une source importée', async () => {
      const { caller, parentId } = await createParentWithValeurs();
      const [metadonnee] = await databaseService.db
        .insert(indicateurSourceMetadonneeTable)
        .values({
          sourceId: PCAET_COLLECTIVITE_SOURCE_ID,
          dateVersion: new Date().toISOString(),
          nomDonnees: `source-${crypto.randomUUID()}`,
        })
        .returning({ id: indicateurSourceMetadonneeTable.id });
      onTestFinished(async () => {
        await databaseService.db
          .delete(indicateurValeurTable)
          .where(eq(indicateurValeurTable.metadonneeId, metadonnee.id));
        await databaseService.db
          .delete(indicateurSourceMetadonneeTable)
          .where(eq(indicateurSourceMetadonneeTable.id, metadonnee.id));
      });
      await databaseService.db.insert(indicateurValeurTable).values({
        collectiviteId: collectivite.id,
        indicateurId: parentId,
        dateValeur: '2024-01-01',
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        metadonneeId: metadonnee.id,
        resultat: 900,
      });

      const sousIndicateurId = await createSousIndicateur({
        caller,
        parentId,
        titre: 'Sous-indicateur 1',
      });

      expect(await listValeurs(parentId)).toMatchObject([
        { dateValeur: '2024-01-01', resultat: 900 },
      ]);
      expect(await listValeurs(sousIndicateurId)).toHaveLength(2);
    });

    test('reprend les valeurs d’un parent sans préférences de collectivité en le considérant non confidentiel', async () => {
      const { caller, parentId } = await createParentWithValeurs();
      await databaseService.db
        .delete(indicateurCollectiviteTable)
        .where(eq(indicateurCollectiviteTable.indicateurId, parentId));

      const sousIndicateurId = await createSousIndicateur({
        caller,
        parentId,
        titre: 'Sous-indicateur 1',
      });

      expect(await listValeurs(sousIndicateurId)).toHaveLength(2);
      expect(await readConfidentiel(sousIndicateurId)).toBe(false);
    });

    test('annule la création du sous-indicateur quand le déplacement des valeurs échoue', async () => {
      const { caller, parentId } = await createParentWithValeurs();
      const repository = app.get(MutateIndicateurRepository);
      const moveSpy = vi
        .spyOn(repository, 'moveValeursSaisies')
        .mockRejectedValueOnce(new Error('déplacement en échec'));
      onTestFinished(() => moveSpy.mockRestore());

      await expect(
        createSousIndicateur({
          caller,
          parentId,
          titre: 'Sous-indicateur annulé',
        })
      ).rejects.toThrow(/déplacement en échec/);

      const definitions = await databaseService.db
        .select({ id: indicateurDefinitionTable.id })
        .from(indicateurDefinitionTable)
        .where(
          and(
            eq(indicateurDefinitionTable.collectiviteId, collectivite.id),
            eq(indicateurDefinitionTable.titre, 'Sous-indicateur annulé')
          )
        );
      expect(definitions).toEqual([]);
      expect(await listValeurs(parentId)).toHaveLength(2);
    });
  });
});
