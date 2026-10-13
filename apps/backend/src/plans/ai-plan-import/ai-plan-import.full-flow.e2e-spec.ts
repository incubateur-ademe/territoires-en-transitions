import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication } from '@nestjs/common';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthToken,
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addAndEnableUserSuperAdminMode } from '@tet/backend/users/users/users.test-fixture';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { calculateDocumentHash } from '@tet/backend/collectivites/documents/store-document/calculate-document-hash.utils';
import { financeurTagTable } from '@tet/backend/collectivites/tags/financeur-tag.table';
import { partenaireTagTable } from '@tet/backend/collectivites/tags/partenaire-tag.table';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { structureTagTable } from '@tet/backend/collectivites/tags/structure-tag.table';
import { DocumentHash } from '@tet/domain/collectivites';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import {
  LlmCompletionRequest,
  LlmRepository,
} from '@tet/backend/utils/llm/repositories/llm.repository';
import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { failure, success } from '@tet/backend/utils/result.type';
import { z, ZodType } from 'zod';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { and, asc, eq, inArray } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { notificationTable } from '@tet/backend/utils/notifications/models/notification.table';
import { NotifiedOnEnum } from '@tet/domain/utils';
import { COMPLETE_PLAN_SECTEURS_QUEUE_NAME } from '@tet/backend/plans/fiches/fiche-secteurs/complete-plan-secteurs/complete-plan-secteurs.queue';
import { CompletePlanSecteursWorker } from '@tet/backend/plans/fiches/fiche-secteurs/complete-plan-secteurs/complete-plan-secteurs.worker';
import { AiPlanImportJobRepository } from './ai-plan-import-job.repository';
import {
  AI_PLAN_IMPORT_QUEUE_NAME,
  GENERATE_IMPORT_DRAFT_JOB_NAME,
} from './ai-plan-import.queue';
import { NotifyPlanImportedService } from './notify-plan-imported/notify-plan-imported.service';
import { ficheActionSecteurAttributionTable } from '@tet/backend/plans/fiches/fiche-secteurs/fiche-action-secteur-attribution.table';
import { planActionTypeTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type.table';
import { PCAET_PLAN_TYPE_KEY } from '@tet/domain/demarches';
import { aiPlanImportJobTable } from './models/ai-plan-import-job.table';
import { aiPlanImportStepRunTable } from './models/ai-plan-import-step-run.table';
import { consolidationResponseSchema } from './pipeline/consolidate-actions/consolidate-actions.schema';
import { enrichmentResponseSchema } from './pipeline/enrich-sous-actions/enrich-sous-actions.schema';
import { extractionResponseSchema } from './pipeline/extract-actions/extract-actions.schema';
import { GenerateImportDraftService } from './generate-import-draft/generate-import-draft.service';
import { GenerateImportDraftWorker } from './generate-import-draft/generate-import-draft.worker';
import { qualitativeReviewResponseSchema } from './pipeline/qualitative-review/qualitative-review.schema';
import { scoringResponseSchema } from './pipeline/score-actions/score-actions.schema';
import { secteursResponseSchema } from './pipeline/classify-secteurs/classify-secteurs.schema';

const QUALITATIVE_REVIEW_TEXT = 'Plan cohérent et bien structuré.';

const extractionAction = {
  axe: 'Axe 1',
  'sous-axe': 'Sous-axe 1.1',
  titre: 'Action 1.1.1',
  description: 'Description initiale',
  'sous-actions': ['Sous-action A'],
  objectifs: 'Objectif principal',
  'structure pilote': 'Direction Transition',
  'direction ou service pilote': 'Service Environnement',
  'personne pilote': 'Jean Dupont',
  partenaires: 'ADEME, Région',
  budget: '10000',
  financements: 'Fonds vert',
  'moyens humains': '0,5 ETP',
  priorite: 'Élevé',
  'date de debut': '01/01/2024',
  'date de fin': '31/12/2026',
  statut: '',
};

const FAKE_MODEL = 'modele-factice';

const fakeTokens: TokenUsage = {
  promptTokens: 100,
  cachedTokens: 0,
  candidatesTokens: 20,
  thoughtsTokens: 5,
  totalTokens: 125,
};

const schemaKey = (schema: ZodType): string =>
  JSON.stringify(z.toJSONSchema(schema));

/** Ce que le fournisseur factice a reçu, et l'étape qu'il fait échouer. */
const fakeLlmControl: { calls: string[]; failing: string | null } = {
  calls: [],
  failing: null,
};

/**
 * Un vrai `LlmService` sur un fournisseur factice : les appels traversent la
 * même chaîne qu'en production (tentatives, jetons, modèle), sans réseau.
 */
const buildFakeLlm = (): LlmService => {
  const responses = new Map<string, unknown>([
    [schemaKey(extractionResponseSchema), [extractionAction]],
    [
      schemaKey(scoringResponseSchema),
      [{ index: 0, score: 50, explication: 'À consolider' }],
    ],
    [
      schemaKey(consolidationResponseSchema),
      [
        {
          index: 0,
          titre: 'Action consolidée 1.1.1',
          description: 'Description consolidée',
          'sous-actions': ['Sous-action A'],
        },
      ],
    ],
    [
      schemaKey(enrichmentResponseSchema),
      [
        {
          index: 0,
          description: 'Sous-action enrichie',
          personne_pilote: 'Jean Dupont',
          statut: '',
          date_debut: '',
          date_fin: '',
        },
      ],
    ],
    [
      schemaKey(secteursResponseSchema),
      [
        {
          index: 0,
          secteurs: ['tertiaire'],
          justification: 'Rénovation des bâtiments publics.',
        },
      ],
    ],
    [
      schemaKey(qualitativeReviewResponseSchema),
      { avis: QUALITATIVE_REVIEW_TEXT },
    ],
  ]);

  const stepBySchema = new Map<string, string>([
    [schemaKey(extractionResponseSchema), 'extraction'],
    [schemaKey(scoringResponseSchema), 'scoring'],
    [schemaKey(consolidationResponseSchema), 'consolidation'],
    [schemaKey(enrichmentResponseSchema), 'enrichment'],
    [schemaKey(secteursResponseSchema), 'secteurs'],
    [schemaKey(qualitativeReviewResponseSchema), 'qualitativeReview'],
  ]);

  class FakeLlmRepository extends LlmRepository {
    readonly maxConcurrentCalls = 4;
    readonly maxInputTokensPerMinute = null;
    readonly maxRequestsPerMinute = null;
    readonly capabilities = { ocr: false, strategy: 'whole-document' as const };

    maxInputTokensFor(): number {
      return 60_000;
    }

    modelFor(): string {
      return FAKE_MODEL;
    }

    async complete(request: LlmCompletionRequest) {
      const key = request.jsonSchema ? JSON.stringify(request.jsonSchema) : '';
      const step = stepBySchema.get(key);
      if (step !== undefined) {
        fakeLlmControl.calls.push(step);
        if (step === fakeLlmControl.failing) {
          // Erreur non passagère : pas de nouvelle tentative.
          return failure({ kind: 'api_error' as const, httpStatus: 400 });
        }
      }
      const response = responses.get(key);
      if (response === undefined) {
        throw new Error('Schéma LLM inattendu dans le mock');
      }
      return success({
        completed: true,
        text: JSON.stringify(response),
        usage: fakeTokens,
      });
    }
  }

  return new LlmService(new FakeLlmRepository());
};

const buildInMemoryDocumentStorage = (): DocumentStorageService => {
  const store = new Map<string, { buffer: Buffer; mimeType: string }>();
  const locationKey = (input: { bucketId: string; key: string }): string =>
    `${input.bucketId}/${input.key}`;

  return {
    storeDocument: async (input: {
      bucketId: string;
      key: string;
      content: Buffer;
      contentType: string;
    }) => {
      store.set(locationKey(input), {
        buffer: input.content,
        mimeType: input.contentType,
      });
      return { success: true, data: { key: input.key } };
    },
    downloadDocument: async (input: { bucketId: string; key: string }) => {
      const stored = store.get(locationKey(input));
      if (stored === undefined) {
        return { success: false, error: 'READ_DOCUMENT_ERROR' };
      }
      return { success: true, data: stored };
    },
    removeDocument: async (input: { bucketId: string; key: string }) => {
      store.delete(locationKey(input));
      return { success: true, data: undefined };
    },
  } as unknown as DocumentStorageService;
};

/** Le suffixe varie le contenu, donc le hash : chaque test a son fichier. */
const csvSource = (suffix: string): Buffer =>
  Buffer.from(
    `axe,sous-axe,titre\nAxe 1,Sous-axe 1.1,Action 1.1.1\n# ${suffix}`,
    'utf-8'
  );

describe("Import IA d'un plan - parcours complet", { timeout: 60_000 }, () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  let collectiviteId: number;
  let user: AuthenticatedUser;
  let userEmail: string;
  let userToken: string;
  let otherCollectiviteId: number;
  let otherUser: AuthenticatedUser;
  let otherUserToken: string;
  let cleanupSuperAdmin: () => Promise<void>;
  const cleanupCollectivites: (() => Promise<void>)[] = [];
  const createdPlanIds: number[] = [];
  const otherCreatedPlanIds: number[] = [];
  const createdJobIds: string[] = [];
  const completePlanSecteursJobs: unknown[] = [];
  const aiImportQueueJobs: {
    name: string;
    data: unknown;
    opts: { jobId?: string };
  }[] = [];

  const getStatus = (jobId: string) =>
    router.createCaller({ user }).plans.aiImport.getAiImportStatus({ jobId });

  const getCurrentImport = () =>
    router.createCaller({ user }).plans.aiImport.getCurrentAiImport({
      collectiviteId,
    });

  const findPreviousImport = (
    input: { hash: DocumentHash } | { fichierId: number },
    { asOther = false }: { asOther?: boolean } = {}
  ) =>
    router
      .createCaller({ user: asOther ? otherUser : user })
      .plans.aiImport.findPreviousAiImport({
        collectiviteId: asOther ? otherCollectiviteId : collectiviteId,
        ...input,
      });

  const readPlan = async (planId: number) => {
    const [plan] = await db.db
      .select({
        nom: axeTable.nom,
        collectiviteId: axeTable.collectiviteId,
        parent: axeTable.parent,
        source: axeTable.source,
        status: axeTable.status,
        verifiedAt: axeTable.verifiedAt,
      })
      .from(axeTable)
      .where(eq(axeTable.id, planId));
    return plan;
  };

  const readJob = async (jobId: string) => {
    const [job] = await db.db
      .select()
      .from(aiPlanImportJobTable)
      .where(eq(aiPlanImportJobTable.id, jobId));
    return job;
  };

  const fichesByTitreInPlan = async (planId: number, titre: string) => {
    const axeIds = await db.db
      .select({ id: axeTable.id })
      .from(axeTable)
      .where(eq(axeTable.plan, planId));
    const allAxeIds = [planId, ...axeIds.map((axe) => axe.id)];

    return db.db
      .select({
        id: ficheActionTable.id,
        titre: ficheActionTable.titre,
        description: ficheActionTable.description,
        parentId: ficheActionTable.parentId,
      })
      .from(ficheActionTable)
      .innerJoin(
        ficheActionAxeTable,
        eq(ficheActionTable.id, ficheActionAxeTable.ficheId)
      )
      .where(
        and(
          eq(ficheActionTable.titre, titre),
          inArray(ficheActionAxeTable.axeId, allAxeIds)
        )
      );
  };

  const deletePlan = async (
    planId: number,
    { asOther = false }: { asOther?: boolean } = {}
  ): Promise<void> => {
    const axeIds = await db.db
      .select({ id: axeTable.id })
      .from(axeTable)
      .where(eq(axeTable.plan, planId));
    const allAxeIds = [planId, ...axeIds.map((axe) => axe.id)];

    const fiches = await db.db
      .select({ ficheId: ficheActionAxeTable.ficheId })
      .from(ficheActionAxeTable)
      .where(inArray(ficheActionAxeTable.axeId, allAxeIds));
    const ficheIds = fiches
      .map((fiche) => fiche.ficheId)
      .filter((id): id is number => id !== null);

    if (ficheIds.length > 0) {
      await db.db
        .delete(ficheActionPiloteTable)
        .where(inArray(ficheActionPiloteTable.ficheId, ficheIds));
    }

    await router
      .createCaller({ user: asOther ? otherUser : user })
      .plans.plans.delete({ planId });
  };

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (moduleBuilder) => {
        moduleBuilder
          .overrideProvider(GenerateImportDraftWorker)
          .useValue({ onModuleInit: () => undefined });
        moduleBuilder
          .overrideProvider(getQueueToken(AI_PLAN_IMPORT_QUEUE_NAME))
          .useValue({
            add: async (
              name: string,
              data: unknown,
              opts: { jobId?: string }
            ) => {
              aiImportQueueJobs.push({ name, data, opts });
              return { id: 'fake-job' };
            },
          });
        moduleBuilder
          .overrideProvider(CompletePlanSecteursWorker)
          .useValue({ onModuleInit: () => undefined });
        moduleBuilder
          .overrideProvider(getQueueToken(COMPLETE_PLAN_SECTEURS_QUEUE_NAME))
          .useValue({
            add: async (_name: string, data: unknown) => {
              completePlanSecteursJobs.push(data);
              return { id: 'fake-job' };
            },
            setGlobalConcurrency: async () => 1,
          });
        moduleBuilder.overrideProvider(LlmService).useValue(buildFakeLlm());
        moduleBuilder
          .overrideProvider(DocumentStorageService)
          .useValue(buildInMemoryDocumentStorage());
      },
    });
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const testCollectivite = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    cleanupCollectivites.push(testCollectivite.cleanup);
    collectiviteId = testCollectivite.collectivite.id;
    user = getAuthUserFromUserCredentials(testCollectivite.user);
    userEmail = testCollectivite.user.email ?? '';
    userToken = await getAuthToken({
      email: testCollectivite.user.email ?? '',
      password: testCollectivite.user.password,
    });

    const otherCollectivite = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    cleanupCollectivites.push(otherCollectivite.cleanup);
    otherCollectiviteId = otherCollectivite.collectivite.id;
    otherUser = getAuthUserFromUserCredentials(otherCollectivite.user);
    otherUserToken = await getAuthToken({
      email: otherCollectivite.user.email ?? '',
      password: otherCollectivite.user.password,
    });

    ({ cleanup: cleanupSuperAdmin } = await addAndEnableUserSuperAdminMode({
      app,
      caller: router.createCaller({ user }),
      userId: user.id,
    }));
  });

  afterAll(async () => {
    await db.db
      .delete(notificationTable)
      .where(
        and(
          eq(
            notificationTable.notifiedOn,
            NotifiedOnEnum['PLANS.AI_IMPORT.PLAN_IMPORTED']
          ),
          inArray(
            notificationTable.entityId,
            [...createdPlanIds, ...otherCreatedPlanIds].map(String)
          )
        )
      );
    for (const planId of createdPlanIds) {
      await deletePlan(planId);
    }
    for (const planId of otherCreatedPlanIds) {
      await deletePlan(planId, { asOther: true });
    }
    if (createdJobIds.length > 0) {
      await db.db
        .delete(aiPlanImportJobTable)
        .where(inArray(aiPlanImportJobTable.id, createdJobIds));
    }
    // Un plan supprimé laisse ses fiches, qui retiennent leur auteur, et les
    // tags créés par l'import retiennent la collectivité.
    const testCollectiviteIds = [collectiviteId, otherCollectiviteId];
    await db.db
      .delete(ficheActionTable)
      .where(inArray(ficheActionTable.collectiviteId, testCollectiviteIds));
    for (const tagTable of [
      serviceTagTable,
      structureTagTable,
      partenaireTagTable,
      financeurTagTable,
      personneTagTable,
    ]) {
      await db.db
        .delete(tagTable)
        .where(inArray(tagTable.collectiviteId, testCollectiviteIds));
    }
    await cleanupSuperAdmin();
    for (const cleanup of cleanupCollectivites) {
      await cleanup();
    }
    await app.close();
  });

  const postImport = async ({
    fields,
    source,
    asOther = false,
  }: {
    fields: Record<string, string>;
    source: Buffer;
    asOther?: boolean;
  }) => {
    let pending = request(app.getHttpServer())
      .post(
        `/collectivites/${
          asOther ? otherCollectiviteId : collectiviteId
        }/plans/import-ia`
      )
      .set('Authorization', `Bearer ${asOther ? otherUserToken : userToken}`);
    for (const [name, value] of Object.entries(fields)) {
      pending = pending.field(name, value);
    }
    const response = await pending.attach('file', source, {
      filename: 'plan.csv',
      contentType: 'text/csv',
    });
    if (response.status === 201) {
      createdJobIds.push(response.body.jobId);
      (asOther ? otherCreatedPlanIds : createdPlanIds).push(
        response.body.planId
      );
    }
    return response;
  };

  const enqueue = async (
    fields: Record<string, string>,
    { source, asOther }: { source: Buffer; asOther?: boolean }
  ): Promise<{ jobId: string; planId: number }> => {
    const response = await postImport({ fields, source, asOther });
    expect(response.status).toBe(201);
    return response.body;
  };

  test('crée le plan en import au lancement, puis le remplit à la fin du job', async () => {
    const source = csvSource('complet');
    const { jobId, planId: createdAtEnqueue } = await enqueue(
      {
        planName: 'Plan import IA complet',
        withVerifications: 'true',
        withSousActions: 'true',
      },
      { source }
    );

    const ongoing = await getCurrentImport();
    expect(ongoing).toMatchObject({ jobId, status: 'pending' });

    expect(await readPlan(createdAtEnqueue)).toMatchObject({
      nom: 'Plan import IA complet',
      source: 'import_ia',
      status: 'importing',
    });
    const listed = await router
      .createCaller({ user })
      .plans.plans.list({ collectiviteId });
    expect(listed.plans.map((plan) => plan.id)).not.toContain(createdAtEnqueue);
    const listedWithImporting = await router
      .createCaller({ user })
      .plans.plans.list({ collectiviteId, statuses: ['importing'] });
    expect(listedWithImporting.plans).toEqual([
      expect.objectContaining({ id: createdAtEnqueue, status: 'importing' }),
    ]);

    const job = await readJob(jobId);
    expect(job.createdPlanId).toBe(createdAtEnqueue);
    expect(job.fichierId).not.toBeNull();
    const [fichier] = await db.db
      .select()
      .from(bibliothequeFichierTable)
      .where(eq(bibliothequeFichierTable.id, job.fichierId ?? 0));
    expect(fichier).toMatchObject({
      collectiviteId,
      filename: 'plan.csv',
      hash: calculateDocumentHash(source),
    });

    const generated = await app.get(GenerateImportDraftService).generate(jobId);
    expect(generated).toEqual({ success: true });

    expect(await getCurrentImport()).toBeNull();

    const status = await getStatus(jobId);
    expect(status).toMatchObject({
      status: 'done',
      error: null,
      qualitativeReview: QUALITATIVE_REVIEW_TEXT,
      stepStates: {
        reading: 'ok',
        scouting: 'skipped',
        extraction: 'ok',
        hierarchy: 'skipped',
        scoring: 'ok',
        consolidation: 'ok',
        enrichment: 'ok',
        qualitativeReview: 'ok',
      },
    });
    expect(status.createdPlanId).toBe(createdAtEnqueue);

    const planId = createdAtEnqueue;
    expect(completePlanSecteursJobs).toContainEqual({
      planId,
      collectiviteId,
      passage: 1,
    });

    expect(await readPlan(planId)).toMatchObject({
      nom: 'Plan import IA complet',
      collectiviteId,
      parent: null,
      source: 'import_ia',
      status: 'to_verify',
      verifiedAt: null,
    });

    const stepRuns = await db.db
      .select()
      .from(aiPlanImportStepRunTable)
      .where(eq(aiPlanImportStepRunTable.jobId, jobId))
      .orderBy(asc(aiPlanImportStepRunTable.startedAt));
    expect(stepRuns.map(({ step, status }) => ({ step, status }))).toEqual([
      { step: 'document', status: 'ok' },
      { step: 'reading', status: 'ok' },
      { step: 'scouting', status: 'skipped' },
      { step: 'extraction', status: 'ok' },
      { step: 'hierarchy', status: 'skipped' },
      { step: 'scoring', status: 'ok' },
      { step: 'consolidation', status: 'ok' },
      { step: 'enrichment', status: 'ok' },
      { step: 'secteurs', status: 'skipped' },
      { step: 'qualitativeReview', status: 'ok' },
      { step: 'persistence', status: 'ok' },
    ]);
    const extraction = stepRuns.find((run) => run.step === 'extraction');
    expect(extraction).toMatchObject({
      llmCalls: 1,
      models: [FAKE_MODEL],
      tokens: fakeTokens,
      details: { actionsIn: 0, actionsOut: 1 },
    });

    const finishedJob = await readJob(jobId);
    expect(finishedJob.startedAt).not.toBeNull();
    expect(finishedJob.finishedAt).not.toBeNull();
    expect(finishedJob.stats).toMatchObject({
      schemaVersion: 1,
      content: {
        actions: 1,
        axes: 1,
        sousAxes: 1,
        sousActions: 1,
        extracted: 1,
        fichesCreated: 2,
        hasQualitativeReview: true,
      },
      document: { kind: 'csv', mimeType: 'text/csv' },
      llm: {
        strategy: 'whole-document',
        models: [FAKE_MODEL],
        calls: 5,
        tokens: { totalTokens: 5 * fakeTokens.totalTokens },
      },
    });

    const [notification] = await db.db
      .select()
      .from(notificationTable)
      .where(
        and(
          eq(
            notificationTable.notifiedOn,
            NotifiedOnEnum['PLANS.AI_IMPORT.PLAN_IMPORTED']
          ),
          eq(notificationTable.entityId, String(planId))
        )
      );
    expect(notification).toMatchObject({
      sendTo: user.id,
      status: 'pending',
      notificationData: {
        recap: {
          axesCount: expect.any(Number),
          sousAxesCount: expect.any(Number),
          fichesCount: expect.any(Number),
        },
      },
    });
    const content = await app
      .get(NotifyPlanImportedService)
      .getNotificationContent(notification);
    expect(content).toMatchObject({
      success: true,
      data: {
        sendToEmail: userEmail,
        subject: expect.stringContaining('Plan import IA complet'),
      },
    });

    const actions = await fichesByTitreInPlan(
      planId,
      'Action consolidée 1.1.1'
    );
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      description: 'Description consolidée',
      parentId: null,
    });

    const sousActions = await fichesByTitreInPlan(planId, 'Sous-action A');
    expect(sousActions).toHaveLength(1);
    expect(sousActions[0]).toMatchObject({
      description: 'Sous-action enrichie',
      parentId: actions[0].id,
    });
  });

  test('saute les vérifications et sous-actions quand elles sont désactivées', async () => {
    const { jobId } = await enqueue(
      {
        planName: 'Plan import IA minimal',
        withVerifications: 'false',
        withSousActions: 'false',
      },
      { source: csvSource('minimal') }
    );

    const generated = await app.get(GenerateImportDraftService).generate(jobId);
    expect(generated).toEqual({ success: true });

    const status = await getStatus(jobId);
    expect(status).toMatchObject({
      status: 'done',
      stepStates: {
        reading: 'ok',
        scouting: 'skipped',
        extraction: 'ok',
        hierarchy: 'skipped',
        scoring: 'skipped',
        consolidation: 'skipped',
        enrichment: 'skipped',
        qualitativeReview: 'ok',
      },
    });
    expect(status.createdPlanId).toBeGreaterThan(0);

    const planId = status.createdPlanId;
    if (planId === null) {
      throw new Error('createdPlanId manquant après un import terminé');
    }

    const actions = await fichesByTitreInPlan(planId, 'Action 1.1.1');
    expect(actions).toHaveLength(1);

    const sousActions = await fichesByTitreInPlan(planId, 'Sous-action A');
    expect(sousActions).toHaveLength(0);
  });

  test('demande confirmation avant de ré-importer un fichier dont le plan existe, dans la même collectivité seulement', async () => {
    const source = csvSource('doublon');
    const fields = {
      planName: 'Plan import IA doublon',
      withVerifications: 'false',
      withSousActions: 'false',
    };
    const first = await enqueue(fields, { source });
    await app.get(GenerateImportDraftService).generate(first.jobId);

    const previous = await findPreviousImport({
      hash: calculateDocumentHash(source),
    });
    expect(previous).toMatchObject({
      planId: first.planId,
      planNom: 'Plan import IA doublon',
      planStatus: 'to_verify',
    });
    const { fichierId } = await readJob(first.jobId);
    expect(await findPreviousImport({ fichierId: fichierId ?? 0 })).toEqual(
      previous
    );

    const refused = await postImport({ fields, source });
    expect(refused.status).toBe(409);

    expect(
      await findPreviousImport(
        { hash: calculateDocumentHash(source) },
        { asOther: true }
      )
    ).toBeNull();
    const elsewhere = await enqueue(fields, { source, asOther: true });
    await app.get(GenerateImportDraftService).generate(elsewhere.jobId);

    const confirmed = await enqueue(
      { ...fields, confirmReimport: 'true' },
      { source }
    );
    expect(confirmed.planId).not.toBe(first.planId);
    await app.get(GenerateImportDraftService).generate(confirmed.jobId);
  });

  test("garde le plan en échec quand l'import échoue, sans demander confirmation ensuite", async () => {
    const source = csvSource('echec');
    const fields = {
      planName: 'Plan import IA en échec',
      withVerifications: 'false',
      withSousActions: 'false',
    };
    const { jobId, planId } = await enqueue(fields, { source });

    await app
      .get(GenerateImportDraftService)
      .recordTerminalFailure(jobId, 'Échec simulé');

    expect(await readPlan(planId)).toMatchObject({ status: 'failed' });
    expect(
      await findPreviousImport({ hash: calculateDocumentHash(source) })
    ).toBeNull();

    const retried = await enqueue(fields, { source });
    await app.get(GenerateImportDraftService).generate(retried.jobId);
  });

  test('ne demande plus confirmation une fois le plan importé supprimé', async () => {
    const source = csvSource('supprime');
    const fields = {
      planName: 'Plan import IA supprimé',
      withVerifications: 'false',
      withSousActions: 'false',
    };
    const { jobId, planId } = await enqueue(fields, { source });
    await app.get(GenerateImportDraftService).generate(jobId);

    await deletePlan(planId);
    createdPlanIds.splice(createdPlanIds.indexOf(planId), 1);

    expect(
      await findPreviousImport({ hash: calculateDocumentHash(source) })
    ).toBeNull();
    const again = await enqueue(fields, { source });
    await app.get(GenerateImportDraftService).generate(again.jobId);
  });

  test("propose les secteurs réglementaires d'un plan PCAET, enregistrés avec les fiches", async () => {
    const [pcaetType] = await db.db
      .select({ id: planActionTypeTable.id })
      .from(planActionTypeTable)
      .where(
        and(
          eq(planActionTypeTable.categorie, PCAET_PLAN_TYPE_KEY.categorie),
          eq(planActionTypeTable.type, PCAET_PLAN_TYPE_KEY.type)
        )
      );
    const { jobId, planId } = await enqueue(
      {
        planName: 'Plan import IA PCAET',
        planType: String(pcaetType.id),
        withVerifications: 'false',
        withSousActions: 'true',
      },
      { source: csvSource('pcaet') }
    );

    await app.get(GenerateImportDraftService).generate(jobId);

    expect((await getStatus(jobId)).stepStates).toMatchObject({
      secteurs: 'ok',
    });
    const action = (await fichesByTitreInPlan(planId, 'Action 1.1.1'))[0];
    const sousAction = (await fichesByTitreInPlan(planId, 'Sous-action A'))[0];
    const attributions = await db.db
      .select()
      .from(ficheActionSecteurAttributionTable)
      .where(
        inArray(ficheActionSecteurAttributionTable.ficheId, [
          action.id,
          sousAction.id,
        ])
      );
    expect(attributions).toHaveLength(2);
    for (const attribution of attributions) {
      expect(attribution).toMatchObject({
        secteurs: ['tertiaire'],
        origine: 'import_ia',
        methode: 'import_ia_v1',
        justification: 'Rénovation des bâtiments publics.',
      });
    }
  });

  describe('reprise', () => {
    // La collectivité principale a déjà consommé son quota quotidien : ces
    // imports passent par l'autre, et l'équipe (super admin) les reprend.
    const generate = (jobId: string) =>
      app.get(GenerateImportDraftService).generate(jobId);

    const resume = (jobId: string, { asOther = false } = {}) =>
      router
        .createCaller({ user: asOther ? otherUser : user })
        .plans.aiImport.resumeAiImport({ jobId });

    const stepRuns = (jobId: string) =>
      db.db
        .select({
          step: aiPlanImportStepRunTable.step,
          status: aiPlanImportStepRunTable.status,
          attempt: aiPlanImportStepRunTable.attempt,
        })
        .from(aiPlanImportStepRunTable)
        .where(eq(aiPlanImportStepRunTable.jobId, jobId))
        .orderBy(asc(aiPlanImportStepRunTable.startedAt));

    const fields = (planName: string) => ({
      planName,
      withVerifications: 'true',
      withSousActions: 'true',
    });

    /** Un import en échec à la vérification, extraction faite. */
    const failAtScoring = async (suffix: string) => {
      const enqueued = await enqueue(fields(`Plan import IA ${suffix}`), {
        source: csvSource(suffix),
        asOther: true,
      });
      fakeLlmControl.failing = 'scoring';
      try {
        await generate(enqueued.jobId);
      } finally {
        fakeLlmControl.failing = null;
      }
      return enqueued;
    };

    test("l'équipe reprend un import en échec depuis sa dernière étape terminée", async () => {
      const { jobId, planId } = await failAtScoring('reprise-manuelle');

      const failed = await readJob(jobId);
      expect(failed).toMatchObject({ status: 'failed' });
      expect(failed.checkpoint?.completedStep).toBe('hierarchy');
      // L'avancement reste celui de la dernière étape, pas remis à zéro.
      expect(failed.stepStates).toMatchObject({
        extraction: 'ok',
        scoring: 'pending',
      });
      expect(await readPlan(planId)).toMatchObject({ status: 'failed' });

      await expect(resume(jobId, { asOther: true })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
      // Depuis la page du plan en échec : l'import qui peut le reprendre.
      expect(
        await router
          .createCaller({ user })
          .plans.aiImport.findResumableAiImport({ planId })
      ).toEqual({ jobId });
      await expect(
        router
          .createCaller({ user: otherUser })
          .plans.aiImport.findResumableAiImport({ planId })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });

      fakeLlmControl.calls = [];
      expect(await resume(jobId)).toEqual({ jobId });
      expect(await readJob(jobId)).toMatchObject({
        status: 'pending',
        error: null,
        // Le temps passé en échec ne compte pas dans le traitement.
        startedAt: null,
        attempt: 1,
      });
      expect(await readPlan(planId)).toMatchObject({ status: 'importing' });
      // BullMQ garde le job en échec : le même identifiant serait ignoré.
      const requeued = aiImportQueueJobs.at(-1);
      expect(requeued).toMatchObject({
        name: GENERATE_IMPORT_DRAFT_JOB_NAME,
        data: { jobId },
      });
      expect(requeued?.opts.jobId).toEqual(expect.any(String));
      expect(requeued?.opts.jobId).not.toBe(jobId);

      await generate(jobId);

      // L'extraction est acquise : seule la suite rappelle le modèle.
      expect(fakeLlmControl.calls).toEqual([
        'scoring',
        'consolidation',
        'enrichment',
        'qualitativeReview',
      ]);
      const done = await readJob(jobId);
      expect(done).toMatchObject({ status: 'done', checkpoint: null });
      expect(done.stats).toMatchObject({
        resumes: 1,
        llm: expect.objectContaining({ calls: 6 }),
      });
      expect(await readPlan(planId)).toMatchObject({ status: 'to_verify' });
      expect(await stepRuns(jobId)).toEqual(
        expect.arrayContaining([
          { step: 'extraction', status: 'ok', attempt: 0 },
          { step: 'scoring', status: 'failed', attempt: 0 },
          { step: 'scoring', status: 'ok', attempt: 1 },
          { step: 'persistence', status: 'ok', attempt: 1 },
        ])
      );

      await expect(resume(jobId)).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    test("reprend seul un import dont le processus s'est arrêté", async () => {
      const { jobId, planId } = await failAtScoring('reprise-auto');
      // Un processus tué n'a pas le temps de marquer l'échec : le job reste
      // en cours et son plan en import, avec le point de reprise, quand
      // BullMQ le redistribue.
      await db.db
        .update(aiPlanImportJobTable)
        .set({ status: 'running', error: null, finishedAt: null })
        .where(eq(aiPlanImportJobTable.id, jobId));
      await db.db
        .update(axeTable)
        .set({ status: 'importing' })
        .where(eq(axeTable.id, planId));
      fakeLlmControl.calls = [];

      await generate(jobId);

      expect(fakeLlmControl.calls).not.toContain('extraction');
      const done = await readJob(jobId);
      expect(done).toMatchObject({
        status: 'done',
        checkpoint: null,
        attempt: 1,
      });
      expect(done.stats).toMatchObject({ resumes: 1 });
      expect(await readPlan(planId)).toMatchObject({ status: 'to_verify' });
    });

    test("une exécution remplacée par une reprise n'écrit plus rien", async () => {
      const { jobId } = await failAtScoring('execution-remplacee');
      const jobRepository = app.get(AiPlanImportJobRepository);
      const { checkpoint } = await readJob(jobId);
      if (!checkpoint) {
        throw new Error('Point de reprise attendu');
      }
      // Le verrou BullMQ perdu, le job a été redistribué : passage 1.
      await db.db
        .update(aiPlanImportJobTable)
        .set({ status: 'running', attempt: 1 })
        .where(eq(aiPlanImportJobTable.id, jobId));

      expect(
        await jobRepository.saveCheckpoint(jobId, 0, checkpoint)
      ).toMatchObject({ success: false });
      expect(
        await jobRepository.saveCheckpoint(jobId, 1, checkpoint)
      ).toMatchObject({ success: true });

      await jobRepository.markFailed({ id: jobId, error: 'Fin du test' });
    });

    test("un échec plus vieux que la rétention n'est plus reprenable, et le démarrage le purge", async () => {
      const { jobId } = await failAtScoring('reprise-expiree');
      await db.db
        .update(aiPlanImportJobTable)
        .set({ modifiedAt: '2026-01-01T00:00:00Z' })
        .where(eq(aiPlanImportJobTable.id, jobId));

      expect(
        await router
          .createCaller({ user: otherUser })
          .plans.aiImport.getAiImportStatus({ jobId })
      ).toMatchObject({ resumable: false });
      await expect(resume(jobId)).rejects.toMatchObject({ code: 'CONFLICT' });

      await app.get(GenerateImportDraftService).onApplicationBootstrap();

      expect((await readJob(jobId)).checkpoint).toBeNull();
    });

    test('un nouvel import efface le point de reprise des échecs de la collectivité', async () => {
      const failed = await failAtScoring('reprise-purgee');
      expect((await readJob(failed.jobId)).checkpoint).not.toBeNull();
      expect(
        await router
          .createCaller({ user: otherUser })
          .plans.aiImport.getAiImportStatus({ jobId: failed.jobId })
      ).toMatchObject({ resumable: true });

      const next = await enqueue(fields('Plan import IA après échec'), {
        source: csvSource('apres-echec'),
        asOther: true,
      });

      expect((await readJob(failed.jobId)).checkpoint).toBeNull();
      await expect(resume(failed.jobId)).rejects.toMatchObject({
        code: 'CONFLICT',
      });
      await generate(next.jobId);
    });
  });
});
