import { AuthenticatedUser } from '@/backend/auth/models/auth.models';
import { getAuthUser, getTestRouter } from '@/backend/test';
import { AppRouter } from '@/backend/utils';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { inferProcedureInput } from '@trpc/server';
import { statutsEnumValues } from '../shared/models/fiche-action.table';

type Input = inferProcedureInput<AppRouter['plans']['fiches']['countByStatut']>;

describe('CountByStatutRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
  });

  test('authenticated, with empty filter', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: Input = {
      collectiviteId: 1,
      filter: {},
    };

    const result = await caller.plans.fiches.countByStatut(input);
    expect(result).toMatchObject({});

    for (const statut of statutsEnumValues) {
      expect(result[statut]).toMatchObject({
        valeur: expect.any(String),
        count: expect.any(Number),
      });
    }
  });

  test('not authenticated', async () => {
    const caller = router.createCaller({ user: null });

    const input: Input = {
      collectiviteId: 1,
      filter: {},
    };

    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() =>
      caller.plans.fiches.countByStatut(input)
    ).rejects.toThrowError(/not authenticated/i);
  });
});
