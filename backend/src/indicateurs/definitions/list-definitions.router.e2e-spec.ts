import { inferProcedureInput } from '@trpc/server';
import { getTestRouter } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { indicateurDefinitionDetailleeSchema } from '../index-domain';

type Input = inferProcedureInput<
  AppRouter['indicateurs']['definitions']['list']
>;

describe("Route de lecture des définitions d'indicateurs", () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
  });

  test(`Test que la requête s'exécute`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: Input = {
      collectiviteId: 1,
      identifiantsReferentiel: ['cae_1.ca'],
      //indicateurIds: [177],
    };
    const result = await caller.indicateurs.definitions.list(input);
    expect(result.length).toBe(1);
    const toCheck1 = indicateurDefinitionDetailleeSchema.safeParse(result[0]);
    expect(toCheck1.success).toBeTruthy;
  });
});
