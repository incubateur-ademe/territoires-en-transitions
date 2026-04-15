import { INestApplication } from '@nestjs/common';
import {
  getAnonUser,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import {
  AuthRole,
  AuthUser,
  AuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { TrpcRouter } from '../trpc/trpc.router';

describe('Route de notifications', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let anonUser: AuthUser<AuthRole.ANON>;
  let authenticatedUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    const db = await getTestDatabase(app);
    anonUser = getAnonUser();
    const testUserResult = await addTestUser(db);
    authenticatedUser = getAuthUserFromUserCredentials(testUserResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  test('Non autorisé si pas service role', async () => {
    const noUserCaller = router.createCaller({ user: null });

    await expect(async () => {
      await noUserCaller.notifications.sendPendingNotifications();
    }).rejects.toThrowError(/not service role/i);

    const anonCaller = router.createCaller({ user: anonUser });
    await expect(async () => {
      await anonCaller.notifications.sendPendingNotifications();
    }).rejects.toThrowError(/not service role/i);
  });

  test('Un utilisateur authentifié ne peut pas accéder à cette route', async () => {
    const authenticatedCaller = router.createCaller({
      user: authenticatedUser,
    });

    await expect(async () => {
      await authenticatedCaller.notifications.sendPendingNotifications();
    }).rejects.toThrowError(/not service role/i);
  });
});
