import { DatabaseService } from '@/backend/utils';
import { inferProcedureInput } from '@trpc/server';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { getCollectiviteIdBySiren } from '../../../test/collectivites-utils';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { referentielIdEnumSchema } from '../index-domain';

type ComputeScoreInput = inferProcedureInput<
  AppRouter['referentiels']['scores']['computeScore']
>;

describe('ScoreSnapshotsRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let rhoneAggloCollectiviteId: number;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    yoloDodoUser = await getAuthUser();
    rhoneAggloCollectiviteId = await getCollectiviteIdBySiren(
      databaseService,
      '200072015'
    );
  });

  test("Création d'un snapshot: not authenticated", async () => {
    const caller = router.createCaller({ user: null });

    const input: ComputeScoreInput = {
      referentielId: referentielIdEnumSchema.enum.cae,
      collectiviteId: 1,
      parameters: {
        snapshot: true,
        snapshotNom: 'test',
      },
    };
    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() =>
      caller.referentiels.scores.computeScore(input)
    ).rejects.toThrowError(/not authenticated/i);
  });

  test("Création d'un snapshot: not authorized, accès en lecture uniquement", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: ComputeScoreInput = {
      referentielId: referentielIdEnumSchema.enum.cae,
      collectiviteId: rhoneAggloCollectiviteId,
      parameters: {
        snapshot: true,
        snapshotNom: 'test',
      },
    };

    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() =>
      caller.referentiels.scores.computeScore(input)
    ).rejects.toThrowError(/Droits insuffisants/i);
  });

  test("Création d'un snapshot avec nom et date spécifique", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const snapshotDate = '2024-09-21T21:59:00.000Z';
    const snapshotNom = 'Test snapshot avec date';

    const input = {
      referentiel: referentielIdEnumSchema.enum.cae,
      collectiviteId: 1,
      snapshotNom,
      date: snapshotDate,
    };

    const result = await caller.referentiels.snapshots.upsert(input);

    expect(result.snapshot).toBeDefined();
    expect(result.snapshot?.nom).toBe(snapshotNom);
    expect(result.date).toBe(snapshotDate);
    expect(result.snapshot?.ref).toBe(
      `${snapshotNom.toLowerCase().replace(/\s+/g, '-')}`
    );

    // delete the snapshot
    await caller.referentiels.snapshots.delete({
      collectiviteId: 1,
      referentielId: referentielIdEnumSchema.enum.cae,
      snapshotRef: 'test-snapshot-avec-date',
    });
  });
});
