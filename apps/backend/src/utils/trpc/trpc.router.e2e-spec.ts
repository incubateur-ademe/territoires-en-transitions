import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase } from '../../../test/app-utils';
import { getAuthUserFromUserCredentials } from '../../../test/auth-utils';
import { addTestUser } from '../../users/users/users.test-fixture';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { TrpcRouter } from './trpc.router';

describe("Route de test d'erreur", () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    const db = await getTestDatabase(app);
    const testUserResult = await addTestUser(db);
    yoloDodoUser = getAuthUserFromUserCredentials(testUserResult.user);
  });

  test(`Renvoi une erreur`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(() => caller.throwError({})).rejects.toThrowError(
      /A test trpc error occured/i
    );
  });
});
