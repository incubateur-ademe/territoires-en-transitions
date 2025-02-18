import { inferProcedureInput } from '@trpc/server';
import { DateTime } from 'luxon';
import { getTestRouter } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { getCollectiviteIdBySiren } from '../../../test/collectivites-utils';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { referentielIdEnumSchema } from '../index-domain';
import { ScoreSnapshotInfoType } from '../models/get-score-snapshots.response';
import { SnapshotJalon } from './snapshot-jalon.enum';

type ComputeScoreInput = inferProcedureInput<
  AppRouter['referentiels']['scores']['computeScore']
>;

describe('ScoreSnapshotsRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let rhoneAggloCollectiviteId: number;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
    rhoneAggloCollectiviteId = await getCollectiviteIdBySiren('200072015');
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

  test("Création d'un snapshot, liste des snapshots existants suppression", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: ComputeScoreInput = {
      referentielId: referentielIdEnumSchema.enum.cae,
      collectiviteId: 1,
      parameters: {
        snapshot: true,
        snapshotNom: 'Test trpc',
        snapshotForceUpdate: true,
      },
    };

    const referentielScore = await caller.referentiels.scores.computeScore(
      input
    );
    expect(referentielScore.snapshot?.ref).toEqual('user-test-trpc');

    // get the list of snapshots
    const responseSnapshotList = await caller.referentiels.snapshots.list({
      collectiviteId: 1,
      referentielId: referentielIdEnumSchema.enum.cae,
      parameters: {
        typesJalon: [SnapshotJalon.DATE_PERSONNALISEE],
      },
    });

    const foundSnapshot = responseSnapshotList.snapshots.find(
      (snapshot) => snapshot.ref === 'user-test-trpc'
    );

    if (!foundSnapshot) {
      expect.fail();
    }

    const expectedSnapshot: ScoreSnapshotInfoType = {
      date: DateTime.fromISO(referentielScore.date).toISO() as string,
      nom: 'Test trpc',
      ref: 'user-test-trpc',
      typeJalon: SnapshotJalon.DATE_PERSONNALISEE,
      modifiedAt: referentielScore.snapshot!.modifiedAt,
      createdAt: referentielScore.snapshot!.createdAt,
      referentielVersion: '1.0.0',
      auditId: null,
      createdBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
      modifiedBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
      pointFait: 0.36,
      pointPasFait: 0.03,
      pointPotentiel: 490.9,
      pointProgramme: 0.21,
    };

    expect({
      ...foundSnapshot,
      date: DateTime.fromSQL(foundSnapshot.date).toISO() as string,
    }).toEqual(expectedSnapshot);

    // delete the snapshot
    await caller.referentiels.snapshots.delete({
      collectiviteId: 1,
      referentielId: referentielIdEnumSchema.enum.cae,
      snapshotRef: 'user-test-trpc',
    });

    // get the list of snapshots; the snapshot should not be there
    const responseSnapshotListAfterDelete =
      await caller.referentiels.snapshots.list({
        collectiviteId: 1,
        referentielId: referentielIdEnumSchema.enum.cae,
        parameters: {
          typesJalon: [SnapshotJalon.DATE_PERSONNALISEE],
        },
      });
    const foundSnapshotAfterDelete =
      responseSnapshotListAfterDelete.snapshots.find(
        (snapshot) => snapshot.ref === 'user-test-trpc'
      );
    expect(foundSnapshotAfterDelete).toBeUndefined();
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
  });
});
