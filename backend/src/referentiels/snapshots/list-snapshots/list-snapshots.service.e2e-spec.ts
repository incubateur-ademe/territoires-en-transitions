import { getAuthUser, getTestApp } from '@/backend/test';
import { AuthenticatedUser } from '@/domain/auth';
import { ReferentielIdEnum, SnapshotJalonEnum } from '@/domain/referentiels';
import { DateTime } from 'luxon';
import { ScoreSnapshotInfoType } from '../../models/get-score-snapshots.response';
import { ReferentielsRouter } from '../../referentiels.router';

describe('ListSnapshotsService', () => {
  let router: ReferentielsRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    router = (await getTestApp()).get(ReferentielsRouter);
    yoloDodoUser = await getAuthUser();
  });

  test("Création d'un snapshot, liste des snapshots existants suppression", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const referentielScore = await caller.scores.computeScore({
      referentielId: ReferentielIdEnum.CAE,
      collectiviteId: 1,
      parameters: {
        snapshot: true,
        snapshotNom: 'Test trpc',
        snapshotForceUpdate: true,
      },
    });
    expect(referentielScore.snapshot?.ref).toEqual('user-test-trpc');

    // get the list of snapshots
    const snapshots = await caller.snapshots.list({
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
      options: {
        jalons: [SnapshotJalonEnum.DATE_PERSONNALISEE],
      },
    });

    const foundSnapshot = snapshots.snapshots.find(
      (snapshot) => snapshot.ref === 'user-test-trpc'
    );

    if (!foundSnapshot) {
      expect.fail();
    }

    const expectedSnapshot: ScoreSnapshotInfoType = {
      date: DateTime.fromISO(referentielScore.date).toISO() as string,
      nom: 'Test trpc',
      ref: 'user-test-trpc',
      typeJalon: SnapshotJalonEnum.DATE_PERSONNALISEE,
      modifiedAt: referentielScore.snapshot!.modifiedAt,
      createdAt: referentielScore.snapshot!.createdAt,
      referentielVersion: '1.0.0',
      auditId: null,
      createdBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
      modifiedBy: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
      pointFait: 0.36,
      pointPasFait: 0.03,
      pointNonRenseigne: 490.3,
      pointPotentiel: 490.9,
      pointProgramme: 0.21,
    };

    expect({
      ...foundSnapshot,
      date: DateTime.fromSQL(foundSnapshot.date).toISO() as string,
    }).toEqual(expectedSnapshot);

    // delete the snapshot
    await caller.snapshots.delete({
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
      snapshotRef: 'user-test-trpc',
    });

    // get the list of snapshots; the snapshot should not be there
    const responseSnapshotListAfterDelete = await caller.snapshots.list({
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
      options: {
        jalons: [SnapshotJalonEnum.DATE_PERSONNALISEE],
      },
    });
    const foundSnapshotAfterDelete =
      responseSnapshotListAfterDelete.snapshots.find(
        (snapshot) => snapshot.ref === 'user-test-trpc'
      );
    expect(foundSnapshotAfterDelete).toBeUndefined();
  });
});
