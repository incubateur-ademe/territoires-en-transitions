import { INestApplication, NotFoundException } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createFicheAndCleanupFunction } from '@tet/backend/plans/fiches/fiches.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  Enjeu,
  type AnalysisStep,
  type CategorieAction,
  type LevierId,
} from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { sortBy } from 'es-toolkit';
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
    createdAt,
  }: {
    status?: AnalysisJobStatus;
    enjeu?: Enjeu;
    etape?: AnalysisStep;
    modifiedAt?: string;
    createdAt?: string;
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
        createdAt,
        report: {
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

  describe('getLastAnalysis', () => {
    const isIsoDateTime = (value: unknown): boolean =>
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);

    it('rend le classement, sans compteur de lots, sur un job termine', async () => {
      const jobId = await insertJob();

      const analysis = await callerFor(editionUser).getLastAnalysis({
        collectiviteId,
        enjeu: 'ges',
      });

      expect({
        ...analysis,
        createdAt: isIsoDateTime(analysis?.createdAt),
        modifiedAt: isIsoDateTime(analysis?.modifiedAt),
      }).toEqual({
        id: jobId,
        collectiviteId,
        enjeu: 'ges',
        etape: 'mobilisation',
        status: AnalysisJobStatusEnum.DONE,
        report: {
          fiches: [],
        },
        createdAt: true,
        modifiedAt: true,
      });
    });

    it('rend le job le plus recent quand la collectivite en compte plusieurs', async () => {
      cleanupEnqueuedJobs();

      await insertJob({ createdAt: '2026-01-01T00:00:00.000Z' });
      const lastJobId = await insertJob({
        status: AnalysisJobStatusEnum.RUNNING,
        etape: 'classification',
        createdAt: '2026-02-01T00:00:00.000Z',
      });

      const analysis = await callerFor(editionUser).getLastAnalysis({
        collectiviteId,
        enjeu: 'ges',
      });

      expect({ id: analysis?.id, status: analysis?.status }).toEqual({
        id: lastJobId,
        status: AnalysisJobStatusEnum.RUNNING,
      });
    });

    it("rend null quand la collectivite n'a jamais ete analysee", async () => {
      const analysis = await callerFor(outsiderUser).getLastAnalysis({
        collectiviteId: collectiviteWithoutFicheId,
        enjeu: 'ges',
      });

      expect(analysis).toBeNull();
    });

    it("cache la collectivité à un membre d'une autre collectivité", async () => {
      await insertJob();

      await expect(
        callerFor(outsiderUser).getLastAnalysis({
          collectiviteId,
          enjeu: 'ges',
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
    const levierId: LevierId = 'velo_transport_commun';

    const insertMobilisationRows = async (
      volets: { categorie: CategorieAction; note: number }[]
    ): Promise<void> => {
      await db.db.insert(collectiviteVoletGesTable).values(
        volets.map(({ categorie, note }) => ({
          collectiviteId,
          levierId,
          categorie,
          note,
          ficheIds: [ficheId],
        }))
      );

      onTestFinished(async () => {
        await db.db
          .delete(collectiviteVoletGesTable)
          .where(eq(collectiviteVoletGesTable.collectiviteId, collectiviteId));
      });
    };

    const addUserWithoutCollectivite = async ({
      verified,
    }: {
      verified: boolean;
    }): Promise<AuthenticatedUser> => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: null,
        verified,
      });
      onTestFinished(cleanup);
      return getAuthUserFromUserCredentials(user);
    };

    it('rend une mobilisation vide sur une collectivité jamais évaluée', async () => {
      const mobilisation = await callerFor(editionUser).getMobilisation({
        collectiviteId,
        enjeu: 'ges',
      });

      expect(mobilisation).toEqual({ collectiviteId, leviers: [] });
    });

    it('compte une seule fois au levier une fiche rattachée à deux de ses catégories, sans rendre son identifiant', async () => {
      await insertMobilisationRows([
        { categorie: 'amenagement', note: 2 },
        { categorie: 'planification', note: 1 },
      ]);

      const mobilisation = await callerFor(editionUser).getMobilisation({
        collectiviteId,
        enjeu: 'ges',
      });

      expect({
        ...mobilisation,
        leviers: mobilisation.leviers.map((levier) => ({
          ...levier,
          volets: sortBy(levier.volets, ['categorie']),
        })),
      }).toStrictEqual({
        collectiviteId,
        leviers: [
          {
            levierId,
            ficheCount: 1,
            volets: [
              { categorie: 'amenagement', note: 2, ficheCount: 1 },
              { categorie: 'planification', note: 1, ficheCount: 1 },
            ],
          },
        ],
      });
    });

    it("rend la mobilisation à un utilisateur vérifié qui n'est membre d'aucune collectivité", async () => {
      await insertMobilisationRows([{ categorie: 'amenagement', note: 2 }]);
      const verifiedUser = await addUserWithoutCollectivite({ verified: true });

      const [memberView, verifiedView] = await Promise.all(
        [editionUser, verifiedUser].map((user) =>
          callerFor(user).getMobilisation({ collectiviteId, enjeu: 'ges' })
        )
      );

      expect(verifiedView).toEqual(memberView);
    });

    it('cache la mobilisation à un utilisateur non vérifié', async () => {
      await insertMobilisationRows([{ categorie: 'amenagement', note: 2 }]);
      const unverifiedUser = await addUserWithoutCollectivite({
        verified: false,
      });

      await expect(
        callerFor(unverifiedUser).getMobilisation({
          collectiviteId,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/n'existe pas/);
    });

    it("cache la mobilisation d'une collectivité en accès restreint à un utilisateur vérifié qui n'en est pas membre", async () => {
      const restricted = await addTestCollectivite(db, {
        accesRestreint: true,
      });
      onTestFinished(restricted.cleanup);
      const verifiedUser = await addUserWithoutCollectivite({ verified: true });

      await expect(
        callerFor(verifiedUser).getMobilisation({
          collectiviteId: restricted.collectivite.id,
          enjeu: 'ges',
        })
      ).rejects.toThrowError(/n'existe pas/);
    });

    it("répond introuvable à un utilisateur vérifié sur une collectivité qui n'existe pas", async () => {
      const verifiedUser = await addUserWithoutCollectivite({ verified: true });

      await expect(
        callerFor(verifiedUser).getMobilisation({
          collectiviteId: 999_999_999,
          enjeu: 'ges',
        })
      ).rejects.toMatchObject({ cause: expect.any(NotFoundException) });
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
