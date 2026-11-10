import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { createIndicateurInputSchema } from '@tet/backend/indicateurs/indicateurs/mutate-indicateur/mutate-indicateur.input';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { GenerateImportDraftWorker } from '@tet/backend/plans/ai-plan-import/generate-import-draft/generate-import-draft.worker';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { failure } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray } from 'drizzle-orm';
import assert from 'node:assert';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  onTestFinished,
  test,
} from 'vitest';
import { CreatePlanAggregateOutput } from '../create-plan-aggregate/create-plan-aggregate.types';
import { PersistPlanIndicateursService } from './persist-plan-indicateurs.service';
import { PersistPlanIndicateursInput } from './persist-plan-indicateurs.types';

describe('Persistance des indicateurs d’un plan', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let service: PersistPlanIndicateursService;
  let transactions: TransactionManager;

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder
          .overrideProvider(LlmService)
          .useValue(new LlmService(new FakeLlmRepository()));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
      },
    });
    db = await getTestDatabase(app);
    service = app.get(PersistPlanIndicateursService);
    transactions = app.get(TransactionManager);
  });

  afterAll(async () => {
    await app?.close();
  });

  async function createFixture() {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const collectiviteId = fixture.collectivite.id;
    onTestFinished(async () => {
      const fiches = db.db
        .select({ id: ficheActionTable.id })
        .from(ficheActionTable)
        .where(eq(ficheActionTable.collectiviteId, collectiviteId));
      await db.db
        .delete(ficheActionIndicateurTable)
        .where(inArray(ficheActionIndicateurTable.ficheId, fiches));
      await db.db
        .delete(ficheActionAxeTable)
        .where(inArray(ficheActionAxeTable.ficheId, fiches));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.collectiviteId, collectiviteId));
      await db.db
        .delete(axeTable)
        .where(eq(axeTable.collectiviteId, collectiviteId));
      await db.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.collectiviteId, collectiviteId));
      await db.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.collectiviteId, collectiviteId));
      await fixture.cleanup();
    });
    const [plan] = await db.db
      .insert(axeTable)
      .values({ collectiviteId, nom: 'Plan de test' })
      .returning();
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId,
        titre: 'Action de test',
        description: 'Contenu conservé',
      })
      .returning();
    await db.db.insert(ficheActionAxeTable).values({
      ficheId: fiche.id,
      axeId: plan.id,
      createdBy: fixture.user.id,
    });
    return {
      collectiviteId,
      fiche,
      plan: {
        planId: plan.id,
        axeIdsBySourceKey: new Map([['plan', plan.id]]),
        ficheIdsBySourceKey: new Map([['fiche', fiche.id]]),
        createdFicheIds: [fiche.id],
      } satisfies CreatePlanAggregateOutput,
      user: getAuthUserFromUserCredentials(fixture.user),
    };
  }

  const definition = createIndicateurInputSchema
    .omit({ collectiviteId: true, ficheId: true })
    .parse({
      titre: 'Consommation annuelle',
      unite: 'MWh',
      periodicite: 'annuelle',
    });
  const readDefinitions = (collectiviteId: number) =>
    db.db
      .select()
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.collectiviteId, collectiviteId));
  const readValeurs = (indicateurId: number) =>
    db.db
      .select()
      .from(indicateurValeurTable)
      .where(eq(indicateurValeurTable.indicateurId, indicateurId));
  const readLinks = (indicateurId: number) =>
    db.db
      .select()
      .from(ficheActionIndicateurTable)
      .where(eq(ficheActionIndicateurTable.indicateurId, indicateurId));

  const persist = (
    fixture: Awaited<ReturnType<typeof createFixture>>,
    indicateurs: PersistPlanIndicateursInput['indicateurs']
  ) =>
    transactions.executeSingle(async (tx) => {
      const input = { collectiviteId: fixture.collectiviteId, indicateurs };
      const context = { user: fixture.user, tx };
      const checked = await service.lockAndValidate(input, context);
      return checked.success
        ? service.persist(input, fixture.plan, context)
        : checked;
    });

  test('crée un personnalisé, conserve zéro et complète les cellules manquantes sans remplacer les liens ni les valeurs', async () => {
    const fixture = await createFixture();
    const { collectiviteId } = fixture;
    const created = await persist(fixture, [
      {
        sourceKey: 'consommation',
        target: { ficheSourceKey: 'fiche' },
        definition,
        valeurs: {
          scope: 'collectivite',
          values: [
            { dateValeur: '2026-01-01', periodicite: 'annuelle', resultat: 0 },
          ],
        },
      },
    ]);
    assert(created.success, JSON.stringify(created));
    const indicateurId =
      created.data.indicateurIdsBySourceKey.get('consommation');
    assert(indicateurId !== undefined);
    expect(created.data.conflits).toEqual([]);
    expect(await readDefinitions(collectiviteId)).toMatchObject([
      {
        id: indicateurId,
        titre: definition.titre,
        unite: 'MWh',
        periodicite: 'annuelle',
      },
    ]);
    expect(await readValeurs(indicateurId)).toMatchObject([
      { resultat: 0, objectif: null },
    ]);
    const originalLinks = await readLinks(indicateurId);
    const [secondFiche] = await db.db
      .insert(ficheActionTable)
      .values({ collectiviteId, titre: 'Seconde action' })
      .returning();
    fixture.plan.ficheIdsBySourceKey.set('seconde-fiche', secondFiche.id);
    const entries: PersistPlanIndicateursInput['indicateurs'] = [
      {
        sourceKey: 'consommation',
        indicateurId,
        target: { ficheSourceKey: 'seconde-fiche' },
        valeurs: {
          scope: 'collectivite',
          values: [
            {
              dateValeur: '2026-01-01',
              periodicite: 'annuelle',
              resultat: 9,
              objectif: 12,
            },
          ],
        },
      },
    ];

    const completed = await persist(fixture, entries);

    assert(completed.success, JSON.stringify(completed));
    expect(completed.data.conflits).toMatchObject([
      {
        sourceKey: 'consommation',
        conflit: {
          indicateurId,
          field: 'resultat',
          existingValue: 0,
          incomingValue: 9,
        },
      },
    ]);
    const links = await readLinks(indicateurId);
    expect(links).toHaveLength(2);
    expect(links).toEqual(expect.arrayContaining(originalLinks));
    const valeurs = await readValeurs(indicateurId);
    expect(valeurs).toMatchObject([
      { resultat: 0, objectif: 12, metadonneeId: null },
    ]);

    expect(await persist(fixture, entries)).toEqual(completed);
    expect(await readDefinitions(collectiviteId)).toHaveLength(1);
    expect(await readLinks(indicateurId)).toEqual(links);
    expect(await readValeurs(indicateurId)).toEqual(valeurs);
  });

  test('sans valeurs fournies, lie l’indicateur existant et conserve son contenu, ses valeurs et la fiche', async () => {
    const fixture = await createFixture();
    const { collectiviteId, fiche } = fixture;
    const [indicateur] = await db.db
      .insert(indicateurDefinitionTable)
      .values({
        collectiviteId,
        titre: 'Titre préservé',
        description: 'Description préservée',
        unite: 'kWh',
      })
      .returning();
    const [valeur] = await db.db
      .insert(indicateurValeurTable)
      .values({
        collectiviteId,
        indicateurId: indicateur.id,
        dateValeur: '2026-01-01',
        resultat: 0,
        objectif: 50,
      })
      .returning();

    const result = await persist(fixture, [
      {
        sourceKey: 'existant',
        target: { ficheSourceKey: 'fiche' },
        indicateurId: indicateur.id,
      },
    ]);

    expect(result).toEqual({
      success: true,
      data: {
        indicateurIdsBySourceKey: new Map([['existant', indicateur.id]]),
        conflits: [],
      },
    });
    expect(await readLinks(indicateur.id)).toMatchObject([
      { ficheId: fiche.id },
    ]);
    expect(await readDefinitions(collectiviteId)).toEqual([indicateur]);
    expect(await readValeurs(indicateur.id)).toEqual([valeur]);
    expect(
      await db.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, fiche.id))
    ).toEqual([fiche]);
  });

  test('annule le personnalisé créé si la fiche ne peut pas être liée à la collectivité', async () => {
    const fixture = await createFixture();
    const other = await createFixture();
    fixture.plan.ficheIdsBySourceKey.set('autre-fiche', other.fiche.id);

    const result = await persist(fixture, [
      {
        sourceKey: 'consommation',
        target: { ficheSourceKey: 'autre-fiche' },
        definition,
        valeurs: {
          scope: 'collectivite',
          values: [
            { dateValeur: '2026-01-01', periodicite: 'annuelle', resultat: 5 },
          ],
        },
      },
    ]);

    expect(result).toMatchObject({
      success: false,
      error: [{ code: 'UNAUTHORIZED', sourceKey: 'consommation' }],
    });
    expect(await readDefinitions(fixture.collectiviteId)).toEqual([]);
    expect(
      await db.db
        .select()
        .from(indicateurValeurTable)
        .where(eq(indicateurValeurTable.collectiviteId, fixture.collectiviteId))
    ).toEqual([]);
    expect(
      await db.db
        .select()
        .from(ficheActionIndicateurTable)
        .where(eq(ficheActionIndicateurTable.ficheId, other.fiche.id))
    ).toEqual([]);
  });

  test('annule définition, lien et valeurs si la transaction appelante échoue après la persistance', async () => {
    const fixture = await createFixture();
    const { collectiviteId, user } = fixture;
    let indicateurId: number | undefined;
    const input: PersistPlanIndicateursInput = {
      collectiviteId,
      indicateurs: [
        {
          sourceKey: 'consommation',
          target: { ficheSourceKey: 'fiche' },
          definition,
          valeurs: {
            scope: 'collectivite',
            values: [
              {
                dateValeur: '2026-01-01',
                periodicite: 'annuelle',
                resultat: 10,
              },
            ],
          },
        },
      ],
    };

    const result = await transactions.executeSingle(async (tx) => {
      const checked = await service.lockAndValidate(input, { user, tx });
      assert(checked.success, JSON.stringify(checked));
      const persisted = await service.persist(input, fixture.plan, {
        user,
        tx,
      });
      assert(persisted.success, JSON.stringify(persisted));
      indicateurId =
        persisted.data.indicateurIdsBySourceKey.get('consommation');
      assert(indicateurId !== undefined);
      expect(
        await tx
          .select()
          .from(ficheActionIndicateurTable)
          .where(eq(ficheActionIndicateurTable.indicateurId, indicateurId))
      ).toHaveLength(1);
      expect(
        await tx
          .select()
          .from(indicateurValeurTable)
          .where(eq(indicateurValeurTable.indicateurId, indicateurId))
      ).toHaveLength(1);
      return failure('LATER_FAILURE');
    });

    expect(result).toEqual({ success: false, error: 'LATER_FAILURE' });
    assert(indicateurId !== undefined);
    expect(await readDefinitions(collectiviteId)).toEqual([]);
    expect(await readLinks(indicateurId)).toEqual([]);
    expect(await readValeurs(indicateurId)).toEqual([]);
  });

  test('refuse une définition différente de celle résolue avant toute écriture du lot', async () => {
    const fixture = await createFixture();
    const [indicateur] = await db.db
      .insert(indicateurDefinitionTable)
      .values({
        collectiviteId: fixture.collectiviteId,
        titre: 'Indicateur modifié',
        unite: 'kWh',
      })
      .returning();

    const result = await persist(fixture, [
      { sourceKey: 'nouveau', target: { ficheSourceKey: 'fiche' }, definition },
      {
        sourceKey: 'existant',
        target: { ficheSourceKey: 'fiche' },
        indicateurId: indicateur.id,
        expectedDefinition: {
          identifiantReferentiel: null,
          unite: 'MWh',
          periodicite: 'annuelle',
        },
      },
    ]);

    expect(result).toMatchObject({
      success: false,
      error: [{ code: 'REFERENCES_CHANGED', sourceKey: 'existant' }],
    });
    expect(await readDefinitions(fixture.collectiviteId)).toEqual([indicateur]);
    expect(await readLinks(indicateur.id)).toEqual([]);
    expect(await readValeurs(indicateur.id)).toEqual([]);
  });

  test('annule le lot quand une cible documentaire ne correspond à aucune fiche du plan', async () => {
    const fixture = await createFixture();

    const result = await persist(fixture, [
      { sourceKey: 'premier', target: { ficheSourceKey: 'fiche' }, definition },
      {
        sourceKey: 'sans-cible',
        target: { ficheSourceKey: 'inconnue' },
        definition,
      },
    ]);

    assert(!result.success);
    expect(result.error).toContainEqual(
      expect.objectContaining({ sourceKey: 'sans-cible' })
    );
    expect(await readDefinitions(fixture.collectiviteId)).toEqual([]);
    expect(
      await db.db
        .select()
        .from(ficheActionIndicateurTable)
        .where(eq(ficheActionIndicateurTable.ficheId, fixture.fiche.id))
    ).toEqual([]);
  });
});
