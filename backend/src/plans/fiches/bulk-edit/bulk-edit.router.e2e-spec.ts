import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  YULU_DUDU,
} from '@/backend/test';
import { AppRouter, DatabaseService, TrpcRouter } from '@/backend/utils';
import { AuthenticatedUser } from '@/domain/auth';
import { inferProcedureInput } from '@trpc/server';
import { eq, inArray, sql } from 'drizzle-orm';
import { YOLO_DODO } from '../../../../test/auth/test-users.samples';
import { ficheActionPiloteTable } from '../models/fiche-action-pilote.table';
import {
  ficheActionTable,
  StatutsEnumType,
} from '../models/fiche-action.table';

type Input = inferProcedureInput<AppRouter['plans']['fiches']['bulkEdit']>;

const COLLECTIVITE_ID = YOLO_DODO.collectiviteId.admin;

describe('BulkEditRouter', () => {
  let router: TrpcRouter;
  let yoloDodo: AuthenticatedUser;
  let db: DatabaseService;
  let ficheIds: number[];

  function selectFiches(limit = 3) {
    return db.db
      .select()
      .from(ficheActionTable)
      .where(eq(ficheActionTable.collectiviteId, COLLECTIVITE_ID))
      .limit(limit);
  }

  function fetchFiches() {
    return db.db
      .select()
      .from(ficheActionTable)
      .where(inArray(ficheActionTable.id, ficheIds));
  }

  function createFiche({ collectiviteId }: { collectiviteId: number }) {
    return db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId,
      })
      .returning()
      .then((rows) => rows[0]);
  }

  function getFichesWithPilotes(ficheIds: number[]) {
    return db.db
      .select({
        ficheId: ficheActionPiloteTable.ficheId,
        tagIds: sql`array_remove(array_agg(${ficheActionPiloteTable.tagId}), NULL)`,
        userIds: sql`array_remove(array_agg(${ficheActionPiloteTable.userId}), NULL)`,
      })
      .from(ficheActionPiloteTable)
      .where(inArray(ficheActionPiloteTable.ficheId, ficheIds))
      .groupBy(ficheActionPiloteTable.ficheId);
  }

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);
    yoloDodo = await getAuthUser(YOLO_DODO);

    const fiches = await selectFiches();
    expect(fiches.length).toBeGreaterThan(0);

    ficheIds = fiches.map((f) => f.id);
  });

  test('authenticated, bulk edit statut', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const input1: Input = {
      ficheIds,
      statut: StatutsEnumType.EN_RETARD,
    };

    const result = await caller.plans.fiches.bulkEdit(input1);

    expect(result).toBeUndefined();

    // Verify that all fiches have been updated
    const fiches1 = await fetchFiches();
    for (const fiche of fiches1) {
      expect(fiche.statut).toBe(input1.statut);
    }

    // Change again the statut value
    const input2: Input = {
      ficheIds,
      statut: null,
    };

    await caller.plans.fiches.bulkEdit(input2);

    // Verify that all fiches have been updated
    const fiches2 = await fetchFiches();
    for (const fiche of fiches2) {
      expect(fiche.statut).toBe(input2.statut);
    }
  });

  test('authenticated, bulk edit personnePilotes', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const input = {
      ficheIds,
      pilotes: {
        add: [{ tagId: 1 }, { userId: yoloDodo.id }],
      },
    } satisfies Input;

    const result = await caller.plans.fiches.bulkEdit(input);
    expect(result).toBeUndefined();

    // Verify that all fiches have been updated with tags and users
    const fiches = await getFichesWithPilotes(ficheIds);

    for (const fiche of fiches) {
      expect(fiche.tagIds).toContain(input.pilotes.add[0].tagId);
      expect(fiche.userIds).toContain(input.pilotes.add[1].userId);
    }

    // Add again the same pilotes to check there is no conflict error
    await caller.plans.fiches.bulkEdit(input);
    expect(result).toBeUndefined();

    // Remove one pilote and add another one
    const input2 = {
      ficheIds,
      pilotes: {
        add: [{ tagId: 3 }],
        remove: [
          { tagId: input.pilotes.add[0].tagId },
          { userId: yoloDodo.id },
        ],
      },
    } satisfies Input;

    await caller.plans.fiches.bulkEdit(input2);
    expect(result).toBeUndefined();

    // Verify that all fiches have been updated with tags and users
    const updatedFiches = await getFichesWithPilotes(ficheIds);

    for (const fiche of updatedFiches) {
      expect(fiche.tagIds).toContain(input2.pilotes.add[0].tagId);

      expect(fiche.userIds).not.toContain(input.pilotes.add[1].userId);
      expect(fiche.tagIds).not.toContain(input2.pilotes.remove[0].tagId);
    }

    // Delete inserted or existing pilotes after test
    onTestFinished(async () => {
      await db.db
        .delete(ficheActionPiloteTable)
        .where(inArray(ficheActionPiloteTable.ficheId, ficheIds));
    });
  });

  test('authenticated, without access to some fiches', async () => {
    const yuluDudu = await getAuthUser(YULU_DUDU);
    const caller = router.createCaller({ user: yuluDudu });

    const newFiche = await createFiche({ collectiviteId: 4 });

    const input = {
      ficheIds: [...ficheIds, newFiche.id],
      statut: StatutsEnumType.EN_RETARD,
    };

    await expect(() =>
      caller.plans.fiches.bulkEdit(input)
    ).rejects.toThrowError(/droits insuffisants/i);
  });

  test('not authenticated', async () => {
    const caller = router.createCaller({ user: null });

    const input = {
      ficheIds,
      statut: StatutsEnumType.EN_RETARD,
    };

    await expect(() =>
      caller.plans.fiches.bulkEdit(input)
    ).rejects.toThrowError(/not authenticated/i);
  });
});
