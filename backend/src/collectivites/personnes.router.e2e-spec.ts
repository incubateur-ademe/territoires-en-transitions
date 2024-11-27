import { inferProcedureInput } from '@trpc/server';
import { getYoloDodoUser } from '../../test/auth/auth-utils';
import { getTestRouter } from '../../test/common/app-utils';
import { AuthenticatedUser } from '../auth/models/auth.models';
import { AppRouter, TrpcRouter } from '../trpc/trpc.router';

type ListRequest = inferProcedureInput<
  AppRouter['collectivites']['personnes']['list']
>;

const COLLECTIVITE_ID = 1;

describe('PersonnesRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    router = await getTestRouter();
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

});
