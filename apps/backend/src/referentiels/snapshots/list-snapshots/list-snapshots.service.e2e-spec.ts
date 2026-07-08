import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  CollectiviteReferentielPreferences,
  defaultCollectivitePreferences,
} from '@tet/domain/collectivites';
import { ReferentielIdEnum, SnapshotJalonEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { roundTo } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import { ReferentielsRouter } from '../../referentiels.router';

describe('ListSnapshotsService', () => {
  let app: INestApplication;
  let router: ReferentielsRouter;
  let databaseService: DatabaseService;
  let testUser: AuthenticatedUser;
  let collectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(ReferentielsRouter);
    databaseService = await getTestDatabase(app);
    const { collectivite, user } = await addTestCollectiviteAndUser(
      databaseService,
      {
        user: {
          role: CollectiviteRole.ADMIN,
        },
      }
    );
    collectiviteId = collectivite.id;
    testUser = getAuthUserFromUserCredentials(user);
  });

  afterAll(async () => {
    await app.close();
  });

  async function setReferentielPreferences(
    referentiels: CollectiviteReferentielPreferences
  ) {
    await databaseService.db
      .update(collectiviteTable)
      .set({
        preferences: {
          ...defaultCollectivitePreferences,
          referentiels,
        },
      })
      .where(eq(collectiviteTable.id, collectiviteId));
  }

  test("Création d'un snapshot, liste des snapshots existants suppression", async () => {
    const caller = router.createCaller({ user: testUser });

    const snapshot = await caller.snapshots.computeAndUpsert({
      referentielId: ReferentielIdEnum.CAE,
      collectiviteId,
      nom: 'Test trpc',
    });

    expect(snapshot.ref).toEqual('user-test-trpc');

    // get the list of snapshots
    const { snapshots } = await caller.snapshots.list({
      collectiviteId,
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
      date: expect.toEqualDate(snapshot.date),
      nom: 'Test trpc',
      ref: 'user-test-trpc',
      jalon: SnapshotJalonEnum.DATE_PERSONNALISEE,
      modifiedAt: expect.toEqualDate(snapshot.modifiedAt),
      createdAt: expect.toEqualDate(snapshot.createdAt),
      referentielVersion: snapshot.referentielVersion,
      auditId: null,
      createdBy: testUser.id,
      modifiedBy: testUser.id,
      pointFait: snapshot.pointFait,
      pointPasFait: snapshot.pointPasFait,
      pointNonRenseigne:
        roundTo(
          snapshot.pointPotentiel -
            (snapshot.pointFait +
              snapshot.pointPasFait +
              snapshot.pointProgramme),
          2
        ) || undefined,
      pointPotentiel: snapshot.pointPotentiel,
      pointProgramme: snapshot.pointProgramme,
    };

    expect(foundSnapshot).toEqual(expectedSnapshot);

    // delete the snapshot
    await caller.snapshots.delete({
      collectiviteId,
      referentielId: ReferentielIdEnum.CAE,
      snapshotRef: 'user-test-trpc',
    });

    // get the list of snapshots; the snapshot should not be there
    const responseSnapshotListAfterDelete = await caller.snapshots.list({
      collectiviteId,
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

  test('Filtre le jalon courant sur list et listWithScores quand le mode est archived', async () => {
    const caller = router.createCaller({ user: testUser });

    onTestFinished(async () => {
      await setReferentielPreferences({
        cae: { display: true, mode: 'write' },
        eci: { display: true, mode: 'write' },
        te: { display: true, mode: 'readonly' },
      });
    });

    await caller.snapshots.getCurrent({
      collectiviteId,
      referentielId: ReferentielIdEnum.CAE,
    });

    await setReferentielPreferences({
      cae: { display: false, mode: 'archived' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'write' },
    });

    const archivedList = await caller.snapshots.list({
      collectiviteId,
      referentielId: ReferentielIdEnum.CAE,
      options: {
        jalons: [
          SnapshotJalonEnum.COURANT,
          SnapshotJalonEnum.DATE_PERSONNALISEE,
        ],
      },
    });

    expect(archivedList.jalons).not.toContain(SnapshotJalonEnum.COURANT);
    expect(
      archivedList.snapshots.some(
        (snapshot) => snapshot.jalon === SnapshotJalonEnum.COURANT
      )
    ).toBe(false);

    const archivedListWithScores = await caller.snapshots.listWithScores({
      collectiviteId,
      referentielId: ReferentielIdEnum.CAE,
      options: {
        jalons: [
          SnapshotJalonEnum.COURANT,
          SnapshotJalonEnum.DATE_PERSONNALISEE,
        ],
      },
    });

    expect(
      archivedListWithScores.some(
        (snapshot) => snapshot.jalon === SnapshotJalonEnum.COURANT
      )
    ).toBe(false);

    await setReferentielPreferences({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });

    const writeModeList = await caller.snapshots.list({
      collectiviteId,
      referentielId: ReferentielIdEnum.CAE,
      options: {
        jalons: [SnapshotJalonEnum.COURANT],
      },
    });

    expect(writeModeList.jalons).toContain(SnapshotJalonEnum.COURANT);
    expect(
      writeModeList.snapshots.some(
        (snapshot) => snapshot.jalon === SnapshotJalonEnum.COURANT
      )
    ).toBe(true);
  });
});
