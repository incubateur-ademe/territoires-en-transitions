import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createFicheAndCleanupFunction } from '@tet/backend/plans/fiches/fiches.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { ClassificationLeviersJobRepository } from './classification-leviers-job.repository';
import { ClassificationLeviersErrorEnum } from './classification-leviers.errors';
import {
  ClassificationLeviersJobStatus,
  ClassificationLeviersJobStatusEnum,
  IN_FLIGHT_LEASE_MS,
} from './models/classification-leviers-job';
import { classificationLeviersJobTable } from './models/classification-leviers-job.table';

describe('PriorisationRouter', { timeout: 30_000 }, () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  let collectiviteId: number;
  let editionUser: AuthenticatedUser;
  let outsiderUser: AuthenticatedUser;
  let planWithFichesId: number;
  let emptyPlanId: number;
  let sousAxeId: number;

  const callerFor = (user: AuthenticatedUser) =>
    router.createCaller({ user }).plans.classificationLeviers;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    collectiviteId = collectivite.id;
    editionUser = getAuthUserFromUserCredentials(user);

    const outsider = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    outsiderUser = getAuthUserFromUserCredentials(outsider.user);

    const fixtureCaller = router.createCaller({ user: editionUser });

    const planWithFiches = await fixtureCaller.plans.plans.create({
      collectiviteId,
      nom: 'Plan classable',
    });
    planWithFichesId = planWithFiches.id;

    const emptyPlan = await fixtureCaller.plans.plans.create({
      collectiviteId,
      nom: 'Plan sans fiche',
    });
    emptyPlanId = emptyPlan.id;

    const sousAxe = await fixtureCaller.plans.axes.create({
      collectiviteId,
      nom: 'Sous-axe',
      planId: planWithFichesId,
      parent: planWithFichesId,
    });
    sousAxeId = sousAxe.id;

    const { ficheCleanup } = await createFicheAndCleanupFunction({
      caller: fixtureCaller,
      ficheInput: {
        collectiviteId,
        titre: 'Amenager des pistes cyclables',
        axeId: planWithFichesId,
      },
    });

    return async () => {
      await db.db
        .delete(classificationLeviersJobTable)
        .where(
          eq(classificationLeviersJobTable.collectiviteId, collectiviteId)
        );
      await ficheCleanup();
      await fixtureCaller.plans.plans.delete({ planId: planWithFichesId });
      await fixtureCaller.plans.plans.delete({ planId: emptyPlanId });
      await app.close();
    };
  });

  const insertJob = async ({
    status = ClassificationLeviersJobStatusEnum.DONE,
    planId,
    modifiedAt,
  }: {
    status?: ClassificationLeviersJobStatus;
    planId?: number;
    modifiedAt?: string;
  } = {}): Promise<string> => {
    const [job] = await db.db
      .insert(classificationLeviersJobTable)
      .values({
        collectiviteId,
        planId: planId ?? emptyPlanId,
        createdBy: editionUser.id,
        status,
        processedBatches: 2,
        totalBatches: 3,
        modifiedAt,
        draft: {
          fiches: [],
          unclassified: [{ ficheId: 42, reason: 'truncated' }],
        },
      })
      .returning();
    return job.id;
  };

  describe('enqueueClassificationLeviers', () => {
    it("refuse un plan qui n'existe pas", async () => {
      await expect(
        callerFor(editionUser).enqueueClassificationLeviers({
          planId: 999_999_999,
        })
      ).rejects.toThrowError(/n'existe pas/);
    });

    it('refuse un sous-axe, qui ne désigne pas un plan', async () => {
      await expect(
        callerFor(editionUser).enqueueClassificationLeviers({
          planId: sousAxeId,
        })
      ).rejects.toThrowError(/axe et non un plan/);
    });

    it('refuse un plan sans aucune fiche à classer', async () => {
      await expect(
        callerFor(editionUser).enqueueClassificationLeviers({
          planId: emptyPlanId,
        })
      ).rejects.toThrowError(/aucune fiche/);
    });

    it("cache le plan à un membre d'une autre collectivité", async () => {
      await expect(
        callerFor(outsiderUser).enqueueClassificationLeviers({
          planId: planWithFichesId,
        })
      ).rejects.toThrowError(/n'existe pas/);
    });

    it('enfile un job et rend son identifiant', async () => {
      const { jobId } = await callerFor(
        editionUser
      ).enqueueClassificationLeviers({ planId: planWithFichesId });

      onTestFinished(async () => {
        await db.db
          .delete(classificationLeviersJobTable)
          .where(eq(classificationLeviersJobTable.id, jobId));
      });

      expect(jobId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it('refuse un second job tant que le premier est en vol', async () => {
      const { jobId } = await callerFor(
        editionUser
      ).enqueueClassificationLeviers({ planId: planWithFichesId });

      onTestFinished(async () => {
        await db.db
          .delete(classificationLeviersJobTable)
          .where(eq(classificationLeviersJobTable.id, jobId));
      });

      await expect(
        callerFor(editionUser).enqueueClassificationLeviers({
          planId: planWithFichesId,
        })
      ).rejects.toThrowError(/déjà en cours/);
    });
  });

  describe('getClassificationLeviersStatus', () => {
    it('rend le classement, sans compteur de lots, sur un job termine', async () => {
      const jobId = await insertJob();
      const status = await callerFor(
        editionUser
      ).getClassificationLeviersStatus({ jobId });

      expect(status).toEqual({
        id: jobId,
        planId: emptyPlanId,
        status: ClassificationLeviersJobStatusEnum.DONE,
        draft: {
          fiches: [],
          unclassified: [{ ficheId: 42, reason: 'truncated' }],
        },
      });
    });

    it('rend la progression, sans classement, tant que le job tourne', async () => {
      const jobId = await insertJob({
        status: ClassificationLeviersJobStatusEnum.RUNNING,
      });
      const status = await callerFor(
        editionUser
      ).getClassificationLeviersStatus({ jobId });

      expect(status).toEqual({
        id: jobId,
        planId: emptyPlanId,
        status: ClassificationLeviersJobStatusEnum.RUNNING,
        processedBatches: 2,
        totalBatches: 3,
      });
    });

    it("cache l'existence du job à un membre d'une autre collectivité", async () => {
      const jobId = await insertJob();
      await expect(
        callerFor(outsiderUser).getClassificationLeviersStatus({ jobId })
      ).rejects.toThrowError(/n'existe pas/);
    });

    it("échoue sur un job qui n'existe pas", async () => {
      await expect(
        callerFor(editionUser).getClassificationLeviersStatus({
          jobId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrowError(/n'existe pas/);
    });
  });

  describe('bail des jobs en vol', () => {
    const cleanupJobsOfPlan = (planId: number): void => {
      onTestFinished(async () => {
        await db.db
          .delete(classificationLeviersJobTable)
          .where(eq(classificationLeviersJobTable.planId, planId));
      });
    };

    it("reprend un plan dont le job en vol n'a plus progressé depuis le bail", async () => {
      cleanupJobsOfPlan(planWithFichesId);
      const staleJobId = await insertJob({
        status: ClassificationLeviersJobStatusEnum.RUNNING,
        planId: planWithFichesId,
        modifiedAt: new Date(
          Date.now() - IN_FLIGHT_LEASE_MS - 60_000
        ).toISOString(),
      });

      const { jobId } = await callerFor(
        editionUser
      ).enqueueClassificationLeviers({ planId: planWithFichesId });

      const [staleJob] = await db.db
        .select({
          status: classificationLeviersJobTable.status,
          error: classificationLeviersJobTable.error,
        })
        .from(classificationLeviersJobTable)
        .where(eq(classificationLeviersJobTable.id, staleJobId));

      expect({
        isNewJob: jobId !== staleJobId,
        staleStatus: staleJob.status,
        staleError: staleJob.error,
      }).toEqual({
        isNewJob: true,
        staleStatus: ClassificationLeviersJobStatusEnum.FAILED,
        staleError:
          'Job abandonné : aucune progression depuis plus de trente minutes',
      });
    });

    it('refuse un plan dont le job en vol a progressé dans le bail', async () => {
      cleanupJobsOfPlan(planWithFichesId);
      await insertJob({
        status: ClassificationLeviersJobStatusEnum.RUNNING,
        planId: planWithFichesId,
        modifiedAt: new Date(
          Date.now() - IN_FLIGHT_LEASE_MS + 60_000
        ).toISOString(),
      });

      await expect(
        callerFor(editionUser).enqueueClassificationLeviers({
          planId: planWithFichesId,
        })
      ).rejects.toThrowError(/déjà en cours/);
    });
  });

  describe('transitions du job', () => {
    it("refuse de clore un job qui n'est plus en cours", async () => {
      const jobId = await insertJob({
        status: ClassificationLeviersJobStatusEnum.DONE,
      });

      const result = await app.get(ClassificationLeviersJobRepository).markDone({
        id: jobId,
        draft: { fiches: [], unclassified: [] },
        tokenUsage: {
          promptTokens: 1,
          candidatesTokens: 1,
          thoughtsTokens: 0,
          totalTokens: 2,
        },
      });

      expect(result).toEqual({
        success: false,
        error: ClassificationLeviersErrorEnum.JOB_TRANSITION_REFUSED,
      });
    });
  });
});
