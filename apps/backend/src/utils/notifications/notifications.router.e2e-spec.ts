import { getAnonUser, getAuthUser, getTestRouter } from '@tet/backend/test';
import {
  AuthRole,
  AuthUser,
  AuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '../trpc/trpc.router';

describe('Route de notifications', () => {
  let router: TrpcRouter;
  let anonUser: AuthUser<AuthRole.ANON>;
  let authenticatedUser: AuthenticatedUser;

  beforeAll(async () => {
    router = await getTestRouter();
    anonUser = getAnonUser();
    authenticatedUser = await getAuthUser();
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
