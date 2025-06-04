import { getAuthUser, getTestRouter } from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { AppRouter, TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { inferProcedureInput } from '@trpc/server';
import { statutsEnumValues } from '../shared/models/fiche-action.table';

type Input = inferProcedureInput<AppRouter['plans']['fiches']['countBy']>;

describe('CountByRouter', () => {
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
      countByProperty: 'statut',
      filter: {},
    };

    const result = await caller.plans.fiches.countBy(input);
    expect(result).toMatchObject({
      countByProperty: 'statut',
    });

    for (const statut of statutsEnumValues) {
      expect(result.countByResult[statut]).toMatchObject({
        value: expect.any(String),
        count: expect.any(Number),
      });
    }
  });

  test('not authenticated', async () => {
    const caller = router.createCaller({ user: null });

    const input: Input = {
      collectiviteId: 1,
      countByProperty: 'statut',
      filter: {},
    };

    // `rejects` is necessary to handle exception in async function
    // See https://vitest.dev/api/expect.html#tothrowerror
    await expect(() => caller.plans.fiches.countBy(input)).rejects.toThrowError(
      /not authenticated/i
    );
  });
});
