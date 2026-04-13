import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';

type ListRequest = inferProcedureInput<
  AppRouter['collectivites']['personnes']['list']
>;

describe('PersonnesRouter', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let collectivite: Collectivite;
  let adminUser: AuthenticatedUser;
  let editionUserId: string;
  let visitorUser: AuthenticatedUser;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const testResult = await addTestCollectiviteAndUsers(db, {
      users: [
        { role: CollectiviteRole.ADMIN },
        { role: CollectiviteRole.EDITION },
      ],
    });
    collectivite = testResult.collectivite;
    adminUser = getAuthUserFromUserCredentials(testResult.users[0]);
    editionUserId = testResult.users[1].id;

    // Utilisateur sans accès à la collectivité (visiteur)
    const visitorResult = await addTestUser(db);
    visitorUser = getAuthUserFromUserCredentials(visitorResult.user);
  });

  test('list: authenticated, with empty filter', async () => {
    const caller = router.createCaller({ user: adminUser });

    const input: ListRequest = {
      collectiviteIds: [collectivite.id],
    };

    const result = await caller.collectivites.personnes.list(input);
    expect(result).toBeInstanceOf(Array);

    for (const personne of result) {
      expect(personne).toMatchObject({
        collectiviteId: collectivite.id,
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

  test('list: authenticated, without explicit access to collectivité', async () => {
    const caller = router.createCaller({ user: visitorUser });

    const input: ListRequest = {
      collectiviteIds: [collectivite.id],
    };

    const result = await caller.collectivites.personnes.list(input);
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });

  test('list: authenticated, with activeOnly = false', async () => {
    const caller = router.createCaller({ user: adminUser });

    const input: ListRequest = {
      collectiviteIds: [collectivite.id],
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
    await db.db
      .update(utilisateurCollectiviteAccessTable)
      .set({ isActive: false })
      .where(eq(utilisateurCollectiviteAccessTable.userId, editionUserId));

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
    expect(withInactives.find((p) => p.userId === editionUserId)?.active).toBe(
      false
    );

    // Reactivate user
    onTestFinished(async () => {
      await db.db
        .update(utilisateurCollectiviteAccessTable)
        .set({ isActive: true })
        .where(eq(utilisateurCollectiviteAccessTable.userId, editionUserId));
    });
  });

  test('list: not authenticated', async () => {
    const caller = router.createCaller({ user: null });

    const input: ListRequest = {
      collectiviteIds: [collectivite.id],
    };

    await expect(async () => {
      await caller.collectivites.personnes.list(input);
    }).rejects.toThrowError(/not authenticated/i);
  });
});
