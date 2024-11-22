import { inferProcedureInput } from '@trpc/server';
import { getYoloDodoUser } from '../../../test/auth/auth-utils';
import { getTestRouter } from '../../../test/common/app-utils';
import { User } from '../../auth/models/auth.models';
import { AppRouter, TrpcRouter } from '../../trpc/trpc.router';
import { FicheActionStatutsEnumType } from '../models/fiche-action.table';

type Input = inferProcedureInput<AppRouter['plans']['fiches']['countByStatut']>;

describe('CountByStatutRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: User;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getYoloDodoUser();
  });

  test('authenticated, with empty filter', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: Input = {
      collectiviteId: 1,
      filter: {},
    };

    const result = await caller.plans.fiches.countByStatut(input);
    expect(result).toMatchObject({});

    for (const statut of Object.values(FicheActionStatutsEnumType)) {
      expect(result[statut]).toMatchObject({
        valeur: expect.any(String),
        count: expect.any(Number),
      });
    }
  });
});
