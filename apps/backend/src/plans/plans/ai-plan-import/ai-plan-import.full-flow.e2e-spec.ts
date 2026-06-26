import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication } from '@nestjs/common';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthToken,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, inArray } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { AI_PLAN_IMPORT_QUEUE_NAME } from './ai-plan-import.queue';
import { aiPlanImportJobTable } from './models/ai-plan-import-job.table';
import { consolidationResponseSchema } from './generate-import-draft/consolidate-actions/consolidate-actions.schema';
import { enrichmentResponseSchema } from './generate-import-draft/enrich-sous-actions/enrich-sous-actions.schema';
import { extractionResponseSchema } from './generate-import-draft/extract-actions/extract-actions.schema';
import { GenerateImportDraftService } from './generate-import-draft/generate-import-draft.service';
import { GenerateImportDraftWorker } from './generate-import-draft/generate-import-draft.worker';
import { qualitativeReviewResponseSchema } from './generate-import-draft/qualitative-review/qualitative-review.schema';
import { scoringResponseSchema } from './generate-import-draft/score-actions/score-actions.schema';

const QUALITATIVE_REVIEW_TEXT = 'Plan cohérent et bien structuré.';

const noTokens: TokenUsage = {
  promptTokens: 0,
  candidatesTokens: 0,
  thoughtsTokens: 0,
  totalTokens: 0,
};

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
  budget: '10000',
  statut: '',
};

const buildFakeLlm = (): LlmService => {
  const respondTo = (schema: unknown): unknown => {
    if (schema === extractionResponseSchema) {
      return [extractionAction];
    }
    if (schema === scoringResponseSchema) {
      return [{ index: 0, score: 50, explication: 'À consolider' }];
    }
    if (schema === consolidationResponseSchema) {
      return [
        {
          index: 0,
          titre: 'Action consolidée 1.1.1',
          description: 'Description consolidée',
          'sous-actions': ['Sous-action A'],
        },
      ];
    }
    if (schema === enrichmentResponseSchema) {
      return [
        {
          index: 0,
          description: 'Sous-action enrichie',
          personne_pilote: 'Jean Dupont',
          statut: '',
          date_debut: '',
          date_fin: '',
        },
      ];
    }
    if (schema === qualitativeReviewResponseSchema) {
      return { avis: QUALITATIVE_REVIEW_TEXT };
    }
    throw new Error('Schéma LLM inattendu dans le mock');
  };

  return {
    generateStructured: async ({ schema }: { schema: unknown }) => ({
      success: true,
      data: { data: respondTo(schema), tokens: noTokens },
    }),
  } as unknown as LlmService;
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

const csvSource = (): Buffer =>
  Buffer.from('axe,sous-axe,titre\nAxe 1,Sous-axe 1.1,Action 1.1.1', 'utf-8');

const TEST_COLLECTIVITE_ID = 1;

describe("Import IA d'un plan - parcours complet", { timeout: 60_000 }, () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  let user: AuthenticatedUser;
  let userToken: string;
  let cleanupSuperAdmin: () => Promise<void>;
  const createdPlanIds: number[] = [];
  const createdJobIds: string[] = [];

  const enqueueUrl = (): string =>
    `/collectivites/${TEST_COLLECTIVITE_ID}/plans/import-ia`;

  const getStatus = (jobId: string) =>
    router
      .createCaller({ user })
      .plans.aiImport.getAiImportStatus({ jobId });

  const getCurrentImport = () =>
    router
      .createCaller({ user })
      .plans.aiImport.getCurrentAiImport({
        collectiviteId: TEST_COLLECTIVITE_ID,
      });

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

  const deletePlan = async (planId: number): Promise<void> => {
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

    await router.createCaller({ user }).plans.plans.delete({ planId });
  };

  beforeAll(async () => {
    app = await getTestApp({
      overrides: (moduleBuilder) => {
        moduleBuilder
          .overrideProvider(GenerateImportDraftWorker)
          .useValue({ onModuleInit: () => undefined });
        moduleBuilder
          .overrideProvider(getQueueToken(AI_PLAN_IMPORT_QUEUE_NAME))
          .useValue({ add: async () => ({ id: 'fake-job' }) });
        moduleBuilder.overrideProvider(LlmService).useValue(buildFakeLlm());
        moduleBuilder
          .overrideProvider(DocumentStorageService)
          .useValue(buildInMemoryDocumentStorage());
      },
    });
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const testUser = await addTestUser(db, {
      collectiviteId: TEST_COLLECTIVITE_ID,
      role: CollectiviteRole.ADMIN,
    });
    user = getAuthUserFromUserCredentials(testUser.user);
    userToken = await getAuthToken({
      email: testUser.user.email ?? '',
      password: testUser.user.password,
    });

    ({ cleanup: cleanupSuperAdmin } = await addAndEnableUserSuperAdminMode({
      app,
      caller: router.createCaller({ user }),
      userId: user.id,
    }));
  });

  afterAll(async () => {
    for (const planId of createdPlanIds) {
      await deletePlan(planId);
    }
    if (createdJobIds.length > 0) {
      await db.db
        .delete(aiPlanImportJobTable)
        .where(inArray(aiPlanImportJobTable.id, createdJobIds));
    }
    await cleanupSuperAdmin();
    await app.close();
  });

  const enqueue = async (
    fields: Record<string, string>
  ): Promise<{ jobId: string }> => {
    let pending = request(app.getHttpServer())
      .post(enqueueUrl())
      .set('Authorization', `Bearer ${userToken}`);
    for (const [name, value] of Object.entries(fields)) {
      pending = pending.field(name, value);
    }
    const response = await pending.attach('file', csvSource(), {
      filename: 'plan.csv',
      contentType: 'text/csv',
    });
    expect(response.status).toBe(201);
    createdJobIds.push(response.body.jobId);
    return response.body;
  };

  test('exécute toutes les étapes puis crée le plan en base', async () => {
    const { jobId } = await enqueue({
      planName: 'Plan import IA complet',
      withVerifications: 'true',
      withSousActions: 'true',
    });

    const ongoing = await getCurrentImport();
    expect(ongoing).toMatchObject({ jobId, status: 'pending' });

    const generated = await app
      .get(GenerateImportDraftService)
      .generate(jobId);
    expect(generated).toEqual({ success: true });

    expect(await getCurrentImport()).toBeNull();

    const status = await getStatus(jobId);
    expect(status).toMatchObject({
      status: 'done',
      error: null,
      qualitativeReview: QUALITATIVE_REVIEW_TEXT,
      stepStates: {
        extraction: 'ok',
        scoring: 'ok',
        consolidation: 'ok',
        enrichment: 'ok',
        qualitativeReview: 'ok',
      },
    });
    expect(status.createdPlanId).toBeGreaterThan(0);

    const planId = status.createdPlanId;
    if (planId === null) {
      throw new Error('createdPlanId manquant après un import terminé');
    }
    createdPlanIds.push(planId);

    const [plan] = await db.db
      .select({
        nom: axeTable.nom,
        collectiviteId: axeTable.collectiviteId,
        parent: axeTable.parent,
      })
      .from(axeTable)
      .where(eq(axeTable.id, planId));
    expect(plan).toMatchObject({
      nom: 'Plan import IA complet',
      collectiviteId: TEST_COLLECTIVITE_ID,
      parent: null,
    });

    const actions = await fichesByTitreInPlan(planId, 'Action consolidée 1.1.1');
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
    const { jobId } = await enqueue({
      planName: 'Plan import IA minimal',
      withVerifications: 'false',
      withSousActions: 'false',
    });

    const generated = await app
      .get(GenerateImportDraftService)
      .generate(jobId);
    expect(generated).toEqual({ success: true });

    const status = await getStatus(jobId);
    expect(status).toMatchObject({
      status: 'done',
      stepStates: {
        extraction: 'ok',
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
    createdPlanIds.push(planId);

    const actions = await fichesByTitreInPlan(planId, 'Action 1.1.1');
    expect(actions).toHaveLength(1);

    const sousActions = await fichesByTitreInPlan(planId, 'Sous-action A');
    expect(sousActions).toHaveLength(0);
  });
});
