import { getAnonUser } from '@/backend/test';
import { AuthRole, AuthUser } from '@/backend/users/models/auth.models';
import { getTestRouter } from '../../test/app-utils';
import { TrpcRouter } from '../utils/trpc/trpc.router';

describe('Route de notifications', () => {
  let router: TrpcRouter;
  let anonUser: AuthUser<AuthRole.ANON>;

  beforeAll(async () => {
    router = await getTestRouter();
    anonUser = getAnonUser();
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
});
