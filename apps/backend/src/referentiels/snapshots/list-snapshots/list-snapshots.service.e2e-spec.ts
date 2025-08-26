import { ReferentielIdEnum } from '@/backend/referentiels/models/referentiel-id.enum';
import { getAuthUser, getTestApp } from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { ReferentielsRouter } from '../../referentiels.router';
import { SnapshotJalonEnum } from '../snapshot-jalon.enum';

describe('ListSnapshotsService', () => {
  let router: ReferentielsRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    const app = await getTestApp();
    router = app.get(ReferentielsRouter);
    yoloDodoUser = await getAuthUser();
  });

  test("Création d'un snapshot, liste des snapshots existants suppression", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const snapshot = await caller.snapshots.computeAndUpsert({
      referentielId: ReferentielIdEnum.CAE,
      collectiviteId: 1,
      nom: 'Test trpc',
    });

    const referentielScore = snapshot.scoresPayload;

    expect(snapshot.ref).toEqual('user-test-trpc');

    // get the list of snapshots
    const { snapshots } = await caller.snapshots.list({
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
      options: {
        jalons: [SnapshotJalonEnum.DATE_PERSONNALISEE],
      },
    });

    const foundSnapshot = snapshots.find(
      (snapshot) => snapshot.ref === 'user-test-trpc'
    );

    if (!foundSnapshot) {
      expect.fail();
    }

    const expectedSnapshot = {
      date: expect.toEqualDate(referentielScore.date),
      nom: 'Test trpc',
      ref: 'user-test-trpc',
      jalon: SnapshotJalonEnum.DATE_PERSONNALISEE,
      modifiedAt: expect.toEqualDate(snapshot.modifiedAt),
      createdAt: expect.toEqualDate(snapshot.createdAt),
      referentielVersion: '1.0.0',
      auditId: null,
      createdBy: yoloDodoUser.id,
      modifiedBy: yoloDodoUser.id,
      pointFait: 0.36,
      pointPasFait: 0.03,
      pointNonRenseigne: 492.8,
      pointPotentiel: 493.4,
      pointProgramme: 0.21,
    };

    expect(foundSnapshot).toEqual(expectedSnapshot);

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
