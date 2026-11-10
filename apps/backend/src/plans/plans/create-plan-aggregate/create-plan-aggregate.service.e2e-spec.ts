import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { GenerateImportDraftWorker } from '@tet/backend/plans/ai-plan-import/generate-import-draft/generate-import-draft.worker';
import { FicheActionRepository } from '@tet/backend/plans/fiches/fiche-action.repository';
import { ficheActionSharingTable } from '@tet/backend/plans/fiches/share-fiches/fiche-action-sharing.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { failure } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { WebhookService } from '@tet/backend/utils/webhooks/webhook.service';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray, or } from 'drizzle-orm';
import assert from 'node:assert';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { CreatePlanAggregateService } from './create-plan-aggregate.service';
import { CreatePlanAggregateInput } from './create-plan-aggregate.types';

describe('Création transactionnelle de la structure du plan', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let service: CreatePlanAggregateService;
  let transactions: TransactionManager;
  let fixtures: Awaited<ReturnType<typeof addTestCollectiviteAndUser>>[];
  let context: Awaited<ReturnType<typeof createContext>>;
  const webhook = {
    sendWebhookNotification: vi.fn().mockResolvedValue(undefined),
    sendWebhookNotifications: vi.fn().mockResolvedValue(undefined),
  };
  const llm = new FakeLlmRepository();

  const createContext = async (
    role: CollectiviteRole = CollectiviteRole.EDITION
  ) => {
    const fixture = await addTestCollectiviteAndUser(db, { user: { role } });
    fixtures.push(fixture);
    const user = getAuthUserFromUserCredentials(fixture.user);
    return {
      collectiviteId: fixture.collectivite.id,
      user,
      caller: (await getTestRouter(app)).createCaller({ user }),
    };
  };
  const input = (
    overrides: Partial<CreatePlanAggregateInput> = {}
  ): CreatePlanAggregateInput => ({
    collectiviteId: context.collectiviteId,
    nom: 'Plan de test',
    axes: [],
    fiches: [],
    ...overrides,
  });
  const create = (request = input()) =>
    transactions.executeSingle((tx) =>
      service.create(request, { user: context.user, tx })
    );
  const getId = (ids: Map<string, number>, key: string): number => {
    const id = ids.get(key);
    assert(id !== undefined, `Clé absente : ${key}`);
    return id;
  };
  const loadAxe = async (id: number) =>
    (await db.db.select().from(axeTable).where(eq(axeTable.id, id)))[0];
  const loadFiche = async (id: number) =>
    (
      await db.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, id))
    )[0];

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder.overrideProvider(LlmService).useValue(new LlmService(llm));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
        builder.overrideProvider(WebhookService).useValue(webhook);
      },
    });
    db = await getTestDatabase(app);
    service = app.get(CreatePlanAggregateService);
    transactions = app.get(TransactionManager);
  });
  beforeEach(async () => {
    fixtures = [];
    context = await createContext();
    webhook.sendWebhookNotifications.mockClear();
    vi.spyOn(llm, 'complete');
    vi.spyOn(llm, 'chat');
  });
  afterEach(async () => {
    expect(llm.complete).not.toHaveBeenCalled();
    expect(llm.chat).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    const collectiviteIds = fixtures.map(({ collectivite }) => collectivite.id);
    const fiches = db.db
      .select({ id: ficheActionTable.id })
      .from(ficheActionTable)
      .where(inArray(ficheActionTable.collectiviteId, collectiviteIds));
    const axes = db.db
      .select({ id: axeTable.id })
      .from(axeTable)
      .where(inArray(axeTable.collectiviteId, collectiviteIds));
    await db.db
      .delete(ficheActionAxeTable)
      .where(
        or(
          inArray(ficheActionAxeTable.ficheId, fiches),
          inArray(ficheActionAxeTable.axeId, axes)
        )
      );
    await db.db
      .delete(ficheActionIndicateurTable)
      .where(inArray(ficheActionIndicateurTable.ficheId, fiches));
    await db.db
      .delete(ficheActionSharingTable)
      .where(inArray(ficheActionSharingTable.ficheId, fiches));
    await db.db
      .delete(ficheActionTable)
      .where(inArray(ficheActionTable.collectiviteId, collectiviteIds));
    await db.db
      .delete(axeTable)
      .where(inArray(axeTable.collectiviteId, collectiviteIds));
    await db.db
      .delete(indicateurDefinitionTable)
      .where(
        inArray(indicateurDefinitionTable.collectiviteId, collectiviteIds)
      );
    for (const fixture of fixtures.reverse()) await fixture.cleanup();
  });
  afterAll(async () => {
    await app.close();
  });

  test('crée les axes vides et les homonymes avec leurs parents identifiés par clé', async () => {
    const result = await create(
      input({
        pilotes: [{ userId: context.user.id }],
        axes: [
          { sourceKey: 'child', parentSourceKey: 'first', nom: 'Même titre' },
          { sourceKey: 'first', nom: 'Même titre' },
          { sourceKey: 'second', nom: 'Même titre' },
          { sourceKey: 'empty', nom: 'Axe vide' },
        ],
        fiches: [
          {
            sourceKey: 'child-action',
            parentSourceKey: 'action-b',
            axeSourceKey: 'child',
            fiche: { titre: 'Même titre' },
          },
          {
            sourceKey: 'action-a',
            axeSourceKey: 'child',
            fiche: { titre: 'Même titre' },
          },
          {
            sourceKey: 'action-b',
            axeSourceKey: 'child',
            fiche: { titre: 'Même titre' },
          },
          { sourceKey: 'root-action', fiche: { titre: 'À la racine' } },
        ],
      })
    );
    assert(result.success);
    const {
      planId,
      axeIdsBySourceKey: axes,
      ficheIdsBySourceKey: fiches,
    } = result.data;
    expect(new Set(axes.values()).size).toBe(4);
    expect((await loadAxe(getId(axes, 'child'))).parent).toBe(
      axes.get('first')
    );
    expect((await loadAxe(getId(axes, 'empty'))).parent).toBe(planId);
    expect((await loadFiche(getId(fiches, 'child-action'))).parentId).toBe(
      fiches.get('action-b')
    );
    const rootLinks = await db.db
      .select()
      .from(ficheActionAxeTable)
      .where(eq(ficheActionAxeTable.ficheId, getId(fiches, 'root-action')));
    expect(rootLinks.map(({ axeId }) => axeId)).toEqual([planId]);
    expect(webhook.sendWebhookNotifications).not.toHaveBeenCalled();
  });

  test.each([
    { nom: '   ' },
    { axes: [{ sourceKey: 'axe', nom: '   ' }] },
    { existingFiches: [{ sourceKey: 'existing', ficheId: 0 }] },
    { existingFiches: [{ sourceKey: '', ficheId: 1 }] },
    {
      existingFiches: [
        { sourceKey: 'existing', ficheId: 1, axeSourceKey: 'absent' },
      ],
    },
    {
      fiches: [{ sourceKey: 'same', fiche: { titre: 'Action' } }],
      existingFiches: [{ sourceKey: 'same', ficheId: 1 }],
    },
    {
      axes: [
        { sourceKey: 'duplicate', nom: 'A' },
        { sourceKey: 'duplicate', nom: 'B' },
      ],
    },
    { axes: [{ sourceKey: '', nom: 'A' }] },
    { axes: [{ sourceKey: 'a', parentSourceKey: 'absent', nom: 'A' }] },
    {
      axes: [
        { sourceKey: 'a', parentSourceKey: 'b', nom: 'A' },
        { sourceKey: 'b', parentSourceKey: 'a', nom: 'B' },
      ],
    },
    {
      fiches: [
        {
          sourceKey: 'fiche',
          axeSourceKey: 'absent',
          fiche: { titre: 'Action' },
        },
      ],
    },
    {
      fiches: [
        {
          sourceKey: 'fiche',
          parentSourceKey: 'absent',
          fiche: { titre: 'Action' },
        },
      ],
    },
    {
      fiches: [
        {
          sourceKey: 'fiche',
          parentSourceKey: 'fiche',
          fiche: { titre: 'Action' },
        },
      ],
    },
    {
      fiches: [
        { sourceKey: 'same', fiche: { titre: 'A' } },
        { sourceKey: 'same', fiche: { titre: 'B' } },
      ],
    },
  ] satisfies Partial<CreatePlanAggregateInput>[])(
    'refuse une structure incohérente sans créer de plan : %j',
    async (invalid) => {
      expect(await create(input(invalid))).toMatchObject({
        success: false,
        error: 'INVALID_DATA',
      });
      expect(
        await db.db
          .select()
          .from(axeTable)
          .where(eq(axeTable.collectiviteId, context.collectiviteId))
      ).toEqual([]);
      expect(webhook.sendWebhookNotifications).not.toHaveBeenCalled();
    }
  );

  test('conserve la fiche existante, ses enfants, indicateurs et liens, même en cas de répétition', async () => {
    const source = await create(
      input({
        fiches: [
          {
            sourceKey: 'parent',
            fiche: { titre: 'Conserver', description: 'Texte initial' },
          },
          {
            sourceKey: 'child',
            parentSourceKey: 'parent',
            fiche: { titre: 'Enfant initial' },
          },
        ],
      })
    );
    assert(source.success);
    const ficheId = getId(source.data.ficheIdsBySourceKey, 'parent');
    const childId = getId(source.data.ficheIdsBySourceKey, 'child');
    const before = [await loadFiche(ficheId), await loadFiche(childId)];
    const oldLinks = await db.db
      .select()
      .from(ficheActionAxeTable)
      .where(eq(ficheActionAxeTable.ficheId, ficheId));
    const [indicateur] = await db.db
      .insert(indicateurDefinitionTable)
      .values({
        collectiviteId: context.collectiviteId,
        titre: 'Indicateur conservé',
        unite: 'MWh',
      })
      .returning();
    const indicatorLinks = await db.db
      .insert(ficheActionIndicateurTable)
      .values({
        ficheId,
        indicateurId: indicateur.id,
        createdBy: context.user.id,
      })
      .returning();
    const result = await create(
      input({
        axes: [{ sourceKey: 'new-axe', nom: 'Destination' }],
        existingFiches: [
          { sourceKey: 'existing', ficheId, axeSourceKey: 'new-axe' },
          { sourceKey: 'repeated', ficheId, axeSourceKey: 'new-axe' },
        ],
      })
    );
    assert(result.success);
    expect(result.data.createdFicheIds).toEqual([]);
    expect(result.data.ficheIdsBySourceKey.get('existing')).toBe(ficheId);
    expect([await loadFiche(ficheId), await loadFiche(childId)]).toEqual(
      before
    );
    const links = await db.db
      .select()
      .from(ficheActionAxeTable)
      .where(eq(ficheActionAxeTable.ficheId, ficheId));
    expect(links).toHaveLength(oldLinks.length + 1);
    expect(links).toEqual(expect.arrayContaining(oldLinks));
    expect(
      await db.db
        .select()
        .from(ficheActionIndicateurTable)
        .where(eq(ficheActionIndicateurTable.ficheId, ficheId))
    ).toEqual(indicatorLinks);
    await db.db.transaction(async (tx) => {
      expect(
        (
          await app
            .get(FicheActionRepository)
            .addAxeLinks(
              ficheId,
              [getId(result.data.axeIdsBySourceKey, 'new-axe')],
              context.user.id,
              tx
            )
        ).success
      ).toBe(true);
    });
    expect(
      await db.db
        .select()
        .from(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.ficheId, ficheId))
    ).toEqual(links);
  });

  test('accepte une fiche partagée et refuse une fiche extérieure ou un partage révoqué', async () => {
    const owner = await createContext();
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({ collectiviteId: owner.collectiviteId, titre: 'Fiche partagée' })
      .returning();
    const request = input({
      existingFiches: [{ sourceKey: 'shared', ficheId: fiche.id }],
    });
    expect(await create(request)).toMatchObject({
      success: false,
      error: 'UNAUTHORIZED',
    });
    await db.db
      .insert(ficheActionSharingTable)
      .values({ ficheId: fiche.id, collectiviteId: context.collectiviteId });
    const linked = await create(request);
    assert(linked.success);
    expect(linked.data.ficheIdsBySourceKey.get('shared')).toBe(fiche.id);
    expect(await loadFiche(fiche.id)).toEqual(fiche);
    await db.db
      .delete(ficheActionSharingTable)
      .where(eq(ficheActionSharingTable.ficheId, fiche.id));
    expect(await create(request)).toMatchObject({
      success: false,
      error: 'UNAUTHORIZED',
    });
  });

  test('refuse un lecteur et une fiche supprimée', async () => {
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: context.collectiviteId,
        titre: 'Supprimée',
        deleted: true,
      })
      .returning();
    expect(
      await create(
        input({ existingFiches: [{ sourceKey: 'deleted', ficheId: fiche.id }] })
      )
    ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    context = await createContext(CollectiviteRole.LECTURE);
    expect(await create()).toMatchObject({
      success: false,
      error: 'UNAUTHORIZED',
    });
  });

  test('annule plan, axes, fiches et liens si la transaction englobante échoue', async () => {
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({ collectiviteId: context.collectiviteId, titre: 'Existante' })
      .returning();
    const result = await transactions.executeSingle(async (tx) => {
      const created = await service.create(
        input({
          axes: [
            {
              sourceKey: 'axe',
              nom: 'Axe',
            },
          ],
          fiches: [
            {
              sourceKey: 'new',
              fiche: { titre: 'Nouvelle' },
            },
          ],
          existingFiches: [{ sourceKey: 'existing', ficheId: fiche.id }],
        }),
        { user: context.user, tx }
      );
      assert(created.success);
      return failure('rollback demandé par le propriétaire');
    });
    expect(result.success).toBe(false);
    expect(
      await db.db
        .select()
        .from(axeTable)
        .where(eq(axeTable.collectiviteId, context.collectiviteId))
    ).toEqual([]);
    expect(
      await db.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.collectiviteId, context.collectiviteId))
    ).toEqual([fiche]);
    expect(
      await db.db
        .select()
        .from(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.ficheId, fiche.id))
    ).toEqual([]);
    expect(webhook.sendWebhookNotifications).not.toHaveBeenCalled();
  });
});
