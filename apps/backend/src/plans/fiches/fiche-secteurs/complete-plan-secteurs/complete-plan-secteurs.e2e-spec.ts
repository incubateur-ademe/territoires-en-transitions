import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { GenerateImportDraftService } from '@tet/backend/plans/ai-plan-import/generate-import-draft/generate-import-draft.service';
import { aiPlanImportJobTable } from '@tet/backend/plans/ai-plan-import/models/ai-plan-import-job.table';
import { extractionResponseSchema } from '@tet/backend/plans/ai-plan-import/pipeline/extract-actions/extract-actions.schema';
import { initialStepStates } from '@tet/backend/plans/ai-plan-import/pipeline/run-import-pipeline';
import { qualitativeReviewResponseSchema } from '@tet/backend/plans/ai-plan-import/pipeline/qualitative-review/qualitative-review.schema';
import { CommunsSecteursApiService } from '@tet/backend/plans/fiches/fiche-secteurs/communs-secteurs-api.service';
import { FakeCommunsSecteursApiService } from '@tet/backend/plans/fiches/fiche-secteurs/communs-secteurs-api.test-fixture';
import { ficheActionSecteurAttributionTable } from '@tet/backend/plans/fiches/fiche-secteurs/fiche-action-secteur-attribution.table';
import { DELAI_404_DEFINITIF_MS } from '@tet/backend/plans/fiches/fiche-secteurs/fiche-secteurs.rules';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { planActionTypeTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type.table';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { PCAET_PLAN_TYPE_KEY } from '@tet/domain/demarches';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { onTestFinished, vi } from 'vitest';
import {
  COMPLETE_PLAN_SECTEURS_QUEUE_NAME,
  CompletePlanSecteursJobData,
  MAX_PASSAGES,
} from './complete-plan-secteurs.queue';
import { CompletePlanSecteursService } from './complete-plan-secteurs.service';
import { CompletePlanSecteursWorker } from './complete-plan-secteurs.worker';
import { EnqueueCompletePlanSecteursService } from './enqueue-complete-plan-secteurs.service';

type AddedJob = {
  data: CompletePlanSecteursJobData;
  opts?: { jobId?: string; delay?: number };
};

class FakeQueue {
  added: AddedJob[] = [];
  failing = false;

  async add(
    _name: string,
    data: CompletePlanSecteursJobData,
    opts?: AddedJob['opts']
  ) {
    if (this.failing) {
      throw new Error('Redis indisponible');
    }
    this.added.push({ data, opts });
    return { id: opts?.jobId };
  }

  async setGlobalConcurrency() {
    return 1;
  }

  addedFor(planId: number) {
    return this.added.filter((job) => job.data.planId === planId);
  }
}

const fakeLlm = {
  maxInputTokens: 60_000,
  maxInputTokensFor: () => 60_000,
  capabilities: { ocr: false, strategy: 'whole-document' },
  generateStructured: async ({ schema }: { schema: unknown }) => {
    if (schema === extractionResponseSchema) {
      return {
        success: true,
        data: {
          data: [
            {
              axe: 'Axe 1',
              'sous-axe': '',
              titre: 'Action importée',
              description: '',
              'sous-actions': [],
              objectifs: '',
              'structure pilote': '',
              'direction ou service pilote': '',
              'personne pilote': '',
              partenaires: '',
              budget: '',
              financements: '',
              'moyens humains': '',
              priorite: '',
              'date de debut': '',
              'date de fin': '',
              statut: '',
            },
          ],
          tokens: {},
        },
      };
    }
    if (schema === qualitativeReviewResponseSchema) {
      return { success: true, data: { data: { avis: 'Avis' }, tokens: {} } };
    }
    throw new Error('Schéma LLM inattendu dans le faux LLM');
  },
};

const fakeDocumentStorage = {
  downloadDocument: async () => ({
    success: true,
    data: {
      buffer: Buffer.from('axe,titre\nAxe 1,Action importée', 'utf-8'),
      mimeType: 'text/csv',
    },
  }),
  removeDocument: async () => ({ success: true, data: undefined }),
};

describe('Rattrapage des secteurs des fiches d’un plan', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  const communs = new FakeCommunsSecteursApiService();
  const queue = new FakeQueue();
  let pcaetTypeId: number;

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (moduleBuilder) => {
        moduleBuilder
          .overrideProvider(CommunsSecteursApiService)
          .useValue(communs);
        moduleBuilder
          .overrideProvider(getQueueToken(COMPLETE_PLAN_SECTEURS_QUEUE_NAME))
          .useValue(queue);
        moduleBuilder
          .overrideProvider(CompletePlanSecteursWorker)
          .useValue({ onModuleInit: () => undefined });
        moduleBuilder
          .overrideProvider(LlmService)
          .useValue(fakeLlm as unknown as LlmService);
        moduleBuilder
          .overrideProvider(DocumentStorageService)
          .useValue(fakeDocumentStorage as unknown as DocumentStorageService);
      },
    });
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const [pcaetType] = await db.db
      .select({ id: planActionTypeTable.id })
      .from(planActionTypeTable)
      .where(
        and(
          eq(planActionTypeTable.categorie, PCAET_PLAN_TYPE_KEY.categorie),
          eq(planActionTypeTable.type, PCAET_PLAN_TYPE_KEY.type)
        )
      );
    pcaetTypeId = pcaetType.id;

    return async () => {
      await app.close();
    };
  });

  const freshEditor = async () => {
    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    return {
      collectiviteId: collectivite.id,
      userId: user.id,
      caller,
      demarcheId: demarche.id,
    };
  };

  const createPlan = async (collectiviteId: number) => {
    const [plan] = await db.db
      .insert(axeTable)
      .values({ nom: 'Plan', collectiviteId, typeId: pcaetTypeId })
      .returning({ id: axeTable.id });
    return plan.id;
  };

  describe('Déclencheurs', () => {
    const spyEnqueue = () => {
      const spy = vi.spyOn(
        app.get(EnqueueCompletePlanSecteursService),
        'enqueue'
      );
      onTestFinished(() => spy.mockRestore());
      return () => Promise.all(spy.mock.results.map((result) => result.value));
    };

    test('lier un plan existant ajoute un job pour ce plan seulement', async () => {
      const { caller, collectiviteId, demarcheId } = await freshEditor();
      const enqueued = spyEnqueue();
      const dejaLie = await createPlan(collectiviteId);
      await caller.demarches.pcaet.update({
        collectiviteId,
        demarcheId,
        planActionIds: [dejaLie],
      });
      const nouveau = await createPlan(collectiviteId);

      await caller.demarches.pcaet.update({
        collectiviteId,
        demarcheId,
        planActionIds: [dejaLie, nouveau],
      });
      await enqueued();

      expect(queue.addedFor(dejaLie)).toHaveLength(1);
      expect(queue.addedFor(nouveau)).toEqual([
        {
          data: { planId: nouveau, collectiviteId, passage: 1 },
        },
      ]);
    });

    test('créer un plan depuis la démarche ajoute un job, qu’il soit rattaché d’office ou non', async () => {
      const { caller, collectiviteId, demarcheId } = await freshEditor();
      const enqueued = spyEnqueue();

      const { planActionIds } = await caller.demarches.pcaet.createAndLinkPlan({
        collectiviteId,
        demarcheId,
      });
      await enqueued();
      const premier = planActionIds[0];
      const plansAvant = queue.added.length;
      await caller.demarches.pcaet.createAndLinkPlan({
        collectiviteId,
        demarcheId,
      });
      await enqueued();
      const [second] = queue.added.slice(plansAvant);

      expect(queue.addedFor(premier)).toHaveLength(1);
      expect(second.data).toMatchObject({ collectiviteId, passage: 1 });
      expect(second.data.planId).not.toBe(premier);
    });

    test('la fin d’un import IA ajoute un job pour le plan importé', async () => {
      const { collectiviteId, userId } = await freshEditor();
      const [job] = await db.db
        .insert(aiPlanImportJobTable)
        .values({
          collectiviteId,
          createdBy: userId,
          status: 'pending',
          options: {
            instructions: '',
            planName: 'Plan importé',
            planType: pcaetTypeId,
            withVerifications: false,
            withSousActions: false,
            disabledFields: [],
          },
          stepStates: initialStepStates(),
          sourcePath: 'source.csv',
        })
        .returning({ id: aiPlanImportJobTable.id });

      await app.get(GenerateImportDraftService).generate(job.id);

      const [{ createdPlanId }] = await db.db
        .select({ createdPlanId: aiPlanImportJobTable.createdPlanId })
        .from(aiPlanImportJobTable)
        .where(eq(aiPlanImportJobTable.id, job.id));
      expect(createdPlanId).not.toBeNull();
      expect(queue.addedFor(createdPlanId ?? 0)).toEqual([
        {
          data: { planId: createdPlanId, collectiviteId, passage: 1 },
        },
      ]);
    });

    test('flag éteint pour la collectivité : aucun job', async () => {
      const { caller, collectiviteId, demarcheId } = await freshEditor();
      const planId = await createPlan(collectiviteId);
      const enqueued = spyEnqueue();
      const isFeatureEnabledSpy = vi
        .spyOn(app.get(TrackingService), 'isFeatureEnabled')
        .mockImplementation(
          async (flag, _userId, flagCollectiviteId) =>
            !(
              flag === 'is-fiche-secteurs-enabled' &&
              flagCollectiviteId === collectiviteId
            )
        );
      onTestFinished(() => isFeatureEnabledSpy.mockRestore());

      await caller.demarches.pcaet.update({
        collectiviteId,
        demarcheId,
        planActionIds: [planId],
      });
      await enqueued();

      expect(queue.addedFor(planId)).toEqual([]);
    });

    test('un échec de la file ne fait pas échouer la liaison', async () => {
      const { caller, collectiviteId, demarcheId } = await freshEditor();
      const planId = await createPlan(collectiviteId);
      const enqueued = spyEnqueue();
      queue.failing = true;
      onTestFinished(() => {
        queue.failing = false;
      });

      const updated = await caller.demarches.pcaet.update({
        collectiviteId,
        demarcheId,
        planActionIds: [planId],
      });
      await enqueued();

      expect(updated.planActionIds).toEqual([planId]);
    });
  });

  describe('Worker', () => {
    const createFiche = async (
      { collectiviteId, userId }: { collectiviteId: number; userId: string },
      { axeId, parentId }: { axeId?: number; parentId?: number }
    ) => {
      const [fiche] = await db.db
        .insert(ficheActionTable)
        .values({
          titre: 'Fiche importée',
          collectiviteId,
          parentId,
          modifiedAt: sql`now() - ${
            DELAI_404_DEFINITIF_MS * 2
          } * interval '1 millisecond'`,
        })
        .returning({ id: ficheActionTable.id });
      if (axeId !== undefined) {
        await db.db
          .insert(ficheActionAxeTable)
          .values({ ficheId: fiche.id, axeId, createdBy: userId });
      }
      return fiche.id;
    };

    const createSousAxe = async (collectiviteId: number, planId: number) => {
      const [axe] = await db.db
        .insert(axeTable)
        .values({
          nom: 'Sous-axe',
          collectiviteId,
          plan: planId,
          parent: planId,
        })
        .returning({ id: axeTable.id });
      return axe.id;
    };

    const getAttributions = async (ficheIds: number[]) =>
      Object.fromEntries(
        (
          await db.db
            .select()
            .from(ficheActionSecteurAttributionTable)
            .where(
              inArray(ficheActionSecteurAttributionTable.ficheId, ficheIds)
            )
        ).map((attribution) => [
          attribution.ficheId,
          { origine: attribution.origine, secteurs: attribution.secteurs },
        ])
      );

    const runWorker = (data: CompletePlanSecteursJobData) =>
      app.get(CompletePlanSecteursService).completePlan(data);

    test('complète les fiches du plan, de ses sous-axes et leurs sous-actions, sans toucher aux autres', async () => {
      const editor = await freshEditor();
      const { collectiviteId } = editor;
      const planId = await createPlan(collectiviteId);
      const sousAxeId = await createSousAxe(collectiviteId, planId);
      const autrePlanId = await createPlan(collectiviteId);
      const racine = await createFiche(editor, { axeId: planId });
      const dansSousAxe = await createFiche(editor, { axeId: sousAxeId });
      const sousAction = await createFiche(editor, { parentId: racine });
      const manuelle = await createFiche(editor, { axeId: planId });
      const dejaAttribuee = await createFiche(editor, { axeId: sousAxeId });
      const autrePlan = await createFiche(editor, { axeId: autrePlanId });
      await db.db.insert(ficheActionSecteurAttributionTable).values([
        { ficheId: manuelle, secteurs: ['tertiaire'], origine: 'manuelle' },
        {
          ficheId: dejaAttribuee,
          secteurs: ['agriculture'],
          origine: 'automatique',
        },
      ]);
      for (const ficheId of [
        racine,
        dansSousAxe,
        sousAction,
        manuelle,
        dejaAttribuee,
        autrePlan,
      ]) {
        communs.repondParts(ficheId, { dechets: 0.9 });
      }

      await runWorker({ planId, collectiviteId, passage: 1 });

      expect(
        await getAttributions([
          racine,
          dansSousAxe,
          sousAction,
          manuelle,
          dejaAttribuee,
          autrePlan,
        ])
      ).toEqual({
        [racine]: { origine: 'automatique', secteurs: ['dechets'] },
        [dansSousAxe]: { origine: 'automatique', secteurs: ['dechets'] },
        [sousAction]: { origine: 'automatique', secteurs: ['dechets'] },
        [manuelle]: { origine: 'manuelle', secteurs: ['tertiaire'] },
        [dejaAttribuee]: { origine: 'automatique', secteurs: ['agriculture'] },
      });
      expect(
        [manuelle, dejaAttribuee, autrePlan].map((ficheId) =>
          communs.getNombreAppels(ficheId)
        )
      ).toEqual([0, 0, 0]);
      expect(queue.addedFor(planId)).toEqual([]);
    });

    test('s’il reste des fiches en cours de calcul, programme un nouveau passage avec un délai croissant', async () => {
      const editor = await freshEditor();
      const { collectiviteId } = editor;
      const planId = await createPlan(collectiviteId);
      const enFile = await createFiche(editor, { axeId: planId });
      const attribuee = await createFiche(editor, { axeId: planId });
      communs.repondPasEncoreCalculee(enFile);
      communs.repondParts(attribuee, { dechets: 0.9 });

      await runWorker({ planId, collectiviteId, passage: 1 });
      await runWorker({ planId, collectiviteId, passage: 2 });

      expect(queue.addedFor(planId)).toEqual([
        {
          data: { planId, collectiviteId, passage: 2 },
          opts: { jobId: `plan-${planId}-passage-2`, delay: 5 * 60 * 1000 },
        },
        {
          data: { planId, collectiviteId, passage: 3 },
          opts: { jobId: `plan-${planId}-passage-3`, delay: 15 * 60 * 1000 },
        },
      ]);
      expect(communs.getNombreAppels(attribuee)).toBe(1);
      expect(communs.getNombreAppels(enFile)).toBe(2);
    });

    test('au dernier passage, ne programme plus rien même s’il reste des fiches en cours', async () => {
      const editor = await freshEditor();
      const { collectiviteId } = editor;
      const planId = await createPlan(collectiviteId);
      const enFile = await createFiche(editor, { axeId: planId });
      communs.repondPasEncoreCalculee(enFile);

      const result = await runWorker({
        planId,
        collectiviteId,
        passage: MAX_PASSAGES,
      });

      expect(result).toEqual({ success: true, data: { enCoursDeCalcul: 1 } });
      expect(queue.addedFor(planId)).toEqual([]);
    });
  });
});
