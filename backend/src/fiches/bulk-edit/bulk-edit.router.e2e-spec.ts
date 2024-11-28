import DatabaseService from '@tet/backend/common/services/database.service';
import { inferProcedureInput } from '@trpc/server';
import { eq, inArray } from 'drizzle-orm';
import { getAuthUser } from '../../../test/auth/auth-utils';
import { YOLO_DODO, YULU_DUDU } from '../../../test/auth/test-users.samples';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../test/common/app-utils';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { AppRouter, TrpcRouter } from '../../trpc/trpc.router';
import {
  FicheActionStatutsEnumType,
  ficheActionTable,
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

    const input1 = {
      ficheIds,
      statut: FicheActionStatutsEnumType.EN_RETARD,
    };

    const result = await caller.plans.fiches.bulkEdit(input1);

    expect(result).toBeUndefined();

    // Verify that all fiches have been updated
    const fiches1 = await fetchFiches();
    for (const fiche of fiches1) {
      expect(fiche.statut).toBe(input1.statut);
    }

    // Change again the statut value
    const input2 = {
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

  test('authenticated, without access to some fiches', async () => {
    const yuluDudu = await getAuthUser(YULU_DUDU);
    const caller = router.createCaller({ user: yuluDudu });

    const input = {
      ficheIds,
      statut: FicheActionStatutsEnumType.EN_RETARD,
    };

    await expect(() =>
      caller.plans.fiches.bulkEdit(input)
    ).rejects.toThrowError(/not authorized/i);
  });

  test('not authenticated', async () => {
    const caller = router.createCaller({ user: null });

    const input = {
      ficheIds,
      statut: FicheActionStatutsEnumType.EN_RETARD,
    };

    await expect(() =>
      caller.plans.fiches.bulkEdit(input)
    ).rejects.toThrowError(/not authenticated/i);
  });
});
