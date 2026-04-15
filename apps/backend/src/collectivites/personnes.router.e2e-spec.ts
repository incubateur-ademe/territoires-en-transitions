import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
} from '@tet/backend/users/users/users.test-fixture';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../test/app-utils';
import {
  getAuthUser,
  getAuthUserFromUserCredentials,
} from '../../test/auth-utils';
import { YOLO_DODO } from '../../test/test-users.samples';
import { AuthenticatedUser } from '../users/models/auth.models';
import { DatabaseService } from '../utils/database/database.service';
import { AppRouter, TrpcRouter } from '../utils/trpc/trpc.router';
import { addTestCollectiviteAndUser } from './collectivites/collectivites.test-fixture';

type ListRequest = inferProcedureInput<
  AppRouter['collectivites']['personnes']['list']
>;

const COLLECTIVITE_ID = YOLO_DODO.collectiviteId.admin;

describe('PersonnesRouter', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    yoloDodoUser = await getAuthUser(YOLO_DODO);
  });

  test('list: authenticated, with empty filter', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: ListRequest = {
      collectiviteIds: [COLLECTIVITE_ID],
    };

    const result = await caller.collectivites.personnes.list(input);
    expect(result).toBeInstanceOf(Array);

    for (const personne of result) {
      expect(personne).toMatchObject({
        collectiviteId: COLLECTIVITE_ID,
        nom: expect.any(String),
      });

      if (personne.userId) {
        expect(personne.userId.length).toBeGreaterThan(0);
        expect(personne.tagId).toBeNull();
      } else {
        expect(personne.tagId).not.toBeNull();
        expect(personne.userId).toBeNull();
      }
    }
  });

  describe('list: vérification des autorisations', () => {
    let isolatedCollectiviteId: number;
    let editorAuthUser: AuthenticatedUser;
    let outsiderAuthUser: AuthenticatedUser;
    let superAdminCandidateAuthUser: AuthenticatedUser;
    let cleanupFixtures: () => Promise<void>;

    beforeAll(async () => {
      const collectiviteAndEditor = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.EDITION },
      });
      isolatedCollectiviteId = collectiviteAndEditor.collectivite.id;
      editorAuthUser = getAuthUserFromUserCredentials(
        collectiviteAndEditor.user
      );

      const outsider = await addTestUser(db, { collectiviteId: null });
      outsiderAuthUser = getAuthUserFromUserCredentials(outsider.user);
      const superAdminCandidate = await addTestUser(db, { collectiviteId: null });
      superAdminCandidateAuthUser = getAuthUserFromUserCredentials(
        superAdminCandidate.user
      );

      cleanupFixtures = async () => {
        await outsider.cleanup();
        await superAdminCandidate.cleanup();
        await collectiviteAndEditor.cleanup();
      };
    });

    afterAll(async () => {
      await cleanupFixtures();
    });

    test('un éditeur peut lister les personnes de sa collectivité', async () => {
      const caller = router.createCaller({ user: editorAuthUser });

      const result = await caller.collectivites.personnes.list({
        collectiviteIds: [isolatedCollectiviteId],
      });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    test("un super-admin peut lister les personnes d'une collectivité sans accès direct", async () => {
      const caller = router.createCaller({ user: superAdminCandidateAuthUser });

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app: await getTestApp(),
        caller,
        userId: superAdminCandidateAuthUser.id,
      });
      onTestFinished(cleanup);

      const result = await caller.collectivites.personnes.list({
        collectiviteIds: [isolatedCollectiviteId],
      });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    test("un utilisateur vérifié peut lister les personnes sans accès direct à la collectivité", async () => {
      const caller = router.createCaller({ user: outsiderAuthUser });

      const result = await caller.collectivites.personnes.list({
        collectiviteIds: [isolatedCollectiviteId],
      });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  test('list: authenticated, with activeOnly = false', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: ListRequest = {
      collectiviteIds: [COLLECTIVITE_ID],
    };

    // Get only active users
    const activesOnly = await caller.collectivites.personnes.list(input);
    expect(activesOnly).toBeInstanceOf(Array);
    expect(activesOnly.length).toBeGreaterThan(0);

    for (const personne of activesOnly) {
      if (personne.userId) {
        expect(typeof personne.active).toBe('undefined');
      }
    }

    // Deactivate a user
    const user = activesOnly.find((p) => p.userId);
    if (!user) {
      expect.fail('No user found');
    }

    await db.db
      .update(utilisateurCollectiviteAccessTable)
      .set({ isActive: false })
      .where(eq(utilisateurCollectiviteAccessTable.userId, user.userId));

    // Then get all users, either active or inactive
    const withInactives = await caller.collectivites.personnes.list({
      ...input,
      filter: {
        activeOnly: false,
      },
    });

    expect(withInactives).toBeInstanceOf(Array);
    expect(withInactives.length).toBeGreaterThan(0);

    for (const personne of withInactives) {
      if (personne.userId) {
        expect(typeof personne.active).toBe('boolean');
      }
    }

    // Verify the inactive user appears in the list
    expect(withInactives.find((p) => p.userId === user.userId)?.active).toBe(
      false
    );

    // Reactivate user
    onTestFinished(async () => {
      await db.db
        .update(utilisateurCollectiviteAccessTable)
        .set({ isActive: true })
        .where(eq(utilisateurCollectiviteAccessTable.userId, user.userId));
    });
  });

  test('list: not authenticated', async () => {
    const caller = router.createCaller({ user: null });

    const input: ListRequest = {
      collectiviteIds: [COLLECTIVITE_ID],
    };

    await expect(async () => {
      await caller.collectivites.personnes.list(input);
    }).rejects.toThrowError(/not authenticated/i);
  });
});
