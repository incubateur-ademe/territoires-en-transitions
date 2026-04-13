import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';

type Input = inferProcedureInput<
  AppRouter['collectivites']['categories']['list']
>;

describe('Route de lecture des tags catégories', () => {
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;
  let collectivite: Collectivite;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    const db = await getTestDatabase(app);

    const testResult = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = testResult.collectivite;
    authenticatedUser = getAuthUserFromUserCredentials(testResult.user);
  });

  test(`Test que la requête ne retourne que les tags personnalisés de la collectivité`, async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const input: Input = {
      collectiviteId: collectivite.id,
      withPredefinedTags: false,
    };
    const result = await caller.collectivites.categories.list(input);
    // Il n'y a pas de catégories propres à une collectivité dans le jeu de test
    expect(result.length).toBe(0);
  });

  test(`Test que la requête retourne tous les tags disponibles pour la collectivité`, async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const input: Input = {
      collectiviteId: collectivite.id,
      withPredefinedTags: true,
    };
    const result = await caller.collectivites.categories.list(input);
    expect(result.length).not.toBe(0);
  });
});
