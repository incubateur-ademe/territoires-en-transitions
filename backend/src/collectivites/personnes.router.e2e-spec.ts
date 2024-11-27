import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { getYoloDodoUser } from '../../test/auth/auth-utils';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../test/common/app-utils';
import { AuthenticatedUser } from '../auth/models/auth.models';
import { utilisateurDroitTable } from '../auth/models/private-utilisateur-droit.table';
import DatabaseService from '../common/services/database.service';
import { AppRouter, TrpcRouter } from '../trpc/trpc.router';

type ListRequest = inferProcedureInput<
  AppRouter['collectivites']['personnes']['list']
>;

const COLLECTIVITE_ID = 1;

describe('PersonnesRouter', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    yoloDodoUser = await getYoloDodoUser();
  });

  test('list: authenticated, with empty filter', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: ListRequest = {
      collectiviteId: COLLECTIVITE_ID,
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

  test('list: authenticated, with activeOnly: false', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: ListRequest = {
      collectiviteId: COLLECTIVITE_ID,
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
      .update(utilisateurDroitTable)
      .set({ active: false })
      .where(eq(utilisateurDroitTable.userId, user.userId));

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
        .update(utilisateurDroitTable)
        .set({ active: true })
        .where(eq(utilisateurDroitTable.userId, user.userId));
    });
  });
});
