import { INestApplication } from '@nestjs/common';
import { getTestApp } from '../../../test/app-utils';
import { getAuthUser } from '../../../test/auth-utils';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { TrpcRouter } from './trpc.router';

describe("Route de test d'erreur", () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    yoloDodoUser = await getAuthUser();
  });

  test(`Renvoi une erreur`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    await expect(() => caller.throwError({})).rejects.toThrowError(
      /A test trpc error occured/i
    );
  });
});
