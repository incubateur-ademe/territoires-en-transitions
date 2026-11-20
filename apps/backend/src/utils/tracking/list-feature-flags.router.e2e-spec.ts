import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { FEATURE_FLAGS } from '@tet/domain/utils';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

describe('featureFlags.list', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let user: AuthenticatedUser;
  let collectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const databaseService = await getTestDatabase(app);

    const testData = await addTestCollectiviteAndUser(databaseService);
    user = getAuthUserFromUserCredentials(testData.user);
    collectiviteId = testData.collectivite.id;
  });

  afterAll(async () => {
    await app.close();
  });

  test('refuse un appel non authentifié', async () => {
    const caller = router.createCaller({ user: null });
    await expect(() => caller.featureFlags.list({})).rejects.toThrowError(
      /not authenticated/i
    );
  });

  test('en test, renvoie tous les flags actifs, avec ou sans collectivité', async () => {
    const caller = router.createCaller({ user });
    const allEnabled = Object.fromEntries(
      FEATURE_FLAGS.map((key) => [key, true])
    );

    expect(await caller.featureFlags.list({})).toEqual(allEnabled);
    expect(await caller.featureFlags.list({ collectiviteId })).toEqual(
      allEnabled
    );
  });
});
