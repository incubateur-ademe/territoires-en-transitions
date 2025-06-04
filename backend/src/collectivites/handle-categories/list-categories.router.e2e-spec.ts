import { inferProcedureInput } from '@trpc/server';
import { getTestRouter } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';

type Input = inferProcedureInput<
  AppRouter['collectivites']['categories']['list']
>;

describe('Route de lecture des tags catégories', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
  });

  test(`Test que la requête ne retourne que les tags personnalisés de la collectivité`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: Input = {
      collectiviteId: 1,
      withPredefinedTags: false,
    };
    const result = await caller.collectivites.categories.list(input);
    // Il n'y a pas de catégories propres à une collectivité dans le jeu de test
    expect(result.length).toBe(0);
  });

  test(`Test que la requête retourne tous les tags disponibles pour la collectivité`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: Input = {
      collectiviteId: 1,
      withPredefinedTags: true,
    };
    const result = await caller.collectivites.categories.list(input);
    expect(result.length).not.toBe(0);
  });
});
