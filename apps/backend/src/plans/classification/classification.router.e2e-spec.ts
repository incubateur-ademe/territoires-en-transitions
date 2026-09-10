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
import { Enjeu } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { ClassificationVoletsJobRepository } from './classification-volets-job.repository';
import { ClassificationVoletsErrorEnum } from './classification-volets.errors';
import {
  ClassificationVoletsJobStatus,
  ClassificationVoletsJobStatusEnum,
  IN_FLIGHT_LEASE_MS,
} from './models/classification-volets-job';
import { classificationVoletsJobTable } from './models/classification-volets-job.table';

describe('ClassificationRouter', { timeout: 30_000 }, () => {
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
    router.createCaller({ user }).plans.classificationVolets;

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
        .delete(classificationVoletsJobTable)
        .where(
          eq(classificationVoletsJobTable.collectiviteId, collectiviteId)
        );
      await ficheCleanup();
      await fixtureCaller.plans.plans.delete({ planId: planWithFichesId });
      await fixtureCaller.plans.plans.delete({ planId: emptyPlanId });
      await app.close();
    };
  });

  const insertJob = async ({
    status = ClassificationVoletsJobStatusEnum.DONE,
    planId,
    enjeu = 'ges',
    modifiedAt,
  }: {
    status?: ClassificationVoletsJobStatus;
    planId?: number;
    enjeu?: Enjeu;
    modifiedAt?: string;
  } = {}): Promise<string> => {
    const [job] = await db.db
      .insert(classificationVoletsJobTable)
      .values({
        collectiviteId,
        planId: planId ?? emptyPlanId,
        enjeu,
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

  describe('enqueueClassification', () => {
    it("refuse un plan qui n'existe pas", async () => {
      await expect(
        callerFor(editionUser).enqueueClassification({
          planId: 999_999_999,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/n'existe pas/);
    });

    it('refuse un sous-axe, qui ne désigne pas un plan', async () => {
      await expect(
        callerFor(editionUser).enqueueClassification({
          planId: sousAxeId,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/axe et non un plan/);
    });

    it('refuse un plan sans aucune fiche à classer', async () => {
      await expect(
        callerFor(editionUser).enqueueClassification({
          planId: emptyPlanId,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/aucune fiche/);
    });

    it("cache le plan à un membre d'une autre collectivité", async () => {
      await expect(
        callerFor(outsiderUser).enqueueClassification({
          planId: planWithFichesId,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/n'existe pas/);
    });

    it('enfile un job et rend son identifiant', async () => {
      const { jobId } = await callerFor(
        editionUser
      ).enqueueClassification({ planId: planWithFichesId, enjeu: 'ges' });

      onTestFinished(async () => {
        await db.db
          .delete(classificationVoletsJobTable)
          .where(eq(classificationVoletsJobTable.id, jobId));
      });

      expect(jobId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it('refuse un second job tant que le premier est en vol', async () => {
      const { jobId } = await callerFor(
        editionUser
      ).enqueueClassification({ planId: planWithFichesId, enjeu: 'ges' });

      onTestFinished(async () => {
        await db.db
          .delete(classificationVoletsJobTable)
          .where(eq(classificationVoletsJobTable.id, jobId));
      });

      await expect(
        callerFor(editionUser).enqueueClassification({
          planId: planWithFichesId,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/déjà en cours/);
    });
  });

  describe('getClassificationStatus', () => {
    it('rend le classement, sans compteur de lots, sur un job termine', async () => {
      const jobId = await insertJob();
      const status = await callerFor(
        editionUser
      ).getClassificationStatus({ jobId });

      expect(status).toEqual({
        id: jobId,
        planId: emptyPlanId,
        enjeu: 'ges',
        status: ClassificationVoletsJobStatusEnum.DONE,
        draft: {
          fiches: [],
          unclassified: [{ ficheId: 42, reason: 'truncated' }],
        },
      });
    });

    it('rend la progression, sans classement, tant que le job tourne', async () => {
      const jobId = await insertJob({
        status: ClassificationVoletsJobStatusEnum.RUNNING,
      });
      const status = await callerFor(
        editionUser
      ).getClassificationStatus({ jobId });

      expect(status).toEqual({
        id: jobId,
        planId: emptyPlanId,
        enjeu: 'ges',
        status: ClassificationVoletsJobStatusEnum.RUNNING,
        processedBatches: 2,
        totalBatches: 3,
      });
    });

    it("cache l'existence du job à un membre d'une autre collectivité", async () => {
      const jobId = await insertJob();
      await expect(
        callerFor(outsiderUser).getClassificationStatus({ jobId })
      ).rejects.toThrowError(/n'existe pas/);
    });

    it("échoue sur un job qui n'existe pas", async () => {
      await expect(
        callerFor(editionUser).getClassificationStatus({
          jobId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrowError(/n'existe pas/);
    });
  });

  describe('bail des jobs en vol', () => {
    const cleanupJobsOfPlan = (planId: number): void => {
      onTestFinished(async () => {
        await db.db
          .delete(classificationVoletsJobTable)
          .where(eq(classificationVoletsJobTable.planId, planId));
      });
    };

    it("reprend un plan dont le job en vol n'a plus progressé depuis le bail", async () => {
      cleanupJobsOfPlan(planWithFichesId);
      const staleJobId = await insertJob({
        status: ClassificationVoletsJobStatusEnum.RUNNING,
        planId: planWithFichesId,
        modifiedAt: new Date(
          Date.now() - IN_FLIGHT_LEASE_MS - 60_000
        ).toISOString(),
      });

      const { jobId } = await callerFor(
        editionUser
      ).enqueueClassification({ planId: planWithFichesId, enjeu: 'ges' });

      const [staleJob] = await db.db
        .select({
          status: classificationVoletsJobTable.status,
          error: classificationVoletsJobTable.error,
        })
        .from(classificationVoletsJobTable)
        .where(eq(classificationVoletsJobTable.id, staleJobId));

      expect({
        isNewJob: jobId !== staleJobId,
        staleStatus: staleJob.status,
        staleError: staleJob.error,
      }).toEqual({
        isNewJob: true,
        staleStatus: ClassificationVoletsJobStatusEnum.FAILED,
        staleError:
          'Job abandonné : aucune progression depuis plus de trente minutes',
      });
    });

    it('refuse un plan dont le job en vol a progressé dans le bail', async () => {
      cleanupJobsOfPlan(planWithFichesId);
      await insertJob({
        status: ClassificationVoletsJobStatusEnum.RUNNING,
        planId: planWithFichesId,
        modifiedAt: new Date(
          Date.now() - IN_FLIGHT_LEASE_MS + 60_000
        ).toISOString(),
      });

      await expect(
        callerFor(editionUser).enqueueClassification({
          planId: planWithFichesId,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/déjà en cours/);
    });
  });

  describe('transitions du job', () => {
    it("refuse de clore un job qui n'est plus en cours", async () => {
      const jobId = await insertJob({
        status: ClassificationVoletsJobStatusEnum.DONE,
      });

      const result = await app.get(ClassificationVoletsJobRepository).markDone({
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
        error: ClassificationVoletsErrorEnum.JOB_TRANSITION_REFUSED,
      });
    });
  });
});
