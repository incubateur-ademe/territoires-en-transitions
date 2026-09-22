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
import { Enjeu, type AnalysisStep } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { AnalysisJobRepository } from './analysis-job.repository';
import { AnalysisJobErrorEnum } from './analysis-job.errors';
import {
  AnalysisJobStatus,
  AnalysisJobStatusEnum,
  IN_FLIGHT_LEASE_MS,
} from './models/analysis-job';
import { analysisJobTable } from './models/analysis-job.table';
import { collectiviteVoletGesTable } from './models/collectivite-volet-ges.table';

describe('AnalysisRouter', { timeout: 30_000 }, () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  let collectiviteId: number;
  let collectiviteWithoutFicheId: number;
  let editionUser: AuthenticatedUser;
  let outsiderUser: AuthenticatedUser;
  let planId: number;
  let ficheId: number;

  const callerFor = (user: AuthenticatedUser) =>
    router.createCaller({ user }).collectivites.analysis;

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
    collectiviteWithoutFicheId = outsider.collectivite.id;
    outsiderUser = getAuthUserFromUserCredentials(outsider.user);

    const fixtureCaller = router.createCaller({ user: editionUser });

    const plan = await fixtureCaller.plans.plans.create({
      collectiviteId,
      nom: 'Plan classable',
    });
    planId = plan.id;

    const { ficheId: createdFicheId, ficheCleanup } =
      await createFicheAndCleanupFunction({
        caller: fixtureCaller,
        ficheInput: {
          collectiviteId,
          titre: 'Amenager des pistes cyclables',
          axeId: planId,
        },
      });
    ficheId = createdFicheId;

    return async () => {
      await db.db
        .delete(analysisJobTable)
        .where(eq(analysisJobTable.collectiviteId, collectiviteId));
      await ficheCleanup();
      await fixtureCaller.plans.plans.delete({ planId });
      await app.close();
    };
  });

  const insertJob = async ({
    status = AnalysisJobStatusEnum.DONE,
    enjeu = 'ges',
    etape = 'mobilisation',
    modifiedAt,
  }: {
    status?: AnalysisJobStatus;
    enjeu?: Enjeu;
    etape?: AnalysisStep;
    modifiedAt?: string;
  } = {}): Promise<string> => {
    const [job] = await db.db
      .insert(analysisJobTable)
      .values({
        collectiviteId,
        enjeu,
        etape,
        createdBy: editionUser.id,
        status,
        processedBatches: 2,
        totalBatches: 3,
        modifiedAt,
        draft: {
          fiches: [],
        },
      })
      .returning();

    onTestFinished(async () => {
      await db.db
        .delete(analysisJobTable)
        .where(eq(analysisJobTable.id, job.id));
    });

    return job.id;
  };

  const beyondLease = (): string =>
    new Date(Date.now() - IN_FLIGHT_LEASE_MS - 60_000).toISOString();

  const withinLease = (): string =>
    new Date(Date.now() - IN_FLIGHT_LEASE_MS + 60_000).toISOString();

  const cleanupEnqueuedJobs = (): void => {
    onTestFinished(async () => {
      await db.db
        .delete(analysisJobTable)
        .where(eq(analysisJobTable.collectiviteId, collectiviteId));
    });
  };

  describe('enqueueAnalysis', () => {
    it('refuse une collectivité sans aucune fiche à classer', async () => {
      await expect(
        callerFor(outsiderUser).enqueueAnalysis({
          collectiviteId: collectiviteWithoutFicheId,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/aucune fiche/);
    });

    it("cache la collectivité à un membre d'une autre collectivité", async () => {
      await expect(
        callerFor(outsiderUser).enqueueAnalysis({
          collectiviteId,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/n'existe pas/);
    });

    it('enfile un job et rend son identifiant', async () => {
      cleanupEnqueuedJobs();

      const { jobId } = await callerFor(editionUser).enqueueAnalysis({
        collectiviteId,
        enjeu: 'ges',
      });

      expect(jobId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it('refuse un second job tant que le premier est in-flight', async () => {
      cleanupEnqueuedJobs();

      await callerFor(editionUser).enqueueAnalysis({
        collectiviteId,
        enjeu: 'ges',
      });

      await expect(
        callerFor(editionUser).enqueueAnalysis({
          collectiviteId,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/déjà en cours/);
    });
  });

  describe('getAnalysisStatus', () => {
    it('rend le classement, sans compteur de lots, sur un job termine', async () => {
      const jobId = await insertJob();
      const status = await callerFor(editionUser).getAnalysisStatus({
        jobId,
      });

      expect(status).toEqual({
        id: jobId,
        collectiviteId,
        enjeu: 'ges',
        etape: 'mobilisation',
        status: AnalysisJobStatusEnum.DONE,
        draft: {
          fiches: [],
        },
      });
    });

    it('rend la progression, sans classement, tant que le job tourne', async () => {
      cleanupEnqueuedJobs();

      const jobId = await insertJob({
        status: AnalysisJobStatusEnum.RUNNING,
        etape: 'classification',
      });
      const status = await callerFor(editionUser).getAnalysisStatus({
        jobId,
      });

      expect(status).toEqual({
        id: jobId,
        collectiviteId,
        enjeu: 'ges',
        etape: 'classification',
        status: AnalysisJobStatusEnum.RUNNING,
        processedBatches: 2,
        totalBatches: 3,
      });
    });

    it("cache l'existence du job à un membre d'une autre collectivité", async () => {
      const jobId = await insertJob();
      await expect(
        callerFor(outsiderUser).getAnalysisStatus({ jobId })
      ).rejects.toThrowError(/n'existe pas/);
    });

    it("échoue sur un job qui n'existe pas", async () => {
      await expect(
        callerFor(editionUser).getAnalysisStatus({
          jobId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrowError(/n'existe pas/);
    });
  });

  describe('expiration des jobs in-flight', () => {
    it("remplace un job in-flight qui n'a plus progressé depuis plus longtemps que IN_FLIGHT_LEASE_MS", async () => {
      cleanupEnqueuedJobs();

      const staleJobId = await insertJob({
        status: AnalysisJobStatusEnum.RUNNING,
        modifiedAt: beyondLease(),
      });

      const { jobId } = await callerFor(editionUser).enqueueAnalysis({
        collectiviteId,
        enjeu: 'ges',
      });

      const [staleJob] = await db.db
        .select({
          status: analysisJobTable.status,
          error: analysisJobTable.error,
        })
        .from(analysisJobTable)
        .where(eq(analysisJobTable.id, staleJobId));

      expect({
        isNewJob: jobId !== staleJobId,
        staleStatus: staleJob.status,
        staleError: staleJob.error,
      }).toEqual({
        isNewJob: true,
        staleStatus: AnalysisJobStatusEnum.FAILED,
        staleError:
          'Job abandonné : aucune progression depuis plus de 65 minutes',
      });
    });

    it('refuse un nouveau job tant que le précédent a progressé récemment', async () => {
      cleanupEnqueuedJobs();

      await insertJob({
        status: AnalysisJobStatusEnum.RUNNING,
        modifiedAt: withinLease(),
      });

      await expect(
        callerFor(editionUser).enqueueAnalysis({
          collectiviteId,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/déjà en cours/);
    });
  });

  describe('getMobilisation', () => {
    const insertMobilisationRow = async (note: number): Promise<void> => {
      await db.db.insert(collectiviteVoletGesTable).values({
        collectiviteId,
        levierId: 'velo_transport_commun',
        categorie: 'amenagement',
        note,
        ficheIds: [ficheId],
      });

      onTestFinished(async () => {
        await db.db
          .delete(collectiviteVoletGesTable)
          .where(eq(collectiviteVoletGesTable.collectiviteId, collectiviteId));
      });
    };

    it('rend une mobilisation vide sur une collectivité jamais évaluée', async () => {
      const mobilisation = await callerFor(editionUser).getMobilisation({
        collectiviteId,
        enjeu: 'ges',
      });

      expect(mobilisation).toEqual({ collectiviteId, leviers: [] });
    });

    it('rend la note et les fiches qui l ont nourrie', async () => {
      await insertMobilisationRow(2);

      const mobilisation = await callerFor(editionUser).getMobilisation({
        collectiviteId,
        enjeu: 'ges',
      });

      expect(mobilisation).toEqual({
        collectiviteId,
        leviers: [
          {
            levierId: 'velo_transport_commun',
            volets: [
              { categorie: 'amenagement', note: 2, ficheIds: [ficheId] },
            ],
          },
        ],
      });
    });

    it("cache la mobilisation à un membre d'une autre collectivité", async () => {
      await insertMobilisationRow(2);

      await expect(
        callerFor(outsiderUser).getMobilisation({
          collectiviteId,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/n'existe pas/);
    });
  });

  describe('transitions du job', () => {
    it("refuse de clore un job qui n'est plus en cours", async () => {
      const jobId = await insertJob({
        status: AnalysisJobStatusEnum.DONE,
      });

      const result = await app.get(AnalysisJobRepository).markDone({
        id: jobId,
      });

      expect(result).toEqual({
        success: false,
        error: AnalysisJobErrorEnum.JOB_TRANSITION_REFUSED,
      });
    });
  });
});
