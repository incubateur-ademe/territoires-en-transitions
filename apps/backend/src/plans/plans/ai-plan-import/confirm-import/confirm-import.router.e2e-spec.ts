import { INestApplication } from '@nestjs/common';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { TrpcRouter } from '../../../../utils/trpc/trpc.router';
import { initialStepStates } from '../generate-import-draft/run-import-pipeline';
import { aiPlanImportJobTable } from '../models/ai-plan-import-job.table';
import { ExtractedAction } from '../models/extracted-action';
import { PlanDraft } from '../models/plan-draft';

const TEST_COLLECTIVITE_ID = 1;
const OTHER_COLLECTIVITE_ID = 2;

const toAction = (overrides: Partial<ExtractedAction> = {}): ExtractedAction => ({
  axe: 'Axe import IA',
  sousAxe: '',
  titre: 'Action import IA',
  description: 'Description issue du brouillon',
  objectifs: null,
  structurePilote: null,
  directionServicePilote: null,
  personnePilote: null,
  budget: null,
  statut: null,
  confidence: null,
  sousActions: [],
  ...overrides,
});

describe('Confirmation import IA', { timeout: 30_000 }, () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let testUser: AuthenticatedUser;
  let outsiderUser: AuthenticatedUser;
  const jobIds: string[] = [];

  const seedDoneJob = async (draft: PlanDraft): Promise<string> => {
    const [row] = await databaseService.db
      .insert(aiPlanImportJobTable)
      .values({
        collectiviteId: TEST_COLLECTIVITE_ID,
        createdBy: testUser.id,
        status: 'done',
        options: {
          instructions: '',
          withVerifications: true,
          withSousActions: true,
          disabledFields: [],
        },
        stepStates: initialStepStates(),
        sourcePath: `${TEST_COLLECTIVITE_ID}/e2e-confirm`,
        draft,
      })
      .returning();
    jobIds.push(row.id);
    return row.id;
  };

  const deletePlan = async (
    caller: ReturnType<TrpcRouter['createCaller']>,
    planId: number
  ) => {
    const axeIds = await databaseService.db
      .select({ id: axeTable.id })
      .from(axeTable)
      .where(eq(axeTable.plan, planId));
    const allAxeIds = [planId, ...axeIds.map((axe) => axe.id)];

    const ficheRows = await databaseService.db
      .select({ ficheId: ficheActionAxeTable.ficheId })
      .from(ficheActionAxeTable)
      .where(inArray(ficheActionAxeTable.axeId, allAxeIds));
    const ficheIds = ficheRows
      .map((fiche) => fiche.ficheId)
      .filter((id): id is number => id !== null);

    if (ficheIds.length > 0) {
      await databaseService.db
        .delete(ficheActionPiloteTable)
        .where(inArray(ficheActionPiloteTable.ficheId, ficheIds));
    }

    await caller.plans.plans.delete({ planId });
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const owner = await addTestUser(databaseService, {
      collectiviteId: TEST_COLLECTIVITE_ID,
      role: CollectiviteRole.ADMIN,
    });
    testUser = getAuthUserFromUserCredentials(owner.user);

    const outsider = await addTestUser(databaseService, {
      collectiviteId: OTHER_COLLECTIVITE_ID,
      role: CollectiviteRole.ADMIN,
    });
    outsiderUser = getAuthUserFromUserCredentials(outsider.user);
  });

  afterAll(async () => {
    if (jobIds.length > 0) {
      await databaseService.db
        .delete(aiPlanImportJobTable)
        .where(inArray(aiPlanImportJobTable.id, jobIds));
    }
    await app.close();
  });

  it('confirme un brouillon et crée le plan, puis reste idempotent', async () => {
    const caller = router.createCaller({ user: testUser });
    const actions = [toAction()];
    const jobId = await seedDoneJob({ actions, qualitativeReview: null });

    const result = await caller.plans.plans.confirmAiImport({
      jobId,
      planName: 'Plan import IA e2e',
      actions,
    });

    expect(result.planId).toBeGreaterThan(0);
    expect(result.fichesCount).toBe(1);

    onTestFinished(async () => {
      await deletePlan(caller, result.planId);
    });

    const second = await caller.plans.plans.confirmAiImport({
      jobId,
      planName: 'Plan import IA e2e',
      actions,
    });
    expect(second.planId).toBe(result.planId);
  });

  it('refuse la confirmation par un utilisateur sans droit sur la collectivité', async () => {
    const actions = [toAction()];
    const jobId = await seedDoneJob({ actions, qualitativeReview: null });

    const outsiderCaller = router.createCaller({ user: outsiderUser });
    await expect(
      outsiderCaller.plans.plans.confirmAiImport({
        jobId,
        planName: 'Plan import IA e2e',
        actions,
      })
    ).rejects.toThrowError();
  });

  it('renvoie une erreur quand une action du brouillon est invalide', async () => {
    const caller = router.createCaller({ user: testUser });
    const actions = [toAction({ titre: '' })];
    const jobId = await seedDoneJob({ actions, qualitativeReview: null });

    await expect(
      caller.plans.plans.confirmAiImport({
        jobId,
        planName: 'Plan import IA e2e',
        actions,
      })
    ).rejects.toThrowError('Le titre de l\'action est invalide');
  });
});
