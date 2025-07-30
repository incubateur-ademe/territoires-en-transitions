import { libreTagTable } from '@/backend/collectivites/tags/libre-tag.table';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  YOLO_DODO,
  YULU_DUDU,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import { AppRouter, TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { inferProcedureInput } from '@trpc/server';
import { eq, inArray, sql } from 'drizzle-orm';
import { ficheActionLibreTagTable } from '../shared/models/fiche-action-libre-tag.table';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import {
  ficheActionTable,
  prioriteEnumSchema,
  statutsEnumSchema,
} from '../shared/models/fiche-action.table';

type Input = inferProcedureInput<AppRouter['plans']['fiches']['bulkEdit']>;

const COLLECTIVITE_ID = YOLO_DODO.collectiviteId.admin;

describe('BulkEditRouter', () => {
  let router: TrpcRouter;
  let yoloDodo: AuthenticatedUser;
  let db: DatabaseService;
  let ficheIds: number[];

  async function getEditableFicheIds() {
    const fiches = await Promise.all(
      Array.from({ length: 3 }, () =>
        createFiche({ collectiviteId: COLLECTIVITE_ID })
      )
    );

    return fiches.map((f) => f.id);
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

  function getFichesWithLibreTags(ficheIds: number[]) {
    return db.db
      .select({
        ficheId: ficheActionLibreTagTable.ficheId,
        libreTagIds: sql`array_remove(array_agg(${ficheActionLibreTagTable.libreTagId}), NULL)`,
      })
      .from(ficheActionLibreTagTable)
      .where(inArray(ficheActionLibreTagTable.ficheId, ficheIds))
      .groupBy(ficheActionLibreTagTable.ficheId);
  }

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);
    yoloDodo = await getAuthUser(YOLO_DODO);

    ficheIds = await getEditableFicheIds();
    expect(ficheIds.length).toBeGreaterThan(0);

    return async () => {
      await db.db
        .delete(ficheActionTable)
        .where(inArray(ficheActionTable.id, ficheIds));
    };
  });

  test('authenticated, bulk edit `statut`', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const input1: Input = {
      ficheIds,
      statut: statutsEnumSchema.enum['En retard'],
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

  test('authenticated, bulk edit `personnePilotes`', async () => {
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
      // Recreate pilotes from test data
      await db.db
        .insert(ficheActionPiloteTable)
        .values([
          { ficheId: 1, userId: null, tagId: 1 },
          { ficheId: 1, userId: yoloDodo.id, tagId: null },
          { ficheId: 2, userId: null, tagId: 1 },
          { ficheId: 3, userId: null, tagId: 3 },
          { ficheId: 4, userId: null, tagId: 3 },
        ])
        .onConflictDoNothing();
    });
  });

  test('authenticated, bulk edit `libreTags`', async () => {
    function createLibreTagIds() {
      return db.db
        .insert(libreTagTable)
        .values([
          {
            collectiviteId: COLLECTIVITE_ID,
            nom: 'tag-1',
          },
          {
            collectiviteId: COLLECTIVITE_ID,
            nom: 'tag-2',
          },
        ])
        .returning()
        .then((tags) => tags.map((tag) => tag.id));
    }

    const caller = router.createCaller({ user: yoloDodo });
    const tagIds = await createLibreTagIds();

    const input = {
      ficheIds,
      libreTags: {
        add: [{ id: tagIds[0] }],
      },
    } satisfies Input;

    const result = await caller.plans.fiches.bulkEdit(input);
    expect(result).toBeUndefined();

    // Verify that all fiches have been updated with libreTags
    const fiches = await getFichesWithLibreTags(ficheIds);

    for (const fiche of fiches) {
      expect(fiche.libreTagIds).toContain(input.libreTags.add[0].id);
    }

    // Add again the same libreTags to check there is no conflict error
    await caller.plans.fiches.bulkEdit(input);
    expect(result).toBeUndefined();

    // Remove one pilote and add another one
    const input2 = {
      ficheIds,
      libreTags: {
        add: [{ id: tagIds[1] }],
        remove: [{ id: input.libreTags.add[0].id }],
      },
    } satisfies Input;

    await caller.plans.fiches.bulkEdit(input2);
    expect(result).toBeUndefined();

    // Verify that all fiches have been updated with libreTags
    const updatedFiches = await getFichesWithLibreTags(ficheIds);

    for (const fiche of updatedFiches) {
      expect(fiche.libreTagIds).toContain(input2.libreTags.add[0].id);
      expect(fiche.libreTagIds).not.toContain(input.libreTags.add[0].id);
    }

    // Delete inserted or existing pilotes after test
    onTestFinished(async () => {
      await db.db
        .delete(ficheActionLibreTagTable)
        .where(inArray(ficheActionLibreTagTable.ficheId, ficheIds));

      await db.db
        .delete(libreTagTable)
        .where(inArray(libreTagTable.id, tagIds));
    });
  });

  test('authenticated, bulk edit `priorite`', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const input1: Input = {
      ficheIds,
      priorite: prioriteEnumSchema.enum.Élevé,
    };

    const result = await caller.plans.fiches.bulkEdit(input1);
    expect(result).toBeUndefined();

    // Verify that all fiches have been updated
    const fiches1 = await fetchFiches();
    for (const fiche of fiches1) {
      expect(fiche.priorite).toBe(input1.priorite);
    }

    // Change again the statut value
    const input2: Input = {
      ficheIds,
      priorite: null,
    };

    await caller.plans.fiches.bulkEdit(input2);

    // Verify that all fiches have been updated
    const fiches2 = await fetchFiches();
    for (const fiche of fiches2) {
      expect(fiche.priorite).toBe(input2.priorite);
    }
  });

  test('authenticated, bulk edit `dateFin`', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const input1 = {
      ficheIds,
      dateFin: '2024-12-25',
    } satisfies Input;

    const result = await caller.plans.fiches.bulkEdit(input1);
    expect(result).toBeUndefined();

    // Verify that all fiches have been updated
    const fiches1 = await fetchFiches();
    for (const fiche of fiches1) {
      expect(new Date(fiche.dateFin as string)).toEqual(
        new Date(input1.dateFin)
      );
    }

    // Change again the statut value
    const input2: Input = {
      ficheIds,
      dateFin: null,
    };

    await caller.plans.fiches.bulkEdit(input2);

    // Verify that all fiches have been updated
    const fiches2 = await fetchFiches();
    for (const fiche of fiches2) {
      expect(fiche.dateFin).toBe(input2.dateFin);
    }
  });

  test('authenticated, bulk edit `ameliorationContinue`', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const input1: Input = {
      ficheIds,
      ameliorationContinue: true,
    };

    const result = await caller.plans.fiches.bulkEdit(input1);
    expect(result).toBeUndefined();

    // Verify that all fiches have been updated
    const fiches1 = await fetchFiches();
    for (const fiche of fiches1) {
      expect(fiche.ameliorationContinue).toBe(input1.ameliorationContinue);
    }

    // Change again the statut value
    const input2: Input = {
      ficheIds,
      ameliorationContinue: null,
    };

    await caller.plans.fiches.bulkEdit(input2);

    // Verify that all fiches have been updated
    const fiches2 = await fetchFiches();
    for (const fiche of fiches2) {
      expect(fiche.ameliorationContinue).toBe(input2.ameliorationContinue);
    }
  });

  test('authenticated, without access to some fiches', async () => {
    const yuluDudu = await getAuthUser(YULU_DUDU);
    const caller = router.createCaller({ user: yuluDudu });

    const newFiche = await createFiche({ collectiviteId: 4 });

    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, newFiche.id));
    });

    const input = {
      ficheIds: [...ficheIds, newFiche.id],
      statut: statutsEnumSchema.enum['En retard'],
    };

    await expect(() =>
      caller.plans.fiches.bulkEdit(input)
    ).rejects.toThrowError(/droits insuffisants/i);
  });

  test('not authenticated', async () => {
    const caller = router.createCaller({ user: null });

    const input = {
      ficheIds,
      statut: statutsEnumSchema.Enum['En retard'],
    };

    await expect(() =>
      caller.plans.fiches.bulkEdit(input)
    ).rejects.toThrowError(/not authenticated/i);
  });
});
