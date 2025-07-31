import { utilisateurPermissionTable } from '@/backend/users/authorizations/roles/private-utilisateur-droit.table';
import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../test/app-utils';
import { getAuthUser } from '../../test/auth-utils';
import { YOLO_DODO, YULU_DUDU } from '../../test/test-users.samples';
import { AuthenticatedUser } from '../users/models/auth.models';
import { DatabaseService } from '../utils/database/database.service';
import { AppRouter, TrpcRouter } from '../utils/trpc/trpc.router';

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

  test('list: authenticated, without explicit access to collectivité', async () => {
    const yuluDudu = await getAuthUser(YULU_DUDU);
    const caller = router.createCaller({ user: yuluDudu });

    const input: ListRequest = {
      collectiviteIds: [COLLECTIVITE_ID],
    };

    const result = await caller.collectivites.personnes.list(input);
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
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
      .update(utilisateurPermissionTable)
      .set({ isActive: false })
      .where(eq(utilisateurPermissionTable.userId, user.userId));

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
        .update(utilisateurPermissionTable)
        .set({ isActive: true })
        .where(eq(utilisateurPermissionTable.userId, user.userId));
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
