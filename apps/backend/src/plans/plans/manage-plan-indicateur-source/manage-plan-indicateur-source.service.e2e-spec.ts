import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { IndicateurLockRepository } from '@tet/backend/indicateurs/indicateur/indicateur-lock.repository';
import { AddIndicateurLinksService } from '@tet/backend/indicateurs/indicateurs/add-indicateur-links/add-indicateur-links.service';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { GenerateImportDraftWorker } from '@tet/backend/plans/ai-plan-import/generate-import-draft/generate-import-draft.worker';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { axeIndicateurTable } from '@tet/backend/plans/fiches/shared/models/axe-indicateur.table';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { failure, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  ELECTRIFICATION_SOURCE_ID,
  IndicateurSourceCreate,
  PCAET_COLLECTIVITE_SOURCE_ID,
} from '@tet/domain/indicateurs';
import {
  ElectrificationEngagementCodeEnum,
  PlanReferenceProgrammeEnum,
} from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  onTestFinished,
  test,
  vi,
} from 'vitest';
import { DeletePlanService } from '../delete-plan/delete-plan.service';
import { DuplicatePlanService } from '../duplicate-plan/duplicate-plan.service';
import { CreatePlanAggregateService } from '../create-plan-aggregate/create-plan-aggregate.service';
import { GetPlanReferencesService } from '../get-plan-references/get-plan-references.service';
import { UpsertPlanService } from '../upsert-plan/upsert-plan.service';
import { ManagePlanIndicateurSourceService } from './manage-plan-indicateur-source.service';

describe('Source de valeurs propre au plan', () => {
  let app: INestApplication;
  let database: DatabaseService;
  let service: ManagePlanIndicateurSourceService;
  let source: IndicateurSourceCreate;
  let sourceExisted: boolean;
  const llm = new FakeLlmRepository();

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder.overrideProvider(LlmService).useValue(new LlmService(llm));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
      },
    });
    database = await getTestDatabase(app);
    service = app.get(ManagePlanIndicateurSourceService);
    const [existing] = await database.db
      .select()
      .from(indicateurSourceTable)
      .where(eq(indicateurSourceTable.id, ELECTRIFICATION_SOURCE_ID));
    sourceExisted = existing !== undefined;
    source = existing ?? {
      id: ELECTRIFICATION_SOURCE_ID,
      libelle: 'Électrification',
    };
    vi.spyOn(llm, 'complete');
    vi.spyOn(llm, 'chat');
  });

  afterAll(async () => {
    expect(llm.complete).not.toHaveBeenCalled();
    expect(llm.chat).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    if (!sourceExisted) {
      await database.db
        .delete(indicateurSourceTable)
        .where(eq(indicateurSourceTable.id, ELECTRIFICATION_SOURCE_ID));
    }
    await app?.close();
  });

  async function fixture(accesRestreint = false) {
    const { collectivite, users, cleanup } = await addTestCollectiviteAndUsers(
      database,
      {
        collectivite: { accesRestreint },
        users: [
          { role: CollectiviteRole.EDITION },
          { role: CollectiviteRole.LECTURE },
        ],
      }
    );
    const user = getAuthUserFromUserCredentials(users[0]);
    const reader = getAuthUserFromUserCredentials(users[1]);
    const nomDonnees = `Plan source ${randomUUID()}`;
    const [indicateur] = await database.db
      .insert(indicateurDefinitionTable)
      .values({
        collectiviteId: collectivite.id,
        titre: 'Objectif du plan',
        unite: 'Nombre',
        periodicite: 'annuelle',
      })
      .returning();
    onTestFinished(async () => {
      await database.db
        .delete(axeTable)
        .where(eq(axeTable.collectiviteId, collectivite.id));
      await database.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateur.id));
      await database.db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.nomDonnees, nomDonnees));
      await cleanup();
    });
    const createPlan = async () => {
      const plan = await app
        .get(UpsertPlanService)
        .upsertPlan(
          { collectiviteId: collectivite.id, nom: 'Plan de test' },
          { user }
        );
      assert(plan.success);
      return plan.data.id;
    };
    const scope = (planId: number) => ({ planId, sourceId: source.id });
    const createInput = (planId: number) => ({
      planId,
      source,
      metadonnee: { dateVersion: '2026-11-01', nomDonnees },
    });
    const createSource = async (planId: number) => {
      const result = await service.getOrCreate(createInput(planId), { user });
      assert(result.success);
      return result.data;
    };
    const valeur = {
      indicateurId: indicateur.id,
      dateValeur: '2030-01-01',
      periodicite: 'annuelle' as const,
    };
    const read = () =>
      database.db
        .select()
        .from(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, indicateur.id))
        .orderBy(indicateurValeurTable.id);
    const metadata = () =>
      database.db
        .select()
        .from(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.nomDonnees, nomDonnees));
    return {
      collectiviteId: collectivite.id,
      user,
      reader,
      createPlan,
      scope,
      createInput,
      createSource,
      valeur,
      read,
      metadata,
    };
  }

  test('isole deux plans, conserve zéro et ne touche pas à la saisie de la collectivité', async () => {
    const f = await fixture();
    const first = await f.createPlan();
    const second = await f.createPlan();
    const firstMetadata = await f.createSource(first);
    const secondMetadata = await f.createSource(second);
    expect(firstMetadata.id).not.toBe(secondMetadata.id);
    await database.db.insert(indicateurValeurTable).values({
      ...f.valeur,
      collectiviteId: f.collectiviteId,
      resultat: 10,
      objectif: 100,
    });

    for (const [planId, metadonneeId, objectif] of [
      [first, firstMetadata.id, 0],
      [second, secondMetadata.id, 60],
    ]) {
      const written = await service.fillMissing(
        { ...f.scope(planId), valeurs: [{ ...f.valeur, objectif }] },
        { user: f.user }
      );
      expect(written).toMatchObject({ success: true, data: { conflits: [] } });
      const listed = await service.listValeurs(
        { ...f.scope(planId), indicateurIds: [f.valeur.indicateurId] },
        { user: f.user }
      );
      assert(listed.success);
      const valeurs = listed.data.indicateurs[0].sources[source.id].valeurs;
      expect(valeurs).toMatchObject([{ metadonneeId, objectif }]);
      expect(valeurs).toHaveLength(1);
      expect(valeurs[0].resultat).toBeUndefined();
    }
    expect(await f.read()).toMatchObject([
      { metadonneeId: null, resultat: 10, objectif: 100 },
      { metadonneeId: firstMetadata.id, resultat: null, objectif: 0 },
      { metadonneeId: secondMetadata.id, resultat: null, objectif: 60 },
    ]);
  });

  test('sérialise deux premières créations sans métadonnée orpheline et conserve le même ID au retry', async () => {
    const f = await fixture();
    const planId = await f.createPlan();
    const [first, concurrent] = await Promise.all([
      f.createSource(planId),
      f.createSource(planId),
    ]);
    const retried = await service.getOrCreate(
      {
        ...f.createInput(planId),
        metadonnee: {
          ...f.createInput(planId).metadonnee,
          dateVersion: '2027-01-01',
        },
      },
      { user: f.user }
    );
    expect(concurrent.id).toBe(first.id);
    expect(retried).toEqual({ success: true, data: first });
    expect(await f.metadata()).toEqual([first]);
  });

  test.each([PCAET_COLLECTIVITE_SOURCE_ID, 'source-inconnue'])(
    'refuse la source %s pour la métadonnée rattachée',
    async (sourceId) => {
      const f = await fixture();
      const planId = await f.createPlan();
      await f.createSource(planId);
      expect(
        await service.get({ planId, sourceId }, { user: f.user })
      ).toMatchObject({ success: false, error: 'INVALID_VALUE' });
      expect(
        await service.fillMissing(
          { planId, sourceId, valeurs: [{ ...f.valeur, objectif: 1 }] },
          { user: f.user }
        )
      ).toMatchObject({ success: false, error: 'INVALID_VALUE' });
      expect(await f.read()).toEqual([]);
    }
  );

  test('refuse une source absente et un axe enfant', async () => {
    const f = await fixture();
    const planId = await f.createPlan();
    expect(await service.get(f.scope(planId), { user: f.user })).toEqual({
      success: true,
      data: null,
    });
    expect(
      await service.fillMissing(
        { ...f.scope(planId), valeurs: [{ ...f.valeur, objectif: 1 }] },
        { user: f.user }
      )
    ).toMatchObject({ success: false, error: 'NOT_FOUND' });
    const [axe] = await database.db
      .insert(axeTable)
      .values({
        collectiviteId: f.collectiviteId,
        parent: planId,
        plan: planId,
        nom: 'Axe enfant',
      })
      .returning();
    expect(
      await service.getOrCreate(f.createInput(axe.id), { user: f.user })
    ).toMatchObject({ success: false, error: 'NOT_FOUND' });
    expect(await f.metadata()).toEqual([]);
  });

  test('vérifie les droits du plan privé et refuse le contournement trusted par un lecteur', async () => {
    const owner = await fixture(true);
    const outsider = await fixture();
    const planId = await owner.createPlan();
    await owner.createSource(planId);
    const trustedReader = { user: owner.reader, isUserTrusted: true };
    expect(
      await service.get(owner.scope(planId), { user: owner.reader })
    ).toMatchObject({ success: true });
    expect(
      await service.get(owner.scope(planId), { user: outsider.user })
    ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    expect(
      await service.listValeurs(
        { ...owner.scope(planId), indicateurIds: [owner.valeur.indicateurId] },
        { user: outsider.user }
      )
    ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    expect(
      await service.getOrCreate(owner.createInput(planId), trustedReader)
    ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    expect(
      await service.fillMissing(
        { ...owner.scope(planId), valeurs: [{ ...owner.valeur, objectif: 1 }] },
        { user: outsider.user }
      )
    ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    expect(
      await service.fillMissing(
        { ...owner.scope(planId), valeurs: [{ ...owner.valeur, objectif: 1 }] },
        trustedReader
      )
    ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    expect(await owner.read()).toEqual([]);
  });

  test("le rattachement n'autorise pas un indicateur d'une autre collectivité", async () => {
    const f = await fixture();
    const other = await fixture();
    const planId = await f.createPlan();
    await f.createSource(planId);
    expect(
      await service.fillMissing(
        { ...f.scope(planId), valeurs: [{ ...other.valeur, objectif: 1 }] },
        { user: f.user }
      )
    ).toMatchObject({ success: false, error: 'INVALID_VALUE' });
    expect(await other.read()).toEqual([]);
    expect(await f.read()).toEqual([]);
  });

  test('annule la métadonnée, son rattachement et les valeurs avec la transaction appelante', async () => {
    const f = await fixture();
    const planId = await f.createPlan();
    await expect(
      database.db.transaction(async (tx) => {
        expect(
          await service.getOrCreate(f.createInput(planId), { user: f.user, tx })
        ).toMatchObject({ success: true });
        expect(
          await service.fillMissing(
            { ...f.scope(planId), valeurs: [{ ...f.valeur, objectif: 25 }] },
            { user: f.user, tx }
          )
        ).toMatchObject({ success: true });
        const listed = await service.listValeurs(
          { ...f.scope(planId), indicateurIds: [f.valeur.indicateurId] },
          { user: f.user, tx }
        );
        assert(listed.success);
        expect(
          listed.data.indicateurs[0].sources[source.id].valeurs
        ).toMatchObject([{ objectif: 25 }]);
        throw new Error('Annulation du test');
      })
    ).rejects.toThrow('Annulation du test');
    expect(await f.metadata()).toEqual([]);
    expect(await f.read()).toEqual([]);
    expect(await service.get(f.scope(planId), { user: f.user })).toEqual({
      success: true,
      data: null,
    });
  });

  test.each([true, false])(
    'crée ensemble structure, références, lien, source et objectif (commit : %s)',
    async (commit) => {
      const f = await fixture();
      const programme = PlanReferenceProgrammeEnum.ELECTRIFICATION;
      const engagements = {
        programme,
        codes: [
          ElectrificationEngagementCodeEnum.SORTIE_FIOUL_LOGEMENTS_PRIVES,
        ],
      };
      const reference = { programme, code: '1' };
      let planId = 0;
      const result = await app
        .get(TransactionManager)
        .executeSingle<number, string>(async (tx) => {
          const context = { user: f.user, tx };
          await app.get(IndicateurLockRepository).lockForValueWrite(tx);
          const created = await app.get(CreatePlanAggregateService).create(
            {
              collectiviteId: f.collectiviteId,
              nom: 'Plan et objectif',
              engagements,
              axes: [{ sourceKey: 'logements', nom: 'Logements', reference }],
              fiches: [],
            },
            context
          );
          assert(created.success);
          planId = created.data.planId;
          const axeId = created.data.axeIdsBySourceKey.get('logements');
          assert(axeId !== undefined);
          expect(
            await app.get(AddIndicateurLinksService).addLinks(
              {
                collectiviteId: f.collectiviteId,
                indicateurId: f.valeur.indicateurId,
                axeIds: [axeId],
              },
              context
            )
          ).toMatchObject({ success: true });
          expect(
            await app.get(GetPlanReferencesService).get({ planId }, context)
          ).toEqual({
            success: true,
            data: {
              planId,
              engagements,
              axes: [{ axeId, reference }],
              fiches: [],
            },
          });
          const metadata = await service.getOrCreate(
            f.createInput(planId),
            context
          );
          assert(metadata.success);
          expect(
            await service.fillMissing(
              { ...f.scope(planId), valeurs: [{ ...f.valeur, objectif: 25 }] },
              context
            )
          ).toMatchObject({ success: true });
          const listed = await service.listValeurs(
            { ...f.scope(planId), indicateurIds: [f.valeur.indicateurId] },
            context
          );
          assert(listed.success);
          expect(
            listed.data.indicateurs[0].sources[source.id].valeurs
          ).toMatchObject([{ metadonneeId: metadata.data.id, objectif: 25 }]);
          return commit ? success(planId) : failure('EXPECTED_ROLLBACK');
        });
      expect(result).toEqual(
        commit
          ? { success: true, data: planId }
          : { success: false, error: 'EXPECTED_ROLLBACK' }
      );
      const axes = await database.db
        .select()
        .from(axeTable)
        .where(eq(axeTable.collectiviteId, f.collectiviteId));
      expect(axes).toHaveLength(commit ? 2 : 0);
      const links = await database.db
        .select()
        .from(axeIndicateurTable)
        .where(eq(axeIndicateurTable.indicateurId, f.valeur.indicateurId));
      expect(links).toHaveLength(commit ? 1 : 0);
      expect(await f.metadata()).toHaveLength(commit ? 1 : 0);
      expect(await f.read()).toHaveLength(commit ? 1 : 0);
    }
  );

  test('conserve la métadonnée et les valeurs après suppression du plan', async () => {
    const f = await fixture();
    const planId = await f.createPlan();
    const metadata = await f.createSource(planId);
    expect(
      await service.fillMissing(
        { ...f.scope(planId), valeurs: [{ ...f.valeur, objectif: 20 }] },
        { user: f.user }
      )
    ).toMatchObject({ success: true });
    const before = await f.read();
    expect(
      await app.get(DeletePlanService).deletePlan({ planId }, { user: f.user })
    ).toMatchObject({ success: true });
    expect(await service.get(f.scope(planId), { user: f.user })).toMatchObject({
      success: false,
      error: 'NOT_FOUND',
    });
    expect(await f.metadata()).toEqual([metadata]);
    expect(await f.read()).toEqual(before);
  });

  test('ne copie pas le rattachement lors de la duplication ordinaire', async () => {
    const f = await fixture();
    const planId = await f.createPlan();
    const metadata = await f.createSource(planId);
    const duplicate = await app
      .get(DuplicatePlanService)
      .duplicate({ planId, nom: 'Copie ordinaire' }, { user: f.user });
    assert(duplicate.success);
    expect(
      await service.get(f.scope(duplicate.data.planId), { user: f.user })
    ).toEqual({ success: true, data: null });
    expect(await service.get(f.scope(planId), { user: f.user })).toEqual({
      success: true,
      data: metadata,
    });
    expect(await f.metadata()).toEqual([metadata]);
  });

  test('ignore les IDs de collectivité et de métadonnée injectés dans les valeurs et filtres', async () => {
    const f = await fixture();
    const other = await fixture();
    const planId = await f.createPlan();
    const metadata = await f.createSource(planId);
    const otherMetadata = await other.createSource(await other.createPlan());
    const spoofedValue = {
      ...f.valeur,
      objectif: 40,
      collectiviteId: other.collectiviteId,
      metadonneeId: otherMetadata.id,
    };
    expect(
      await service.fillMissing(
        { ...f.scope(planId), valeurs: [spoofedValue] },
        { user: f.user }
      )
    ).toMatchObject({ success: true });
    const spoofedFilters = {
      ...f.scope(planId),
      indicateurIds: [f.valeur.indicateurId],
      collectiviteId: other.collectiviteId,
      metadonneeId: otherMetadata.id,
      sources: ['collectivite'],
    };
    const listed = await service.listValeurs(spoofedFilters, { user: f.user });
    assert(listed.success);
    expect(listed.data.indicateurs[0].sources[source.id].valeurs).toMatchObject(
      [
        {
          metadonneeId: metadata.id,
          collectiviteId: f.collectiviteId,
          objectif: 40,
        },
      ]
    );
    expect(await other.read()).toEqual([]);
    expect(await f.read()).toMatchObject([
      {
        collectiviteId: f.collectiviteId,
        metadonneeId: metadata.id,
        objectif: 40,
      },
    ]);
  });
});
