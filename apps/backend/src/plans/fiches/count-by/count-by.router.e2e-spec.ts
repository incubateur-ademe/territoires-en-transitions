import { INestApplication } from '@nestjs/common';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { statutEnumValues } from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';

type Input = inferProcedureInput<AppRouter['plans']['fiches']['countBy']>;

describe('CountByRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let authenticatedUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const db = await getTestDatabase(app);

    const testUserResult = await addTestUser(db, {
      collectiviteId: 1,
      role: CollectiviteRole.EDITION,
    });
    authenticatedUser = getAuthUserFromUserCredentials(testUserResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test('authenticated, with empty filter', async () => {
    const caller = router.createCaller({ user: authenticatedUser });

    const input: Input = {
      collectiviteId: 1,
      countByProperty: 'statut',
      filter: {},
    };

    const result = await caller.plans.fiches.countBy(input);
    expect(result).toMatchObject({
      countByProperty: 'statut',
    });

    for (const statut of statutEnumValues) {
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

    await expect(() => caller.plans.fiches.countBy(input)).rejects.toThrowError(
      /not authenticated/i
    );
  });
});
