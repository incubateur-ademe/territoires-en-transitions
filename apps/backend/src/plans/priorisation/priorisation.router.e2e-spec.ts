import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
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
import { classificationLeviersJobTable } from './models/classification-leviers-job.table';
import { ClassificationLeviersJobStatusEnum } from './models/classification-leviers-job';

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

    const [planWithFiches, emptyPlan] = await db.db
      .insert(axeTable)
      .values([
        { nom: 'Plan classable', collectiviteId },
        { nom: 'Plan sans fiche', collectiviteId },
      ])
      .returning();
    planWithFichesId = planWithFiches.id;
    emptyPlanId = emptyPlan.id;

    const [sousAxe] = await db.db
      .insert(axeTable)
      .values({
        nom: 'Sous-axe',
        collectiviteId,
        parent: planWithFichesId,
      })
      .returning();
    sousAxeId = sousAxe.id;

    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Aménager des pistes cyclables',
        description: 'Dix kilomètres de pistes',
        collectiviteId,
        restreint: false,
      })
      .returning();
    await db.db
      .insert(ficheActionAxeTable)
      .values({ ficheId: fiche.id, axeId: planWithFichesId });

    return async () => {
      await db.db
        .delete(classificationLeviersJobTable)
        .where(
          eq(classificationLeviersJobTable.collectiviteId, collectiviteId)
        );
      await db.db
        .delete(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.ficheId, fiche.id));
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, fiche.id));
      await db.db
        .delete(axeTable)
        .where(eq(axeTable.collectiviteId, collectiviteId));
      await app.close();
    };
  });

  const insertJob = async (
    status = ClassificationLeviersJobStatusEnum.DONE
  ) => {
    const [job] = await db.db
      .insert(classificationLeviersJobTable)
      .values({
        collectiviteId,
        planId: emptyPlanId,
        createdBy: editionUser.id,
        status,
        processedBatches: 2,
        totalBatches: 3,
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
    it('rend la progression et le trou du classement', async () => {
      const jobId = await insertJob();
      const status = await callerFor(
        editionUser
      ).getClassificationLeviersStatus({ jobId });

      expect({
        status: status.status,
        processedBatches: status.processedBatches,
        totalBatches: status.totalBatches,
        unclassified: status.draft?.unclassified,
      }).toEqual({
        status: 'done',
        processedBatches: 2,
        totalBatches: 3,
        unclassified: [{ ficheId: 42, reason: 'truncated' }],
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
});
