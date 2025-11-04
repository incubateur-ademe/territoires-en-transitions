import { addTestCollectiviteAndUser } from '@/backend/collectivites/collectivites/collectivites.fixture';
import { Collectivite } from '@/backend/collectivites/shared/models/collectivite.table';
import {
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
} from '@/backend/test';
import { CollectiviteAccessLevelEnum } from '@/backend/users/authorizations/roles/collectivite-access-level.enum';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { createFicheAndCleanupFunction } from '../fiches.test-fixture';

let router: TrpcRouter;
let db: DatabaseService;
let afterAllCleanup: () => Promise<void>;

let collectivite: Collectivite;
let editorUser: AuthenticatedUser;
let _testFicheId: number;

beforeAll(async () => {
  const app = await getTestApp();
  router = await app.get(TrpcRouter);
  db = await getTestDatabase(app);
  const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(db, {
    user: {
      accessLevel: CollectiviteAccessLevelEnum.ADMIN,
    },
  });
  collectivite = testCollectiviteAndUserResult.collectivite;
  editorUser = getAuthUserFromDcp(testCollectiviteAndUserResult.user);

  const caller = router.createCaller({ user: editorUser });
  const createFicheResult = await createFicheAndCleanupFunction({
    caller: caller,
    ficheInput: {
      titre: 'Fiche à supprimer',
      collectiviteId: collectivite.id,
    },
  });
  _testFicheId = createFicheResult.ficheId;

  afterAllCleanup = async () => {
    await createFicheResult.ficheCleanup();
    await testCollectiviteAndUserResult.cleanup();
  };
});

afterAll(async () => {
  await afterAllCleanup();
});

describe('Delete Fiche Action - Success Cases', () => {
  test('Successfully delete a fiche action', async () => {
    const caller = router.createCaller({ user: editorUser });

    // Create another fiche
    const { ficheId: anotherFicheId } = await createFicheAndCleanupFunction({
      caller,
      ficheInput: {
        titre: 'Fiche à supprimer 2',
        collectiviteId: collectivite.id,
      },
    });

    // Delete the fiche
    const result = await caller.plans.fiches.delete({
      ficheId: anotherFicheId,
    });

    // Verify the result
    expect(result).toEqual({ success: true });

    // Verify fiche no longer exists in database
    //caller
  });
});

/*
describe('Delete Fiche Action - Error Cases', () => {
  test('Throw NotFoundException when trying to delete a non-existing fiche', async () => {
    const caller = router.createCaller({ user: yoloDodo });
    const nonExistingFicheId = 999999;

    await expect(
      caller.delete({ ficheId: nonExistingFicheId })
    ).rejects.toThrow(
      `Fiche action non trouvée pour l'id ${nonExistingFicheId}`
    );
  });
});

describe('Delete Fiche Action - Access Rights', () => {
  test('User with admin rights on collectivite can delete fiche', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    // Create a test fiche in collectivite 1 (where yoloDodo is admin)
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Fiche test droits admin',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    // Delete should succeed
    const result = await caller.delete({ ficheId: testFicheId });
    expect(result).toEqual({ success: true });

    // Verify deletion
    const ficheAfterDeletion = await db.db
      .select()
      .from(ficheActionTable)
      .where(eq(ficheActionTable.id, testFicheId));
    expect(ficheAfterDeletion).toHaveLength(0);
  });

  test('User without rights on collectivite cannot delete fiche', async () => {
    // Youlou is an auditor with no delete rights
    const callerYoulou = router.createCaller({ user: youlou });

    // Create a test fiche in collectivite 1
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Fiche test sans droits',
        collectiviteId: COLLECTIVITE_ID,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      // Cleanup - delete with admin user
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
    });

    // Attempt to delete should fail with ForbiddenException
    await expect(callerYoulou.delete({ ficheId: testFicheId })).rejects.toThrow(
      ForbiddenException
    );
  });

  test('User with edition rights cannot delete fiche', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    // Create a test fiche in collectivite 2 (where yoloDodo only has edition rights)
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Fiche test droits édition seulement',
        collectiviteId: YOLO_DODO.collectiviteId.edition,
      })
      .returning();
    const testFicheId = fiche.id;

    onTestFinished(async () => {
      // Cleanup
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, testFicheId));
    });

    // Attempt to delete should fail (edition rights don't include delete)
    await expect(caller.delete({ ficheId: testFicheId })).rejects.toThrow(
      ForbiddenException
    );
  });
  
});

*/
