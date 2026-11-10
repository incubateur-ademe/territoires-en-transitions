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
import { planActionTypeCategorieTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type-categorie.table';
import { planActionTypeTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
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
import { and, eq, inArray, or, sql } from 'drizzle-orm';
import {
  ELECTRIFICATION_PLAN_TYPE_KEY,
  ElectrificationEngagementCodeEnum,
  ElectrificationLaureatsConfig,
  FicheReferenceKindEnum,
  PlanReferenceProgrammeEnum,
} from '@tet/domain/plans';
import { GetPlanReferencesService } from '../get-plan-references/get-plan-references.service';
import { CheckElectrificationEligibilityService } from '../check-electrification-eligibility/check-electrification-eligibility.service';
import { ELECTRIFICATION_LAUREATS_CONFIG } from '../check-electrification-eligibility/electrification-eligibility.constants';
import { ElectrificationImportAuthorization } from '@tet/backend/plans/ai-plan-import/electrification/persist-import/electrification-import-authorization';
import { UpsertPlanService } from '../upsert-plan/upsert-plan.service';
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
  let electrificationTypeId: number;
  const laureats: ElectrificationLaureatsConfig = {
    source: 'Fixture synthétique',
    version: 'test-autorisation',
    validFrom: '2020-01-01T00:00:00.000Z',
    validUntil: '2099-01-01T00:00:00.000Z',
    laureats: [],
  };
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
        builder
          .overrideProvider(ELECTRIFICATION_LAUREATS_CONFIG)
          .useValue(laureats);
      },
    });
    db = await getTestDatabase(app);
    service = app.get(CreatePlanAggregateService);
    transactions = app.get(TransactionManager);
    await db.db
      .insert(planActionTypeCategorieTable)
      .values({ categorie: ELECTRIFICATION_PLAN_TYPE_KEY.categorie })
      .onConflictDoNothing();
    await db.db
      .insert(planActionTypeTable)
      .values(ELECTRIFICATION_PLAN_TYPE_KEY)
      .onConflictDoNothing();
    const [type] = await db.db
      .select()
      .from(planActionTypeTable)
      .where(
        and(
          eq(
            planActionTypeTable.categorie,
            ELECTRIFICATION_PLAN_TYPE_KEY.categorie
          ),
          eq(planActionTypeTable.type, ELECTRIFICATION_PLAN_TYPE_KEY.type)
        )
      );
    electrificationTypeId = type.id;
  });
  beforeEach(async () => {
    fixtures = [];
    context = await createContext();
    laureats.laureats = [
      { reference: 'laureat-test', collectiviteId: context.collectiviteId },
    ];
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
    await db.db
      .delete(utilisateurCollectiviteAccessTable)
      .where(
        inArray(
          utilisateurCollectiviteAccessTable.collectiviteId,
          collectiviteIds
        )
      );
    for (const fixture of fixtures.reverse()) await fixture.cleanup();
  });
  afterAll(async () => {
    await app.close();
  });

  test('autorise le vrai type Électrification uniquement dans le contexte interne de création', async () => {
    expect(
      await create(input({ typeId: electrificationTypeId }))
    ).toMatchObject({
      success: false,
      error: 'ELECTRIFICATION_CREATION_DISABLED',
    });
    await expect(
      context.caller.plans.plans.create({
        collectiviteId: context.collectiviteId,
        nom: 'Création ordinaire',
        typeId: electrificationTypeId,
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    const created = await transactions.executeSingle(async (tx) => {
      const authorization =
        await ElectrificationImportAuthorization.forCollectivite(
          app.get(CheckElectrificationEligibilityService),
          { collectiviteId: context.collectiviteId },
          { user: context.user, tx }
        );
      assert(authorization.success);
      expect(authorization.data.typeId).toBe(electrificationTypeId);
      expect(
        authorization.data.matches(
          {
            collectiviteId: context.collectiviteId,
            typeId: electrificationTypeId + 1,
          },
          { user: context.user, tx }
        )
      ).toBe(false);
      return service.create(input({ typeId: authorization.data.typeId }), {
        user: context.user,
        tx,
        planCreateAuthorization: authorization.data,
      });
    });
    assert(created.success);
    expect((await loadAxe(created.data.planId)).typeId).toBe(
      electrificationTypeId
    );
    await expect(
      context.caller.plans.plans.duplicate({
        planId: created.data.planId,
        nom: 'Duplication ordinaire',
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test.each(['utilisateur', 'collectivité'] as const)(
    "refuse de réutiliser l'autorisation pour un autre périmètre : %s",
    async (scope) => {
      const other = await createContext();
      const user = scope === 'utilisateur' ? other.user : context.user;
      const collectiviteId =
        scope === 'collectivité'
          ? other.collectiviteId
          : context.collectiviteId;
      await db.db.insert(utilisateurCollectiviteAccessTable).values({
        userId: user.id,
        collectiviteId,
        role: CollectiviteRole.EDITION,
        isActive: true,
      });
      const result = await transactions.executeSingle(async (tx) => {
        const authorization =
          await ElectrificationImportAuthorization.forCollectivite(
            app.get(CheckElectrificationEligibilityService),
            { collectiviteId: context.collectiviteId },
            { user: context.user, tx }
          );
        assert(authorization.success);
        return service.create(
          input({ collectiviteId, typeId: authorization.data.typeId }),
          {
            user,
            tx,
            planCreateAuthorization: authorization.data,
          }
        );
      });
      expect(result).toMatchObject({
        success: false,
        error: 'ELECTRIFICATION_CREATION_DISABLED',
      });
      expect(
        await db.db
          .select()
          .from(axeTable)
          .where(eq(axeTable.collectiviteId, collectiviteId))
      ).toEqual([]);
    }
  );

  test("refuse de réutiliser l'autorisation dans une autre transaction", async () => {
    const authorization = await transactions.executeSingle((tx) =>
      ElectrificationImportAuthorization.forCollectivite(
        app.get(CheckElectrificationEligibilityService),
        { collectiviteId: context.collectiviteId },
        { user: context.user, tx }
      )
    );
    assert(authorization.success);
    const result = await transactions.executeSingle((tx) =>
      service.create(input({ typeId: authorization.data.typeId }), {
        user: context.user,
        tx,
        planCreateAuthorization: authorization.data,
      })
    );
    expect(result).toMatchObject({
      success: false,
      error: 'ELECTRIFICATION_CREATION_DISABLED',
    });
  });

  test("l'autorisation ne permet pas de convertir un plan existant", async () => {
    const ordinary = await create();
    assert(ordinary.success);
    const result = await transactions.executeSingle(async (tx) => {
      const authorization =
        await ElectrificationImportAuthorization.forCollectivite(
          app.get(CheckElectrificationEligibilityService),
          { collectiviteId: context.collectiviteId },
          { user: context.user, tx }
        );
      assert(authorization.success);
      return app.get(UpsertPlanService).upsertPlan(
        {
          id: ordinary.data.planId,
          collectiviteId: context.collectiviteId,
          typeId: authorization.data.typeId,
        },
        {
          user: context.user,
          tx,
          planCreateAuthorization: authorization.data,
        }
      );
    });
    expect(result).toMatchObject({
      success: false,
      error: 'ELECTRIFICATION_CREATION_DISABLED',
    });
    expect((await loadAxe(ordinary.data.planId)).typeId).toBeNull();
  });

  test.each([
    ['non lauréat', 'UNAUTHORIZED'],
    ['configuration absente', 'ELECTRIFICATION_LAUREATS_UNAVAILABLE'],
  ] as const)("ne délivre pas d'autorisation : %s", async (scenario, error) => {
    laureats.laureats = [];
    const eligibility =
      scenario === 'configuration absente'
        ? new CheckElectrificationEligibilityService(
            null,
            app.get(PermissionService)
          )
        : app.get(CheckElectrificationEligibilityService);
    const result = await transactions.executeSingle((tx) =>
      ElectrificationImportAuthorization.forCollectivite(
        eligibility,
        { collectiviteId: context.collectiviteId },
        { user: context.user, tx }
      )
    );
    expect(result).toMatchObject({ success: false, error });
  });

  const programme = PlanReferenceProgrammeEnum.ELECTRIFICATION;
  const selectedCodes = [
    ElectrificationEngagementCodeEnum.SORTIE_FIOUL_LOGEMENTS_PRIVES,
    ElectrificationEngagementCodeEnum.SORTIE_GAZ_LOGEMENTS_PRIVES,
    ElectrificationEngagementCodeEnum.DECOMMISSIONNEMENT_RESEAU_GAZ,
  ];
  const referencedInput = () =>
    input({
      engagements: { programme, codes: selectedCodes },
      axes: [
        {
          sourceKey: 'logements',
          nom: 'Logements',
          reference: { programme, code: '1' },
        },
        {
          sourceKey: 'bornes',
          nom: 'Bornes',
          reference: { programme, code: '6' },
        },
        { sourceKey: 'libre', nom: 'Libre' },
      ],
      fiches: [
        {
          sourceKey: 'action',
          axeSourceKey: 'logements',
          fiche: { titre: 'Action' },
          reference: {
            programme,
            kind: FicheReferenceKindEnum.ACTION,
            code: 'ACTION_TEST',
          },
        },
        {
          sourceKey: 'sous-action',
          parentSourceKey: 'action',
          fiche: { titre: 'Sous-action' },
          reference: {
            programme,
            kind: FicheReferenceKindEnum.SOUS_ACTION,
            code: 'SOUS_ACTION_TEST',
            parentCode: 'ACTION_TEST',
          },
        },
        {
          sourceKey: 'booleen',
          parentSourceKey: 'action',
          fiche: { titre: 'Jalon' },
          reference: {
            programme,
            kind: FicheReferenceKindEnum.INDICATEUR_BOOLEEN,
            code: 'BOOLEEN_TEST',
          },
        },
        {
          sourceKey: 'engagement',
          fiche: { titre: 'Décommissionnement' },
          reference: {
            programme,
            kind: FicheReferenceKindEnum.ENGAGEMENT,
            code: ElectrificationEngagementCodeEnum.DECOMMISSIONNEMENT_RESEAU_GAZ,
          },
        },
      ],
    });
  const readReferences = (planId: number) =>
    transactions.executeSingle((tx) =>
      app
        .get(GetPlanReferencesService)
        .get({ planId }, { user: context.user, tx })
    );

  test('conserve les références après édition sans déduire la sélection des axes présents', async () => {
    const created = await create(referencedInput());
    assert(
      created.success,
      created.success ? undefined : created.cause?.message ?? created.error
    );
    const {
      planId,
      axeIdsBySourceKey: axes,
      ficheIdsBySourceKey: fiches,
    } = created.data;
    const before = await readReferences(planId);
    assert(before.success);
    expect(before.data.engagements).toEqual({
      programme,
      codes: selectedCodes,
    });
    expect(before.data.axes).toHaveLength(2);
    expect(before.data.fiches).toHaveLength(4);
    expect((await loadAxe(getId(axes, 'libre'))).referenceCode).toBeNull();
    await context.caller.plans.axes.update({
      id: getId(axes, 'logements'),
      collectiviteId: context.collectiviteId,
      planId,
      parent: getId(axes, 'libre'),
      nom: 'Titre changé',
    });
    await context.caller.plans.fiches.update({
      ficheId: getId(fiches, 'action'),
      ficheFields: {
        titre: 'Action renommée',
        axes: [{ id: getId(axes, 'bornes') }],
      },
      isNotificationEnabled: false,
    });
    const edited = await readReferences(planId);
    assert(edited.success);
    expect(edited.data.engagements).toEqual(before.data.engagements);
    expect(edited.data.axes).toHaveLength(before.data.axes.length);
    expect(edited.data.axes).toEqual(expect.arrayContaining(before.data.axes));
    expect(edited.data.fiches).toHaveLength(before.data.fiches.length);
    expect(edited.data.fiches).toEqual(
      expect.arrayContaining(before.data.fiches)
    );
    // Les sous-actions suivent leur parent, même sans lien d'axe propre.
    await db.db
      .delete(ficheActionAxeTable)
      .where(eq(ficheActionAxeTable.ficheId, getId(fiches, 'sous-action')));
    const withoutChildLink = await readReferences(planId);
    assert(withoutChildLink.success);
    expect(
      withoutChildLink.data.fiches.map(({ ficheId }) => ficheId)
    ).toContain(getId(fiches, 'sous-action'));
    // Un lien propre résiduel ne doit pas retenir l'enfant si son parent est détaché.
    await db.db.insert(ficheActionAxeTable).values({
      ficheId: getId(fiches, 'sous-action'),
      axeId: planId,
      createdBy: context.user.id,
    });
    await db.db
      .update(ficheActionTable)
      .set({ deleted: true })
      .where(eq(ficheActionTable.id, getId(fiches, 'booleen')));
    const after = await readReferences(planId);
    assert(after.success);
    expect(after.data.fiches.map(({ ficheId }) => ficheId)).not.toContain(
      getId(fiches, 'booleen')
    );
    await db.db
      .delete(ficheActionAxeTable)
      .where(eq(ficheActionAxeTable.ficheId, getId(fiches, 'action')));
    const detached = await readReferences(planId);
    assert(detached.success);
    expect(detached.data.fiches.map(({ ficheId }) => ficheId)).not.toContain(
      getId(fiches, 'action')
    );
    expect(detached.data.fiches.map(({ ficheId }) => ficheId)).not.toContain(
      getId(fiches, 'sous-action')
    );
  });

  test('masque les références des enfants quand leur parent est restreint', async () => {
    const created = await create(referencedInput());
    assert(created.success);
    const other = await createContext();
    await db.db
      .update(ficheActionTable)
      .set({ restreint: true })
      .where(
        eq(
          ficheActionTable.id,
          getId(created.data.ficheIdsBySourceKey, 'action')
        )
      );
    const result = await transactions.executeSingle((tx) =>
      app
        .get(GetPlanReferencesService)
        .get({ planId: created.data.planId }, { user: other.user, tx })
    );
    assert(result.success);
    expect(result.data.fiches.map(({ ficheId }) => ficheId)).toEqual([
      getId(created.data.ficheIdsBySourceKey, 'engagement'),
    ]);
  });

  test('conserve le parent catalogue des sous-actions après déplacement et autorise plusieurs fiches de même action', async () => {
    const request = referencedInput();
    request.fiches.push(
      {
        sourceKey: 'autre-parent',
        fiche: { titre: 'Autre action' },
        reference: {
          programme,
          kind: FicheReferenceKindEnum.ACTION,
          code: 'AUTRE_ACTION',
        },
      },
      {
        sourceKey: 'autre-enfant',
        parentSourceKey: 'autre-parent',
        fiche: { titre: 'Même code local' },
        reference: {
          programme,
          kind: FicheReferenceKindEnum.SOUS_ACTION,
          code: 'SOUS_ACTION_TEST',
          parentCode: 'AUTRE_ACTION',
        },
      },
      {
        sourceKey: 'action-repetee',
        fiche: { titre: 'Autre mise en œuvre' },
        reference: {
          programme,
          kind: FicheReferenceKindEnum.ACTION,
          code: 'ACTION_TEST',
        },
      }
    );
    const result = await create(request);
    assert(
      result.success,
      result.success ? undefined : result.cause?.message ?? result.error
    );
    const childId = getId(result.data.ficheIdsBySourceKey, 'sous-action');
    const otherChildId = getId(result.data.ficheIdsBySourceKey, 'autre-enfant');
    await db.db
      .update(ficheActionTable)
      .set({ parentId: getId(result.data.ficheIdsBySourceKey, 'autre-parent') })
      .where(eq(ficheActionTable.id, childId));
    const references = await readReferences(result.data.planId);
    assert(references.success);
    expect(references.data.fiches).toEqual(
      expect.arrayContaining([
        {
          ficheId: childId,
          reference: {
            programme,
            kind: FicheReferenceKindEnum.SOUS_ACTION,
            code: 'SOUS_ACTION_TEST',
            parentCode: 'ACTION_TEST',
          },
        },
        {
          ficheId: otherChildId,
          reference: {
            programme,
            kind: FicheReferenceKindEnum.SOUS_ACTION,
            code: 'SOUS_ACTION_TEST',
            parentCode: 'AUTRE_ACTION',
          },
        },
      ])
    );
    expect(
      references.data.fiches.filter(
        ({ reference }) =>
          reference.kind === FicheReferenceKindEnum.ACTION &&
          reference.code === 'ACTION_TEST'
      )
    ).toHaveLength(2);
  });

  test('une duplication ordinaire ne copie ni sélection ni références', async () => {
    const created = await create(referencedInput());
    assert(
      created.success,
      created.success ? undefined : created.cause?.message ?? created.error
    );
    const duplicate = await context.caller.plans.plans.duplicate({
      planId: created.data.planId,
      nom: 'Copie',
    });
    expect(await readReferences(duplicate.planId)).toMatchObject({
      success: true,
      data: { engagements: null, axes: [], fiches: [] },
    });
    expect((await readReferences(created.data.planId)).success).toBe(true);
  });

  test('annule structure et références avec la transaction appelante', async () => {
    const result = await transactions.executeSingle(async (tx) => {
      const created = await service.create(referencedInput(), {
        user: context.user,
        tx,
      });
      assert(
        created.success,
        created.success ? undefined : created.cause?.message ?? created.error
      );
      const refs = await app
        .get(GetPlanReferencesService)
        .get({ planId: created.data.planId }, { user: context.user, tx });
      expect(refs).toMatchObject({
        success: true,
        data: { engagements: { codes: selectedCodes } },
      });
      return failure('ROLLBACK_TEST');
    });
    expect(result).toMatchObject({ success: false, error: 'ROLLBACK_TEST' });
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
    ).toEqual([]);
  });

  test('refuse l’attribution par les routes publiques sans modifier les références', async () => {
    const created = await create(referencedInput());
    assert(
      created.success,
      created.success ? undefined : created.cause?.message ?? created.error
    );
    const before = await readReferences(created.data.planId);
    await expect(
      context.caller.plans.plans.update({
        id: created.data.planId,
        collectiviteId: context.collectiviteId,
        engagementsCodes: [] as never,
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(
      context.caller.plans.axes.update({
        id: getId(created.data.axeIdsBySourceKey, 'logements'),
        collectiviteId: context.collectiviteId,
        referenceCode: 'autre' as never,
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(
      context.caller.plans.fiches.update({
        ficheId: getId(created.data.ficheIdsBySourceKey, 'action'),
        ficheFields: { referenceCode: 'autre' as never },
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(await readReferences(created.data.planId)).toEqual(before);
  });

  test('refuse une attribution SQL authentifiée et conserve les éditions ordinaires', async () => {
    const created = await create(referencedInput());
    assert(
      created.success,
      created.success ? undefined : created.cause?.message ?? created.error
    );
    const planId = created.data.planId;
    const asUser = async (
      tx: Parameters<Parameters<typeof db.db.transaction>[0]>[0]
    ) => {
      await tx.execute(
        sql`SELECT set_config('request.jwt.claims', ${JSON.stringify({
          sub: context.user.id,
          role: 'authenticated',
        })}, true)`
      );
      await tx.execute(sql`SET LOCAL ROLE authenticated`);
    };
    await db.db.transaction(async (tx) => {
      await asUser(tx);
      await tx
        .update(axeTable)
        .set({ nom: 'Titre SQL' })
        .where(eq(axeTable.id, planId));
    });
    expect((await loadAxe(planId)).nom).toBe('Titre SQL');
    await expect(
      db.db.transaction(async (tx) => {
        await asUser(tx);
        await tx
          .update(axeTable)
          .set({ engagementsCodes: [] })
          .where(eq(axeTable.id, planId));
      })
    ).rejects.toThrow();
    expect((await loadAxe(planId)).engagementsCodes).toEqual(selectedCodes);
    await expect(
      db.db.transaction(async (tx) => {
        await tx.execute(sql`
        CREATE FUNCTION pg_temp.attempt_plan_reference(target_id integer)
        RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS
        'UPDATE public.axe SET engagements_codes = ARRAY[''FORGED''] WHERE id = target_id';
      `);
        await asUser(tx);
        await tx.execute(sql`SELECT pg_temp.attempt_plan_reference(${planId})`);
      })
    ).rejects.toMatchObject({
      cause: {
        code: '42501',
        message:
          "L'attribution des références et sources est réservée aux services internes",
      },
    });

    await expect(
      db.db.transaction(async (tx) => {
        await asUser(tx);
        await tx
          .update(ficheActionTable)
          .set({ referenceCode: 'FORGED' })
          .where(
            eq(
              ficheActionTable.id,
              getId(created.data.ficheIdsBySourceKey, 'action')
            )
          );
      })
    ).rejects.toThrow();
    expect(
      (await loadFiche(getId(created.data.ficheIdsBySourceKey, 'action')))
        .referenceCode
    ).toBe('ACTION_TEST');
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
      assert(
        created.success,
        created.success ? undefined : created.cause?.message ?? created.error
      );
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
