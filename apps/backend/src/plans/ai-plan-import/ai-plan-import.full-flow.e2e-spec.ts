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
import { StoreDocumentService } from '@tet/backend/collectivites/documents/store-document/store-document.service';
import { financeurTagTable } from '@tet/backend/collectivites/tags/financeur-tag.table';
import { partenaireTagTable } from '@tet/backend/collectivites/tags/partenaire-tag.table';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { structureTagTable } from '@tet/backend/collectivites/tags/structure-tag.table';
import { DocumentHash } from '@tet/domain/collectivites';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { WebhookService } from '@tet/backend/utils/webhooks/webhook.service';
import { PlanVerificationRepository } from '@tet/backend/plans/plans/verify-plan/plan-verification.repository';
import { ImportPlanService } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.service';
import { LlmError } from '@tet/backend/utils/llm/llm.errors';
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
import { and, asc, count, eq, inArray } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  onTestFinished,
  test,
  vi,
} from 'vitest';
import { notificationTable } from '@tet/backend/utils/notifications/models/notification.table';
import { NotifiedOnEnum } from '@tet/domain/utils';
import { COMPLETE_PLAN_SECTEURS_QUEUE_NAME } from '@tet/backend/plans/fiches/fiche-secteurs/complete-plan-secteurs/complete-plan-secteurs.queue';
import { CompletePlanSecteursWorker } from '@tet/backend/plans/fiches/fiche-secteurs/complete-plan-secteurs/complete-plan-secteurs.worker';
import { AiPlanImportJobRepository } from './ai-plan-import-job.repository';
import { AiPlanImportErrorEnum } from './ai-plan-import.errors';
import { AI_PLAN_IMPORT_SOURCE_BUCKET } from './ai-plan-import.constants';
import { initialStepStates } from './pipeline/run-import-pipeline';
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
import { draftToImportPlanInput } from './generate-import-draft/draft-to-import-plan-input';
import { createEmptyExtractedAction } from './models/extracted-action';
import { GenerateImportDraftWorker } from './generate-import-draft/generate-import-draft.worker';
import { qualitativeReviewResponseSchema } from './pipeline/qualitative-review/qualitative-review.schema';
import { scoringResponseSchema } from './pipeline/score-actions/score-actions.schema';
import {
  effetsAttendusResponseSchema,
  secteursResponseSchema,
} from './pipeline/classify-secteurs/classify-secteurs.schema';
import {
  buildTestConvention,
  CONVENTION_FICHE_URL,
  CONVENTION_INDICATEUR_URL,
  CONVENTION_SOURCE_URL,
} from './pipeline/__fixtures__/build-test-convention';
import { buildTestPdf } from './pipeline/__fixtures__/build-test-pdf';
import { buildHorizontalHierarchyWorkbook } from './pipeline/__fixtures__/build-test-workbook';
import {
  buildPage,
  DocumentLink,
  joinPages,
} from './pipeline/document/document-page';
import { readDocument } from './pipeline/read-document/read-document';
import { segmentDocument } from './pipeline/segment-document/segment-document';
import { renderUnit } from './pipeline/segment-document/render-unit';

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

// Erreur non passagère : pas de nouvelle tentative.
const NON_TRANSIENT_ERROR: LlmError = { kind: 'api_error', httpStatus: 400 };

/** Ce que le fournisseur factice a reçu, et l'étape qu'il fait échouer. */
const fakeLlmControl: {
  calls: string[];
  failing: string | null;
  failingError: LlmError;
} = {
  calls: [],
  failing: null,
  failingError: NON_TRANSIENT_ERROR,
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
      schemaKey(effetsAttendusResponseSchema),
      [{ index: 0, effetsAttendus: [] }],
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
    [schemaKey(effetsAttendusResponseSchema), 'secteurs'],
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
          return failure(fakeLlmControl.failingError);
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
    expect(response.body.profile).toBe('generic');
    // Contrat actuellement lu par le client dans use-enqueue-ai-import.ts.
    // Le discriminant ajouté ne doit pas empêcher ce parsing.
    return z
      .object({ jobId: z.string(), planId: z.number() })
      .parse(response.body);
  };

  test.each([
    { profile: 'unknown', status: 400 },
    { profile: 'annexe-3-electrification', status: 412 },
  ])(
    'refuse le profil $profile avant tout upload, plan ou job, même en super-admin',
    async ({ profile, status }) => {
      const upload = vi.spyOn(app.get(StoreDocumentService), 'uploadBuffer');
      const store = vi.spyOn(app.get(DocumentStorageService), 'storeDocument');
      onTestFinished(() => {
        upload.mockRestore();
        store.mockRestore();
      });
      const readCounts = () =>
        Promise.all([
          db.db
            .select({ count: count() })
            .from(aiPlanImportJobTable)
            .where(eq(aiPlanImportJobTable.collectiviteId, collectiviteId)),
          db.db
            .select({ count: count() })
            .from(axeTable)
            .where(eq(axeTable.collectiviteId, collectiviteId)),
          db.db
            .select({ count: count() })
            .from(bibliothequeFichierTable)
            .where(eq(bibliothequeFichierTable.collectiviteId, collectiviteId)),
        ]);
      const before = await readCounts();
      const queued = aiImportQueueJobs.length;
      const llmCalls = fakeLlmControl.calls.length;

      const response = await postImport({
        fields: { profile, planName: 'Import indisponible' },
        source: csvSource(profile),
      });

      expect(response.status).toBe(status);
      expect(await readCounts()).toEqual(before);
      expect(upload).not.toHaveBeenCalled();
      expect(store).not.toHaveBeenCalled();
      expect(aiImportQueueJobs).toHaveLength(queued);
      expect(fakeLlmControl.calls).toHaveLength(llmCalls);
    }
  );

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
    expect(job.options).toMatchObject({
      profile: 'generic',
      contractVersion: 1,
      catalogueVersion: null,
    });
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
    // Les secteurs tournent à côté de l'enrichissement : l'ordre de départ
    // des deux n'est pas fixé.
    expect(stepRuns).toHaveLength(11);
    expect(stepRuns.map(({ step, status }) => ({ step, status }))).toEqual(
      expect.arrayContaining([
        { step: 'document', status: 'ok' },
        { step: 'reading', status: 'ok' },
        { step: 'scouting', status: 'skipped' },
        { step: 'extraction', status: 'ok' },
        { step: 'hierarchy', status: 'skipped' },
        { step: 'scoring', status: 'ok' },
        { step: 'consolidation', status: 'ok' },
        { step: 'enrichment', status: 'ok' },
        { step: 'secteurs', status: 'ok' },
        { step: 'qualitativeReview', status: 'ok' },
        { step: 'persistence', status: 'ok' },
      ])
    );
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
        calls: 6,
        tokens: { totalTokens: 6 * fakeTokens.totalTokens },
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
        profile: 'generic',
        planName: 'Plan import IA PCAET',
        planType: String(pcaetType.id),
        withVerifications: 'false',
        withSousActions: 'true',
      },
      { source: csvSource('pcaet') }
    );
    expect((await readJob(jobId)).options).toMatchObject({
      profile: 'generic',
      contractVersion: 1,
      catalogueVersion: null,
      withSecteurs: true,
    });

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

    /**
     * Un import en échec à l'extraction, lecture faite : les étapes suivantes
     * gardent ce qu'un lot en échec n'a pas amélioré, sans échouer.
     */
    const failAtExtraction = async (suffix: string) => {
      const enqueued = await enqueue(fields(`Plan import IA ${suffix}`), {
        source: csvSource(suffix),
        asOther: true,
      });
      fakeLlmControl.failing = 'extraction';
      try {
        await generate(enqueued.jobId);
      } finally {
        fakeLlmControl.failing = null;
      }
      return enqueued;
    };

    /**
     * Un import en échec à la vérification, extraction faite : seule une
     * erreur passagère sur tous les lots fait échouer une étape d'amélioration.
     */
    const failAtScoring = async (suffix: string) => {
      const enqueued = await enqueue(fields(`Plan import IA ${suffix}`), {
        source: csvSource(suffix),
        asOther: true,
      });
      fakeLlmControl.failing = 'scoring';
      // Une coupure, sans statut HTTP : abandonnée après trois tentatives,
      // là où un 429 ou un 503 attendrait de longues relances.
      fakeLlmControl.failingError = { kind: 'api_error', httpStatus: null };
      try {
        await generate(enqueued.jobId);
      } finally {
        fakeLlmControl.failing = null;
        fakeLlmControl.failingError = NON_TRANSIENT_ERROR;
      }
      return enqueued;
    };

    test("reprend un import en échec après l'extraction sans la refaire", async () => {
      const { jobId, planId } = await failAtScoring('reprise-apres-extraction');

      const failed = await readJob(jobId);
      expect(failed).toMatchObject({ status: 'failed' });
      expect(failed.checkpoint?.completedStep).toBe('hierarchy');
      expect(failed.stepStates).toMatchObject({
        extraction: 'ok',
        scoring: 'pending',
      });

      fakeLlmControl.calls = [];
      expect(await resume(jobId)).toEqual({ jobId });
      await generate(jobId);

      expect(fakeLlmControl.calls).not.toContain('extraction');
      // Les effets attendus tournent à côté de l'enrichissement : ordre non fixé.
      expect([...fakeLlmControl.calls].sort()).toEqual(
        [
          'scoring',
          'consolidation',
          'enrichment',
          'secteurs',
          'qualitativeReview',
        ].sort()
      );
      expect(await readJob(jobId)).toMatchObject({
        status: 'done',
        checkpoint: null,
      });
      expect(await readPlan(planId)).toMatchObject({ status: 'to_verify' });
      expect(await stepRuns(jobId)).toEqual(
        expect.arrayContaining([
          { step: 'extraction', status: 'ok', attempt: 0 },
          { step: 'scoring', status: 'failed', attempt: 0 },
          { step: 'scoring', status: 'ok', attempt: 1 },
        ])
      );
    });

    test("l'équipe reprend un import en échec depuis sa dernière étape terminée", async () => {
      const { jobId, planId } = await failAtExtraction('reprise-manuelle');

      const failed = await readJob(jobId);
      expect(failed).toMatchObject({ status: 'failed' });
      expect(failed.checkpoint?.completedStep).toBe('scouting');
      // L'avancement reste celui de la dernière étape, pas remis à zéro.
      expect(failed.stepStates).toMatchObject({
        reading: 'ok',
        extraction: 'pending',
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

      // La lecture est acquise : seule la suite rappelle le modèle.
      expect([...fakeLlmControl.calls].sort()).toEqual(
        [
          'extraction',
          'scoring',
          'consolidation',
          'enrichment',
          'secteurs',
          'qualitativeReview',
        ].sort()
      );
      const done = await readJob(jobId);
      expect(done).toMatchObject({ status: 'done', checkpoint: null });
      expect(done.stats).toMatchObject({
        resumes: 1,
        llm: expect.objectContaining({ calls: 7 }),
      });
      expect(await readPlan(planId)).toMatchObject({ status: 'to_verify' });
      expect(await stepRuns(jobId)).toEqual(
        expect.arrayContaining([
          { step: 'reading', status: 'ok', attempt: 0 },
          { step: 'extraction', status: 'failed', attempt: 0 },
          { step: 'extraction', status: 'ok', attempt: 1 },
          { step: 'persistence', status: 'ok', attempt: 1 },
        ])
      );

      await expect(resume(jobId)).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    test("reprend seul un import dont le processus s'est arrêté", async () => {
      const { jobId, planId } = await failAtExtraction('reprise-auto');
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

      expect(await stepRuns(jobId)).not.toContainEqual(
        expect.objectContaining({ step: 'reading', attempt: 1 })
      );
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
      const { jobId } = await failAtExtraction('execution-remplacee');
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
      const { jobId } = await failAtExtraction('reprise-expiree');
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
      const failed = await failAtExtraction('reprise-purgee');
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

  describe('effets après commit', () => {
    test('notifie après commit quand le service d’import possède la transaction', async () => {
      let visibleFicheIds: number[] = [];
      const webhook = vi
        .spyOn(app.get(WebhookService), 'sendWebhookNotifications')
        .mockImplementation(async (_type, items) => {
          visibleFicheIds = (
            await db.db
              .select({ id: ficheActionTable.id })
              .from(ficheActionTable)
              .where(
                inArray(
                  ficheActionTable.id,
                  items.map(({ entityId }) => Number(entityId))
                )
              )
          ).map(({ id }) => id);
        });
      onTestFinished(() => webhook.mockRestore());

      const imported = await app.get(ImportPlanService).save({
        planInput: draftToImportPlanInput({
          planName: 'Plan avec transaction interne',
          actions: [createEmptyExtractedAction({ titre: 'Action simple' })],
        }),
        collectiviteId,
        user,
      });

      expect(imported.success).toBe(true);
      if (!imported.success) throw imported.error;
      createdPlanIds.push(imported.data.planId);
      expect(webhook).toHaveBeenCalledOnce();
      expect(visibleFicheIds).toEqual(imported.data.createdFicheIds);
      expect(visibleFicheIds).toHaveLength(1);
    });

    // Ces tests ciblent le worker : le job et son plan vide sont déjà admis.
    const preparePendingJob = async (planName: string) => {
      const plan = await router
        .createCaller({ user })
        .plans.plans.create({ collectiviteId, nom: planName });
      createdPlanIds.push(plan.id);
      await app.get(PlanVerificationRepository).markAsImporting(plan.id);
      const sourcePath = `${collectiviteId}/${plan.id}.csv`;
      await app.get(DocumentStorageService).storeDocument({
        bucketId: AI_PLAN_IMPORT_SOURCE_BUCKET,
        key: sourcePath,
        content: csvSource(planName),
        contentType: 'text/csv',
      });
      const [job] = await db.db
        .insert(aiPlanImportJobTable)
        .values({
          collectiviteId,
          createdBy: user.id,
          createdPlanId: plan.id,
          sourcePath,
          status: 'pending',
          stepStates: initialStepStates(),
          options: {
            planName,
            instructions: '',
            withVerifications: false,
            withSousActions: false,
            disabledFields: [],
          },
        })
        .returning();
      createdJobIds.push(job.id);
      return { jobId: job.id, planId: plan.id };
    };

    test('émet les webhooks une fois le job et les fiches visibles hors transaction', async () => {
      const { jobId, planId } = await preparePendingJob('Plan après commit');
      let visibleJob: Awaited<ReturnType<typeof readJob>> | undefined;
      let visibleFicheIds: number[] = [];
      const webhook = vi
        .spyOn(app.get(WebhookService), 'sendWebhookNotifications')
        .mockImplementation(async () => {
          visibleJob = await readJob(jobId);
          visibleFicheIds = (
            await fichesByTitreInPlan(planId, 'Action 1.1.1')
          ).map(({ id }) => id);
        });
      onTestFinished(() => webhook.mockRestore());

      expect(await app.get(GenerateImportDraftService).generate(jobId)).toEqual(
        { success: true }
      );

      expect(webhook).toHaveBeenCalledTimes(1);
      expect(visibleJob).toMatchObject({
        status: 'done',
        createdPlanId: planId,
      });
      expect(visibleFicheIds).toHaveLength(1);
      expect(webhook.mock.calls[0][1].map(({ entityId }) => entityId)).toEqual(
        visibleFicheIds.map(String)
      );
    });

    test('n’émet aucun effet si la transaction englobante échoue après la création des fiches', async () => {
      const { jobId, planId } = await preparePendingJob('Plan annulé');
      const markDone = vi
        .spyOn(app.get(AiPlanImportJobRepository), 'markDone')
        .mockResolvedValueOnce(failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR));
      const webhook = vi
        .spyOn(app.get(WebhookService), 'sendWebhookNotifications')
        .mockResolvedValue(undefined);
      const notification = vi.spyOn(
        app.get(NotifyPlanImportedService),
        'notifyPlanImported'
      );
      onTestFinished(() => {
        markDone.mockRestore();
        webhook.mockRestore();
        notification.mockRestore();
      });

      await app.get(GenerateImportDraftService).generate(jobId);

      expect(markDone).toHaveBeenCalledOnce();
      expect(await readJob(jobId)).toMatchObject({ status: 'failed' });
      expect(await fichesByTitreInPlan(planId, 'Action 1.1.1')).toEqual([]);
      expect(webhook).not.toHaveBeenCalled();
      expect(notification).not.toHaveBeenCalled();
      expect(completePlanSecteursJobs).not.toContainEqual(
        expect.objectContaining({ planId })
      );
    });

    test.each(['webhook', 'notification'] as const)(
      'conserve le succès après un échec de %s, sans recréer les fiches',
      async (failedEffect) => {
        const { jobId, planId } = await preparePendingJob(
          `Plan avec échec de ${failedEffect}`
        );
        const webhook = vi
          .spyOn(app.get(WebhookService), 'sendWebhookNotifications')
          .mockImplementation(async () => {
            if (failedEffect === 'webhook')
              throw new Error('Webhook indisponible');
          });
        const notification = vi.spyOn(
          app.get(NotifyPlanImportedService),
          'notifyPlanImported'
        );
        if (failedEffect === 'notification') {
          notification.mockRejectedValueOnce(
            new Error('Notification indisponible')
          );
        }
        onTestFinished(() => {
          webhook.mockRestore();
          notification.mockRestore();
        });

        const service = app.get(GenerateImportDraftService);
        expect(await service.generate(jobId)).toEqual({ success: true });
        expect(await readJob(jobId)).toMatchObject({ status: 'done' });
        expect(await readPlan(planId)).toMatchObject({ status: 'to_verify' });
        const fiches = await fichesByTitreInPlan(planId, 'Action 1.1.1');
        expect(fiches).toHaveLength(1);

        expect(await service.generate(jobId)).toMatchObject({ success: false });
        expect(await fichesByTitreInPlan(planId, 'Action 1.1.1')).toEqual(
          fiches
        );
        expect(webhook).toHaveBeenCalledOnce();
        expect(notification).toHaveBeenCalledOnce();
      }
    );
  });
});

// Lecture réelle des fichiers et découpage, sans application Nest ni fournisseur IA.
describe('Lecture documentaire et découpage', () => {
  const docxMime =
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const xlsxMime =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const read = async (...args: Parameters<typeof readDocument>) => {
    const result = await readDocument(...args);
    if (!result.success) {
      throw new Error(`Lecture impossible : ${result.error.kind}`);
    }
    return result.data;
  };

  test('conserve les sections de la convention et les destinations masquées de plusieurs liens Word', async () => {
    const document = await read({
      buffer: await buildTestConvention(),
      mimeType: docxMime,
    });

    expect(document.pages.map(({ text }) => text)).toEqual([
      '',
      '# A. Engagements\nCode\tCible\nE01\t100',
      [
        '# B. Fiches action',
        '## Fiche action renseignée',
        'Intitulé\tÉlectrifier les bâtiments',
        `Liens\tFiche existante ; Indicateur associé ; ${CONVENTION_SOURCE_URL}`,
        '## Modèle de fiche à compléter',
        'Intitulé\tÀ compléter',
      ].join('\n'),
      '# C. Financement\nExemple fictif : montant 5000 euros.',
    ]);
    const linkedLine = document.pages[2].lines[3];
    expect(linkedLine.links).toEqual([
      expect.objectContaining({
        text: 'Fiche existante',
        target: CONVENTION_FICHE_URL,
        kind: 'hyperlink',
        location: expect.objectContaining({ pageIndex: 2, lineIndex: 3 }),
      }),
      expect.objectContaining({
        text: 'Indicateur associé',
        target: CONVENTION_INDICATEUR_URL,
        kind: 'hyperlink',
        location: expect.objectContaining({ pageIndex: 2, lineIndex: 3 }),
      }),
      expect.objectContaining({
        text: CONVENTION_SOURCE_URL,
        target: CONVENTION_SOURCE_URL,
        kind: 'text',
        location: expect.objectContaining({ pageIndex: 2, lineIndex: 3 }),
      }),
    ]);
    expect(document.pages[0]).toMatchObject({
      source: 'empty',
      lines: [],
    });
    expect(document.pages[0].links).toEqual([
      {
        text: '',
        target: `${CONVENTION_SOURCE_URL}#preambule`,
        kind: 'hyperlink',
        location: { pageIndex: 0 },
      },
    ]);
    expect(document.pages[2].links).toEqual([
      ...(linkedLine.links ?? []),
      {
        text: '',
        target: `${CONVENTION_SOURCE_URL}#section`,
        kind: 'hyperlink',
        location: { pageIndex: 2 },
      },
    ]);
    expect(joinPages(document)).toBe(
      document.pages
        .slice(1)
        .map(({ text }) => text)
        .join('\n')
    );
    expect(joinPages(document)).not.toContain(CONVENTION_FICHE_URL);
    expect(joinPages(document)).not.toContain(CONVENTION_INDICATEUR_URL);

    const units = segmentDocument(document, {
      minTokens: 0,
      maxTokens: 40,
      overlapTokens: 0,
    });
    const lineAfterChunking = units
      .flatMap(({ lines }) => lines)
      .find(({ text }) => text === linkedLine.text);
    expect(lineAfterChunking).toMatchObject({
      links: linkedLine.links,
      locations: linkedLine.locations,
    });
    const rendered = units
      .map((unit, index) => renderUnit(unit, { index, count: units.length }))
      .join('\n');
    expect(rendered).toContain('Modèle de fiche à compléter');
    expect(rendered).toContain('Exemple fictif : montant 5000 euros.');
    expect(rendered).not.toContain(CONVENTION_FICHE_URL);
  });

  test('lit les liens Excel natifs et les formules sans perdre les coordonnées des cellules fusionnées', async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet('Notice').getCell('A1').value = 'Notice';
    const sheet = workbook.addWorksheet('Actions');
    sheet.addRow(['Code', 'Action', null, 'Sources']);
    sheet.getCell('A3').value = '1';
    sheet.getCell('B3').value = {
      text: 'Ouvrir la fiche',
      hyperlink: CONVENTION_FICHE_URL,
    };
    sheet.mergeCells('B3:C4');
    sheet.getCell(
      'D3'
    ).value = `${CONVENTION_SOURCE_URL} ${CONVENTION_INDICATEUR_URL}`;
    sheet.getCell('B6').value = {
      formula: `HYPERLINK("${CONVENTION_INDICATEUR_URL}","Formule littérale")`,
      result: 'Formule littérale',
    };
    sheet.getCell('B7').value = {
      formula: 'HYPERLINK(D3,"Formule dynamique")',
      result: 'Formule dynamique',
    };
    sheet.getCell('B9').value = { text: ' ', hyperlink: CONVENTION_SOURCE_URL };
    const uncachedTarget = 'https://document.example.test/uncached';
    sheet.getCell('E11').value = {
      formula: `HYPERLINK("${uncachedTarget}","Sans résultat en cache")`,
    };
    const document = await read({
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
      mimeType: xlsxMime,
    });

    expect(document.pages[1].text).toBe(
      [
        'Code\tAction\t\tSources',
        `1\tOuvrir la fiche\t\t${CONVENTION_SOURCE_URL} ${CONVENTION_INDICATEUR_URL}`,
        '\tFormule littérale',
        '\tFormule dynamique',
      ].join('\n')
    );
    const links = document.pages[1].links ?? [];
    expect(links).toHaveLength(7);
    expect(links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Ouvrir la fiche',
          target: CONVENTION_FICHE_URL,
          kind: 'hyperlink',
          location: expect.objectContaining({
            pageIndex: 1,
            sheetName: 'Actions',
            row: 3,
            col: 2,
          }),
        }),
        ...[CONVENTION_SOURCE_URL, CONVENTION_INDICATEUR_URL].map((target) =>
          expect.objectContaining({
            target,
            kind: 'text',
            location: expect.objectContaining({
              pageIndex: 1,
              sheetName: 'Actions',
              row: 3,
              col: 4,
            }),
          })
        ),
        expect.objectContaining({
          text: 'Formule littérale',
          target: CONVENTION_INDICATEUR_URL,
          kind: 'hyperlink',
          location: expect.objectContaining({ row: 6, col: 2 }),
        }),
        expect.objectContaining({
          text: 'Formule dynamique',
          target: null,
          kind: 'hyperlink',
          location: expect.objectContaining({ row: 7, col: 2 }),
        }),
        expect.objectContaining({
          text: '',
          target: CONVENTION_SOURCE_URL,
          kind: 'hyperlink',
          location: expect.objectContaining({ row: 9, col: 2 }),
        }),
        expect.objectContaining({
          text: '',
          target: uncachedTarget,
          kind: 'hyperlink',
          location: expect.objectContaining({ row: 11, col: 5 }),
        }),
      ])
    );
    expect(document.workbook?.[1].cells[2][1].links).toEqual([links[0]]);
    expect(document.workbook?.[1].cells[3][2]).toMatchObject({
      text: '',
      isMergeSlave: true,
      masterRow: 3,
      masterCol: 2,
    });
    expect(document.workbook?.[1].cells[3][2].links ?? []).toEqual([]);
    expect(
      document.pages[1].lines
        .flatMap(({ links }) => links ?? [])
        .some(({ target }) => target === uncachedTarget)
    ).toBe(false);
    expect(document.workbook?.[1].cells[10][4].links).toEqual([
      expect.objectContaining({ target: uncachedTarget }),
    ]);
    expect(joinPages(document)).toContain('[Onglet « Actions »]');
    expect(joinPages(document)).not.toContain(CONVENTION_FICHE_URL);
  });

  test('garde les URL textuelles CSV et leurs cellules après une rangée vide et le découpage', async () => {
    const sources = `(${CONVENTION_FICHE_URL}), ${CONVENTION_INDICATEUR_URL}.`;
    const document = await read({
      buffer: Buffer.from(
        `Code;Action;Sources\n;;\n1;Électrifier;${sources}\n`
      ),
      mimeType: 'text/csv',
    });
    expect(document.pages[0].text).toBe(
      `Code\tAction\tSources\n1\tÉlectrifier\t${sources}`
    );
    const links = document.pages[0].links ?? [];
    expect(links).toEqual(
      [CONVENTION_FICHE_URL, CONVENTION_INDICATEUR_URL].map((target) => ({
        text: target,
        target,
        kind: 'text',
        location: expect.objectContaining({ pageIndex: 0, row: 3, col: 3 }),
      }))
    );
    const line = segmentDocument(document)[0].lines.find(({ text }) =>
      text.includes('Électrifier')
    );
    expect(line?.links).toEqual(links);
    expect(line?.locations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ pageIndex: 0, row: 3, col: 3 }),
      ])
    );
  });

  test('lit les annotations PDF liées au texte et garde les liens sans texte au niveau de la page', async () => {
    const rect: [number, number, number, number] = [48, 697, 150, 714];
    const orphanRect: [number, number, number, number] = [400, 100, 500, 120];
    const document = await read({
      buffer: buildTestPdf([
        {
          kind: 'text',
          blocks: [
            { text: 'Ouvrir la fiche', x: 50, y: 700 },
            { text: CONVENTION_SOURCE_URL, x: 50, y: 660 },
          ],
          annotations: [
            { target: CONVENTION_FICHE_URL, rect },
            { target: CONVENTION_INDICATEUR_URL, rect: orphanRect },
          ],
        },
      ]),
      mimeType: 'application/pdf',
    });

    const page = document.pages[0];
    expect(page.text).toBe(`Ouvrir la fiche\n${CONVENTION_SOURCE_URL}`);
    expect(page.lines[0].links).toEqual([
      {
        text: 'Ouvrir la fiche',
        target: CONVENTION_FICHE_URL,
        kind: 'hyperlink',
        location: expect.objectContaining({ pageIndex: 0, lineIndex: 0, rect }),
      },
    ]);
    expect(page.links).toEqual([
      ...(page.lines[0].links ?? []),
      {
        text: CONVENTION_SOURCE_URL,
        target: CONVENTION_SOURCE_URL,
        kind: 'text',
        location: expect.objectContaining({ pageIndex: 0, lineIndex: 1 }),
      },
      {
        text: '',
        target: CONVENTION_INDICATEUR_URL,
        kind: 'hyperlink',
        location: { pageIndex: 0, rect: orphanRect },
      },
    ]);
    expect(segmentDocument(document)[0].lines[0].links).toEqual(
      page.lines[0].links
    );
  });

  test('préserve les coordonnées avant normalisation et les liens des marges retirées', async () => {
    const pages = Array.from({ length: 5 }, (_, pageIndex) => {
      const location = (lineIndex: number) => ({ pageIndex, lineIndex });
      const link: DocumentLink = {
        text: 'ﬁche élec-',
        target: CONVENTION_FICHE_URL,
        kind: 'hyperlink',
        location: location(1),
      };
      return buildPage(
        pageIndex,
        [
          {
            text: 'Convention de test',
            y: 10,
            locations: [location(0)],
            links: [
              { ...link, text: 'Convention de test', location: location(0) },
            ],
          },
          {
            text: 'ﬁche élec-',
            y: 150,
            locations: [location(1)],
            links: [link],
          },
          {
            text: 'trification des bâtiments',
            y: 170,
            locations: [location(2)],
          },
          { text: `Page ${pageIndex + 1}`, y: 980, locations: [location(3)] },
        ],
        { height: 1000 }
      );
    });
    const document = await read(
      {
        buffer: Buffer.from('lecteur PDF injecté'),
        mimeType: 'application/pdf',
      },
      { pdfReader: async () => pages }
    );

    for (const page of document.pages) {
      expect(page.text).toBe('fiche électrification des bâtiments');
      expect(page.lines[0].locations).toEqual([
        { pageIndex: page.index, lineIndex: 1 },
        { pageIndex: page.index, lineIndex: 2 },
      ]);
      expect(page.lines[0].links).toEqual(pages[page.index].lines[1].links);
      expect(page.links).toEqual(pages[page.index].links);
      expect(page.links).toHaveLength(2);
    }
    const units = segmentDocument(document, {
      minTokens: 0,
      maxTokens: 10,
      overlapTokens: 0,
    });
    expect(units.length).toBeGreaterThan(1);
    expect(
      units.flatMap(({ lines }) => lines).map(({ locations }) => locations)
    ).toEqual(
      document.pages
        .flatMap(({ lines }) => lines)
        .map(({ locations }) => locations)
    );
  });

  test('conserve les annotations après OCR sans inventer une destination à partir du libellé', async () => {
    const annotation: DocumentLink = {
      text: '',
      target: CONVENTION_FICHE_URL,
      kind: 'hyperlink',
      location: { pageIndex: 0, rect: [50, 100, 200, 130] },
    };
    const ocrPage = vi.fn(async () =>
      success('Fiche existante\nIndicateur associé')
    );
    const document = await read(
      { buffer: Buffer.from('scan synthétique'), mimeType: 'application/pdf' },
      {
        pdfReader: async () => [buildPage(0, [], { links: [annotation] })],
        renderPage: async (pageIndex) => ({
          pageIndex,
          mimeType: 'image/jpeg',
          data: Buffer.from('image factice'),
          width: 10,
          height: 10,
        }),
        ocr: { ocrPage },
      }
    );

    expect(ocrPage).toHaveBeenCalledTimes(1);
    expect(document.pages[0]).toMatchObject({
      source: 'ocr',
      text: 'Fiche existante\nIndicateur associé',
      links: [annotation],
    });
    expect(document.pages[0].lines.flatMap(({ links }) => links ?? [])).toEqual(
      []
    );
  });

  test('rattache les en-têtes reconstruits et les rappels de fusion aux cellules d’origine', async () => {
    const document = await read({
      buffer: await buildHorizontalHierarchyWorkbook(),
      mimeType: xlsxMime,
    });
    const units = segmentDocument(document, {
      minTokens: 0,
      maxTokens: 90,
      overlapTokens: 0,
    }).filter(({ headingPath }) => headingPath[0] === 'Suivi');

    expect(units.length).toBeGreaterThan(1);
    for (const unit of units) {
      const header = unit.lines.find(({ text }) =>
        text.includes('CALENDRIER · 2021')
      );
      expect(header?.locations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            pageIndex: 1,
            sheetName: 'Suivi',
            row: 3,
            col: 8,
          }),
          expect.objectContaining({
            pageIndex: 1,
            sheetName: 'Suivi',
            row: 4,
            col: 8,
          }),
        ])
      );
    }
    const continuation = units.find(
      ({ continued, text }) =>
        continued && text.includes('Calibrer les navettes')
    );
    const reminder = continuation?.lines.find(({ text }) =>
      text.startsWith('[Suite de :')
    );
    expect(reminder?.text).toContain('Aménager deux pôles multimodaux');
    expect(reminder?.locations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          pageIndex: 1,
          sheetName: 'Suivi',
          row: 6,
          col: 6,
        }),
      ])
    );
  });
});
